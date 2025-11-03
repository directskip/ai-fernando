'use client'

import { useEffect, useState } from 'react'
import { getKnowledge, reclassifyKnowledge } from '@/lib/api'

interface UnclassifiedItem {
  id: string
  title: string
  content: unknown
  suggestedCategory: 'public' | 'conditional' | 'private' | 'preferences'
  reason: string
  feedback?: {
    status?: 'needs_review' | 'approved' | 'rejected'
    notes?: Array<{
      id: string
      message: string
      timestamp: string
    }>
  }
}

export default function ClassifyPage() {
  const [items, setItems] = useState<UnclassifiedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({})

  useEffect(() => {
    loadUnclassified()
  }, [])

  const loadUnclassified = async () => {
    try {
      setLoading(true)
      const knowledge = await getKnowledge()

      // Convert unclassified object to array of items
      const unclassified = knowledge.unclassified || {}
      const itemsArray: UnclassifiedItem[] = []

      if (typeof unclassified === 'object' && !Array.isArray(unclassified)) {
        Object.entries(unclassified).forEach(([key, value]) => {
          itemsArray.push({
            id: key,
            title: key,
            content: value,
            suggestedCategory: suggestCategory(key, value),
            reason: explainClassification(key, value),
          })
        })
      }

      setItems(itemsArray)
    } catch (error) {
      console.error('Error loading unclassified items:', error)
    } finally {
      setLoading(false)
    }
  }

  const suggestCategory = (key: string, _value: unknown): 'public' | 'conditional' | 'private' | 'preferences' => {
    const keyLower = key.toLowerCase()

    // PUBLIC: General technical knowledge - share with any Claude instance
    const publicKeys = [
      'architecture_principles', 'technical_discoveries', 'patterns',
      'projects', 'key_documents'
    ]
    if (publicKeys.includes(key)) {
      return 'public'
    }

    // PREFERENCES: How Fernando should behave
    const preferencesKeys = [
      'fernando_behavior', 'briefing_preferences', 'optimization_thresholds',
      'growth_triggers', 'work_patterns', 'working_style', 'time_constraints',
      'owner'
    ]
    if (preferencesKeys.includes(key)) {
      return 'preferences'
    }

    // PRIVATE: Personal/sensitive information
    const privateKeys = [
      'frustrations', 'goals', 'share_rule', 'personal_preferences'
    ]
    if (privateKeys.includes(key)) {
      return 'private'
    }

    // CONDITIONAL: Context-dependent sharing
    const conditionalKeys = [
      'technical_decisions', 'decisions_log', 'recent_decisions',
      'development_environment'
    ]
    if (conditionalKeys.includes(key)) {
      return 'conditional'
    }

    // Fallback: Generic keyword matching for new items
    if (keyLower.includes('behavior') || keyLower.includes('preference') ||
        keyLower.includes('threshold') || keyLower.includes('style')) {
      return 'preferences'
    }
    if (keyLower.includes('password') || keyLower.includes('secret') ||
        keyLower.includes('token') || keyLower.includes('credential')) {
      return 'private'
    }
    if (keyLower.includes('architecture') || keyLower.includes('principle') ||
        keyLower.includes('pattern') || keyLower.includes('discovery')) {
      return 'public'
    }

    // Default to conditional for safety - requires human review
    return 'conditional'
  }

  const explainClassification = (key: string, value: unknown): string => {
    const suggested = suggestCategory(key, value)

    // Exact matches - high confidence
    const publicKeys = ['architecture_principles', 'technical_discoveries', 'patterns', 'projects', 'key_documents']
    const preferencesKeys = ['fernando_behavior', 'briefing_preferences', 'optimization_thresholds', 'growth_triggers', 'work_patterns', 'working_style', 'time_constraints', 'owner']
    const privateKeys = ['frustrations', 'goals', 'share_rule', 'personal_preferences']
    const conditionalKeys = ['technical_decisions', 'decisions_log', 'recent_decisions', 'development_environment']

    if (publicKeys.includes(key)) {
      return '✓ High confidence: General technical knowledge - valuable for all agents'
    }
    if (preferencesKeys.includes(key)) {
      return '✓ High confidence: Defines how Fernando should behave and operate'
    }
    if (privateKeys.includes(key)) {
      return '✓ High confidence: Personal/sensitive information - should not be shared'
    }
    if (conditionalKeys.includes(key)) {
      return '✓ High confidence: Context-dependent - share only when relevant to task'
    }

    // Fallback keyword matching - lower confidence
    if (suggested === 'preferences') {
      return '⚠️ Keyword match: Appears to be a behavioral preference or configuration'
    }
    if (suggested === 'private') {
      return '⚠️ Keyword match: Contains sensitive keywords - please verify'
    }
    if (suggested === 'public') {
      return '⚠️ Keyword match: Appears to be technical knowledge or documentation'
    }

    return '⚠️ UNCERTAIN: No clear classification - defaulting to conditional for safety. Please review carefully.'
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

  const handleAddNote = (itemId: string, message: string) => {
    // For now, just update local state
    // In production, this would call an API endpoint
    setItems(items.map(item => {
      if (item.id === itemId) {
        const newNote = {
          id: Date.now().toString(),
          message,
          timestamp: new Date().toISOString()
        }
        return {
          ...item,
          feedback: {
            ...item.feedback,
            notes: [...(item.feedback?.notes || []), newNote]
          }
        }
      }
      return item
    }))
    setNoteInputs(prev => ({ ...prev, [itemId]: '' }))
  }

  const handleClassify = async (item: UnclassifiedItem, toCategory: string, notes?: string) => {
    try {
      setProcessing(item.id)
      await reclassifyKnowledge(item.id, 'unclassified', toCategory, notes)
      setItems(items.filter(i => i.id !== item.id))
    } catch (error) {
      console.error('Error reclassifying:', error)
      alert('Failed to reclassify item')
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = (item: UnclassifiedItem) => {
    const reason = prompt('Why is this classification incorrect? This helps Fernando learn.')
    if (reason) {
      handleAddNote(item.id, `Rejected suggestion (${item.suggestedCategory}): ${reason}`)
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'public': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'conditional': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'private': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'preferences': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin">
            <p className="text-4xl">⏳</p>
          </div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading unclassified items...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 py-6 md:py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Classify Knowledge
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Review and classify {items.length} unclassified item{items.length !== 1 ? 's' : ''}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-8 text-center">
          <p className="text-2xl mb-2">✅</p>
          <p className="text-green-800 dark:text-green-200 font-semibold mb-1">All caught up!</p>
          <p className="text-green-700 dark:text-green-300 text-sm">
            No unclassified items need your attention.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const isExpanded = expandedItems.has(item.id)

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {item.title}
                      </h3>
                      <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 max-h-40 overflow-y-auto">
                        <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {JSON.stringify(item.content, null, 2)}
                        </pre>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleExpanded(item.id)}
                      className="ml-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    >
                      {isExpanded ? '▼' : '▶'}
                    </button>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Fernando suggests:
                      </span>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${getCategoryColor(item.suggestedCategory)}`}>
                        {item.suggestedCategory}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                      {item.reason}
                    </p>
                  </div>
                </div>

                {/* Actions - Always Visible */}
                <div className="p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row gap-2 mb-4">
                    <button
                      onClick={() => handleClassify(item, item.suggestedCategory)}
                      disabled={processing === item.id}
                      className="px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors min-h-[44px] flex items-center justify-center flex-1"
                    >
                      {processing === item.id ? '⏳ Processing...' : '✓ Approve'}
                    </button>
                    <button
                      onClick={() => handleReject(item)}
                      disabled={processing === item.id}
                      className="px-4 py-2.5 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors min-h-[44px] flex items-center justify-center flex-1"
                    >
                      ℹ️ Need Different Category
                    </button>
                  </div>

                  {/* Expanded Section - Show alternatives and conversation */}
                  {isExpanded && (
                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                      {/* Conversation Thread */}
                      {item.feedback?.notes && item.feedback.notes.length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                            Conversation:
                          </h4>
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
                          Add a note for Fernando:
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={noteInputs[item.id] || ''}
                            onChange={(e) =>
                              setNoteInputs((prev) => ({ ...prev, [item.id]: e.target.value }))
                            }
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && noteInputs[item.id]?.trim()) {
                                handleAddNote(item.id, noteInputs[item.id])
                              }
                            }}
                            placeholder="e.g., This should be private because..."
                            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                          <button
                            onClick={() => {
                              if (noteInputs[item.id]?.trim()) {
                                handleAddNote(item.id, noteInputs[item.id])
                              }
                            }}
                            disabled={!noteInputs[item.id]?.trim()}
                            className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs sm:text-sm font-medium transition-colors min-h-[44px] flex items-center justify-center"
                          >
                            Add Note
                          </button>
                        </div>
                      </div>

                      {/* Alternative Classifications */}
                      <div>
                        <h4 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                          Or choose a different category:
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <button
                            onClick={() => handleClassify(item, 'public')}
                            disabled={processing === item.id}
                            className="px-3 py-2.5 bg-green-100 hover:bg-green-200 text-green-800 dark:bg-green-900 dark:hover:bg-green-800 dark:text-green-200 rounded-lg text-xs sm:text-sm font-medium transition-colors min-h-[44px] flex items-center justify-center"
                          >
                            📖 Public
                          </button>
                          <button
                            onClick={() => handleClassify(item, 'conditional')}
                            disabled={processing === item.id}
                            className="px-3 py-2.5 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:hover:bg-yellow-800 dark:text-yellow-200 rounded-lg text-xs sm:text-sm font-medium transition-colors min-h-[44px] flex items-center justify-center"
                          >
                            🔐 Conditional
                          </button>
                          <button
                            onClick={() => handleClassify(item, 'private')}
                            disabled={processing === item.id}
                            className="px-3 py-2.5 bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-900 dark:hover:bg-red-800 dark:text-red-200 rounded-lg text-xs sm:text-sm font-medium transition-colors min-h-[44px] flex items-center justify-center"
                          >
                            🛡️ Private
                          </button>
                          <button
                            onClick={() => handleClassify(item, 'preferences')}
                            disabled={processing === item.id}
                            className="px-3 py-2.5 bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-900 dark:hover:bg-blue-800 dark:text-blue-200 rounded-lg text-xs sm:text-sm font-medium transition-colors min-h-[44px] flex items-center justify-center"
                          >
                            ⚙️ Preferences
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
