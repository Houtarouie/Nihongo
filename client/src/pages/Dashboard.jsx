import { useState, useEffect } from 'react';
import { flashcardAPI, examAPI } from '../api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    flashcardAPI.stats().then(setStats).catch(() => {});
    examAPI.history().then(setHistory).catch(() => {});
  }, []);

  const avgScore = history.length
    ? Math.round(history.reduce((a, h) => a + (h.score / h.total * 100), 0) / history.length)
    : null;

  return (
    <div>
      <div className="page-header">
        <h2>ようこそ — Dashboard</h2>
        <p>Your Japanese learning journey</p>
      </div>
      <div className="page-body">

        <div className="stat-grid" style={{ marginBottom: 28 }}>
          <div className="stat-card">
            <div className="stat-label">Total words</div>
            <div className="stat-val">{stats?.total ?? '—'}</div>
            <div className="stat-sub">in your deck</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Due today</div>
            <div className="stat-val" style={{ color: (stats?.due_today ?? 0) > 0 ? '#c0392b' : '#1a7a6e' }}>
              {stats?.due_today ?? '—'}
            </div>
            <div className="stat-sub">cards to review</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Known words</div>
            <div className="stat-val">{stats?.known ?? '—'}</div>
            <div className="stat-sub">mastered</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Exam avg</div>
            <div className="stat-val">{avgScore != null ? `${avgScore}%` : '—'}</div>
            <div className="stat-sub">{history.length} attempts</div>
          </div>
        </div>

        {/* Progress breakdown */}
        {stats && (
          <div className="card" style={{ padding: 22, marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Flashcard progress</h3>
            {[
              { label: 'New', val: stats.new_count, color: '#8a7a6e' },
              { label: 'Learning', val: stats.learning, color: '#e67e22' },
              { label: 'Reviewing', val: stats.reviewing, color: '#2980b9' },
              { label: 'Known', val: stats.known, color: '#1a7a6e' },
            ].map(s => (
              <div key={s.label} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span style={{ color: 'var(--ink-light)' }}>{s.label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: s.color }}>{s.val}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${stats.total > 0 ? s.val / stats.total * 100 : 0}%`, background: s.color }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recent exams */}
        {history.length > 0 && (
          <div className="card" style={{ padding: 22 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>Recent exams</h3>
            {history.slice(0, 5).map(a => (
              <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(26,20,16,0.06)' }}>
                <div>
                  <span className={`badge badge-${a.level.toLowerCase()}`} style={{ marginRight: 8 }}>{a.level}</span>
                  <span style={{ fontSize: 13, color: 'var(--ink-muted)', textTransform: 'capitalize' }}>{a.section}</span>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 600, color: a.score / a.total >= 0.7 ? 'var(--teal)' : 'var(--red)' }}>
                  {Math.round(a.score / a.total * 100)}%
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Getting started if fresh */}
        {stats?.total === 0 && (
          <div className="card" style={{ padding: 32, textAlign: 'center', borderStyle: 'dashed' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎌</div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, marginBottom: 8 }}>始めましょう — Let's get started!</h3>
            <p style={{ color: 'var(--ink-muted)', fontSize: 14 }}>Head to Flashcards to start reviewing vocabulary, or try the JLPT Exam to test your level.</p>
          </div>
        )}
      </div>
    </div>
  );
}
