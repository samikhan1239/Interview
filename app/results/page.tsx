"use client"

import React, { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Award, Target } from "lucide-react" // Added Lightbulb for AI Insights
import { interviewDB } from "@/lib/storage"
import { Interview } from "@/models/Interview"
import { QuestionCard } from "@/components/QuestionCard"

export default function ResultsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [interview, setInterview] = useState<Interview | null>(null)

  useEffect(() => {
    const interviewId = searchParams.get("interviewId")
    if (!interviewId) {
      router.push("/dashboard")
      return
    }

    const interviewData = interviewDB.getById(interviewId)
    if (interviewData) {
      setInterview(interviewData)
    } else {
      router.push("/dashboard")
    }
  }, [router, searchParams])

  if (!interview) {
    return (
      <main className="min-h-dvh flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="h-8 w-48 bg-muted rounded mx-auto mb-4"></div>
            <div className="h-4 w-32 bg-muted rounded mx-auto"></div>
          </div>
        </div>
      </main>
    )
  }


  const totalQuestions = interview.questions.length


const totalScore = interview.questions.reduce(
  (sum, q) => sum + (q.score || 0),
  0
)

const averageScore =
  totalQuestions > 0
    ? Math.round(totalScore / totalQuestions)
    : 0




  return (
    <main className="min-h-dvh bg-background">
      <div className="bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <section className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-4xl mx-auto">
            <Button
              variant="ghost"
              onClick={() => router.push("/dashboard")}
              className="mb-6 -ml-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Award className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">Practice Results</h1>
            </div>

            <Card className="shadow-xl border-border/50 mb-8">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl">Your Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="text-center p-6 rounded-lg bg-muted/30">
                    <div className="flex items-center justify-center mb-2">
                      <Target className="h-5 w-5 text-primary mr-2" />
                      <p className="text-sm font-medium text-muted-foreground">Overall Score</p>
                    </div>
                    <p className="text-4xl font-bold text-primary">{averageScore}%</p>
                  </div>
                  <div className="text-center p-6 rounded-lg bg-muted/30">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Questions Completed</p>
                    <p className="text-4xl font-bold text-foreground">{totalQuestions}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold">{averageScore}%</span>
                  </div>
                  <Progress value={averageScore} className="h-3" />
                </div>
              </CardContent>
            </Card>

            {/* New AI Insights Section */}
           
          </div>
        </section>
      </div>

      <section className="container mx-auto px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Question Breakdown</h2>
          <div className="space-y-6">
            {interview.questions.map((question, index) => (
              <QuestionCard key={question.id} question={question} index={index} />
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}