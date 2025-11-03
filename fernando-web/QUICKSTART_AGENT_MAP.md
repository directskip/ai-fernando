# Agent Activity Map - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### 1. Start the Server
```bash
cd /Users/pfaquart/fernando-web
npm run dev
```

### 2. Open the Agent Map
Navigate to: **http://localhost:3005/admin/agents**

(Port may vary if 3000 is in use)

### 3. Explore the Interface

#### Main View
- **Center**: Interactive tree visualization of agent hierarchy
- **Top-Left**: Overview panel with agent statistics
- **Top-Right**: Search and control panel
- **Right Side**: Detail panel (opens on node click)
- **Bottom-Right**: Mini-map (toggle on/off)

## 🎯 Key Features at a Glance

### Status Indicators
| Icon | Status | Meaning |
|------|--------|---------|
| 🟢 | Active | Agent is currently working (pulses) |
| 🟡 | Idle | Agent is waiting for tasks |
| 🔴 | Error | Agent encountered an error |
| ⚫ | Completed | Agent finished execution |

### Quick Actions

#### Filter by Status
Click any status in the overview panel (top-left) to filter agents.
- Click multiple statuses to show multiple types
- Click "Clear" to reset filters

#### Search Agents
Type in the search box (top-right) to find agents by:
- Agent name
- Task description
- Agent ID

#### Navigate the Canvas
- **Zoom**: Mouse wheel or controls (bottom-left)
- **Pan**: Click and drag on empty space
- **Fit View**: Click "Fit View" button to center all nodes
- **Mini-Map**: Toggle on/off with "Mini Map" button

#### View Agent Details
1. Click any agent node
2. Side panel slides in from right
3. View:
   - Complete task description
   - Resource usage (tokens, CPU, memory)
   - Output preview
   - Error messages (if any)
4. Available actions:
   - View Full Output
   - Pause Agent (if active)
   - Kill Agent (if active/idle)
   - Restart Agent (if errored)

## 📊 Understanding the Demo

### Mock Data Mode
When WebSocket is disconnected (default), you'll see:
- Yellow banner: "Demo Mode: Displaying mock data"
- Connection indicator: "Mock Data" (top-right)
- 7 initial agents with various statuses

### Real-Time Simulation
The demo automatically simulates:
- Status changes every 3 seconds
- New agents spawning occasionally
- Task completions
- Error recovery
- Live duration counters updating every second

### Watching Live Updates
1. **Status Changes**: Watch agent colors change (green → gray, yellow → green, etc.)
2. **New Agents**: New nodes appear with blue border pulse animation
3. **Duration Counters**: All active/idle agents show live time updates
4. **Edge Animations**: Active connections have animated flowing edges

## 🔌 Connecting to Real WebSocket

### Setup Environment Variable
Create `.env.local` in project root:
```env
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

### Start Your WebSocket Server
The server should send messages in this format:

**Initial Connection:**
```json
{
  "type": "initial",
  "agents": [
    {
      "id": "fernando-root",
      "name": "Fernando",
      "status": "active",
      "task": "Main AI assistant",
      "startTime": "2025-11-01T05:00:00.000Z",
      "resourceUsage": {
        "tokens": 1000
      }
    }
  ]
}
```

**Agent Updates:**
```json
{
  "type": "update",
  "agent": {
    "id": "agent-1",
    "status": "completed",
    "endTime": "2025-11-01T05:01:00.000Z"
  }
}
```

**New Agent:**
```json
{
  "type": "spawn",
  "agent": {
    "id": "agent-2",
    "name": "New Agent",
    "status": "active",
    "task": "Processing...",
    "startTime": "2025-11-01T05:01:00.000Z",
    "parentId": "fernando-root"
  }
}
```

### Check Connection
- **Green dot + "Live"**: Connected to WebSocket
- **Gray dot + "Mock Data"**: Using simulation
- **Red error**: Connection failed, click "Reconnect"

## 🎨 Customization

### Change Layout Direction
Edit `components/AgentTree.tsx`:
```typescript
dagreGraph.setGraph({
  rankdir: 'TB',  // TB = Top-Bottom, LR = Left-Right
  ranksep: 100,   // Vertical spacing
  nodesep: 50     // Horizontal spacing
})
```

### Adjust Update Frequency
Edit `app/admin/agents/page.tsx`:
```typescript
// Change mock simulator speed
}, 3000) // Change to 1000 for faster, 5000 for slower
```

Edit `components/AgentNode.tsx`:
```typescript
// Change duration update speed
setInterval(() => {
  setCurrentTime(Date.now())
}, 1000) // Change to 2000 for slower updates
```

### Add Custom Status
1. Edit `types/agent.ts`:
```typescript
export type AgentStatus = 'active' | 'idle' | 'error' | 'completed' | 'custom'
```

2. Add color in `components/AgentNode.tsx`:
```typescript
case 'custom':
  return 'bg-purple-500'
```

3. Add icon in `components/AgentNode.tsx`:
```typescript
case 'custom':
  return '🟣'
```

## 🐛 Troubleshooting

### Issue: Page doesn't load
**Solution**:
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

### Issue: WebSocket won't connect
**Check:**
1. Is WebSocket server running?
2. Is URL correct in `.env.local`?
3. Does browser console show errors?
4. Try using `ws://` not `wss://` for local dev

### Issue: Animations are laggy
**Solutions:**
1. Use production build: `npm run build && npm start`
2. Reduce number of agents (< 50 recommended)
3. Disable mini-map
4. Close other browser tabs

### Issue: Nodes overlap
**Solution**:
- Click "Fit View" button
- Increase `ranksep` and `nodesep` in layout config

## 📱 Keyboard Shortcuts

React Flow provides these by default:
- **Scroll**: Zoom in/out
- **Space + Drag**: Pan canvas
- **Shift + Drag**: Selection box (disabled in our setup)
- **Cmd/Ctrl + Scroll**: Zoom (on some systems)

## 🧪 Testing Different Scenarios

### Test Status Filters
1. Click 🟢 Active in overview panel
2. Only active agents show
3. Click 🔴 Error to add error agents
4. Click "Clear" to reset

### Test Search
1. Type "research" in search box
2. Agents with "research" in name or task show
3. Click X to clear search

### Test Real-Time Updates
1. Watch status changes happen automatically
2. See new agents appear with blue glow
3. Observe duration counters updating
4. Notice completed agents turn gray

### Test Detail Panel
1. Click any agent node
2. Panel slides in from right
3. Click different nodes - panel updates
4. Click X or outside to close

## 📚 Documentation

- **README.md**: Full technical documentation
- **AGENT_MAP_FEATURES.md**: Complete feature list
- **This file**: Quick start guide

## 🎓 Example Use Cases

### Monitoring Active Agents
1. Filter by Active (🟢)
2. Watch live duration counters
3. Click nodes to see tasks
4. Pause/kill if needed

### Debugging Errors
1. Filter by Error (🔴)
2. Click errored node
3. Read error message in detail panel
4. Click "Restart Agent"

### Understanding Hierarchy
1. Click "Fit View" to see all agents
2. Follow edges from parent to children
3. Identify which agent spawned others
4. See depth of agent tree

### Searching Specific Tasks
1. Type keyword in search (e.g., "API")
2. See all agents working on API tasks
3. Click to view details
4. Monitor progress

## 🚢 Deploying to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy preview
vercel

# Deploy production
vercel --prod
```

Add environment variables in Vercel dashboard:
- `NEXT_PUBLIC_WS_URL`: Your production WebSocket URL

## 📊 Performance Tips

1. **Limit Agents**: Keep under 50 for best performance
2. **Use Production**: Build with `npm run build` for optimization
3. **Disable Mini-Map**: Toggle off if experiencing lag
4. **Reduce Updates**: Increase intervals from 1s to 2-3s
5. **Close Detail Panel**: When not viewing specific agent

## ✅ Verification Checklist

After starting, verify these work:

- [ ] Page loads at `/admin/agents`
- [ ] 7 agents visible in tree
- [ ] Status indicators show colors
- [ ] Duration counters update every second
- [ ] Can click nodes to open detail panel
- [ ] Can search for "Research" and see results
- [ ] Can filter by Active status
- [ ] Can toggle mini-map on/off
- [ ] Fit View centers all nodes
- [ ] New agents appear with animation (wait ~30 seconds)
- [ ] Status changes happen automatically (wait ~10 seconds)

## 🎉 Success!

You now have a fully functional agent activity map showing:
- ✅ Real-time hierarchical visualization
- ✅ Live status indicators
- ✅ Interactive controls
- ✅ Detailed agent information
- ✅ Smooth animations
- ✅ Search and filtering

---

**Need Help?**
- Check browser console for errors
- Review full README.md for details
- Verify all dependencies installed
- Ensure no TypeScript errors

**Ready for Production?**
- Connect to real WebSocket server
- Configure production environment variables
- Build and deploy to Vercel
- Monitor performance with real data

**Enjoy the Agent Activity Map! 🚀**
