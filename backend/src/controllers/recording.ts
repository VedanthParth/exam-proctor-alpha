import { Request, Response } from 'express';
import { AuthUtil } from '../utils/auth';
import { recordingService } from '../services/recording';
import { externalCallMonitoringService } from '../services/externalCallMonitoring';
import { ProctorSessionModel } from '../models';

export class RecordingController {
  
  async uploadRecording(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !AuthUtil.authenticate(authHeader)) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      
      const { sessionId, recordingType } = req.body;
      const file = req.file;
      
      if (!sessionId || !recordingType || !file) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }
      
      if (!['video', 'audio', 'screen'].includes(recordingType)) {
        res.status(400).json({ error: 'Invalid recording type' });
        return;
      }
      
      // Check if session exists
      const session = await externalCallMonitoringService.getSessionStatus(sessionId);
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }
      
      // Save recording
      const filePath = await recordingService.saveRecording(
        sessionId,
        file.buffer,
        recordingType as 'video' | 'audio' | 'screen',
        file.originalname
      );
      
      // Update session with recording path
      const updateData: any = {};
      updateData[`recordingPaths.${recordingType}`] = filePath;
      
      await ProctorSessionModel.findOneAndUpdate(
        { sessionId },
        updateData
      );
      
      // If it's a video, process it to extract separate video and audio
      if (recordingType === 'video') {
        try {
          const processedFiles = await recordingService.processVideoRecording(filePath, sessionId);
          
          // Update session with processed file paths
          await ProctorSessionModel.findOneAndUpdate(
            { sessionId },
            {
              'recordingPaths.video': processedFiles.videoPath,
              'recordingPaths.audio': processedFiles.audioPath
            }
          );
          
          res.status(200).json({
            success: true,
            message: 'Recording uploaded and processed successfully',
            files: {
              original: filePath,
              video: processedFiles.videoPath,
              audio: processedFiles.audioPath
            }
          });
        } catch (processError) {
          console.error('Error processing video:', processError);
          res.status(200).json({
            success: true,
            message: 'Recording uploaded but processing failed',
            file: filePath,
            warning: 'Video processing failed'
          });
        }
      } else {
        res.status(200).json({
          success: true,
          message: 'Recording uploaded successfully',
          file: filePath
        });
      }
      
    } catch (error) {
      console.error('Error uploading recording:', error);
      res.status(500).json({ error: 'Failed to upload recording' });
    }
  }
  
  async getRecording(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !AuthUtil.authenticate(authHeader)) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      
      const { sessionId, recordingType } = req.params;
      
      if (!sessionId || !recordingType) {
        res.status(400).json({ error: 'Session ID and recording type required' });
        return;
      }
      
      // Find session and get recording path
      const sessionDoc = await ProctorSessionModel.findOne({ sessionId });
      if (!sessionDoc) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }
      
      const recordingPath = sessionDoc.recordingPaths[recordingType as keyof typeof sessionDoc.recordingPaths];
      if (!recordingPath) {
        res.status(404).json({ error: 'Recording not found' });
        return;
      }
      
      try {
        const recordingData = await recordingService.getRecording(recordingPath);
        
        // Set appropriate content type
        const contentType = this.getContentType(recordingType);
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `inline; filename="${sessionId}_${recordingType}"`);
        
        res.send(recordingData);
        
      } catch (fileError) {
        res.status(404).json({ error: 'Recording file not found' });
      }
      
    } catch (error) {
      console.error('Error getting recording:', error);
      res.status(500).json({ error: 'Failed to get recording' });
    }
  }
  
  async getRecordingInfo(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !AuthUtil.authenticate(authHeader)) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      
      const { sessionId } = req.params;
      
      if (!sessionId) {
        res.status(400).json({ error: 'Session ID required' });
        return;
      }
      
      const sessionDoc = await ProctorSessionModel.findOne({ sessionId });
      if (!sessionDoc) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }
      
      const recordingInfo: any = {
        sessionId,
        recordings: {}
      };
      
      // Get info for each recording type
      for (const [type, path] of Object.entries(sessionDoc.recordingPaths)) {
        if (path) {
          try {
            const info = await recordingService.getRecordingInfo(path);
            recordingInfo.recordings[type] = {
              path,
              ...info
            };
          } catch (error) {
            recordingInfo.recordings[type] = {
              path,
              error: 'Could not read file info'
            };
          }
        }
      }
      
      res.status(200).json({
        success: true,
        ...recordingInfo
      });
      
    } catch (error) {
      console.error('Error getting recording info:', error);
      res.status(500).json({ error: 'Failed to get recording info' });
    }
  }
  
  async deleteRecording(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !AuthUtil.authenticate(authHeader)) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      
      const { sessionId, recordingType } = req.params;
      
      if (!sessionId || !recordingType) {
        res.status(400).json({ error: 'Session ID and recording type required' });
        return;
      }
      
      const sessionDoc = await ProctorSessionModel.findOne({ sessionId });
      if (!sessionDoc) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }
      
      const recordingPath = sessionDoc.recordingPaths[recordingType as keyof typeof sessionDoc.recordingPaths];
      if (!recordingPath) {
        res.status(404).json({ error: 'Recording not found' });
        return;
      }
      
      // Delete the file
      await recordingService.deleteRecording(recordingPath);
      
      // Update database
      const updateData: any = {};
      updateData[`recordingPaths.${recordingType}`] = null;
      
      await ProctorSessionModel.findOneAndUpdate(
        { sessionId },
        { $unset: updateData }
      );
      
      res.status(200).json({
        success: true,
        message: 'Recording deleted successfully'
      });
      
    } catch (error) {
      console.error('Error deleting recording:', error);
      res.status(500).json({ error: 'Failed to delete recording' });
    }
  }
  
  private getContentType(recordingType: string): string {
    switch (recordingType) {
      case 'video':
      case 'screen':
        return 'video/mp4';
      case 'audio':
        return 'audio/wav';
      default:
        return 'application/octet-stream';
    }
  }
}

export const recordingController = new RecordingController();
