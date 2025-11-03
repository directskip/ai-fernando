/**
 * Script to set up DynamoDB tables for Claude Code Session Runner
 * Run with: node scripts/setup-dynamodb.js
 */

const {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
} = require('@aws-sdk/client-dynamodb')

const client = new DynamoDBClient({ region: 'us-east-1' })

async function tableExists(tableName) {
  try {
    await client.send(new DescribeTableCommand({ TableName: tableName }))
    return true
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      return false
    }
    throw error
  }
}

async function createSessionsTable() {
  const tableName = 'claude-code-sessions'

  if (await tableExists(tableName)) {
    console.log(`Table ${tableName} already exists`)
    return
  }

  const command = new CreateTableCommand({
    TableName: tableName,
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'tenantId', AttributeType: 'S' },
      { AttributeName: 'createdAt', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'tenantId-index',
        KeySchema: [
          { AttributeName: 'tenantId', KeyType: 'HASH' },
          { AttributeName: 'createdAt', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  })

  await client.send(command)
  console.log(`Created table: ${tableName}`)
}

async function createMessagesTable() {
  const tableName = 'claude-code-messages'

  if (await tableExists(tableName)) {
    console.log(`Table ${tableName} already exists`)
    return
  }

  const command = new CreateTableCommand({
    TableName: tableName,
    KeySchema: [
      { AttributeName: 'sessionId', KeyType: 'HASH' },
      { AttributeName: 'timestamp', KeyType: 'RANGE' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'sessionId', AttributeType: 'S' },
      { AttributeName: 'timestamp', AttributeType: 'S' },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  })

  await client.send(command)
  console.log(`Created table: ${tableName}`)
}

async function main() {
  try {
    console.log('Setting up DynamoDB tables for Claude Code Session Runner...')
    await createSessionsTable()
    await createMessagesTable()
    console.log('Setup complete!')
  } catch (error) {
    console.error('Error setting up tables:', error)
    process.exit(1)
  }
}

main()
