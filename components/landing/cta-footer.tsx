"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export function CTAFooter() {
  return (
    <section className="mt-12 md:mt-16 border-t border-border bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12 md:py-16 grid md:grid-cols-2 gap-8 items-center">
        <div>
          <h2 className="text-balance text-2xl md:text-3xl font-semibold tracking-tight">
            Ready to try a smarter interview?
          </h2>
          <p className="text-pretty opacity-90 mt-2 md:mt-3">
            Start an AI-driven session in seconds or jump into the dashboard to review candidates.
          </p>
        </div>
        <div className="flex md:justify-end gap-3">
          <Button asChild variant="secondary">
            <Link href="/interview">Start Interview</Link>
          </Button>
          <Button asChild variant="outline" className="bg-background text-foreground hover:bg-secondary">
            <Link href="/dashboard">Open Dashboard</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
