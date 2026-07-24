import { useState } from 'react'
import { Brain, CheckCircle, XCircle, RotateCcw, Trophy } from 'lucide-react'
import { generateQuiz } from '../services/api'

export default function QuizTab({ config, setError }) {
  const [numQuestions, setNumQuestions] = useState(5)
  const [difficulty, setDifficulty] = useState('Medium')
  const [quiz, setQuiz] = useState([])
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await generateQuiz({
        num_questions: numQuestions,
        difficulty,
        llm_provider: config.llmProvider,
        llm_model: config.llmModel || undefined,
        llm_api_key: config.llmApiKey || undefined,
      })
      setQuiz(result.questions)
      setAnswers({})
      setSubmitted(false)
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = () => setSubmitted(true)

  const handleReset = () => {
    setAnswers({})
    setSubmitted(false)
  }

  const score = quiz.reduce((acc, q, i) => acc + (answers[i] === q.correct_index ? 1 : 0), 0)
  const pct = quiz.length ? (score / quiz.length) * 100 : 0
  const grade = pct >= 80 ? '🏆 Excellent!' : pct >= 60 ? '👍 Good job!' : pct >= 40 ? '📚 Keep studying!' : '🔄 Review the video again.'

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">📝 MCQ Quiz Generator</h2>
      <p className="text-sm text-gray-400 mb-4">Test your understanding with auto-generated multiple-choice questions</p>

      {/* Controls */}
      <div className="flex flex-wrap items-end gap-4 mb-4">
        <div>
          <label className="text-xs text-gray-400">Questions</label>
          <input type="number" min="3" max="15" value={numQuestions}
            onChange={e => setNumQuestions(Number(e.target.value))}
            className="input w-24" />
        </div>
        <div>
          <label className="text-xs text-gray-400">Difficulty</label>
          <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="input">
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>
        </div>
        <button onClick={handleGenerate} disabled={loading} className="btn-primary flex items-center gap-2">
          <Brain size={16} />
          {loading ? 'Generating...' : '🎯 Generate New Quiz'}
        </button>
        {submitted && (
          <button onClick={handleReset} className="btn-primary flex items-center gap-2">
            <RotateCcw size={16} /> Reset
          </button>
        )}
      </div>

      {/* Quiz Questions */}
      {quiz.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          👆 Click "Generate New Quiz" to create MCQ questions from this video
        </div>
      ) : (
        <>
          <div className="text-sm text-gray-400 mb-4">
            Difficulty: <b className="text-white">{difficulty}</b> | Questions: <b className="text-white">{quiz.length}</b>
          </div>

          {!submitted && (
            <button onClick={handleSubmit} className="btn-primary mb-4">
              ✅ Submit Quiz
            </button>
          )}

          <div className="space-y-4">
            {quiz.map((q, qi) => {
              const userAns = answers[qi]
              const isCorrect = userAns === q.correct_index
              return (
                <div key={qi} className={`card border-l-4 ${submitted ? (isCorrect ? 'border-green-500' : 'border-red-500') : 'border-primary'}`}>
                  <div className="font-semibold mb-3 flex items-start gap-2">
                    {submitted && (isCorrect ? <CheckCircle className="text-green-400 flex-shrink-0" size={18} /> : <XCircle className="text-red-400 flex-shrink-0" size={18} />)}
                    <span>Q{qi+1}. {q.question}</span>
                  </div>
                  <div className="space-y-2 ml-6">
                    {q.options.map((opt, oi) => {
                      const isSelected = userAns === oi
                      const isCorrectOption = q.correct_index === oi
                      let cls = 'p-2 rounded border '
                      if (submitted) {
                        if (isCorrectOption) cls += 'bg-green-500/20 border-green-500'
                        else if (isSelected) cls += 'bg-red-500/20 border-red-500'
                        else cls += 'bg-dark-800 border-white/10'
                      } else {
                        cls += isSelected ? 'bg-primary/30 border-primary' : 'bg-dark-800 border-white/10 cursor-pointer hover:border-primary/50'
                      }
                      return (
                        <div key={oi} className={cls} onClick={() => !submitted && setAnswers({ ...answers, [qi]: oi })}>
                          <span className="text-sm">{opt}</span>
                        </div>
                      )
                    })}
                  </div>
                  {submitted && (
                    <div className="mt-3 ml-6 text-sm">
                      <div className="text-gray-300">
                        Your answer: <b>{userAns !== undefined ? String.fromCharCode(65 + userAns) : '—'}</b>
                        {' | '}Correct: <b className="text-green-400">{String.fromCharCode(65 + q.correct_index)}</b>
                      </div>
                      <div className="text-pink-200 mt-1">💡 {q.explanation}</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Results */}
          {submitted && (
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="card text-center">
                <div className="text-2xl font-bold text-green-400">{score}/{quiz.length}</div>
                <div className="text-xs text-gray-400">✅ Correct</div>
              </div>
              <div className="card text-center">
                <div className="text-2xl font-bold text-blue-400">{pct.toFixed(0)}%</div>
                <div className="text-xs text-gray-400">📊 Score</div>
              </div>
              <div className="card text-center">
                <div className="text-2xl"><Trophy className="inline" size={28} /></div>
                <div className="text-xs text-gray-400 mt-1">{grade}</div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
