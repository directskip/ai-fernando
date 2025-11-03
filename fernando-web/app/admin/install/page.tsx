'use client'

import { useState } from 'react'

export default function InstallPage() {
  const [copied, setCopied] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const installCommand = `curl -fsSL ${typeof window !== 'undefined' ? window.location.origin : 'https://fernando.aibusinesssuite.io'}/api/install.sh | bash`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(installCommand)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const testConnection = async () => {
    setTesting(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/health', { method: 'GET' })
      if (response.ok) {
        setTestResult({ success: true, message: 'Connection successful! Fernando API is reachable.' })
      } else {
        setTestResult({ success: false, message: 'Connection failed. Please check your network.' })
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Connection failed. Cannot reach Fernando API.' })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-6">
            <h1 className="text-3xl font-bold text-white mb-2">Install Fernando CLI</h1>
            <p className="text-blue-100">Get started with your personal AI assistant in minutes</p>
          </div>

          {/* Main Content */}
          <div className="px-8 py-6 space-y-8">
            {/* System Requirements */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <span className="mr-2">💻</span> System Requirements
              </h2>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-2">
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <span className="w-6 h-6 flex items-center justify-center bg-green-500 text-white rounded-full mr-3 text-sm">✓</span>
                  <span>macOS (Darwin-based systems)</span>
                </div>
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <span className="w-6 h-6 flex items-center justify-center bg-green-500 text-white rounded-full mr-3 text-sm">✓</span>
                  <span>Homebrew package manager</span>
                </div>
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <span className="w-6 h-6 flex items-center justify-center bg-green-500 text-white rounded-full mr-3 text-sm">✓</span>
                  <span>tmux, jq, node, curl (auto-installed)</span>
                </div>
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <span className="w-6 h-6 flex items-center justify-center bg-blue-500 text-white rounded-full mr-3 text-sm">i</span>
                  <span>Claude Code CLI (for AI interactions)</span>
                </div>
              </div>
            </section>

            {/* One-Click Installation */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <span className="mr-2">⚡</span> One-Click Installation
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Run this command in your terminal to download and install Fernando CLI:
              </p>
              <div className="bg-gray-900 rounded-lg p-4 flex items-center justify-between">
                <code className="text-green-400 text-sm flex-1 overflow-x-auto">
                  {installCommand}
                </code>
                <button
                  onClick={copyToClipboard}
                  className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center"
                >
                  {copied ? (
                    <>
                      <span className="mr-2">✓</span> Copied
                    </>
                  ) : (
                    <>
                      <span className="mr-2">📋</span> Copy
                    </>
                  )}
                </button>
              </div>
            </section>

            {/* Download Script */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <span className="mr-2">⬇️</span> Download Installation Script
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Prefer to review the script first? Download it and run locally:
              </p>
              <div className="flex gap-3">
                <a
                  href="/api/install.sh"
                  download="fernando-install.sh"
                  className="px-6 py-3 bg-white dark:bg-gray-700 border-2 border-blue-600 text-blue-600 dark:text-blue-400 rounded-lg font-semibold hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors"
                >
                  Download install.sh
                </a>
                <a
                  href="/api/fernando"
                  download="fernando"
                  className="px-6 py-3 bg-white dark:bg-gray-700 border-2 border-blue-600 text-blue-600 dark:text-blue-400 rounded-lg font-semibold hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors"
                >
                  Download CLI Script
                </a>
              </div>
              <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>Manual installation:</strong> After downloading, run <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">bash fernando-install.sh</code> in your terminal.
                </p>
              </div>
            </section>

            {/* What Gets Installed */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <span className="mr-2">📦</span> What Gets Installed
              </h2>
              <div className="space-y-3">
                <div className="flex items-start">
                  <span className="text-2xl mr-3">1️⃣</span>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Fernando CLI</h3>
                    <p className="text-gray-600 dark:text-gray-400">Main executable installed to <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">~/fernando/fernando</code></p>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="text-2xl mr-3">2️⃣</span>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Directory Structure</h3>
                    <p className="text-gray-600 dark:text-gray-400">Creates <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">~/fernando/</code> with sessions, knowledge, and scripts folders</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="text-2xl mr-3">3️⃣</span>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">PATH Configuration</h3>
                    <p className="text-gray-600 dark:text-gray-400">Adds Fernando to your PATH in <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">~/.zshrc</code> or <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">~/.bashrc</code></p>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="text-2xl mr-3">4️⃣</span>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Dependencies</h3>
                    <p className="text-gray-600 dark:text-gray-400">Installs tmux, jq, node, and curl via Homebrew (if not present)</p>
                  </div>
                </div>
              </div>
            </section>

            {/* AWS Credentials (Optional) */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <span className="mr-2">🔐</span> AWS Credentials (Optional)
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Fernando uses cloud sync for knowledge management. AWS credentials are optional but recommended:
              </p>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-300 mb-2">
                  <strong>Note:</strong> Cloud sync works via API and doesn't require AWS CLI configuration.
                </p>
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  If you want to use direct AWS access, configure credentials after installation using the AWS CLI.
                </p>
              </div>
            </section>

            {/* Test Connection */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <span className="mr-2">🔌</span> Test Connection
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Verify that you can connect to the Fernando API:
              </p>
              <button
                onClick={testConnection}
                disabled={testing}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
              >
                {testing ? 'Testing...' : 'Test Connection'}
              </button>
              {testResult && (
                <div className={`mt-4 p-4 rounded-lg ${testResult.success ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
                  <p className={`text-sm ${testResult.success ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
                    {testResult.message}
                  </p>
                </div>
              )}
            </section>

            {/* Getting Started */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <span className="mr-2">🚀</span> Getting Started
              </h2>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Start a new session:</h3>
                  <code className="block bg-gray-900 text-green-400 p-3 rounded">fernando start</code>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">End current session:</h3>
                  <code className="block bg-gray-900 text-green-400 p-3 rounded">fernando end</code>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">List active sessions:</h3>
                  <code className="block bg-gray-900 text-green-400 p-3 rounded">fernando sessions</code>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Clean up orphaned sessions:</h3>
                  <code className="block bg-gray-900 text-green-400 p-3 rounded">fernando cleanup</code>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Sync knowledge to cloud:</h3>
                  <code className="block bg-gray-900 text-green-400 p-3 rounded">fernando sync</code>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Pull knowledge from cloud:</h3>
                  <code className="block bg-gray-900 text-green-400 p-3 rounded">fernando pull</code>
                </div>
              </div>
            </section>

            {/* Troubleshooting */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <span className="mr-2">🔧</span> Troubleshooting
              </h2>
              <div className="space-y-3">
                <details className="bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <summary className="cursor-pointer p-4 font-semibold text-gray-900 dark:text-white">
                    Command not found: fernando
                  </summary>
                  <div className="px-4 pb-4 text-gray-600 dark:text-gray-400">
                    <p className="mb-2">Restart your terminal or run:</p>
                    <code className="block bg-gray-900 text-green-400 p-2 rounded">source ~/.zshrc</code>
                    <p className="mt-2">Or add Fernando to PATH manually:</p>
                    <code className="block bg-gray-900 text-green-400 p-2 rounded">export PATH="$HOME/fernando:$PATH"</code>
                  </div>
                </details>
                <details className="bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <summary className="cursor-pointer p-4 font-semibold text-gray-900 dark:text-white">
                    Tmux session errors
                  </summary>
                  <div className="px-4 pb-4 text-gray-600 dark:text-gray-400">
                    <p className="mb-2">If you encounter "can't find pane" errors, run:</p>
                    <code className="block bg-gray-900 text-green-400 p-2 rounded">fernando cleanup</code>
                    <p className="mt-2">Or kill all tmux sessions:</p>
                    <code className="block bg-gray-900 text-green-400 p-2 rounded">tmux kill-server</code>
                  </div>
                </details>
                <details className="bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <summary className="cursor-pointer p-4 font-semibold text-gray-900 dark:text-white">
                    Cloud sync not working
                  </summary>
                  <div className="px-4 pb-4 text-gray-600 dark:text-gray-400">
                    <p className="mb-2">Test your connection using the button above. If it fails:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Check your internet connection</li>
                      <li>Verify the API URL is correct</li>
                      <li>Ensure curl is installed: <code className="bg-gray-900 text-green-400 px-2 py-1 rounded">which curl</code></li>
                    </ul>
                  </div>
                </details>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
