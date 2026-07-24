#!/bin/bash
# ============================================================
#  YouTube Chatbot Pro - Linux/Mac Launcher
#  Starts both backend (FastAPI) and frontend (React) servers
# ============================================================

echo "============================================"
echo "  YouTube Chatbot Pro - Starting..."
echo "============================================"
echo ""

# ---- Start backend ----
echo "[1/2] Starting backend (FastAPI on port 8000)..."
osascript -e "tell app \"Terminal\" to do script \"cd \"$(pwd)\"/backend && source venv/bin/activate && uvicorn main:app --reload --host 127.0.0.1 --port 8000\"" 2>/dev/null \
  || (cd backend && source venv/bin/activate && uvicorn main:app --reload --host 127.0.0.1 --port 8000 &)

sleep 3

# ---- Start frontend ----
echo "[2/2] Starting frontend (React on port 5173)..."
osascript -e "tell app \"Terminal\" to do script \"cd \"$(pwd)\"/frontend && npm run dev\"" 2>/dev/null \
  || (cd frontend && npm run dev &)

echo ""
echo "============================================"
echo "  Both servers are starting!"
echo ""
echo "  Backend:  http://127.0.0.1:8000"
echo "  API Docs: http://127.0.0.1:8000/docs"
echo "  Frontend: http://localhost:5173"
echo "============================================"
echo ""
echo "Press Ctrl+C in each terminal window to stop."
