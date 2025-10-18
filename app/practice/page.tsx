
"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authDB, candidateDB, interviewDB, generateId } from "@/lib/storage"
import { Interview, ChatMessage } from "@/models/Interview"
import { Candidate } from "@/models/Candidate"
import { ScrollProgress } from "@/components/ui/scroll-progress"
import { WelcomeBackModal } from "@/components/welcome-back-modal"
import { correctAndSummarizeAnswer } from "@/lib/google"
import AddQuestionForm from "@/components/practice/AddQuestionForm"
import PracticeSession from "@/components/practice/PracticeSession"
import { Button } from "@/components/ui/button"

interface CustomQuestion {
  text: string
  difficulty: "easy" | "medium" | "hard"
  timeLimit: number
}

export default function PracticePage() {
  const router = useRouter()
  const [, setCandidate] = useState<Candidate | null>(null)
  const [interview, setInterview] = useState<Interview | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<string>("")
  const [answer, setAnswer] = useState<string>("")
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false)
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [isPaused, setIsPaused] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>("")
  const [started, setStarted] = useState<boolean>(false)
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([])
  const [summary, setSummary] = useState<string>("")
  const [, setRecordedChunks] = useState<Blob[]>([])

  useEffect(() => {
    const user = authDB.getCurrentUser()
    if (!user) {
      router.push("/login")
      return
    }
    const candidateData = candidateDB.getById(user.id)
    if (candidateData) {
      setCandidate(candidateData)
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

 
  const handleStart = async () => {
    if (customQuestions.length === 0) {
      setError("Add at least one question to start practice.")
      return
    }
    const user = authDB.getCurrentUser()
    if (!user) return

    const questions = customQuestions.map((q) => ({
      id: generateId(),
      text: q.text,
      difficulty: q.difficulty,
      timeLimit: q.timeLimit,
      prompt: q.text,
      seconds: q.timeLimit,
    }))

    const newInterview = interviewDB.create({
      candidateId: user.id,
      questions,
      currentQuestionIndex: 0,
      totalScore: 0,
      status: "in-progress",
      chatHistory: [],
   
    })

    setInterview(newInterview)
    setStarted(true)
    setCurrentQuestion(newInterview.questions[0].text)
    setAnswer("")
    setIsRecording(false)
    speakQuestion(newInterview.questions[0].text)
  }

  const handlePause = () => {
    if (!interview) return
    setIsPaused(true)
    setIsRecording(false) // Stop recording when pausing
    window.speechSynthesis.cancel()
  }

  const handleResume = () => {
    if (!interview) return
    setIsPaused(false)
    if (currentQuestion) speakQuestion(currentQuestion)
  }
const handleNextQuestion = async () => {
  if (!interview || isSpeaking || !answer) return;
  setLoading(true);
  setIsRecording(false); // Stop recording before processing

  let aiResponse;
  try {
    aiResponse = await correctAndSummarizeAnswer(
      interview.questions[interview.currentQuestionIndex].text,
      answer
    );
  } catch (error) {
    console.error(
      "AI correction failed:",
      error,
      "Question:",
      interview.questions[interview.currentQuestionIndex].text,
      "Answer:",
      answer
    );
    setError(
      "Failed to process your answer due to an AI service issue. Please try again or provide a clearer answer."
    );
    setLoading(false);
    return;
  }

  const { correction, summary } = aiResponse;

  const updatedQuestions = [...interview.questions];
  updatedQuestions[interview.currentQuestionIndex] = {
    ...updatedQuestions[interview.currentQuestionIndex],
    answer,
    correction,
    summary, // Use the summary from correctAndSummarizeAnswer
    answeredAt: new Date().toISOString(),
  };

  const chatMessage: ChatMessage = {
    id: generateId(),
    role: "user",
    content: answer,
    timestamp: new Date().toISOString(),
    metadata: { questionId: interview.questions[interview.currentQuestionIndex].id, type: "answer" },
  };
  const aiChatMessage: ChatMessage = {
    id: generateId(),
    role: "assistant",
    content: summary,
    timestamp: new Date().toISOString(),
    metadata: { questionId: interview.questions[interview.currentQuestionIndex].id, type: "summary" },
  };
  const correctionChatMessage: ChatMessage = {
    id: generateId(),
    role: "assistant",
    content: correction,
    timestamp: new Date().toISOString(),
    metadata: { questionId: interview.questions[interview.currentQuestionIndex].id, type: "correction" },
  };

  const nextIndex = interview.currentQuestionIndex + 1;
  const newTotalScore = interview.totalScore;

  const updatedInterview: Interview = {
    ...interview,
    questions: updatedQuestions,
    currentQuestionIndex: nextIndex,
    totalScore: newTotalScore,
    status: nextIndex < interview.questions.length ? "in-progress" : "completed",
    chatHistory: [...interview.chatHistory, chatMessage, aiChatMessage, correctionChatMessage],
    completedAt: nextIndex >= interview.questions.length ? new Date().toISOString() : undefined,
  };
  interviewDB.update(interview.id, updatedInterview);
  setInterview(updatedInterview);

  candidateDB.update(interview.candidateId, {
    score: newTotalScore,
    status: nextIndex < interview.questions.length ? "in-progress" : "completed",
  });

  if (nextIndex < interview.questions.length) {
    setCurrentQuestion(updatedInterview.questions[nextIndex].text);
    setAnswer("");
    setSummary("");
    setRecordedChunks([]);
    speakQuestion(updatedInterview.questions[nextIndex].text);
  }
  setLoading(false);
};

  const handleAddQuestion = (question: CustomQuestion) => {
  setCustomQuestions([...customQuestions, question]);
};

  return (
    <main className="min-h-screen w-full bg-gray-50 flex flex-col">
      <ScrollProgress />
      <WelcomeBackModal />
      {/* Hero Section */}
     <section className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b">
  {/* Subtle grid overlay */}
  <div className="absolute inset-0 bg-grid-pattern opacity-5" />

  <div className="relative max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 md:py-16">
    <div className="text-center space-y-5">
      {/* Label */}
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
        <span className="text-sm font-semibold text-primary">Practice</span>
        <span className="h-1 w-1 rounded-full bg-primary/50" />
        <span className="text-sm font-semibold text-primary">AI Interview</span>
      </div>

      {/* Heading */}
      <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent leading-tight">
        Train like a real interview, right in your browser
      </h1>

      {/* Description */}
      <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
        Add your own questions, answer via voice or text, and get concise AI feedback. 
        Video-call UI and realistic call controls make it feel like the real thing.
      </p>

      {/* Highlights */}
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


      {/* Builder or Session */}
      {!started && (
     <section className="relative w-full py-20 bg-gradient-to-b from-background via-muted/20 to-background overflow-hidden">
  {/* optional subtle background grid / gradient glow */}
  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.05),transparent_60%)] pointer-events-none" />

  <div className="relative max-w-7xl mx-auto px-6 sm:px-8">
    {/* Header */}
    <div className="text-center mb-12 space-y-4">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-sm text-primary font-medium">
        ✨ Practice Builder
      </div>
      <h2 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
        Create Your Practice Set
      </h2>
      <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
        Add questions, choose difficulty, and define your time limit — everything you need for a smart, realistic session.
      </p>
    </div>

    {/* Form area */}
    <div className="w-full flex flex-col gap-6">
      <AddQuestionForm
        questions={customQuestions}
        onAddQuestion={handleAddQuestion}
        onStart={handleStart}
      />
    </div>
  </div>

  {/* accent line at bottom */}
  <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
</section>

      )}

      {started && interview?.status !== "completed" && (
        <section className="w-full px-4 py-10 bg-gray-50">
          <div className="w-full">
            <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
              <div>
                Question 
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
              onRecordingStop={setRecordedChunks}
              onPause={handlePause}
              onResume={handleResume}
              onNextQuestion={handleNextQuestion}
            />
          </div>
        </section>
      )}

      {interview?.status === "completed" && (
        <section className="w-full px-4 py-10 bg-white">
          <div className="w-full text-center">
            <h2 className="text-2xl font-semibold mb-2">Great work!</h2>
            <p className="text-muted-foreground mb-6">Your practice session is complete</p>
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
