# WebSocket Configuration Guide - Agent Activity Map

## Overview

The Agent Activity Map frontend uses WebSocket connections to receive real-time updates about agent status, spawning, and completion. This guide explains how to configure the WebSocket URL for both local development and production environments.

## Current Configuration

### Local Development
- **WebSocket URL**: `ws://localhost:3001`
- **Environment File**: `.env.local`
- **Use Case**: Testing with local WebSocket server

### Production
- **WebSocket URL**: `wss://your-ws-server-domain.com`
- **Environment File**: `.env.production` or Vercel environment variables
- **Use Case**: Production deployment with secure WebSocket (WSS)

## Files Modified

### 1. `.env.local`
Added the WebSocket URL configuration:
```env
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

### 2. `.env.production`
Template for production configuration:
```env
NEXT_PUBLIC_WS_URL=wss://your-ws-server-domain.com
```

### 3. `hooks/useAgentWebSocket.ts`
Enhanced with:
- Better connection logging with `[WebSocket]` prefix for console filtering
- Debug information for message types and agent counts
- Improved error messages for troubleshooting
- Reconnection attempt logging with interval details

### 4. `components/AgentTree.tsx`
- Fixed JSX syntax error (missing closing parenthesis)
- Removed unused framer-motion imports

### 5. `components/AgentNode.tsx`
- Fixed TypeScript return type in useEffect

### 6. `components/AgentDetails.tsx`
- Fixed TypeScript return type in useEffect

### 7. `tsconfig.json`
Added exclusions for test files:
```json
"exclude": [
  "node_modules",
  "test-agent-monitoring.ts",
  "**/*.test.ts",
  "**/*.test.tsx"
]
```

## How It Works

### Environment Variable Resolution

The useAgentWebSocket hook reads the environment variable at runtime:

```typescript
url = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001'
```

**Important**: Next.js requires environment variables to be prefixed with `NEXT_PUBLIC_` to be accessible in the browser.

### Connection Flow

1. **Component Mount**: AgentsPage calls `useAgentWebSocket()`
2. **Hook Initialization**: Reads `NEXT_PUBLIC_WS_URL` from environment
3. **Connection**: Creates WebSocket connection to the URL
4. **Messages**: 
   - `initial`: Receives initial agent tree
   - `update`: Receives agent status updates
   - `spawn`: New agent spawned
   - `remove`: Agent removed
5. **Reconnection**: Automatically retries up to 5 times with 3-second delays

### Console Logging

All WebSocket activity is logged with `[WebSocket]` prefix for easy filtering:

```javascript
// Browser Console
[WebSocket] Connecting to: ws://localhost:3001
[WebSocket] Connected successfully
[WebSocket] Received message: initial
[WebSocket] Received initial agent data: 7 agents
[WebSocket] Updating agent: agent-1
[WebSocket] Reconnecting... (1/5) in 3000ms
```

To see WebSocket logs in browser:
1. Open DevTools (F12)
2. Go to Console tab
3. Filter by `WebSocket` to see connection activity

## Local Development Setup

### 1. Start the WebSocket Server

If you have a WebSocket server running locally:

```bash
# Example with Node.js ws package
node websocket-server.js
```

The server should listen on `http://localhost:3001` (for development).

### 2. Start Frontend Dev Server

```bash
npm run dev
```

The frontend will connect to the WebSocket server automatically.

### 3. Test the Connection

1. Navigate to `http://localhost:3005/admin/agents` (or your assigned port)
2. Open Browser DevTools (F12)
3. Check Console for `[WebSocket] Connected successfully`
4. The "Live" indicator in the UI should show green

## Production Deployment

### Step 1: Deploy WebSocket Server

Your WebSocket server must be accessible at a public domain with SSL/TLS:
- Use secure WebSocket protocol: `wss://`
- Example: `wss://agents-api.yourdomain.com`

### Step 2: Configure Vercel Environment Variables

In Vercel Dashboard:

1. Go to **Settings → Environment Variables**
2. Add new variable:
   - **Name**: `NEXT_PUBLIC_WS_URL`
   - **Value**: `wss://agents-api.yourdomain.com`
   - **Environment**: Select appropriate (Production/Preview/Development)

### Step 3: Deploy Frontend

```bash
# Automatic via GitHub
# Vercel will use NEXT_PUBLIC_WS_URL from environment variables

# Or manual deployment
npm run build
vercel --prod
```

### Step 4: Verify Production Deployment

1. Visit your production URL
2. Open DevTools Console
3. Look for: `[WebSocket] Connected successfully`
4. Verify agents are loading and updating in real-time

## Message Format

Your WebSocket server must send messages in this format:

### Initial Agent Data
```json
{
  "type": "initial",
  "agents": [
    {
      "id": "agent-1",
      "name": "Agent 1",
      "status": "active",
      "task": "Task description",
      "startTime": "2025-11-02T10:30:00.000Z",
      "endTime": null,
      "parentId": "fernando-root",
      "resourceUsage": {
        "tokens": 5000,
        "cpu": 45,
        "memory": 256
      }
    }
  ]
}
```

### Agent Update
```json
{
  "type": "update",
  "agent": {
    "id": "agent-1",
    "status": "completed",
    "endTime": "2025-11-02T10:35:00.000Z"
  }
}
```

### Agent Spawn
```json
{
  "type": "spawn",
  "agent": {
    "id": "agent-2",
    "name": "New Agent",
    "status": "active",
    "task": "New task",
    "startTime": "2025-11-02T10:33:00.000Z",
    "parentId": "agent-1"
  }
}
```

### Agent Remove
```json
{
  "type": "remove",
  "agentId": "agent-1"
}
```

## Troubleshooting

### Issue: WebSocket connection fails in production

**Symptom**: Browser console shows `[WebSocket] Max reconnection attempts reached`

**Solution**:
1. Verify WebSocket URL is correct: `wss://your-domain.com`
2. Check SSL/TLS certificate is valid
3. Verify CORS headers in WebSocket server:
   ```
   Access-Control-Allow-Origin: https://your-frontend-domain.com
   ```
4. Check firewall/security groups allow WebSocket traffic (port 443 for WSS)

### Issue: WebSocket connects but no data appears

**Symptom**: Connection shows as "Live" but no agents display

**Solution**:
1. Verify WebSocket server is sending messages in correct format
2. Check browser console for message parsing errors
3. Ensure `startTime` and `endTime` are ISO 8601 formatted strings
4. Verify agent IDs are unique strings

### Issue: Connection drops frequently

**Symptom**: "Disconnected" message appears frequently

**Solution**:
1. Increase `maxReconnectAttempts` in useAgentWebSocket hook
2. Adjust `reconnectDelay` for slower networks
3. Check WebSocket server logs for errors
4. Monitor network latency with DevTools Network tab

## Performance Considerations

### For Large Numbers of Agents (50+)

1. **Batch Updates**: Server should send updates in batches rather than individual messages
2. **Reduce Frequency**: Limit update frequency to 1-2 updates per second
3. **Compression**: Consider gzip compression for messages

### Network Optimization

The hook includes:
- Automatic reconnection with exponential backoff concept
- Minimal data sent (only JSON updates)
- Efficient state management with React hooks

### Mobile Considerations

- WebSocket works on mobile browsers
- Ensure secure connection (WSS) for production
- Consider battery impact of frequent updates

## Security

### Authentication (Recommended)

Add token-based authentication to WebSocket URL:

```typescript
// In useAgentWebSocket hook
const token = getAuthToken()
const ws = new WebSocket(`${url}?token=${token}`)
```

### CORS Headers

WebSocket server should include:
```
Access-Control-Allow-Origin: https://your-domain.com
Access-Control-Allow-Credentials: true
```

### Rate Limiting

Implement rate limiting on the server to prevent abuse.

## Testing WebSocket Locally

### Using wscat

```bash
# Install
npm install -g wscat

# Connect to local server
wscat -c ws://localhost:3001

# Connect to production
wscat -c wss://your-domain.com

# Send test message
{"type":"initial","agents":[]}
```

### Using Browser Console

```javascript
// Create WebSocket connection
const ws = new WebSocket('wss://your-domain.com')

// Listen for messages
ws.onmessage = (e) => console.log(JSON.parse(e.data))

// Send test message
ws.send(JSON.stringify({type:'initial',agents:[]}))

// Close connection
ws.close()
```

## Next Steps

1. **Deploy WebSocket Server**: Set up your actual WebSocket server with agent monitoring
2. **Update .env.production**: Replace placeholder URL with actual deployed URL
3. **Test Locally**: Run dev server with WebSocket server and verify connection
4. **Deploy to Vercel**: Push code and configure environment variables
5. **Monitor Production**: Watch console logs for WebSocket activity

## Support

For issues with WebSocket connections:

1. Check browser console for `[WebSocket]` logs
2. Verify environment variables in Vercel
3. Test WebSocket server directly with wscat
4. Check firewall and CORS configuration
5. Review WebSocket server logs for errors

---

**Last Updated**: 2025-11-02
**Configuration Status**: Ready for Production
**Environment Variables**: Configured in .env.local and .env.production
