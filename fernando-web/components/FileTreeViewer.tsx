'use client'

import { FileTreeNode } from '@/lib/types'
import { useState } from 'react'

interface FileTreeViewerProps {
  tree?: FileTreeNode
  onFileSelect?: (path: string) => void
}

interface TreeNodeProps {
  node: FileTreeNode
  depth: number
  onFileSelect?: (path: string) => void
}

function TreeNode({ node, depth, onFileSelect }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(depth < 2)

  const handleClick = () => {
    if (node.type === 'directory') {
      setIsExpanded(!isExpanded)
    } else {
      onFileSelect?.(node.path)
    }
  }

  const formatSize = (bytes?: number) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  return (
    <div>
      <div
        onClick={handleClick}
        style={{ paddingLeft: `${depth * 16}px` }}
        className="flex items-center gap-2 py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer rounded"
      >
        {node.type === 'directory' && (
          <span className="text-gray-500 w-4">
            {isExpanded ? '▼' : '▶'}
          </span>
        )}
        {node.type === 'file' && <span className="w-4"></span>}
        <span className="text-lg">
          {node.type === 'directory' ? '📁' : '📄'}
        </span>
        <span className="text-sm text-gray-900 dark:text-white flex-1">
          {node.name}
        </span>
        {node.type === 'file' && node.size && (
          <span className="text-xs text-gray-500">{formatSize(node.size)}</span>
        )}
      </div>
      {node.type === 'directory' && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              onFileSelect={onFileSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function FileTreeViewer({
  tree,
  onFileSelect,
}: FileTreeViewerProps) {
  if (!tree) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-4">
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          <p className="text-2xl mb-2">📂</p>
          <p className="text-sm">No file tree available</p>
          <p className="text-xs mt-1">
            File tree will appear once the session starts
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
      <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b border-gray-300 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          File Tree
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {tree.path}
        </p>
      </div>
      <div className="p-2 overflow-y-auto max-h-[500px]">
        <TreeNode node={tree} depth={0} onFileSelect={onFileSelect} />
      </div>
    </div>
  )
}
