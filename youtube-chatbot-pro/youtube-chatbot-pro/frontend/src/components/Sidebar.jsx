import { useState } from 'react'
import { Rocket, Settings, Key, Database, Mic } from 'lucide-react'
import { processVideo } from '../services/api'

const PROVIDERS = [
  { value: 'google', label: 'Google Gemini', defaultModel: 'gemini-2.0-flash' },
  { value: 'openai', label: 'OpenAI', defaultModel: 'gpt-4o-mini' },
  { value: 'nvidia', label: 'NVIDIA NIM', defaultModel: 'meta/llama-3.3-70b-instruct' },
  { value: 'groq', label: 'Groq (free)', defaultModel: 'llama-3.3-70b-versatile' },
  { value: 'anthropic', label: 'Anthropic Claude', defaultModel: 'claude-3-5-haiku-20241022' },
  { value: 'custom', label: 'Custom (OpenAI-compatible)', defaultModel: '' },
]

export default function Sidebar({ videoState, setVideoState, config, setConfig, loading, setLoading, setError }) {
  const [videoUrl, setVideoUrl] = useState('')
  const [transcriptMode, setTranscriptMode] = useState('auto')
  const [whisperModel, setWhisperModel] = useState('base')
  const [chunkSize, setChunkSize] = useState(1000)
  const [chunkOverlap, setChunkOverlap] = useState(200)

  const handleProcess = async () => {
    if (!videoUrl.trim()) {
      setError('Please paste a YouTube URL first')
      return
    }
    setLoading(true)
    setError('')
    try {
      const result = await processVideo({
        video_url: videoUrl,
        transcript_mode: transcriptMode,
        whisper_model: whisperModel,
        chunk_size: chunkSize,
        chunk_overlap: chunkOverlap,
        llm_provider: config.llmProvider,
        llm_model: config.llmModel || undefined,
        llm_api_key: config.llmApiKey || undefined,
        embedding_provider: config.embeddingProvider,
        embedding_model: config.embeddingModel || undefined,
        embedding_api_key: config.embeddingApiKey || undefined,
      })
      setVideoState({
        processed: true,
        videoId: result.video_id,
        transcriptSource: result.transcript_source,
        numChunks: result.num_chunks,
        wordCount: result.word_count,
      })
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to process video')
    } finally {
      setLoading(false)
    }
  }

  return (
    <aside className="w-96 min-h-screen p-5 bg-gradient-to-b from-dark-800 to-dark-700 border-r-2 border-primary overflow-y-auto">
      <h2 className="text-xl font-bold mb-5 flex items-center gap-2">
        🎬 Control Panel
      </h2>

      {/* ---- API Keys ---- */}
      <section className="mb-6">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-primary">
          <Key size={14} /> LLM Provider & API Key
        </h3>

        <label className="text-xs text-gray-400">Provider</label>
        <select
          className="input mb-2 text-sm"
          value={config.llmProvider}
          onChange={e => setConfig({ ...config, llmProvider: e.target.value, llmModel: '' })}
        >
          {PROVIDERS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>

        <label className="text-xs text-gray-400">Model (optional — uses default if blank)</label>
        <input
          type="text"
          className="input mb-2 text-sm"
          placeholder={PROVIDERS.find(p => p.value === config.llmProvider)?.defaultModel || 'model name'}
          value={config.llmModel}
          onChange={e => setConfig({ ...config, llmModel: e.target.value })}
        />

        <label className="text-xs text-gray-400">API Key (leave blank to use .env)</label>
        <input
          type="password"
          className="input text-sm"
          placeholder="paste key here..."
          value={config.llmApiKey}
          onChange={e => setConfig({ ...config, llmApiKey: e.target.value })}
        />
      </section>

      {/* ---- Embeddings ---- */}
      <section className="mb-6">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-primary">
          <Database size={14} /> Embedding Provider
        </h3>
        <select
          className="input mb-2 text-sm"
          value={config.embeddingProvider}
          onChange={e => setConfig({ ...config, embeddingProvider: e.target.value, embeddingModel: '' })}
        >
          <option value="google">Google (default — most stable)</option>
          <option value="openai">OpenAI</option>
          <option value="nvidia">NVIDIA</option>
          <option value="huggingface">HuggingFace (FREE, local)</option>
        </select>
        <input
          type="text"
          className="input text-sm"
          placeholder="Embedding model (optional)"
          value={config.embeddingModel}
          onChange={e => setConfig({ ...config, embeddingModel: e.target.value })}
        />
        <p className="text-xs text-gray-500 mt-1">
          💡 If a provider doesn't support embeddings, HuggingFace is used automatically (free).
        </p>
      </section>

      {/* ---- Video URL ---- */}
      <section className="mb-6">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-primary">
          🎬 YouTube URL
        </h3>
        <input
          type="text"
          className="input text-sm"
          placeholder="https://youtube.com/watch?v=..."
          value={videoUrl}
          onChange={e => setVideoUrl(e.target.value)}
        />
      </section>

      {/* ---- Transcript Source ---- */}
      <section className="mb-6">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-primary">
          <Mic size={14} /> Transcript Source
        </h3>
        <select
          className="input mb-2 text-sm"
          value={transcriptMode}
          onChange={e => setTranscriptMode(e.target.value)}
        >
          <option value="auto">Auto (YouTube → Whisper fallback)</option>
          <option value="youtube">YouTube captions only (faster)</option>
          <option value="whisper">Whisper AI only (any video)</option>
        </select>

        {transcriptMode !== 'youtube' && (
          <>
            <label className="text-xs text-gray-400">Whisper Model Size</label>
            <select
              className="input text-sm"
              value={whisperModel}
              onChange={e => setWhisperModel(e.target.value)}
            >
              <option value="tiny">tiny (fastest, lowest quality)</option>
              <option value="base">base (good balance)</option>
              <option value="small">small (better accuracy)</option>
              <option value="medium">medium (slow, accurate)</option>
              <option value="large">large (best, slowest)</option>
            </select>
          </>
        )}
      </section>

      {/* ---- Chunking ---- */}
      <section className="mb-6">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-primary">
          <Settings size={14} /> Chunking
        </h3>
        <label className="text-xs text-gray-400">Chunk Size: {chunkSize}</label>
        <input type="range" min="500" max="2000" step="100"
          value={chunkSize}
          onChange={e => setChunkSize(Number(e.target.value))}
          className="w-full mb-2"
        />
        <label className="text-xs text-gray-400">Chunk Overlap: {chunkOverlap}</label>
        <input type="range" min="50" max="400" step="50"
          value={chunkOverlap}
          onChange={e => setChunkOverlap(Number(e.target.value))}
          className="w-full"
        />
      </section>

      {/* ---- Process Button ---- */}
      <button
        onClick={handleProcess}
        disabled={loading}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        <Rocket size={16} />
        {loading ? 'Processing...' : '🚀 Process Video'}
      </button>

      {/* ---- Status ---- */}
      {videoState.processed && (
        <div className="mt-6 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="text-green-400 text-sm font-medium mb-2">✅ Video Ready</div>
          <div className="text-xs text-gray-300 space-y-1">
            <div>📡 Source: {videoState.transcriptSource}</div>
            <div>📚 Chunks: {videoState.numChunks}</div>
            <div>📝 Words: {videoState.wordCount}</div>
          </div>
        </div>
      )}

      <div className="mt-6 text-xs text-gray-500 text-center">
        Get a free Gemini key at<br />
        <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer"
           className="text-primary hover:underline">
          aistudio.google.com/apikey
        </a>
      </div>
    </aside>
  )
}
