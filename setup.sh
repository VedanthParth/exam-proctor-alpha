#!/bin/bash

# Development Setup Script for Exam Proctor Alpha
# Run this script to set up the development environment

echo "🚀 Setting up Exam Proctor Alpha Development Environment..."

# Check Node.js version
echo "📋 Checking Node.js version..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18.17.0 or higher."
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version is too old. Please install Node.js 18.17.0 or higher."
    exit 1
fi
echo "✅ Node.js version: $(node --version)"

# Check/Install pnpm
echo "📋 Checking pnpm..."
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi
echo "✅ pnpm version: $(pnpm --version)"

# Install root dependencies
echo "📦 Installing root dependencies..."
pnpm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
pnpm install
cd ..

# Install frontend dependencies  
echo "📦 Installing frontend dependencies..."
cd frontend
pnpm install
cd ..

# Create environment files
echo "⚙️ Creating environment files..."

# Backend .env
if [ ! -f "backend/.env" ]; then
    cat > backend/.env << EOF
PORT=8000
NODE_ENV=development
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=100000000
CORS_ORIGIN=http://localhost:3001
EOF
    echo "✅ Created backend/.env"
fi

# Frontend .env.local
if [ ! -f "frontend/.env.local" ]; then
    cat > frontend/.env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_ENV=development
EOF
    echo "✅ Created frontend/.env.local"
fi

# Create uploads directory
echo "📁 Creating uploads directory..."
mkdir -p backend/uploads/recordings
echo "✅ Created backend/uploads/recordings"

# Build TypeScript
echo "🔨 Building backend TypeScript..."
cd backend
pnpm build
cd ..

echo "🎉 Setup complete!"
echo ""
echo "🚀 To start development:"
echo "   Backend:  cd backend && pnpm dev"
echo "   Frontend: cd frontend && pnpm dev"
echo ""
echo "🌐 URLs:"
echo "   Frontend: http://localhost:3001" 
echo "   Backend:  http://localhost:8000"
echo ""
echo "📝 Next steps:"
echo "   1. Review the REQUIREMENTS.md file"
echo "   2. Check environment variables in .env files"
echo "   3. Start both backend and frontend servers"
echo "   4. Open http://localhost:3001 in your browser"
