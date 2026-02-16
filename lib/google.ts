import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(
  process.env.GOOGLE_AI_API_KEY ||
    "AIzaSyAnNRnbzEInFMjAwMiPDiAJnXB-T0bGmzI"
);

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-exp",
});

export type Difficulty = "easy" | "medium" | "hard";

export type Question = {
  id: string;
  difficulty: Difficulty;
  prompt: string;
  seconds: number;
};

const durations: Record<Difficulty, number> = {
  easy: 30,
  medium: 60,
  hard: 120,
};

/* =========================================================
   🔧 CLEAN JSON SAFELY
========================================================= */
function cleanJSON(text: string) {
  return text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

function safeParse(text: string) {
  try {
    return JSON.parse(cleanJSON(text));
  } catch {
    return null;
  }
}

/* =========================================================
   ✅ ROLE-BASED QUESTION GENERATION
========================================================= */
export async function generatePracticeQuestions(
  role: string
): Promise<Question[]> {
  const prompt = `
You are a senior technical interviewer.

Generate interview questions STRICTLY for this role:
"${role}"

Rules:
- Questions must match the role exactly.
- No unrelated technologies.
- Only include system design in HARD level.

Generate:
2 easy
2 medium
2 hard

Return ONLY JSON:

{
  "easy": ["q1", "q2"],
  "medium": ["q1", "q2"],
  "hard": ["q1", "q2"]
}
`;

  try {
    const result = await model.generateContent(prompt);
    const parsed = safeParse(result.response.text());

    if (!parsed) throw new Error("Invalid JSON");

    const output: Question[] = [];

    (["easy", "medium", "hard"] as Difficulty[]).forEach((diff) => {
      const questions = parsed[diff] || [];

      for (let i = 0; i < 2; i++) {
        output.push({
          id: `${diff}-${i}`,
          difficulty: diff,
          prompt: questions[i] || `Sample ${diff} question for ${role}`,
          seconds: durations[diff],
        });
      }
    });

    return output;
  } catch (error) {
    console.error("❌ Question generation failed:", error);

    return [
      {
        id: "fallback-e",
        difficulty: "easy",
        prompt: `Explain core concepts of ${role}.`,
        seconds: 30,
      },
      {
        id: "fallback-m",
        difficulty: "medium",
        prompt: `How would you implement a real feature as a ${role}?`,
        seconds: 60,
      },
      {
        id: "fallback-h",
        difficulty: "hard",
        prompt: `How would you design a scalable architecture as a ${role}?`,
        seconds: 120,
      },
    ];
  }
}

/* =========================================================
   ✅ AI EVALUATION (STRICT + ROLE AWARE)
========================================================= */
export async function evaluateAndCorrectAnswer(
  role: string,
  question: string,
  answer: string
): Promise<{
  score: number;
  correction: string;
  feedback: string;
}> {
  const prompt = `
You are a strict senior technical interviewer.

Role: ${role}

Question:
"${question}"

Candidate Answer:
"${answer}"

Evaluate based on:
- Technical accuracy
- Depth of explanation
- Real-world applicability
- Clarity & structure

Scoring Guide:
90-100 → Excellent
70-89 → Good but minor gaps
40-69 → Partial understanding
0-39 → Weak or incorrect

Return ONLY JSON:

{
  "score": number (0-100),
  "correction": "improved professional answer",
  "feedback": "short explanation of evaluation"
}
`;

  try {
    const result = await model.generateContent(prompt);
    const parsed = safeParse(result.response.text());

    if (!parsed) throw new Error("Invalid JSON");

    const score = Math.min(100, Math.max(0, Number(parsed.score) || 0));

    return {
      score,
      correction: parsed.correction || answer,
      feedback: parsed.feedback || "No feedback generated.",
    };
  } catch (error) {
    console.error("❌ Evaluation failed:", error);

    return {
      score: 50,
      correction: answer,
      feedback: "AI evaluation failed. Default score applied.",
    };
  }
}

/* =========================================================
   ✅ CORRECT + SUMMARIZE
========================================================= */
export async function correctAndSummarizeAnswer(
  question: string,
  answer: string
): Promise<{ correction: string; summary: string }> {
  const prompt = `
Improve and polish this answer professionally.

Question:
"${question}"

Answer:
"${answer}"

Return ONLY JSON:

{
  "correction": "improved answer",
  "summary": "short professional summary"
}
`;

  try {
    const result = await model.generateContent(prompt);
    const parsed = safeParse(result.response.text());

    if (!parsed) throw new Error("Invalid JSON");

    return {
      correction: parsed.correction || answer,
      summary:
        parsed.summary ||
        "Answer improved for clarity and professionalism.",
    };
  } catch (error) {
    console.error("❌ Correction failed:", error);

    return {
      correction: answer,
      summary: "Correction failed. Original answer retained.",
    };
  }
}
