#!/bin/bash

# Docker start script for exam-proctor-alpha

echo "Starting Exam Proctor Alpha services..."

# Start backend
echo "Starting backend on port 8000..."
cd /app/backend && pnpm start:prod &

# Start frontend
echo "Starting frontend on port 3001..."
cd /app/frontend && pnpm start &

# Wait for any process to exit
wait -n

# Exit with status of process that exited first
exit $?
