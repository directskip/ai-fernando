#!/usr/bin/env node
/**
 * Mobile Viewport Test
 * Tests responsive design on mobile devices
 */

const http = require('http')

class MobileViewportTester {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl
    this.testResults = []
    // Common mobile viewport sizes
    this.viewports = [
      { name: 'iPhone 12', width: 390, height: 844 },
      { name: 'iPhone SE', width: 375, height: 667 },
      { name: 'Android Phone', width: 412, height: 915 },
      { name: 'iPad Mini', width: 768, height: 1024 },
      { name: 'Tablet', width: 1024, height: 768 },
    ]
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
  }

  makeRequest(path, headers = {}) {
    return new Promise((resolve) => {
      const url = new URL(path, this.baseUrl)
      const startTime = Date.now()

      const reqOptions = {
        hostname: url.hostname,
        port: url.port || 3000,
        path: url.pathname + url.search,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Mobile)',
          ...headers,
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
    this.log('Starting Mobile Viewport Testing Suite', 'info')
    this.log('Target URL: ' + this.baseUrl, 'info')
    console.log('\n' + '='.repeat(80) + '\n')

    // Test 1: Responsive CSS
    await this.testResponsiveCSS()

    // Test 2: Mobile Meta Tags
    await this.testMobileMetaTags()

    // Test 3: Viewport Sizes
    await this.testViewportSizes()

    // Test 4: Mobile Agent Page
    await this.testMobileAgentPage()

    // Test 5: Touch Events Support
    await this.testTouchEventsSupport()

    // Print summary
    this.printSummary()
  }

  async testResponsiveCSS() {
    const startTime = Date.now()
    this.log('Testing responsive CSS loading', 'info')

    const result = await this.makeRequest('/admin/agents')

    const duration = Date.now() - startTime

    if (result.error) {
      this.addTestResult({
        name: 'Responsive CSS',
        status: 'FAIL',
        message: `Failed to load: ${result.error}`,
        duration,
      })
      return
    }

    // Check for responsive CSS
    const hasTailwind =
      result.body.includes('sm:') || result.body.includes('md:') || result.body.includes('flex-col')
    const hasViewportMeta = result.body.includes('viewport')

    if (result.status === 200 && hasTailwind) {
      this.addTestResult({
        name: 'Responsive CSS',
        status: 'PASS',
        message: 'Page includes responsive CSS classes (Tailwind)',
        duration,
      })
    } else if (result.error) {
      this.addTestResult({
        name: 'Responsive CSS',
        status: 'FAIL',
        message: `Failed to load: ${result.error}`,
        duration,
      })
    } else {
      this.addTestResult({
        name: 'Responsive CSS',
        status: 'FAIL',
        message: 'No responsive CSS classes detected',
        duration,
      })
    }
  }

  async testMobileMetaTags() {
    const startTime = Date.now()
    this.log('Testing mobile meta tags', 'info')

    const result = await this.makeRequest('/')

    const duration = Date.now() - startTime

    if (result.error || !result.body) {
      this.addTestResult({
        name: 'Mobile Meta Tags',
        status: 'FAIL',
        message: `Failed to load: ${result.error || 'No body'}`,
        duration,
      })
      return
    }

    const hasViewportMeta = result.body.includes('viewport')
    const hasCharset = result.body.includes('charset')
    const hasXUA = result.body.includes('X-UA-Compatible') || result.body.includes('IE=edge')

    const metaTags = {
      viewport: hasViewportMeta,
      charset: hasCharset,
      xUA: hasXUA,
    }

    const passed = hasViewportMeta && hasCharset

    if (passed) {
      this.addTestResult({
        name: 'Mobile Meta Tags',
        status: 'PASS',
        message: 'All essential meta tags present',
        duration,
        details: metaTags,
      })
    } else {
      this.addTestResult({
        name: 'Mobile Meta Tags',
        status: 'FAIL',
        message: `Missing meta tags: ${Object.entries(metaTags)
          .filter(([, v]) => !v)
          .map(([k]) => k)
          .join(', ')}`,
        duration,
        details: metaTags,
      })
    }
  }

  async testViewportSizes() {
    const startTime = Date.now()
    this.log('Testing viewport sizes', 'info')

    const result = await this.makeRequest('/admin/agents')

    const duration = Date.now() - startTime

    if (result.error || !result.body) {
      this.addTestResult({
        name: 'Viewport Size Support',
        status: 'FAIL',
        message: `Failed to load: ${result.error || 'No body'}`,
        duration,
      })
      return
    }

    // Check for responsive classes for different viewport sizes
    const viewport_checks = {
      'sm (640px)': result.body.includes('sm:'),
      'md (768px)': result.body.includes('md:'),
      'lg (1024px)': result.body.includes('lg:'),
    }

    const passed = Object.values(viewport_checks).filter(Boolean).length >= 2

    if (passed) {
      this.addTestResult({
        name: 'Viewport Size Support',
        status: 'PASS',
        message: `Supports multiple viewport sizes: ${Object.entries(viewport_checks)
          .filter(([, v]) => v)
          .map(([k]) => k)
          .join(', ')}`,
        duration,
        details: viewport_checks,
      })
    } else {
      this.addTestResult({
        name: 'Viewport Size Support',
        status: 'FAIL',
        message: 'Limited viewport size support detected',
        duration,
        details: viewport_checks,
      })
    }
  }

  async testMobileAgentPage() {
    const startTime = Date.now()
    this.log('Testing mobile agent page rendering', 'info')

    const result = await this.makeRequest('/admin/agents', {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
    })

    const duration = Date.now() - startTime

    if (result.error) {
      this.addTestResult({
        name: 'Mobile Agent Page',
        status: 'FAIL',
        message: `Failed to load: ${result.error}`,
        duration,
      })
      return
    }

    const hasContent = result.body && result.body.length > 1000
    const isValidHTML = result.body.includes('<!') || result.body.includes('<html')

    // Check for mobile-friendly elements
    const hasMobileElements =
      result.body.includes('flex-col') || // For stacking on mobile
      result.body.includes('w-full') || // Full width
      result.body.includes('gap-') // Spacing utilities

    if (result.status === 200 && hasContent && hasMobileElements) {
      this.addTestResult({
        name: 'Mobile Agent Page',
        status: 'PASS',
        message: 'Agent page renders correctly for mobile devices',
        duration,
        details: {
          contentSize: result.body.length,
          hasMobileElements,
        },
      })
    } else if (result.error) {
      this.addTestResult({
        name: 'Mobile Agent Page',
        status: 'FAIL',
        message: `Failed to load: ${result.error}`,
        duration,
      })
    } else {
      this.addTestResult({
        name: 'Mobile Agent Page',
        status: 'FAIL',
        message: 'Page does not appear optimized for mobile',
        duration,
        details: {
          hasContent,
          hasMobileElements,
        },
      })
    }
  }

  async testTouchEventsSupport() {
    const startTime = Date.now()
    this.log('Testing touch events support', 'info')

    const result = await this.makeRequest('/admin/agents')

    const duration = Date.now() - startTime

    if (result.error || !result.body) {
      this.addTestResult({
        name: 'Touch Events Support',
        status: 'FAIL',
        message: `Failed to load: ${result.error || 'No body'}`,
        duration,
      })
      return
    }

    // Check for touch event handlers or mobile-friendly interactions
    const hasTouchElements =
      result.body.includes('onClick') || // React click handlers work with touch
      result.body.includes('button') || // Buttons are touch-friendly
      result.body.includes('interactive') // Interactive elements

    const hasAccessibility =
      result.body.includes('aria-') || // Accessibility attributes
      result.body.includes('role=') // ARIA roles

    const passed = hasTouchElements

    if (passed) {
      this.addTestResult({
        name: 'Touch Events Support',
        status: 'PASS',
        message: 'Page has touch-friendly interactive elements',
        duration,
        details: {
          touchElements: true,
          accessibility: hasAccessibility,
        },
      })
    } else {
      this.addTestResult({
        name: 'Touch Events Support',
        status: 'FAIL',
        message: 'Limited touch-friendly elements detected',
        duration,
      })
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(80))
    this.log('Mobile Viewport Test Summary', 'info')
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
const tester = new MobileViewportTester()
tester.runTests().catch(console.error)
