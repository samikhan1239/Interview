// Note: To use this, install the Google AI SDK:
// npm install @google/generative-ai

import { GoogleGenerativeAI } from "@google/generative-ai";

export type Difficulty = "easy" | "medium" | "hard";

export type Question = {
  id: string;
  difficulty: Difficulty;
  prompt: string;
  seconds: number;
};

const durations: Record<Difficulty, number> = {
  easy: 20,
  medium: 60,
  hard: 120,
};

// Initialize Google Gemini (replace with your actual API key)
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "YOUR_API_KEY_HERE");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Using Gemini 1.5 Flash (as of 2025, 2.0 may be available; update if needed)

async function generateQuestionsWithAI(seed: string): Promise<Question[]> {
  // Use seed as part of the prompt for some reproducibility, though AI generation is non-deterministic
  const systemPrompt = `You are a helpful assistant generating interview questions for full-stack developers. 
  Generate exactly 2 unique questions per difficulty level: easy, medium, hard. 
  Focus on practical full-stack concepts (frontend, backend, databases, deployment). 
  Keep easy questions basic (e.g., explain concepts), medium practical (e.g., implementation steps), hard advanced (e.g., design/scalability).
  Seed context: ${seed} (use this to inspire variety but keep questions relevant).
  
  Respond ONLY with JSON in this exact format:
  {
    "easy": ["question1", "question2"],
    "medium": ["question1", "question2"],
    "hard": ["question1", "question2"]
  }
  Do not add explanations or extra text.`;

  try {
    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    const parsed = JSON.parse(text);
    
    const out: Question[] = [];
    ["easy", "medium", "hard"].forEach((diff) => {
      const questions = parsed[diff as Difficulty] || [];
      for (let i = 0; i < 2; i++) {
        const prompt = questions[i] || `Sample ${diff} question ${i + 1}`;
        out.push({
          id: `${diff[0]}${i}`,
          difficulty: diff as Difficulty,
          prompt,
          seconds: durations[diff as Difficulty],
        });
      }
    });

    return out;
  } catch (error) {
    console.error("Error generating questions with AI:", error);
    // Fallback to static questions if AI fails
    return generateFallbackQuestions(seed);
  }
}

// Fallback static questions (original style)
function generateFallbackQuestions(seed: string): Question[] {
  const banks: Record<Difficulty, string[]> = {
    easy: [
      "Explain the difference between client-side and server-side rendering in a full-stack application.",
      "What is the purpose of package.json in a Node.js project?",
      "Describe how you would structure a simple REST API for a blog application.",
    ],
    medium: [
      "How would you implement user authentication in a full-stack app using JWT?",
      "Explain how you would optimize a slow database query in a full-stack application.",
      "Describe the process of deploying a full-stack app using Docker and AWS.",
    ],
    hard: [
      "Discuss how you would design a scalable microservices architecture for a full-stack e-commerce platform.",
      "How would you handle real-time data updates in a full-stack app using WebSockets?",
      "Explain how you would implement rate limiting and caching in a high-traffic full-stack API.",
    ],
  };

  const rnd = seedRandom(seed);
  const pick = (arr: string[]) => arr[Math.floor(rnd() * arr.length)];
  const out: Question[] = [];
  for (let i = 0; i < 2; i++)
    out.push({ id: `e${i}`, difficulty: "easy", prompt: pick(banks.easy), seconds: durations.easy });
  for (let i = 0; i < 2; i++)
    out.push({ id: `m${i}`, difficulty: "medium", prompt: pick(banks.medium), seconds: durations.medium });
  for (let i = 0; i < 2; i++)
    out.push({ id: `h${i}`, difficulty: "hard", prompt: pick(banks.hard), seconds: durations.hard });
  return out;
}

// Original seedRandom function (for fallback)
function seedRandom(seed: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Updated generateQuestions to use AI
export async function generateQuestions(seed: string): Promise<Question[]> {
  return await generateQuestionsWithAI(seed);
}

// Original calculateScore function (unchanged)
export function calculateScore(answers: Array<{ questionId: string; answer: string; timeTaken: number }>): {
  total: number;
  breakdown: { easy: number; medium: number; hard: number };
} {
  let easy = 0,
    medium = 0,
    hard = 0;
  for (const a of answers) {
    const lenScore = Math.min(100, a.answer.trim().length);
    const speedBonus = Math.max(0, 20 - Math.floor(a.timeTaken / 10));
    const base = lenScore + speedBonus;
    if (a.questionId.startsWith("e")) easy += base;
    else if (a.questionId.startsWith("m")) medium += base;
    else hard += base;
  }
  const total = easy + medium + hard;
  return { total, breakdown: { easy, medium, hard } };
}

// Example usage (async)


// Uncomment to run
// demonstrate();