#!/usr/bin/env node

/**
 * Setup script for Fernando Chat DynamoDB tables
 *
 * This script creates the necessary DynamoDB tables for the chat feature:
 * 1. fernando-conversations - Stores conversation metadata
 * 2. fernando-messages - Stores individual chat messages
 *
 * Usage:
 *   node scripts/setup-chat-tables.js
 *
 * Environment variables (optional):
 *   AWS_REGION - AWS region (default: us-east-1)
 *   AWS_ACCESS_KEY_ID - AWS access key
 *   AWS_SECRET_ACCESS_KEY - AWS secret key
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const {
  CreateTableCommand,
  DescribeTableCommand,
  waitUntilTableExists,
} = require('@aws-sdk/client-dynamodb')

const region = process.env.AWS_REGION || 'us-east-1'

const client = new DynamoDBClient({
  region,
  credentials:
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
})

// Table definitions
const conversationsTable = {
  TableName: 'fernando-conversations',
  KeySchema: [
    { AttributeName: 'tenantId', KeyType: 'HASH' }, // Partition key
    { AttributeName: 'conversationId', KeyType: 'RANGE' }, // Sort key
  ],
  AttributeDefinitions: [
    { AttributeName: 'tenantId', AttributeType: 'S' },
    { AttributeName: 'conversationId', AttributeType: 'S' },
  ],
  BillingMode: 'PAY_PER_REQUEST',
}

const messagesTable = {
  TableName: 'fernando-messages',
  KeySchema: [
    { AttributeName: 'messageId', KeyType: 'HASH' }, // Partition key
  ],
  AttributeDefinitions: [
    { AttributeName: 'messageId', AttributeType: 'S' },
    { AttributeName: 'conversationId', AttributeType: 'S' },
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'conversationId-index',
      KeySchema: [
        { AttributeName: 'conversationId', KeyType: 'HASH' },
      ],
      Projection: {
        ProjectionType: 'ALL',
      },
    },
  ],
  BillingMode: 'PAY_PER_REQUEST',
}

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

async function createTable(tableDefinition) {
  const { TableName } = tableDefinition

  console.log(`\nChecking if table "${TableName}" exists...`)

  if (await tableExists(TableName)) {
    console.log(`✅ Table "${TableName}" already exists`)
    return
  }

  console.log(`📝 Creating table "${TableName}"...`)

  try {
    await client.send(new CreateTableCommand(tableDefinition))
    console.log(`⏳ Waiting for table "${TableName}" to be active...`)

    await waitUntilTableExists(
      {
        client,
        maxWaitTime: 60,
        minDelay: 2,
        maxDelay: 5,
      },
      { TableName }
    )

    console.log(`✅ Table "${TableName}" created successfully`)
  } catch (error) {
    console.error(`❌ Error creating table "${TableName}":`, error.message)
    throw error
  }
}

async function main() {
  console.log('🚀 Fernando Chat DynamoDB Setup')
  console.log('================================')
  console.log(`Region: ${region}`)

  try {
    // Create conversations table
    await createTable(conversationsTable)

    // Create messages table
    await createTable(messagesTable)

    console.log('\n✅ All tables are ready!')
    console.log('\nTable Details:')
    console.log('==============')
    console.log(`
1. fernando-conversations
   - Primary Key: tenantId (HASH), conversationId (RANGE)
   - Stores conversation metadata (title, timestamps, message count)

2. fernando-messages
   - Primary Key: messageId (HASH)
   - GSI: conversationId-index (for querying messages by conversation)
   - Stores individual chat messages (role, content, timestamp)
    `)
    console.log('You can now use the chat feature!')
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message)
    process.exit(1)
  }
}

main()
