"""
Pydantic schemas for request/response validation.
"""
from pydantic import BaseModel, Field
from typing import Optional, Literal


# ---------------- Process Video ----------------
class ProcessVideoRequest(BaseModel):
    video_url: str = Field(..., description="YouTube video URL")
    transcript_mode: Literal["auto", "youtube", "whisper"] = "auto"
    whisper_model: Literal["tiny", "base", "small", "medium", "large"] = "base"
    chunk_size: int = Field(1000, ge=500, le=2000)
    chunk_overlap: int = Field(200, ge=50, le=400)
    llm_provider: Optional[str] = None
    llm_model: Optional[str] = None
    llm_api_key: Optional[str] = None
    embedding_provider: Optional[str] = None
    embedding_model: Optional[str] = None
    embedding_api_key: Optional[str] = None


class ProcessVideoResponse(BaseModel):
    success: bool
    video_id: str
    transcript_source: str
    num_chunks: int
    word_count: int
    message: str


# ---------------- Chat ----------------
class ChatRequest(BaseModel):
    question: str
    llm_provider: Optional[str] = None
    llm_model: Optional[str] = None
    llm_api_key: Optional[str] = None


class ChatResponse(BaseModel):
    answer: str
    source: str = "rag"


# ---------------- Quiz ----------------
class QuizRequest(BaseModel):
    num_questions: int = Field(5, ge=3, le=15)
    difficulty: Literal["Easy", "Medium", "Hard"] = "Medium"
    llm_provider: Optional[str] = None
    llm_model: Optional[str] = None
    llm_api_key: Optional[str] = None


class QuizQuestion(BaseModel):
    question: str
    options: list[str]
    correct_index: int
    explanation: str


class QuizResponse(BaseModel):
    questions: list[QuizQuestion]
    difficulty: str


# ---------------- Summary ----------------
class SummaryRequest(BaseModel):
    llm_provider: Optional[str] = None
    llm_model: Optional[str] = None
    llm_api_key: Optional[str] = None


class SummaryResponse(BaseModel):
    summary: str


# ---------------- Topics ----------------
class TopicsResponse(BaseModel):
    topics: list[str]


# ---------------- Transcript ----------------
class TranscriptResponse(BaseModel):
    chunks: list[dict]
    total: int


# ---------------- Health ----------------
class HealthResponse(BaseModel):
    status: str
    video_loaded: bool
    transcript_source: Optional[str] = None
    num_chunks: int = 0
