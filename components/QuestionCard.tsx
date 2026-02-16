"use client"

import { Question } from "@/models/Interview"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScoreBadge } from "@/components/ScoreBadge"

interface QuestionCardProps {
  question: Question
  index: number
}

export const QuestionCard = ({ question, index }: QuestionCardProps) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return "bg-success/10 text-success border-success/20"
      case "medium":
        return "bg-warning/10 text-warning border-warning/20"
      case "hard":
        return "bg-destructive/10 text-destructive border-destructive/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  // Derive a detailed insight from correction, enhanced for fallback
  const insight = question.correction
    ? question.correction.includes("professional with relevant experience")
      ? "Key improvement: Structured response to highlight professional skills and experience."
      : `Key improvement: ${question.correction.split(". ")[0]}.`
    : "No specific improvement suggested.";

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg">
      <CardHeader className="bg-muted/30">
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
              {index + 1}
            </span>
            <span className="flex-1">{question.prompt}</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={getDifficultyColor(question.difficulty)}>
              {question.difficulty}
            </Badge>
            <ScoreBadge score={question.score || 0} size="sm" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div>
          <h4 className="font-semibold text-sm text-muted-foreground mb-1">Your Answer</h4>
          <p className="text-foreground">{question.answer || "No answer provided"}</p>
        </div>
        
        {question.correction && (
          <div className="border-l-4 border-primary pl-4 py-2 bg-primary/5 rounded">
            <h4 className="font-semibold text-sm text-primary mb-1">AI Correction</h4>
            <p className="text-sm text-foreground">{question.correction}</p>
          </div>
        )}
        
        {question.feedback && (
          <div className="border-l-4 border-accent pl-4 py-2 bg-accent/5 rounded">
            <h4 className="font-semibold text-sm text-accent mb-1">Feedback</h4>
            <p className="text-sm text-foreground">{question.feedback}</p>
          </div>
        )}

        {/* AI Insight Section */}
        <div className="border-l-4 border-accent/50 pl-4 py-2 bg-accent/5 rounded">
          <h4 className="font-semibold text-sm text-accent/70 mb-1">AI Insight</h4>
          <p className="text-sm text-foreground">{insight}</p>
        </div>
      </CardContent>
    </Card>
  )
}