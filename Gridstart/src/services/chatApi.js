const API_BASE = import.meta.env.VITE_CHAT_API_URL || 'http://localhost:8787';

export async function sendChatMessage(message) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to get response from chat server');
  }
  return data.answer || "I don't have that information yet";
}
