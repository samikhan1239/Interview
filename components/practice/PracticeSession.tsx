"use client"

import React, { useEffect } from "react"
import type { Interview } from "@/models/Interview"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {  TooltipProvider } from "@/components/ui/tooltip"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import VideoCall from "@/components/VideoCall"
import SpeechRecorder from "@/components/practice/SpeechRecorder"
import InterviewControls from "@/components/practice/InterviewControls"

// Small inline icons
function DotRec({ className = "" }: { className?: string }) {
  return <span className={`inline-block h-2 w-2 rounded-full bg-destructive ${className}`} aria-hidden />
}
function IconMic({ muted }: { muted: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" className="text-foreground" fill="none">
      <path d="M12 14a4 4 0 0 0 4-4V7a4 4 0 1 0-8 0v3a4 4 0 0 0 4 4Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 11a7 7 0 0 0 14 0" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 18v3" stroke="currentColor" strokeWidth="1.5" />
      {muted ? <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth="1.5" /> : null}
    </svg>
  )
}
function IconCam({ off }: { off: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" className="text-foreground" fill="none">
      <rect x="3" y="6" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M15 10l5-3v10l-5-3v-4Z" stroke="currentColor" strokeWidth="1.5" />
      {off ? <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth="1.5" /> : null}
    </svg>
  )
}
function IconBlur({ on }: { on: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" className="text-foreground" fill="none">
      <circle cx="8" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16" cy="12" r="5" stroke="currentColor" strokeWidth="1.5" opacity={on ? 1 : 0.5} />
    </svg>
  )
}
function IconCc({ on }: { on: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" className="text-foreground" fill="none">
      <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8.5 14.5c-.9 0-1.5-.6-1.5-1.5v-2c0-.9.6-1.5 1.5-1.5M15.5 14.5c-.9 0-1.5-.6-1.5-1.5v-2c0-.9.6-1.5 1.5-1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity={on ? 1 : 0.6}
      />
    </svg>
  )
}
function IconSignal({ quality }: { quality: "good" | "ok" | "poor" }) {
  const levels = { good: 4, ok: 2, poor: 1 }[quality]
  return (
    <div className="flex items-end gap-0.5 text-foreground" aria-label={`Network ${quality}`}>
      {Array.from({ length: 4 }).map((_, i) => (
        <span
          key={i}
          className={`block w-1 rounded-sm ${i < levels ? "bg-primary" : "bg-muted-foreground/30"}`}
          style={{ height: 3 + i * 3 }}
        />
      ))}
    </div>
  )
}

interface PracticeSessionProps {
  interview: Interview | null
  currentQuestion: string
  answer: string
  setAnswer: (answer: string) => void
  summary: string
  error: string
  setError: (error: string) => void
  isSpeaking: boolean
  isPaused: boolean
  isRecording: boolean
  setIsRecording: (isRecording: boolean) => void
  loading: boolean
  onRecordingStop: (chunks: Blob[]) => void
  onPause: () => void
  onResume: () => void
  onNextQuestion: () => void
}

export default function PracticeSession({
  interview,
  currentQuestion,
  answer,
  setAnswer,
  summary,
  error,
  setError,
  isSpeaking,
  isPaused,
  isRecording,
  setIsRecording,
  loading,
  onRecordingStop,
  onPause,
  onResume,
  onNextQuestion,
}: PracticeSessionProps) {
  const [muted, setMuted] = React.useState(false)
  const [cameraOn, setCameraOn] = React.useState(true)
  const [blurBg, setBlurBg] = React.useState(false)
  const [captionsOn, setCaptionsOn] = React.useState(true)
  const [elapsed, setElapsed] = React.useState(0)

  const sessionActive = Boolean(interview) && !isPaused

  useEffect(() => {
    console.log("PracticeSession answer prop:", answer)
    console.log("PracticeSession currentQuestion:", currentQuestion)
  }, [currentQuestion, answer])

  useEffect(() => {
    if (!sessionActive) return
    const id = setInterval(() => setElapsed((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [sessionActive])

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0")
  const ss = String(elapsed % 60).padStart(2, "0")

  const quality: "good" | "ok" | "poor" = error ? "poor" : loading ? "ok" : "good"
  const liveCaption = captionsOn && (isSpeaking || !isPaused) ? answer?.slice(-140) || "" : ""
  const progress = Math.min(answer.length / 800, 1) * 100

  // Guard clause for null interview
  if (!interview) {
    return <div>Error: Interview data not available</div>
  }

  return (
    <section className="px-4 pb-12">
      <Card className="max-w-7xl mx-auto shadow-lg border-border/40 rounded-2xl overflow-hidden">
        {/* Header */}
        <CardHeader className="bg-muted/30 border-b border-border/50 py-4 px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-semibold tracking-tight text-balance">🎤 AI Mock Interview</CardTitle>
              <p className="text-muted-foreground text-sm mt-1">Answer questions as if you are in a real interview.</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="flex items-center gap-2">
                <IconSignal quality={quality} />
                <span className="text-xs">{quality.toUpperCase()}</span>
              </Badge>
              <Badge variant="secondary" className="text-xs">{mm}:{ss}</Badge>
              {isRecording && (
                <Badge variant="secondary" className="flex items-center gap-2 text-xs">
                  <DotRec /> Recording
                </Badge>
              )}
            </div>
          </div>
          <div className="mt-3">
            <Progress value={progress} aria-label="Answer completeness" />
          </div>
        </CardHeader>

        {/* Main 2-column content */}
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left: Video + QA */}
            <div className="flex-1 space-y-6">
              <div className={`relative ${blurBg ? "backdrop-blur-sm" : ""} bg-black rounded-lg overflow-hidden`} style={{ aspectRatio: "16/9", maxHeight: "70vh" }}>
                <div className="relative w-full h-auto bg-muted">
                  <VideoCall interviewId={interview.id} onError={setError} />
                </div>
                {/* overlays */}
                <div className="absolute top-3 left-3">
                  <Badge className="bg-secondary text-secondary-foreground">
                    {!isPaused ? "Live" : "Paused"}
                  </Badge>
                </div>
                <TooltipProvider>
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setMuted(m => !m)}><IconMic muted={muted} /></Button>
                    <Button size="sm" variant="secondary" onClick={() => setCameraOn(c => !c)}><IconCam off={!cameraOn} /></Button>
                    <Button size="sm" variant="secondary" onClick={() => setBlurBg(b => !b)}><IconBlur on={blurBg} /></Button>
                    <Button size="sm" variant="secondary" onClick={() => setCaptionsOn(c => !c)}><IconCc on={captionsOn} /></Button>
                  </div>
                </TooltipProvider>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/80 to-transparent px-4 pb-3 pt-8">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                    <div className="leading-tight">
                      <p className="text-sm font-medium">{ "Interviewer AI"}</p>
                      <p className="text-xs text-muted-foreground">Senior Engineer</p>
                    </div>
                  </div>
                  {captionsOn && liveCaption && (
                    <div className="mt-2 rounded-md p-2 text-sm" role="log">{liveCaption}</div>
                  )}
                </div>
              </div>
              {currentQuestion && (
                <div className="bg-muted/20 rounded-xl p-4 border">
                  <Label className="text-sm text-muted-foreground">Current Question</Label>
                  <p className="text-lg font-medium mt-1">{currentQuestion}</p>
                </div>
              )}
              <div>
                <Label className="text-sm text-muted-foreground">Your Answer</Label>
                <Textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type or speak your answer here..."
                  disabled={isSpeaking || isPaused || interview.status === "completed"}
                  className="w-full mt-2 resize-none rounded-lg border focus:ring-2 focus:ring-primary/50"
                  rows={5}
                />
              </div>
              {summary && (
                <div className="bg-accent border rounded-xl p-4">
                  <Label className="text-sm text-accent-foreground">AI Feedback</Label>
                  <p className="text-base mt-2">{summary}</p>
                </div>
              )}
            </div>

            {/* Right: Recorder + Controls */}
            <div className="w-full lg:w-80 flex flex-col gap-4">
              <SpeechRecorder
                isPaused={isPaused}
                isRecording={isRecording}
                setIsRecording={setIsRecording}
                setAnswer={setAnswer}
                setError={setError}
                onRecordingStop={onRecordingStop}
              />
              <InterviewControls
                isPaused={isPaused}
                isSpeaking={isSpeaking}
                loading={loading}
                answer={answer}
                interview={interview}
                onPause={onPause}
                onResume={onResume}
                onNextQuestion={onNextQuestion}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}