import { useState, useEffect } from 'react'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import Sidebar from './components/Sidebar'
import VideoPlayer from './components/VideoPlayer'
import ChatTab from './components/ChatTab'
import QuizTab from './components/QuizTab'
import SummaryTab from './components/SummaryTab'
import TranscriptTab from './components/TranscriptTab'
import { checkHealth } from './services/api'

const TABS = [
  { id: 'chat', label: '💬 Chat' },
  { id: 'quiz', label: '📝 Quiz' },
  { id: 'summary', label: '📋 Summary' },
  { id: 'transcript', label: '📜 Transcript' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('chat')
  const [videoState, setVideoState] = useState({
    processed: false,
    videoId: null,
    transcriptSource: '',
    numChunks: 0,
    wordCount: 0,
  })
  const [config, setConfig] = useState({
    llmProvider: 'google',
    llmModel: '',
    llmApiKey: '',
    embeddingProvider: 'google',
    embeddingModel: '',
    embeddingApiKey: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [backendUp, setBackendUp] = useState(false)

  useEffect(() => {
    checkHealth()
      .then(() => setBackendUp(true))
      .catch(() => setBackendUp(false))
  }, [])

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar
        videoState={videoState}
        setVideoState={setVideoState}
        config={config}
        setConfig={setConfig}
        loading={loading}
        setLoading={setLoading}
        setError={setError}
      />

      {/* Main */}
      <div className="flex-1 p-6 overflow-x-hidden">
        {/* Title */}
        <div className="bg-gradient-to-r from-primary to-dark-600 rounded-2xl p-6 text-center mb-6 shadow-xl shadow-primary/30">
          <h1 className="text-3xl font-bold text-white">🎬 YouTube Video Chatbot Pro</h1>
          <p className="text-sm text-white/80 mt-1">
            Chat • Summarize • Quiz • Learn — Multi-Provider RAG
          </p>
        </div>

        {/* Backend status banner */}
        {!backendUp && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 mb-4 flex items-center gap-2">
            <AlertCircle size={18} className="text-red-400" />
            <span className="text-sm">
              Backend not running. Start it with: <code className="bg-black/30 px-1 rounded">cd backend && uvicorn main:app --reload</code>
            </span>
          </div>
        )}
        {backendUp && videoState.processed && (
          <div className="bg-green-500/20 border border-green-500 rounded-lg p-3 mb-4 flex items-center gap-2">
            <CheckCircle size={18} className="text-green-400" />
            <span className="text-sm">
              Video loaded via <b>{videoState.transcriptSource}</b> — {videoState.numChunks} chunks, {videoState.wordCount} words
            </span>
          </div>
        )}
        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 mb-4 flex items-center gap-2">
            <AlertCircle size={18} className="text-red-400" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Video player */}
        {videoState.processed && videoState.videoId && (
          <VideoPlayer videoId={videoState.videoId} />
        )}

        {/* Tabs */}
        {videoState.processed ? (
          <>
            <div className="flex gap-2 mt-6 mb-4">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-2 rounded-t-lg font-medium transition-all ${
                    activeTab === tab.id ? 'tab-active' : 'bg-dark-800 text-gray-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="card">
              {activeTab === 'chat' && <ChatTab config={config} setError={setError} />}
              {activeTab === 'quiz' && <QuizTab config={config} setError={setError} />}
              {activeTab === 'summary' && <SummaryTab config={config} setError={setError} />}
              {activeTab === 'transcript' && <TranscriptTab setError={setError} />}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <h2 className="text-2xl mb-3">👋 Welcome to YouTube Chatbot Pro</h2>
            <p className="text-gray-400 mb-6">
              Paste a YouTube URL in the sidebar and click <b>🚀 Process Video</b> to begin
            </p>
            <div className="card max-w-md mx-auto text-left">
              <h3 className="text-lg mb-3">✨ Features</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>💬 Chat with any video using RAG</li>
                <li>📝 Auto-generate MCQ quizzes with grading</li>
                <li>📋 Structured summaries & key topics</li>
                <li>📜 Full timestamped transcript</li>
                <li>🎙️ Whisper AI fallback for videos without captions</li>
                <li>🔄 Multi-provider: Google, NVIDIA, OpenAI, Groq, Anthropic</li>
              </ul>
            </div>
          </div>
        )}

        {loading && (
          <div className="fixed bottom-6 right-6 bg-dark-700 px-4 py-3 rounded-lg shadow-xl flex items-center gap-2">
            <Loader2 className="animate-spin text-primary" size={20} />
            <span className="text-sm">Processing...</span>
          </div>
        )}
      </div>
    </div>
  )
}
