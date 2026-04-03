import React from 'react';

export default function ChatMessage({ role, content }) {
  const isUser = role === 'user';
  return (
    <div className={`w-full flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed border ${
          isUser
            ? 'bg-[#ff1801] text-white border-[#ff1801]/80'
            : 'bg-white/5 text-zinc-100 border-white/10'
        }`}
      >
        {content}
      </div>
    </div>
  );
}
