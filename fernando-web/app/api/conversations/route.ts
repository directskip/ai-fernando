import { NextRequest, NextResponse } from 'next/server'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  QueryCommand,
  DeleteCommand,
  BatchWriteCommand,
} from '@aws-sdk/lib-dynamodb'
import { Conversation, ConversationsListResponse } from '@/types/chat'

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials:
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
})

const docClient = DynamoDBDocumentClient.from(client)

const CONVERSATIONS_TABLE = process.env.DYNAMODB_CONVERSATIONS_TABLE || 'fernando-conversations'
const MESSAGES_TABLE = process.env.DYNAMODB_MESSAGES_TABLE || 'fernando-messages'
const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || 'peter'

/**
 * GET /api/conversations
 * List all conversations for the tenant
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    const result = await docClient.send(
      new QueryCommand({
        TableName: CONVERSATIONS_TABLE,
        KeyConditionExpression: 'tenantId = :tenantId',
        ExpressionAttributeValues: {
          ':tenantId': TENANT_ID,
        },
        ScanIndexForward: false, // Most recent first
        Limit: limit,
      })
    )

    const conversations: Conversation[] = (result.Items || []).map((item: any) => ({
      conversationId: item.conversationId,
      tenantId: item.tenantId,
      title: item.title,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      messageCount: item.messageCount || 0,
      lastMessage: item.lastMessage,
    }))

    const response: ConversationsListResponse = {
      conversations,
      total: conversations.length,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/conversations?conversationId=xxx
 * Delete a conversation and all its messages
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId is required' },
        { status: 400 }
      )
    }

    // First, get all messages for this conversation
    const messagesResult = await docClient.send(
      new QueryCommand({
        TableName: MESSAGES_TABLE,
        IndexName: 'conversationId-index',
        KeyConditionExpression: 'conversationId = :conversationId',
        ExpressionAttributeValues: {
          ':conversationId': conversationId,
        },
      })
    )

    // Delete all messages in batches (DynamoDB BatchWrite limit is 25 items)
    const messages = messagesResult.Items || []
    const batchSize = 25

    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize)
      await docClient.send(
        new BatchWriteCommand({
          RequestItems: {
            [MESSAGES_TABLE]: batch.map((msg) => ({
              DeleteRequest: {
                Key: {
                  messageId: msg.messageId,
                },
              },
            })),
          },
        })
      )
    }

    // Delete the conversation
    await docClient.send(
      new DeleteCommand({
        TableName: CONVERSATIONS_TABLE,
        Key: {
          tenantId: TENANT_ID,
          conversationId,
        },
      })
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting conversation:', error)
    return NextResponse.json(
      { error: 'Failed to delete conversation' },
      { status: 500 }
    )
  }
}
