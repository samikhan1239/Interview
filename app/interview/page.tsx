"use client"

import React, { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { authDB, candidateDB, interviewDB, generateId} from "@/lib/storage"
import { generatePracticeQuestions } from "@/lib/google"
import { Interview, ChatMessage } from "@/models/Interview"
import { Candidate } from "@/models/Candidate"
import { ResumeUpload } from "@/components/resume-upload"
import { ScrollProgress } from "@/components/ui/scroll-progress"
import { WelcomeBackModal } from "@/components/welcome-back-modal"
import PracticeSession from "@/components/practice/PracticeSession"

interface ExtractedData {
  name: string | null
  email: string | null
  phone: string | null
  rawText: string
}

export default function InterviewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const role = searchParams.get("role")

  const [, setCandidate] = useState<Candidate | null>(null)
  const [interview, setInterview] = useState<Interview | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<string>("")
  const [answer, setAnswer] = useState<string>("")
  const [summary, setSummary] = useState<string>("")
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false)
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [isPaused, setIsPaused] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>("")
  const [candidateData, setCandidateData] = useState<ExtractedData>({
    name: null,
    email: null,
    phone: null,
    rawText: "",
  })
  const [started, setStarted] = useState<boolean>(false)
  const [, setRecordedChunks] = useState<Blob[]>([])

  // 🔥 Initial Load
  useEffect(() => {
    const user = authDB.getCurrentUser()
    if (!user) {
      router.push("/login")
      return
    }

    const existingInterview = interviewDB.getByCandidateId(user.id)
    if (existingInterview) {
      setInterview(existingInterview)
      setStarted(existingInterview.status !== "pending")
      if (existingInterview.questions.length > 0) {
        setCurrentQuestion(existingInterview.questions[existingInterview.currentQuestionIndex].text)
      }
    }
  }, [router])

  // 🔥 Generate interview AFTER ML role prediction
  useEffect(() => {
    if (!role) return

    const createInterview = async () => {
      const user = authDB.getCurrentUser()
      if (!user) return

const aiQuestions = await generatePracticeQuestions(role!)


      const questions = aiQuestions.map((q) => ({
        id: q.id,
        text: q.prompt,
        difficulty: q.difficulty,
        timeLimit: q.seconds,
      }))

      const newInterview = interviewDB.create({
        candidateId: user.id,
        questions,
        currentQuestionIndex: 0,
        totalScore: 0,
        status: "pending",
        chatHistory: [],
      })

      setInterview(newInterview)
      setCurrentQuestion(questions[0]?.text || "")
    }

    createInterview()
  }, [role])

  const speakQuestion = (text: string) => {
    if (isSpeaking) return
    setIsSpeaking(true)
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.onend = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  const handleExtract = async (data: ExtractedData) => {
    setCandidateData(data)
    if (!data.name || !data.email || !data.phone) {
      setError("Please ensure name, email, and phone are extracted.")
      return
    }

    const user = authDB.getCurrentUser()
    if (!user) return

    const newCandidate: Candidate = {
      id: user.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      resumeUrl: undefined,
      score: 0,
      status: "pending",
      summary: data.rawText,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const created = await candidateDB.upsertCandidate(newCandidate)
    setCandidate(created)
  }

  // 🔥 Now calls secure API
  const evaluateAnswer = async (question: string, answer: string) => {
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, answer }),
      })

      const data = await res.json()
      setSummary(data.feedback)
      return data
    } catch {
      return { score: 0, feedback: "Evaluation failed" }
    }
  }

  const handleNextQuestion = async () => {
    if (!interview || !answer) return
    setLoading(true)

    const { score, feedback } = await evaluateAnswer(
      interview.questions[interview.currentQuestionIndex].text,
      answer
    )

    const updatedQuestions = [...interview.questions]
    updatedQuestions[interview.currentQuestionIndex] = {
      ...updatedQuestions[interview.currentQuestionIndex],
      answer,
      score,
      answeredAt: new Date().toISOString(),
    }

    const nextIndex = interview.currentQuestionIndex + 1

    const updatedInterview: Interview = {
      ...interview,
      questions: updatedQuestions,
      currentQuestionIndex: nextIndex,
      totalScore: interview.totalScore + score,
      status: nextIndex < interview.questions.length ? "in-progress" : "completed",
      chatHistory: [
        ...interview.chatHistory,
        {
          id: generateId(),
          role: "assistant",
          content: feedback,
          timestamp: new Date().toISOString(),
        } as ChatMessage,
      ],
    }

    interviewDB.update(interview.id, updatedInterview)
    setInterview(updatedInterview)

    if (nextIndex < interview.questions.length) {
      setCurrentQuestion(updatedInterview.questions[nextIndex].text)
      setAnswer("")
      setSummary("")
      speakQuestion(updatedInterview.questions[nextIndex].text)
    } else {
      router.push(`/results?interviewId=${interview.id}`)
    }

    setLoading(false)
  }

  const isDataComplete = candidateData.name && candidateData.email && candidateData.phone

  return (
    <main className="min-h-screen w-full bg-gray-50 flex flex-col">
      <ScrollProgress />
      <WelcomeBackModal />

      {!started && (
        <section className="py-20">
          <Card className="max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle>Upload Resume</CardTitle>
              <CardDescription>Start your AI interview</CardDescription>
            </CardHeader>
            <CardContent>
              <ResumeUpload onExtract={handleExtract} />
              <Button
                disabled={!isDataComplete}
                onClick={() => router.push("/interview/analysis")}
                className="mt-4"
              >
                Analyze Resume
              </Button>
            </CardContent>
          </Card>
        </section>
      )}

      {started && interview && interview.status !== "completed" && (
        <section className="p-6">
          <PracticeSession
            interview={interview}
            currentQuestion={currentQuestion}
            answer={answer}
            setAnswer={setAnswer}
            summary={summary}
            error={error}
            setError={setError}
            isSpeaking={isSpeaking}
            isPaused={isPaused}
            isRecording={isRecording}
            setIsRecording={setIsRecording}
            loading={loading}
            onRecordingStop={(c) => setRecordedChunks(c)}
            onPause={() => setIsPaused(true)}
            onResume={() => setIsPaused(false)}
            onNextQuestion={handleNextQuestion}
          />
        </section>
      )}
    </main>
  )
}
