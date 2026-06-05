import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { flashcardAPI } from '../api';
import { useTTS } from '../hooks/useTTS';

const QUALITY = [
  { key: 'again', label: 'Again', sub: '<1d', cls: 'srs-again', q: 0 },
  { key: 'hard',  label: 'Hard',  sub: '~1d', cls: 'srs-hard',  q: 1 },
  { key: 'good',  label: 'Good',  sub: '~3d', cls: 'srs-good',  q: 3 },
  { key: 'easy',  label: 'Easy',  sub: '~7d', cls: 'srs-easy',  q: 5 },
];

export default function Flashcards() {
  const [cards, setCards] = useState([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionDone, setSessionDone] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [levelFilter, setLevelFilter] = useState('all');
  const { speak, speaking } = useTTS();

  const loadCards = useCallback(async () => {
    setLoading(true);
    try {
      const [due, st] = await Promise.all([
        flashcardAPI.getDue({ limit: 30 }),
        flashcardAPI.stats(),
      ]);
      let filtered = due;
      if (levelFilter !== 'all') filtered = due.filter(c => c.jlpt_level === levelFilter);
      setCards(filtered);
      setStats(st);
      setIdx(0);
      setFlipped(false);
      setSessionDone(filtered.length === 0);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [levelFilter]);

  useEffect(() => { loadCards(); }, [loadCards]);

  const card = cards[idx];

  const handleFlip = () => setFlipped(f => !f);

  const handleRate = async (q) => {
    if (!card) return;
    try {
      await flashcardAPI.review({ progress_id: card.progress_id, quality: q });
      setReviewed(r => r + 1);
      const next = idx + 1;
      if (next >= cards.length) {
        setSessionDone(true);
      } else {
        setIdx(next);
        setFlipped(false);
      }
    } catch (e) { console.error(e); }
  };

  const handleSpeak = (e) => {
    e?.stopPropagation();
    if (card) speak(card.japanese);
  };

  if (loading) return (
    <div style={{ padding: '40px 32px' }}>
      <div className="stat-grid">
        {[1,2,3,4].map(i => <div key={i} className="stat-card" style={{ height: 80, background: 'rgba(26,20,16,0.04)' }} />)}
      </div>
      <div style={{ height: 300, background: 'rgba(26,20,16,0.04)', borderRadius: 16 }} />
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <h2>フラッシュカード — Flashcards</h2>
        <p>Spaced repetition system (SM-2 algorithm)</p>
        <div className="page-tabs">
          {['all','N5','N4','N3'].map(l => (
            <button key={l} className={`page-tab ${levelFilter===l?'active':''}`} onClick={() => setLevelFilter(l)}>{l}</button>
          ))}
        </div>
      </div>

      <div className="page-body">
        {/* Stats */}
        {stats && (
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-label">Due today</div>
              <div className="stat-val" style={{ color: stats.due_today > 0 ? '#c0392b' : '#1a7a6e' }}>{stats.due_today}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Known</div>
              <div className="stat-val">{stats.known}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Learning</div>
              <div className="stat-val">{stats.learning}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Session reviewed</div>
              <div className="stat-val">{reviewed}</div>
            </div>
          </div>
        )}

        {sessionDone ? (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="card" style={{ padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎌</div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, marginBottom: 8 }}>Session complete!</h3>
            <p style={{ color: 'var(--ink-muted)', marginBottom: 24 }}>You reviewed {reviewed} cards. Come back tomorrow for more.</p>
            <button className="btn btn-primary" onClick={() => { setReviewed(0); loadCards(); }}>
              <i className="ti ti-refresh" /> Reload cards
            </button>
          </motion.div>
        ) : card ? (
          <>
            <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
                {idx + 1} / {cards.length} cards
              </span>
              <span className={`badge badge-${card.jlpt_level?.toLowerCase()}`}>{card.jlpt_level} · {card.part_of_speech}</span>
            </div>

            <div className="progress-bar" style={{ marginBottom: 20 }}>
              <div className="progress-fill" style={{ width: `${(idx / cards.length) * 100}%` }} />
            </div>

            <div className="fc-scene" style={{ marginBottom: 20 }}>
              <div className={`fc-card-wrap ${flipped ? 'flipped' : ''}`} onClick={handleFlip}>
                {/* Front */}
                <div className="fc-face fc-front">
                  <div className="fc-kanji">{card.japanese}</div>
                  <div className="fc-kana">{card.kana}</div>
                  <div className="fc-romaji">{card.romaji}</div>
                  <button className={`tts-btn ${speaking ? 'speaking' : ''}`} style={{ marginTop: 20 }} onClick={handleSpeak}>
                    <i className={`ti ${speaking ? 'ti-volume-off' : 'ti-volume'}`} />
                    {speaking ? 'Speaking...' : '音声を聞く'}
                  </button>
                  <div style={{ position: 'absolute', bottom: 16, fontSize: 12, color: 'var(--ink-faint)' }}>
                    tap to reveal ↓
                  </div>
                </div>
                {/* Back */}
                <div className="fc-face fc-back">
                  <div className="fc-english">{card.english}</div>
                  <div className="fc-kana" style={{ marginTop: 8 }}>{card.japanese} · {card.kana}</div>
                  <div className="fc-romaji">{card.romaji}</div>
                  {card.example_jp && (
                    <div className="fc-example">
                      <div>{card.example_jp}</div>
                      <div style={{ color: 'var(--ink-muted)', fontSize: 13 }}>{card.example_en}</div>
                    </div>
                  )}
                  <button className={`tts-btn ${speaking ? 'speaking' : ''}`} style={{ marginTop: 16 }} onClick={handleSpeak}>
                    <i className="ti ti-volume" /> 音声
                  </button>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {flipped && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <p style={{ fontSize: 12, color: 'var(--ink-muted)', textAlign: 'center', marginBottom: 10 }}>
                    How well did you know this word?
                  </p>
                  <div className="srs-btns">
                    {QUALITY.map(q => (
                      <button key={q.key} className={`srs-btn ${q.cls}`} onClick={() => handleRate(q.q)}>
                        <div>{q.label}</div>
                        <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>{q.sub}</div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : null}
      </div>
    </div>
  );
}
