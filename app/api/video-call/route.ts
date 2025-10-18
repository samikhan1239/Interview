import { NextRequest, NextResponse } from "next/server"

// Define a type for signaling data (type-safe)
interface SignalingInfo {
  answer?: RTCSessionDescriptionInit
  candidates: RTCIceCandidateInit[]
}

// In-memory store for signaling data
const signalingData: Record<string, SignalingInfo> = {}

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
    const body = await req.json() as {
      interviewId: string
      type: "answer" | "candidate"
      data: RTCSessionDescriptionInit | RTCIceCandidateInit
    }

    const { interviewId, type, data } = body

    if (!interviewId || !type || !data) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!signalingData[interviewId]) {
      signalingData[interviewId] = { candidates: [] }
    }

    if (type === "answer") {
      signalingData[interviewId].answer = data as RTCSessionDescriptionInit
    } else if (type === "candidate") {
      signalingData[interviewId].candidates.push(data as RTCIceCandidateInit)
    }

    // Simulate AI response (placeholder)
    const responseData = { type: "answer", data: { sdp: "mock-sdp-response" } }
    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Error processing POST request:", error)
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
  }
}
