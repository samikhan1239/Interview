import type { User } from "@/models/User"
import { generateQuestions } from "@/lib/ai"
import type { Candidate, CandidateProfile } from "@/models/Candidate"
import type { Interview, Question, ChatMessage } from "@/models/Interview"

const STORAGE_KEYS = {
  AUTH: "interview_assistant_auth",
  CANDIDATES: "ia:candidates",
  INTERVIEWS: "interview_assistant_interviews",
  CURRENT_USER: "interview_assistant_current_user",
  INTERVIEW_STATE: "ia:interview:state",
}

export interface InterviewState {
  candidateId: string
  step: "intro" | "in-progress" | "completed"
  currentIndex: number
  startedAt: number
  answers: Array<{ questionId: string; answer: string; timeTaken: number }>
}

// Utility to generate unique IDs
export const generateId = (prefix = "id"): string => {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

// Interview state operations
export const loadInterviewState = (candidateId: string): InterviewState | null => {
  if (typeof window === "undefined") return null
  const stateStr = localStorage.getItem(STORAGE_KEYS.INTERVIEW_STATE)
  if (!stateStr) return null
  const state = JSON.parse(stateStr)
  return state.candidateId === candidateId ? state : null
}

export const saveInterviewState = (state: InterviewState | null): void => {
  if (typeof window === "undefined") return
  if (state) localStorage.setItem(STORAGE_KEYS.INTERVIEW_STATE, JSON.stringify(state))
  else localStorage.removeItem(STORAGE_KEYS.INTERVIEW_STATE)
}

// Candidate operations
export const loadCandidates = (): Candidate[] => {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CANDIDATES)
    return raw ? (JSON.parse(raw) as Candidate[]) : []
  } catch {
    return []
  }
}

export const saveCandidates = (list: Candidate[]): void => {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEYS.CANDIDATES, JSON.stringify(list))
}

// Auth operations
export const authDB = {
  login: (email: string): User | null => {
    const user: User = {
      id: generateId(),
      email,
      name: email.split("@")[0],
      role: "interview",
      createdAt: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user))
    return user
  },

  register: async (email: string, name: string, resumeData?: { phone: string | null; resumeUrl: string | null; rawText: string | null }): Promise<User | null> => {
    const user: User = {
      id: generateId(),
      email,
      name,
      role: "interview",
      createdAt: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user))

    // Create or update candidate
    await candidateDB.upsertCandidate({
      id: user.id,
      email,
      name,
      phone: resumeData?.phone || "",
      resumeUrl: resumeData?.resumeUrl || undefined,
      score: 0,
      status: "pending",
      summary: resumeData?.rawText || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pausedAt: undefined,
    })

    // Generate questions using AI
    const questions = await generateQuestions(user.id)
    const interviewQuestions = questions.map((q) => ({
      id: q.id,
      text: q.prompt,
      difficulty: q.difficulty,
      timeLimit: q.seconds,
    }))

    // Create a new Interview
    const interview: Omit<Interview, "id" | "createdAt" | "updatedAt"> = {
      candidateId: user.id,
      questions: interviewQuestions,
      currentQuestionIndex: 0,
      totalScore: 0,
      status: "not-started",
      chatHistory: [],
    }
    interviewDB.create(interview)

    return user
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER)
    localStorage.removeItem(STORAGE_KEYS.INTERVIEW_STATE)
  },

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem(STORAGE_KEYS.CURRENT_USER)
    return userStr ? JSON.parse(userStr) : null
  },
}

// Candidate operations
export const candidateDB = {
  getAll: loadCandidates,

  getById: (id: string): Candidate | null => {
    const candidates = loadCandidates()
    return candidates.find((c) => c.id === id) || null
  },

  create: (candidate: Omit<Candidate, "id" | "createdAt" | "updatedAt">): Candidate => {
    const candidates = loadCandidates()
    const newCandidate: Candidate = {
      ...candidate,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    candidates.push(newCandidate)
    saveCandidates(candidates)
    return newCandidate
  },

  update: (id: string, updates: Partial<Candidate>): Candidate | null => {
    const candidates = loadCandidates()
    const index = candidates.findIndex((c) => c.id === id)
    if (index === -1) return null

    candidates[index] = {
      ...candidates[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    saveCandidates(candidates)
    return candidates[index]
  },

  delete: (id: string): boolean => {
    const candidates = loadCandidates()
    const filtered = candidates.filter((c) => c.id !== id)
    if (filtered.length === candidates.length) return false
    saveCandidates(filtered)
    return true
  },

  upsertCandidate: async (candidate: Candidate): Promise<Candidate> => {
    const candidates = loadCandidates()
    const index = candidates.findIndex((x) => x.id === candidate.id)
    if (index >= 0) {
      candidates[index] = {
        ...candidates[index],
        ...candidate,
        updatedAt: new Date().toISOString(),
      }
      saveCandidates(candidates)
      return candidates[index]
    } else {
      const newCandidate: Candidate = {
        ...candidate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      candidates.push(newCandidate)
      saveCandidates(candidates)
      return newCandidate
    }
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

  create: (interview: Omit<Interview, "id" | "createdAt" | "updatedAt">): Interview => {
    const interviews = interviewDB.getAll()
    const newInterview: Interview = {
      ...interview,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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