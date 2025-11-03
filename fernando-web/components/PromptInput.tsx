'use client'

import { useState, useRef, useEffect } from 'react'

interface PromptInputProps {
  onSendPrompt: (prompt: string) => void
  isDisabled?: boolean
  placeholder?: string
}

export default function PromptInput({
  onSendPrompt,
  isDisabled = false,
  placeholder = 'Enter your prompt...',
}: PromptInputProps) {
  const [prompt, setPrompt] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [prompt])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim() || isDisabled) return

    onSendPrompt(prompt)
    setHistory((prev) => [...prev, prompt])
    setPrompt('')
    setHistoryIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    } else if (e.key === 'ArrowUp' && history.length > 0) {
      e.preventDefault()
      const newIndex =
        historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1)
      setHistoryIndex(newIndex)
      setPrompt(history[newIndex])
    } else if (e.key === 'ArrowDown' && historyIndex !== -1) {
      e.preventDefault()
      const newIndex = historyIndex + 1
      if (newIndex >= history.length) {
        setHistoryIndex(-1)
        setPrompt('')
      } else {
        setHistoryIndex(newIndex)
        setPrompt(history[newIndex])
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isDisabled}
          rows={1}
          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed resize-none min-h-[48px] max-h-[200px] text-gray-900 dark:text-white"
        />
        <div className="absolute right-2 bottom-2 text-xs text-gray-400">
          {history.length > 0 && (
            <span className="mr-2">History: {history.length}</span>
          )}
          <span>Shift+Enter for new line</span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Use up/down arrows to navigate history
        </div>
        <button
          type="submit"
          disabled={!prompt.trim() || isDisabled}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          Send
        </button>
      </div>
    </form>
  )
}
