import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { RuleComment } from './rules'

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  } : undefined,
})

const docClient = DynamoDBDocumentClient.from(client)

const COMMENTS_TABLE = process.env.DYNAMODB_COMMENTS_TABLE || 'fernando-rule-comments'

export interface RuleCommentRecord {
  PK: string // RULE#<ruleId>
  SK: string // COMMENT#<timestamp>#<commentId>
  ruleId: string
  commentId: string
  userId: string
  userName: string
  comment: string
  timestamp: string
}

/**
 * Get all comments for a specific rule
 */
export async function getRuleComments(ruleId: string): Promise<RuleComment[]> {
  try {
    const result = await docClient.send(
      new QueryCommand({
        TableName: COMMENTS_TABLE,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `RULE#${ruleId}`,
          ':sk': 'COMMENT#',
        },
      })
    )

    if (!result.Items) return []

    return result.Items.map((item: any) => ({
      id: item.commentId,
      ruleId: item.ruleId,
      userId: item.userId,
      userName: item.userName,
      comment: item.comment,
      timestamp: item.timestamp,
    }))
  } catch (error) {
    console.error('Error getting rule comments:', error)
    return []
  }
}

/**
 * Get all comments for all rules
 */
export async function getAllRuleComments(): Promise<Record<string, RuleComment[]>> {
  try {
    const result = await docClient.send(
      new QueryCommand({
        TableName: COMMENTS_TABLE,
        IndexName: 'GSI1', // Global secondary index for querying all comments
        KeyConditionExpression: 'GSI1PK = :gsi1pk',
        ExpressionAttributeValues: {
          ':gsi1pk': 'COMMENTS',
        },
      })
    )

    if (!result.Items) return {}

    const commentsByRule: Record<string, RuleComment[]> = {}

    result.Items.forEach((item: any) => {
      const comment: RuleComment = {
        id: item.commentId,
        ruleId: item.ruleId,
        userId: item.userId,
        userName: item.userName,
        comment: item.comment,
        timestamp: item.timestamp,
      }

      if (!commentsByRule[item.ruleId]) {
        commentsByRule[item.ruleId] = []
      }
      commentsByRule[item.ruleId].push(comment)
    })

    // Sort comments by timestamp (newest first)
    Object.keys(commentsByRule).forEach(ruleId => {
      commentsByRule[ruleId].sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
    })

    return commentsByRule
  } catch (error) {
    console.error('Error getting all rule comments:', error)
    return {}
  }
}

/**
 * Add a comment to a rule
 */
export async function addRuleComment(
  ruleId: string,
  userId: string,
  userName: string,
  comment: string
): Promise<RuleComment> {
  const timestamp = new Date().toISOString()
  const commentId = `${timestamp}-${Math.random().toString(36).substring(2, 9)}`

  const record: RuleCommentRecord = {
    PK: `RULE#${ruleId}`,
    SK: `COMMENT#${timestamp}#${commentId}`,
    ruleId,
    commentId,
    userId,
    userName,
    comment,
    timestamp,
  }

  try {
    await docClient.send(
      new PutCommand({
        TableName: COMMENTS_TABLE,
        Item: {
          ...record,
          GSI1PK: 'COMMENTS', // For querying all comments
          GSI1SK: timestamp, // Sort by timestamp
        },
      })
    )

    return {
      id: commentId,
      ruleId,
      userId,
      userName,
      comment,
      timestamp,
    }
  } catch (error) {
    console.error('Error adding rule comment:', error)
    throw new Error('Failed to add comment')
  }
}

/**
 * Create the DynamoDB table for rule comments (for setup/deployment)
 */
export const RULE_COMMENTS_TABLE_DEFINITION = {
  TableName: COMMENTS_TABLE,
  KeySchema: [
    { AttributeName: 'PK', KeyType: 'HASH' },
    { AttributeName: 'SK', KeyType: 'RANGE' },
  ],
  AttributeDefinitions: [
    { AttributeName: 'PK', AttributeType: 'S' },
    { AttributeName: 'SK', AttributeType: 'S' },
    { AttributeName: 'GSI1PK', AttributeType: 'S' },
    { AttributeName: 'GSI1SK', AttributeType: 'S' },
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'GSI1',
      KeySchema: [
        { AttributeName: 'GSI1PK', KeyType: 'HASH' },
        { AttributeName: 'GSI1SK', KeyType: 'RANGE' },
      ],
      Projection: { ProjectionType: 'ALL' },
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
    },
  ],
  BillingMode: 'PAY_PER_REQUEST',
}
