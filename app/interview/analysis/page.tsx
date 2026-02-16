"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Upload, FileText, Award, Sparkles, X } from "lucide-react"
import { cn } from "@/lib/utils"

type ResumeResult = {
  predicted_role?: string
  recommended_job?: string
  name?: string
  email?: string
  phone?: string
  skills: string[]   // ✅ always array (never undefined)
}

export default function AnalysisPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ResumeResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) setFile(selected)
  }

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a resume file.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/ml", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Analysis failed")
      }

      const data: ResumeResult = await res.json()

      // ✅ Ensure skills is always array
      setResult({
        ...data,
        skills: data.skills ?? [],
      })

    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Something went wrong. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setResult(null)
    setFile(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 lg:py-20">
        <div className="space-y-12">

          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 mx-auto">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Resume Analysis
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Upload your resume to get instant role matching and key insights
            </p>
          </div>

          {!result ? (
            <div className="space-y-10 max-w-2xl mx-auto">

              {/* Upload Area */}
              <div
                className={cn(
                  "group relative rounded-2xl border-2 border-dashed transition-all duration-200",
                  "px-6 py-14 sm:px-12 sm:py-20 text-center",
                  file
                    ? "border-primary/40 bg-primary/5"
                    : "border-border/70 hover:border-primary/40 hover:bg-muted/30 cursor-pointer"
                )}
                onClick={!file ? openFileDialog : undefined}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {!file ? (
                  <div className="space-y-6">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted/60">
                      <Upload className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>

                    <div className="space-y-3">
                      <p className="text-2xl font-semibold">
                        Drop your resume here
                      </p>
                      <p className="text-base text-muted-foreground">
                        PDF or TXT • up to 5 MB
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      size="lg"
                      className="mt-4 border-primary/60 hover:bg-primary/5 hover:text-primary"
                      disabled={loading}
                    >
                      Select Resume
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-center gap-5 flex-wrap">
                      <FileText className="h-12 w-12 text-primary flex-shrink-0" />
                      <div className="text-left min-w-0">
                        <p className="font-medium text-xl truncate max-w-[360px] sm:max-w-lg">
                          {file.name}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1.5">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-muted-foreground hover:text-destructive hover:border-destructive/30"
                      onClick={(e) => {
                        e.stopPropagation()
                        setFile(null)
                      }}
                    >
                      <X className="h-4 w-4" />
                      Remove file
                    </Button>
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  size="lg"
                  className="min-w-[220px] h-12 text-base font-medium"
                  onClick={handleUpload}
                  disabled={loading || !file}
                >
                  {loading ? (
                    <>
                      <span className="mr-2.5 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Analyzing Resume...
                    </>
                  ) : (
                    "Analyze Resume"
                  )}
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="min-w-[220px] h-12"
                  onClick={() =>
                    window.open("https://resume-parsing-duky.onrender.com/", "_blank")
                  }
                >
                  Open ML Server
                </Button>
              </div>

              {error && (
                <p className="text-sm text-destructive text-center bg-destructive/5 py-3 px-5 rounded-lg border border-destructive/20 max-w-md mx-auto">
                  {error}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-14 max-w-3xl mx-auto">

              {/* Predicted Role */}
              <div className="text-center space-y-5 pb-8 border-b">
                <div className="inline-flex items-center gap-2.5 text-primary">
                  <Award className="h-6 w-6" />
                  <span className="uppercase text-sm font-semibold tracking-wider">
                    Top Predicted Role
                  </span>
                </div>
                <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">
                  {result.predicted_role || "Not detected"}
                </h2>
              </div>

              {/* Skills */}
              <div className="space-y-6">
                <div className="flex items-center justify-center sm:justify-start gap-2.5">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h3 className="text-xl font-semibold">Extracted Skills</h3>
                </div>

                {result.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2.5 justify-center sm:justify-start">
                    {result.skills.map((skill, i) => (
                      <div
                        key={i}
                        className="rounded-full bg-secondary/70 px-4 py-1.5 text-sm font-medium border border-border/40"
                      >
                        {skill}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground italic py-8">
                    No specific skills were extracted from this resume.
                  </p>
                )}
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                <Button
                  size="lg"
                  className="min-w-[220px] h-11"
                  onClick={() =>
                    router.push(
                      `/interview?role=${encodeURIComponent(
                        result.recommended_job || result.predicted_role || ""
                      )}`
                    )
                  }
                >
                  Start Interview
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="min-w-[220px] h-11"
                  onClick={reset}
                >
                  Analyze Another Resume
                </Button>
              </div>

            </div>
          )}

          <p className="text-center text-sm text-muted-foreground pt-10">
            Powered by AI • Results are estimates • Max file size 5 MB
          </p>

        </div>
      </div>
    </main>
  )
}
