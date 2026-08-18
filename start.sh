#!/bin/bash
# Reusable start script for the Algorithmic Bias Bug Bounty Platform.
#
# Starts all three services fully detached (safe to close the terminal),
# waits for each to be healthy, and opens the app in the browser.
#
# Usage:
#   ./start.sh              # start all services and open the browser
#   ./start.sh --no-browser # start all services without opening the browser
#   ./start.sh --stop       # stop all services
#
# Logs: /tmp/bugbounty-logs/{backend,sandbox,frontend}.log

set -u
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
SANDBOX_DIR="$SCRIPT_DIR/sandbox"
LOG_DIR="/tmp/bugbounty-logs"
mkdir -p "$LOG_DIR"

OPEN_BROWSER=1

case "${1:-}" in
  --stop)
    echo "=== Stopping all services ==="
    pkill -f "tsx src/index.ts" 2>/dev/null || true
    pkill -f "next dev" 2>/dev/null || true
    pkill -f "uvicorn main:app" 2>/dev/null || true
    sleep 1
    echo "Done. All services stopped."
    exit 0
    ;;
  --no-browser)
    OPEN_BROWSER=0
    ;;
  "")
    ;;
  *)
    echo "Usage: $0 [--no-browser|--stop]"
    exit 1
    ;;
esac

echo "=== Starting Algorithmic Bias Bug Bounty Platform ==="

# Kill any existing instances so ports are free
pkill -f "tsx src/index.ts" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
pkill -f "uvicorn main:app" 2>/dev/null || true
sleep 2

# --- Backend (port 3001) ---
echo "Starting backend on port 3001..."
(cd "$BACKEND_DIR" && setsid nohup npx tsx src/index.ts </dev/null > "$LOG_DIR/backend.log" 2>&1 &)

# --- Sandbox (port 8000) ---
SANDBOX_PY="$SANDBOX_DIR/.venv/bin/python"
if [ ! -x "$SANDBOX_PY" ]; then
  echo "WARNING: $SANDBOX_PY not found, falling back to python3 (run: pip install -r sandbox/requirements.txt)"
  SANDBOX_PY="python3"
fi
echo "Starting sandbox on port 8000..."
(cd "$SANDBOX_DIR" && setsid nohup "$SANDBOX_PY" -m uvicorn main:app --host 0.0.0.0 --port 8000 </dev/null > "$LOG_DIR/sandbox.log" 2>&1 &)

# --- Frontend (port 3000) ---
echo "Starting frontend on port 3000..."
(cd "$FRONTEND_DIR" && setsid nohup npx next dev -p 3000 </dev/null > "$LOG_DIR/frontend.log" 2>&1 &)

# Wait for each service to respond (first Next.js compile can take a while)
wait_for() {
  local name="$1" url="$2" max_attempts="$3"
  for i in $(seq 1 "$max_attempts"); do
    if [ "$(curl -s -o /dev/null -w '%{http_code}' "$url" 2>/dev/null)" = "200" ]; then
      echo "  $name ready: $url"
      return 0
    fi
    sleep 1
  done
  echo "  WARNING: $name not responding at $url yet — check $LOG_DIR/$name.log"
  return 1
}

echo ""
echo "Waiting for services..."
wait_for backend  http://localhost:3001/health 30
wait_for sandbox  http://localhost:8000/health  20
wait_for frontend http://localhost:3000         60

echo ""
echo "=== All Services Running (detached) ==="
echo "  Backend:  http://localhost:3001   (log: $LOG_DIR/backend.log)"
echo "  Frontend: http://localhost:3000   (log: $LOG_DIR/frontend.log)"
echo "  Sandbox:  http://localhost:8000   (log: $LOG_DIR/sandbox.log)"
echo "  Login:    http://localhost:3000/login"
echo ""
echo "=== Demo Credentials ==="
echo "  Company:    admin@techai.example.com / password123"
echo "  Researcher: researcher1@example.com / password123"
echo ""
echo "Stop everything later with: $0 --stop"

# --- Open the app in the browser ---
if [ "$OPEN_BROWSER" = "1" ]; then
  BROWSER=""
  for b in brave-browser google-chrome chromium chromium-browser firefox; do
    if command -v "$b" >/dev/null 2>&1; then
      BROWSER="$b"
      break
    fi
  done

  if [ -n "$BROWSER" ]; then
    setsid nohup "$BROWSER" --new-window http://localhost:3000 </dev/null >/dev/null 2>&1 &
    echo "Opened http://localhost:3000 in $BROWSER"
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open http://localhost:3000 >/dev/null 2>&1 &
    echo "Opened http://localhost:3000 via xdg-open"
  else
    echo "No browser found — open http://localhost:3000 manually."
  fi
fi
