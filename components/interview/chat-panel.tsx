"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { Timer } from "./timer"
import { generateQuestions, calculateScore } from "@/lib/ai"
import { generateId, loadInterviewState, saveInterviewState, upsertCandidate } from "@/lib/storage"

interface InterviewChatProps {
  candidateName: string
  candidateEmail: string
  candidatePhone: string
  resumeText: string
  onFinish: (score: number) => void
}

export function InterviewChat({
  candidateName,
  candidateEmail,
  candidatePhone,
  resumeText,
  onFinish,
}: InterviewChatProps) {
  const seed = useMemo(() => `${candidateEmail}:${candidateName}:${candidatePhone}`, [candidateEmail, candidateName, candidatePhone])
  const [questions, setQuestions] = useState<Array<{ id: string; difficulty: string; prompt: string; seconds: number }>>([])
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState("")
  const [answers, setAnswers] = useState<Array<{ questionId: string; answer: string; timeTaken: number }>>([])
  const [startedAt, setStartedAt] = useState<number>(Date.now())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const q = questions[index]

  // Load questions and restore state
  useEffect(() => {
    async function fetchQuestions() {
      try {
        setLoading(true)
        const generatedQuestions = await generateQuestions(seed)
        setQuestions(generatedQuestions)
        console.log("Questions loaded:", generatedQuestions)
      } catch (err) {
        console.error("Failed to load questions:", err)
        setError("Failed to load interview questions. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    // Restore from local storage
    const s = loadInterviewState()
    if (s && s.step === "in-progress") {
      setIndex(s.currentIndex)
      setStartedAt(s.startedAt)
      setAnswers(s.answers)
    } else {
      setStartedAt(Date.now())
    }

    fetchQuestions()
  }, [seed])

  // Save state to local storage
  useEffect(() => {
    if (questions.length > 0) {
      saveInterviewState({
        candidateId: `${candidateEmail}`,
        step: "in-progress",
        currentIndex: index,
        startedAt,
        answers,
      })
    }
  }, [index, startedAt, answers, candidateEmail, questions.length])

  const onNext = useCallback(() => {
    if (!q) return // Guard against undefined question
    const elapsed = Math.floor((Date.now() - startedAt) / 1000)
    setAnswers((prev) => [...prev, { questionId: q.id, answer, timeTaken: elapsed }])
    setAnswer("")
    setStartedAt(Date.now())
    if (index < questions.length - 1) {
      setIndex(index + 1)
    } else {
      // Compute score and persist candidate
      const score = calculateScore([...answers, { questionId: q.id, answer, timeTaken: elapsed }])
      const candidate = {
        id: generateId("cand"),
        name: candidateName,
        email: candidateEmail,
        phone: candidatePhone,
        resumeText,
        scores: { total: score.total, breakdown: score.breakdown },
        createdAt: Date.now(),
      }
      upsertCandidate(candidate)
      saveInterviewState(null)
      onFinish(score.total)
    }
  }, [answer, answers, index, onFinish, q, candidateEmail, candidateName, candidatePhone, resumeText, questions.length, startedAt])

  if (loading) {
    return (
      <Card className="shadow-md">
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading interview questions...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="shadow-md">
        <CardContent className="p-6">
          <p className="text-red-500">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-pretty">
            Question {index + 1} of {questions.length}
          </CardTitle>
          <CardDescription>{q?.difficulty.toUpperCase()}</CardDescription>
        </div>
        <Timer seconds={q?.seconds} onElapsed={onNext} />
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="p-3 rounded-md border bg-card text-card-foreground">{q?.prompt}</div>
        <Textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Record your answer here..."
          className="min-h-36"
        />
        <div className="flex items-center justify-end gap-2">
          <Button onClick={onNext} className="bg-[color:var(--primary)] text-[color:var(--primary-foreground)]">
            {index < questions.length - 1 ? "Next" : "Finish"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}