"""
=============================================================================
YouTube Chatbot Pro — FastAPI Backend
=============================================================================
Professional, production-style backend with:
  • Multi-provider LLM support (Google, OpenAI, NVIDIA, Groq, Anthropic, Custom)
  • Multi-provider embeddings (with HuggingFace free fallback)
  • RAG pipeline with FAISS
  • YouTube captions + Whisper AI fallback
  • Clean REST API for the React frontend
=============================================================================
"""
import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models.schemas import (
    ProcessVideoRequest, ProcessVideoResponse,
    ChatRequest, ChatResponse,
    QuizRequest, QuizResponse,
    SummaryRequest, SummaryResponse,
    TopicsResponse,
    TranscriptResponse,
    HealthResponse,
)
from services.llm_provider import list_providers, VALID_PROVIDERS
from services.transcript import extract_video_id, fetch_transcript
from services.rag import (
    build_vectorstore, set_state, is_loaded,
    get_transcript_chunks, get_transcript_source,
)
from services.chat import chat_with_video
from services.quiz import generate_quiz
from services.summary import generate_summary
from services.topics import extract_topics

# Load .env
load_dotenv()

# -----------------------------------------------------------------------------
# FastAPI app
# -----------------------------------------------------------------------------
app = FastAPI(
    title="YouTube Chatbot Pro API",
    description="Multi-provider RAG backend for chatting with YouTube videos",
    version="2.0.0",
)

# CORS — allow the React frontend
origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------------------------------------------------------
# Routes — Meta
# -----------------------------------------------------------------------------
@app.get("/", tags=["meta"])
async def root():
    return {"name": "YouTube Chatbot Pro API", "version": "2.0.0", "docs": "/docs"}


@app.get("/api/health", response_model=HealthResponse, tags=["meta"])
async def health():
    return HealthResponse(
        status="ok",
        video_loaded=is_loaded(),
        transcript_source=get_transcript_source() if is_loaded() else None,
        num_chunks=len(get_transcript_chunks()) if is_loaded() else 0,
    )


@app.get("/api/providers", tags=["meta"])
async def providers():
    """List all supported LLM providers."""
    return {"providers": list_providers()}


# -----------------------------------------------------------------------------
# Routes — Process Video
# -----------------------------------------------------------------------------
@app.post("/api/process", response_model=ProcessVideoResponse, tags=["video"])
async def process_video(req: ProcessVideoRequest):
    """Fetch transcript + build FAISS vector store."""
    video_id = extract_video_id(req.video_url)
    if not video_id:
        raise HTTPException(400, "Invalid YouTube URL")

    try:
        # 1. Get transcript (YouTube or Whisper)
        transcript_text, chunks, source = fetch_transcript(
            video_id=video_id,
            mode=req.transcript_mode,
            whisper_model=req.whisper_model,
        )

        # 2. Build vector store with selected embedding provider
        vs, num_chunks = build_vectorstore(
            transcript_text=transcript_text,
            chunk_size=req.chunk_size,
            chunk_overlap=req.chunk_overlap,
            embedding_provider=req.embedding_provider or os.getenv("DEFAULT_EMBEDDING_PROVIDER", "google"),
            embedding_model=req.embedding_model,
            embedding_api_key=req.embedding_api_key,
        )

        # 3. Save state
        set_state(vs, transcript_text, chunks, video_id, source)

        return ProcessVideoResponse(
            success=True,
            video_id=video_id,
            transcript_source=source,
            num_chunks=num_chunks,
            word_count=len(transcript_text.split()),
            message=f"Video processed via {source}",
        )

    except Exception as e:
        raise HTTPException(500, detail=f"Processing failed: {str(e)}")


# -----------------------------------------------------------------------------
# Routes — Chat
# -----------------------------------------------------------------------------
@app.post("/api/chat", response_model=ChatResponse, tags=["chat"])
async def chat(req: ChatRequest):
    if not is_loaded():
        raise HTTPException(400, "No video loaded. Call POST /api/process first.")

    provider = req.llm_provider or os.getenv("DEFAULT_LLM_PROVIDER", "google")
    if provider not in VALID_PROVIDERS:
        raise HTTPException(400, f"Invalid provider. Options: {VALID_PROVIDERS}")

    try:
        answer = chat_with_video(
            question=req.question,
            llm_provider=provider,
            llm_model=req.llm_model,
            llm_api_key=req.llm_api_key,
        )
        return ChatResponse(answer=answer)
    except Exception as e:
        raise HTTPException(500, detail=str(e))


# -----------------------------------------------------------------------------
# Routes — Quiz
# -----------------------------------------------------------------------------
@app.post("/api/quiz", response_model=QuizResponse, tags=["quiz"])
async def quiz(req: QuizRequest):
    if not is_loaded():
        raise HTTPException(400, "No video loaded. Call POST /api/process first.")

    provider = req.llm_provider or os.getenv("DEFAULT_LLM_PROVIDER", "google")

    try:
        questions = generate_quiz(
            num_questions=req.num_questions,
            difficulty=req.difficulty,
            llm_provider=provider,
            llm_model=req.llm_model,
            llm_api_key=req.llm_api_key,
        )
        if not questions:
            raise HTTPException(500, "Failed to generate quiz. Try again.")
        return QuizResponse(questions=questions, difficulty=req.difficulty)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, detail=str(e))


# -----------------------------------------------------------------------------
# Routes — Summary
# -----------------------------------------------------------------------------
@app.post("/api/summary", response_model=SummaryResponse, tags=["summary"])
async def summary(req: SummaryRequest):
    if not is_loaded():
        raise HTTPException(400, "No video loaded. Call POST /api/process first.")

    provider = req.llm_provider or os.getenv("DEFAULT_LLM_PROVIDER", "google")

    try:
        result = generate_summary(
            llm_provider=provider,
            llm_model=req.llm_model,
            llm_api_key=req.llm_api_key,
        )
        return SummaryResponse(summary=result)
    except Exception as e:
        raise HTTPException(500, detail=str(e))


# -----------------------------------------------------------------------------
# Routes — Topics
# -----------------------------------------------------------------------------
@app.post("/api/topics", response_model=TopicsResponse, tags=["topics"])
async def topics(req: SummaryRequest):
    if not is_loaded():
        raise HTTPException(400, "No video loaded. Call POST /api/process first.")

    provider = req.llm_provider or os.getenv("DEFAULT_LLM_PROVIDER", "google")

    try:
        result = extract_topics(
            llm_provider=provider,
            llm_model=req.llm_model,
            llm_api_key=req.llm_api_key,
        )
        return TopicsResponse(topics=result)
    except Exception as e:
        raise HTTPException(500, detail=str(e))


# -----------------------------------------------------------------------------
# Routes — Transcript
# -----------------------------------------------------------------------------
@app.get("/api/transcript", response_model=TranscriptResponse, tags=["transcript"])
async def transcript():
    if not is_loaded():
        raise HTTPException(400, "No video loaded.")
    chunks = get_transcript_chunks()
    return TranscriptResponse(chunks=chunks, total=len(chunks))


# -----------------------------------------------------------------------------
# Entry point
# -----------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8000"))
    print(f"🚀 YouTube Chatbot Pro backend running at http://{host}:{port}")
    print(f"📚 API docs at http://{host}:{port}/docs")
    uvicorn.run(app, host=host, port=port)
