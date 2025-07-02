import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs/promises';

// Import routes
import proctorSessionRoutes from './routes/proctorSession';
import recordingRoutes from './routes/recording';

// Import services
import { externalCallMonitoringService } from './services/externalCallMonitoring';
import { gazeTrackingService } from './services/gazeTracking';
import { audioAnalysisService } from './services/audioAnalysis';

// Load environment variables
dotenv.config();

class ExamProctorServer {
  private app: express.Application;
  private server: any;
  private io: SocketIOServer;
  private port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3000');
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeDatabase();
    this.initializeWebSocket();
    this.createUploadsDir();
  }

  private initializeMiddleware(): void {
    // CORS configuration
    this.app.use(cors({
      origin: process.env.NODE_ENV === 'production' ? 'https://localhost:3001' : '*',
      credentials: true
    }));

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
      next();
    });
  }

  private initializeRoutes(): void {
    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'Exam Proctor API'
      });
    });

    // API routes
    this.app.use('/api/sessions', proctorSessionRoutes);
    this.app.use('/api/recordings', recordingRoutes);

    // Webhook endpoint for external call platforms
    this.app.post('/webhook/external-call', this.handleExternalCallWebhook);

    // Error handling middleware
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      console.error('Error:', err);
      res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
      });
    });

    // 404 handler
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not found',
        message: `Route ${req.originalUrl} not found`
      });
    });
  }

  private async initializeDatabase(): Promise<void> {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/exam_proctor';
      await mongoose.connect(mongoUri);
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      process.exit(1);
    }
  }

  private initializeWebSocket(): void {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Handle session monitoring
      socket.on('join-session', (sessionId: string) => {
        socket.join(`session-${sessionId}`);
        console.log(`Client ${socket.id} joined session ${sessionId}`);
      });

      // Handle real-time monitoring data
      socket.on('monitoring-data', async (data) => {
        try {
          const { sessionId, gazeData, audioData } = data;
          
          // Process and store monitoring data
          await externalCallMonitoringService.recordMonitoringData(
            sessionId,
            gazeData,
            audioData
          );

          // Broadcast to other clients in the same session
          socket.to(`session-${sessionId}`).emit('monitoring-update', data);
        } catch (error) {
          console.error('Error processing monitoring data:', error);
        }
      });

      // Handle external call events
      socket.on('external-call-event', (eventData) => {
        console.log('External call event received:', eventData);
        
        // Broadcast to all clients
        this.io.emit('call-event', eventData);
      });

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });
  }

  private async createUploadsDir(): Promise<void> {
    try {
      await fs.mkdir('./uploads/recordings', { recursive: true });
      console.log('Uploads directory created/verified');
    } catch (error) {
      console.error('Error creating uploads directory:', error);
    }
  }

  private handleExternalCallWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      const webhookData = req.body;
      console.log('External call webhook received:', webhookData);

      // Process webhook data based on platform
      const { platform, callId, eventType, participants } = webhookData;

      // Emit event to connected clients
      this.io.emit('external-call-webhook', {
        platform,
        callId,
        eventType,
        participants,
        timestamp: new Date()
      });

      // Handle different event types
      switch (eventType) {
        case 'call_started':
          console.log(`Call started on ${platform}: ${callId}`);
          break;
        case 'call_ended':
          console.log(`Call ended on ${platform}: ${callId}`);
          break;
        case 'participant_joined':
          console.log(`Participant joined call ${callId}`);
          break;
        case 'participant_left':
          console.log(`Participant left call ${callId}`);
          break;
      }

      res.status(200).json({ success: true, message: 'Webhook processed' });
    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).json({ error: 'Failed to process webhook' });
    }
  };

  public start(): void {
    this.server.listen(this.port, () => {
      console.log(`
🚀 Exam Proctor Server Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 Server: http://localhost:${this.port}
🔄 WebSocket: ws://localhost:${this.port}
🗄️  Database: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/exam_proctor'}
📁 Uploads: ./uploads/recordings
🔧 Environment: ${process.env.NODE_ENV || 'development'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 API Endpoints:
   • POST   /api/sessions/start
   • POST   /api/sessions/:sessionId/end
   • GET    /api/sessions/:sessionId/status
   • GET    /api/sessions/active
   • GET    /api/sessions/history/:userId
   • POST   /api/recordings/upload
   • GET    /api/recordings/:sessionId/:recordingType
   • GET    /api/recordings/:sessionId/info
   • DELETE /api/recordings/:sessionId/:recordingType

🔗 Webhooks:
   • POST   /webhook/external-call

Ready to monitor external calls! 👁️‍🗨️
      `);
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down gracefully...');
      
      // Stop tracking services
      gazeTrackingService.stopTracking();
      audioAnalysisService.stopRealTimeAnalysis();
      
      // Close database connection
      await mongoose.connection.close();
      
      // Close server
      this.server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });
  }
}

// Start the server
const server = new ExamProctorServer();
server.start();
