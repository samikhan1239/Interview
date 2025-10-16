import { NextRequest, NextResponse } from "next/server"

// In-memory store for signaling data (replace with a database or signaling server in production)
const signalingData: Record<string, { answer?: any; candidates: any[] }> = {}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const interviewId = searchParams.get("interviewId")

  if (!interviewId) {
    return NextResponse.json({ error: "Missing interviewId" }, { status: 400 })
  }

  const data = signalingData[interviewId] || { answer: null, candidates: [] }
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { interviewId, type, data } = body

    if (!interviewId || !type || !data) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!signalingData[interviewId]) {
      signalingData[interviewId] = { answer: null, candidates: [] }
    }

    if (type === "answer") {
      signalingData[interviewId].answer = data
    } else if (type === "candidate") {
      signalingData[interviewId].candidates.push(data)
    }

    // Simulate AI response (in a real app, this would come from an external WebRTC peer)
    const responseData = { type: "answer", data: { sdp: "mock-sdp-response" } } // Placeholder
    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Error processing POST request:", error)
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
  }
}