import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { streamChat } from '../api';
import { useTTS } from '../hooks/useTTS';

const QUICK = [
  'こんにちは！Teach me a basic greeting.',
  'Explain は vs が particle difference',
  'How do I conjugate て-form verbs?',
  'Give me N5 practice dialogue',
  'What are the politeness levels in Japanese?',
  'Explain how counting works in Japanese',
];

export default function Chat() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'こんにちは！👋 I\'m your Japanese sensei. Ask me anything — grammar, vocabulary, JLPT prep, or just practice chatting!\n\n何でも聞いてください。(Nandemo kiite kudasai — Please ask me anything.)' }
  ]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const { speak, speaking } = useTTS();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput('');

    const userMsg = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setStreaming(true);

    // Add empty assistant message for streaming
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));
      await streamChat(
        apiMessages,
        (chunk) => {
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              content: updated[updated.length - 1].content + chunk
            };
            return updated;
          });
        },
        () => {
          setStreaming(false);
          // Auto-speak first Japanese text in response
          setMessages(prev => {
            const last = prev[prev.length - 1];
            const jpMatch = last.content.match(/[\u3040-\u30ff\u4e00-\u9fff][\u3040-\u30ff\u4e00-\u9fff\s]+/);
            if (jpMatch && jpMatch[0].length > 2) speak(jpMatch[0].slice(0, 40));
            return prev;
          });
        }
      );
    } catch (e) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1].content = '⚠️ Connection error. Make sure the server is running with your Anthropic API key.';
        return updated;
      });
      setStreaming(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const sendQuick = (text) => { setInput(text); setTimeout(sendMessage, 50); };

  return (
    <div>
      <div className="page-header">
        <h2>先生 — Chat Sensei</h2>
        <p>AI-powered Japanese tutor · powered by Claude</p>
      </div>

      <div className="page-body" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 130px)' }}>
        {/* Quick prompts */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          {QUICK.map(q => (
            <button key={q} className="tts-btn" onClick={() => { setInput(q); }}
              style={{ fontSize: 12 }}>
              {q.length > 35 ? q.slice(0, 35) + '…' : q}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="card chat-messages" style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', marginBottom: 16 }}>
          {messages.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className={`chat-msg ${m.role === 'user' ? 'user' : 'bot'}`}>
              <div className={`msg-avatar ${m.role === 'user' ? 'user-av' : ''}`}>
                {m.role === 'user' ? <i className="ti ti-user" style={{ fontSize: 16 }} /> : '先'}
              </div>
              <div>
                <div className="msg-bubble">
                  {m.content || (streaming && i === messages.length - 1 ? (
                    <span className="pulse" style={{ color: 'var(--ink-muted)' }}>●●●</span>
                  ) : '')}
                </div>
                {m.role === 'assistant' && m.content && (
                  <button className={`tts-btn ${speaking ? 'speaking' : ''}`} style={{ marginTop: 6, fontSize: 11 }}
                    onClick={() => {
                      const jp = m.content.match(/[\u3040-\u30ff\u4e00-\u9fff][\u3040-\u30ff\u4e00-\u9fff\s、。！？]+/);
                      if (jp) speak(jp[0].slice(0, 80));
                    }}>
                    <i className="ti ti-volume" /> Read Japanese
                  </button>
                )}
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="chat-input-area">
          <textarea ref={textareaRef} className="chat-input" rows={2}
            placeholder="Ask in English or Japanese... (Enter to send)"
            value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} />
          <button className="btn btn-primary" onClick={sendMessage} disabled={streaming || !input.trim()}>
            {streaming ? <span className="pulse">…</span> : <><i className="ti ti-send" /> 送信</>}
          </button>
        </div>
      </div>
    </div>
  );
}
