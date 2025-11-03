import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

// GET /api/agents - Get all agents
export async function GET(_request: NextRequest) {
  const session = await getServerSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // TODO: Implement actual agent fetching from DynamoDB
  // For now, return empty array - WebSocket will provide real data
  return NextResponse.json({
    agents: [],
    message: 'Use WebSocket connection for real-time agent data',
  })
}

// POST /api/agents - Spawn a new agent
export async function POST(request: NextRequest) {
  const session = await getServerSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await request.json()
    // TODO: Extract parentId, task, name from body when implementing
    // const { parentId, task, name } = body

    // TODO: Implement agent spawning via Lambda
    // This would invoke a Lambda function to create a new agent

    return NextResponse.json({
      success: true,
      message: 'Agent spawn requested',
      agentId: `agent-${Date.now()}`,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to spawn agent' },
      { status: 500 }
    )
  }
}
