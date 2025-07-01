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
    start "Backend" cmd /k "cd backend && pnpm dev"
    
    REM Start frontend in HTTP mode
    start "Frontend" cmd /k "cd frontend && pnpm run dev:http"
    
) else (
    echo 🔒 SSL certificates found! Starting with HTTPS...
    
    REM Start backend in HTTPS mode
    start "Backend HTTPS" cmd /k "cd backend && set HTTPS=true && pnpm dev"
    
    REM Start frontend in HTTPS mode
    start "Frontend HTTPS" cmd /k "cd frontend && pnpm dev"
)

echo.
echo 📱 Frontend: https://localhost:3001 (or http://localhost:3001)
echo 🔌 Backend: https://localhost:8000 (or http://localhost:8000)
echo.
echo 🛑 Close the terminal windows to stop services
pause
