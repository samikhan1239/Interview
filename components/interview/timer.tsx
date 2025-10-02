"use client"

import { useEffect, useRef, useState } from "react"

export function Timer({ seconds, onElapsed }: { seconds: number; onElapsed: () => void }) {
  const [remaining, setRemaining] = useState(seconds)
  const didEmitRef = useRef(false) // tracks if we've already called onElapsed for the current cycle

  // Reset remaining and emission guard when seconds changes
  useEffect(() => {
    didEmitRef.current = false
    setRemaining(seconds)
  }, [seconds])

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id)
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [seconds]) // include seconds so the interval restarts when duration changes

  // Call onElapsed only after commit when remaining hits 0, and only once per cycle
  useEffect(() => {
    if (remaining === 0 && !didEmitRef.current) {
      didEmitRef.current = true
      onElapsed()
    }
  }, [remaining, onElapsed])

  return (
    <div aria-live="polite" className="text-sm px-2 py-1 rounded-full border text-muted-foreground">
      {remaining}s
    </div>
  )
}
