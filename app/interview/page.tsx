"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { authDB, candidateDB, interviewDB, generateId, loadInterviewState, saveInterviewState } from "@/lib/storage"
import { generateQuestions } from "@/lib/ai"
import { Interview, ChatMessage } from "@/models/Interview"
import { Candidate } from "@/models/Candidate"
import { ResumeUpload } from "@/components/resume-upload"
import { ScrollProgress } from "@/components/ui/scroll-progress"
import { WelcomeBackModal } from "@/components/welcome-back-modal"
import PracticeSession from "@/components/practice/PracticeSession"
import { GoogleGenerativeAI } from "@google/generative-ai"

interface ExtractedData {
  name: string | null
  email: string | null
  phone: string | null
  rawText: string
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "AIzaSyAnNRnbzEInFMjAwMiPDiAJnXB-T0bGmzI")
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

export default function InterviewPage() {
  const router = useRouter()
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

  useEffect(() => {
    // Check if user is authenticated
    const user = authDB.getCurrentUser()
    if (!user) {
      router.push("/login")
      return
    }
    
    // Load candidate and interview
    const candidateData = candidateDB.getById(user.id)
    if (candidateData) {
      setCandidate(candidateData)
      setCandidateData({
        name: candidateData.name,
        email: candidateData.email,
        phone: candidateData.phone,
        rawText: candidateData.summary,
      })
      setStarted(candidateData.status !== "pending")
    }

    const interviewData = interviewDB.getByCandidateId(user.id)
    if (interviewData) {
      setInterview(interviewData)
      if (interviewData.status === "completed") {
        router.push("/results")
      } else if (interviewData.status === "paused") {
        setIsPaused(true)
        setCurrentQuestion(interviewData.questions[interviewData.currentQuestionIndex].text)
      } else if (interviewData.questions.length > 0) {
        setCurrentQuestion(interviewData.questions[interviewData.currentQuestionIndex].text)
      }
    }
  }, [router])

  const speakQuestion = (text: string) => {
    if (isSpeaking) return
    setIsSpeaking(true)
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = "en-US"
    utterance.rate = 1
    utterance.pitch = 1
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  const generateSummary = async (answer: string) => {
    const prompt = `Generate a concise summary of the following answer: "${answer}". The summary should be 2-3 sentences.`
    try {
      const result = await model.generateContent(prompt)
      const response = await result.response
      return response.text()
    } catch (error) {
      console.error("Error generating summary:", error)
      return "Unable to generate summary due to an error."
    }
  }

  const handleExtract = async (data: ExtractedData) => {
    setCandidateData(data)
    if (!data.name || !data.email || !data.phone) {
      setError("Please ensure name, email, and phone are extracted from the resume.")
      return
    }

    const user = authDB.getCurrentUser()
    if (!user) return

    const candidateData = candidateDB.getById(user.id)
    if (!candidateData) {
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
        pausedAt: undefined,
      }
      const createdCandidate = await candidateDB.upsertCandidate(newCandidate)
      setCandidate(createdCandidate)

      const aiQuestions = await generateQuestions(user.id)
      const questions = aiQuestions.map((q) => ({
        id: q.id,
        text: q.prompt,
        difficulty: q.difficulty,
        timeLimit: q.seconds,
      }))
      const newInterview: Omit<Interview, "id" | "createdAt" | "updatedAt"> = {
        candidateId: user.id,
        questions,
        currentQuestionIndex: 0,
        totalScore: 0,
        status: "pending",
        chatHistory: [],
      }
      const createdInterview = interviewDB.create(newInterview)
      setInterview(createdInterview)
    }
  }

  const evaluateAnswer = async (question: string, answer: string): Promise<{ score: number; aiResponse: string }> => {
    const prompt = `You are an AI interviewer evaluating a candidate's answer. Question: "${question}". Answer: "${answer}". 
    Evaluate the answer for accuracy, relevance, and completeness. Provide a score from 0 to 100 and a brief feedback (2-3 sentences).
    Respond in JSON format:
    {
      "score": number,
      "feedback": string
    }`
    try {
      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      const { score, feedback } = JSON.parse(text)
      setSummary(feedback || "No feedback provided.")
      return { score: score || 0, aiResponse: feedback || "No feedback provided." }
    } catch (error) {
      console.error("Error evaluating answer:", error)
      setSummary("Unable to evaluate answer due to an error.")
      return { score: 0, aiResponse: "Unable to evaluate answer due to an error." }
    }
  }

  const handleStart = () => {
    if (!interview) {
      setError("No interview data available. Please upload a resume first.")
      return
    }
    interviewDB.update(interview.id, {
      status: "in-progress",
    
    })
    candidateDB.update(interview.candidateId, { status: "in-progress" })
    setStarted(true)
    setCurrentQuestion(interview.questions[interview.currentQuestionIndex].text)
    // Speak the first question and start recording
    speakQuestion(interview.questions[interview.currentQuestionIndex].text)
    setIsRecording(true) // Start recording automatically

    const state = loadInterviewState(interview.candidateId) || {
      candidateId: interview.candidateId,
      step: "in-progress",
      currentIndex: 0,
      startedAt: Date.now(),
      answers: [],
    }
    saveInterviewState(state)
  }

  const handlePause = () => {
    if (!interview) return
    const pausedAt = new Date().toISOString()
    interviewDB.update(interview.id, {
      status: "paused",
      pausedAt,
    })
    candidateDB.update(interview.candidateId, { status: "paused", pausedAt })
    setIsPaused(true)
    setIsRecording(false) // Stop recording when pausing
    window.speechSynthesis.cancel()
    saveInterviewState({
      candidateId: interview.candidateId,
      step: "in-progress",
      currentIndex: interview.currentQuestionIndex,
      startedAt: Date.now(),
      answers: interview.questions
        .slice(0, interview.currentQuestionIndex)
        .map((q) => ({
          questionId: q.id,
          answer: q.answer || "",
          timeTaken: q.answeredAt ? Math.floor((new Date(q.answeredAt).getTime() - Date.now()) / 1000) : 0,
        })),
    })
  }

  const handleResume = () => {
    if (!interview) return
    interviewDB.update(interview.id, { status: "in-progress" })
    candidateDB.update(interview.candidateId, { status: "in-progress" })
    setIsPaused(false)
    speakQuestion(interview.questions[interview.currentQuestionIndex].text)
    setIsRecording(true) // Start recording when resuming
  }

  const handleNextQuestion = async () => {
    if (!interview || isSpeaking || !answer) return
    setLoading(true)
    setIsRecording(false) // Stop recording before processing

    const { score, aiResponse } = await evaluateAnswer(interview.questions[interview.currentQuestionIndex].text, answer)
    const answerSummary = await generateSummary(answer)

    const updatedQuestions = [...interview.questions]
    updatedQuestions[interview.currentQuestionIndex] = {
      ...updatedQuestions[interview.currentQuestionIndex],
      answer,
      score,
     
      answeredAt: new Date().toISOString(),
    }

    const chatMessage: ChatMessage = {
      id: generateId(),
      role: "user",
      content: answer,
      timestamp: new Date().toISOString(),
      metadata: { questionId: interview.questions[interview.currentQuestionIndex].id, type: "answer" },
    }
    const aiChatMessage: ChatMessage = {
      id: generateId(),
      role: "assistant",
      content: aiResponse,
      timestamp: new Date().toISOString(),
      metadata: { questionId: interview.questions[interview.currentQuestionIndex].id, type: "score" },
    }
    const summaryChatMessage: ChatMessage = {
      id: generateId(),
      role: "system",
      content: answerSummary,
      timestamp: new Date().toISOString(),
      metadata: { questionId: interview.questions[interview.currentQuestionIndex].id, type: "summary" },
    }

    const nextIndex = interview.currentQuestionIndex + 1
    const newTotalScore = interview.totalScore + score

    const state = loadInterviewState(interview.candidateId) || {
      candidateId: interview.candidateId,
      step: "in-progress",
      currentIndex: nextIndex,
      startedAt: Date.now(),
      answers: [],
    }
    state.answers.push({
      questionId: interview.questions[interview.currentQuestionIndex].id,
      answer,
      timeTaken: Math.floor((Date.now() - state.startedAt) / 1000),
    })
    state.currentIndex = nextIndex
    state.step = nextIndex < interview.questions.length ? "in-progress" : "completed"
    saveInterviewState(state)

    const updatedInterview: Interview = {
      ...interview,
      questions: updatedQuestions,
      currentQuestionIndex: nextIndex,
      totalScore: newTotalScore,
      status: nextIndex < interview.questions.length ? "in-progress" : "completed",
      chatHistory: [...interview.chatHistory, chatMessage, aiChatMessage, summaryChatMessage],
      completedAt: nextIndex >= interview.questions.length ? new Date().toISOString() : undefined,
    }
    interviewDB.update(interview.id, updatedInterview)
    setInterview(updatedInterview)

    candidateDB.update(interview.candidateId, {
      score: newTotalScore,
      status: nextIndex < interview.questions.length ? "in-progress" : "completed",
    })

    if (nextIndex < interview.questions.length) {
      setCurrentQuestion(updatedInterview.questions[nextIndex].text)
      setAnswer("")
      setSummary("")
      setRecordedChunks([])
      speakQuestion(updatedInterview.questions[nextIndex].text)
      setIsRecording(true) // Start recording for the next question
    } else {
      router.push(`/results?interviewId=${interview.id}`)
    }
    setLoading(false)
  }

  const handleRecordingStop = (chunks: Blob[]) => {
    setRecordedChunks(chunks)
  }

  const isDataComplete = candidateData.name && candidateData.email && candidateData.phone

  return (
    <main className="min-h-screen w-full bg-gray-50 flex flex-col">
      <ScrollProgress />
      <WelcomeBackModal />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="relative max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="text-center space-y-5">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
              <span className="text-sm font-semibold text-primary">Interview</span>
              <span className="h-1 w-1 rounded-full bg-primary/50" />
              <span className="text-sm font-semibold text-primary">AI-Powered</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent leading-tight">
              Experience a Real Interview, Powered by AI
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Upload your resume to generate tailored questions, answer via voice or text, and receive instant AI feedback in a realistic video-call environment.
            </p>
            {!started && (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden />
                  Live-like call UI
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary" aria-hidden />
                  Voice or text
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-accent-foreground" aria-hidden />
                  Instant feedback
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Resume Upload Section (Practice Builder Equivalent) */}
      {!started && (
        <section className="relative w-full py-20 bg-gradient-to-b from-background via-muted/20 to-background overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.05),transparent_60%)] pointer-events-none" />
          <div className="relative max-w-7xl mx-auto px-6 sm:px-8">
            <div className="text-center mb-12 space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-sm text-primary font-medium">
                ✨ Interview Setup
              </div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
                Prepare Your Interview
              </h2>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Upload your resume to extract your details and generate personalized interview questions.
              </p>
            </div>
            <div className="w-full flex flex-col gap-6">
              <Card className="max-w-3xl mx-auto shadow-md">
                <CardHeader>
                  <CardTitle>Upload Resume</CardTitle>
                  <CardDescription>Provide your resume to start the interview.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid gap-2">
                    <Label className="text-sm">Resume</Label>
                    <ResumeUpload onExtract={handleExtract} />
                    {candidateData.rawText && (
                      <p className="text-xs text-muted-foreground">
                        Extracted length: {candidateData.rawText.length} characters
                      </p>
                    )}
                    {isDataComplete && (
                      <div className="text-sm text-muted-foreground">
                        <p><strong>Name:</strong> {candidateData.name}</p>
                        <p><strong>Email:</strong> {candidateData.email}</p>
                        <p><strong>Phone:</strong> {candidateData.phone}</p>
                      </div>
                    )}
                    {error && <p className="text-sm text-destructive">{error}</p>}
                  </div>
                  <div className="flex justify-end">
                    <Button
                      disabled={!isDataComplete}
                      onClick={handleStart}
                      className="bg-[color:var(--primary)] text-[color:var(--primary-foreground)]"
                    >
                      Start Interview
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        </section>
      )}

      {/* Interview Session */}
      {started && interview && interview.status !== "completed" && (
        <section className="w-full px-4 py-10 bg-gray-50">
          <div className="w-full">
            <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
              <div>
                Question {interview.currentQuestionIndex + 1} of {interview.questions.length}
              </div>
            </div>
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
              onRecordingStop={handleRecordingStop}
              onPause={handlePause}
              onResume={handleResume}
              onNextQuestion={handleNextQuestion}
            />
          </div>
        </section>
      )}

      {/* Completion Section */}
      {interview?.status === "completed" && (
        <section className="w-full px-4 py-10 bg-white">
          <div className="w-full text-center">
            <h2 className="text-2xl font-semibold mb-2">Great work!</h2>
            <p className="text-muted-foreground mb-6">Your interview session is complete.</p>
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setStarted(false)
                  setInterview(null)
                  setAnswer("")
                  setSummary("")
                  setError("")
                  setIsPaused(false)
                  setIsSpeaking(false)
                  setIsRecording(false)
                  setRecordedChunks([])
                }}
              >
                Start New Session
              </Button>
              <Button onClick={() => router.push(`/results?interviewId=${interview.id}`)}>
                View Results
              </Button>
            </div>
          </div>
        </section>
      )}
    </main>
  )
}