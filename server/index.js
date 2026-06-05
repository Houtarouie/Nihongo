import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import db from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama3-8b-8192';

const chatLimiter = rateLimit({ windowMs: 60 * 1000, max: 20, message: { error: 'Too many requests, slow down!' } });

// ─── VOCABULARY ───────────────────────────────────────────────
app.get('/api/vocab', (req, res) => {
  const { level, tag, limit = 50, offset = 0 } = req.query;
  let query = 'SELECT * FROM vocabulary WHERE 1=1';
  const params = [];
  if (level) { query += ' AND jlpt_level = ?'; params.push(level); }
  if (tag) { query += ' AND tags LIKE ?'; params.push(`%${tag}%`); }
  query += ' LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));
  const words = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as c FROM vocabulary' + (level ? ' WHERE jlpt_level = ?' : '')).get(...(level ? [level] : []));
  res.json({ words, total: total.c });
});

app.get('/api/vocab/:id', (req, res) => {
  const word = db.prepare('SELECT * FROM vocabulary WHERE id = ?').get(req.params.id);
  if (!word) return res.status(404).json({ error: 'Not found' });
  res.json(word);
});

// ─── FLASHCARDS (SRS - SuperMemo SM-2) ────────────────────────
app.get('/api/flashcards/due', (req, res) => {
  const { user_id = 'default', limit = 20 } = req.query;

  const allVocab = db.prepare('SELECT id FROM vocabulary').all();
  const hasProgress = db.prepare('SELECT vocab_id FROM flashcard_progress WHERE user_id = ?').all(user_id).map(r => r.vocab_id);
  const missing = allVocab.filter(v => !hasProgress.includes(v.id));
  const initProgress = db.prepare('INSERT INTO flashcard_progress (vocab_id, user_id) VALUES (?, ?)');
  const initMany = db.transaction((ids) => {
  for (const id of ids) {
    console.log(id);
console.log(id.id);
    initProgress.run(id, user_id);
  }
});

console.log(missing);

if (missing.length) initMany(missing);
  const cards = db.prepare(`
    SELECT v.*, fp.id as progress_id, fp.ease_factor, fp.interval, fp.repetitions,
           fp.next_review, fp.status
    FROM vocabulary v
    JOIN flashcard_progress fp ON v.id = fp.vocab_id
    WHERE fp.user_id = ? AND fp.next_review <= date('now')
    ORDER BY fp.next_review ASC, fp.status DESC
    LIMIT ?
  `).all(user_id, Number(limit));
  res.json(cards);
});

app.post('/api/flashcards/review', (req, res) => {
  const { progress_id, quality, user_id = 'default' } = req.body;
  const prog = db.prepare('SELECT * FROM flashcard_progress WHERE id = ?').get(progress_id);
  if (!prog) return res.status(404).json({ error: 'Progress not found' });

  let { ease_factor, interval, repetitions } = prog;

  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * ease_factor);
    repetitions++;
  }

  ease_factor = Math.max(1.3, ease_factor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  const next = new Date();
  next.setDate(next.getDate() + interval);
  const status = repetitions > 2 ? 'known' : quality < 3 ? 'learning' : 'reviewing';

  db.prepare(`
    UPDATE flashcard_progress
    SET ease_factor=?, interval=?, repetitions=?, next_review=?, last_review=date('now'), status=?
    WHERE id=?
  `).run(ease_factor, interval, repetitions, next.toISOString().split('T')[0], status, progress_id);

  res.json({ interval, repetitions, ease_factor, next_review: next.toISOString().split('T')[0] });
});

app.get('/api/flashcards/stats', (req, res) => {
  const { user_id = 'default' } = req.query;
  const stats = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status='new' THEN 1 ELSE 0 END) as new_count,
      SUM(CASE WHEN status='learning' THEN 1 ELSE 0 END) as learning,
      SUM(CASE WHEN status='reviewing' THEN 1 ELSE 0 END) as reviewing,
      SUM(CASE WHEN status='known' THEN 1 ELSE 0 END) as known,
      SUM(CASE WHEN next_review <= date('now') THEN 1 ELSE 0 END) as due_today
    FROM flashcard_progress WHERE user_id=?
  `).get(user_id);
  res.json(stats);
});

// ─── JLPT EXAM ────────────────────────────────────────────────
app.get('/api/exam/questions', (req, res) => {
  const { level = 'N5', section, limit = 10 } = req.query;
  let query = 'SELECT * FROM jlpt_questions WHERE level = ?';
  const params = [level];
  if (section) { query += ' AND section = ?'; params.push(section); }
  query += ' ORDER BY RANDOM() LIMIT ?';
  params.push(Number(limit));
  const questions = db.prepare(query).all(...params);
  res.json(questions);
});

app.get('/api/exam/sections', (req, res) => {
  const { level = 'N5' } = req.query;
  const sections = db.prepare('SELECT DISTINCT section, COUNT(*) as count FROM jlpt_questions WHERE level=? GROUP BY section').all(level);
  res.json(sections);
});

app.post('/api/exam/submit', (req, res) => {
  const { level, section, answers, user_id = 'default' } = req.body;
  let score = 0;
  const detailed = answers.map(a => {
    const q = db.prepare('SELECT * FROM jlpt_questions WHERE id=?').get(a.question_id);
    const correct = q && q.correct_option === a.selected;
    if (correct) score++;
    return { ...a, correct, correct_option: q?.correct_option, explanation: q?.explanation, question_text: q?.question_text };
  });

  db.prepare('INSERT INTO exam_attempts (user_id, level, section, score, total, answers) VALUES (?,?,?,?,?,?)').run(
    user_id, level, section || 'mixed', score, answers.length, JSON.stringify(detailed)
  );

  res.json({ score, total: answers.length, percentage: Math.round(score / answers.length * 100), detailed });
});

app.get('/api/exam/history', (req, res) => {
  const { user_id = 'default' } = req.query;
  const attempts = db.prepare('SELECT * FROM exam_attempts WHERE user_id=? ORDER BY taken_at DESC LIMIT 20').all(user_id);
  res.json(attempts.map(a => ({ ...a, answers: JSON.parse(a.answers) })));
});

// ─── CHAT (Groq - Llama3) ─────────────────────────────────────
app.post('/api/chat', chatLimiter, async (req, res) => {
  const { messages } = req.body;

  const systemPrompt = `You are Sensei, an expert Japanese language tutor with deep knowledge of JLPT N5–N1.

Your teaching style:
- Explain grammar clearly with Japanese examples + romaji + English translation
- Always write Japanese in both kanji/kana AND romaji for beginners
- Point out common mistakes and how to avoid them
- Use mnemonics and memory tricks when helpful
- Connect vocabulary to JLPT levels (mention if a word/grammar is N5, N4, N3, etc.)
- Keep responses focused and educational — not too long
- Encourage the learner warmly
- When giving example sentences, always provide: Japanese → romaji → English

Format responses clearly. Use line breaks between examples. If asked to quiz, create a simple question.`;

  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.slice(-12)
        ],
        stream: true,
        max_tokens: 1024,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const err = await response.text();
      res.write(`data: ${JSON.stringify({ error: err })}\n\n`);
      res.end();
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
      for (const line of lines) {
        const data = line.slice(6).trim();
        if (data === '[DONE]') {
          res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
          continue;
        }
        try {
          const parsed = JSON.parse(data);
          const text = parsed.choices?.[0]?.delta?.content;
          if (text) res.write(`data: ${JSON.stringify({ text })}\n\n`);
        } catch {}
      }
    }
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

// ─── TTS config ───────────────────────────────────────────────
app.get('/api/tts/voices', (req, res) => {
  res.json({ lang: 'ja-JP', rate: 0.85, pitch: 1.0, preferredVoices: ['Google 日本語', 'Microsoft Haruka', 'O-Ren'] });
});

app.listen(PORT, () => console.log(`🎌 Nihongo API running on http://localhost:${PORT}`));
