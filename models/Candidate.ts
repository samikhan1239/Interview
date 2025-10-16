import type { Interview } from "./Interview" // Assuming Interview is defined in a separate file

export interface Candidate {
  id: string
  name: string
  email: string
  phone: string
  resumeUrl?: string
  score: number
  status: "pending" | "in-progress" | "completed" | "paused"
  summary: string
  createdAt: string
  updatedAt: string
  pausedAt?: string
}

export interface CandidateProfile {
  candidate: Candidate
  interview: Interview
}