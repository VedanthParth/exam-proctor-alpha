@echo off
REM Development startup script with HTTPS support for Windows

echo 🚀 Starting Exam Proctor Alpha with HTTPS support...

REM Check if certificates exist
if not exist "frontend\certificates\localhost.pem" (
    echo ⚠️  SSL certificates not found!
    echo 📋 To enable HTTPS, you need to create SSL certificates.
    echo 💡 You can use mkcert to create local certificates:
    echo    1. Install mkcert: https://github.com/FiloSottile/mkcert
    echo    2. Run: mkcert -install
    echo    3. Run: mkcert localhost 127.0.0.1 ::1
    echo    4. Move the files to frontend/certificates/
    echo.
    echo 🌐 Starting in HTTP mode...
    
    REM Start backend in HTTP mode
    start "Backend" cmd /k "cd backend && set PORT=8081 && set HTTPS=false && set NODE_ENV=development && pnpm dev"
    
    REM Start frontend in HTTP mode
    start "Frontend" cmd /k "cd frontend && set NEXT_PUBLIC_API_URL=http://localhost:8081 && set NEXT_PUBLIC_WS_URL=http://localhost:8081 && pnpm run dev:http"
    
) else (
    echo 🔒 SSL certificates found for frontend! Starting in mixed mode...
    
    REM Start backend in HTTP mode (safer)
    start "Backend HTTP" cmd /k "cd backend && set PORT=8081 && set HTTPS=false && set NODE_ENV=development && pnpm dev"
    
    REM Start frontend in HTTPS mode
    start "Frontend HTTPS" cmd /k "cd frontend && set NEXT_PUBLIC_API_URL=http://localhost:8081 && set NEXT_PUBLIC_WS_URL=http://localhost:8081 && pnpm dev"
)

echo.
echo 📱 Frontend: https://localhost:3001 (or http://localhost:3001)
echo 🔌 Backend: https://localhost:8081 (or http://localhost:8081)
echo.
echo 🛑 Close the terminal windows to stop services
pause
