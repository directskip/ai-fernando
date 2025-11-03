# Claude Code Session Runner

A comprehensive web-based Claude Code session runner built into the Fernando admin interface at `/admin/sessions/runner`.

## Features

### 1. Run Sessions in Browser
- **Text Input for Prompts**: Clean, accessible text area with auto-resize
- **Real-time Output Streaming**: Terminal-style output display with color-coded messages
- **Session State Management**: Track session status, activity, and metadata
- **File Tree Viewer**: Browse working directory structure
- **Terminal Output Display**: View all session messages with timestamps and metadata

### 2. Multiple Concurrent Sessions
- **Tab Interface**: Switch between multiple sessions seamlessly
- **Isolated Sessions**: Each session runs independently
- **Tab Management**: Open, close, and switch between sessions
- **Visual Status Indicators**: Color-coded status badges for each session

### 3. Session Management
- **Start New Session**: Create sessions with custom name, working directory, and model
- **End Session**: Gracefully terminate sessions
- **Session History**: View and resume existing sessions
- **Persistent Storage**: All sessions and messages stored in DynamoDB

## Architecture

### Frontend Components

#### `/app/admin/sessions/runner/page.tsx`
Main page component with:
- Session list and management
- Tab interface for multiple sessions
- New session creation form
- Session state management

#### `/components/SessionTab.tsx`
Individual session interface with:
- Terminal/Files view toggle
- Message display and prompt input
- Session controls (end, close)
- Real-time streaming indicators

#### `/components/TerminalOutput.tsx`
Terminal-style output display with:
- Color-coded message types (prompt, response, error, tool_use, system)
- Timestamps and metadata
- Auto-scroll to latest messages
- Expandable tool input/output

#### `/components/PromptInput.tsx`
Intelligent prompt input with:
- Auto-resizing textarea
- Command history (up/down arrows)
- Shift+Enter for multiline
- Visual feedback for disabled state

#### `/components/FileTreeViewer.tsx`
File tree browser with:
- Collapsible directory structure
- File size display
- Click to select files
- Visual hierarchy

### Backend API

#### Next.js API Routes
Located in `/app/api/claude-sessions/`:

1. **GET /api/claude-sessions?tenantId=xxx**
   - List all sessions for a tenant
   - Returns sessions array and total count

2. **POST /api/claude-sessions**
   - Create new session
   - Body: `{ tenantId, name, workingDirectory, model }`
   - Returns created session object

3. **DELETE /api/claude-sessions?sessionId=xxx**
   - End a session (sets status to 'ended')
   - Returns updated session

4. **GET /api/claude-sessions/[sessionId]/messages**
   - Get all messages for a session
   - Returns messages array and total count

5. **POST /api/claude-sessions/[sessionId]/messages**
   - Send prompt to session
   - Body: `{ prompt }`
   - Returns both prompt and response messages

### Lambda Function

Located in `/lambda/claude-code-runner/`:

#### Features
- Session CRUD operations
- Message storage and retrieval
- DynamoDB integration
- Claude API integration (template)
- CORS support

#### Environment Variables
- `SESSIONS_TABLE`: DynamoDB table for sessions
- `MESSAGES_TABLE`: DynamoDB table for messages
- `ANTHROPIC_API_KEY`: Claude API key

### Database Schema

#### Sessions Table (`claude-code-sessions`)
```
Primary Key: id (String)
GSI: tenantId-createdAt-index

Attributes:
- id: string (UUID)
- tenantId: string
- name: string
- workingDirectory: string
- status: 'running' | 'paused' | 'ended'
- createdAt: string (ISO timestamp)
- updatedAt: string (ISO timestamp)
- lastActivity: string (ISO timestamp)
- metadata: {
    model: string
    totalPrompts: number
    filesModified: string[]
  }
```

#### Messages Table (`claude-code-messages`)
```
Primary Key: sessionId (String), Sort Key: timestamp (String)

Attributes:
- id: string (UUID)
- sessionId: string
- type: 'prompt' | 'response' | 'error' | 'tool_use' | 'system'
- content: string
- timestamp: string (ISO timestamp)
- metadata: {
    toolName?: string
    toolInput?: any
    toolOutput?: any
    tokensUsed?: number
  }
```

## Setup & Deployment

### 1. Install Dependencies
```bash
npm install uuid @types/uuid ws @types/ws
```

### 2. Set Up DynamoDB Tables
```bash
node scripts/setup-dynamodb.js
```

This creates:
- `claude-code-sessions` table with tenantId GSI
- `claude-code-messages` table

### 3. Deploy Lambda Function
```bash
cd lambda/claude-code-runner
npm install --production
./scripts/deploy-lambda.sh
```

### 4. Configure API Gateway
1. Create new HTTP API in AWS API Gateway
2. Add Lambda integration pointing to `claude-code-runner`
3. Configure CORS settings
4. Deploy to production stage

### 5. Update Environment Variables
Add to `.env.local`:
```env
NEXT_PUBLIC_CLAUDE_CODE_API_URL=https://your-api-gateway-url.amazonaws.com/prod
```

### 6. Deploy Frontend
```bash
npm run build
vercel --prod
```

## Usage Guide

### Creating a Session

1. Navigate to `/admin/sessions/runner`
2. Click "New Session" or fill out the form
3. Enter:
   - Session name (e.g., "Debug Payment Flow")
   - Working directory (e.g., "/tmp" or actual project path)
   - Model selection (Sonnet 4, Opus 4, or Haiku 4)
4. Click "Create Session"

### Working with Sessions

#### Send Prompts
1. Type your prompt in the input area
2. Press Enter to send (Shift+Enter for newlines)
3. Watch the terminal for streaming responses

#### Navigate History
- Use Up/Down arrows to cycle through previous prompts
- History persists per session

#### View Files
1. Click "Files" tab to see file tree
2. Expand/collapse directories
3. Click files to select (future: view contents)

#### Switch Sessions
1. Use tabs at the top to switch between open sessions
2. Close tabs with the × button
3. Open additional sessions from the session list

### Managing Sessions

#### End a Session
1. Click "End Session" button
2. Confirm the action
3. Session status changes to 'ended'

#### Resume a Session
1. View existing sessions in the list
2. Click "Open" on any session
3. Session opens in a new tab

## Message Types

- **Prompt** (Blue): User input sent to Claude
- **Response** (Green): Claude's response
- **Error** (Red): Error messages
- **Tool Use** (Yellow): When Claude uses tools
- **System** (Gray): System messages and notifications

## Future Enhancements

### Planned Features
1. **WebSocket Support**: Real streaming instead of polling
2. **File Content Viewer**: View and edit files in browser
3. **Session Sharing**: Share sessions between team members
4. **Session Templates**: Pre-configured session setups
5. **Advanced Search**: Search through session history
6. **Export Sessions**: Download session transcripts
7. **Code Diff Viewer**: See file changes in real-time
8. **Multi-agent Orchestration**: Track spawned agents/tasks

### Integration Opportunities
1. **GitHub Integration**: Auto-create sessions from repo
2. **VS Code Extension**: Open sessions from editor
3. **Slack Bot**: Run sessions via Slack commands
4. **Cron Jobs**: Schedule automated sessions

## Technical Notes

### State Management
- React useState for local component state
- In-memory storage for development (replaced with DynamoDB in production)
- Session state syncs with backend on every action

### Performance Considerations
- Messages loaded on-demand per session
- File tree lazy-loaded when tab is opened
- Polling for updates (will be replaced with WebSocket)

### Security
- All requests require tenant authentication
- Sessions isolated by tenantId
- API routes protected by Next.js middleware
- Lambda function uses IAM roles for DynamoDB access

## Testing

### Local Testing
```bash
# Start dev server
npm run dev

# Navigate to
http://localhost:3000/admin/sessions/runner

# Test creating multiple sessions
# Test sending prompts
# Test switching between sessions
# Test ending sessions
```

### Load Testing
```bash
# Test concurrent sessions (simulated)
# Create 5+ sessions simultaneously
# Send prompts to multiple sessions
# Monitor performance and response times
```

## Troubleshooting

### Sessions Not Loading
- Check API endpoint is accessible
- Verify tenantId in environment variables
- Check DynamoDB tables exist and have correct permissions

### Messages Not Streaming
- Verify Lambda function is deployed
- Check CloudWatch logs for errors
- Ensure API Gateway is configured correctly

### File Tree Not Showing
- File tree feature requires backend implementation
- Check working directory is accessible
- Verify permissions on Lambda execution role

## Cost Estimation

### AWS Costs (Monthly)
- **DynamoDB**: ~$5-10 (on-demand pricing)
- **Lambda**: ~$1-5 (first 1M requests free)
- **API Gateway**: ~$3.50 per million requests
- **CloudWatch Logs**: ~$0.50

**Total**: ~$10-20/month for moderate usage

## Support

For issues or questions:
1. Check CloudWatch logs for Lambda errors
2. Review Next.js console for frontend errors
3. Verify environment variables are set correctly
4. Check DynamoDB tables for data consistency

## License

Part of the Fernando Web project.
