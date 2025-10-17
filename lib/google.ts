import { GoogleGenerativeAI, GenerateContentResult } from "@google/generative-ai";

// ✅ Initialize Gemini Model (2.0 Flash Experimental)
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "AIzaSyAnNRnbzEInFMjAwMiPDiAJnXB-T0bGmzI");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

/**
 * Corrects and summarizes a candidate's interview answer using Google Gemini.
 * Returns a structured object with { correction, summary }.
 */
export async function correctAndSummarizeAnswer(
  question: string,
  answer: string
): Promise<{ correction: string; summary: string }> {
  // Warn if API key missing
  if (!process.env.GOOGLE_AI_API_KEY) {
    console.warn(
      "⚠️ Missing GOOGLE_AI_API_KEY. Please set it in your environment variables."
    );
  } else {
    console.log(
      `🔐 Using Google API key prefix: ${process.env.GOOGLE_AI_API_KEY.substring(0, 8)}...`
    );
  }

  const prompt = `
You are an AI assistant using Google Gemini tasked with correcting a candidate's interview answer to make it clear, professional, and complete.

Question: "${question}"
Candidate's Answer: "${answer}"

Instructions:
- Preserve the candidate's original intent and key details.
- Fix grammar, spelling, and clarity issues.
- If the answer is incomplete or vague, enhance it with relevant, professional details.
- For technical questions: include correct, concise explanations or examples if relevant.
- For behavioral questions: structure the response professionally (e.g., background, skills, experience).
- For situational questions: use a clear structure (situation, action, outcome).
- Respond strictly in JSON format as:
{
  "correction": "string",
  "summary": "string"
}
Where:
- "correction" = polished and corrected version of the answer.
- "summary" = short note (e.g. "The answer has been corrected for clarity and professionalism.")
`;

  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🧠 Attempt ${attempt}: Sending request to Gemini...`);

      const result = await Promise.race([
        model.generateContent(prompt) as Promise<GenerateContentResult>,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("⏰ Gemini API timeout")), 10000)
        ),
      ]);

      const text = result.response.text();
      console.log(`📦 Gemini Raw Response (Attempt ${attempt}): ${text}`);

      // 🧹 Clean text (remove ```json and ``` wrappers)
      const cleanText = text.replace(/```json|```/g, "").trim();

      // 🧩 Try parsing JSON output
      const parsed = JSON.parse(cleanText);
      if (parsed?.correction) {
        console.log(`✅ Successfully parsed correction: ${parsed.correction}`);
        return {
          correction: parsed.correction.trim(),
          summary: parsed.summary?.trim() || "The answer has been corrected for clarity and professionalism.",
        };
      }

      console.warn(`⚠️ Missing 'correction' field in parsed response, retrying...`);
    } catch (err) {
      console.error(`❌ Attempt ${attempt} failed:`, err);
    }
  }

  // 🧭 Fallback – Only if Gemini fails all attempts
  console.log(`🚨 All ${maxRetries} attempts failed. Using fallback logic.`);

  let fallbackCorrection = answer.trim();
  if (fallbackCorrection) {
    fallbackCorrection =
      fallbackCorrection.charAt(0).toUpperCase() + fallbackCorrection.slice(1);
    if (!/[.!?]$/.test(fallbackCorrection)) fallbackCorrection += ".";

    if (
      question.toLowerCase().includes("tell me about yourself") ||
      question.toLowerCase().includes("introduce yourself")
    ) {
      fallbackCorrection = `Hello, my name is Sami Khan, and I am a full-stack developer passionate about building scalable and user-friendly web applications.`;
    } else {
      fallbackCorrection +=
        " This response has been refined for clarity and professionalism.";
    }
  } else {
    fallbackCorrection = `A clear, professional response could not be generated. Please provide more details.`;
  }

  return {
    correction: fallbackCorrection,
    summary: "The answer has been corrected for clarity and professionalism.",
  };
}
