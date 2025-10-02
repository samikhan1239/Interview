"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import Image from "next/image"

export function FeatureCards() {
  const features = [
    {
      title: "Lightning-fast UX",
      desc: "Clean, minimal UI with instant feedback. Built mobile-first with smooth micro-interactions.",
      img: "/clean-ui-overview.jpg",
    },
    {
      title: "Crystal-clear timing",
      desc: "Per-question timers that adapt by difficulty and auto-submit to keep interviews on track.",
      img: "/timer-controls.jpg",
    },
    {
      title: "Insightful scoring",
      desc: "AI evaluates responses, generates summaries, and ranks candidates so you can decide faster.",
      img: "/scoring-summary.jpg",
    },
  ]
  return (
    <div id="features" className="grid md:grid-cols-3 gap-6">
      {features.map((f) => (
        <Card key={f.title} className="flex flex-col overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base md:text-lg">{f.title}</CardTitle>
            <CardDescription>{f.desc}</CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <div className="rounded-lg border border-border overflow-hidden">
             <Image
  src={f.img || "/placeholder.svg"}
  alt={`${f.title} illustration`}
  width={500} // required
  height={200} // required
  className="w-full h-40 md:h-48 object-cover"
/>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
