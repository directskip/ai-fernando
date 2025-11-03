#!/usr/bin/env node
import { DynamoDBClient, CreateTableCommand, DescribeTableCommand } from '@aws-sdk/client-dynamodb'

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
})

const TABLE_NAME = process.env.DYNAMODB_COMMENTS_TABLE || 'fernando-rule-comments'

async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    await client.send(new DescribeTableCommand({ TableName: tableName }))
    return true
  } catch (error: any) {
    if (error.name === 'ResourceNotFoundException') {
      return false
    }
    throw error
  }
}

async function createRuleCommentsTable() {
  console.log('Checking if table exists...')
  const exists = await checkTableExists(TABLE_NAME)

  if (exists) {
    console.log(`✅ Table "${TABLE_NAME}" already exists!`)
    return
  }

  console.log(`Creating table "${TABLE_NAME}"...`)

  const command = new CreateTableCommand({
    TableName: TABLE_NAME,
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
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  })

  try {
    await client.send(command)
    console.log(`✅ Table "${TABLE_NAME}" created successfully!`)
    console.log('\nTable Details:')
    console.log('- Name:', TABLE_NAME)
    console.log('- Primary Key: PK (partition), SK (sort)')
    console.log('- GSI: GSI1 (GSI1PK, GSI1SK)')
    console.log('- Billing: Pay Per Request')
    console.log('\nWaiting for table to become active...')

    // Wait for table to be active
    let isActive = false
    let attempts = 0
    const maxAttempts = 30

    while (!isActive && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000))
      attempts++

      try {
        const result = await client.send(new DescribeTableCommand({ TableName: TABLE_NAME }))
        if (result.Table?.TableStatus === 'ACTIVE') {
          isActive = true
          console.log('✅ Table is now active and ready to use!')
        } else {
          process.stdout.write('.')
        }
      } catch (error) {
        // Keep waiting
      }
    }

    if (!isActive) {
      console.log('\n⚠️  Table creation in progress but not yet active. Check AWS Console.')
    }
  } catch (error: any) {
    console.error('❌ Error creating table:', error.message)
    process.exit(1)
  }
}

// Run the setup
createRuleCommentsTable()
  .then(() => {
    console.log('\n🎉 Setup complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  })
