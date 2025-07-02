"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const promises_1 = __importDefault(require("fs/promises"));
// Import routes
const proctorSession_1 = __importDefault(require("./routes/proctorSession"));
const recording_1 = __importDefault(require("./routes/recording"));
// Import services
const externalCallMonitoring_1 = require("./services/externalCallMonitoring");
const gazeTracking_1 = require("./services/gazeTracking");
const audioAnalysis_1 = require("./services/audioAnalysis");
// Load environment variables
dotenv_1.default.config();
class ExamProctorServer {
    constructor() {
        this.handleExternalCallWebhook = async (req, res) => {
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
            }
            catch (error) {
                console.error('Webhook processing error:', error);
                res.status(500).json({ error: 'Failed to process webhook' });
            }
        };
        this.app = (0, express_1.default)();
        this.port = parseInt(process.env.PORT || '3000');
        this.server = (0, http_1.createServer)(this.app);
        this.io = new socket_io_1.Server(this.server, {
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
    initializeMiddleware() {
        // CORS configuration
        this.app.use((0, cors_1.default)({
            origin: process.env.NODE_ENV === 'production' ? 'https://localhost:3001' : '*',
            credentials: true
        }));
        // Body parsing middleware
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        // Request logging
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
            next();
        });
    }
    initializeRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.status(200).json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                service: 'Exam Proctor API'
            });
        });
        // API routes
        this.app.use('/api/sessions', proctorSession_1.default);
        this.app.use('/api/recordings', recording_1.default);
        // Webhook endpoint for external call platforms
        this.app.post('/webhook/external-call', this.handleExternalCallWebhook);
        // Error handling middleware
        this.app.use((err, req, res, next) => {
            console.error('Error:', err);
            res.status(500).json({
                error: 'Internal server error',
                message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
            });
        });
        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                error: 'Not found',
                message: `Route ${req.originalUrl} not found`
            });
        });
    }
    async initializeDatabase() {
        try {
            const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/exam_proctor';
            await mongoose_1.default.connect(mongoUri);
            console.log('Connected to MongoDB');
        }
        catch (error) {
            console.error('MongoDB connection error:', error);
            process.exit(1);
        }
    }
    initializeWebSocket() {
        this.io.on('connection', (socket) => {
            console.log(`Client connected: ${socket.id}`);
            // Handle session monitoring
            socket.on('join-session', (sessionId) => {
                socket.join(`session-${sessionId}`);
                console.log(`Client ${socket.id} joined session ${sessionId}`);
            });
            // Handle real-time monitoring data
            socket.on('monitoring-data', async (data) => {
                try {
                    const { sessionId, gazeData, audioData } = data;
                    // Process and store monitoring data
                    await externalCallMonitoring_1.externalCallMonitoringService.recordMonitoringData(sessionId, gazeData, audioData);
                    // Broadcast to other clients in the same session
                    socket.to(`session-${sessionId}`).emit('monitoring-update', data);
                }
                catch (error) {
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
    async createUploadsDir() {
        try {
            await promises_1.default.mkdir('./uploads/recordings', { recursive: true });
            console.log('Uploads directory created/verified');
        }
        catch (error) {
            console.error('Error creating uploads directory:', error);
        }
    }
    start() {
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
            gazeTracking_1.gazeTrackingService.stopTracking();
            audioAnalysis_1.audioAnalysisService.stopRealTimeAnalysis();
            // Close database connection
            await mongoose_1.default.connection.close();
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
//# sourceMappingURL=index.js.map