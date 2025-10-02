"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useInView } from "@/hooks/use-in-view"
import { ResumeUpload } from "@/components/resume-upload"
import { InterviewChat } from "@/components/interview/chat-panel"
import { WelcomeBackModal } from "@/components/welcome-back-modal"
import { ScrollProgress } from "@/components/ui/scroll-progress"

interface ExtractedData {
  name: string | null
  email: string | null
  phone: string | null
  rawText: string
}

export default function InterviewPage() {
  const heroRef = useInView<HTMLDivElement>()
  const sectionRef = useInView<HTMLDivElement>()

  const [candidateData, setCandidateData] = useState<ExtractedData>({
    name: null,
    email: null,
    phone: null,
    rawText: ""
  })
  const [started, setStarted] = useState(false)
  const [score, setScore] = useState<number | null>(null)

  useEffect(() => {
    // Load candidate data from localStorage
    const savedData = localStorage.getItem("ia:user")
    if (savedData) {
      const parsed = JSON.parse(savedData)
      setCandidateData({
        name: parsed.name || null,
        email: parsed.email || null,
        phone: parsed.phone || null,
        rawText: parsed.rawText || ""
      })
      setScore(parsed.score || null)
      setStarted(parsed.started || false)
    }
  }, [])

  useEffect(() => {
    // Save candidate data to localStorage whenever it changes
    localStorage.setItem(
      "ia:user",
      JSON.stringify({
        ...candidateData,
        started,
        score
      })
    )
  }, [candidateData, started, score])

  const handleExtract = (data: ExtractedData) => {
    setCandidateData(data)
  }

  const onStart = () => setStarted(true)
  const onFinish = (s: number) => setScore(s)

  const isDataComplete = candidateData.name && candidateData.email && candidateData.phone

  return (
    <main className="min-h-dvh">
      <ScrollProgress />
      <WelcomeBackModal />
      <section ref={heroRef} className="section parallax px-4 py-10 md:py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-semibold text-balance">Interview Mode</h1>
          <p className="mt-2 text-muted-foreground">Upload your resume and complete 6 timed questions.</p>
        </div>
      </section>

      {!started && score === null && (
        <section ref={sectionRef } className="section px-4 pb-12">
          <Card className="max-w-3xl mx-auto shadow-md">
            <CardHeader>
              <CardTitle>Prepare</CardTitle>
              <CardDescription>Upload your resume to extract your details.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm">Resume</label>
                <ResumeUpload onExtract={handleExtract} />
                {candidateData.rawText && (
                  <p className="text-xs text-muted-foreground">
                    Extracted length: {candidateData.rawText.length} characters
                  </p>
                )}
                {isDataComplete && (
                  <div className="text-sm text-muted-foreground">
                    <p><strong>Name:</strong> {candidateData.name}</p>
                    <p><strong>Email:</strong> {candidateData.email}</p>
                    <p><strong>Phone:</strong> {candidateData.phone}</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end">
                <Button
                  disabled={!isDataComplete}
                  onClick={onStart}
                  className="bg-[color:var(--primary)] text-[color:var(--primary-foreground)]"
                >
                  Start interview
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {started && score === null && (
        <section className="px-4 pb-12">
          <div className="max-w-3xl mx-auto">
            <InterviewChat
              candidateName={candidateData.name!}
              candidateEmail={candidateData.email!}
              candidatePhone={candidateData.phone!}
              resumeText={candidateData.rawText}
              onFinish={onFinish}
            />
          </div>
        </section>
      )}

      {score !== null && (
        <section className="px-4 pb-16">
          <Card className="max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle>Great work!</CardTitle>
              <CardDescription>Your total score</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="text-4xl font-semibold">{score}</div>
              <Button variant="secondary" onClick={() => (window.location.href = "/dashboard")}>
                View dashboard
              </Button>
            </CardContent>
          </Card>
        </section>
      )}
    </main>
  )
}