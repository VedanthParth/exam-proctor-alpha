import { Request, Response } from 'express';
import { AuthUtil } from '../utils/auth';
import { externalCallMonitoringService } from '../services/externalCallMonitoring';
import { gazeTrackingService } from '../services/gazeTracking';
import { audioAnalysisService } from '../services/audioAnalysis';

export class ProctorSessionController {
  
  startSession = async (req: Request, res: Response): Promise<void> => {
    try {
      // Authentication check
      const authHeader = req.headers.authorization;
      console.log('Received auth header:', authHeader);
      console.log('Expected API key:', process.env.API_KEY);
      
      if (!authHeader || !AuthUtil.authenticate(authHeader)) {
        console.log('Authentication failed');
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      
      const { userId, externalCallId, callPlatform, metadata } = req.body;
      
      if (!userId || !externalCallId || !callPlatform) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }
      
      const session = await externalCallMonitoringService.startProctoring(
        userId,
        externalCallId,
        callPlatform,
        metadata || {}
      );
      
      // Start gaze tracking for this session
      gazeTrackingService.startTracking(session.id, async (gazeData) => {
        await externalCallMonitoringService.recordMonitoringData(
          session.id,
          gazeData
        );
      });
      
      // Start audio analysis
      audioAnalysisService.startRealTimeAnalysis(async (audioData) => {
        await externalCallMonitoringService.recordMonitoringData(
          session.id,
          undefined,
          audioData
        );
      });
      
      res.status(200).json({
        success: true,
        session: {
          id: session.id,
          status: session.status,
          startTime: session.startTime,
          callPlatform: session.callPlatform
        }
      });
      
    } catch (error) {
      console.error('Error starting session:', error);
      res.status(500).json({ error: 'Failed to start proctoring session' });
    }
  }
  
  endSession = async (req: Request, res: Response): Promise<void> => {
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
      
      await externalCallMonitoringService.endProctoring(sessionId);
      
      // Stop tracking services
      gazeTrackingService.stopTracking();
      audioAnalysisService.stopRealTimeAnalysis();
      
      res.status(200).json({
        success: true,
        message: 'Proctoring session ended'
      });
      
    } catch (error) {
      console.error('Error ending session:', error);
      res.status(500).json({ error: 'Failed to end proctoring session' });
    }
  }
  
  getSessionStatus = async (req: Request, res: Response): Promise<void> => {
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
      
      const session = await externalCallMonitoringService.getSessionStatus(sessionId);
      
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }
      
      res.status(200).json({
        success: true,
        session
      });
      
    } catch (error) {
      console.error('Error getting session status:', error);
      res.status(500).json({ error: 'Failed to get session status' });
    }
  }
  
  getActiveSessions = async (req: Request, res: Response): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !AuthUtil.authenticate(authHeader)) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      
      const sessions = await externalCallMonitoringService.getAllActiveSessions();
      
      res.status(200).json({
        success: true,
        sessions,
        count: sessions.length
      });
      
    } catch (error) {
      console.error('Error getting active sessions:', error);
      res.status(500).json({ error: 'Failed to get active sessions' });
    }
  }
  
  getSessionHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !AuthUtil.authenticate(authHeader)) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      
      const { userId } = req.params;
      
      if (!userId) {
        res.status(400).json({ error: 'User ID required' });
        return;
      }
      
      const sessions = await externalCallMonitoringService.getSessionHistory(userId);
      
      res.status(200).json({
        success: true,
        sessions,
        count: sessions.length
      });
      
    } catch (error) {
      console.error('Error getting session history:', error);
      res.status(500).json({ error: 'Failed to get session history' });
    }
  }
}

export const proctorSessionController = new ProctorSessionController();
