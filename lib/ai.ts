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

// Initialize Google Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "AIzaSyAnNRnbzEInFMjAwMiPDiAJnXB-T0bGmzI");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

async function generateQuestionsWithAI(seed: string): Promise<Question[]> {
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
    return generateFallbackQuestions(seed);
  }
}

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

export async function generateQuestions(seed: string): Promise<Question[]> {
  return await generateQuestionsWithAI(seed);
}

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

export async function evaluateAndCorrectAnswer(question: string, answer: string): Promise<{
  score: number;
  correction: string;
  feedback: string;
}> {
  const prompt = `You are an AI interviewer evaluating and correcting a candidate's answer for a full-stack developer interview. 
  Question: "${question}". 
  Candidate's Answer: "${answer}". 
  If the answer is vague, incomplete, or repetitive, provide a clear and concise corrected version that addresses the question effectively. 
  Evaluate the answer for accuracy, relevance, completeness, and technical correctness. 
  Provide:
  - A score from 0 to 100 based on the answer's quality (assign a low score, e.g., 0-20, for vague or irrelevant answers).
  - A corrected version of the answer (improve clarity, accuracy, or completeness; return a default answer if the input is too vague).
  - Brief feedback (2-3 sentences) explaining the score and any corrections, including why the original answer was insufficient if applicable.
  Respond in JSON format:
  {
    "score": number,
    "correction": string,
    "feedback": string
  }`;

  const maxRetries = 2;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Validate JSON
      let parsed;
      try {
        parsed = JSON.parse(text);
        if (typeof parsed.score !== "number" || typeof parsed.correction !== "string" || typeof parsed.feedback !== "string") {
          throw new Error("Invalid JSON structure");
        }
      } catch (parseError) {
        console.error(`JSON parse error on attempt ${attempt + 1}:`, parseError, "Response text:", text);
        attempt++;
        if (attempt > maxRetries) {
          return {
            score: 0,
            correction: answer,
            feedback: "Failed to parse AI response after multiple attempts. The answer may be too vague or the AI service is unavailable."
          };
        }
        continue;
      }

      return {
        score: parsed.score || 0,
        correction: parsed.correction || answer,
        feedback: parsed.feedback || "No feedback provided."
      };
    } catch (error) {
      console.error(`Error evaluating answer on attempt ${attempt + 1}:`, error);
      attempt++;
      if (attempt > maxRetries) {
        return {
          score: 0,
          correction: answer,
          feedback: `Unable to evaluate answer after ${maxRetries + 1} attempts. The answer may be too vague or there was an issue with the AI service.`
        };
      }
    }
  }

  return {
    score: 0,
    correction: answer,
    feedback: "Unexpected error in evaluation process."
  };
}