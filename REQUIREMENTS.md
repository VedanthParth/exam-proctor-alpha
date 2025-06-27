# Exam Proctor Alpha - Requirements

## System Requirements

### Node.js Version
- **Node.js**: v18.17.0 or higher (LTS recommended)
- **npm**: v9.0.0 or higher
- **pnpm**: v8.0.0 or higher (preferred package manager)

### Operating System
- Windows 10/11, macOS 10.15+, or Linux (Ubuntu 18.04+)

## Development Environment

### Required Software
- **Node.js** (v18.17.0+)
- **pnpm** (v8.0.0+) - Package manager
- **Git** - Version control
- **VS Code** (recommended) - Code editor

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Project Dependencies

### Backend Dependencies
See `backend/package.json` for complete list:

#### Core Dependencies
- **Express.js** (v5.1.0) - Web framework
- **TypeScript** (v5.8.3) - Type safety
- **Multer** (v2.0.1) - File upload handling
- **CORS** (v2.8.5) - Cross-origin resource sharing
- **Sharp** (v0.34.2) - Image processing
- **UUID** (v11.1.0) - Unique identifier generation
- **Xenova Transformers** (v2.17.2) - AI/ML processing

#### Development Dependencies
- **ts-node** (v10.9.2) - TypeScript execution
- **@types/node** (v24.0.4) - Node.js type definitions

### Frontend Dependencies
See `frontend/package.json` for complete list:

#### Core Dependencies
- **Next.js** (v15.3.4) - React framework
- **React** (v19.0.0) - UI library
- **React DOM** (v19.0.0) - DOM rendering
- **TailwindCSS** (v4) - CSS framework

#### Development Dependencies
- **TypeScript** (v5) - Type safety
- **ESLint** (v9) - Code linting

## Installation

### Prerequisites
1. Install Node.js (v18.17.0+) from [nodejs.org](https://nodejs.org/)
2. Install pnpm globally:
   ```bash
   npm install -g pnpm
   ```

### Setup
1. Clone the repository
2. Install dependencies:
   ```bash
   # Install all dependencies (root, frontend, backend)
   pnpm install
   
   # Or install individually
   cd backend && pnpm install
   cd ../frontend && pnpm install
   ```

### Development
1. Start backend (port 8000):
   ```bash
   cd backend
   pnpm dev
   ```

2. Start frontend (port 3001):
   ```bash
   cd frontend
   pnpm dev
   ```

### Production Build
1. Build backend:
   ```bash
   cd backend
   pnpm build
   pnpm start:prod
   ```

2. Build frontend:
   ```bash
   cd frontend
   pnpm build
   pnpm start
   ```

## Security Requirements

### SSL/TLS
- HTTPS enabled for production
- SSL certificates in `frontend/certificates/` (for development)

### File Upload Security
- File type validation
- File size limits
- Secure file storage in `backend/uploads/`

### Privacy
- Exam recordings stored securely
- No sensitive data in git repository
- Environment variables for configuration

## Performance Requirements

### Minimum Hardware
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 2GB free space
- **CPU**: 2 cores minimum
- **Network**: Stable internet connection

### Browser Performance
- WebRTC support for video recording
- Camera and microphone access
- Modern JavaScript (ES2020+) support

## Feature Requirements

### Core Features
- Real-time video recording
- File upload/download
- Secure exam session management
- AI-powered monitoring (future)

### Browser Permissions Required
- Camera access
- Microphone access
- File system access (for uploads)

## Environment Variables

Create `.env` files in both frontend and backend directories:

### Backend `.env`
```
PORT=8000
NODE_ENV=development
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=100MB
```

### Frontend `.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_ENV=development
```
