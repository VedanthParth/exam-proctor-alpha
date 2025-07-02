import { v4 as uuidv4 } from 'uuid';
import { ProctorSessionModel, CallMonitoringDataModel } from '../models';
import { ProctorSession, CallMonitoringData, GazeTrackingData, AudioAnalysisData } from '../types';

export class ExternalCallMonitoringService {
  private activeSessions: Map<string, ProctorSession> = new Map();
  
  constructor() {
    console.log('External Call Monitoring Service initialized');
  }
  
  async startProctoring(
    userId: string, 
    externalCallId: string, 
    callPlatform: 'zoom' | 'meet' | 'teams' | 'other',
    metadata: any
  ): Promise<ProctorSession> {
    const sessionId = uuidv4();
    
    const session: ProctorSession = {
      id: sessionId,
      userId,
      externalCallId,
      callPlatform,
      status: 'active',
      startTime: new Date(),
      recordingPaths: {},
      metadata
    };
    
    // Save to database
    const sessionDoc = new ProctorSessionModel({
      sessionId: session.id,
      userId: session.userId,
      externalCallId: session.externalCallId,
      callPlatform: session.callPlatform,
      status: session.status,
      startTime: session.startTime,
      recordingPaths: session.recordingPaths,
      metadata: session.metadata
    });
    
    await sessionDoc.save();
    
    // Store in memory for quick access
    this.activeSessions.set(sessionId, session);
    
    console.log(`Started proctoring session ${sessionId} for user ${userId}`);
    return session;
  }
  
  async endProctoring(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    
    session.status = 'ended';
    session.endTime = new Date();
    
    // Update database
    await ProctorSessionModel.findOneAndUpdate(
      { sessionId },
      { 
        status: 'ended', 
        endTime: session.endTime 
      }
    );
    
    // Remove from active sessions
    this.activeSessions.delete(sessionId);
    
    console.log(`Ended proctoring session ${sessionId}`);
  }
  
  async recordMonitoringData(
    sessionId: string,
    gazeData?: GazeTrackingData,
    audioData?: AudioAnalysisData
  ): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    
    const monitoringData: CallMonitoringData = {
      sessionId,
      timestamp: new Date(),
      gazeData,
      audioData,
      suspiciousActivity: []
    };
    
    // Analyze for suspicious activity
    if (gazeData?.lookingAway && gazeData.duration > 5000) {
      monitoringData.suspiciousActivity?.push({
        type: 'gaze_away',
        severity: 'medium',
        timestamp: new Date(),
        description: `User looked away for ${gazeData.duration}ms`,
        confidence: gazeData.confidence
      });
    }
    
    if (audioData?.multipleVoices) {
      monitoringData.suspiciousActivity?.push({
        type: 'multiple_voices',
        severity: 'high',
        timestamp: new Date(),
        description: 'Multiple voices detected in audio',
        confidence: 0.8
      });
    }
    
    // Save to database
    const monitoringDoc = new CallMonitoringDataModel(monitoringData);
    await monitoringDoc.save();
    
    console.log(`Recorded monitoring data for session ${sessionId}`);
  }
  
  async getSessionStatus(sessionId: string): Promise<ProctorSession | null> {
    return this.activeSessions.get(sessionId) || null;
  }
  
  async getAllActiveSessions(): Promise<ProctorSession[]> {
    return Array.from(this.activeSessions.values());
  }
  
  async getSessionHistory(userId: string): Promise<ProctorSession[]> {
    const sessions = await ProctorSessionModel.find({ userId }).lean();
    return sessions.map(session => ({
      id: session.sessionId,
      userId: session.userId,
      externalCallId: session.externalCallId,
      callPlatform: session.callPlatform,
      status: session.status,
      startTime: session.startTime,
      endTime: session.endTime,
      recordingPaths: session.recordingPaths,
      metadata: session.metadata
    }));
  }
}

export const externalCallMonitoringService = new ExternalCallMonitoringService();
