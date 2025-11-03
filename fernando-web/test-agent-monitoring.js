#!/usr/bin/env node
/**
 * Agent Monitoring System - End-to-End Test Script
 * This script tests the complete agent monitoring flow
 */

const WebSocket = require('ws')
const crypto = require('crypto')

// Simple UUID generator
function uuidv4() {
  return crypto.randomUUID()
}

class AgentMonitoringTester {
  constructor(wsUrl = 'ws://localhost:3001') {
    this.ws = null
    this.wsUrl = wsUrl
    this.testResults = []
    this.agents = new Map()
    this.receivedMessages = []
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}]`
    const levelEmoji = {
      info: '🔵',
      warn: '⚠️',
      error: '❌',
      success: '✅',
    }
    console.log(`${prefix} ${levelEmoji[level]} ${message}`)
  }

  addTestResult(result) {
    this.testResults.push(result)
    const statusEmoji = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏳'
    this.log(
      `[TEST] ${statusEmoji} ${result.name} (${result.duration}ms)`,
      result.status === 'PASS' ? 'success' : result.status === 'FAIL' ? 'error' : 'info'
    )
    if (result.message) {
      this.log(`       ${result.message}`, result.status === 'FAIL' ? 'error' : 'info')
    }
  }

  async runTests() {
    this.log('Starting Agent Monitoring System Tests', 'info')
    this.log('Target WebSocket URL: ' + this.wsUrl, 'info')
    console.log('\n' + '='.repeat(80) + '\n')

    // Test 1: WebSocket Connection
    await this.testWebSocketConnection()

    // Test 2: Initial Message Format
    await this.testInitialMessage()

    // Test 3: Agent Spawn
    await this.testAgentSpawn()

    // Test 4: Agent Status Update
    await this.testAgentStatusUpdate()

    // Test 5: Rapid Updates
    await this.testRapidUpdates()

    // Test 6: Agent Completion
    await this.testAgentCompletion()

    // Test 7: Error Handling
    await this.testErrorHandling()

    // Print results summary
    this.printSummary()

    // Cleanup
    if (this.ws) {
      this.ws.close()
    }
  }

  testWebSocketConnection() {
    return new Promise((resolve) => {
      const startTime = Date.now()

      try {
        this.ws = new WebSocket(this.wsUrl)

        this.ws.onopen = () => {
          const duration = Date.now() - startTime
          this.addTestResult({
            name: 'WebSocket Connection',
            status: 'PASS',
            message: 'Successfully connected to WebSocket server',
            duration,
          })

          // Setup message handlers
          this.setupMessageHandlers()
          resolve()
        }

        this.ws.onerror = (event) => {
          const duration = Date.now() - startTime
          this.addTestResult({
            name: 'WebSocket Connection',
            status: 'FAIL',
            message: `Failed to connect: ${event.message || 'Unknown error'}`,
            duration,
          })
          resolve()
        }

        // Timeout after 5 seconds
        setTimeout(() => {
          if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            const duration = Date.now() - startTime
            this.addTestResult({
              name: 'WebSocket Connection',
              status: 'FAIL',
              message: 'Connection timeout after 5 seconds',
              duration,
            })
            resolve()
          }
        }, 5000)
      } catch (error) {
        const duration = Date.now() - startTime
        this.addTestResult({
          name: 'WebSocket Connection',
          status: 'FAIL',
          message: `Exception: ${error.message}`,
          duration,
        })
        resolve()
      }
    })
  }

  setupMessageHandlers() {
    if (!this.ws) return

    this.ws.onmessage = (event) => {
      try {
        const dataStr = typeof event.data === 'string' ? event.data : event.data.toString()
        const data = JSON.parse(dataStr)
        this.receivedMessages.push({
          timestamp: new Date(),
          data,
        })

        this.log(`Received message type: ${data.type}`, 'info')

        // Handle different message types
        switch (data.type) {
          case 'initial':
            if (data.agents && Array.isArray(data.agents)) {
              data.agents.forEach((agent) => {
                this.agents.set(agent.id, agent)
              })
            }
            break

          case 'spawn':
            if (data.agent) {
              this.agents.set(data.agent.id, data.agent)
            }
            break

          case 'update':
            if (data.agent) {
              this.agents.set(data.agent.id, data.agent)
            }
            break

          case 'remove':
            if (data.agentId) {
              this.agents.delete(data.agentId)
            }
            break
        }
      } catch (error) {
        this.log(`Error parsing message: ${error.message}`, 'error')
      }
    }

    this.ws.onerror = (event) => {
      this.log(`WebSocket error: ${event.message || 'Unknown error'}`, 'error')
    }

    this.ws.onclose = () => {
      this.log('WebSocket connection closed', 'warn')
    }
  }

  testInitialMessage() {
    return new Promise((resolve) => {
      const startTime = Date.now()

      // Wait for initial message
      const checkInterval = setInterval(() => {
        const initialMessage = this.receivedMessages.find((msg) => msg.data.type === 'initial')

        if (initialMessage) {
          clearInterval(checkInterval)
          const duration = Date.now() - startTime
          const data = initialMessage.data

          // Validate structure
          const hasValidStructure =
            data.type === 'initial' &&
            Array.isArray(data.agents) &&
            data.agents.length > 0 &&
            data.agents[0].id &&
            data.agents[0].name &&
            data.agents[0].status

          this.addTestResult({
            name: 'Initial Message Format',
            status: hasValidStructure ? 'PASS' : 'FAIL',
            message: hasValidStructure
              ? `Received valid initial message with ${data.agents.length} agents`
              : 'Invalid initial message structure',
            duration,
            details: {
              agentCount: data.agents.length,
              firstAgent: data.agents[0],
            },
          })

          resolve()
        }
      }, 100)

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval)
        const duration = Date.now() - startTime
        this.addTestResult({
          name: 'Initial Message Format',
          status: 'FAIL',
          message: 'No initial message received within 10 seconds',
          duration,
        })
        resolve()
      }, 10000)
    })
  }

  testAgentSpawn() {
    return new Promise((resolve) => {
      const startTime = Date.now()

      // Send spawn message
      const spawnMessage = {
        type: 'spawn',
        agent: {
          id: `test-agent-${uuidv4()}`,
          name: 'Test Agent - Spawn Test',
          status: 'active',
          task: 'Testing agent spawn functionality',
          startTime: new Date().toISOString(),
          parentId: Array.from(this.agents.values())[0]?.id || 'root',
          resourceUsage: {
            tokens: 0,
            cpu: 0,
            memory: 0,
          },
        },
      }

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(spawnMessage))
        this.log('Sent spawn message: ' + spawnMessage.agent.id, 'info')

        // Wait for confirmation
        const checkInterval = setInterval(() => {
          const receivedSpawn = this.receivedMessages.find(
            (msg) => msg.data.type === 'spawn' && msg.data.agent?.id === spawnMessage.agent.id
          )

          if (receivedSpawn) {
            clearInterval(checkInterval)
            const duration = Date.now() - startTime
            this.addTestResult({
              name: 'Agent Spawn',
              status: 'PASS',
              message: 'Successfully spawned and received confirmation',
              duration,
              details: { agentId: spawnMessage.agent.id },
            })
            resolve()
          }
        }, 100)

        // Timeout after 5 seconds
        setTimeout(() => {
          clearInterval(checkInterval)
          if (!this.agents.has(spawnMessage.agent.id)) {
            const duration = Date.now() - startTime
            this.addTestResult({
              name: 'Agent Spawn',
              status: 'FAIL',
              message: 'No spawn confirmation received within 5 seconds',
              duration,
            })
            resolve()
          }
        }, 5000)
      } else {
        const duration = Date.now() - startTime
        this.addTestResult({
          name: 'Agent Spawn',
          status: 'FAIL',
          message: 'WebSocket is not connected',
          duration,
        })
        resolve()
      }
    })
  }

  testAgentStatusUpdate() {
    return new Promise((resolve) => {
      const startTime = Date.now()

      const targetAgent = Array.from(this.agents.values()).find(
        (agent) => agent.status === 'active' && !agent.name.includes('Test Agent')
      ) || Array.from(this.agents.values())[0]

      if (!targetAgent) {
        const duration = Date.now() - startTime
        this.addTestResult({
          name: 'Agent Status Update',
          status: 'FAIL',
          message: 'No agents available for status update test',
          duration,
        })
        resolve()
        return
      }

      const updateMessage = {
        type: 'update',
        agent: {
          ...targetAgent,
          status: 'idle',
          resourceUsage: {
            tokens: (targetAgent.resourceUsage?.tokens || 0) + 100,
            cpu: (targetAgent.resourceUsage?.cpu || 0) + 5,
            memory: (targetAgent.resourceUsage?.memory || 0) + 10,
          },
        },
      }

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(updateMessage))
        this.log('Sent update message for agent: ' + targetAgent.id + ' (status: idle)', 'info')

        // Wait for update confirmation
        const checkInterval = setInterval(() => {
          const updatedAgent = this.agents.get(targetAgent.id)
          if (updatedAgent && updatedAgent.status === 'idle') {
            clearInterval(checkInterval)
            const duration = Date.now() - startTime
            this.addTestResult({
              name: 'Agent Status Update',
              status: 'PASS',
              message: 'Status successfully updated to idle',
              duration,
              details: {
                agentId: targetAgent.id,
                newStatus: 'idle',
              },
            })
            resolve()
          }
        }, 100)

        // Timeout after 5 seconds
        setTimeout(() => {
          clearInterval(checkInterval)
          const duration = Date.now() - startTime
          const updatedAgent = this.agents.get(targetAgent.id)
          if (!updatedAgent || updatedAgent.status !== 'idle') {
            this.addTestResult({
              name: 'Agent Status Update',
              status: 'FAIL',
              message: 'Update not reflected within 5 seconds',
              duration,
            })
          }
          resolve()
        }, 5000)
      } else {
        const duration = Date.now() - startTime
        this.addTestResult({
          name: 'Agent Status Update',
          status: 'FAIL',
          message: 'WebSocket is not connected',
          duration,
        })
        resolve()
      }
    })
  }

  testRapidUpdates() {
    return new Promise((resolve) => {
      const startTime = Date.now()
      const targetAgent = Array.from(this.agents.values())[0]

      if (!targetAgent) {
        const duration = Date.now() - startTime
        this.addTestResult({
          name: 'Rapid Updates',
          status: 'FAIL',
          message: 'No agents available',
          duration,
        })
        resolve()
        return
      }

      let sentCount = 0
      const rapidUpdateInterval = setInterval(() => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN && sentCount < 10) {
          const updateMessage = {
            type: 'update',
            agent: {
              ...targetAgent,
              resourceUsage: {
                tokens: Math.floor(Math.random() * 1000),
                cpu: Math.floor(Math.random() * 100),
                memory: Math.floor(Math.random() * 1000),
              },
            },
          }
          this.ws.send(JSON.stringify(updateMessage))
          sentCount++
        } else {
          clearInterval(rapidUpdateInterval)
        }
      }, 100)

      // Check after all updates sent
      setTimeout(() => {
        const duration = Date.now() - startTime
        this.addTestResult({
          name: 'Rapid Updates',
          status: 'PASS',
          message: `Successfully sent and processed ${sentCount} rapid updates`,
          duration,
          details: {
            updateCount: sentCount,
            messagesReceived: this.receivedMessages.length,
          },
        })
        resolve()
      }, 1500)
    })
  }

  testAgentCompletion() {
    return new Promise((resolve) => {
      const startTime = Date.now()

      // Find first active agent and complete it
      const targetAgent = Array.from(this.agents.values()).find((agent) => agent.status === 'active')

      if (!targetAgent) {
        const duration = Date.now() - startTime
        this.addTestResult({
          name: 'Agent Completion',
          status: 'FAIL',
          message: 'No active agents available',
          duration,
        })
        resolve()
        return
      }

      const completeMessage = {
        type: 'update',
        agent: {
          ...targetAgent,
          status: 'completed',
          endTime: new Date().toISOString(),
          output: 'Task completed successfully',
        },
      }

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(completeMessage))
        this.log('Sent completion message for agent: ' + targetAgent.id, 'info')

        // Wait for confirmation
        const checkInterval = setInterval(() => {
          const completedAgent = this.agents.get(targetAgent.id)
          if (completedAgent && completedAgent.status === 'completed') {
            clearInterval(checkInterval)
            const duration = Date.now() - startTime
            this.addTestResult({
              name: 'Agent Completion',
              status: 'PASS',
              message: 'Agent successfully marked as completed',
              duration,
              details: {
                agentId: targetAgent.id,
                output: completedAgent.output,
              },
            })
            resolve()
          }
        }, 100)

        // Timeout
        setTimeout(() => {
          clearInterval(checkInterval)
          const duration = Date.now() - startTime
          this.addTestResult({
            name: 'Agent Completion',
            status: 'FAIL',
            message: 'Completion not reflected within 5 seconds',
            duration,
          })
          resolve()
        }, 5000)
      } else {
        const duration = Date.now() - startTime
        this.addTestResult({
          name: 'Agent Completion',
          status: 'FAIL',
          message: 'WebSocket not connected',
          duration,
        })
        resolve()
      }
    })
  }

  testErrorHandling() {
    return new Promise((resolve) => {
      const startTime = Date.now()

      const errorAgent = Array.from(this.agents.values())[0]

      if (!errorAgent) {
        const duration = Date.now() - startTime
        this.addTestResult({
          name: 'Error Handling',
          status: 'FAIL',
          message: 'No agents available',
          duration,
        })
        resolve()
        return
      }

      const errorMessage = {
        type: 'update',
        agent: {
          ...errorAgent,
          status: 'error',
          error: 'Test error: Database connection failed',
        },
      }

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(errorMessage))
        this.log('Sent error message for agent: ' + errorAgent.id, 'info')

        // Wait for confirmation
        const checkInterval = setInterval(() => {
          const erroredAgent = this.agents.get(errorAgent.id)
          if (erroredAgent && erroredAgent.status === 'error') {
            clearInterval(checkInterval)
            const duration = Date.now() - startTime
            this.addTestResult({
              name: 'Error Handling',
              status: 'PASS',
              message: 'Error state successfully set and propagated',
              duration,
              details: {
                agentId: errorAgent.id,
                error: erroredAgent.error,
              },
            })
            resolve()
          }
        }, 100)

        // Timeout
        setTimeout(() => {
          clearInterval(checkInterval)
          const duration = Date.now() - startTime
          this.addTestResult({
            name: 'Error Handling',
            status: 'FAIL',
            message: 'Error state not reflected within 5 seconds',
            duration,
          })
          resolve()
        }, 5000)
      } else {
        const duration = Date.now() - startTime
        this.addTestResult({
          name: 'Error Handling',
          status: 'FAIL',
          message: 'WebSocket not connected',
          duration,
        })
        resolve()
      }
    })
  }

  printSummary() {
    console.log('\n' + '='.repeat(80))
    this.log('Test Summary', 'info')
    console.log('='.repeat(80) + '\n')

    const passed = this.testResults.filter((r) => r.status === 'PASS').length
    const failed = this.testResults.filter((r) => r.status === 'FAIL').length
    const pending = this.testResults.filter((r) => r.status === 'PENDING').length
    const totalTime = this.testResults.reduce((sum, r) => sum + r.duration, 0)

    console.log(`Total Tests: ${this.testResults.length}`)
    console.log(`Passed: ${passed}`)
    console.log(`Failed: ${failed}`)
    console.log(`Pending: ${pending}`)
    console.log(`Total Duration: ${totalTime}ms`)
    console.log(`Success Rate: ${((passed / this.testResults.length) * 100).toFixed(2)}%`)

    console.log('\nDetailed Results:\n')

    this.testResults.forEach((result, index) => {
      const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏳'
      console.log(`${index + 1}. ${statusIcon} ${result.name}`)
      console.log(`   Status: ${result.status}`)
      console.log(`   Message: ${result.message}`)
      console.log(`   Duration: ${result.duration}ms`)
      if (result.details) {
        console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`)
      }
      console.log()
    })

    console.log('='.repeat(80))
    console.log(`Final Result: ${failed === 0 ? 'ALL TESTS PASSED' : `${failed} TEST(S) FAILED`}`)
    console.log('='.repeat(80))
  }
}

// Run the tests
const tester = new AgentMonitoringTester()
tester.runTests().catch(console.error)
