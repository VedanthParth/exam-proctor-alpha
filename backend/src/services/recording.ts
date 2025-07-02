import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import ffmpeg from 'fluent-ffmpeg';

export class RecordingService {
  private recordingsPath: string;
  
  constructor() {
    this.recordingsPath = process.env.UPLOAD_PATH || './uploads/recordings';
    this.ensureDirectoryExists();
    console.log('Recording Service initialized');
  }
  
  private ensureDirectoryExists(): void {
    if (!fs.existsSync(this.recordingsPath)) {
      fs.mkdirSync(this.recordingsPath, { recursive: true });
    }
  }
  
  async saveRecording(
    sessionId: string,
    recordingData: Buffer,
    type: 'video' | 'audio' | 'screen',
    originalName?: string
  ): Promise<string> {
    const fileExtension = this.getFileExtension(type, originalName);
    const fileName = `${sessionId}_${type}_${uuidv4()}${fileExtension}`;
    const filePath = path.join(this.recordingsPath, fileName);
    
    try {
      await fs.promises.writeFile(filePath, recordingData);
      console.log(`Saved ${type} recording: ${fileName}`);
      return filePath;
    } catch (error) {
      console.error(`Error saving ${type} recording:`, error);
      throw new Error(`Failed to save ${type} recording`);
    }
  }
  
  async processVideoRecording(
    inputPath: string,
    sessionId: string
  ): Promise<{ videoPath: string; audioPath: string }> {
    const videoOutputPath = path.join(
      this.recordingsPath,
      `${sessionId}_processed_video_${uuidv4()}.mp4`
    );
    const audioOutputPath = path.join(
      this.recordingsPath,
      `${sessionId}_extracted_audio_${uuidv4()}.wav`
    );
    
    try {
      // Process video and extract audio
      await Promise.all([
        this.processVideo(inputPath, videoOutputPath),
        this.extractAudio(inputPath, audioOutputPath)
      ]);
      
      console.log(`Processed video recording for session ${sessionId}`);
      return {
        videoPath: videoOutputPath,
        audioPath: audioOutputPath
      };
    } catch (error) {
      console.error('Error processing video recording:', error);
      throw new Error('Failed to process video recording');
    }
  }
  
  private processVideo(inputPath: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .size('1280x720') // Standardize resolution
        .fps(30)
        .videoBitrate('1000k')
        .audioBitrate('128k')
        .output(outputPath)
        .on('end', () => {
          console.log('Video processing completed');
          resolve();
        })
        .on('error', (error) => {
          console.error('Video processing error:', error);
          reject(error);
        })
        .run();
    });
  }
  
  private extractAudio(inputPath: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .audioCodec('pcm_s16le')
        .audioFrequency(44100)
        .audioChannels(2)
        .format('wav')
        .output(outputPath)
        .on('end', () => {
          console.log('Audio extraction completed');
          resolve();
        })
        .on('error', (error) => {
          console.error('Audio extraction error:', error);
          reject(error);
        })
        .run();
    });
  }
  
  async getRecording(filePath: string): Promise<Buffer> {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error('Recording file not found');
      }
      
      return await fs.promises.readFile(filePath);
    } catch (error) {
      console.error('Error reading recording:', error);
      throw new Error('Failed to read recording file');
    }
  }
  
  async deleteRecording(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        console.log(`Deleted recording: ${filePath}`);
      }
    } catch (error) {
      console.error('Error deleting recording:', error);
      throw new Error('Failed to delete recording');
    }
  }
  
  async getRecordingInfo(filePath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (error, metadata) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            duration: metadata.format.duration,
            size: metadata.format.size,
            bitRate: metadata.format.bit_rate,
            streams: metadata.streams.map(stream => ({
              codecType: stream.codec_type,
              codecName: stream.codec_name,
              duration: stream.duration,
              bitRate: stream.bit_rate
            }))
          });
        }
      });
    });
  }
  
  private getFileExtension(type: 'video' | 'audio' | 'screen', originalName?: string): string {
    if (originalName) {
      return path.extname(originalName);
    }
    
    switch (type) {
      case 'video':
      case 'screen':
        return '.webm';
      case 'audio':
        return '.wav';
      default:
        return '.bin';
    }
  }
}

export const recordingService = new RecordingService();
