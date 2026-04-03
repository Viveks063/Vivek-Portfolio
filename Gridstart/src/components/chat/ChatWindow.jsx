import React, { useEffect, useRef, useState } from 'react';
import { Send, X } from 'lucide-react';
import ChatMessage from './ChatMessage.jsx';

export default function ChatWindow({
  isOpen,
  messages,
  onSend,
  loading = false,
  onClose,
}) {
  const [input, setInput] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, isOpen]);

  const submit = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    onSend(text);
    setInput('');
  };

  return (
    <div
      className={`fixed bottom-24 right-6 z-[10030] w-[360px] max-w-[calc(100vw-1.5rem)] transition-all duration-300 ${
        isOpen
          ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
          : 'opacity-0 translate-y-3 scale-95 pointer-events-none'
      }`}
    >
      <div className="rounded-3xl overflow-hidden border border-white/10 bg-[#0b0b0d]/95 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <div className="font-syncopate text-[10px] tracking-[0.25em] text-zinc-400 uppercase">
              AI PIT WALL
            </div>
            <div className="text-zinc-100 text-sm mt-1">Portfolio Assistant</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:text-white transition-colors flex items-center justify-center"
          >
            <X size={16} />
          </button>
        </div>

        <div className="h-[360px] overflow-y-auto px-4 py-4 space-y-3">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} role={msg.role} content={msg.content} />
          ))}
          {loading && (
            <div className="text-zinc-400 text-xs px-1">Thinking...</div>
          )}
          <div ref={endRef} />
        </div>

        <form onSubmit={submit} className="p-4 border-t border-white/10 flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about projects, skills, resume..."
            className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#ff1801]/60 transition-colors"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-11 h-11 rounded-full bg-[#ff1801] text-white disabled:opacity-60 disabled:cursor-not-allowed hover:scale-105 transition-transform flex items-center justify-center"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
