import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { ClaudeCodeMessage } from '@/lib/types'

// In-memory storage for messages (will be replaced with DynamoDB)
const messages = new Map<string, ClaudeCodeMessage[]>()

// GET /api/claude-sessions/[sessionId]/messages - Get session messages
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const sessionMessages = messages.get(sessionId) || []

    return NextResponse.json({
      messages: sessionMessages,
      total: sessionMessages.length,
    })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

// POST /api/claude-sessions/[sessionId]/messages - Send prompt
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json(
        { error: 'prompt is required' },
        { status: 400 }
      )
    }

    const sessionMessages = messages.get(sessionId) || []

    // Add prompt message
    const promptMessage: ClaudeCodeMessage = {
      id: uuidv4(),
      sessionId,
      type: 'prompt',
      content: prompt,
      timestamp: new Date().toISOString(),
    }

    sessionMessages.push(promptMessage)

    // Simulate Claude Code response (will be replaced with actual API call)
    const responseMessage: ClaudeCodeMessage = {
      id: uuidv4(),
      sessionId,
      type: 'response',
      content: `Received prompt: "${prompt}"\n\nThis is a simulated response. In production, this will call the Claude API with code execution capabilities.`,
      timestamp: new Date().toISOString(),
      metadata: {
        tokensUsed: 150,
      },
    }

    sessionMessages.push(responseMessage)
    messages.set(sessionId, sessionMessages)

    return NextResponse.json({
      prompt: promptMessage,
      response: responseMessage,
    })
  } catch (error) {
    console.error('Error sending prompt:', error)
    return NextResponse.json(
      { error: 'Failed to send prompt' },
      { status: 500 }
    )
  }
}
