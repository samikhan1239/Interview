"use client"

import { cn } from "@/lib/utils"

interface ScoreBadgeProps {
  score: number
  maxScore?: number
  size?: "sm" | "md" | "lg"
}

export const ScoreBadge = ({ score, maxScore = 100, size = "md" }: ScoreBadgeProps) => {
  const percentage = (score / maxScore) * 100
  
  const getScoreColor = () => {
    if (percentage >= 80) return "bg-success text-success-foreground"
    if (percentage >= 60) return "bg-warning text-warning-foreground"
    return "bg-destructive text-destructive-foreground"
  }
  
  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2",
  }
  
  return (
    <div className={cn(
      "inline-flex items-center justify-center rounded-full font-semibold",
      getScoreColor(),
      sizeClasses[size]
    )}>
      {score}/{maxScore}
    </div>
  )
}