# Agent Activity Map - Real-Time Visualization System

## Overview

The Agent Activity Map is a sophisticated real-time visualization system that displays Fernando's agent hierarchy and status using an interactive tree diagram. Built with React Flow, it provides live updates via WebSocket and comprehensive controls for managing agent operations.

## Location

**URL**: `/admin/agents`

**Access**: Protected route - requires authentication

## Features

### 1. Interactive Tree Visualization

- **React Flow Integration**: Professional node-based visualization with smooth interactions
- **Hierarchical Layout**: Dagre algorithm for automatic tree positioning
- **Fernando at Root**: Main AI assistant at the top of the hierarchy
- **Parent-Child Relationships**: Visual connections showing agent spawning relationships
- **Expandable/Collapsible**: Zoom and pan controls for exploring large agent trees

### 2. Real-Time Status Indicators

Visual status system with color-coded indicators:

- **🟢 Green (Active)**: Agent is currently working/processing
  - Includes pulse animation to draw attention
  - Animated edges between active agents
- **🟡 Yellow (Idle)**: Agent is waiting for input or next task
- **🔴 Red (Error)**: Agent encountered an error or failed
  - Displays error message in details panel
- **⚫ Gray (Completed)**: Agent has finished its task
  - Shows completion time and duration

### 3. Agent Node Information

Each node displays:
- **Agent Name**: Unique identifier or role-based name
- **Status Badge**: Color-coded current state
- **Task Summary**: Brief description (truncated to 2 lines)
- **Duration**: Real-time elapsed time or completion time
- **Resource Usage**: Token count, CPU, and memory (when available)
- **Error Indicator**: Red badge when errors occur

### 4. Detailed Agent Panel

Click any agent node to view comprehensive details:

#### Information Display
- Full agent name and ID
- Complete task description
- Start and end timestamps
- Total duration
- Resource usage breakdown (tokens, CPU, memory)
- Output preview (first 6 lines)
- Full error messages when applicable

#### Agent Controls
- **View Full Output**: Opens complete agent output, logs, and artifacts
- **Pause Agent**: Temporarily suspend active agent (active agents only)
- **Kill Agent**: Terminate running agent (active/idle agents only)
- **Restart Agent**: Re-spawn failed agent with same configuration (error state only)

### 5. Overview Statistics Panel

Top-left panel showing real-time counts:
- Active agents (🟢)
- Idle agents (🟡)
- Failed agents (🔴)
- Completed agents (⚫)
- Total agent count

### 6. Connection Status

Real-time connectivity indicator:
- **Green pulse**: Connected to WebSocket (live data)
- **Gray**: Disconnected (showing mock data)
- **Error banner**: Connection errors with details
- **Reconnect button**: Manual reconnection trigger

### 7. Animations

Powered by Framer Motion:
- **Node entrance**: Spring animation when agents spawn
- **Status pulse**: Breathing effect on active agents
- **Edge animation**: Flowing lines between active nodes
- **Panel transitions**: Smooth slide-in for details panel
- **Hover effects**: Interactive feedback on all controls

## Technical Architecture

### Frontend Components

#### 1. **AgentTree Component** (`/components/AgentTree.tsx`)
Main visualization container:
- React Flow setup and configuration
- Dagre layout algorithm integration
- Node and edge state management
- Overview statistics panel
- WebSocket data integration

#### 2. **AgentNode Component** (`/components/AgentNode.tsx`)
Custom node renderer:
- Status indicator with animations
- Task preview and truncation
- Duration formatting
- Resource usage display
- Click handler for details

#### 3. **AgentDetails Component** (`/components/AgentDetails.tsx`)
Side panel with full agent information:
- Slide-in animation
- Comprehensive data display
- Action buttons with confirmations
- Error handling and display

#### 4. **useAgentWebSocket Hook** (`/hooks/useAgentWebSocket.ts`)
Real-time data management:
- WebSocket connection lifecycle
- Automatic reconnection with exponential backoff
- Message parsing and state updates
- Support for multiple message types (initial, update, spawn, remove)

### Data Types

#### AgentNode Interface (`/types/agent.ts`)
```typescript
interface AgentNode {
  id: string
  name: string
  status: 'active' | 'idle' | 'error' | 'completed'
  task: string
  startTime: Date
  endTime?: Date
  parentId?: string
  output?: string
  error?: string
  resourceUsage?: {
    cpu?: number
    memory?: number
    tokens?: number
  }
}
```

### API Endpoints

#### GET `/api/agents`
Retrieve all agents (primarily for initial load, real-time uses WebSocket)

#### POST `/api/agents`
Spawn a new agent
- Body: `{ parentId?, task, name }`

#### POST `/api/agents/[agentId]/pause`
Pause an active agent

#### POST `/api/agents/[agentId]/kill`
Terminate a running agent

#### POST `/api/agents/[agentId]/restart`
Restart a failed agent

#### GET `/api/agents/[agentId]/output`
Retrieve full agent output, logs, and artifacts

### WebSocket Protocol

#### Connection
- URL: `process.env.NEXT_PUBLIC_WS_URL` (configurable)
- Auto-reconnect: Up to 5 attempts with 3s delay
- State synchronization on connect

#### Message Types

**Initial Data**
```json
{
  "type": "initial",
  "agents": [...]
}
```

**Agent Update**
```json
{
  "type": "update",
  "agent": { ... }
}
```

**New Agent Spawn**
```json
{
  "type": "spawn",
  "agent": { ... }
}
```

**Agent Removal**
```json
{
  "type": "remove",
  "agentId": "agent-123"
}
```

## Dependencies

### NPM Packages
- `reactflow` (^11.x): Node-based visualization library
- `framer-motion` (^11.x): Animation library
- `dagre` (^0.8.x): Graph layout algorithm
- `@types/dagre`: TypeScript definitions

### Installation
```bash
npm install reactflow framer-motion dagre @types/dagre
```

## Configuration

### Environment Variables

```env
# WebSocket URL for real-time agent updates
NEXT_PUBLIC_WS_URL=ws://your-websocket-server:port

# Optional: Configure reconnection behavior in useAgentWebSocket hook
```

## Mock Data Mode

When WebSocket connection is unavailable, the system automatically switches to mock data mode displaying:
- 7 sample agents with various statuses
- Hierarchical relationships
- Simulated resource usage
- Example error states

This allows development and testing without backend infrastructure.

## Navigation Integration

The Agents page is integrated into both desktop and mobile navigation:
- Desktop: Top navigation bar with robot icon (🤖)
- Mobile: Bottom navigation bar
- Icon badge support for active agent count (future enhancement)

## Future Enhancements

### Planned Features
1. **Agent Output Modal**: Full-screen output viewer with syntax highlighting
2. **Search and Filter**: Find agents by name, status, or task
3. **Time Travel**: Replay agent activity history
4. **Performance Metrics**: CPU/memory graphs over time
5. **Agent Grouping**: Collapse/expand by agent type or project
6. **Export Functionality**: Download agent tree as image or data
7. **Notifications**: Browser notifications for agent state changes
8. **Drag and Reassign**: Move agents between parents
9. **Batch Operations**: Control multiple agents simultaneously
10. **Live Logs Streaming**: Real-time output in details panel

### Backend Integration
- Lambda functions for agent lifecycle management
- DynamoDB for agent state persistence
- S3 for output and artifact storage
- API Gateway WebSocket connections
- CloudWatch metrics and logging

## Development Guidelines

### Adding New Agent Status
1. Update `AgentStatus` type in `/types/agent.ts`
2. Add color mapping in `getStatusColor()` in `AgentNode.tsx`
3. Add icon mapping in `getStatusIcon()` in `AgentNode.tsx`
4. Update overview panel in `AgentTree.tsx`
5. Add styling in `AgentDetails.tsx`

### Testing
- Use mock data mode for UI testing
- Modify mock data in `/app/admin/agents/page.tsx`
- Test WebSocket reconnection by killing server
- Verify animations with different agent counts
- Test responsive design on mobile devices

### Performance Considerations
- React Flow viewport optimization (only renders visible nodes)
- Debounced WebSocket updates for high-frequency changes
- Memoized node components to prevent unnecessary re-renders
- Efficient dagre layout caching

## Troubleshooting

### WebSocket Won't Connect
1. Check `NEXT_PUBLIC_WS_URL` environment variable
2. Verify WebSocket server is running
3. Check browser console for connection errors
4. Ensure firewall allows WebSocket connections
5. Try manual reconnect button

### Performance Issues
1. Reduce number of visible agents (add filtering)
2. Increase viewport padding in React Flow
3. Disable animations via accessibility settings
4. Check browser DevTools performance tab

### Layout Problems
1. Clear browser cache and reload
2. Check for dagre calculation errors in console
3. Verify agent parent relationships are valid
4. Reset zoom and pan to defaults

## License

Part of Fernando Web application - Internal use only

## Support

For issues or questions:
- Check console logs for WebSocket errors
- Verify API endpoint connectivity
- Review agent data structure in DevTools
- Test with mock data mode first
