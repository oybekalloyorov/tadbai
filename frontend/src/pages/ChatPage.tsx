import { FormEvent, useEffect, useRef, useState } from 'react';
import { chatApi } from '../api/endpoints';
import { ChatMessage } from '../api/types';
import { extractErrorMessage } from '../api/client';

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setError('');
    setMessages((m) => [...m, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);

    try {
      const response = await chatApi.sendMessage(text, conversationId);
      setConversationId(response.conversationId);
      setMessages((m) => [...m, { role: 'assistant', content: response.reply }]);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="page-title">🤖 AI moliyaviy maslahatchi</h1>
      <p className="page-subtitle">Moliyaviy savodxonlik, kredit va soliq bo'yicha savollaringizni bering</p>

      <div className="card">
        <div className="chat-window">
          {messages.length === 0 && (
            <p className="empty-state">
              Masalan: "Menda 100 million so'm bor, qaysi biznesga sarmoya kiritsam yaxshi bo'ladi?"
            </p>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`chat-bubble ${m.role}`}>
              {m.content}
            </div>
          ))}
          {loading && <div className="chat-bubble assistant">Yozmoqda...</div>}
          <div ref={bottomRef} />
        </div>

        {error && <div className="alert error">{error}</div>}

        <form onSubmit={handleSubmit} style={{ flexDirection: 'row' }}>
          <input
            style={{ flex: 1 }}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Xabaringizni yozing..."
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim()}>
            Yuborish
          </button>
        </form>
      </div>
    </div>
  );
}
