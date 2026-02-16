"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"

export function Hero() {
  return (
    <section className="bg-secondary/50 border-b border-border">
      <div className="container mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-10">
        <div className="flex flex-col justify-center gap-6">
          <Badge className="w-fit" variant="secondary" aria-label="New capability: timed scoring">
            New • Timed AI Scoring
          </Badge>
          <h1 className="text-balance text-3xl md:text-5xl font-semibold tracking-tight">
            Ace technical interviews with an AI co-interviewer
          </h1>
          <p className="text-pretty text-base md:text-lg opacity-80">
            Upload a resume, auto-fill details, and face a 6-question session that adapts from Easy to Hard. Real-time
            timers, automatic submissions, and an AI summary—all synced to your interviewer dashboard.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/interview/analysis">Start Interview</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/practice">Practice</Link>
            </Button>
          </div>
        </div>

        <Card aria-label="Live preview mock" className="md:translate-y-2">
          <CardContent className="p-4 md:p-6">
            <div className="aspect-[16/10] w-full overflow-hidden rounded-lg border border-border bg-card">
            <Image
  src="/live-chat-preview-mock.jpg"
  alt="Preview of interview chat flow with timers and progress."
  width={800}   // adjust based on your design
  height={600}  // adjust based on your design
  className="h-full w-full object-cover"
/>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-xs opacity-80">
              <div className="rounded-md border border-border bg-background px-2 py-1 text-center">6 Qs</div>
              <div className="rounded-md border border-border bg-background px-2 py-1 text-center">Easy → Hard</div>
              <div className="rounded-md border border-border bg-background px-2 py-1 text-center">Auto Submit</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
