# Development Setup Script for Exam Proctor Alpha (Windows)
# Run this script in PowerShell to set up the development environment

Write-Host "🚀 Setting up Exam Proctor Alpha Development Environment..." -ForegroundColor Green

# Check Node.js version
Write-Host "📋 Checking Node.js version..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    $nodeVersionNumber = [int]($nodeVersion -replace 'v', '' -split '\.')[0]
    if ($nodeVersionNumber -lt 18) {
        Write-Host "❌ Node.js version is too old. Please install Node.js 18.17.0 or higher." -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18.17.0 or higher." -ForegroundColor Red
    exit 1
}

# Check/Install pnpm
Write-Host "📋 Checking pnpm..." -ForegroundColor Yellow
try {
    $pnpmVersion = pnpm --version
    Write-Host "✅ pnpm version: $pnpmVersion" -ForegroundColor Green
} catch {
    Write-Host "📦 Installing pnpm..." -ForegroundColor Yellow
    npm install -g pnpm
}

# Install root dependencies
Write-Host "📦 Installing root dependencies..." -ForegroundColor Yellow
pnpm install

# Install backend dependencies
Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
Set-Location backend
pnpm install
Set-Location ..

# Install frontend dependencies
Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location frontend
pnpm install
Set-Location ..

# Create environment files
Write-Host "⚙️ Creating environment files..." -ForegroundColor Yellow

# Backend .env
if (-not (Test-Path "backend\.env")) {
    @"
PORT=8000
NODE_ENV=development
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=100000000
CORS_ORIGIN=http://localhost:3001
"@ | Out-File -FilePath "backend\.env" -Encoding UTF8
    Write-Host "✅ Created backend\.env" -ForegroundColor Green
}

# Frontend .env.local
if (-not (Test-Path "frontend\.env.local")) {
    @"
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_ENV=development
"@ | Out-File -FilePath "frontend\.env.local" -Encoding UTF8
    Write-Host "✅ Created frontend\.env.local" -ForegroundColor Green
}

# Create uploads directory
Write-Host "📁 Creating uploads directory..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "backend\uploads\recordings" -Force | Out-Null
Write-Host "✅ Created backend\uploads\recordings" -ForegroundColor Green

# Build TypeScript
Write-Host "🔨 Building backend TypeScript..." -ForegroundColor Yellow
Set-Location backend
pnpm build
Set-Location ..

Write-Host "🎉 Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 To start development:" -ForegroundColor Cyan
Write-Host "   Backend:  cd backend && pnpm dev" -ForegroundColor White
Write-Host "   Frontend: cd frontend && pnpm dev" -ForegroundColor White
Write-Host ""
Write-Host "🌐 URLs:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:3001" -ForegroundColor White
Write-Host "   Backend:  http://localhost:8000" -ForegroundColor White
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Review the REQUIREMENTS.md file" -ForegroundColor White
Write-Host "   2. Check environment variables in .env files" -ForegroundColor White
Write-Host "   3. Start both backend and frontend servers" -ForegroundColor White
Write-Host "   4. Open http://localhost:3001 in your browser" -ForegroundColor White

# Pause to keep window open
Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
