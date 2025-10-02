export interface Question {
  id: string
  text: string
  difficulty: "easy" | "medium" | "hard"
  timeLimit: number // in seconds
  answer?: string
  score?: number
  aiResponse?: string
  answeredAt?: string
}

export interface Interview {
  id: string
  candidateId: string
  questions: Question[]
  currentQuestionIndex: number
  totalScore: number
  status: "not-started" | "in-progress" | "completed" | "paused"
  startedAt?: string
  completedAt?: string
  pausedAt?: string
  chatHistory: ChatMessage[]
  createdAt: string
  updatedAt: string
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: string
  metadata?: {
    questionId?: string
    type?: "question" | "answer" | "info" | "score"
  }
}
