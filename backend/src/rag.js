import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pdfParse from 'pdf-parse';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const SOURCE_FILES = [
  path.join(projectRoot, 'src', 'pages', 'Home.jsx'),
  path.join(projectRoot, 'src', 'ProjectsSection.tsx'),
  path.join(projectRoot, 'src', 'ContactSection.tsx'),
];
const RESUME_PATH = path.join(projectRoot, 'src', 'assets', 'resume.txt');

const CHAT_MODEL = process.env.GEMINI_CHAT_MODEL || 'gemini-2.0-flash';

let genAI = null;

function cleanText(text) {
  return text
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function chunkText(text, chunkSize = 1000, overlap = 180) {
  const normalized = cleanText(text);
  if (!normalized) return [];
  const chunks = [];
  let cursor = 0;
  while (cursor < normalized.length) {
    const end = Math.min(normalized.length, cursor + chunkSize);
    chunks.push(normalized.slice(cursor, end));
    if (end >= normalized.length) break;
    cursor += chunkSize - overlap;
  }
  return chunks;
}

async function readPortfolioText() {
  const parts = [];
  for (const filePath of SOURCE_FILES) {
    try {
      const raw = await fs.readFile(filePath, 'utf-8');
      const cleaned = raw
        .replace(/<[^>]*>/g, '')
        .replace(/import.*;/g, '')
        .replace(/export.*;/g, '');
      parts.push(`Content from ${path.basename(filePath)}:\n${cleaned}`);
    } catch {
      // ignore missing files
    }
  }
  return parts.join('\n\n');
}

async function readResumeText() {
  // Try plain text first (file is .txt)
  try {
    const raw = await fs.readFile(RESUME_PATH, 'utf-8');
    console.log("✅ Resume read as plain text, length:", raw.length);
    console.log("📄 Resume preview:\n", raw.slice(0, 300));
    return raw;
  } catch (plainErr) {
    console.log("⚠️ Plain text read failed, trying pdf-parse:", plainErr.message);
  }

  // Fallback: try pdf-parse (in case it's actually a PDF despite .txt extension)
  try {
    const file = await fs.readFile(RESUME_PATH);
    const parsed = await pdfParse(file);
    console.log("✅ Resume read as PDF, length:", parsed.text?.length);
    console.log("📄 Resume preview:\n", parsed.text?.slice(0, 300));
    return parsed.text || '';
  } catch (pdfErr) {
    console.error("❌ Both resume read methods failed:", pdfErr.message);
    return '';
  }
}

function parseResumeSections(resumeText) {
  const sections = { summary: '', experience: '', education: '', skills: '' };
  
  // Split on common resume section headings
  const sectionPatterns = {
    summary:    /PROFESSIONAL SUMMARY|SUMMARY|OBJECTIVE/i,
    experience: /PROFESSIONAL EXPERIENCE|WORK EXPERIENCE|EXPERIENCE/i,
    education:  /EDUCATION/i,
    skills:     /SKILLS|TECHNICAL SKILLS/i,
  };

  const lines = resumeText.split('\n');
  let current = null;

  lines.forEach(line => {
    const trimmed = line.trim();
    
    // Check if this line IS a section heading
    for (const [key, pattern] of Object.entries(sectionPatterns)) {
      if (pattern.test(trimmed) && trimmed.length < 40) { // headings are short
        current = key;
        return; // don't add the heading line itself
      }
    }

    if (current) {
      sections[current] += line + '\n';
    }
  });

  console.log("📊 Section lengths — summary:", sections.summary.length,
    "| experience:", sections.experience.length,
    "| education:", sections.education.length,
    "| skills:", sections.skills.length);

  return sections;
}

export async function buildKnowledgeBase() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set.');
  }
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  const [resumeText, portfolioText] = await Promise.all([
    readResumeText(),
    readPortfolioText(),
  ]);

  console.log("📝 resumeText length:", resumeText.length);
  console.log("🌐 portfolioText length:", portfolioText.length);

  const sections = parseResumeSections(resumeText);

  const combined = cleanText([
    '=== RESUME ===',
    resumeText,
    '',
    '=== PORTFOLIO CODE CONTEXT ===',
    portfolioText,
  ].join('\n'));

  const chunks = chunkText(combined, 1000, 180);
  console.log("🧩 Total chunks:", chunks.length);

  if (!chunks.length) {
    throw new Error('No text found for RAG indexing.');
  }

  const index = chunks.map((chunk, i) => ({ id: i, text: chunk }));

  return {
    async answer(question) {
      const q = (question || '').trim();
      console.log("❓ Answering:", q);

      if (!q) return "I don't have that information yet";

      if (/\b(hi|hello|hey)\b/i.test(q)) {
        return "Hey! 👋 I'm Vivek's AI assistant. Ask me anything about his projects, skills, or experience.";
      }
      if (/who are you|about yourself/i.test(q)) {
        return "I'm Vivek, a developer focused on building modern apps using technologies like Flutter, React, and real-time systems.";
      }

      const fullContext = index.map(item => item.text).join('\n\n');

      let contextToUse = fullContext;

      if (/experience|work|job|role|position|company/i.test(q)) {
        contextToUse = sections.experience;
        console.log("🎯 Using section: experience, length:", contextToUse.length);
      } else if (/education|degree|university|college|school|studied/i.test(q)) {
        contextToUse = sections.education;
        console.log("🎯 Using section: education, length:", contextToUse.length);
      } else if (/skills|technologies|tech stack|tools|languages|frameworks/i.test(q)) {
        contextToUse = sections.skills;
        console.log("🎯 Using section: skills, length:", contextToUse.length);
      } else if (/summary|about|overview|background/i.test(q)) {
        contextToUse = sections.summary;
        console.log("🎯 Using section: summary, length:", contextToUse.length);
      } else {
        console.log("🎯 Using full context, length:", contextToUse.length);
      }

      // Fallback if section too short
      if (!contextToUse || contextToUse.length < 50) {
        console.log("⚠️ Section too short, falling back to full context, length:", fullContext.length);
        contextToUse = fullContext;
      }

      console.log("📤 Sending to Gemini | model:", CHAT_MODEL, "| context length:", contextToUse.length);

      try {
        const model = genAI.getGenerativeModel({
          model: CHAT_MODEL,
          systemInstruction:
            "You are Vivek's AI portfolio assistant. " +
            "The provided context contains his resume and portfolio. " +
            "Sections may include headings like PROFESSIONAL EXPERIENCE, EDUCATION, SKILLS. " +
            "If the user asks about experience, skills, or education, extract and summarize from those sections. " +
            "Always try to answer even if wording is different. " +
            "Tone: professional, slightly casual, concise.",
        });

        const completion = await model.generateContent({
          generationConfig: { temperature: 0.2 },
          contents: [
            {
              role: 'user',
              parts: [{ text: `User question: ${q}\n\nContext:\n${contextToUse}` }],
            },
          ],
        });

        // Log the raw candidate to catch finish reason / safety blocks
        const candidate = completion.response?.candidates?.[0];
        console.log("📥 Finish reason:", candidate?.finishReason);
        console.log("📥 Safety ratings:", JSON.stringify(candidate?.safetyRatings));

        const answer = completion.response?.text()?.trim();
        console.log("✅ Final answer:", answer?.slice(0, 300));

        if (!answer || /i don'?t have that information/i.test(answer)) {
          return "Hey! 👋 I'm Vivek's AI assistant. You can ask about his projects, skills, or experience!";
        }

        return answer;
      } catch (geminiErr) {
        console.error("❌ Gemini call failed:", geminiErr.message);
        console.error(geminiErr);
        return "Sorry, I ran into an error answering that. Please try again.";
      }
    },
  };
}