import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const session = await getServerSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { agentId } = await params

  try {
    // TODO: Implement output retrieval from DynamoDB/S3
    // This would:
    // 1. Query agent output from storage
    // 2. Return full output history
    // 3. Include logs, results, and any artifacts

    console.log(`Getting output for agent: ${agentId}`)

    return NextResponse.json({
      agentId,
      output: 'Full agent output would be retrieved from storage...',
      logs: [],
      artifacts: [],
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to retrieve agent output' },
      { status: 500 }
    )
  }
}
