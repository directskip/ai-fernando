'use client'

import { useEffect, useState } from 'react'
import { getInboxItems, submitInboxFeedback, addInboxNote } from '@/lib/api'
import { InboxItem, ExtractedItem } from '@/lib/types'

export default function InboxPage() {
  const [items, setItems] = useState<InboxItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({})
  const [processingItems, setProcessingItems] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchInboxItems()
  }, [])

  const fetchInboxItems = async () => {
    try {
      setLoading(true)
      const response = await getInboxItems()
      setItems(response.items || [])
    } catch (err) {
      console.error('Error fetching inbox items:', err)
      setError('Failed to load inbox items. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId)
    } else {
      newExpanded.add(itemId)
    }
    setExpandedItems(newExpanded)
  }

  const handleFeedback = async (
    itemId: string,
    status: 'approved' | 'rejected' | 'needs_info'
  ) => {
    try {
      setProcessingItems((prev) => new Set(prev).add(itemId))
      await submitInboxFeedback(itemId, status)
      await fetchInboxItems()
    } catch (err) {
      console.error('Error submitting feedback:', err)
      alert('Failed to submit feedback. Please try again.')
    } finally {
      setProcessingItems((prev) => {
        const newSet = new Set(prev)
        newSet.delete(itemId)
        return newSet
      })
    }
  }

  const handleAddNote = async (itemId: string) => {
    const message = noteInputs[itemId]?.trim()
    if (!message) return

    try {
      setProcessingItems((prev) => new Set(prev).add(itemId))
      await addInboxNote(itemId, message)
      setNoteInputs((prev) => ({ ...prev, [itemId]: '' }))
      await fetchInboxItems()
    } catch (err) {
      console.error('Error adding note:', err)
      alert('Failed to add note. Please try again.')
    } finally {
      setProcessingItems((prev) => {
        const newSet = new Set(prev)
        newSet.delete(itemId)
        return newSet
      })
    }
  }

  const renderExtractedItems = (items: ExtractedItem[], type: string, emoji: string) => {
    if (!items || items.length === 0) return null

    return (
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          {emoji} {type} ({items.length})
        </h4>
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="bg-gray-50 dark:bg-gray-700 rounded p-3 border border-gray-200 dark:border-gray-600"
            >
              <p className="text-sm text-gray-900 dark:text-white font-medium mb-1">
                {item.content}
              </p>
              {item.context && (
                <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                  Context: {item.context}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin">
            <p className="text-4xl">⏳</p>
          </div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading inbox...</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4 text-red-800 dark:text-red-200">
          <h2 className="font-semibold mb-2">Error</h2>
          <p>{error}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 py-4 md:py-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Brain Dump Inbox
        </h1>
        <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400">
          Review and approve AI extractions from your brain dumps
        </p>
      </div>

      {items.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-2xl mb-2">📭</p>
          <p className="text-gray-600 dark:text-gray-400">Your inbox is empty</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Brain dumps will appear here for review
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const isExpanded = expandedItems.has(item.id)
            const isProcessing = processingItems.has(item.id)
            const feedbackStatus = item.feedback?.status

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
              >
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                          Brain Dump
                        </span>
                        {feedbackStatus && (
                          <span
                            className={`text-xs font-medium px-2 py-1 rounded-full ${
                              feedbackStatus === 'approved'
                                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                : feedbackStatus === 'rejected'
                                  ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                                  : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                            }`}
                          >
                            {feedbackStatus === 'needs_info' ? 'Needs Info' : feedbackStatus}
                          </span>
                        )}
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(item.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-900 dark:text-white font-medium mb-2">
                        {item.originalContent}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleExpanded(item.id)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    >
                      {isExpanded ? '▼' : '▶'}
                    </button>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="p-4">
                    {/* AI Extractions */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        AI Extracted:
                      </h3>
                      {renderExtractedItems(item.extracted.knowledge, 'Knowledge', '💡')}
                      {renderExtractedItems(item.extracted.projects, 'Projects', '🚀')}
                      {renderExtractedItems(item.extracted.todos, 'To-Dos', '✅')}
                      {renderExtractedItems(item.extracted.questions, 'Questions', '❓')}
                    </div>

                    {/* Feedback Notes Thread */}
                    {item.feedback?.notes && item.feedback.notes.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          Conversation:
                        </h3>
                        <div className="space-y-3">
                          {item.feedback.notes.map((note) => (
                            <div
                              key={note.id}
                              className="bg-blue-50 dark:bg-blue-900 rounded-lg p-3 border border-blue-200 dark:border-blue-700"
                            >
                              <div className="flex items-start gap-2 mb-1">
                                <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                                  You
                                </span>
                                <span className="text-xs text-blue-600 dark:text-blue-400">
                                  {new Date(note.timestamp).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-sm text-blue-900 dark:text-blue-100">
                                {note.message}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Add Note */}
                    <div className="mb-6">
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Add a note or question for Fernando:
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={noteInputs[item.id] || ''}
                          onChange={(e) =>
                            setNoteInputs((prev) => ({ ...prev, [item.id]: e.target.value }))
                          }
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') handleAddNote(item.id)
                          }}
                          placeholder="e.g., Need more context about the property tracking system..."
                          className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          disabled={isProcessing}
                        />
                        <button
                          onClick={() => handleAddNote(item.id)}
                          disabled={isProcessing || !noteInputs[item.id]?.trim()}
                          className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs sm:text-sm font-medium transition-colors min-h-[44px] flex items-center justify-center"
                        >
                          Add Note
                        </button>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        onClick={() => handleFeedback(item.id, 'approved')}
                        disabled={isProcessing}
                        className="px-6 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-xs sm:text-sm font-semibold transition-colors min-h-[44px] flex items-center justify-center"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => handleFeedback(item.id, 'needs_info')}
                        disabled={isProcessing}
                        className="px-6 py-2.5 rounded-lg bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 text-white text-xs sm:text-sm font-semibold transition-colors min-h-[44px] flex items-center justify-center"
                      >
                        ℹ Need More Info
                      </button>
                      <button
                        onClick={() => handleFeedback(item.id, 'rejected')}
                        disabled={isProcessing}
                        className="px-6 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-xs sm:text-sm font-semibold transition-colors min-h-[44px] flex items-center justify-center"
                      >
                        ✗ Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
