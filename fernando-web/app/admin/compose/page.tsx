'use client'

import { useEffect, useState, useRef } from 'react'
import { processBrainDump } from '@/lib/api'

interface ExtractedItem {
  type: 'todo' | 'question' | 'knowledge' | 'project'
  content: string
  context?: string
}

interface ProcessingResult {
  todos: ExtractedItem[]
  questions: ExtractedItem[]
  knowledge: ExtractedItem[]
  projects: ExtractedItem[]
}

export default function ComposePage() {
  const [content, setContent] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<ProcessingResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null)

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('brain-dump-draft')
    if (saved) {
      setContent(saved)
      const savedTime = localStorage.getItem('brain-dump-saved-at')
      if (savedTime) {
        setLastSaved(new Date(savedTime))
      }
    }
  }, [])

  // Auto-save to localStorage every 2 seconds
  useEffect(() => {
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current)
    }

    autoSaveTimer.current = setTimeout(() => {
      if (content) {
        localStorage.setItem('brain-dump-draft', content)
        const now = new Date()
        localStorage.setItem('brain-dump-saved-at', now.toISOString())
        setLastSaved(now)
      }
    }, 2000)

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current)
      }
    }
  }, [content])

  const handleSubmit = async () => {
    if (!content.trim()) {
      setError('Please enter some content to process')
      return
    }

    setIsProcessing(true)
    setError(null)
    setResult(null)

    try {
      const response = await processBrainDump(content)
      setResult(response)

      // Clear draft after successful processing
      localStorage.removeItem('brain-dump-draft')
      localStorage.removeItem('brain-dump-saved-at')
      setContent('')
      setLastSaved(null)
    } catch (err) {
      console.error('Error processing brain dump:', err)
      setError(err instanceof Error ? err.message : 'Failed to process brain dump')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClear = () => {
    if (confirm('Are you sure you want to clear all content? This cannot be undone.')) {
      setContent('')
      setResult(null)
      setError(null)
      localStorage.removeItem('brain-dump-draft')
      localStorage.removeItem('brain-dump-saved-at')
      setLastSaved(null)
    }
  }

  return (
    <main className="container mx-auto px-4 py-6 md:py-8 max-w-7xl">
      <div className="mb-6 md:mb-10">
        <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">
          Brain Dump
        </h1>
        <p className="text-base md:text-lg text-gray-600 dark:text-gray-400">
          Write freely. AI will extract todos, questions, knowledge, and project notes.
        </p>
      </div>

      {/* Editor Section */}
      <div className="mb-6 md:mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {content.length} characters
              </span>
              {lastSaved && (
                <span className="text-xs text-gray-500 dark:text-gray-500">
                  Last saved: {lastSaved.toLocaleTimeString()}
                </span>
              )}
            </div>
            <button
              onClick={handleClear}
              className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
              disabled={isProcessing}
            >
              Clear
            </button>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start writing your thoughts, ideas, tasks, questions... anything that's on your mind.

Examples:
- Need to refactor the user authentication module
- How should we handle error logging in production?
- Decided to use PostgreSQL for the new analytics feature
- Working on the e-commerce checkout flow - need to add PayPal integration"
            className="w-full min-h-[400px] p-4 text-base md:text-lg bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none resize-none"
            disabled={isProcessing}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 md:mb-8">
        <button
          onClick={handleSubmit}
          disabled={isProcessing || !content.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors text-base md:text-lg shadow-sm"
        >
          {isProcessing ? 'Processing...' : 'Process with AI'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4 text-red-800 dark:text-red-200">
          <h3 className="font-semibold mb-2">Error</h3>
          <p>{error}</p>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="space-y-6">
          <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-4 text-green-800 dark:text-green-200">
            <h3 className="font-semibold mb-2">Successfully Processed</h3>
            <p>Your brain dump has been analyzed and stored. Here's what was extracted:</p>
          </div>

          {/* Todos */}
          {result.todos.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">✓</span>
                Todos ({result.todos.length})
              </h2>
              <div className="space-y-3">
                {result.todos.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                    <div className="flex-1">
                      <p className="text-gray-900 dark:text-white">{item.content}</p>
                      {item.context && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.context}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Questions */}
          {result.questions.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">?</span>
                Questions ({result.questions.length})
              </h2>
              <div className="space-y-3">
                {result.questions.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                    <div className="flex-1">
                      <p className="text-gray-900 dark:text-white">{item.content}</p>
                      {item.context && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.context}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Knowledge */}
          {result.knowledge.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">💡</span>
                Knowledge ({result.knowledge.length})
              </h2>
              <div className="space-y-3">
                {result.knowledge.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                    <div className="flex-1">
                      <p className="text-gray-900 dark:text-white">{item.content}</p>
                      {item.context && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.context}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {result.projects.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">📁</span>
                Project Notes ({result.projects.length})
              </h2>
              <div className="space-y-3">
                {result.projects.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                    <div className="flex-1">
                      <p className="text-gray-900 dark:text-white">{item.content}</p>
                      {item.context && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.context}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {result.todos.length === 0 &&
           result.questions.length === 0 &&
           result.knowledge.length === 0 &&
           result.projects.length === 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                No specific items were extracted from your brain dump, but it has been stored for future reference.
              </p>
            </div>
          )}
        </div>
      )}
    </main>
  )
}
