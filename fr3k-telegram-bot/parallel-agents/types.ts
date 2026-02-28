// Core types for parallel agent system

export interface Task {
  id: string;
  type: string;
  content: string | object;
  complexity: number; // 1-10 scale
  priority: 'low' | 'normal' | 'high' | 'critical';
  deadline?: Date;
  metadata?: Record<string, any>;
  userId?: string;
  traceId?: string;
}

export interface Microtask {
  id: string;
  taskId: string;
  type: string;
  content: string | object;
  priority: 'low' | 'normal' | 'high' | 'critical';
  agentType: string;
  dependencies?: string[]; // IDs of other microtasks this depends on
  timeout?: number;
  metadata?: Record<string, any>;
}

export interface TaskResult {
  success: boolean;
  content?: string | object;
  error?: string;
  metadata?: Record<string, any>;
  agentId?: string;
  duration?: number;
  confidence?: number;
}

export interface AgentPool {
  id: string;
  type: string;
  agents: string[];
  minSize: number;
  maxSize: number;
  currentSize: number;
  maxConcurrency: number;
  agentType: string;
  specializations: string[];
  status: 'active' | 'scaling' | 'draining' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentPoolStats {
  id: string;
  type: string;
  activeAgents: number;
  queuedTasks: number;
  processedTasks: number;
  failedTasks: number;
  avgResponseTime: number;
  cpuUsage: number;
  memoryUsage: number;
  utilization: number;
  status: 'active' | 'scaling' | 'draining' | 'inactive';
}

export interface TaskMetrics {
  taskId: string;
  microtasks: {
    total: number;
    completed: number;
    failed: number;
    avgDuration: number;
  };
  agents: {
    totalUsed: number;
    avgUtilization: number;
    maxUtilization: number;
  };
  throughput: number;
  latency: number;
  successRate: number;
}

export interface DecompositionConfig {
  minMicrotasks: number;
  maxMicrotasks: number;
  agentTypes: string[];
  strategy: 'domain' | 'complexity' | 'manual' | 'hybrid';
  maxDepth: number;
  timeoutPerMicrotask: number;
}

export interface LoadBalancingConfig {
  strategy: 'round-robin' | 'weighted' | 'priority' | 'affinity' | 'least-loaded';
  weight: Record<string, number>;
  affinityRules: Record<string, string[]>;
  maxRetries: number;
  timeoutPerAssignment: number;
}