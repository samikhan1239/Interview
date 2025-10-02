"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { loadInterviewState, saveInterviewState } from "@/lib/storage"

export function WelcomeBackModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const state = loadInterviewState()
    setOpen(!!state && state.step === "in-progress")
  }, [])

  const onResume = () => setOpen(false)
  const onRestart = () => {
    saveInterviewState(null)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Welcome back</DialogTitle>
          <DialogDescription>
            You have an interview in progress. Would you like to resume or start over?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="secondary" onClick={onRestart}>
            Start over
          </Button>
          <Button className="bg-[color:var(--primary)] text-[color:var(--primary-foreground)]" onClick={onResume}>
            Resume
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
