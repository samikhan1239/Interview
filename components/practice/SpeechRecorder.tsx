"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Mic, StopCircle } from "lucide-react"

// ---- Type Definitions ----
interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  onstart: (() => void) | null
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult
  length: number
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative
  isFinal: boolean
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
    webkitAudioContext?: typeof AudioContext
  }
}

interface SpeechRecorderProps {
  isPaused: boolean
  isRecording: boolean
  setIsRecording: (isRecording: boolean) => void
  setAnswer: (answer: string) => void
  setError: (error: string) => void
  onRecordingStop: (chunks: Blob[]) => void
}

// ---- Main Component ----
const SpeechRecognitionAPI =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null

export default function SpeechRecorder({
  isPaused,
  isRecording,
  setIsRecording,
  setAnswer,
  setError,
  onRecordingStop,
}: SpeechRecorderProps) {
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const [includeCamera, setIncludeCamera] = useState(true)
  const [autoSave, setAutoSave] = useState(false)
  const [elapsedSec, setElapsedSec] = useState(0)
  const [volume, setVolume] = useState(0)

  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef = useRef<number | null>(null)
  const timerRef = useRef<number | null>(null)

  // ---- Initialize Speech Recognition ----
  const initializeRecognition = useCallback(() => {
    if (!SpeechRecognitionAPI) {
      setError(
        "Speech recognition is not supported in this browser. Please use Chrome or Edge."
      )
      console.warn("SpeechRecognition not available. Browser:", navigator.userAgent)
      return null
    }

    const recognition = new SpeechRecognitionAPI()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "en-US"

    recognition.onstart = () => {
      console.log("Speech recognition started")
      setIsTranscribing(true)
      setError("")
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map((result: SpeechRecognitionResult) => result[0].transcript)
        .join("")
      console.log("Transcribed text:", transcript)
      setAnswer(transcript)
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error)
      setIsTranscribing(false)
      switch (event.error) {
        case "no-speech":
          setError("No speech detected. Please speak clearly or check your microphone.")
          break
        case "audio-capture":
          setError("Microphone access denied or unavailable.")
          break
        case "not-allowed":
          setError("Microphone permission denied. Please allow microphone access.")
          break
        default:
          setError(`Speech recognition error: ${event.error}`)
      }
    }

    recognition.onend = () => {
      console.log("Speech recognition ended")
      setIsTranscribing(false)
      if (isRecording && !isPaused && recognitionRef.current) {
        try {
          recognitionRef.current.start()
        } catch (err) {
          console.error("Failed to restart speech recognition:", err)
          setError("Failed to restart speech recognition")
        }
      }
    }

    return recognition
  }, [setAnswer, setError, isRecording, isPaused])

  // ---- Setup Recognition on Mount ----
  useEffect(() => {
    recognitionRef.current = initializeRecognition()
    return () => {
      recognitionRef.current?.stop()
      console.log("Speech recognition cleanup")
    }
  }, [initializeRecognition])

  // ---- Stop Recording Cleanup ----
  useEffect(() => {
    if (!isRecording && (mediaRecorder?.state === "recording" || isTranscribing)) {
      mediaRecorder?.stop()
      recognitionRef.current?.stop()
      setMediaRecorder(null)
      setIsTranscribing(false)
      setAnswer("")
      recognitionRef.current = initializeRecognition()
    }
  }, [isRecording, mediaRecorder, isTranscribing, setAnswer, initializeRecognition])

  // ---- Permissions ----
  const requestPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: includeCamera,
      })
      stream.getTracks().forEach((track) => track.stop())
      return true
    } catch (err) {
      console.error("Permission error:", err)
      setError("Microphone and camera permissions are required.")
      return false
    }
  }

  // ---- Cleanup ----
  const cleanupAudioAndTimers = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
    setElapsedSec(0)
    analyserRef.current = null
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close()
      } catch {
        /* ignore */
      }
    }
    audioContextRef.current = null
  }

  // ---- Toggle Recording ----
  const toggleRecording = async () => {
    if (mediaRecorder?.state === "recording") {
      setIsRecording(false)
      return
    }

    const allowed = await requestPermissions()
    if (!allowed) return

    try {
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } as MediaTrackConstraints,
        video: includeCamera,
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []

      // ---- Audio visualization ----
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext!
      const audioContext = new AudioContextClass()
      audioContextRef.current = audioContext
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 2048
      analyserRef.current = analyser
      source.connect(analyser)
      const dataArray = new Uint8Array(analyser.frequencyBinCount)

      const loop = () => {
        analyser.getByteTimeDomainData(dataArray)
        let sum = 0
        for (let i = 0; i < dataArray.length; i++) {
          const v = (dataArray[i] - 128) / 128
          sum += v * v
        }
        const rms = Math.sqrt(sum / dataArray.length)
        setVolume(Math.min(100, Math.round(rms * 140)))
        rafRef.current = requestAnimationFrame(loop)
      }
      rafRef.current = requestAnimationFrame(loop)

      // ---- Timer ----
      const startedAt = Date.now()
      timerRef.current = window.setInterval(() => {
        setElapsedSec(Math.floor((Date.now() - startedAt) / 1000))
      }, 1000)

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        console.log("Recording stopped, chunks:", chunksRef.current.length)
        onRecordingStop(chunksRef.current)
        stream.getTracks().forEach((t) => t.stop())
        cleanupAudioAndTimers()
        setMediaRecorder(null)
        setIsRecording(false)
      }

      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
      setAnswer("")

      if (recognitionRef.current) {
        try {
          recognitionRef.current.start()
          console.log("Starting speech recognition")
        } catch (err) {
          console.error("Failed to start speech recognition:", err)
          setError(
            "Failed to start speech recognition: Please check microphone permissions."
          )
        }
      }
    } catch (err) {
      console.error("Recording error:", err)
      setError("Failed to start recording: Microphone or camera access denied.")
    }
  }

  // ---- Format Timer ----
  const formatTime = (total: number) => {
    const m = Math.floor(total / 60)
      .toString()
      .padStart(2, "0")
    const s = Math.floor(total % 60)
      .toString()
      .padStart(2, "0")
    return `${m}:${s}`
  }

  // ---- UI ----
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Button
          onClick={toggleRecording}
          variant={isRecording ? "destructive" : "default"}
          disabled={isPaused}
        >
          {isRecording ? (
            <StopCircle className="mr-2 h-4 w-4" />
          ) : (
            <Mic className="mr-2 h-4 w-4" />
          )}
          {isRecording ? "Stop Recording" : "Start Recording"}
        </Button>

        {/* Status pill */}
        <div
          className="hidden md:flex items-center gap-2 rounded-full border border-border/50 bg-muted/40 px-3 py-1"
          aria-live="polite"
        >
          <span
            className={`h-2 w-2 rounded-full ${
              isRecording ? "bg-primary" : "bg-muted-foreground/50"
            }`}
          />
          <span className="text-xs text-muted-foreground">
            {isRecording ? `Recording • ${formatTime(elapsedSec)}` : "Idle"}
          </span>
        </div>

        {/* VU meter */}
        {isRecording && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Level</span>
            <div className="h-2 w-28 rounded bg-muted/60 overflow-hidden">
              <div
                className="h-full bg-primary transition-[width]"
                style={{ width: `${Math.max(4, volume)}%` }}
                aria-label="Microphone input level"
              />
            </div>
          </div>
        )}
      </div>

      {/* Options */}
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            className="accent-current"
            checked={includeCamera}
            onChange={(e) => setIncludeCamera(e.target.checked)}
            aria-label="Include camera in recording"
          />
          Include camera
        </label>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            className="accent-current"
            checked={autoSave}
            onChange={(e) => setAutoSave(e.target.checked)}
            aria-label="Auto-save recording on stop"
          />
          Auto-save on stop
        </label>
        {isTranscribing && (
          <p className="text-sm text-muted-foreground" aria-live="polite">
            Transcribing speech…
          </p>
        )}
      </div>
    </div>
  )
}
