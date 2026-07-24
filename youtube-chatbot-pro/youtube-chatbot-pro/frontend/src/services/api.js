import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 300000, // 5 min — Whisper transcription can be slow
})

// ----- Video processing -----
export const processVideo = (payload) => api.post('/process', payload).then(r => r.data)

// ----- Chat -----
export const sendChat = (payload) => api.post('/chat', payload).then(r => r.data)

// ----- Quiz -----
export const generateQuiz = (payload) => api.post('/quiz', payload).then(r => r.data)

// ----- Summary -----
export const generateSummary = (payload) => api.post('/summary', payload).then(r => r.data)

// ----- Topics -----
export const extractTopics = (payload) => api.post('/topics', payload).then(r => r.data)

// ----- Transcript -----
export const getTranscript = () => api.get('/transcript').then(r => r.data)

// ----- Health -----
export const checkHealth = () => api.get('/health').then(r => r.data)

// ----- Providers -----
export const getProviders = () => api.get('/providers').then(r => r.data)

export default api
