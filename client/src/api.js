import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || '';

const api = axios.create({ baseURL: `${BASE}/api` });

export const vocabAPI = {
  list: (params) => api.get('/vocab', { params }).then(r => r.data),
  get: (id) => api.get(`/vocab/${id}`).then(r => r.data),
};

export const flashcardAPI = {
  getDue: (params) => api.get('/flashcards/due', { params }).then(r => r.data),
  review: (data) => api.post('/flashcards/review', data).then(r => r.data),
  stats: (params) => api.get('/flashcards/stats', { params }).then(r => r.data),
};

export const examAPI = {
  questions: (params) => api.get('/exam/questions', { params }).then(r => r.data),
  sections: (params) => api.get('/exam/sections', { params }).then(r => r.data),
  submit: (data) => api.post('/exam/submit', data).then(r => r.data),
  history: (params) => api.get('/exam/history', { params }).then(r => r.data),
};

export async function streamChat(messages, onChunk, onDone) {
  const resp = await fetch(`${BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try {
        const data = JSON.parse(line.slice(6));
        if (data.text) onChunk(data.text);
        if (data.done) onDone();
      } catch {}
    }
  }
}
