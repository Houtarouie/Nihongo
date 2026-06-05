import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { examAPI } from '../api';

const LEVELS = ['N5', 'N4', 'N3'];
const SECTIONS = ['vocabulary', 'grammar', 'reading'];

export default function Exam() {
  const [tab, setTab] = useState('take'); // take | history
  const [level, setLevel] = useState('N5');
  const [section, setSection] = useState('all');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (tab === 'history') loadHistory();
  }, [tab]);

  const loadHistory = async () => {
    const h = await examAPI.history();
    setHistory(h);
  };

  const startExam = async () => {
    setLoading(true);
    const params = { level, limit: 10 };
    if (section !== 'all') params.section = section;
    const qs = await examAPI.questions(params);
    setQuestions(qs);
    setAnswers({});
    setSubmitted(false);
    setResult(null);
    setStarted(true);
    setLoading(false);
  };

  const selectAnswer = (qid, opt) => {
    if (submitted) return;
    setAnswers(a => ({ ...a, [qid]: opt }));
  };

  const submitExam = async () => {
    const payload = questions.map(q => ({ question_id: q.id, selected: answers[q.id] || null }));
    const res = await examAPI.submit({ level, section: section === 'all' ? undefined : section, answers: payload });
    setResult(res);
    setSubmitted(true);
  };

  const resetExam = () => { setStarted(false); setQuestions([]); setAnswers({}); setSubmitted(false); setResult(null); };

  const answered = Object.keys(answers).length;

  return (
    <div>
      <div className="page-header">
        <h2>JLPT 試験 — Exam Practice</h2>
        <p>Full-length practice questions dissected with grammar explanations</p>
        <div className="page-tabs">
          <button className={`page-tab ${tab === 'take' ? 'active' : ''}`} onClick={() => setTab('take')}>Take Exam</button>
          <button className={`page-tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>History</button>
        </div>
      </div>

      <div className="page-body">
        {tab === 'take' && (
          <>
            {!started ? (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <div className="card" style={{ padding: 28, maxWidth: 500 }}>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, marginBottom: 20 }}>Configure your exam</h3>

                  <div style={{ marginBottom: 18 }}>
                    <label style={{ fontSize: 12, color: 'var(--ink-muted)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>JLPT Level</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {LEVELS.map(l => (
                        <button key={l} onClick={() => setLevel(l)}
                          style={{ padding: '8px 20px', borderRadius: 8, border: `2px solid ${level === l ? 'var(--ink)' : 'rgba(26,20,16,0.1)'}`, background: level === l ? 'var(--ink)' : 'transparent', color: level === l ? 'white' : 'var(--ink)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500 }}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <label style={{ fontSize: 12, color: 'var(--ink-muted)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Section</label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {['all', ...SECTIONS].map(s => (
                        <button key={s} onClick={() => setSection(s)}
                          style={{ padding: '7px 16px', borderRadius: 8, border: `1.5px solid ${section === s ? 'var(--teal)' : 'rgba(26,20,16,0.1)'}`, background: section === s ? 'var(--teal-light)' : 'transparent', color: section === s ? 'var(--teal)' : 'var(--ink-light)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13, textTransform: 'capitalize' }}>
                          {s === 'all' ? 'All sections' : s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button className="btn btn-primary" onClick={startExam} disabled={loading}>
                    {loading ? <span className="pulse">Loading...</span> : <><i className="ti ti-pencil" /> Start Exam (10 questions)</>}
                  </button>
                </div>

                {/* Level info */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 28 }}>
                  {[
                    { level: 'N5', desc: 'Basic Japanese. ~800 vocab, hiragana, katakana, ~100 kanji.', badge: 'badge-n5' },
                    { level: 'N4', desc: 'Elementary. ~1,500 vocab, ~300 kanji. Simple conversations.', badge: 'badge-n4' },
                    { level: 'N3', desc: 'Intermediate. ~3,700 vocab, ~650 kanji. Everyday situations.', badge: 'badge-n3' },
                  ].map(info => (
                    <div key={info.level} className="card" style={{ padding: 18 }}>
                      <span className={`badge ${info.badge}`} style={{ marginBottom: 8 }}>{info.level}</span>
                      <p style={{ fontSize: 13, color: 'var(--ink-light)', lineHeight: 1.6 }}>{info.desc}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <div>
                {/* Exam header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div>
                    <span className={`badge badge-${level.toLowerCase()}`} style={{ marginRight: 8 }}>{level}</span>
                    <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{answered} / {questions.length} answered</span>
                  </div>
                  {!submitted && (
                    <button className="btn btn-ghost" onClick={resetExam} style={{ fontSize: 13 }}>
                      <i className="ti ti-x" /> Cancel
                    </button>
                  )}
                </div>

                <div className="progress-bar" style={{ marginBottom: 24 }}>
                  <div className="progress-fill" style={{ width: `${(answered / questions.length) * 100}%` }} />
                </div>

                {/* Results banner */}
                <AnimatePresence>
                  {submitted && result && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                      style={{ background: result.percentage >= 70 ? 'var(--teal-light)' : 'var(--red-light)', border: `1.5px solid ${result.percentage >= 70 ? 'var(--teal)' : 'var(--red)'}`, borderRadius: 12, padding: '16px 20px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 16, color: result.percentage >= 70 ? 'var(--teal)' : 'var(--red)' }}>
                          {result.percentage >= 70 ? '合格 Pass!' : '不合格 — Keep studying!'} {result.score}/{result.total} correct ({result.percentage}%)
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--ink-muted)', marginTop: 2 }}>Explanations shown below each question</div>
                      </div>
                      <button className="btn btn-ghost" onClick={resetExam}><i className="ti ti-refresh" /> New Exam</button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Questions */}
                {questions.map((q, qi) => {
                  const selected = answers[q.id];
                  const detail = result?.detailed?.find(d => d.question_id === q.id);
                  return (
                    <motion.div key={q.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: qi * 0.05 }}
                      className="question-card">
                      <div className="q-number">
                        Question {qi + 1} · <span style={{ textTransform: 'capitalize' }}>{q.section}</span>
                        {q.grammar_point && <span style={{ marginLeft: 8, color: 'var(--gold)' }}>— {q.grammar_point}</span>}
                      </div>
                      <div className="q-text">{q.question_text}</div>
                      <div className="q-options">
                        {['A','B','C','D'].map(opt => {
                          const text = q[`option_${opt.toLowerCase()}`];
                          if (!text) return null;
                          let cls = '';
                          if (submitted && detail) {
                            if (opt === q.correct_option) cls = 'correct';
                            else if (opt === selected && opt !== q.correct_option) cls = 'wrong';
                          } else if (selected === opt) cls = 'selected';
                          return (
                            <button key={opt} className={`q-option ${cls} ${submitted ? 'disabled' : ''}`}
                              onClick={() => selectAnswer(q.id, opt)}>
                              <span className="option-letter">{opt}</span>
                              <span>{text}</span>
                              {submitted && opt === q.correct_option && <i className="ti ti-check" style={{ marginLeft: 'auto', color: 'var(--teal)' }} />}
                              {submitted && opt === selected && opt !== q.correct_option && <i className="ti ti-x" style={{ marginLeft: 'auto', color: 'var(--red)' }} />}
                            </button>
                          );
                        })}
                      </div>
                      {submitted && q.explanation && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="q-explanation">
                          <strong>解説 Explanation:</strong> {q.explanation}
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}

                {!submitted && (
                  <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px' }}
                    onClick={submitExam} disabled={answered < questions.length}>
                    {answered < questions.length ? `Answer all questions (${answered}/${questions.length})` : '採点する — Submit & See Results'}
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {tab === 'history' && (
          <div>
            {history.length === 0 ? (
              <p style={{ color: 'var(--ink-muted)' }}>No exam history yet. Take your first exam!</p>
            ) : (
              history.map(a => (
                <div key={a.id} className="card" style={{ padding: 18, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span className={`badge badge-${a.level.toLowerCase()}`} style={{ marginRight: 8 }}>{a.level}</span>
                    <span style={{ fontSize: 13, color: 'var(--ink-muted)', textTransform: 'capitalize' }}>{a.section}</span>
                    <div style={{ fontSize: 13, color: 'var(--ink-muted)', marginTop: 4 }}>{new Date(a.taken_at).toLocaleString()}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)', color: a.score / a.total >= 0.7 ? 'var(--teal)' : 'var(--red)' }}>
                      {Math.round(a.score / a.total * 100)}%
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{a.score}/{a.total} correct</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
