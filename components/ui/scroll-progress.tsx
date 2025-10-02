"use client"

import { useEffect } from "react"

export function ScrollProgress() {
  useEffect(() => {
    const root = document.getElementById("scroll-progress-root")
    if (!root) return
    const bar = document.createElement("div")
    bar.className = "bar"
    root.appendChild(bar)
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      const progress = max > 0 ? (window.scrollY / max) * 100 : 0
      bar.style.width = `${progress}%`
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      root.removeChild(bar)
    }
  }, [])
  return null
}
