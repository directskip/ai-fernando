'use client'

import { useState, useEffect } from 'react'
import {
  FERNANDO_RULES,
  getRulesByCategory,
  getCategoryLabel,
  getCategoryIcon,
  getCategoryDescription,
  type Rule,
  type RuleComment
} from '@/lib/rules'

export default function RulesPage() {
  const [selectedCategory, setSelectedCategory] = useState<Rule['category'] | 'all'>('all')
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null)
  const [comments, setComments] = useState<Record<string, RuleComment[]>>({})
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const categories: Rule['category'][] = ['architecture', 'classification', 'cost', 'growth', 'behavior']

  useEffect(() => {
    loadComments()
  }, [])

  const loadComments = async () => {
    try {
      const response = await fetch('/api/rules/comments')
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments || {})
      }
    } catch (error) {
      console.error('Error loading comments:', error)
    }
  }

  const handleAddComment = async () => {
    if (!selectedRule || !newComment.trim()) return

    setLoading(true)
    try {
      const response = await fetch('/api/rules/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ruleId: selectedRule.id,
          comment: newComment.trim()
        })
      })

      if (response.ok) {
        const data = await response.json()
        setComments(prev => ({
          ...prev,
          [selectedRule.id]: data.comments
        }))
        setNewComment('')
      } else {
        alert('Failed to add comment')
      }
    } catch (error) {
      console.error('Error adding comment:', error)
      alert('Error adding comment')
    } finally {
      setLoading(false)
    }
  }

  const filteredRules = FERNANDO_RULES.filter(rule => {
    const matchesCategory = selectedCategory === 'all' || rule.category === selectedCategory
    const matchesSearch = searchQuery === '' ||
      rule.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.reasoning.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const getPriorityColor = (priority: Rule['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    }
  }

  return (
    <main className="container mx-auto px-4 py-6 md:py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Fernando Rules & Guardrails
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          View and provide feedback on the rules Fernando follows
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search rules..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Category Filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedCategory === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
          }`}
        >
          All Rules ({FERNANDO_RULES.length})
        </button>
        {categories.map(category => {
          const count = getRulesByCategory(category).length
          return (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              <span>{getCategoryIcon(category)}</span>
              <span>{getCategoryLabel(category)}</span>
              <span className="opacity-70">({count})</span>
            </button>
          )
        })}
      </div>

      {/* Category Description */}
      {selectedCategory !== 'all' && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-blue-900 dark:text-blue-200 text-sm">
            {getCategoryDescription(selectedCategory)}
          </p>
        </div>
      )}

      {/* Rules Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rules List */}
        <div className="space-y-4">
          {filteredRules.map(rule => {
            const ruleComments = comments[rule.id] || []
            return (
              <div
                key={rule.id}
                onClick={() => setSelectedRule(rule)}
                className={`bg-white dark:bg-gray-800 rounded-lg border-2 p-5 cursor-pointer transition-all hover:shadow-lg ${
                  selectedRule?.id === rule.id
                    ? 'border-blue-500 shadow-lg'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3 flex-1">
                    <span className="text-2xl">{getCategoryIcon(rule.category)}</span>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {rule.title}
                      </h3>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPriorityColor(rule.priority)}`}>
                          {rule.priority.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {rule.id}
                        </span>
                      </div>
                    </div>
                  </div>
                  {ruleComments.length > 0 && (
                    <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full font-medium">
                      {ruleComments.length} comment{ruleComments.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  {rule.description}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Last updated: {rule.lastUpdated}
                </p>
              </div>
            )
          })}
          {filteredRules.length === 0 && (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400">No rules found matching your search.</p>
            </div>
          )}
        </div>

        {/* Rule Details & Comments */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          {selectedRule ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="mb-6">
                <div className="flex items-start space-x-3 mb-4">
                  <span className="text-3xl">{getCategoryIcon(selectedRule.category)}</span>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {selectedRule.title}
                    </h2>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPriorityColor(selectedRule.priority)}`}>
                        {selectedRule.priority.toUpperCase()} PRIORITY
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {getCategoryLabel(selectedRule.category)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      {selectedRule.description}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Reasoning
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      {selectedRule.reasoning}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Rule ID: {selectedRule.id} • Last updated: {selectedRule.lastUpdated}
                    </p>
                  </div>
                </div>
              </div>

              {/* Comments Section */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Comments & Feedback
                </h3>

                {/* Existing Comments */}
                <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                  {(comments[selectedRule.id] || []).map(comment => (
                    <div key={comment.id} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {comment.userName}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(comment.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {comment.comment}
                      </p>
                    </div>
                  ))}
                  {(!comments[selectedRule.id] || comments[selectedRule.id].length === 0) && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      No comments yet. Be the first to provide feedback!
                    </p>
                  )}
                </div>

                {/* Add Comment */}
                <div className="space-y-3">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your thoughts, suggestions, or questions about this rule..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={loading || !newComment.trim()}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {loading ? 'Adding Comment...' : 'Add Comment'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                Select a rule to view details and add comments
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
