export interface ProctorSession {
  id: string;
  userId: string;
  externalCallId: string;
  callPlatform: 'zoom' | 'meet' | 'teams' | 'other';
  status: 'active' | 'paused' | 'ended' | 'recording';
  startTime: Date;
  endTime?: Date;
  recordingPaths: {
    video?: string;
    audio?: string;
    screen?: string;
  };
  metadata: {
    userAgent: string;
    platform: string;
    resolution: string;
  };
}

export interface CallMonitoringData {
  sessionId: string;
  timestamp: Date;
  gazeData?: GazeTrackingData;
  audioData?: AudioAnalysisData;
  suspiciousActivity?: SuspiciousActivity[];
}

export interface GazeTrackingData {
  x: number;
  y: number;
  confidence: number;
  lookingAway: boolean;
  duration: number;
}

export interface AudioAnalysisData {
  volume: number;
  frequency: number[];
  multipleVoices: boolean;
  backgroundNoise: number;
}

export interface SuspiciousActivity {
  type: 'gaze_away' | 'multiple_voices' | 'window_switch' | 'face_not_detected';
  severity: 'low' | 'medium' | 'high';
  timestamp: Date;
  description: string;
  confidence: number;
}

export interface ExternalCallWebhook {
  platform: string;
  callId: string;
  eventType: 'call_started' | 'call_ended' | 'participant_joined' | 'participant_left';
  participants: CallParticipant[];
  timestamp: Date;
}

export interface CallParticipant {
  id: string;
  name: string;
  email?: string;
  role: 'host' | 'participant' | 'proctored_user';
}

export interface VideoProcessingJob {
  id: string;
  sessionId: string;
  filePath: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  results?: any;
}

export interface TranscriptPlaceholder {
  sessionId: string;
  content: string; // Placeholder for future transcription
  timestamp: Date;
  speaker?: string;
}
