# Agent Activity Map - Quick Start Guide

## Overview

The Agent Activity Map provides real-time visualization of Fernando's agent hierarchy at `/admin/agents`. This guide helps you get started quickly.

## Quick Access

1. Navigate to `/admin/agents` in your browser
2. You'll see the agent tree visualization immediately
3. In development, mock data is displayed automatically

## Understanding the Interface

### Status Colors

- 🟢 **Green + Pulse** = Agent is actively working
- 🟡 **Yellow** = Agent is idle/waiting
- 🔴 **Red** = Agent encountered an error
- ⚫ **Gray** = Agent completed its task

### Basic Interactions

1. **View Details**: Click any agent node
2. **Zoom**: Use mouse wheel or zoom controls (bottom right)
3. **Pan**: Click and drag the canvas
4. **Reset View**: Click fit view button (bottom right)

## Managing Agents

### Viewing Agent Details
1. Click any agent node
2. Side panel slides in from the right
3. View full information, output, and errors
4. Click X or click outside to close

### Agent Controls

From the details panel:

- **View Full Output**: See complete logs and results
- **Pause Agent**: Stop an active agent temporarily
- **Kill Agent**: Terminate a running agent
- **Restart Agent**: Re-run a failed agent

## Connection Status

Top right corner shows:
- 🟢 **Live** = Connected to real-time updates
- **Mock Data** = Showing sample data (no WebSocket)
- **Reconnect** button = Click to retry connection

## Demo Mode

When WebSocket isn't available, you'll see:
- 7 sample agents in various states
- Example hierarchy (Fernando → Research → Code → etc.)
- Simulated resource usage and timings
- This is normal during development!

## Statistics Panel

Top left shows quick overview:
- Active agents count (green)
- Idle agents count (yellow)
- Failed agents count (red)
- Completed agents count (gray)
- Total agents

## Navigation

Access the page via:
- **Desktop**: Top nav bar → Agents (🤖)
- **Mobile**: Bottom nav bar → Agents (🤖)

## Tips

1. **Large Trees**: Use zoom controls to navigate
2. **Active Agents**: Watch for pulsing green animations
3. **Errors**: Red nodes indicate problems - click to investigate
4. **Duration**: Each node shows elapsed time
5. **Tokens**: See token usage when available

## Development Setup

### Without WebSocket (Mock Data)
No setup needed! Just navigate to `/admin/agents`

### With WebSocket (Live Data)
1. Set `NEXT_PUBLIC_WS_URL` in `.env.local`:
   ```
   NEXT_PUBLIC_WS_URL=ws://localhost:3001
   ```
2. Start your WebSocket server
3. Refresh the page
4. Green "Live" indicator confirms connection

## Troubleshooting

### Can't See Agents
- Check if you're logged in
- Verify you're at `/admin/agents`
- Look for error messages in UI

### WebSocket Won't Connect
- This is expected in development
- Mock data will display automatically
- No impact on UI testing

### Performance Slow
- Try zooming in to show fewer nodes
- Close details panel when not needed
- Check browser console for errors

## Next Steps

1. Explore the mock data hierarchy
2. Try clicking different agent nodes
3. Test zoom and pan controls
4. Review the statistics panel
5. Read full documentation in `AGENT_ACTIVITY_MAP.md`

## Common Questions

**Q: Why do I see mock data?**
A: WebSocket server isn't running. This is normal for development.

**Q: Can I add my own agents?**
A: Yes, via the POST `/api/agents` endpoint (backend integration required).

**Q: How often does it update?**
A: Real-time via WebSocket. Mock data is static.

**Q: Can I export the tree?**
A: Not yet - planned for future release.

**Q: Does it work on mobile?**
A: Yes! Fully responsive with touch controls.

## Support

- Full docs: `AGENT_ACTIVITY_MAP.md`
- Issues: Check browser console
- Demo: Use mock data mode
