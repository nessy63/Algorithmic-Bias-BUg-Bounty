#!/bin/bash

echo "=== Starting Algorithmic Bias Bug Bounty Platform ==="

# Kill any existing processes
pkill -f "tsx src/index.ts" 2>/dev/null
pkill -f "next dev" 2>/dev/null
sleep 2

# Start backend
echo "Starting backend on port 3001..."
cd /home/nessy/Documents/Algorithmic\ Bias\ Bug\ Bounty\ platform/backend
nohup npx tsx src/index.ts </dev/null > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to be ready
for i in {1..10}; do
  if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "Backend is ready!"
    break
  fi
  sleep 1
done

# Start frontend
echo "Starting frontend on port 3000..."
cd /home/nessy/Documents/Algorithmic\ Bias\ Bug\ Bounty\ platform/frontend
nohup npx next dev -p 3000 </dev/null > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

# Wait for frontend to be ready
for i in {1..15}; do
  if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "Frontend is ready!"
    break
  fi
  sleep 1
done

echo ""
echo "=== All Services Running ==="
echo "Backend:  http://localhost:3001"
echo "Frontend: http://localhost:3000"
echo "Login:    http://localhost:3000/login"
echo ""
echo "=== Login Credentials ==="
echo "Company:    admin@techai.example.com / password123"
echo "Researcher: researcher1@example.com / password123"
echo ""
echo "Press Ctrl+C to stop all services"

# Keep script running
wait
