#!/usr/bin/env node
/**
 * Agent Monitoring UI - HTTP/Frontend Test
 * Tests the UI directly without WebSocket server
 */

const http = require('http')
const crypto = require('crypto')

class UITester {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl
    this.testResults = []
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}]`
    const levelEmoji = {
      info: 'ℹ️',
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

  makeRequest(path, method = 'GET', options = {}) {
    return new Promise((resolve) => {
      const url = new URL(path, this.baseUrl)
      const startTime = Date.now()

      const reqOptions = {
        hostname: url.hostname,
        port: url.port || 3000,
        path: url.pathname + url.search,
        method: method,
        headers: {
          'User-Agent': 'Agent-Monitoring-Tester/1.0',
          ...options.headers,
        },
      }

      try {
        const req = http.request(reqOptions, (res) => {
          let data = ''

          res.on('data', (chunk) => {
            data += chunk
          })

          res.on('end', () => {
            const duration = Date.now() - startTime
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: data,
              duration,
            })
          })
        })

        req.on('error', (error) => {
          const duration = Date.now() - startTime
          resolve({
            error: error.message,
            duration,
          })
        })

        req.end()
      } catch (error) {
        const duration = Date.now() - startTime
        resolve({
          error: error.message,
          duration,
        })
      }
    })
  }

  async runTests() {
    this.log('Starting UI Testing Suite', 'info')
    this.log('Target URL: ' + this.baseUrl, 'info')
    console.log('\n' + '='.repeat(80) + '\n')

    // Test 1: Server Health Check
    await this.testServerHealth()

    // Test 2: Home Page Load
    await this.testHomePage()

    // Test 3: Admin Panel Access
    await this.testAdminPanel()

    // Test 4: Agents Page Access
    await this.testAgentsPage()

    // Test 5: API Health Check
    await this.testAPIHealth()

    // Test 6: Static Assets
    await this.testStaticAssets()

    // Print summary
    this.printSummary()
  }

  async testServerHealth() {
    const startTime = Date.now()
    this.log('Testing server health check', 'info')

    const result = await this.makeRequest('/')

    const duration = Date.now() - startTime

    if (result.status === 200) {
      this.addTestResult({
        name: 'Server Health Check',
        status: 'PASS',
        message: `Server is responding (${result.status})`,
        duration,
      })
    } else if (result.status === 404) {
      this.addTestResult({
        name: 'Server Health Check',
        status: 'PASS',
        message: `Server is responding with 404 (expected for root)`,
        duration,
      })
    } else if (result.error) {
      this.addTestResult({
        name: 'Server Health Check',
        status: 'FAIL',
        message: `Connection failed: ${result.error}`,
        duration,
      })
    } else {
      this.addTestResult({
        name: 'Server Health Check',
        status: 'FAIL',
        message: `Unexpected status: ${result.status}`,
        duration,
      })
    }
  }

  async testHomePage() {
    const startTime = Date.now()
    this.log('Testing home page load', 'info')

    const result = await this.makeRequest('/')

    const duration = Date.now() - startTime
    const hasContent = result.body && result.body.length > 0
    const isHTML = result.headers && result.headers['content-type']?.includes('text/html')

    if (result.status === 200 && hasContent && isHTML) {
      this.addTestResult({
        name: 'Home Page Load',
        status: 'PASS',
        message: `Homepage loaded successfully (${result.body.length} bytes)`,
        duration,
      })
    } else if (result.error) {
      this.addTestResult({
        name: 'Home Page Load',
        status: 'FAIL',
        message: `Failed to load: ${result.error}`,
        duration,
      })
    } else {
      this.addTestResult({
        name: 'Home Page Load',
        status: 'FAIL',
        message: `Page load failed (Status: ${result.status})`,
        duration,
      })
    }
  }

  async testAdminPanel() {
    const startTime = Date.now()
    this.log('Testing admin panel access', 'info')

    const result = await this.makeRequest('/admin')

    const duration = Date.now() - startTime

    // Next.js redirects to /admin/ or requires auth
    if (result.status === 200 || result.status === 307 || result.status === 308) {
      this.addTestResult({
        name: 'Admin Panel Access',
        status: 'PASS',
        message: `Admin panel is accessible (Status: ${result.status})`,
        duration,
        details: {
          status: result.status,
          redirectLocation: result.headers.location,
        },
      })
    } else if (result.error) {
      this.addTestResult({
        name: 'Admin Panel Access',
        status: 'FAIL',
        message: `Failed to access: ${result.error}`,
        duration,
      })
    } else {
      this.addTestResult({
        name: 'Admin Panel Access',
        status: 'FAIL',
        message: `Unexpected status: ${result.status}`,
        duration,
      })
    }
  }

  async testAgentsPage() {
    const startTime = Date.now()
    this.log('Testing agents page access', 'info')

    const result = await this.makeRequest('/admin/agents')

    const duration = Date.now() - startTime
    const hasContent = result.body && result.body.length > 0

    if ((result.status === 200 || result.status === 307 || result.status === 308) && hasContent) {
      const hasAgentReferences =
        result.body.includes('Agent') || result.body.includes('agent') || result.body.includes('WebSocket')

      this.addTestResult({
        name: 'Agents Page Load',
        status: 'PASS',
        message: `Agents page loaded (${result.body.length} bytes)`,
        duration,
        details: {
          status: result.status,
          hasAgentReferences,
          contentType: result.headers['content-type'],
        },
      })
    } else if (result.error) {
      this.addTestResult({
        name: 'Agents Page Load',
        status: 'FAIL',
        message: `Failed to load: ${result.error}`,
        duration,
      })
    } else {
      this.addTestResult({
        name: 'Agents Page Load',
        status: 'FAIL',
        message: `Unexpected status: ${result.status}`,
        duration,
      })
    }
  }

  async testAPIHealth() {
    const startTime = Date.now()
    this.log('Testing API endpoint health', 'info')

    const result = await this.makeRequest('/api/agents')

    const duration = Date.now() - startTime

    // API might require auth (401) or return 200
    if (result.status === 200 || result.status === 401 || result.status === 405) {
      this.addTestResult({
        name: 'API Endpoint Health',
        status: 'PASS',
        message: `API is responding (Status: ${result.status})`,
        duration,
        details: {
          status: result.status,
          contentType: result.headers['content-type'],
        },
      })
    } else if (result.error) {
      this.addTestResult({
        name: 'API Endpoint Health',
        status: 'FAIL',
        message: `API connection failed: ${result.error}`,
        duration,
      })
    } else {
      this.addTestResult({
        name: 'API Endpoint Health',
        status: 'FAIL',
        message: `Unexpected API status: ${result.status}`,
        duration,
      })
    }
  }

  async testStaticAssets() {
    const startTime = Date.now()
    this.log('Testing static assets', 'info')

    // Try to load a common Next.js asset
    const result = await this.makeRequest('/_next/static/chunks/main.js')

    const duration = Date.now() - startTime

    if (result.status === 200 || result.status === 304) {
      this.addTestResult({
        name: 'Static Assets',
        status: 'PASS',
        message: 'Static assets are being served correctly',
        duration,
        details: {
          status: result.status,
        },
      })
    } else if (result.status === 404) {
      // Try alternate location
      this.log('Trying alternate static asset location', 'info')

      const altResult = await this.makeRequest('/_next/image')

      if (altResult.status === 200 || altResult.status === 304) {
        this.addTestResult({
          name: 'Static Assets',
          status: 'PASS',
          message: 'Static assets are being served (alternate location)',
          duration: duration + altResult.duration,
          details: {
            status: altResult.status,
          },
        })
      } else {
        this.addTestResult({
          name: 'Static Assets',
          status: 'FAIL',
          message: `Static assets not found (Status: ${result.status})`,
          duration,
        })
      }
    } else if (result.error) {
      this.addTestResult({
        name: 'Static Assets',
        status: 'FAIL',
        message: `Asset loading failed: ${result.error}`,
        duration,
      })
    } else {
      this.addTestResult({
        name: 'Static Assets',
        status: 'FAIL',
        message: `Unexpected asset status: ${result.status}`,
        duration,
      })
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(80))
    this.log('UI Test Summary', 'info')
    console.log('='.repeat(80) + '\n')

    const passed = this.testResults.filter((r) => r.status === 'PASS').length
    const failed = this.testResults.filter((r) => r.status === 'FAIL').length
    const total = this.testResults.length
    const totalTime = this.testResults.reduce((sum, r) => sum + r.duration, 0)

    console.log(`Total Tests: ${total}`)
    console.log(`Passed: ${passed}`)
    console.log(`Failed: ${failed}`)
    console.log(`Total Duration: ${totalTime}ms`)
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(2)}%`)

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

// Run tests
const tester = new UITester()
tester.runTests().catch(console.error)
