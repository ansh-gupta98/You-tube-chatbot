import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { getTranscript } from '../services/api'

function formatTimestamp(seconds) {
  const s = Math.floor(seconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return h > 0 ? `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
              : `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
}

export default function TranscriptTab({ setError }) {
  const [chunks, setChunks] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTranscript()
      .then(data => setChunks(data.chunks))
      .catch(err => setError(err.response?.data?.detail || err.message))
      .finally(() => setLoading(false))
  }, [setError])

  const filtered = search
    ? chunks.filter(c => c.text.toLowerCase().includes(search.toLowerCase()))
    : chunks

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">📜 Full Transcript with Timestamps</h2>
      <p className="text-sm text-gray-400 mb-4">Read the full transcript and jump to specific timestamps</p>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          type="text"
          className="input pl-10"
          placeholder="Type a keyword to filter..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="text-sm text-gray-400 mb-3">
        Total segments: <b className="text-white">{chunks.length}</b>
        {search && <> | Filtered: <b className="text-white">{filtered.length}</b></>}
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-8">Loading transcript...</div>
      ) : (
        <div className="space-y-1 max-h-[600px] overflow-y-auto">
          {filtered.map((chunk, i) => (
            <div
              key={i}
              className="bg-white/5 border-l-2 border-primary rounded p-2 flex gap-3 items-start hover:bg-white/10"
            >
              <a
                href={`https://youtube.com/watch?v=${''}&t=${Math.floor(chunk.start)}s`}
                target="_blank"
                rel="noreferrer"
                className="text-primary font-mono text-sm flex-shrink-0 hover:underline"
              >
                ⏱ {formatTimestamp(chunk.start)}
              </a>
              <span className="text-sm text-gray-200">{chunk.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
