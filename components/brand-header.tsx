"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export function BrandHeader() {
  return (
    <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-background/70 border-b border-border">
      <div className="container mx-auto px-4 h-14 md:h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2" aria-label="AI Interview Assistant Home">
          <span aria-hidden className="size-6 rounded-lg bg-primary"></span>
          <span className="font-semibold tracking-tight">Interview Assistant</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          <Link href="#interview" className="text-sm opacity-80 hover:opacity-100 transition-opacity">
            interview
          </Link>
          <Link href="#interviewer" className="text-sm opacity-80 hover:opacity-100 transition-opacity">
            Interviewer
          </Link>
          <Link href="#features" className="text-sm opacity-80 hover:opacity-100 transition-opacity">
            Features
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" className="hidden md:inline-flex">
            <Link href="/practice">Practice</Link>
          </Button>
          <Button asChild>
            <Link href="/interview/analysis">Start Interview</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
