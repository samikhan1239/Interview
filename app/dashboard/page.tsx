"use client"
import { CandidateTable } from "@/components/dashboard/candidate-table"
import { useInView } from "@/hooks/use-in-view"
import { ScrollProgress } from "@/components/ui/scroll-progress"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  // both refs are strongly typed now
  const heroRef = useInView<HTMLElement>()
  const listRef = useInView<HTMLElement>()

  return (
    <main className="min-h-dvh">
      <ScrollProgress />
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-medium">
            AI Interview Assistant
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="secondary">
              <Link href="/interview">Interview</Link>
            </Button>
            <Button
              size="sm"
              onClick={() => {
                localStorage.removeItem("ia:user")
                window.location.href = "/login"
              }}
            >
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <section ref={heroRef} className="section px-4 py-10 md:py-16">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-semibold text-balance">
            Interviewer Dashboard
          </h1>
          <p className="mt-2 text-muted-foreground">
            Review and compare candidate performance.
          </p>
        </div>
      </section>

      <section ref={listRef} className="section px-4 pb-16">
        <div className="max-w-6xl mx-auto">
          <CandidateTable />
        </div>
      </section>
    </main>
  )
}
