"""
Transcript service — fetches YouTube captions OR transcribes audio with Whisper.
"""
import os
import re
import tempfile
import glob
from typing import Optional
from youtube_transcript_api import (
    YouTubeTranscriptApi,
    TranscriptsDisabled,
    NoTranscriptFound,
    VideoUnavailable,
)


def extract_video_id(url: str) -> Optional[str]:
    """Extract 11-char YouTube video ID from any URL format."""
    pattern = r"(?:v=|\/|youtu\.be\/)([0-9A-Za-z_-]{11})"
    match = re.search(pattern, url)
    return match.group(1) if match else None


def get_youtube_transcript(video_id: str) -> tuple[str, list[dict]]:
    """
    Fetch transcript from YouTube captions API.
    Returns (full_text, chunks_with_timestamps).
    """
    api = YouTubeTranscriptApi()
    transcript_list = api.fetch(video_id)

    chunks = []
    parts = []
    for snippet in transcript_list:
        parts.append(snippet.text)
        chunks.append({
            "text": snippet.text,
            "start": float(snippet.start),
            "duration": float(snippet.duration),
        })

    full_text = " ".join(parts)
    if not full_text.strip():
        raise NoTranscriptFound("Empty transcript")

    return full_text, chunks


def transcribe_with_whisper(video_id: str, model_size: str = "base") -> tuple[str, list[dict]]:
    """
    Download audio from YouTube + transcribe with OpenAI Whisper (local, free).
    Requires: pip install openai-whisper yt-dlp  +  ffmpeg installed on system.
    """
    try:
        import whisper
    except ImportError:
        raise RuntimeError(
            "Whisper is not installed. Run: pip install openai-whisper"
        )

    try:
        from yt_dlp import YoutubeDL
    except ImportError:
        raise RuntimeError("yt-dlp is not installed. Run: pip install yt-dlp")

    url = f"https://youtube.com/watch?v={video_id}"
    tmp_dir = tempfile.mkdtemp(prefix="yt_audio_")
    audio_path = os.path.join(tmp_dir, "audio.%(ext)s")

    ydl_opts = {
        "format": "bestaudio/best",
        "outtmpl": audio_path,
        "postprocessors": [{
            "key": "FFmpegExtractAudio",
            "preferredcodec": "mp3",
            "preferredquality": "128",
        }],
        "quiet": True,
        "no_warnings": True,
    }
    with YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])

    mp3_files = glob.glob(os.path.join(tmp_dir, "audio.mp3"))
    if not mp3_files:
        raise RuntimeError("Failed to download audio from YouTube.")

    mp3_path = mp3_files[0]
    model = whisper.load_model(model_size)
    result = model.transcribe(mp3_path)

    chunks = []
    parts = []
    for seg in result.get("segments", []):
        text = seg["text"].strip()
        if not text:
            continue
        parts.append(text)
        chunks.append({
            "text": text,
            "start": float(seg["start"]),
            "duration": float(seg.get("end", seg["start"]) - seg["start"]),
        })

    try:
        os.remove(mp3_path)
        os.rmdir(tmp_dir)
    except Exception:
        pass

    full_text = " ".join(parts) if parts else (result.get("text", "") or "")
    if not full_text.strip():
        raise RuntimeError("Whisper produced empty transcript.")

    return full_text, chunks


def fetch_transcript(
    video_id: str,
    mode: str = "auto",
    whisper_model: str = "base",
) -> tuple[str, list[dict], str]:
    """
    Get transcript using the selected mode.
    Returns (full_text, chunks, source_label).
    """
    transcript_text = ""
    chunks = []
    source = ""

    use_youtube = mode in ("auto", "youtube")
    use_whisper = mode in ("auto", "whisper")

    # Try YouTube captions first
    if use_youtube:
        try:
            transcript_text, chunks = get_youtube_transcript(video_id)
            source = "YouTube Captions"
        except (TranscriptsDisabled, NoTranscriptFound, VideoUnavailable):
            transcript_text = ""
        except Exception:
            transcript_text = ""

    # Fallback to Whisper
    if not transcript_text.strip() and use_whisper:
        transcript_text, chunks = transcribe_with_whisper(video_id, whisper_model)
        source = f"Whisper AI ({whisper_model})"

    if not transcript_text.strip():
        raise RuntimeError(
            "No transcript available. Try switching to 'Whisper AI only' mode."
        )

    return transcript_text, chunks, source
