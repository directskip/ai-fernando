import { NextRequest, NextResponse } from 'next/server'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb'
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime'
import { ChatMessage, Conversation, SendMessageRequest, SendMessageResponse } from '@/types/chat'
import { v4 as uuidv4 } from 'uuid'

const dbClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials:
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
})

const docClient = DynamoDBDocumentClient.from(dbClient)

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials:
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
})

const CONVERSATIONS_TABLE = process.env.DYNAMODB_CONVERSATIONS_TABLE || 'fernando-conversations'
const MESSAGES_TABLE = process.env.DYNAMODB_MESSAGES_TABLE || 'fernando-messages'
const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || 'peter'
const BEDROCK_MODEL_ID = 'anthropic.claude-sonnet-4-5-20250929-v1:0'

// System prompt for Fernando
const SYSTEM_PROMPT = `You are Fernando, Peter's personal AI assistant and knowledge companion. Your role is to:

1. Help Peter think through ideas and problems
2. Access and reference Peter's personal knowledge base when relevant
3. Be conversational, helpful, and concise
4. Ask clarifying questions when needed
5. Remember context from the current conversation

Your personality:
- Professional but friendly
- Direct and to the point
- Thoughtful and insightful
- Proactive in offering relevant information

You have access to Peter's knowledge base which includes:
- Public knowledge (facts, resources, general information)
- Conditional knowledge (context-dependent information)
- Private knowledge (personal notes, reflections)
- Preferences (Peter's likes, dislikes, and ways of working)

When answering:
- Be helpful and contextual
- Reference relevant knowledge when applicable
- Keep responses concise unless detail is requested
- Use markdown formatting for clarity (code blocks, bold, italic, lists)
- Ask follow-up questions to better understand Peter's needs`

/**
 * Get conversation history for context
 */
async function getConversationHistory(conversationId: string): Promise<ChatMessage[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: MESSAGES_TABLE,
      IndexName: 'conversationId-index',
      KeyConditionExpression: 'conversationId = :conversationId',
      ExpressionAttributeValues: {
        ':conversationId': conversationId,
      },
      ScanIndexForward: true, // Oldest first
    })
  )

  return (result.Items || []).map((item: any) => ({
    id: item.messageId,
    conversationId: item.conversationId,
    tenantId: item.tenantId,
    role: item.role,
    content: item.content,
    timestamp: item.timestamp,
  }))
}

/**
 * Generate a title from the first user message
 */
function generateTitle(message: string): string {
  const words = message.trim().split(/\s+/)
  const maxWords = 8
  const title = words.slice(0, maxWords).join(' ')
  return title.length < message.length ? title + '...' : title
}

/**
 * Call Claude via AWS Bedrock
 */
async function callClaude(messages: Array<{ role: string; content: string }>): Promise<string> {
  try {
    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: 1.0,
    }

    const command = new InvokeModelCommand({
      modelId: BEDROCK_MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload),
    })

    const response = await bedrockClient.send(command)
    const responseBody = JSON.parse(new TextDecoder().decode(response.body))

    if (responseBody.content && responseBody.content.length > 0) {
      return responseBody.content[0].text
    }

    throw new Error('No content in Claude response')
  } catch (error) {
    console.error('Error calling Claude:', error)
    throw new Error('Failed to get response from Claude')
  }
}

/**
 * POST /api/chat
 * Send a message and get a response from Fernando
 */
export async function POST(request: NextRequest) {
  try {
    const body: SendMessageRequest = await request.json()
    const { conversationId: existingConversationId, message } = body

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    const timestamp = new Date().toISOString()
    let conversationId = existingConversationId
    let conversation: Conversation

    // Create new conversation if needed
    if (!conversationId) {
      conversationId = uuidv4()
      const title = generateTitle(message)

      conversation = {
        conversationId,
        tenantId: TENANT_ID,
        title,
        createdAt: timestamp,
        updatedAt: timestamp,
        messageCount: 0,
      }

      await docClient.send(
        new PutCommand({
          TableName: CONVERSATIONS_TABLE,
          Item: conversation,
        })
      )
    } else {
      // Get existing conversation
      const result = await docClient.send(
        new QueryCommand({
          TableName: CONVERSATIONS_TABLE,
          KeyConditionExpression: 'tenantId = :tenantId AND conversationId = :conversationId',
          ExpressionAttributeValues: {
            ':tenantId': TENANT_ID,
            ':conversationId': conversationId,
          },
        })
      )

      if (!result.Items || result.Items.length === 0) {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        )
      }

      conversation = result.Items[0] as Conversation
    }

    // Save user message
    const userMessageId = uuidv4()

    await docClient.send(
      new PutCommand({
        TableName: MESSAGES_TABLE,
        Item: {
          messageId: userMessageId,
          conversationId,
          tenantId: TENANT_ID,
          role: 'user',
          content: message,
          timestamp,
        },
      })
    )

    // Get conversation history
    const history = await getConversationHistory(conversationId)

    // Prepare messages for Claude (excluding the just-saved user message, we'll add it fresh)
    const claudeMessages = history
      .filter(msg => msg.id !== userMessageId)
      .map(msg => ({
        role: msg.role,
        content: msg.content,
      }))

    // Add the new user message
    claudeMessages.push({
      role: 'user',
      content: message,
    })

    // Get response from Claude
    const assistantContent = await callClaude(claudeMessages)

    // Save assistant message
    const assistantMessageId = uuidv4()
    const assistantTimestamp = new Date().toISOString()
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      conversationId,
      tenantId: TENANT_ID,
      role: 'assistant',
      content: assistantContent,
      timestamp: assistantTimestamp,
    }

    await docClient.send(
      new PutCommand({
        TableName: MESSAGES_TABLE,
        Item: {
          messageId: assistantMessageId,
          conversationId,
          tenantId: TENANT_ID,
          role: 'assistant',
          content: assistantContent,
          timestamp: assistantTimestamp,
        },
      })
    )

    // Update conversation metadata
    const messageCount = (conversation.messageCount || 0) + 2
    await docClient.send(
      new UpdateCommand({
        TableName: CONVERSATIONS_TABLE,
        Key: {
          tenantId: TENANT_ID,
          conversationId,
        },
        UpdateExpression: 'SET updatedAt = :updatedAt, messageCount = :messageCount, lastMessage = :lastMessage',
        ExpressionAttributeValues: {
          ':updatedAt': assistantTimestamp,
          ':messageCount': messageCount,
          ':lastMessage': message.substring(0, 100),
        },
      })
    )

    // Update conversation object
    conversation.updatedAt = assistantTimestamp
    conversation.messageCount = messageCount
    conversation.lastMessage = message.substring(0, 100)

    const response: SendMessageResponse = {
      message: assistantMessage,
      conversation,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error processing chat message:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process message' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/chat?conversationId=xxx
 * Get all messages in a conversation
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId is required' },
        { status: 400 }
      )
    }

    const messages = await getConversationHistory(conversationId)

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}
