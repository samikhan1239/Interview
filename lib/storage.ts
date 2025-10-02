type Candidate = {
  id: string
  name: string
  email: string
  resumeText?: string
  scores?: { total: number; breakdown: { easy: number; medium: number; hard: number } }
  createdAt: number
}

type InterviewState = {
  candidateId: string
  step: "intro" | "in-progress" | "completed"
  currentIndex: number
  startedAt: number
  answers: Array<{ questionId: string; answer: string; timeTaken: number }>
}

const CANDIDATES_KEY = "ia:candidates"
const INTERVIEW_STATE_KEY = "ia:interview:state"

export function loadCandidates(): Candidate[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(CANDIDATES_KEY)
    return raw ? (JSON.parse(raw) as Candidate[]) : []
  } catch {
    return []
  }
}

export function saveCandidates(list: Candidate[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(CANDIDATES_KEY, JSON.stringify(list))
}

export function upsertCandidate(c: Candidate) {
  const list = loadCandidates()
  const idx = list.findIndex((x) => x.id === c.id)
  if (idx >= 0) list[idx] = c
  else list.push(c)
  saveCandidates(list)
}

export function loadInterviewState(): InterviewState | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem(INTERVIEW_STATE_KEY)
  return raw ? (JSON.parse(raw) as InterviewState) : null
}

export function saveInterviewState(state: InterviewState | null) {
  if (typeof window === "undefined") return
  if (state) localStorage.setItem(INTERVIEW_STATE_KEY, JSON.stringify(state))
  else localStorage.removeItem(INTERVIEW_STATE_KEY)
}

export function generateId(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}
