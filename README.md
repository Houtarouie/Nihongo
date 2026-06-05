# 🎌 日本語 Nihongo — Full-Stack Japanese Learning App

A production-ready Japanese language learning app with SRS flashcards, JLPT exam practice, vocabulary browser, TTS pronunciation, and an AI chat tutor powered by Claude.

---

## Features

- **Flashcards** — SM-2 spaced repetition (same algorithm as Anki), due-card queue, 4-tier SRS rating
- **JLPT Exam Practice** — N5/N4/N3 questions across vocabulary, grammar, reading. Full answer dissection with grammar explanations
- **Vocabulary Browser** — 40+ seed words (easily extensible), searchable, filterable by JLPT level, TTS pronunciation
- **Chat Sensei** — Streaming Claude AI tutor with full conversation context, auto-speaks Japanese responses
- **Dashboard** — Progress tracking, exam history, SRS breakdown

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, Framer Motion, Zustand |
| Backend | Node.js, Express, ES Modules |
| Database | SQLite (better-sqlite3) |
| AI | Anthropic Claude API (streaming SSE) |
| TTS | Web Speech API (browser-native, no cost) |
| Styling | Custom CSS, Noto Sans JP, Shippori Mincho |

---

## Setup & Run

### Prerequisites
- Node.js 18+
- An Anthropic API key (get one at https://console.anthropic.com)

### 1. Install dependencies
```bash
# From project root
cd server && npm install
cd ../client && npm install
```

### 2. Configure environment
```bash
cd server
cp .env.example .env
# Edit .env and add your Anthropic API key:
# ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Run in development

Open two terminals:

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
# API running at http://localhost:3001
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
# App running at http://localhost:5173
```

Open http://localhost:5173 in your browser.

---

## API Endpoints

```
GET  /api/vocab              — List vocabulary (filter by level, tag)
GET  /api/vocab/:id          — Single word

GET  /api/flashcards/due     — SRS due cards
POST /api/flashcards/review  — Submit review (SM-2 update)
GET  /api/flashcards/stats   — Progress stats

GET  /api/exam/questions     — JLPT questions (filter level/section)
GET  /api/exam/sections      — Available sections per level
POST /api/exam/submit        — Submit answers, get scored results
GET  /api/exam/history       — Past exam attempts

POST /api/chat               — Streaming chat (SSE) with Claude
```

---

## Adding More Vocabulary

Edit `server/db.js` — the `seedMany([...])` array. Each row:
```js
['水', 'みず', 'mizu', 'water', 'noun', 'N5', 'お水をください。', 'Please give me water.', 'N5,daily']
// [japanese, kana, romaji, english, part_of_speech, jlpt_level, example_jp, example_en, tags]
```

Delete `server/nihongo.db` and restart to re-seed.

---

## Adding More JLPT Questions

In `server/db.js`, `seedQs([...])` — each row:
```js
['N5', 'grammar', 'question text', 'option A', 'option B', 'option C', 'option D', 'A', 'explanation', 'grammar point']
```

---

## Deploy to Production

### Option 1: Railway (easiest, ~$5/mo)
1. Push to GitHub
2. Create new Railway project → Deploy from GitHub
3. Add `ANTHROPIC_API_KEY` in Railway environment variables
4. Railway auto-detects Node.js and runs `npm start`

For the frontend, either:
- Build and serve via Express: `app.use(express.static('../client/dist'))` + `npm run build:client`
- Or deploy frontend separately on Vercel (free)

### Option 2: VPS (DigitalOcean / Hetzner)
```bash
# On server
git clone your-repo && cd nihongo
cd server && npm install && cp .env.example .env
# Add API key to .env
npm install -g pm2
pm2 start index.js --name nihongo-api
cd ../client && npm install && npm run build
# Serve client/dist with nginx
```

### Option 3: Vercel (frontend) + Railway (backend)
- Backend: Railway with `ANTHROPIC_API_KEY` env var
- Frontend: Vercel, set `VITE_API_URL=https://your-railway-url` in Vercel env, update `vite.config.js` proxy

---

## Extending the App

### Add Google Cloud TTS (higher quality voices)
In `server/index.js`, add a `/api/tts/synthesize` endpoint using `@google-cloud/text-to-speech`. Returns an audio base64 blob. On the client, play via `new Audio(dataUrl).play()`.

### Add user accounts
Replace `user_id: 'default'` with JWT auth. Add a `users` table, `/api/auth/register` and `/api/auth/login` endpoints. Store JWT in localStorage, send as `Authorization: Bearer ...` header.

### Add more JLPT levels (N2, N1)
Add questions to `jlpt_questions` table with `level='N2'` or `level='N1'`. The UI already handles it — just add the levels to the `LEVELS` array in `Exam.jsx`.

### Import from existing Anki decks
Export Anki deck as TSV, write a small Node script to parse and insert into `vocabulary` table.
