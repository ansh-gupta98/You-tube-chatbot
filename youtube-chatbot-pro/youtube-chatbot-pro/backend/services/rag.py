"""
RAG pipeline — chunking, embedding, vector store management.
"""
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from .llm_provider import get_embedding_model


# Module-level state (single video at a time — could be extended to multi-session)
_vectorstore = None
_transcript_text = ""
_transcript_chunks = []
_video_id = ""
_transcript_source = ""


def build_vectorstore(
    transcript_text: str,
    chunk_size: int = 1000,
    chunk_overlap: int = 200,
    embedding_provider: str = "google",
    embedding_model: str = None,
    embedding_api_key: str = None,
):
    """Split text → embed → build FAISS index. Returns (vectorstore, num_chunks)."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    docs = splitter.create_documents([transcript_text])

    embeddings = get_embedding_model(
        provider=embedding_provider,
        model=embedding_model,
        api_key=embedding_api_key,
    )

    vectorstore = FAISS.from_documents(docs, embeddings)
    return vectorstore, len(docs)


def set_state(vectorstore, transcript_text, chunks, video_id, source):
    """Store the current video's state in memory."""
    global _vectorstore, _transcript_text, _transcript_chunks, _video_id, _transcript_source
    _vectorstore = vectorstore
    _transcript_text = transcript_text
    _transcript_chunks = chunks
    _video_id = video_id
    _transcript_source = source


def get_vectorstore():
    return _vectorstore


def get_transcript_text():
    return _transcript_text


def get_transcript_chunks():
    return _transcript_chunks


def get_video_id():
    return _video_id


def get_transcript_source():
    return _transcript_source


def is_loaded():
    return _vectorstore is not None


def retrieve_context(question: str, k: int = 5) -> str:
    """Find the most relevant transcript chunks for a question."""
    if not _vectorstore:
        raise RuntimeError("No video loaded. Call /api/process first.")
    retriever = _vectorstore.as_retriever(
        search_type="similarity",
        search_kwargs={"k": k},
    )
    docs = retriever.invoke(question)
    return "\n\n".join([doc.page_content for doc in docs])
