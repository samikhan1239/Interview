import { GoogleGenerativeAI, GenerateContentResult } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "YOUR_API_KEY_HERE");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function correctAndSummarizeAnswer(
  question: string,
  answer: string
): Promise<{ correction: string; summary: string }> {
  const correctedQuestion = question
    .replace(/full satck|full strike/gi, "full stack")
    .replace(/bacon/gi, "backend")
    .replace(/cant|can't/gi, "candidate")
    .replace(/because like/gi, "such as")
    .replace(/very fit/gi, "well-suited")
    .replace(/do all the things/gi, "handle all required responsibilities")
    .trim();

  const basePrompt = (q: string, a: string) => `
You are an AI assistant evaluating and correcting a candidate's answer for an interview. The question may be of any type, including technical (e.g., programming, databases, algorithms), behavioral (e.g., personal background, motivations), situational (e.g., handling challenges or scenarios), or general knowledge.

Question: "${q}"  
Candidate's Answer: "${a}"

Instructions:
- Always incorporate the candidate's answer by correcting grammar, spelling, and unclear or vague terms (e.g., "full strike" → "full stack", "bacon" → "backend", "because like" → "such as").
- If the answer is vague, incomplete, or off-topic, enhance it with relevant details while preserving the candidate's intent.
- For technical questions, include accurate technical details and clarify any incorrect information.
- For behavioral or situational questions, provide a professional, concise response that builds on the candidate's answer, adding relevant examples or context as needed.
- If the candidate's answer is minimal, expand it with appropriate details to make it complete, professional, and aligned with the question's intent.
- Ensure the correction directly addresses the question and improves the candidate's original response.
- Provide:
  - "correction": the improved candidate answer (clear, correct, complete, professional, and based on the original answer).
  - "summary": 2–3 sentences explaining what was improved (e.g., spelling, terminology, clarity, or added details).

Respond strictly in JSON:
{
  "correction": string,
  "summary": string
}
`;

  const maxRetries = 3;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      const result = await Promise.race([
        model.generateContent(basePrompt(correctedQuestion, answer)) as Promise<GenerateContentResult>,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("API timeout")), 10000)
        )
      ]);

      if (!("response" in result)) throw new Error("Unexpected format from generateContent");

      const response = await result.response;
      const text = response.text();

      try {
        const parsed = JSON.parse(text);
        if (typeof parsed.correction === "string" && typeof parsed.summary === "string") {
          return parsed;
        }
        throw new Error("Invalid JSON structure");
      } catch (parseError) {
        console.error(`JSON parse error (attempt ${attempt + 1}):`, parseError, "Raw response:", text);
        attempt++;
        continue;
      }
    } catch (error) {
      console.error(`Error (attempt ${attempt + 1}):`, error);
      attempt++;
    }
  }

  // Dynamic fallback: correct the candidate's answer and align with the question
  let fallbackCorrection = "";
  let fallbackSummary = "";

  // Clean the candidate's answer with basic corrections
  const cleanedAnswer = answer
    .replace(/cant|can't/gi, "candidate")
    .replace(/very fit/gi, "well-suited")
    .replace(/do all the things/gi, "handle all required responsibilities")
    .replace(/because like/gi, "such as")
    .replace(/desire to/gi, "strong motivation to contribute")
    .trim();

  // Basic question type detection based on keywords
  const isTechnical = correctedQuestion.toLowerCase().match(/code|coding|program|database|api|framework|technology|algorithm|data structure/i);
  const isBehavioral = correctedQuestion.toLowerCase().match(/tell me about yourself|why|strength|weakness|experience|team|leadership|hire/i);
  const isSituational = correctedQuestion.toLowerCase().match(/challenge|problem|solve|situation|difficult/i);

  if (isTechnical) {
    fallbackCorrection = `In response to "${correctedQuestion}", ${cleanedAnswer || "the candidate provided an unclear response"}. To address this question effectively, the response should include specific technical details, such as relevant technologies, methodologies, or practical examples, ensuring clarity and accuracy.`;
    fallbackSummary = `The original answer was vague, grammatically unclear, or lacked specific technical details. The corrected version incorporates the candidate's response, improves grammar and clarity, and emphasizes the need for relevant technical information.`;
  } else if (isBehavioral) {
    fallbackCorrection = `In response to "${correctedQuestion}", ${cleanedAnswer || "I am a dedicated professional with relevant skills and experience"}. This response is enhanced by including specific examples of skills, experiences, or motivations that demonstrate my qualifications and alignment with the role.`;
    fallbackSummary = `The original answer was vague, grammatically unclear, or lacked specific details. The corrected version improves grammar and clarity, incorporates the candidate's intent, and adds professional details to align with the behavioral question's intent.`;
  } else if (isSituational) {
    fallbackCorrection = `In response to "${correctedQuestion}", ${cleanedAnswer || "I encountered a relevant situation in a project"}. The response is improved by clearly describing a specific situation, the actions taken to address it, and the positive outcome achieved, ensuring relevance to the question.`;
    fallbackSummary = `The original answer was vague, grammatically unclear, or lacked a specific situation and resolution. The corrected version incorporates the candidate's response, improves clarity, and adds a framework for describing a situation, actions, and outcome.`;
  } else {
    fallbackCorrection = `In response to "${correctedQuestion}", ${cleanedAnswer || "the candidate provided an unclear response"}. A complete answer should directly address the question with clear, relevant details tailored to its intent, incorporating specific examples or context as needed.`;
    fallbackSummary = `The original answer was vague, grammatically unclear, or unrelated to the question. The corrected version incorporates the candidate's response and provides a generic improvement, emphasizing clarity and relevance to the question.`;
  }

  return {
    correction: fallbackCorrection,
    summary: fallbackSummary
  };
}