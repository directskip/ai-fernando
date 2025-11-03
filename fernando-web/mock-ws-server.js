#!/usr/bin/env node
/**
 * Mock WebSocket Server for Agent Monitoring
 * Simulates agent activity and broadcasts updates to connected clients
 */

const WebSocket = require('ws')
const crypto = require('crypto')

// Simple UUID generator
function uuidv4() {
  return crypto.randomUUID()
}

class MockAgentServer {
  constructor(port = 3001) {
    this.wss = new WebSocket.Server({ port })
    this.port = port
    this.agents = new Map()
    this.clients = new Set()
    this.initializeAgents()
    this.setupServer()
    this.startSimulation()
  }

  initializeAgents() {
    // Create initial agent hierarchy
    const rootAgent = {
      id: 'fernando-root',
      name: 'Fernando',
      status: 'active',
      task: 'Main AI assistant coordinating all operations',
      startTime: new Date(Date.now() - 3600000).toISOString(),
      parentId: null,
      resourceUsage: {
        tokens: 15420,
        cpu: 45,
        memory: 512,
      },
    }

    const agents = [
      rootAgent,
      {
        id: 'agent-1',
        name: 'Research Agent',
        status: 'active',
        task: 'Researching React Flow vs D3.js visualization libraries',
        startTime: new Date(Date.now() - 1800000).toISOString(),
        parentId: 'fernando-root',
        resourceUsage: { tokens: 3240 },
        output: 'Found that React Flow is better suited for this use case...',
      },
      {
        id: 'agent-2',
        name: 'Code Generator',
        status: 'completed',
        task: 'Generating TypeScript interfaces for agent system',
        startTime: new Date(Date.now() - 2400000).toISOString(),
        endTime: new Date(Date.now() - 1200000).toISOString(),
        parentId: 'fernando-root',
        resourceUsage: { tokens: 1850 },
      },
      {
        id: 'agent-3',
        name: 'Component Builder',
        status: 'active',
        task: 'Building AgentNode component with animations',
        startTime: new Date(Date.now() - 900000).toISOString(),
        parentId: 'agent-2',
        resourceUsage: { tokens: 2100 },
      },
      {
        id: 'agent-4',
        name: 'API Developer',
        status: 'idle',
        task: 'Waiting for component completion before building API',
        startTime: new Date(Date.now() - 600000).toISOString(),
        parentId: 'fernando-root',
        resourceUsage: { tokens: 450 },
      },
      {
        id: 'agent-5',
        name: 'Test Runner',
        status: 'error',
        task: 'Running integration tests for agent system',
        startTime: new Date(Date.now() - 300000).toISOString(),
        parentId: 'agent-3',
        error: 'Failed to connect to test database',
        resourceUsage: { tokens: 780 },
      },
      {
        id: 'agent-6',
        name: 'Documentation Writer',
        status: 'active',
        task: 'Generating API documentation for agent endpoints',
        startTime: new Date(Date.now() - 450000).toISOString(),
        parentId: 'agent-4',
        resourceUsage: { tokens: 1200 },
      },
    ]

    agents.forEach((agent) => {
      this.agents.set(agent.id, agent)
    })
  }

  setupServer() {
    this.wss.on('connection', (ws) => {
      console.log('Client connected')
      this.clients.add(ws)

      // Send initial agent data
      const initialMessage = {
        type: 'initial',
        agents: Array.from(this.agents.values()),
        timestamp: new Date().toISOString(),
      }

      ws.send(JSON.stringify(initialMessage))
      console.log('Sent initial data to client')

      // Handle client messages
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString())
          console.log('Received message:', message.type)
          this.handleClientMessage(message, ws)
        } catch (error) {
          console.error('Error parsing message:', error)
        }
      })

      // Handle client disconnect
      ws.on('close', () => {
        console.log('Client disconnected')
        this.clients.delete(ws)
      })

      // Handle errors
      ws.on('error', (error) => {
        console.error('WebSocket error:', error)
      })
    })

    console.log(`Mock WebSocket server listening on ws://localhost:${this.port}`)
  }

  handleClientMessage(message, ws) {
    switch (message.type) {
      case 'spawn':
        // Handle agent spawn
        if (message.agent) {
          this.agents.set(message.agent.id, message.agent)
          this.broadcast({
            type: 'spawn',
            agent: message.agent,
            timestamp: new Date().toISOString(),
          })
          console.log(`Agent spawned: ${message.agent.id}`)
        }
        break

      case 'update':
        // Handle agent update
        if (message.agent) {
          this.agents.set(message.agent.id, message.agent)
          this.broadcast({
            type: 'update',
            agent: message.agent,
            timestamp: new Date().toISOString(),
          })
          console.log(`Agent updated: ${message.agent.id}`)
        }
        break

      case 'remove':
        // Handle agent removal
        if (message.agentId) {
          this.agents.delete(message.agentId)
          this.broadcast({
            type: 'remove',
            agentId: message.agentId,
            timestamp: new Date().toISOString(),
          })
          console.log(`Agent removed: ${message.agentId}`)
        }
        break

      default:
        console.log('Unknown message type:', message.type)
    }
  }

  broadcast(message) {
    const data = JSON.stringify(message)
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data)
      }
    })
  }

  startSimulation() {
    // Simulate random agent updates every 5 seconds
    setInterval(() => {
      const agents = Array.from(this.agents.values())
      if (agents.length > 0) {
        const randomAgent = agents[Math.floor(Math.random() * agents.length)]

        // Simulate status changes
        if (randomAgent.status === 'active' && Math.random() > 0.8) {
          const updatedAgent = {
            ...randomAgent,
            status: 'completed',
            endTime: new Date().toISOString(),
          }
          this.agents.set(randomAgent.id, updatedAgent)
          this.broadcast({
            type: 'update',
            agent: updatedAgent,
            timestamp: new Date().toISOString(),
          })
          console.log(`[SIM] Agent completed: ${randomAgent.id}`)
        } else if (randomAgent.status === 'idle' && Math.random() > 0.7) {
          const updatedAgent = {
            ...randomAgent,
            status: 'active',
          }
          this.agents.set(randomAgent.id, updatedAgent)
          this.broadcast({
            type: 'update',
            agent: updatedAgent,
            timestamp: new Date().toISOString(),
          })
          console.log(`[SIM] Agent activated: ${randomAgent.id}`)
        }

        // Update resource usage
        if (randomAgent.status === 'active') {
          const updatedAgent = {
            ...randomAgent,
            resourceUsage: {
              tokens: (randomAgent.resourceUsage?.tokens || 0) + Math.floor(Math.random() * 500),
              cpu: Math.floor(Math.random() * 100),
              memory: Math.floor(Math.random() * 1024),
            },
          }
          this.agents.set(randomAgent.id, updatedAgent)
          this.broadcast({
            type: 'update',
            agent: updatedAgent,
            timestamp: new Date().toISOString(),
          })
        }
      }
    }, 5000)
  }
}

// Start server
const server = new MockAgentServer(3001)
console.log('Mock WebSocket server started successfully')

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...')
  server.wss.close()
  process.exit(0)
})
