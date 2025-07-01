# 🔒 HTTPS Setup Guide for Camera/Microphone Access

Modern browsers require HTTPS to access camera and microphone. This guide helps you set up local HTTPS certificates.

## Quick Setup with mkcert (Recommended)

### Windows
```powershell
# Install mkcert using Chocolatey
choco install mkcert

# Or download from: https://github.com/FiloSottile/mkcert/releases
```

### macOS
```bash
# Install mkcert using Homebrew
brew install mkcert
```

### Linux
```bash
# Install mkcert
curl -JLO "https://dl.filippo.io/mkcert/latest?for=linux/amd64"
chmod +x mkcert-v*-linux-amd64
sudo cp mkcert-v*-linux-amd64 /usr/local/bin/mkcert
```

## Generate Certificates

1. **Install the local CA:**
   ```bash
   mkcert -install
   ```

2. **Generate certificates for localhost:**
   ```bash
   mkcert localhost 127.0.0.1 ::1
   ```

3. **Move certificates to the right location:**
   ```bash
   # Create certificates directory if it doesn't exist
   mkdir -p frontend/certificates
   
   # Move the generated files
   mv localhost+2.pem frontend/certificates/localhost.pem
   mv localhost+2-key.pem frontend/certificates/localhost-key.pem
   ```

## Starting the Application

### Option 1: Use the startup scripts
```bash
# Linux/macOS
./start-dev.sh

# Windows
start-dev.bat
```

### Option 2: Manual startup
```bash
# Backend with HTTPS
cd backend
HTTPS=true pnpm dev

# Frontend with HTTPS (in another terminal)
cd frontend
pnpm dev
```

## Access the Application

- **Frontend:** https://localhost:3001
- **Backend:** https://localhost:8000

⚠️ **Important:** Your browser may show a security warning the first time. Click "Advanced" → "Proceed to localhost" to continue.

## Troubleshooting

### Browser still shows "Not Secure"
- Make sure you ran `mkcert -install`
- Restart your browser after installing certificates
- Clear browser cache/cookies for localhost

### Certificate errors
- Verify certificate files exist in `frontend/certificates/`
- Check file permissions
- Regenerate certificates if needed

### Camera/microphone still not working
- Ensure you're accessing via HTTPS (https://, not http://)
- Check browser permissions for localhost
- Try a different browser (Chrome, Firefox, Safari)

## Alternative: Browser Flags (Development Only)

For testing only, you can bypass HTTPS requirements:

### Chrome
```
chrome --unsafely-treat-insecure-origin-as-secure=http://localhost:3001 --user-data-dir=/tmp/test
```

### Firefox
1. Type `about:config` in address bar
2. Set `media.devices.insecure.enabled` to `true`
3. Set `media.getusermedia.insecure.enabled` to `true`

⚠️ **Note:** Browser flags are for development only and not recommended for production.
