"use client"

import { useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Pause, Play } from "lucide-react"
import type { Interview } from "@/models/Interview"

interface InterviewControlsProps {
  isPaused: boolean
  isSpeaking: boolean
  loading: boolean
  answer: string
  interview: Interview | null
  onPause: () => void
  onResume: () => void
  onNextQuestion: () => void
}

export default function InterviewControls({
  isPaused,
  isSpeaking,
  loading,
  answer,
  interview,
  onPause,
  onResume,
  onNextQuestion,
}: InterviewControlsProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore when typing in inputs/textareas
      const target = e.target as HTMLElement | null
      const tag = target?.tagName?.toLowerCase()
      const typing = tag === "input" || tag === "textarea" || target?.isContentEditable
      if (typing) return

      if (e.key === " " || e.code === "Space") {
        e.preventDefault()
       if (!isSpeaking && interview?.status !== "completed") {
  if (isPaused) {
    onResume()
  } else {
    onPause()
  }
}

      }
      if (e.key === "Enter") {
        e.preventDefault()
        const nextDisabled = isSpeaking || !answer || isPaused || loading || interview?.status === "completed"
        if (!nextDisabled) onNextQuestion()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [isPaused, isSpeaking, loading, answer, interview, onPause, onResume, onNextQuestion])

  const nextDisabledReason = useMemo(() => {
    if (interview?.status === "completed") return "Interview completed"
    if (loading) return "Processing…"
    if (isPaused) return "Resume to proceed"
    if (isSpeaking) return "Wait for AI to finish speaking"
    if (!answer) return "Provide an answer to continue"
    return ""
  }, [interview, loading, isPaused, isSpeaking, answer])

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3" aria-live="polite">
        <div className="flex items-center gap-2 rounded-full border border-border/50 bg-muted/40 px-3 py-1">
          <span
            className={`h-2 w-2 rounded-full ${
              interview?.status === "completed"
                ? "bg-muted-foreground/40"
                : isPaused
                  ? "bg-muted-foreground/70"
                  : isSpeaking
                    ? "bg-primary"
                    : "bg-primary"
            }`}
            aria-hidden="true"
          />
          <span className="text-xs text-muted-foreground">
            {interview?.status === "completed"
              ? "Completed"
              : isSpeaking
                ? "AI speaking"
                : isPaused
                  ? "Paused"
                  : "Live"}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">Shortcuts: Space = Pause/Resume, Enter = Next</span>
      </div>

      <div className="flex gap-2">
        {/* existing buttons with improved logic text unchanged */}
        <Button
          onClick={isPaused ? onResume : onPause}
          variant={isPaused ? "default" : "secondary"}
          disabled={isSpeaking || interview?.status === "completed"}
        >
          {isPaused ? <Play className="mr-2 h-4 w-4" /> : <Pause className="mr-2 h-4 w-4" />}
          {isPaused ? "Resume" : "Pause"}
        </Button>
        <Button
          onClick={onNextQuestion}
          disabled={isSpeaking || !answer || isPaused || loading || interview?.status === "completed"}
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Next Question
        </Button>
      </div>

      {nextDisabledReason ? (
        <span className="text-xs text-muted-foreground" role="status" aria-live="polite">
          {nextDisabledReason}
        </span>
      ) : null}
    </div>
  )
}
