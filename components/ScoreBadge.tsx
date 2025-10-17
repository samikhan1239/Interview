"use client"

import { cn } from "@/lib/utils"

interface ScoreBadgeProps {
  score: number
  maxScore?: number
  size?: "sm" | "md" | "lg"
}

export const ScoreBadge = ({ score, maxScore = 100, size = "md" }: ScoreBadgeProps) => {
  const percentage = (score / maxScore) * 100

  const colorClass =
    percentage >= 80
      ? "bg-gradient-to-r from-emerald-500 to-green-400 text-white"
      : percentage >= 60
      ? "bg-gradient-to-r from-amber-400 to-yellow-300 text-black"
      : "bg-gradient-to-r from-rose-500 to-red-400 text-white"

  const sizeClass = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2",
  }[size]

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-medium shadow-sm transition-all duration-300 hover:scale-105",
        colorClass,
        sizeClass
      )}
    >
      {score}/{maxScore}
    </span>
  )
}
