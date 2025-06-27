# Multi-stage Dockerfile for Exam Proctor Alpha

# Backend Stage
FROM node:18-alpine AS backend-deps
WORKDIR /app/backend
COPY backend/package*.json backend/pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

FROM node:18-alpine AS backend-builder  
WORKDIR /app/backend
COPY backend/ ./
COPY --from=backend-deps /app/backend/node_modules ./node_modules
RUN npm install -g pnpm && pnpm build

# Frontend Stage
FROM node:18-alpine AS frontend-deps
WORKDIR /app/frontend
COPY frontend/package*.json frontend/pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend  
COPY frontend/ ./
COPY --from=frontend-deps /app/frontend/node_modules ./node_modules
RUN npm install -g pnpm && pnpm build

# Production Stage
FROM node:18-alpine AS production
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy backend
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-deps /app/backend/node_modules ./backend/node_modules
COPY backend/package.json ./backend/

# Copy frontend  
COPY --from=frontend-builder /app/frontend/.next ./frontend/.next
COPY --from=frontend-builder /app/frontend/public ./frontend/public
COPY --from=frontend-deps /app/frontend/node_modules ./frontend/node_modules
COPY frontend/package.json ./frontend/

# Create uploads directory
RUN mkdir -p /app/backend/uploads/recordings

# Expose ports
EXPOSE 3000 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Start script
COPY docker-start.sh ./
RUN chmod +x docker-start.sh

CMD ["./docker-start.sh"]
