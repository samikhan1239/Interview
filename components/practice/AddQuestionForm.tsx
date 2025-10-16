"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Clock, Plus, Sparkles, Trash2 } from "lucide-react"

interface CustomQuestion {
  text: string
  difficulty: "easy" | "medium" | "hard"
  timeLimit: number
}

interface AddQuestionFormProps {
  onAddQuestion: (question: CustomQuestion) => void
  onStart: () => void
  questions: CustomQuestion[]
}

const personalQuestions: CustomQuestion[] = [
  { text: "Tell me about yourself.", difficulty: "easy", timeLimit: 90 },
  { text: "Why should we hire you?", difficulty: "medium", timeLimit: 90 },
  { text: "What are your strengths and weaknesses?", difficulty: "medium", timeLimit: 120 },
  { text: "Describe a challenge you faced and how you solved it.", difficulty: "hard", timeLimit: 120 },
]

const technicalQuestions: CustomQuestion[] = [
  { text: "What is MongoDB?", difficulty: "easy", timeLimit: 60 },
  { text: "Explain REST APIs.", difficulty: "medium", timeLimit: 90 },
  { text: "What is version control? Give an example.", difficulty: "easy", timeLimit: 60 },
  { text: "What is CI/CD?", difficulty: "medium", timeLimit: 120 },
  { text: "Explain microservices architecture.", difficulty: "hard", timeLimit: 120 },
]

const difficultyColors = {
  easy: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  hard: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

export default function AddQuestionForm({ onAddQuestion, onStart, questions }: AddQuestionFormProps) {
  const [newQuestionText, setNewQuestionText] = useState("")
  const [newQuestionDifficulty, setNewQuestionDifficulty] = useState<"easy" | "medium" | "hard">("easy")
  const [newQuestionTimeLimit, setNewQuestionTimeLimit] = useState<number>(60)

  const addCustomQuestion = () => {
    if (!newQuestionText.trim()) return
    onAddQuestion({ text: newQuestionText, difficulty: newQuestionDifficulty, timeLimit: newQuestionTimeLimit })
    setNewQuestionText("")
    setNewQuestionDifficulty("easy")
    setNewQuestionTimeLimit(60)
  }

  return (
    <section className="w-full bg-gradient-to-b from-background via-muted/10 to-background py-20 px-4">
    

      {/* Tabs Section */}
      <div className="max-w-7xl mx-auto">
        <Tabs defaultValue="personal" className="w-full space-y-10">
          <TabsList className="flex w-full justify-center gap-3 bg-transparent mb-6">
            {["personal", "technical", "custom"].map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="flex-1 sm:flex-none px-6 py-3 rounded-full text-sm sm:text-base font-medium border border-border/50 
                data-[state=active]:bg-primary data-[state=active]:text-white 
                hover:bg-primary/10 transition-all duration-300"
              >
                {tab === "personal" && "💼 Personal"}
                {tab === "technical" && "💻 Technical"}
                {tab === "custom" && "✏️ Custom"}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* PERSONAL TAB */}
          <TabsContent value="personal">
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {personalQuestions.map((q, i) => (
                <div key={i} className="group p-5 bg-white/60 rounded-xl border hover:shadow-md transition-all">
                  <p className="font-medium text-sm mb-3">{q.text}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <Badge className={`${difficultyColors[q.difficulty]} px-2 py-0.5`}>
                      {q.difficulty}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" /> {q.timeLimit}s
                    </div>
                  </div>
                  <Button
                    onClick={() => onAddQuestion(q)}
                    variant="outline"
                    className="w-full mt-4 text-sm hover:bg-primary hover:text-white transition"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* TECHNICAL TAB */}
          <TabsContent value="technical">
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {technicalQuestions.map((q, i) => (
                <div key={i} className="group p-5 bg-white/60 rounded-xl border hover:shadow-md transition-all">
                  <p className="font-medium text-sm mb-3">{q.text}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <Badge className={`${difficultyColors[q.difficulty]} px-2 py-0.5`}>
                      {q.difficulty}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" /> {q.timeLimit}s
                    </div>
                  </div>
                  <Button
                    onClick={() => onAddQuestion(q)}
                    variant="outline"
                    className="w-full mt-4 text-sm hover:bg-primary hover:text-white transition"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* CUSTOM TAB */}
          <TabsContent value="custom">
            <div className="max-w-3xl mx-auto bg-white/60 p-8 rounded-2xl border shadow-sm space-y-6">
              <div>
                <Label htmlFor="custom-question">Question Text</Label>
                <Input
                  id="custom-question"
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  placeholder="Enter your custom question..."
                  className="h-12 mt-2"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <Label>Difficulty</Label>
                  <Select
                    value={newQuestionDifficulty}
                    onValueChange={(val) => setNewQuestionDifficulty(val as "easy" | "medium" | "hard")}
                  >
                    <SelectTrigger className="h-12 mt-2">
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Time Limit (seconds)</Label>
                  <Input
                    type="number"
                    value={newQuestionTimeLimit}
                    onChange={(e) => setNewQuestionTimeLimit(Number(e.target.value))}
                    min={30}
                    max={300}
                    className="h-12 mt-2"
                  />
                </div>
              </div>
              <Button
                onClick={addCustomQuestion}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-white text-base font-medium"
              >
                <Plus className="w-5 h-5 mr-2" /> Add Custom Question
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* My Question Set */}
       {/* My Question Set */}
{questions.length > 0 && (
  <div className="mt-20">
    <h3 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
      🧠 My Question Set
    </h3>

    <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
      {questions.map((q, i) => (
        <div
          key={i}
          className="relative group rounded-2xl border border-border/50 bg-white/50 backdrop-blur-md 
                     p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
        >
          {/* Decorative glow on hover */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 via-transparent to-transparent 
                          opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Question text */}
          <p className="font-medium text-sm mb-4 text-gray-800 leading-snug line-clamp-3">
            {q.text}
          </p>

          {/* Difficulty and time */}
          <div className="flex items-center justify-between mb-4">
            <Badge
              className={`${difficultyColors[q.difficulty]} text-xs px-2 py-0.5 rounded-md capitalize`}
            >
              {q.difficulty}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-4 h-4" /> {q.timeLimit}s
            </div>
          </div>

          {/* Progress line for time difficulty visual */}
          <div className="h-2 rounded-full overflow-hidden bg-muted/50">
            <div
              className={`h-full ${
                q.difficulty === "easy"
                  ? "bg-green-400"
                  : q.difficulty === "medium"
                  ? "bg-yellow-400"
                  : "bg-red-400"
              }`}
              style={{
                width:
                  q.difficulty === "easy"
                    ? "40%"
                    : q.difficulty === "medium"
                    ? "70%"
                    : "100%",
              }}
            ></div>
          </div>

          {/* Floating Add/Remove or reorder option */}
          <button
            className="absolute top-3 right-3 text-muted-foreground hover:text-red-500 transition"
            title="Remove question"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  </div>
)}

        {/* Start Button */}
        <div className="mt-16 text-center">
          <Button
            onClick={onStart}
            size="lg"
            className="px-10 py-6 rounded-full font-semibold bg-primary hover:bg-primary/90 text-white shadow-lg"
          >
            Start Practice Session <Sparkles className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>
    </section>
  )
}
