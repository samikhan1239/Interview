"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export function PreviewTabs() {
  return (
    <div id="interview">
      <Tabs defaultValue="interview" className="w-full">
        <TabsList className="grid grid-cols-2 w-full md:w-auto">
          <TabsTrigger value="interview">interview</TabsTrigger>
          <TabsTrigger value="interviewer" id="interviewer">
            Interviewer
          </TabsTrigger>
        </TabsList>

        <TabsContent value="interview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Candidate Chat</CardTitle>
              <CardDescription>Resume upload, field validation, timed questions, and progress.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <PreviewItem label="PDF/DOCX Upload" />
                <PreviewItem label="Extract: Name, Email, Phone" />
                <PreviewItem label="6 questions (2 Easy • 2 Medium • 2 Hard)" />
                <PreviewItem label="20/60/120s timers with auto submit" />
                <PreviewItem label="Pause/Resume with Welcome Back modal" />
              </div>
              <div className="rounded-lg border border-border overflow-hidden">
               <Image
  src="/interview-chat-timeline.jpg"
  alt="Mock of candidate chat with timers and progress bar."
  width={800}   // pick dimensions close to your actual image
  height={600}
  className="w-full h-full object-cover"
/>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interviewer" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Interviewer Dashboard</CardTitle>
              <CardDescription>Ranked candidates with per-question scoring and AI summary.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <PreviewItem label="List candidates ordered by final score" />
                <PreviewItem label="View chat history and profile" />
                <PreviewItem label="AI-generated final summary" />
                <PreviewItem label="Search and sort" />
                <PreviewItem label="Local persistence (auto restore)" />
                <div className="pt-2">
                  <Button>Explore Dashboard</Button>
                </div>
              </div>
              <div className="rounded-lg border border-border overflow-hidden">
          <Image
  src="/dashboard-score-table.jpg"
  alt="Mock of interviewer dashboard with score table and candidate details."
  width={800}   // replace with actual width of your image
  height={600}  // replace with actual height of your image
  className="w-full h-full object-cover"
/>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function PreviewItem({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span aria-hidden className="size-2 rounded-sm bg-primary"></span>
      <span className="text-sm">{label}</span>
    </div>
  )
}
