import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { ClaudeCodeSession, CreateSessionRequest } from '@/lib/types'

// In-memory storage for sessions (will be replaced with DynamoDB)
const sessions = new Map<string, ClaudeCodeSession>()

// GET /api/claude-sessions - List all sessions
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.nextUrl.searchParams.get('tenantId')

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      )
    }

    const tenantSessions = Array.from(sessions.values()).filter(
      (session) => session.tenantId === tenantId
    )

    return NextResponse.json({
      sessions: tenantSessions,
      total: tenantSessions.length,
    })
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}

// POST /api/claude-sessions - Create new session
export async function POST(request: NextRequest) {
  try {
    const body: CreateSessionRequest = await request.json()
    const { tenantId, name, workingDirectory, model } = body

    if (!tenantId || !name || !workingDirectory) {
      return NextResponse.json(
        { error: 'tenantId, name, and workingDirectory are required' },
        { status: 400 }
      )
    }

    const session: ClaudeCodeSession = {
      id: uuidv4(),
      tenantId,
      name,
      workingDirectory,
      status: 'running',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      metadata: {
        model: model || 'claude-sonnet-4',
        totalPrompts: 0,
        filesModified: [],
      },
    }

    sessions.set(session.id, session)

    return NextResponse.json(session, { status: 201 })
  } catch (error) {
    console.error('Error creating session:', error)
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    )
  }
}

// DELETE /api/claude-sessions?sessionId=xxx - End session
export async function DELETE(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      )
    }

    const session = sessions.get(sessionId)
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    session.status = 'ended'
    session.updatedAt = new Date().toISOString()
    sessions.set(sessionId, session)

    return NextResponse.json(session)
  } catch (error) {
    console.error('Error ending session:', error)
    return NextResponse.json(
      { error: 'Failed to end session' },
      { status: 500 }
    )
  }
}
