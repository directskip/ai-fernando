export type AgentStatus = 'active' | 'idle' | 'error' | 'completed'

export interface AgentNode {
  id: string
  name: string
  status: AgentStatus
  task: string
  startTime: Date
  endTime?: Date
  parentId?: string
  output?: string
  error?: string
  resourceUsage?: {
    cpu?: number
    memory?: number
    tokens?: number
  }
}

export interface AgentTreeData {
  rootAgent: AgentNode
  agents: AgentNode[]
}

export interface AgentActivity {
  agentId: string
  timestamp: Date
  action: 'spawn' | 'status_change' | 'output' | 'complete' | 'error'
  data: {
    status?: AgentStatus
    output?: string
    error?: string
    parentId?: string
    metadata?: Record<string, unknown>
  }
}
