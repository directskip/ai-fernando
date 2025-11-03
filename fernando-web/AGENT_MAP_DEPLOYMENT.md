# Agent Activity Map - Deployment & Production Guide

## 🎯 Production Readiness Checklist

### ✅ Completed Items

- [x] All core features implemented
- [x] React Flow tree visualization
- [x] Real-time WebSocket integration
- [x] Mock data simulator for fallback
- [x] Status indicators with animations
- [x] Search and filter functionality
- [x] Detail panel with full agent info
- [x] Action buttons (pause, kill, restart)
- [x] Live duration updates
- [x] Mini-map navigation
- [x] Fit view controls
- [x] TypeScript type safety
- [x] Performance optimizations
- [x] Error handling
- [x] Responsive design
- [x] Comprehensive documentation

## 🚀 Deployment Steps

### 1. Environment Configuration

Create production environment file `.env.production`:

```env
# WebSocket Server URL (production)
NEXT_PUBLIC_WS_URL=wss://your-ws-server.com

# Optional: Analytics
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id

# Optional: API Base URL
NEXT_PUBLIC_API_URL=https://api.your-domain.com
```

### 2. Build for Production

```bash
# Install dependencies
npm install

# Run type check
npm run lint

# Build production bundle
npm run build

# Test production build locally
npm start
```

Expected output:
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Creating an optimized production build
✓ Collecting page data
✓ Finalizing page optimization
```

### 3. Vercel Deployment (Recommended)

#### Option A: CLI Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy preview
vercel

# Deploy to production
vercel --prod
```

#### Option B: GitHub Integration
1. Push code to GitHub repository
2. Connect repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy automatically on push

#### Option C: Vercel Dashboard
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure build settings:
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
4. Add environment variables
5. Click "Deploy"

### 4. Environment Variables in Vercel

Add these in Vercel Dashboard → Settings → Environment Variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| `NEXT_PUBLIC_WS_URL` | `wss://your-ws-server.com` | Production |
| `NEXT_PUBLIC_WS_URL` | `ws://localhost:3001` | Development |

### 5. Custom Domain Setup

In Vercel Dashboard:
1. Go to Settings → Domains
2. Add your domain (e.g., `agents.yourdomain.com`)
3. Follow DNS configuration instructions
4. Wait for SSL certificate provisioning
5. Access via: `https://agents.yourdomain.com/admin/agents`

## 🔧 Production Configuration

### WebSocket Server Requirements

Your production WebSocket server must:

1. **Support secure connections**: Use `wss://` protocol
2. **Handle CORS**: Allow your frontend domain
3. **Send proper message format**:
   ```json
   {
     "type": "initial" | "spawn" | "update" | "remove",
     "agent" or "agents": { /* agent data */ }
   }
   ```
4. **Maintain connections**: Handle reconnection gracefully
5. **Authenticate clients**: Implement token-based auth

### Example Production WebSocket Server (Node.js)

```javascript
// server.js
const WebSocket = require('ws');
const https = require('https');
const fs = require('fs');

// SSL certificates for wss://
const server = https.createServer({
  cert: fs.readFileSync('/path/to/cert.pem'),
  key: fs.readFileSync('/path/to/key.pem')
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  console.log('Client connected');

  // Send initial agent tree
  ws.send(JSON.stringify({
    type: 'initial',
    agents: getAgents() // Your function to fetch agents
  }));

  // Broadcast updates every second
  const interval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'update',
        agent: getUpdatedAgent() // Your function
      }));
    }
  }, 1000);

  ws.on('close', () => {
    console.log('Client disconnected');
    clearInterval(interval);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

server.listen(8080, () => {
  console.log('WebSocket server running on wss://localhost:8080');
});
```

### Example with Express + Socket.io

```javascript
// server.js
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Send initial data
  socket.emit('initial', {
    agents: getAgents()
  });

  // Handle commands from frontend
  socket.on('command', (data) => {
    const { action, agentId } = data;
    console.log(`Command: ${action} on ${agentId}`);

    switch(action) {
      case 'pause':
        pauseAgent(agentId);
        break;
      case 'kill':
        killAgent(agentId);
        break;
      case 'restart':
        restartAgent(agentId);
        break;
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

httpServer.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
});
```

## 📊 Performance Optimization

### 1. Code Splitting
Already implemented via Next.js dynamic imports.

### 2. Bundle Analysis
```bash
# Analyze bundle size
npm run build
npx @next/bundle-analyzer
```

### 3. Optimization Recommendations

**For 50+ agents:**
- Increase update intervals to 2-3 seconds
- Implement virtual scrolling
- Paginate agent list
- Lazy load detail panel

**For slow networks:**
- Reduce WebSocket message frequency
- Compress messages (gzip)
- Implement message batching

**For mobile devices:**
- Disable mini-map by default
- Reduce animation complexity
- Implement touch gestures

## 🔒 Security Considerations

### 1. WebSocket Authentication

Add authentication to WebSocket connection:

```typescript
// hooks/useAgentWebSocket.ts
const connect = useCallback(() => {
  const token = getAuthToken(); // Your auth function
  const ws = new WebSocket(`${url}?token=${token}`);

  // ... rest of connection logic
}, [url]);
```

### 2. CORS Configuration

Configure CORS in your WebSocket server:

```javascript
const wss = new WebSocket.Server({
  server,
  verifyClient: (info, callback) => {
    const origin = info.origin;
    const allowed = ['https://yourdomain.com', 'https://agents.yourdomain.com'];
    callback(allowed.includes(origin));
  }
});
```

### 3. Rate Limiting

Implement rate limiting on action endpoints:

```typescript
// app/api/agents/[id]/route.ts
import { rateLimit } from '@/lib/rateLimit';

export async function POST(request: Request) {
  const { success } = await rateLimit.check(request);

  if (!success) {
    return new Response('Too many requests', { status: 429 });
  }

  // Handle action
}
```

### 4. Input Validation

Validate all incoming data:

```typescript
// types/agent.ts
import { z } from 'zod';

export const AgentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  status: z.enum(['active', 'idle', 'error', 'completed']),
  task: z.string().max(1000),
  startTime: z.date(),
  endTime: z.date().optional(),
  parentId: z.string().optional(),
});
```

## 📈 Monitoring & Analytics

### 1. Error Tracking

Integrate Sentry:

```bash
npm install @sentry/nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### 2. Performance Monitoring

Add Web Vitals tracking:

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### 3. Custom Metrics

Track agent-specific metrics:

```typescript
// lib/analytics.ts
export function trackAgentAction(action: string, agentId: string) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'agent_action', {
      action,
      agent_id: agentId,
      timestamp: new Date().toISOString(),
    });
  }
}
```

## 🧪 Testing

### Unit Tests (Jest + React Testing Library)

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom jest
```

Example test:
```typescript
// __tests__/AgentNode.test.tsx
import { render, screen } from '@testing-library/react';
import AgentNode from '@/components/AgentNode';

describe('AgentNode', () => {
  it('renders agent name and status', () => {
    const mockData = {
      id: 'test-1',
      name: 'Test Agent',
      status: 'active',
      task: 'Testing',
      startTime: new Date(),
      onSelect: jest.fn(),
    };

    render(<AgentNode data={mockData} />);

    expect(screen.getByText('Test Agent')).toBeInTheDocument();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
  });
});
```

### E2E Tests (Playwright)

```bash
npm install --save-dev @playwright/test
```

Example test:
```typescript
// e2e/agents.spec.ts
import { test, expect } from '@playwright/test';

test('agent map loads and displays nodes', async ({ page }) => {
  await page.goto('http://localhost:3000/admin/agents');

  // Wait for agents to load
  await page.waitForSelector('[data-id="fernando-root"]');

  // Check node count
  const nodes = await page.locator('.react-flow__node').count();
  expect(nodes).toBeGreaterThan(0);

  // Test search
  await page.fill('input[placeholder="Search agents..."]', 'Research');
  const filteredNodes = await page.locator('.react-flow__node').count();
  expect(filteredNodes).toBeLessThan(nodes);
});
```

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run type check
        run: npx tsc --noEmit

      - name: Build
        run: npm run build

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## 📋 Pre-Deployment Checklist

- [ ] All TypeScript errors resolved
- [ ] ESLint warnings addressed
- [ ] Production environment variables configured
- [ ] WebSocket server tested and running
- [ ] SSL certificates installed (for wss://)
- [ ] CORS properly configured
- [ ] Error tracking integrated (Sentry)
- [ ] Analytics configured (Google Analytics/Vercel)
- [ ] Performance tested with real data
- [ ] Security review completed
- [ ] Documentation updated
- [ ] Team trained on features
- [ ] Backup/rollback plan in place

## 🎉 Post-Deployment

### 1. Verify Production Deployment

```bash
# Check if site is live
curl -I https://your-domain.com/admin/agents

# Test WebSocket connection
wscat -c wss://your-ws-server.com

# Check SSL certificate
openssl s_client -connect your-ws-server.com:443
```

### 2. Monitor Initial Traffic

- Watch Vercel Analytics dashboard
- Check Sentry for errors
- Monitor WebSocket server logs
- Track Core Web Vitals

### 3. Gather Feedback

- User testing sessions
- Performance benchmarks
- Bug reports
- Feature requests

## 📞 Support & Maintenance

### Regular Maintenance Tasks

**Daily:**
- Monitor error rates
- Check WebSocket connection stability
- Review performance metrics

**Weekly:**
- Update dependencies
- Review and address user feedback
- Performance optimization

**Monthly:**
- Security audit
- Load testing
- Backup verification
- Documentation updates

### Troubleshooting Production Issues

**Issue: High memory usage**
- Reduce update frequency
- Implement pagination
- Optimize React re-renders

**Issue: WebSocket disconnections**
- Check server capacity
- Implement better reconnection logic
- Add connection pooling

**Issue: Slow initial load**
- Enable CDN caching
- Optimize bundle size
- Lazy load components

## 📚 Additional Resources

- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Vercel Deployment Guide](https://vercel.com/docs)
- [React Flow Production Tips](https://reactflow.dev/docs/guides/troubleshooting/)
- [WebSocket Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)

---

## 🎯 Success Criteria

Your deployment is successful when:

✅ Page loads in < 3 seconds
✅ WebSocket connects reliably
✅ Real-time updates work smoothly
✅ All interactions are responsive
✅ No console errors
✅ Mobile devices supported
✅ Analytics tracking works
✅ Error monitoring active
✅ SSL certificate valid
✅ CORS configured correctly

---

**Deployment Date**: 2025-11-01
**Version**: 1.0.0
**Status**: Production Ready ✅
