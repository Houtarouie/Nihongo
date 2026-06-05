import { useState } from 'react';
import Dashboard from './pages/Dashboard.jsx';
import Flashcards from './pages/Flashcards.jsx';
import Vocabulary from './pages/Vocabulary.jsx';
import Exam from './pages/Exam.jsx';
import Chat from './pages/Chat.jsx';
import Chat from './pages/Chat.jsx';
import ImportDeck from './pages/ImportDeck.jsx';
const PAGES = [
  { id: 'dashboard', label: 'Dashboard', icon: 'ti-home', jp: 'ホーム' },
  { id: 'flashcards', label: 'Flashcards', icon: 'ti-cards', jp: 'カード' },
  { id: 'vocabulary', label: 'Vocabulary', icon: 'ti-book', jp: '単語帳' },
  { id: 'exam', label: 'JLPT Exam', icon: 'ti-pencil', jp: '試験' },
  { id: 'chat', label: 'Chat Sensei', icon: 'ti-messages', jp: '先生' },
  { id: 'importdeck', label: 'Import Deck', icon: 'ti-upload', jp: '取込' },
];

const PAGE_MAP = {
  dashboard: Dashboard,
  flashcards: Flashcards,
  vocabulary: Vocabulary,
  exam: Exam,
  chat: Chat,
  importdeck: ImportDeck
};

export default function App() {
  const [page, setPage] = useState('dashboard');
  const Page = PAGE_MAP[page];

  return (
    <div className="layout">
      <nav className="sidebar">
        <div className="sidebar-logo">
          <h1>日本語</h1>
          <p>NIHONGO STUDY</p>
        </div>
        <div className="sidebar-nav">
          {PAGES.map(p => (
            <a key={p.id} className={`nav-item ${page === p.id ? 'active' : ''}`} onClick={() => setPage(p.id)}>
              <i className={`ti ${p.icon}`} />
              <span>{p.label}</span>
            </a>
          ))}
        </div>
        <div className="sidebar-footer">
          <span>N5 → N1 · JLPT Prep</span>
        </div>
      </nav>

      <main className="main-content">
        <Page />
      </main>
    </div>
  );
}
