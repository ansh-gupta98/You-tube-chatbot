# 🎬 YouTube Video Chatbot Pro — Full-Stack Edition

A professional full-stack application that lets you **chat with any YouTube video**, generate **MCQ quizzes**, get **structured summaries**, and browse the **timestamped transcript** — all powered by **RAG (Retrieval-Augmented Generation)**.

## ✨ Features

- 💬 **Chat with any video** — RAG-based Q&A using vector search
- 📝 **Auto-generated MCQ quizzes** — with auto-grading and explanations
- 📋 **Structured summaries** — one-line summary, key takeaways, topics, insights
- 🏷️ **Key topic extraction** — auto-detected from the transcript
- 📜 **Timestamped transcript** — clickable to jump to YouTube moments
- 🎙️ **Whisper AI fallback** — works on videos without captions
- 🔄 **Multi-provider LLM support**:
  - Google Gemini (free tier)
  - OpenAI GPT-4
  - NVIDIA NIM (Llama, Mistral, etc.)
  - Groq (free, fast)
  - Anthropic Claude
  - Any OpenAI-compatible API (custom)
- 🎨 **Beautiful dark-themed React UI** with Tailwind CSS
- ⚡ **FastAPI backend** with clean REST API and OpenAPI docs

---

## 📁 Project Structure

```
youtube-chatbot-pro/
├── backend/                  # FastAPI backend
│   ├── main.py              # FastAPI app entry point
│   ├── requirements.txt
│   ├── .env.example
│   ├── models/
│   │   └── schemas.py       # Pydantic request/response models
│   └── services/
│       ├── llm_provider.py  # 🔑 Multi-provider LLM factory
│       ├── transcript.py    # YouTube + Whisper
│       ├── rag.py           # FAISS vector store
│       ├── chat.py          # Chat service
│       ├── quiz.py          # Quiz generator
│       ├── summary.py       # Summary service
│       └── topics.py        # Topic extractor
├── frontend/                 # React + Vite frontend
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       ├── services/
│       │   └── api.js       # Axios API client
│       └── components/
│           ├── Sidebar.jsx
│           ├── VideoPlayer.jsx
│           ├── ChatTab.jsx
│           ├── QuizTab.jsx
│           ├── SummaryTab.jsx
│           └── TranscriptTab.jsx
├── start.bat                # Windows launcher
├── start.sh                 # Linux/Mac launcher
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.10+** → https://www.python.org/downloads/
- **Node.js 18+** → https://nodejs.org/
- (Optional) **ffmpeg** → only needed for Whisper transcription of videos without captions

### Step 1 — Get a free API key

Pick **any ONE** provider (you only need one!):

| Provider | Free Tier | Get Key |
|----------|-----------|---------|
| **Google Gemini** ⭐ | Yes (1500 req/day) | https://aistudio.google.com/apikey |
| **Groq** | Yes (fast, generous) | https://console.groq.com/keys |
| **NVIDIA NIM** | Yes (free credits) | https://build.nvidia.com/ |
| **OpenAI** | No ($5 free trial) | https://platform.openai.com/api-keys |
| **Anthropic** | Yes ($5 free) | https://console.anthropic.com/ |

### Step 2 — Backend setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your API key(s)

# Start the backend
uvicorn main:app --reload
```

Backend runs at → `http://127.0.0.1:8000`
API docs at → `http://127.0.0.1:8000/docs`

### Step 3 — Frontend setup (in a NEW terminal)

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Frontend runs at → `http://localhost:5173`

### Step 4 — Use the app

1. Open `http://localhost:5173` in your browser
2. In the sidebar:
   - Select your **LLM provider**
   - Paste your **API key** (or leave blank if it's in `.env`)
   - Paste a **YouTube URL**
   - Click **🚀 Process Video**
3. Use the 4 tabs: Chat / Quiz / Summary / Transcript

---

## 🔄 Switching API Providers

You can switch providers **at runtime** from the sidebar — no code changes or restarts needed!

### Method 1 — Runtime (in the UI)
1. Open the app
2. In the sidebar, change the **LLM Provider** dropdown
3. Paste the corresponding API key
4. Click **🚀 Process Video** again

### Method 2 — Environment variables (persistent)
Edit `backend/.env`:
```env
DEFAULT_LLM_PROVIDER=nvidia
NVIDIA_API_KEY=nvapi-xxxxx
NVIDIA_LLM_MODEL=meta/llama-3.3-70b-instruct
```

### Method 3 — Different provider for each feature
Just change the dropdown before clicking the action button:
- Use **Groq** for fast chat
- Use **NVIDIA** for quiz generation
- Use **Gemini** for summaries

---

## 🎙️ Whisper AI (for videos without captions)

If a YouTube video has no captions, the app can transcribe the audio locally:

### Install Whisper + ffmpeg

```bash
# In backend venv:
pip install openai-whisper yt-dlp
```

**Windows** — install ffmpeg:
```powershell
winget install Gyan.FFmpeg
# Then CLOSE and reopen your terminal
```

**Mac:**
```bash
brew install ffmpeg
```

**Linux:**
```bash
sudo apt install ffmpeg
```

### Use Whisper
1. In the sidebar, set **Transcript Source** → `Whisper AI only`
2. Pick **Whisper Model Size** (default: `base`)
3. Click **🚀 Process Video**
4. Wait 1-3 minutes (first run downloads the model ~140MB)

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Backend health check |
| GET | `/api/providers` | List supported LLM providers |
| POST | `/api/process` | Process a YouTube video |
| POST | `/api/chat` | Ask a question about the video |
| POST | `/api/quiz` | Generate MCQ quiz |
| POST | `/api/summary` | Generate video summary |
| POST | `/api/topics` | Extract key topics |
| GET | `/api/transcript` | Get full transcript with timestamps |

Interactive docs at → `http://127.0.0.1:8000/docs`

---

## 🧰 Troubleshooting

| Problem | Solution |
|---------|----------|
| Backend not running | `cd backend && uvicorn main:app --reload` |
| Frontend can't reach backend | Make sure backend is on port 8000 |
| `404 NOT_FOUND` embedding error | Switch embedding provider to `HuggingFace` (free, local) |
| Whisper not installed | `pip install openai-whisper yt-dlp` + install ffmpeg |
| PowerShell blocks scripts | `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` |
| `port already in use` | Change port in `.env` (`PORT=8001`) or kill the process |

---

## 🏗️ Tech Stack

**Backend:**
- FastAPI (async web framework)
- LangChain (LLM orchestration)
- FAISS (vector similarity search)
- Pydantic (validation)
- Multi-provider: Google, OpenAI, NVIDIA, Groq, Anthropic

**Frontend:**
- React 18
- Vite (build tool)
- Tailwind CSS (styling)
- Lucide React (icons)
- React Markdown (rendering)
- Axios (HTTP client)

---

## 📜 License

MIT License — free for educational and commercial use.

Built with ❤️ for college students learning GenAI.
