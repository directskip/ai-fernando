# Agent Activity Map

A dynamic, real-time visualization system for monitoring hierarchical agent activities, statuses, and relationships.

## Overview

The Agent Activity Map provides an interactive tree visualization of Fernando's agent hierarchy, showing spawned agents, their statuses, and real-time activity updates. Built with React Flow, Framer Motion, and Next.js.

## Features

### 1. Tree Visualization
- **Interactive Layout**: Hierarchical tree layout using dagre algorithm
- **Root Node**: Fernando as the root node coordinating all operations
- **Parent-Child Relationships**: Visual connections showing agent spawning hierarchy
- **Auto-Layout**: Automatic positioning with configurable spacing
- **Zoom & Pan**: Full control over canvas navigation
- **Smooth Animations**: Spring-based animations for node appearances

### 2. Activity Indicators

Visual status system with animated indicators:

- **🟢 Green (Active)**: Currently working/executing tasks
  - Pulsing animation to show activity
  - Animated edges connecting to parent nodes
  - Live duration counter updating every second

- **🟡 Yellow (Idle)**: Waiting for tasks or resources
  - Steady indicator without animation
  - Live duration showing wait time

- **🔴 Red (Error)**: Failed or encountered errors
  - Error message display in node
  - Full error details in side panel

- **⚫ Gray (Completed)**: Finished execution
  - Shows final duration
  - Preserved in tree for history

### 3. Agent Node Details

Each node displays:
- **Agent Name**: Identifier (e.g., "Research Agent", "Code Generator")
- **Status Badge**: Color-coded status indicator
- **Task Description**: Truncated to 2 lines with tooltip on hover
- **Duration**: Live updating time counter
- **Resource Usage**: Token count badge
- **Highlight Animation**: New agents pulse with blue border for 2 seconds

### 4. Detail Panel

Click any node to open the side panel showing:

**Core Information:**
- Agent name and ID
- Current status with color coding
- Full task description (no truncation)
- Start time and live duration
- Parent/children relationships (if applicable)

**Resource Metrics:**
- Token usage count
- CPU percentage (if available)
- Memory usage in MB (if available)

**Output & Logs:**
- Output preview (first 6 lines)
- Full output in expandable section
- Error messages with stack traces

**Action Buttons:**
- View Full Output
- Pause Agent (for active agents)
- Restart Agent (for errored agents)
- Kill Agent (for active/idle agents)

### 5. Real-Time Updates

**WebSocket Integration:**
- Connects to WS server for live updates
- Automatic reconnection with exponential backoff
- Max 5 reconnection attempts with 3-second delay
- Visual connection status indicator

**Mock Data Simulator:**
- Fallback when WebSocket unavailable
- Simulates agent lifecycle:
  - Random status changes every 3 seconds
  - Dynamic agent spawning (max 10 agents)
  - Automatic completion of tasks
  - Error recovery simulation

**Update Types:**
- `initial`: Full agent tree on connection
- `spawn`: New agent added to tree
- `update`: Status or data change for existing agent
- `remove`: Agent removed from tree

### 6. Interactive Controls

**Search & Filter:**
- Text search by agent name, task description, or ID
- Real-time filtering as you type
- Clear button for quick reset
- Shows filtered count (e.g., "Showing 5 of 10 agents")

**Status Filters:**
- Click any status in overview panel to filter
- Multiple status selection supported
- Visual highlight for active filters
- Clear all filters button

**Navigation Controls:**
- **Fit View**: Auto-zoom to show all nodes (0.2 padding, 800ms animation)
- **Mini Map Toggle**: Show/hide miniature overview map
- **Zoom In/Out**: Built-in React Flow controls
- **Pan**: Click and drag canvas

**Mini Map:**
- Color-coded nodes matching status
- Current viewport indicator
- Click to jump to areas
- Translucent mask for clarity

### 7. Overview Panel

Real-time statistics in top-left corner:
- Active agent count with clickable filter
- Idle agent count with clickable filter
- Error agent count with clickable filter
- Completed agent count with clickable filter
- Total agent count
- Clear filters button when active

## Technical Implementation

### Architecture

```
/app/admin/agents/
├── page.tsx              # Main page with WebSocket logic
├── README.md             # This documentation

/components/
├── AgentTree.tsx         # React Flow wrapper with controls
├── AgentNode.tsx         # Individual agent node component
└── AgentDetails.tsx      # Side panel details component

/hooks/
└── useAgentWebSocket.ts  # WebSocket connection hook

/types/
└── agent.ts              # TypeScript interfaces
```

### Tech Stack

- **React Flow 11.11.4**: Interactive node-based diagrams
- **Framer Motion 12.23.24**: Smooth animations and transitions
- **dagre 0.8.5**: Hierarchical graph layout algorithm
- **Next.js 15.5.6**: React framework with SSR
- **TypeScript 5.9.3**: Type safety
- **Tailwind CSS 4.1.16**: Utility-first styling
- **WebSocket (ws 8.18.3)**: Real-time bidirectional communication

### Key Components

#### AgentTree
Main visualization component wrapping React Flow.

**Props:**
- `agents`: Array of AgentNode objects
- `onPause`: Callback for pause action
- `onKill`: Callback for kill action
- `onRestart`: Callback for restart action
- `onViewOutput`: Callback for view output action

**Features:**
- ReactFlowProvider wrapper for context
- Dagre layout algorithm for tree structure
- Status-based edge coloring and animation
- Filter and search logic
- Mini-map integration
- Real-time node highlighting

#### AgentNode
Individual agent representation in the tree.

**Props:**
- `data`: AgentNode with additional callbacks
- `isHighlighted`: Boolean for new agent animation

**Features:**
- Live duration updates (1-second interval)
- Status-based color coding
- Pulsing animation for active status
- Highlight animation for new agents
- Click handler for detail panel
- Resource usage badge

#### AgentDetails
Side panel showing comprehensive agent information.

**Props:**
- `agent`: Selected AgentNode or null
- `onClose`: Callback to close panel
- Action callbacks (pause, kill, restart, viewOutput)

**Features:**
- Slide-in animation from right
- Live duration updates
- Conditional action buttons based on status
- Resource usage metrics
- Output preview with expansion
- Error display with formatting

#### useAgentWebSocket
Custom hook for WebSocket connection management.

**Options:**
- `url`: WebSocket server URL (default: env variable or localhost:3001)
- `reconnectDelay`: Delay between reconnection attempts (default: 3000ms)
- `maxReconnectAttempts`: Maximum reconnection tries (default: 5)

**Returns:**
- `agents`: Current agent array
- `connected`: Connection status boolean
- `error`: Error message string or null
- `sendMessage`: Function to send messages to server

**Message Types:**
```typescript
// Initial data
{ type: 'initial', agents: AgentNode[] }

// New agent spawned
{ type: 'spawn', agent: AgentNode }

// Agent updated
{ type: 'update', agent: AgentNode }

// Agent removed
{ type: 'remove', agentId: string }
```

### Data Flow

1. **Initialization**:
   - Page component loads
   - useAgentWebSocket hook attempts connection
   - Falls back to mock simulator if connection fails
   - Initial agents rendered in tree

2. **Real-Time Updates**:
   - WebSocket receives message
   - Hook parses and validates data
   - State updated with new/modified agents
   - React Flow re-renders with smooth transitions
   - Layout algorithm recalculates positions

3. **User Interactions**:
   - Click node → Open detail panel
   - Search/filter → Update displayed nodes
   - Action buttons → Send command to backend
   - Navigation controls → Update viewport

### Styling & Animation

**CSS Animations (globals.css):**
```css
@keyframes pulse-dot {
  /* Status indicator pulse */
}

@keyframes highlight-border {
  /* New agent highlight */
}
```

**Framer Motion Animations:**
- Node appearance: Spring animation (stiffness: 260, damping: 20)
- Panel slide: Spring transition (stiffness: 300, damping: 30)
- Status pulse: Continuous loop with scale/opacity
- Highlight glow: 3-cycle box-shadow animation

**Tailwind Classes:**
- Status colors: green-500/600, yellow-500/600, red-500/600, gray-500/600
- Shadows: shadow-lg, shadow-xl
- Transitions: transition-colors, transition-shadow
- Hover states: hover:bg-*, hover:shadow-*

## Usage

### Development

```bash
npm run dev
# Server starts on http://localhost:3000 (or next available port)
# Navigate to /admin/agents
```

### Production

```bash
npm run build
npm start
```

### Environment Variables

Create `.env.local`:
```env
NEXT_PUBLIC_WS_URL=ws://your-websocket-server:3001
```

If not set, defaults to `ws://localhost:3001`.

### WebSocket Server Setup

The frontend expects a WebSocket server that sends messages in this format:

```javascript
// Server-side example (Node.js)
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3001 });

wss.on('connection', (ws) => {
  // Send initial agent tree
  ws.send(JSON.stringify({
    type: 'initial',
    agents: [/* your agents */]
  }));

  // Broadcast updates
  setInterval(() => {
    ws.send(JSON.stringify({
      type: 'update',
      agent: {/* updated agent */}
    }));
  }, 1000);
});
```

## API Integration

To integrate with your backend, implement these handler functions in `page.tsx`:

```typescript
const handlePause = async (agentId: string) => {
  const response = await fetch(`/api/agents/${agentId}/pause`, {
    method: 'POST'
  });
  // Handle response
};

const handleKill = async (agentId: string) => {
  const response = await fetch(`/api/agents/${agentId}/kill`, {
    method: 'POST'
  });
  // Handle response
};

const handleRestart = async (agentId: string) => {
  const response = await fetch(`/api/agents/${agentId}/restart`, {
    method: 'POST'
  });
  // Handle response
};

const handleViewOutput = async (agentId: string) => {
  // Navigate to output page or open modal
  router.push(`/admin/agents/${agentId}/output`);
};
```

## Customization

### Layout Configuration

Edit `AgentTree.tsx`:
```typescript
const nodeWidth = 220   // Width of each node
const nodeHeight = 120  // Height of each node

dagreGraph.setGraph({
  rankdir: 'TB',      // Direction: TB (top-bottom), LR (left-right)
  ranksep: 100,       // Vertical separation
  nodesep: 50         // Horizontal separation
})
```

### Status Colors

Edit `AgentNode.tsx`:
```typescript
const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-500'
    case 'idle': return 'bg-yellow-500'
    case 'error': return 'bg-red-500'
    case 'completed': return 'bg-gray-500'
    // Add custom statuses here
  }
}
```

### Animation Timings

Edit `AgentNode.tsx` and `AgentTree.tsx`:
```typescript
// Duration update interval
setInterval(() => setCurrentTime(Date.now()), 1000) // Change 1000ms

// Highlight duration
setTimeout(() => setHighlightedNodes([]), 2000) // Change 2000ms

// Mock simulator interval
setInterval(() => { /* updates */ }, 3000) // Change 3000ms
```

## Performance Considerations

- **Node Limit**: Recommended max 50 nodes for smooth performance
- **Update Frequency**: Default 1-second intervals for live updates
- **Memo Usage**: AgentNode wrapped in React.memo to prevent unnecessary re-renders
- **Layout Caching**: Dagre layout only recalculates on agent array changes
- **WebSocket Throttling**: Consider throttling if receiving > 10 messages/second

## Troubleshooting

### WebSocket Connection Issues

1. Check server is running and accessible
2. Verify `NEXT_PUBLIC_WS_URL` environment variable
3. Check browser console for connection errors
4. Ensure CORS headers allow WebSocket connections

### Layout Issues

1. Clear browser cache and reload
2. Verify dagre package is installed
3. Check React Flow version compatibility
4. Ensure all nodes have unique IDs

### Animation Performance

1. Reduce number of nodes (< 50 recommended)
2. Disable mini-map for better performance
3. Reduce animation intervals (e.g., 2-second updates instead of 1-second)
4. Use production build (`npm run build`)

### Missing Dependencies

```bash
npm install reactflow framer-motion dagre @types/dagre
```

## Future Enhancements

Potential features for future development:

1. **Multi-root Support**: Multiple Fernando instances
2. **Time Travel**: Replay agent history
3. **Export/Import**: Save/load agent trees
4. **Metrics Dashboard**: Aggregate statistics and charts
5. **Custom Layouts**: Alternative layout algorithms (circular, force-directed)
6. **Agent Grouping**: Collapsible sub-trees
7. **Real-time Collaboration**: Multi-user viewing
8. **Alert System**: Notifications for errors or completions
9. **Performance Profiling**: Built-in performance metrics
10. **Dark Mode**: Theme switching support

## License

Part of the Fernando AI system. Internal use only.

## Support

For issues or questions:
- Check browser console for errors
- Review WebSocket connection status
- Verify mock data simulator is working
- Check Next.js server logs

---

**Last Updated**: 2025-11-01
**Version**: 1.0.0
**Maintainer**: Fernando Team
