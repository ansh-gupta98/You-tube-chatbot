"""
=============================================================================
Multi-Provider LLM Factory
=============================================================================
Supports: Google Gemini, OpenAI, NVIDIA NIM, Groq, Anthropic, Custom
Any OpenAI-compatible API can be used via the "custom" provider.

Usage:
    llm = get_llm(provider="nvidia", model="meta/llama-3.3-70b-instruct",
                  api_key="nvapi-xxx", temperature=0.3)
    response = llm.invoke("Hello")
=============================================================================
"""
import os
from typing import Optional

# Provider registry — maps provider name to its config
PROVIDER_CONFIG = {
    "google": {
        "env_key": "GOOGLE_API_KEY",
        "default_model": "gemini-2.0-flash",
        "supports_embeddings": True,
        "default_embedding": "embedding-001",
    },
    "openai": {
        "env_key": "OPENAI_API_KEY",
        "default_model": "gpt-4o-mini",
        "supports_embeddings": True,
        "default_embedding": "text-embedding-3-small",
    },
    "nvidia": {
        "env_key": "NVIDIA_API_KEY",
        "default_model": "meta/llama-3.3-70b-instruct",
        "base_url": "https://integrate.api.nvidia.com/v1",
        "supports_embeddings": True,
        "default_embedding": "nvidia/nv-embed-v1",
    },
    "groq": {
        "env_key": "GROQ_API_KEY",
        "default_model": "llama-3.3-70b-versatile",
        "base_url": "https://api.groq.com/openai/v1",
        "supports_embeddings": False,
    },
    "anthropic": {
        "env_key": "ANTHROPIC_API_KEY",
        "default_model": "claude-3-5-haiku-20241022",
        "supports_embeddings": False,
    },
    "custom": {
        "env_key": "CUSTOM_API_KEY",
        "default_model": "",
        "base_url_env": "CUSTOM_BASE_URL",
        "supports_embeddings": False,
    },
}

VALID_PROVIDERS = list(PROVIDER_CONFIG.keys())


def _resolve_api_key(provider: str, api_key: Optional[str]) -> str:
    """Use provided key, else fall back to env var."""
    if api_key and api_key.strip():
        return api_key.strip()
    env_var = PROVIDER_CONFIG[provider]["env_key"]
    return os.getenv(env_var, "").strip()


def _resolve_base_url(provider: str) -> Optional[str]:
    """Get base URL for OpenAI-compatible providers."""
    cfg = PROVIDER_CONFIG[provider]
    if "base_url" in cfg:
        return cfg["base_url"]
    if "base_url_env" in cfg:
        return os.getenv(cfg["base_url_env"], "").strip() or None
    return None


def get_llm(
    provider: str,
    model: Optional[str] = None,
    api_key: Optional[str] = None,
    temperature: float = 0.3,
):
    """
    Return a LangChain chat model for the given provider.

    Args:
        provider: One of 'google', 'openai', 'nvidia', 'groq', 'anthropic', 'custom'
        model: Model name (uses provider default if None)
        api_key: API key (uses env var if None)
        temperature: Sampling temperature (0.0 - 1.0)
    """
    provider = (provider or "").lower().strip()

    if provider not in PROVIDER_CONFIG:
        raise ValueError(
            f"Unknown provider '{provider}'. Valid options: {VALID_PROVIDERS}"
        )

    cfg = PROVIDER_CONFIG[provider]
    resolved_key = _resolve_api_key(provider, api_key)
    resolved_model = (model or "").strip() or cfg["default_model"]

    if not resolved_key:
        raise ValueError(
            f"No API key for provider '{provider}'. "
            f"Set {cfg['env_key']} in .env or pass api_key parameter."
        )

    if not resolved_model:
        raise ValueError(f"No model specified for provider '{provider}'.")

    # ---- Google Gemini ----
    if provider == "google":
        from langchain_google_genai import ChatGoogleGenerativeAI
        return ChatGoogleGenerativeAI(
            model=resolved_model,
            temperature=temperature,
            google_api_key=resolved_key,
        )

    # ---- Anthropic Claude ----
    elif provider == "anthropic":
        from langchain_anthropic import ChatAnthropic
        return ChatAnthropic(
            model=resolved_model,
            temperature=temperature,
            anthropic_api_key=resolved_key,
        )

    # ---- OpenAI / NVIDIA / Groq / Custom (all OpenAI-compatible) ----
    else:
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(
            model=resolved_model,
            temperature=temperature,
            api_key=resolved_key,
            base_url=_resolve_base_url(provider),
        )


def get_embedding_model(
    provider: str,
    model: Optional[str] = None,
    api_key: Optional[str] = None,
):
    """
    Return a LangChain embeddings model for the given provider.
    Falls back to FREE HuggingFace local embeddings if provider doesn't support embeddings.
    """
    provider = (provider or "").lower().strip()

    if provider not in PROVIDER_CONFIG:
        raise ValueError(
            f"Unknown provider '{provider}'. Valid options: {VALID_PROVIDERS}"
        )

    cfg = PROVIDER_CONFIG[provider]

    # If provider doesn't support embeddings → use HuggingFace (free, local)
    if not cfg.get("supports_embeddings", False):
        return get_huggingface_embedding()

    resolved_key = _resolve_api_key(provider, api_key)
    resolved_model = (model or "").strip() or cfg.get("default_embedding", "")

    if not resolved_key:
        # Fallback to HuggingFace if no key
        return get_huggingface_embedding()

    try:
        if provider == "google":
            from langchain_google_genai import GoogleGenerativeAIEmbeddings
            return GoogleGenerativeAIEmbeddings(
                model=resolved_model,
                google_api_key=resolved_key,
            )
        elif provider == "openai":
            from langchain_openai import OpenAIEmbeddings
            return OpenAIEmbeddings(
                model=resolved_model,
                api_key=resolved_key,
            )
        elif provider == "nvidia":
            from langchain_nvidia_ai_endpoints import NVIDIAEmbeddings
            return NVIDIAEmbeddings(
                model=resolved_model,
                api_key=resolved_key,
            )
    except Exception as e:
        # Graceful fallback to free local embeddings
        print(f"⚠️  {provider} embeddings failed ({e}). Falling back to HuggingFace.")
        return get_huggingface_embedding()


def get_huggingface_embedding():
    """Free local embeddings — runs on your CPU, no API key needed."""
    from langchain_huggingface import HuggingFaceEmbeddings
    model_name = os.getenv("HF_EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
    return HuggingFaceEmbeddings(model_name=model_name)


def list_providers() -> list[dict]:
    """Return list of all supported providers with their info."""
    result = []
    for name, cfg in PROVIDER_CONFIG.items():
        result.append({
            "provider": name,
            "env_key": cfg["env_key"],
            "default_model": cfg.get("default_model", ""),
            "supports_embeddings": cfg.get("supports_embeddings", False),
            "default_embedding": cfg.get("default_embedding", ""),
            "has_base_url": "base_url" in cfg or "base_url_env" in cfg,
        })
    return result
