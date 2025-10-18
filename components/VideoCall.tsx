"use client"

import React, { useEffect, useRef, useState } from "react"
import { Maximize, Minimize, Video, VideoOff, Mic, MicOff, MonitorUp } from "lucide-react"

interface VideoCallProps {
  interviewId: string
  onError: (error: string) => void
}

export default function VideoCall({ onError }: VideoCallProps) {
  const [mainVideo, setMainVideo] = useState<"interviewer" | "user">("interviewer")
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(true)

  const userVideoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Initialize user media
  useEffect(() => {
    let localStream: MediaStream | null = null

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localStream = stream
        if (userVideoRef.current) {
          userVideoRef.current.srcObject = stream
        }
      })
      .catch(() => {
        onError("Failed to access camera or microphone")
      })

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [onError])

  // Handle fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  const toggleFullScreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current
        .requestFullscreen()
        .catch((err) => {
          console.error("Fullscreen error:", err)
          onError("Failed to enter fullscreen mode")
        })
    } else {
      document.exitFullscreen().catch((err) => {
        console.error("Exit fullscreen error:", err)
        onError("Failed to exit fullscreen mode")
      })
    }
  }

  const toggleMute = () => {
    if (userVideoRef.current && userVideoRef.current.srcObject) {
      const stream = userVideoRef.current.srcObject as MediaStream
      stream.getAudioTracks().forEach((track) => (track.enabled = !track.enabled))
      setIsMuted((prev) => !prev)
    }
  }

  const toggleVideo = () => {
    if (userVideoRef.current && userVideoRef.current.srcObject) {
      const stream = userVideoRef.current.srcObject as MediaStream
      stream.getVideoTracks().forEach((track) => (track.enabled = !track.enabled))
      setIsVideoOn((prev) => !prev)
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl overflow-hidden shadow-elevated"
      style={{ aspectRatio: "16/9" }}
    >
      {/* Status indicator */}
      <div className="absolute top-6 left-6 z-20 animate-slide-up">
        <div className="backdrop-blur-glass bg-gradient-glass rounded-full px-4 py-2 shadow-glass border border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-white text-sm font-medium">Interview in progress</span>
          </div>
        </div>
      </div>

      {/* Main Video */}
      <div
        className="relative w-full h-full cursor-pointer group"
        onClick={() => setMainVideo(mainVideo === "user" ? "interviewer" : "user")}
      >
        {mainVideo === "interviewer" ? (
          <div className="relative w-full h-full">
            <video
              src="/ai3.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-contain"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute bottom-6 left-6 backdrop-blur-glass bg-gradient-glass rounded-xl px-4 py-2 shadow-glass border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="text-white text-sm font-medium">AI Interviewer</span>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full">
            <video
              ref={userVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-contain bg-gray-900"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute bottom-6 left-6 backdrop-blur-glass bg-gradient-glass rounded-xl px-4 py-2 shadow-glass border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="text-white text-sm font-medium">You</span>
            </div>
          </div>
        )}
      </div>

      {/* Small floating video */}
      <div
        className="absolute bottom-6 right-6 w-32 h-24 sm:w-40 sm:h-28 md:w-48 md:h-36 rounded-xl overflow-hidden shadow-elevated border-2 border-white/20 cursor-pointer hover:scale-105 hover:border-accent transition-all duration-300 animate-scale-in z-10"
        onClick={() => setMainVideo(mainVideo === "user" ? "interviewer" : "user")}
      >
        {mainVideo === "interviewer" ? (
          <div className="relative w-full h-full group">
            <video
              ref={userVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-contain bg-gray-900"
            />
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-300" />
            <div className="absolute bottom-2 left-2 backdrop-blur-glass bg-gradient-glass rounded-lg px-2 py-1 shadow-glass border border-white/10">
              <span className="text-white text-xs font-medium">You</span>
            </div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <MonitorUp className="w-6 h-6 text-white" />
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full group">
            <video
              src="/ai3.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-contain"
            />
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-300" />
            <div className="absolute bottom-2 left-2 backdrop-blur-glass bg-gradient-glass rounded-lg px-2 py-1 shadow-glass border border-white/10">
              <span className="text-white text-xs font-medium">AI Interviewer</span>
            </div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <MonitorUp className="w-6 h-6 text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Control bar */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 animate-slide-up">
        <div className="backdrop-blur-glass bg-gradient-glass rounded-2xl px-4 py-3 shadow-elevated border border-white/10">
          <div className="flex items-center gap-3">
            {/* Mute Button */}
            <button
              onClick={toggleMute}
              className={`p-3 rounded-xl transition-all duration-300 ${
                isMuted ? "bg-destructive hover:bg-destructive/90" : "bg-white/10 hover:bg-white/20"
              }`}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <MicOff className="w-5 h-5 text-white" />
              ) : (
                <Mic className="w-5 h-5 text-white" />
              )}
            </button>

            {/* Video Button */}
            <button
              onClick={toggleVideo}
              className={`p-3 rounded-xl transition-all duration-300 ${
                !isVideoOn ? "bg-destructive hover:bg-destructive/90" : "bg-white/10 hover:bg-white/20"
              }`}
              title={isVideoOn ? "Turn off camera" : "Turn on camera"}
            >
              {isVideoOn ? (
                <Video className="w-5 h-5 text-white" />
              ) : (
                <VideoOff className="w-5 h-5 text-white" />
              )}
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullScreen}
              className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-300"
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? (
                <Minimize className="w-5 h-5 text-white" />
              ) : (
                <Maximize className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Gradient overlays */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/30 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
    </div>
  )
}
