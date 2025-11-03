/**
 * AWS Lambda function for Claude Code Session Runner
 * This function handles:
 * - Session management (create, update, delete)
 * - Message storage and retrieval
 * - Integration with Claude API for code execution
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  ScanCommand,
} = require('@aws-sdk/lib-dynamodb')
const { v4: uuidv4 } = require('uuid')

const client = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(client)

const SESSIONS_TABLE = process.env.SESSIONS_TABLE || 'claude-code-sessions'
const MESSAGES_TABLE = process.env.MESSAGES_TABLE || 'claude-code-messages'
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

// CORS headers
const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
}

/**
 * Main handler
 */
exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2))

  // Handle OPTIONS for CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  try {
    const path = event.path
    const method = event.httpMethod

    // Route requests
    if (path.includes('/sessions') && !path.includes('/messages')) {
      return await handleSessionRequest(event, method)
    } else if (path.includes('/messages')) {
      return await handleMessageRequest(event, method)
    } else if (path.includes('/execute')) {
      return await handleExecuteRequest(event)
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Not found' }),
    }
  } catch (error) {
    console.error('Error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    }
  }
}

/**
 * Handle session-related requests
 */
async function handleSessionRequest(event, method) {
  const queryParams = event.queryStringParameters || {}
  const body = event.body ? JSON.parse(event.body) : {}

  switch (method) {
    case 'GET':
      return await listSessions(queryParams.tenantId)
    case 'POST':
      return await createSession(body)
    case 'PUT':
      return await updateSession(body)
    case 'DELETE':
      return await deleteSession(queryParams.sessionId)
    default:
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' }),
      }
  }
}

/**
 * List sessions for a tenant
 */
async function listSessions(tenantId) {
  if (!tenantId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'tenantId is required' }),
    }
  }

  const command = new QueryCommand({
    TableName: SESSIONS_TABLE,
    IndexName: 'tenantId-index',
    KeyConditionExpression: 'tenantId = :tenantId',
    ExpressionAttributeValues: {
      ':tenantId': tenantId,
    },
    ScanIndexForward: false,
  })

  const result = await docClient.send(command)

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      sessions: result.Items || [],
      total: result.Items?.length || 0,
    }),
  }
}

/**
 * Create a new session
 */
async function createSession(data) {
  const { tenantId, name, workingDirectory, model } = data

  if (!tenantId || !name || !workingDirectory) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: 'tenantId, name, and workingDirectory are required',
      }),
    }
  }

  const session = {
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

  const command = new PutCommand({
    TableName: SESSIONS_TABLE,
    Item: session,
  })

  await docClient.send(command)

  return {
    statusCode: 201,
    headers,
    body: JSON.stringify(session),
  }
}

/**
 * Update a session
 */
async function updateSession(data) {
  const { sessionId, status, metadata } = data

  if (!sessionId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'sessionId is required' }),
    }
  }

  const updateExpression = []
  const expressionAttributeValues = {}
  const expressionAttributeNames = {}

  if (status) {
    updateExpression.push('#status = :status')
    expressionAttributeValues[':status'] = status
    expressionAttributeNames['#status'] = 'status'
  }

  if (metadata) {
    updateExpression.push('metadata = :metadata')
    expressionAttributeValues[':metadata'] = metadata
  }

  updateExpression.push('updatedAt = :updatedAt')
  expressionAttributeValues[':updatedAt'] = new Date().toISOString()

  const command = new UpdateCommand({
    TableName: SESSIONS_TABLE,
    Key: { id: sessionId },
    UpdateExpression: `SET ${updateExpression.join(', ')}`,
    ExpressionAttributeValues: expressionAttributeValues,
    ...(Object.keys(expressionAttributeNames).length > 0 && {
      ExpressionAttributeNames: expressionAttributeNames,
    }),
    ReturnValues: 'ALL_NEW',
  })

  const result = await docClient.send(command)

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(result.Attributes),
  }
}

/**
 * Delete (end) a session
 */
async function deleteSession(sessionId) {
  if (!sessionId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'sessionId is required' }),
    }
  }

  const command = new UpdateCommand({
    TableName: SESSIONS_TABLE,
    Key: { id: sessionId },
    UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
    ExpressionAttributeNames: {
      '#status': 'status',
    },
    ExpressionAttributeValues: {
      ':status': 'ended',
      ':updatedAt': new Date().toISOString(),
    },
    ReturnValues: 'ALL_NEW',
  })

  const result = await docClient.send(command)

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(result.Attributes),
  }
}

/**
 * Handle message-related requests
 */
async function handleMessageRequest(event, method) {
  const pathParts = event.path.split('/')
  const sessionId = pathParts[pathParts.length - 2]
  const body = event.body ? JSON.parse(event.body) : {}

  switch (method) {
    case 'GET':
      return await getMessages(sessionId)
    case 'POST':
      return await sendPrompt(sessionId, body)
    default:
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' }),
      }
  }
}

/**
 * Get messages for a session
 */
async function getMessages(sessionId) {
  if (!sessionId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'sessionId is required' }),
    }
  }

  const command = new QueryCommand({
    TableName: MESSAGES_TABLE,
    KeyConditionExpression: 'sessionId = :sessionId',
    ExpressionAttributeValues: {
      ':sessionId': sessionId,
    },
    ScanIndexForward: true,
  })

  const result = await docClient.send(command)

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      messages: result.Items || [],
      total: result.Items?.length || 0,
    }),
  }
}

/**
 * Send a prompt and get response
 */
async function sendPrompt(sessionId, data) {
  const { prompt } = data

  if (!prompt) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'prompt is required' }),
    }
  }

  // Store prompt message
  const promptMessage = {
    id: uuidv4(),
    sessionId,
    type: 'prompt',
    content: prompt,
    timestamp: new Date().toISOString(),
  }

  await docClient.send(
    new PutCommand({
      TableName: MESSAGES_TABLE,
      Item: promptMessage,
    })
  )

  // Call Claude API (simplified - in production, use full Claude Code API)
  const responseContent = await callClaudeAPI(prompt)

  // Store response message
  const responseMessage = {
    id: uuidv4(),
    sessionId,
    type: 'response',
    content: responseContent,
    timestamp: new Date().toISOString(),
    metadata: {
      tokensUsed: 150, // In production, get from API response
    },
  }

  await docClient.send(
    new PutCommand({
      TableName: MESSAGES_TABLE,
      Item: responseMessage,
    })
  )

  // Update session
  await docClient.send(
    new UpdateCommand({
      TableName: SESSIONS_TABLE,
      Key: { id: sessionId },
      UpdateExpression:
        'SET lastActivity = :now, metadata.totalPrompts = metadata.totalPrompts + :inc',
      ExpressionAttributeValues: {
        ':now': new Date().toISOString(),
        ':inc': 1,
      },
    })
  )

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      prompt: promptMessage,
      response: responseMessage,
    }),
  }
}

/**
 * Call Claude API
 * This is a simplified version - in production, integrate with full Claude Code API
 */
async function callClaudeAPI(prompt) {
  // TODO: Implement actual Claude API integration with code execution capabilities
  // For now, return a simulated response
  return `Received prompt: "${prompt}"\n\nThis is a simulated response from the Lambda function. In production, this will integrate with the Claude API to provide code execution capabilities.`
}

/**
 * Handle code execution requests
 */
async function handleExecuteRequest(event) {
  const body = event.body ? JSON.parse(event.body) : {}
  const { sessionId, code, language } = body

  // TODO: Implement code execution via Claude API
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      output: 'Code execution not yet implemented',
      sessionId,
    }),
  }
}
