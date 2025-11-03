'use client'

import { useEffect, useState } from 'react'
import { getKnowledge } from '@/lib/api'
import { KnowledgeResponse, KnowledgeItem } from '@/lib/types'
import SearchBar from '@/components/SearchBar'
import KnowledgeCard from '@/components/KnowledgeCard'

export default function SearchPage() {
  const [knowledge, setKnowledge] = useState<KnowledgeResponse | null>(null)
  const [filteredKnowledge, setFilteredKnowledge] = useState<KnowledgeResponse | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const data = await getKnowledge()
        setKnowledge(data)
        setFilteredKnowledge(data)
      } catch (err) {
        console.error('Error fetching knowledge:', err)
        setError('Failed to load knowledge. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleSearch = (results: KnowledgeResponse, query: string) => {
    setSearchQuery(query)
    let filtered = results

    if (selectedCategory) {
      filtered = {
        [selectedCategory]: results[selectedCategory as keyof KnowledgeResponse],
      }
    }

    setFilteredKnowledge(filtered)
  }

  const handleCategoryFilter = (category: string | null) => {
    setSelectedCategory(category)

    if (!category) {
      setFilteredKnowledge(knowledge)
      return
    }

    if (knowledge) {
      const filtered = {
        [category]: knowledge[category as keyof KnowledgeResponse],
      }
      setFilteredKnowledge(filtered as KnowledgeResponse)
    }
  }

  const getAllItems = (): KnowledgeItem[] => {
    const items: KnowledgeItem[] = []
    const pushIfArray = (data: unknown) => {
      if (Array.isArray(data)) items.push(...data)
    }
    pushIfArray(filteredKnowledge?.public)
    pushIfArray(filteredKnowledge?.conditional)
    pushIfArray(filteredKnowledge?.private)
    return items
  }

  const items = getAllItems()

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin">
            <p className="text-4xl">⏳</p>
          </div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading knowledge...</p>
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
    <main className="container mx-auto px-4 py-6 md:py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Search Knowledge
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Find and explore your knowledge base
        </p>
      </div>

      {/* Search Bar */}
      {knowledge && <SearchBar onSearch={handleSearch} knowledge={knowledge} />}

      {/* Category Filter */}
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Filter by category:
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleCategoryFilter(null)}
            className={`px-4 py-2 rounded-full font-medium transition-colors ${
              selectedCategory === null
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => handleCategoryFilter('public')}
            className={`px-4 py-2 rounded-full font-medium transition-colors ${
              selectedCategory === 'public'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
            }`}
          >
            Public ({Array.isArray(knowledge?.public) ? knowledge.public.length : Object.keys(knowledge?.public || {}).length})
          </button>
          <button
            onClick={() => handleCategoryFilter('conditional')}
            className={`px-4 py-2 rounded-full font-medium transition-colors ${
              selectedCategory === 'conditional'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
            }`}
          >
            Conditional ({Array.isArray(knowledge?.conditional) ? knowledge.conditional.length : Object.keys(knowledge?.conditional || {}).length})
          </button>
          <button
            onClick={() => handleCategoryFilter('private')}
            className={`px-4 py-2 rounded-full font-medium transition-colors ${
              selectedCategory === 'private'
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
            }`}
          >
            Private ({Array.isArray(knowledge?.private) ? knowledge.private.length : Object.keys(knowledge?.private || {}).length})
          </button>
        </div>
      </div>

      {/* Results */}
      <div>
        {items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-5xl mb-4">🔍</p>
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery
                ? 'No results found for your search'
                : 'No knowledge items available'}
            </p>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Found {items.length} result{items.length !== 1 ? 's' : ''}
              {searchQuery && ` for "${searchQuery}"`}
            </p>
            <div className="space-y-3">
              {items.map((item) => (
                <KnowledgeCard
                  key={item.id}
                  item={item}
                  searchHighlight={searchQuery}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
