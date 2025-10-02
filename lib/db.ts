import type { Candidate } from "@/models/Candidate"
import type { Interview } from "@/models/Interview"
import type { User } from "@/models/User"

const STORAGE_KEYS = {
  AUTH: "interview_assistant_auth",
  CANDIDATES: "interview_assistant_candidates",
  INTERVIEWS: "interview_assistant_interviews",
  CURRENT_USER: "interview_assistant_current_user",
}

// Auth operations
export const authDB = {
  login: (email: string): User | null => {
    // Simple mock auth - in production, use real authentication
    const user: User = {
      id: Date.now().toString(),
      email,
     
      name: email.split("@")[0],
      role: "interview",
      createdAt: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user))
    return user
  },

  register: (email: string, name: string): User | null => {
    const user: User = {
      id: Date.now().toString(),
      email,
      name,
      role: "interview",
      createdAt: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user))
    return user
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER)
  },

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem(STORAGE_KEYS.CURRENT_USER)
    return userStr ? JSON.parse(userStr) : null
  },
}

// Candidate operations
export const candidateDB = {
  getAll: (): Candidate[] => {
    const data = localStorage.getItem(STORAGE_KEYS.CANDIDATES)
    return data ? JSON.parse(data) : []
  },

  getById: (id: string): Candidate | null => {
    const candidates = candidateDB.getAll()
    return candidates.find((c) => c.id === id) || null
  },

  create: (candidate: Omit<Candidate, "id" | "createdAt" | "updatedAt">): Candidate => {
    const candidates = candidateDB.getAll()
    const newCandidate: Candidate = {
      ...candidate,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    candidates.push(newCandidate)
    localStorage.setItem(STORAGE_KEYS.CANDIDATES, JSON.stringify(candidates))
    return newCandidate
  },

  update: (id: string, updates: Partial<Candidate>): Candidate | null => {
    const candidates = candidateDB.getAll()
    const index = candidates.findIndex((c) => c.id === id)
    if (index === -1) return null

    candidates[index] = {
      ...candidates[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEYS.CANDIDATES, JSON.stringify(candidates))
    return candidates[index]
  },

  delete: (id: string): boolean => {
    const candidates = candidateDB.getAll()
    const filtered = candidates.filter((c) => c.id !== id)
    if (filtered.length === candidates.length) return false
    localStorage.setItem(STORAGE_KEYS.CANDIDATES, JSON.stringify(filtered))
    return true
  },
}

// Interview operations
export const interviewDB = {
  getAll: (): Interview[] => {
    const data = localStorage.getItem(STORAGE_KEYS.INTERVIEWS)
    return data ? JSON.parse(data) : []
  },

  getById: (id: string): Interview | null => {
    const interviews = interviewDB.getAll()
    return interviews.find((i) => i.id === id) || null
  },

  getByCandidateId: (candidateId: string): Interview | null => {
    const interviews = interviewDB.getAll()
    return interviews.find((i) => i.candidateId === candidateId) || null
  },

  create: (candidateId: string): Interview => {
    const interviews = interviewDB.getAll()
    const now = new Date().toISOString()
    const newInterview: Interview = {
      id: Date.now().toString(),
      candidateId,
      questions: [],
      currentQuestionIndex: 0,
      totalScore: 0,
      status: "not-started",
      chatHistory: [],
      createdAt: now,
      updatedAt: now,
    }
    interviews.push(newInterview)
    localStorage.setItem(STORAGE_KEYS.INTERVIEWS, JSON.stringify(interviews))
    return newInterview
  },

  update: (id: string, updates: Partial<Interview>): Interview | null => {
    const interviews = interviewDB.getAll()
    const index = interviews.findIndex((i) => i.id === id)
    if (index === -1) return null

    interviews[index] = {
      ...interviews[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEYS.INTERVIEWS, JSON.stringify(interviews))
    return interviews[index]
  },

  delete: (id: string): boolean => {
    const interviews = interviewDB.getAll()
    const filtered = interviews.filter((i) => i.id !== id)
    if (filtered.length === interviews.length) return false
    localStorage.setItem(STORAGE_KEYS.INTERVIEWS, JSON.stringify(filtered))
    return true
  },
}
