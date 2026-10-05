import axios from 'axios';

export const API_BASE = '';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
});

/** Convert backend/axios errors into a single user friendly message. */
export function errorMessage(error) {
  if (error.response) {
    const detail = error.response.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) return detail.map((d) => d.msg || String(d)).join(' ');
    return `Request failed with status ${error.response.status}.`;
  }
  if (error.request) {
    return 'Cannot reach the backend server. Make sure FastAPI is running on http://127.0.0.1:8000.';
  }
  return error.message || 'Something went wrong.';
}

export const api = {
  health: () => client.get('/health'),

  stats: () => client.get('/api/stats'),

  languages: () => client.get('/api/tts/languages'),

  textToSpeech: (payload) => client.post('/api/tts', payload),

  speechToText: (formData) =>
    client.post('/api/stt', formData, { timeout: 120000, headers: { 'Content-Type': 'multipart/form-data' } }),

  assistant: (payload) => client.post('/api/assistant', payload),

  assistantCommands: () => client.get('/api/assistant/commands'),

  history: (params = {}) => client.get('/api/history', { params }),

  deleteHistoryItem: (id) => client.delete(`/api/history/${id}`),

  clearHistory: (type = 'all') => client.delete('/api/history', { params: { type } }),
};

export default client;
