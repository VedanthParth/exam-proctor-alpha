import mongoose, { Schema, Document } from 'mongoose';
import { ProctorSession, CallMonitoringData, VideoProcessingJob } from '../types';

export interface IProctorSession extends Omit<ProctorSession, 'id'>, Document {
  sessionId: string;
}
export interface ICallMonitoringData extends CallMonitoringData, Document {}
export interface IVideoProcessingJob extends Omit<VideoProcessingJob, 'id'>, Document {
  jobId: string;
}

const ProctorSessionSchema = new Schema<IProctorSession>({
  sessionId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  externalCallId: { type: String, required: true },
  callPlatform: { 
    type: String, 
    required: true, 
    enum: ['zoom', 'meet', 'teams', 'other'] 
  },
  status: { 
    type: String, 
    required: true, 
    enum: ['active', 'paused', 'ended', 'recording'],
    default: 'active'
  },
  startTime: { type: Date, required: true, default: Date.now },
  endTime: { type: Date },
  recordingPaths: {
    video: { type: String },
    audio: { type: String },
    screen: { type: String }
  },
  metadata: {
    userAgent: { type: String },
    platform: { type: String },
    resolution: { type: String }
  }
}, {
  timestamps: true
});

const CallMonitoringDataSchema = new Schema<ICallMonitoringData>({
  sessionId: { type: String, required: true, ref: 'ProctorSession' },
  timestamp: { type: Date, required: true, default: Date.now },
  gazeData: {
    x: { type: Number },
    y: { type: Number },
    confidence: { type: Number },
    lookingAway: { type: Boolean },
    duration: { type: Number }
  },
  audioData: {
    volume: { type: Number },
    frequency: [{ type: Number }],
    multipleVoices: { type: Boolean },
    backgroundNoise: { type: Number }
  },
  suspiciousActivity: [{
    type: { 
      type: String, 
      enum: ['gaze_away', 'multiple_voices', 'window_switch', 'face_not_detected'] 
    },
    severity: { 
      type: String, 
      enum: ['low', 'medium', 'high'] 
    },
    timestamp: { type: Date },
    description: { type: String },
    confidence: { type: Number }
  }]
}, {
  timestamps: true
});

const VideoProcessingJobSchema = new Schema<IVideoProcessingJob>({
  jobId: { type: String, required: true, unique: true },
  sessionId: { type: String, required: true, ref: 'ProctorSession' },
  filePath: { type: String, required: true },
  status: { 
    type: String, 
    required: true, 
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  createdAt: { type: Date, required: true, default: Date.now },
  completedAt: { type: Date },
  results: { type: Schema.Types.Mixed }
}, {
  timestamps: true
});

export const ProctorSessionModel = mongoose.model<IProctorSession>('ProctorSession', ProctorSessionSchema);
export const CallMonitoringDataModel = mongoose.model<ICallMonitoringData>('CallMonitoringData', CallMonitoringDataSchema);
export const VideoProcessingJobModel = mongoose.model<IVideoProcessingJob>('VideoProcessingJob', VideoProcessingJobSchema);
