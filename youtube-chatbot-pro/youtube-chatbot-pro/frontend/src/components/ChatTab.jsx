import { useState } from 'react'
import { Send, Trash2, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { sendChat } from '../services/api'

export default function ChatTab({ config, setError }) {
  const [question, setQuestion] = useState('')
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)

  const suggestions = [
    'What is this video about?',
    'Explain the main concept in simple terms',
    'What are the key takeaways?',
    'Give me an example from the video',
  ]

  const ask = async (q) => {
    const questionText = (q ?? question).trim()
    if (!questionText || loading) return

    setLoading(true)
    setError('')
    setQuestion('')
    setHistory(h => [...h, { role: 'user', text: questionText }])

    try {
      const result = await sendChat({
        question: questionText,
        llm_provider: config.llmProvider,
        llm_model: config.llmModel || undefined,
        llm_api_key: config.llmApiKey || undefined,
      })
      setHistory(h => [...h, { role: 'bot', text: result.answer }])
    } catch (err) {
      const msg = err.response?.data?.detail || err.message
      setError(msg)
      setHistory(h => [...h, { role: 'bot', text: `⚠️ Error: ${msg}` }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">💬 Chat with the Video</h2>
      <p className="text-sm text-gray-400 mb-4">
        Ask any question — answers are grounded in the transcript using RAG
      </p>

      {/* Input */}
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          className="input flex-1"
          placeholder="e.g. What is the main topic discussed at the beginning?"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && ask()}
          disabled={loading}
        />
        <button onClick={() => ask()} disabled={loading} className="btn-primary px-4">
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
        </button>
      </div>

      {/* Suggestions */}
      <div className="flex flex-wrap gap-2 mb-4">
        {suggestions.map(s => (
          <button
            key={s}
            onClick={() => ask(s)}
            disabled={loading}
            className="chip hover:scale-105 transition-transform"
          >
            {s}
          </button>
        ))}
      </div>

      {/* History */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {history.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            💡 Ask your first question above to start chatting with the video!
          </div>
        )}
        {history.map((msg, i) => (
          <div key={i} className={msg.role === 'user' ? 'user-bubble' : 'bot-bubble'}>
            <div className="text-xs opacity-70 mb-1">
              {msg.role === 'user' ? '🧑 You' : '🤖 AI Tutor'}
            </div>
            {msg.role === 'bot'
              ? <ReactMarkdown className="prose prose-invert prose-sm max-w-none">{msg.text}</ReactMarkdown>
              : <p className="whitespace-pre-wrap">{msg.text}</p>
            }
          </div>
        ))}
      </div>

      {/* Clear */}
      {history.length > 0 && (
        <button
          onClick={() => setHistory([])}
          className="mt-4 text-sm text-gray-400 hover:text-red-400 flex items-center gap-1"
        >
          <Trash2 size={14} /> Clear Chat
        </button>
      )}
    </div>
  )
}
