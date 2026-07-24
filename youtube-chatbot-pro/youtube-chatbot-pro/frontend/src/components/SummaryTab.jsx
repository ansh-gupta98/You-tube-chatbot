import { useState } from 'react'
import { FileText, Tag, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { generateSummary, extractTopics } from '../services/api'

export default function SummaryTab({ config, setError }) {
  const [summary, setSummary] = useState('')
  const [topics, setTopics] = useState([])
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [loadingTopics, setLoadingTopics] = useState(false)

  const handleSummary = async () => {
    setLoadingSummary(true)
    setError('')
    try {
      const result = await generateSummary({
        llm_provider: config.llmProvider,
        llm_model: config.llmModel || undefined,
        llm_api_key: config.llmApiKey || undefined,
      })
      setSummary(result.summary)
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    } finally {
      setLoadingSummary(false)
    }
  }

  const handleTopics = async () => {
    setLoadingTopics(true)
    setError('')
    try {
      const result = await extractTopics({
        llm_provider: config.llmProvider,
        llm_model: config.llmModel || undefined,
        llm_api_key: config.llmApiKey || undefined,
      })
      setTopics(result.topics)
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    } finally {
      setLoadingTopics(false)
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">📋 Video Summary & Key Topics</h2>
      <p className="text-sm text-gray-400 mb-4">Get an instant structured summary and the main topics covered</p>

      <div className="flex gap-3 mb-6">
        <button onClick={handleSummary} disabled={loadingSummary} className="btn-primary flex items-center gap-2">
          {loadingSummary ? <Loader2 className="animate-spin" size={16} /> : <FileText size={16} />}
          {loadingSummary ? 'Summarizing...' : '📋 Generate Summary'}
        </button>
        <button onClick={handleTopics} disabled={loadingTopics} className="btn-primary flex items-center gap-2">
          {loadingTopics ? <Loader2 className="animate-spin" size={16} /> : <Tag size={16} />}
          {loadingTopics ? 'Extracting...' : '🏷️ Extract Topics'}
        </button>
      </div>

      {topics.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">🏷️ Key Topics</h3>
          <div className="flex flex-wrap">
            {topics.map((t, i) => <span key={i} className="chip">#{t}</span>)}
          </div>
        </div>
      )}

      {summary ? (
        <div>
          <h3 className="text-lg font-semibold mb-2">📋 Structured Summary</h3>
          <div className="card prose prose-invert prose-sm max-w-none">
            <ReactMarkdown>{summary}</ReactMarkdown>
          </div>
        </div>
      ) : (
        !loadingSummary && (
          <div className="text-center text-gray-500 py-8">
            👆 Click "Generate Summary" to get a structured overview of the video
          </div>
        )
      )}
    </div>
  )
}
