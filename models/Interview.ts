export type InterviewStatus = "pending" | "in-progress" | "paused" | "completed"| "not-started"

export interface Question {
  id: string
  text: string
  difficulty: "easy" | "medium" | "hard"
  timeLimit: number
  answer?: string
  score?: number
  correction?: string
  feedback?: string
  answeredAt?: string
  prompt?: string // For compatibility with ai.ts Question type
  seconds?: number 
   summary?: string;// For compatibility with ai.ts Question type
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: string
  metadata?: {
    questionId: string
    type: "answer" | "score" | "feedback" | "summary" | "correction" | "info"
  }
}

export interface Interview {
  id: string
  candidateId: string
  questions: Question[]
  currentQuestionIndex: number
  totalScore: number
  status: InterviewStatus
  chatHistory: ChatMessage[]

  pausedAt?: string
  completedAt?: string

}