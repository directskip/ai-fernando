'use client'

import { useState, useCallback } from 'react'
import { KnowledgeResponse } from '@/lib/types'

interface SearchBarProps {
  onSearch: (results: KnowledgeResponse, query: string) => void
  knowledge: KnowledgeResponse
}

export default function SearchBar({ onSearch, knowledge }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [isListening, setIsListening] = useState(false)

  const handleSearch = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) {
        onSearch(knowledge, '')
        return
      }

      const query_lower = searchQuery.toLowerCase()

      const filtered: KnowledgeResponse = {}

      if (knowledge.public && Array.isArray(knowledge.public)) {
        filtered.public = knowledge.public.filter(
          (item) =>
            item.title.toLowerCase().includes(query_lower) ||
            item.content.toLowerCase().includes(query_lower)
        )
      }

      if (knowledge.conditional && Array.isArray(knowledge.conditional)) {
        filtered.conditional = knowledge.conditional.filter(
          (item) =>
            item.title.toLowerCase().includes(query_lower) ||
            item.content.toLowerCase().includes(query_lower)
        )
      }

      if (knowledge.private && Array.isArray(knowledge.private)) {
        filtered.private = knowledge.private.filter(
          (item) =>
            item.title.toLowerCase().includes(query_lower) ||
            item.content.toLowerCase().includes(query_lower)
        )
      }

      onSearch(filtered, searchQuery)
    },
    [knowledge, onSearch]
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    handleSearch(value)
  }

  const handleVoiceSearch = async () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Speech Recognition not supported in this browser')
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((result: any) => result[0].transcript)
        .join('')
      setQuery(transcript)
      handleSearch(transcript)
    }

    try {
      recognition.start()
    } catch (error) {
      console.error('Speech recognition error:', error)
      setIsListening(false)
    }
  }

  return (
    <div className="w-full mb-6">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search knowledge..."
          value={query}
          onChange={handleChange}
          className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleVoiceSearch}
          disabled={isListening}
          className="px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium transition-colors"
        >
          {isListening ? '🎤 Listening...' : '🎤'}
        </button>
      </div>
    </div>
  )
}
