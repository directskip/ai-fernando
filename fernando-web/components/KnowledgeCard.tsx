'use client'

import { KnowledgeItem } from '@/lib/types'

interface KnowledgeCardProps {
  item: KnowledgeItem
  searchHighlight?: string
}

export default function KnowledgeCard({ item, searchHighlight }: KnowledgeCardProps) {
  const highlightText = (text: string) => {
    if (!searchHighlight) return text
    const regex = new RegExp(`(${searchHighlight})`, 'gi')
    const parts = text.split(regex)
    return (
      <span>
        {parts.map((part, i) => (
          <span
            key={i}
            className={regex.test(part) ? 'bg-yellow-200 dark:bg-yellow-700 font-semibold' : ''}
          >
            {part}
          </span>
        ))}
      </span>
    )
  }

  const categoryColors = {
    public: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
    conditional: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
    private: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
    preferences: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
    unclassified: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200',
    synced: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-semibold text-gray-900 dark:text-white flex-1">
          {highlightText(item.title)}
        </h3>
        <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${categoryColors[item.category]}`}>
          {item.category}
        </span>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
        {highlightText(item.content)}
      </p>
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
        <div className="flex gap-1 flex-wrap">
          {item.tags?.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300"
            >
              #{tag}
            </span>
          ))}
        </div>
        <time dateTime={item.updatedAt}>
          {new Date(item.updatedAt).toLocaleDateString()}
        </time>
      </div>
    </div>
  )
}
