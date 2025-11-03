# Fernando Chat Setup Guide

## Overview

The Fernando Chat feature provides a conversational interface where Peter can have ongoing conversations with Fernando (powered by Claude Sonnet 4.5) that persist across sessions.

## Features

- **Full-screen chat interface** - Clean, modern design inspired by Claude.ai and ChatGPT
- **Persistent conversations** - All conversations are saved and can be resumed anytime
- **Conversation management** - View, switch between, and delete conversations
- **Auto-generated titles** - Conversations are automatically titled based on the first message
- **Message history** - Complete history with timestamps for each message
- **Markdown support** - Fernando's responses support code blocks, bold, italic, and inline code
- **Mobile responsive** - Works seamlessly on desktop and mobile devices
- **Typing indicators** - Shows when Fernando is thinking
- **Error handling** - Graceful error handling with retry capability

## Architecture

### Frontend Components

- **`app/admin/chat/page.tsx`** - Main chat interface
- **`components/ChatMessage.tsx`** - Individual message component with markdown rendering
- **`components/ConversationList.tsx`** - Conversation sidebar with search and management

### Backend APIs

- **`app/api/chat/route.ts`** - Send messages and get Claude responses
  - `POST /api/chat` - Send a message and get Fernando's response
  - `GET /api/chat?conversationId=xxx` - Get all messages in a conversation

- **`app/api/conversations/route.ts`** - Conversation management
  - `GET /api/conversations` - List all conversations
  - `DELETE /api/conversations?conversationId=xxx` - Delete a conversation

### Data Layer

- **DynamoDB Tables:**
  - `fernando-conversations` - Conversation metadata
  - `fernando-messages` - Individual messages

### AI Integration

- **AWS Bedrock** - Claude Sonnet 4.5 (`anthropic.claude-sonnet-4-5-20250929-v1:0`)
- System prompt includes Fernando's personality and role
- Context-aware responses using conversation history

## DynamoDB Schema

### fernando-conversations

```
Primary Key:
  - tenantId (HASH) - Partition key
  - conversationId (RANGE) - Sort key

Attributes:
  - title: string (auto-generated from first message)
  - createdAt: ISO timestamp
  - updatedAt: ISO timestamp
  - messageCount: number
  - lastMessage: string (preview of last user message)
```

### fernando-messages

```
Primary Key:
  - messageId (HASH) - Partition key

Global Secondary Index (conversationId-index):
  - conversationId (HASH)

Attributes:
  - conversationId: string
  - tenantId: string
  - role: 'user' | 'assistant'
  - content: string (message text)
  - timestamp: ISO timestamp
```

## Setup Instructions

### Prerequisites

1. AWS account with Bedrock access
2. AWS credentials configured (access key + secret key)
3. DynamoDB access

### Step 1: Configure Environment Variables

Add to your `.env.local`:

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here

# DynamoDB Tables (optional - defaults shown)
DYNAMODB_CONVERSATIONS_TABLE=fernando-conversations
DYNAMODB_MESSAGES_TABLE=fernando-messages

# Existing variables
NEXT_PUBLIC_TENANT_ID=peter
```

### Step 2: Create DynamoDB Tables

Run the setup script:

```bash
node scripts/setup-chat-tables.js
```

This will create both tables with the correct schema and indexes.

**Alternative: Manual Table Creation**

If you prefer to create tables manually via AWS Console:

#### Table 1: fernando-conversations

1. Go to DynamoDB → Create table
2. Table name: `fernando-conversations`
3. Partition key: `tenantId` (String)
4. Sort key: `conversationId` (String)
5. Billing mode: On-demand

#### Table 2: fernando-messages

1. Go to DynamoDB → Create table
2. Table name: `fernando-messages`
3. Partition key: `messageId` (String)
4. Billing mode: On-demand
5. After creation, add Global Secondary Index:
   - Index name: `conversationId-index`
   - Partition key: `conversationId` (String)
   - Projection: All attributes

### Step 3: Verify AWS Bedrock Access

Ensure your AWS account has access to Claude Sonnet 4.5:

1. Go to AWS Bedrock Console
2. Navigate to "Model access" in us-east-1
3. Request access to "Anthropic Claude Sonnet 4.5" if not already enabled
4. Wait for approval (usually instant for existing accounts)

### Step 4: Install Dependencies

All dependencies are already installed, including:

- `@aws-sdk/client-bedrock-runtime` - For Claude API calls
- `@aws-sdk/client-dynamodb` - For DynamoDB operations
- `uuid` - For generating IDs

### Step 5: Start the Development Server

```bash
npm run dev
```

Navigate to: `http://localhost:3003/admin/chat`

## Usage

### Starting a New Conversation

1. Click "New Conversation" button
2. Type your message in the input box
3. Press Enter or click the send button
4. Fernando will respond, and the conversation will be saved

### Resuming a Conversation

1. Click on any conversation in the sidebar
2. The full message history will load
3. Continue the conversation where you left off

### Deleting a Conversation

1. Hover over a conversation in the sidebar
2. Click the trash icon
3. Click again to confirm deletion
4. The conversation and all its messages will be permanently deleted

### Mobile Usage

- Tap the hamburger menu to open the conversation list
- Conversations slide in from the left
- Tap outside to close the sidebar
- All features work the same as desktop

## API Reference

### Send Message

```typescript
POST /api/chat
Content-Type: application/json

{
  "message": "Your message here",
  "conversationId": "optional-existing-conversation-id"
}

Response:
{
  "message": {
    "id": "message-id",
    "conversationId": "conversation-id",
    "tenantId": "peter",
    "role": "assistant",
    "content": "Fernando's response",
    "timestamp": "2025-01-15T10:30:00.000Z"
  },
  "conversation": {
    "conversationId": "conversation-id",
    "tenantId": "peter",
    "title": "Your message here...",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z",
    "messageCount": 2
  }
}
```

### Get Conversation Messages

```typescript
GET /api/chat?conversationId=xxx

Response:
{
  "messages": [
    {
      "id": "message-id",
      "conversationId": "conversation-id",
      "tenantId": "peter",
      "role": "user",
      "content": "Hello",
      "timestamp": "2025-01-15T10:30:00.000Z"
    },
    // ... more messages
  ]
}
```

### List Conversations

```typescript
GET /api/conversations?limit=20

Response:
{
  "conversations": [
    {
      "conversationId": "conversation-id",
      "tenantId": "peter",
      "title": "Conversation title",
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-15T10:30:00.000Z",
      "messageCount": 10,
      "lastMessage": "Last user message preview..."
    },
    // ... more conversations
  ],
  "total": 5
}
```

### Delete Conversation

```typescript
DELETE /api/conversations?conversationId=xxx

Response:
{
  "success": true
}
```

## Fernando's System Prompt

Fernando is configured with the following personality and capabilities:

```
You are Fernando, Peter's personal AI assistant and knowledge companion.

Your role:
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
```

## Customization

### Changing the Model

Edit `/Users/pfaquart/fernando-web/app/api/chat/route.ts`:

```typescript
const BEDROCK_MODEL_ID = 'anthropic.claude-sonnet-4-5-20250929-v1:0'
```

### Modifying the System Prompt

Edit the `SYSTEM_PROMPT` constant in `/Users/pfaquart/fernando-web/app/api/chat/route.ts`

### Adjusting Conversation List Limit

Default is 20 most recent conversations. Change in the chat page:

```typescript
await getConversations(20) // Change this number
```

## Troubleshooting

### "Failed to get response from Claude"

- Verify AWS Bedrock access is enabled for Claude Sonnet 4.5
- Check AWS credentials are correct
- Ensure region is set to us-east-1

### "Failed to fetch conversations"

- Verify DynamoDB tables are created
- Check table names match environment variables
- Verify AWS credentials have DynamoDB permissions

### Messages not persisting

- Check DynamoDB write permissions
- Verify table schema is correct
- Check browser console for API errors

### Markdown not rendering

- Check message content in database
- Verify ChatMessage component is parsing correctly
- Clear browser cache

## Cost Considerations

### DynamoDB

- **On-demand billing**: Pay only for reads/writes
- **Typical usage**: ~$0.25-$1 per 1000 messages
- **Storage**: First 25GB is free

### AWS Bedrock (Claude)

- **Input tokens**: ~$0.003 per 1K tokens
- **Output tokens**: ~$0.015 per 1K tokens
- **Average conversation**: $0.01-$0.05 per exchange

**Estimated monthly cost** (100 conversations, 20 messages each):
- DynamoDB: ~$2-5
- Bedrock: ~$20-40
- **Total**: ~$25-50/month

## Version History

- **v2.2.0** - Initial chat feature release
  - Full conversational interface
  - DynamoDB persistence
  - Claude Sonnet 4.5 integration
  - Mobile responsive design
  - Conversation management

## Support

For issues or questions:
1. Check this documentation
2. Review error messages in browser console
3. Check AWS CloudWatch logs for API errors
4. Verify DynamoDB table structure

## Next Steps

Potential future enhancements:
- [ ] Streaming responses (real-time token generation)
- [ ] Knowledge base integration (auto-fetch relevant context)
- [ ] Conversation search
- [ ] Export conversations
- [ ] Voice input/output
- [ ] File uploads
- [ ] Multi-user support
- [ ] Conversation sharing
