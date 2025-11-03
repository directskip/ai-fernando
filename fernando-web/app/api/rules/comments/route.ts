import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { getAllRuleComments, getRuleComments, addRuleComment } from '@/lib/db'

// GET /api/rules/comments - Get all comments or comments for a specific rule
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const ruleId = searchParams.get('ruleId')

    if (ruleId) {
      // Get comments for a specific rule
      const comments = await getRuleComments(ruleId)
      return NextResponse.json({ comments })
    } else {
      // Get all comments grouped by rule
      const comments = await getAllRuleComments()
      return NextResponse.json({ comments })
    }
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

// POST /api/rules/comments - Add a new comment
export async function POST(request: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { ruleId, comment } = body

    if (!ruleId || !comment) {
      return NextResponse.json(
        { error: 'Missing required fields: ruleId, comment' },
        { status: 400 }
      )
    }

    const userId = session.user.id || session.user.email || 'unknown'
    const userName = session.user.name || session.user.email || 'Unknown User'

    const newComment = await addRuleComment(ruleId, userId, userName, comment)

    // Return all comments for this rule
    const comments = await getRuleComments(ruleId)

    return NextResponse.json({
      success: true,
      comment: newComment,
      comments
    })
  } catch (error) {
    console.error('Error adding comment:', error)
    return NextResponse.json(
      { error: 'Failed to add comment' },
      { status: 500 }
    )
  }
}
