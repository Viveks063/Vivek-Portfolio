import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { buildKnowledgeBase } from './rag.js';

const app = express();
const port = Number(process.env.PORT || 8787);
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: '1mb' }));

let kb = null;
let kbInitError = null;

async function initialize() {
  try {
    kb = await buildKnowledgeBase();
    kbInitError = null;
    console.log('✅ RAG index initialized');
  } catch (error) {
    kbInitError = error;
    console.error('❌ Failed to initialize RAG index:', error?.message || error);
  }
}

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    ragReady: !!kb && !kbInitError,
    error: kbInitError ? String(kbInitError.message || kbInitError) : null,
  });
});

app.post('/chat', async (req, res) => {
  console.log("CHAT ENDPOINT HIT");
  try {
    if (kbInitError || !kb) {
      return res.status(503).json({
        answer: "I don't have that information yet",
        error: kbInitError?.message || 'Knowledge base not initialized.',
      });
    }

    const message = typeof req.body?.message === 'string' ? req.body.message : '';
    if (!message.trim()) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    console.log("MESSAGE:", message);
    const answer = await kb.answer(message);
    console.log("ANSWER FROM KB:", answer);
    res.json({ answer });
  } catch (error) {
    console.error("❌ Chat endpoint error:", error?.message);
    res.status(500).json({
      answer: "Sorry, I ran into an error. Please try again.",
      error: error?.message || 'Internal server error',
    });
  }
});

// Start server FIRST, then initialize KB in background
const server = app.listen(port, () => {
  console.log(`🚀 Chat backend running on http://localhost:${port}`);
  // Initialize after server is already listening
  initialize();
});

// Keep process alive and handle errors
server.on('error', (err) => {
  console.error('❌ Server error:', err.message);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught exception:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled rejection:', reason);
});