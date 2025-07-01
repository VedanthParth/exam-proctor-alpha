#!/bin/bash

# Development startup script with HTTPS support

echo "🚀 Starting Exam Proctor Alpha with HTTPS support..."

# Check if certificates exist
if [ ! -f "frontend/certificates/localhost.pem" ] || [ ! -f "frontend/certificates/localhost-key.pem" ]; then
    echo "⚠️  SSL certificates not found!"
    echo "📋 To enable HTTPS, you need to create SSL certificates."
    echo "💡 You can use mkcert to create local certificates:"
    echo "   1. Install mkcert: https://github.com/FiloSottile/mkcert"
    echo "   2. Run: mkcert -install"
    echo "   3. Run: mkcert localhost 127.0.0.1 ::1"
    echo "   4. Move the files to frontend/certificates/"
    echo ""
    echo "🌐 Starting in HTTP mode..."
    
    # Start backend in HTTP mode
    cd backend && pnpm dev &
    BACKEND_PID=$!
    
    # Start frontend in HTTP mode  
    cd ../frontend && pnpm run dev:http &
    FRONTEND_PID=$!
    
else
    echo "🔒 SSL certificates found! Starting with HTTPS..."
    
    # Start backend in HTTPS mode
    cd backend && HTTPS=true pnpm dev &
    BACKEND_PID=$!
    
    # Start frontend in HTTPS mode
    cd ../frontend && pnpm dev &
    FRONTEND_PID=$!
fi

echo "🔧 Backend PID: $BACKEND_PID"
echo "🎨 Frontend PID: $FRONTEND_PID"
echo ""
echo "📱 Frontend: https://localhost:3001 (or http://localhost:3001)"
echo "🔌 Backend: https://localhost:8000 (or http://localhost:8000)"
echo ""
echo "🛑 Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    echo "✅ Services stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for background processes
wait
