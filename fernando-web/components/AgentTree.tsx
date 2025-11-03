'use client'

import { useCallback, useEffect, useState, useMemo, useRef } from 'react'
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  Panel,
  MarkerType,
  MiniMap,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow'
import 'reactflow/dist/style.css'
import dagre from 'dagre'
import AgentNode from './AgentNode'
import AgentDetails from './AgentDetails'
import type { AgentNode as AgentNodeType } from '@/types/agent'

interface AgentTreeProps {
  agents: AgentNodeType[]
  onPause?: (agentId: string) => void
  onKill?: (agentId: string) => void
  onRestart?: (agentId: string) => void
  onViewOutput?: (agentId: string) => void
}

const nodeWidth = 220
const nodeHeight = 120

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({ rankdir: 'TB', ranksep: 100, nodesep: 50 })

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight })
  })

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    }
  })

  return { nodes: layoutedNodes, edges }
}

function AgentTreeInner({
  agents,
  onPause,
  onKill,
  onRestart,
  onViewOutput,
}: AgentTreeProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedAgent, setSelectedAgent] = useState<AgentNodeType | null>(null)
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showMiniMap, setShowMiniMap] = useState(true)
  const [showStatsPanel, setShowStatsPanel] = useState(true)
  const [showControlsPanel, setShowControlsPanel] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const { fitView } = useReactFlow()
  const prevAgentsRef = useRef<AgentNodeType[]>([])
  const [highlightedNodes, setHighlightedNodes] = useState<string[]>([])

  const nodeTypes = useMemo(
    () => ({
      agentNode: AgentNode,
    }),
    []
  )

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const handleNodeSelect = useCallback((agent: AgentNodeType) => {
    setSelectedAgent(agent)
  }, [])

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) {
        setShowStatsPanel(false)
        setShowControlsPanel(false)
        setShowMiniMap(false)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Filter agents based on status and search query
  const filteredAgents = useMemo(() => {
    let filtered = agents

    // Apply status filter
    if (statusFilter.length > 0) {
      filtered = filtered.filter((agent) => statusFilter.includes(agent.status))
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (agent) =>
          agent.name.toLowerCase().includes(query) ||
          agent.task.toLowerCase().includes(query) ||
          agent.id.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [agents, statusFilter, searchQuery])

  // Detect new agents for animation
  useEffect(() => {
    const prevIds = prevAgentsRef.current.map((a) => a.id)
    const newAgents = agents.filter((a) => !prevIds.includes(a.id))

    if (newAgents.length > 0) {
      setHighlightedNodes(newAgents.map((a) => a.id))
      setTimeout(() => setHighlightedNodes([]), 2000)
    }

    prevAgentsRef.current = agents
  }, [agents])

  useEffect(() => {
    const reactFlowNodes: Node[] = filteredAgents.map((agent) => ({
      id: agent.id,
      type: 'agentNode',
      data: {
        ...agent,
        onSelect: handleNodeSelect,
        isHighlighted: highlightedNodes.includes(agent.id),
      },
      position: { x: 0, y: 0 },
    }))

    const reactFlowEdges: Edge[] = filteredAgents
      .filter((agent) => agent.parentId && filteredAgents.some((a) => a.id === agent.parentId))
      .map((agent) => ({
        id: `e-${agent.parentId}-${agent.id}`,
        source: agent.parentId!,
        target: agent.id,
        type: 'smoothstep',
        animated: agent.status === 'active',
        style: {
          stroke:
            agent.status === 'active'
              ? '#22c55e'
              : agent.status === 'error'
              ? '#ef4444'
              : '#94a3b8',
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color:
            agent.status === 'active'
              ? '#22c55e'
              : agent.status === 'error'
              ? '#ef4444'
              : '#94a3b8',
        },
      }))

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      reactFlowNodes,
      reactFlowEdges
    )

    setNodes(layoutedNodes)
    setEdges(layoutedEdges)
  }, [filteredAgents, setNodes, setEdges, handleNodeSelect, highlightedNodes])

  const activeAgents = agents.filter((a) => a.status === 'active').length
  const idleAgents = agents.filter((a) => a.status === 'idle').length
  const errorAgents = agents.filter((a) => a.status === 'error').length
  const completedAgents = agents.filter((a) => a.status === 'completed').length

  const toggleStatusFilter = (status: string) => {
    setStatusFilter((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    )
  }

  const handleFitView = () => {
    fitView({ padding: 0.2, duration: 800 })
  }

  return (
    <div className="relative w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <Controls />
        {showMiniMap && (
          <MiniMap
            nodeColor={(node) => {
              const status = node.data.status
              switch (status) {
                case 'active':
                  return '#22c55e'
                case 'idle':
                  return '#eab308'
                case 'error':
                  return '#ef4444'
                case 'completed':
                  return '#6b7280'
                default:
                  return '#9ca3af'
              }
            }}
            maskColor="rgb(240, 240, 240, 0.6)"
          />
        )}

        {/* Mobile Control Bar */}
        {isMobile && (
          <Panel position="top-center" className="bg-white p-2 rounded-lg shadow-lg border border-gray-200">
            <div className="flex gap-2">
              <button
                onClick={() => setShowStatsPanel(!showStatsPanel)}
                className="px-3 py-2 text-xs font-medium bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              >
                Stats
              </button>
              <button
                onClick={() => setShowControlsPanel(!showControlsPanel)}
                className="px-3 py-2 text-xs font-medium bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              >
                Controls
              </button>
              <button
                onClick={handleFitView}
                className="px-3 py-2 text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors"
              >
                Fit
              </button>
            </div>
          </Panel>
        )}

        {/* Stats Panel */}
        {showStatsPanel && (
          <Panel position="top-left" className={`bg-white p-4 rounded-lg shadow-lg border border-gray-200 ${isMobile ? 'w-full max-w-xs' : ''}`}>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Agent Overview</h3>
          <div className="space-y-2">
            <button
              onClick={() => toggleStatusFilter('active')}
              className={`w-full flex items-center gap-2 px-2 py-1 rounded transition-colors ${
                statusFilter.includes('active') ? 'bg-green-50' : 'hover:bg-gray-50'
              }`}
            >
              <span className="text-lg">🟢</span>
              <span className="text-sm text-gray-600">Active:</span>
              <span className="text-sm font-bold text-green-600">{activeAgents}</span>
            </button>
            <button
              onClick={() => toggleStatusFilter('idle')}
              className={`w-full flex items-center gap-2 px-2 py-1 rounded transition-colors ${
                statusFilter.includes('idle') ? 'bg-yellow-50' : 'hover:bg-gray-50'
              }`}
            >
              <span className="text-lg">🟡</span>
              <span className="text-sm text-gray-600">Idle:</span>
              <span className="text-sm font-bold text-yellow-600">{idleAgents}</span>
            </button>
            <button
              onClick={() => toggleStatusFilter('error')}
              className={`w-full flex items-center gap-2 px-2 py-1 rounded transition-colors ${
                statusFilter.includes('error') ? 'bg-red-50' : 'hover:bg-gray-50'
              }`}
            >
              <span className="text-lg">🔴</span>
              <span className="text-sm text-gray-600">Error:</span>
              <span className="text-sm font-bold text-red-600">{errorAgents}</span>
            </button>
            <button
              onClick={() => toggleStatusFilter('completed')}
              className={`w-full flex items-center gap-2 px-2 py-1 rounded transition-colors ${
                statusFilter.includes('completed') ? 'bg-gray-50' : 'hover:bg-gray-50'
              }`}
            >
              <span className="text-lg">⚫</span>
              <span className="text-sm text-gray-600">Completed:</span>
              <span className="text-sm font-bold text-gray-600">{completedAgents}</span>
            </button>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Total:</span>
                <span className="text-sm font-bold text-gray-900">{agents.length}</span>
              </div>
              {statusFilter.length > 0 && (
                <button
                  onClick={() => setStatusFilter([])}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </Panel>
        )}

        {/* Search and Controls Panel */}
        {!isMobile && (
          <Panel position="top-right" className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 space-y-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 px-3 py-2 pr-8 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleFitView}
                className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Fit View
              </button>
              <button
                onClick={() => setShowMiniMap(!showMiniMap)}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  showMiniMap
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Mini Map
              </button>
            </div>

            {filteredAgents.length < agents.length && (
              <div className="text-xs text-gray-600 pt-2 border-t border-gray-200">
                Showing {filteredAgents.length} of {agents.length} agents
              </div>
            )}
          </Panel>
        )}
      </ReactFlow>

      {selectedAgent && (
        <AgentDetails
          agent={selectedAgent}
          onClose={() => setSelectedAgent(null)}
          onPause={onPause}
          onKill={onKill}
          onRestart={onRestart}
          onViewOutput={onViewOutput}
        />
      )}
    </div>
  )
}

// Wrapper to provide ReactFlow context
export default function AgentTree(props: AgentTreeProps) {
  return (
    <ReactFlowProvider>
      <AgentTreeInner {...props} />
    </ReactFlowProvider>
  )
}
