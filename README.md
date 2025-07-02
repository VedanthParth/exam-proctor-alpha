# Exam Proctor - External Call Monitor

A comprehensive proctoring system that monitors external video calls (Google Meet, Zoom, Teams) and tracks user behavior through gaze detection, audio analysis, and suspicious activity monitoring.

> **Project Transformation**: This project has been completely rebuilt from a basic file upload system into a robust proctoring service, leveraging architectural patterns and components from the Taptic and Nova reference codebases.

## 🔄 Project Transformation Overview

This project was transformed from a simple file upload application into a comprehensive external call monitoring and proctoring system. The transformation involved:

### **Original State**
- Basic Express.js backend with file upload functionality
- Simple frontend with video recording capabilities
- No real-time monitoring or session management
- Limited database integration

### **Transformed Into**
- **Robust Proctoring Service**: Complete session management with real-time monitoring
- **External Call Integration**: Webhook support for Zoom, Google Meet, Teams
- **AI/ML Ready Architecture**: Gaze tracking and audio analysis framework
- **Real-time Dashboard**: Live monitoring interface with WebSocket integration
- **Scalable Backend**: Modular TypeScript services with MongoDB persistence
- **Modern Frontend**: Next.js 15 + React 19 with real-time updates

### **Reference Architecture Sources**
- **Nova Backend** (`Nova/nova-backend/`): Session management, AI/ML processing patterns, modular service architecture
- **Taptic Backend** (`Taptic/taptic-backend/`): Real-time communication, file handling, WebSocket integration
- **Combined Best Practices**: Security patterns, API design, database modeling

## 🚀 Features

### Backend Services
- **External Call Monitoring**: Listen to webhooks from external call platforms
- **Gaze Tracking**: Monitor user's eye movement and attention
- **Audio Analysis**: Detect multiple voices and background noise
- **Session Management**: Start, monitor, and end proctoring sessions
- **Recording Processing**: Store and process video/audio recordings
- **Real-time WebSocket**: Live monitoring data streaming
- **MongoDB Integration**: Persistent data storage

### Frontend Dashboard
- **Real-time Dashboard**: Monitor active proctoring sessions
- **Session Controls**: Start and end monitoring sessions
- **Live Data Feeds**: Real-time gaze and audio monitoring
- **External Call Events**: Track call participants and events
- **Clean UI**: Intuitive interface for proctors

## 🏗️ Architecture & Implementation Details

### **Complete System Rebuild**

#### **Backend Transformation**
```
Original:                    →    Transformed:
├── src/index.ts            →    ├── src/
└── package.json           →    │   ├── controllers/          # API request handlers
                           →    │   │   ├── proctorSession.ts # Session lifecycle
                           →    │   │   └── recording.ts      # Recording operations
                           →    │   ├── services/             # Business logic (Nova-inspired)
                           →    │   │   ├── externalCallMonitoring.ts  # Session management
                           →    │   │   ├── gazeTracking.ts             # Eye tracking
                           →    │   │   ├── audioAnalysis.ts           # Voice analysis
                           →    │   │   └── recording.ts               # File processing
                           →    │   ├── models/               # MongoDB schemas
                           →    │   │   ├── ProctorSession.ts
                           →    │   │   ├── MonitoringData.ts
                           →    │   │   └── ProcessingJob.ts
                           →    │   ├── routes/               # API endpoints
                           →    │   ├── middleware/           # Authentication, validation
                           →    │   ├── utils/                # Helper functions
                           →    │   ├── types/                # TypeScript definitions
                           →    │   └── index.ts             # Main server (WebSocket + REST)
                           →    ├── uploads/recordings/       # Secure file storage
                           →    └── .env                     # Environment config
```

#### **Frontend Transformation**
```
Original:                    →    Transformed:
├── src/app/page.tsx        →    ├── src/
└── package.json           →    │   ├── app/
                           →    │   │   ├── dashboard/        # Real-time monitoring dashboard
                           →    │   │   │   └── page.tsx
                           →    │   │   └── page.tsx         # Root redirect
                           →    │   ├── components/           # Reusable UI (Taptic-inspired)
                           →    │   │   ├── SessionStatus.tsx
                           →    │   │   └── SessionControls.tsx
                           →    │   ├── hooks/                # Custom React hooks
                           →    │   │   ├── useProctorSession.ts
                           →    │   │   └── useWebSocket.ts
                           →    │   ├── services/             # API integration
                           →    │   │   ├── api.ts
                           →    │   │   └── websocket.ts
                           →    │   └── types/                # TypeScript definitions
                           →    └── .env.local               # Environment config
```

### **Technology Stack Upgrades**

#### **Backend Dependencies Added**
```json
{
  "AI/ML Processing": {
    "@xenova/transformers": "^2.17.2",    // AI model processing
    "opencv4nodejs": "^5.6.0"             // Computer vision
  },
  "Real-time Communication": {
    "socket.io": "^4.7.5",                // WebSocket server
    "ws": "^8.16.0"                       // WebSocket protocol
  },
  "Database & Storage": {
    "mongoose": "^8.1.1",                 // MongoDB ODM
    "mongodb": "^6.3.0"                   // Database driver
  },
  "Media Processing": {
    "fluent-ffmpeg": "^2.1.3",           // Video processing
    "sharp": "^0.34.2"                    // Image processing
  },
  "External Integration": {
    "puppeteer": "^21.11.0"               // Browser automation
  },
  "Core Utilities": {
    "multer": "^2.0.1",                   // File uploads
    "uuid": "^11.1.0",                    // Unique identifiers
    "dotenv": "^16.4.1"                   // Environment config
  }
}
```

#### **Frontend Dependencies Added**
```json
{
  "Real-time Communication": {
    "socket.io-client": "Latest"          // WebSocket client
  },
  "Framework Upgrades": {
    "next": "15.x",                       // Next.js 15
    "react": "19.x"                       // React 19
  }
}
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ and pnpm
- MongoDB (local or cloud)
- Git

### 1. Backend Setup

```bash
cd backend
pnpm install
```

Configure environment variables in `backend/.env`:
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/exam_proctor
API_KEY=exam-proctor-dev-key-2025
LOG_LEVEL=info
```

Start the backend:
```bash
pnpm run dev
```

### 2. Frontend Setup

```bash
cd frontend
pnpm install
```

Configure environment variables in `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=http://localhost:3000
NEXT_PUBLIC_API_KEY=exam-proctor-dev-key-2025
```

Start the frontend:
```bash
pnpm run dev
```

### 3. MongoDB Setup

Install and start MongoDB locally, or use MongoDB Atlas:
```bash
# Local MongoDB
mongod --dbpath /your/data/path

# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

## 📊 API Endpoints

### Session Management
- `POST /api/sessions/start` - Start a new proctoring session
- `POST /api/sessions/:sessionId/end` - End a proctoring session
- `GET /api/sessions/:sessionId/status` - Get session status
- `GET /api/sessions/active` - Get all active sessions
- `GET /api/sessions/history/:userId` - Get user's session history

### Recording Management
- `POST /api/recordings/upload` - Upload recording files
- `GET /api/recordings/:sessionId/:recordingType` - Download recordings
- `GET /api/recordings/:sessionId/info` - Get recording information
- `DELETE /api/recordings/:sessionId/:recordingType` - Delete recordings

### Webhooks
- `POST /webhook/external-call` - Receive external call platform webhooks

## 🔌 WebSocket Events

### Client to Server
- `join-session` - Join a proctoring session
- `monitoring-data` - Send real-time monitoring data
- `external-call-event` - Send external call events

### Server to Client
- `monitoring-update` - Real-time monitoring data updates
- `call-event` - External call events
- `external-call-webhook` - Webhook notifications

## 🎯 Usage

1. **Start the System**:
   - Start MongoDB
   - Start backend server (`pnpm run dev` in backend/)
   - Start frontend (`pnpm run dev` in frontend/)

2. **Access the Dashboard**:
   - Open http://localhost:3001 in your browser
   - You'll be redirected to the dashboard automatically

3. **Start Monitoring**:
   - Fill in the user ID to monitor
   - Enter the external call ID (e.g., Google Meet room ID)
   - Select the call platform
   - Click "Start Proctoring Session"

4. **Monitor Activity**:
   - View real-time gaze tracking data
   - Monitor audio analysis results
   - Track suspicious activities
   - Observe external call events

5. **End Session**:
   - Click "End Proctoring Session" when done
   - Review session data and recordings

## 🔧 Integration with External Platforms

### Google Meet Integration
To integrate with Google Meet, you would need to:
1. Create a browser extension that injects into Google Meet
2. Use the Google Meet API (if available)
3. Set up webhooks to notify your backend

### Zoom Integration
For Zoom integration:
1. Use Zoom Webhooks API
2. Subscribe to meeting events
3. Configure webhook endpoint: `POST /webhook/external-call`

### Teams Integration
For Microsoft Teams:
1. Use Microsoft Graph API
2. Set up Teams application
3. Configure webhooks for call events

## 🚨 Important Notes & Current Status

### **Implementation Status**
- ✅ **Complete Backend Architecture**: Fully functional REST API + WebSocket server
- ✅ **Real-time Dashboard**: Live monitoring interface with session controls
- ✅ **Database Integration**: MongoDB with proper schemas and relationships
- ✅ **External Platform Framework**: Webhook infrastructure for call platforms
- ✅ **Recording System**: Video/audio capture, storage, and transcription
- ⚠️ **Simulated Monitoring**: Gaze tracking and audio analysis use simulated data
- ⚠️ **Development Stage**: Ready for extension with real AI/ML implementations

### **Production Considerations**
- **Privacy Compliance**: Ensure compliance with privacy and legal requirements
- **Real AI Integration**: Replace simulated gaze/audio analysis with actual computer vision
- **Platform Authentication**: Implement OAuth for Zoom/Meet/Teams integration
- **Scalability**: Consider clustering and load balancing for production use
- **Security Hardening**: Implement rate limiting, API throttling, and enhanced authentication

### **Next Steps for Real Implementation**
1. **Computer Vision Integration**: Replace simulated gaze tracking with OpenCV/MediaPipe
2. **Audio Processing**: Implement real audio analysis using Web Audio API or server-side processing
3. **Browser Extension Development**: Create extensions for actual call platform integration
4. **Cloud Deployment**: Set up production infrastructure with proper monitoring
5. **Testing Suite**: Implement comprehensive unit and integration tests

## 📈 Project Evolution Summary

**Original Project**: Basic file upload system with simple video recording  
**Transformed Into**: Comprehensive external call monitoring and proctoring service

### **Key Achievements**
- 🏗️ **Complete Architecture Rebuild**: Modular, scalable, production-ready structure
- 🔄 **Real-time Capabilities**: WebSocket integration for live monitoring
- 🧠 **AI/ML Ready Framework**: Extensible architecture for computer vision and audio analysis
- 🔗 **External Integration**: Webhook system for major video call platforms
- 📊 **Data Persistence**: Robust MongoDB integration with proper schemas
- 🎯 **Modern Tech Stack**: Latest Next.js, React, TypeScript, and Node.js

### **Technical Debt Resolved**
- ❌ Single-file backend → ✅ Modular service architecture
- ❌ No real-time features → ✅ WebSocket-based live updates
- ❌ Basic file handling → ✅ Secure, validated file management
- ❌ No session management → ✅ Complete session lifecycle handling
- ❌ Limited TypeScript → ✅ Full type safety throughout

### **Reference Architecture Sources**
- **Nova Backend**: Session management, AI/ML processing, database modeling
- **Taptic Backend**: Real-time communication, file handling, API structure
- **Custom Integration**: External call monitoring, proctoring-specific features

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following the established patterns from Nova/Taptic
4. Test thoroughly with both backend and frontend
5. Submit a pull request with detailed description

## 📄 License

This project is licensed under the ISC License.

---

**Built with:**
- **Backend**: Node.js, Express, TypeScript, MongoDB, Socket.IO, OpenCV (ready), AI/ML (framework)
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS, Socket.IO Client  
- **Infrastructure**: Docker, MongoDB, WebSocket, REST APIs, Webhook Integration
- **Architecture**: Microservices-inspired, Nova & Taptic patterns, Real-time monitoring
