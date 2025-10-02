export interface User {
  id: string
  email: string
  name: string
  role: "interviewer" | "interview"
  createdAt: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
}
