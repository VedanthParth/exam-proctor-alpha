# Exam Proctor Alpha - Package Requirements

## Quick Setup Script

Run this in PowerShell (Windows) or Terminal (macOS/Linux):

```bash
# Check Node.js version
node --version

# Check pnpm version (install if needed)
pnpm --version || npm install -g pnpm

# Install all dependencies
pnpm install

# Install backend dependencies
cd backend && pnpm install

# Install frontend dependencies  
cd ../frontend && pnpm install

# Return to root
cd ..
```

## Package Requirements by Environment

### Production Dependencies

#### Backend (Node.js/Express)
```json
{
  "@types/cors": "^2.8.19",
  "@types/express": "^5.0.3", 
  "@types/multer": "^1.4.13",
  "@types/uuid": "^10.0.0",
  "@xenova/transformers": "^2.17.2",
  "cors": "^2.8.5",
  "express": "^5.1.0",
  "multer": "^2.0.1",
  "sharp": "^0.34.2",
  "uuid": "^11.1.0"
}
```

#### Frontend (Next.js/React)
```json
{
  "react": "^19.0.0",
  "react-dom": "^19.0.0", 
  "next": "15.3.4"
}
```

### Development Dependencies

#### Backend
```json
{
  "@types/node": "^24.0.4",
  "ts-node": "^10.9.2",
  "typescript": "^5.8.3"
}
```

#### Frontend  
```json
{
  "typescript": "^5",
  "@types/node": "^20",
  "@types/react": "^19", 
  "@types/react-dom": "^19",
  "@tailwindcss/postcss": "^4",
  "tailwindcss": "^4",
  "eslint": "^9",
  "eslint-config-next": "15.3.4",
  "@eslint/eslintrc": "^3"
}
```

## Version Compatibility

| Package | Minimum Version | Recommended | 
|---------|----------------|-------------|
| Node.js | 18.17.0 | 20.x LTS |
| pnpm | 8.0.0 | 9.x latest |
| TypeScript | 5.0.0 | 5.8.3 |
| Next.js | 15.0.0 | 15.3.4 |
| React | 19.0.0 | 19.0.0 |

## Package Manager Commands

### pnpm (Recommended)
```bash
# Install all dependencies
pnpm install

# Add new dependency
pnpm add <package-name>

# Add dev dependency  
pnpm add -D <package-name>

# Update dependencies
pnpm update

# Remove dependency
pnpm remove <package-name>
```

### npm (Alternative)
```bash  
# Install all dependencies
npm install

# Add new dependency
npm install <package-name>

# Add dev dependency
npm install -D <package-name>

# Update dependencies  
npm update

# Remove dependency
npm uninstall <package-name>
```

## Environment-Specific Requirements

### Development
- Hot reloading enabled
- Source maps for debugging
- TypeScript compilation on-the-fly
- ESLint for code quality

### Production
- Optimized builds
- Minified assets
- Server-side rendering (SSR)
- Static file serving

## Security Package Audit

Run security audits regularly:

```bash
# Check for vulnerabilities
pnpm audit

# Fix automatically fixable issues
pnpm audit --fix

# Manual review required for critical issues
pnpm audit --audit-level critical
```

## Platform-Specific Notes

### Windows
- Use PowerShell or Command Prompt
- May require Visual Studio Build Tools for native modules
- Sharp package may need additional setup

### macOS  
- Xcode Command Line Tools required
- Use Terminal or iTerm2
- Homebrew recommended for additional tools

### Linux
- build-essential package required
- Python 3 for native module compilation
- Additional libraries for Sharp image processing
