import { useState, useEffect } from 'react';
import { vocabAPI } from '../api';
import { useTTS } from '../hooks/useTTS';

export default function Vocabulary() {
  const [words, setWords] = useState([]);
  const [total, setTotal] = useState(0);
  const [level, setLevel] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const { speak, speaking } = useTTS();
  const LIMIT = 20;

  useEffect(() => {
    setPage(0);
  }, [level, search]);

  useEffect(() => {
    loadVocab();
  }, [level, page]);

  const loadVocab = async () => {
    setLoading(true);
    const data = await vocabAPI.list({ level: level || undefined, limit: LIMIT, offset: page * LIMIT });
    setWords(data.words);
    setTotal(data.total);
    setLoading(false);
  };

  const filtered = search
    ? words.filter(w =>
        w.japanese.includes(search) ||
        w.kana.includes(search) ||
        w.romaji.toLowerCase().includes(search.toLowerCase()) ||
        w.english.toLowerCase().includes(search.toLowerCase())
      )
    : words;

  return (
    <div>
      <div className="page-header">
        <h2>単語帳 — Vocabulary</h2>
        <p>{total} words across N5–N3</p>
        <div className="page-tabs">
          {[['', 'All'], ['N5','N5'], ['N4','N4'], ['N3','N3']].map(([v, l]) => (
            <button key={l} className={`page-tab ${level === v ? 'active' : ''}`} onClick={() => setLevel(v)}>{l}</button>
          ))}
        </div>
      </div>

      <div className="page-body">
        <div style={{ marginBottom: 20 }}>
          <input
            type="text" placeholder="Search Japanese, kana, romaji, or English..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', maxWidth: 400 }}
          />
        </div>

        <div style={{ background: 'var(--paper-card)', border: '1px solid rgba(26,20,16,0.08)', borderRadius: 14, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-muted)' }}>
              <span className="pulse">読み込み中... Loading</span>
            </div>
          ) : (
            <table className="vocab-table">
              <thead>
                <tr>
                  <th>Japanese</th>
                  <th>Reading</th>
                  <th>English</th>
                  <th>Type</th>
                  <th>Level</th>
                  <th>Example</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(w => (
                  <tr key={w.id}>
                    <td><span className="vocab-jp">{w.japanese}</span></td>
                    <td>
                      <div style={{ fontSize: 14 }}>{w.kana}</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>{w.romaji}</div>
                    </td>
                    <td style={{ fontWeight: 500 }}>{w.english}</td>
                    <td><span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{w.part_of_speech}</span></td>
                    <td><span className={`badge badge-${w.jlpt_level?.toLowerCase()}`}>{w.jlpt_level}</span></td>
                    <td>
                      {w.example_jp && (
                        <div style={{ fontSize: 12, color: 'var(--ink-muted)', maxWidth: 200 }}>
                          <div>{w.example_jp}</div>
                          <div style={{ color: 'var(--ink-faint)' }}>{w.example_en}</div>
                        </div>
                      )}
                    </td>
                    <td>
                      <button className={`tts-btn ${speaking ? 'speaking' : ''}`} onClick={() => speak(w.japanese)}>
                        <i className="ti ti-volume" /> 聞く
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!search && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
            <button className="btn btn-ghost" onClick={() => setPage(p => Math.max(0, p-1))} disabled={page === 0}>
              <i className="ti ti-arrow-left" /> Prev
            </button>
            <span style={{ padding: '8px 16px', fontSize: 13, color: 'var(--ink-muted)' }}>
              Page {page + 1} of {Math.ceil(total / LIMIT)}
            </span>
            <button className="btn btn-ghost" onClick={() => setPage(p => p+1)} disabled={(page + 1) * LIMIT >= total}>
              Next <i className="ti ti-arrow-right" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
