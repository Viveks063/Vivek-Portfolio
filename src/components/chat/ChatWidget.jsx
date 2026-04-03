import React, { useState } from 'react';
import { BotMessageSquare } from 'lucide-react';
import ChatWindow from './ChatWindow.jsx';
import { sendChatMessage } from '../../services/chatApi.js';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hi! I'm your portfolio assistant. Ask me about projects, skills, resume, or experience.",
    },
  ]);

  const handleSend = async (text) => {
    const userMsg = { id: crypto.randomUUID(), role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    try {
      const answer = await sendChatMessage(text);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: answer },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: "I don't have that information yet",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ChatWindow
        isOpen={isOpen}
        messages={messages}
        loading={loading}
        onSend={handleSend}
        onClose={() => setIsOpen(false)}
      />
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-[10020] w-16 h-16 rounded-full bg-[#ff1801] text-white shadow-[0_15px_40px_rgba(255,24,1,0.45)] hover:scale-105 active:scale-95 transition-transform border border-white/20 flex items-center justify-center"
        aria-label="Open AI chat assistant"
      >
        <BotMessageSquare size={28} />
      </button>
    </>
  );
}
