/**
 * Real-Time Coordinator
 * WebSocket-based multi-agent coordination with conflict resolution
 */

import { WebSocket, WebSocketServer } from 'ws';

interface AgentState {
  id: string;
  status: 'active' | 'idle' | 'conflict';
  currentTask?: string;
  lastHeartbeat: number;
  capabilities: string[];
}

interface ConflictResolution {
  strategy: 'priority' | 'consensus' | 'arbitration';
  resolve(agents: AgentState[], task: string): string;
}

export class RealTimeCoordinator {
  private agents = new Map<string, AgentState>();
  private wss?: WebSocketServer;
  private conflictStrategies: Map<string, ConflictResolution>;

  constructor(port: number = 8080) {
    this.wss = new WebSocketServer({ port });
    this.conflictStrategies = new Map();
    this.initializeConflictResolution();
    this.setupWebSocketServer();
  }

  private initializeConflictResolution(): void {
    this.conflictStrategies.set('priority', {
      strategy: 'priority',
      resolve: (agents, task) => {
        return agents
          .filter(a => a.status === 'active')
          .sort((a, b) => a.id.localeCompare(b.id))[0]?.id || '';
      }
    });

    this.conflictStrategies.set('consensus', {
      strategy: 'consensus',
      resolve: (agents, task) => {
        const active = agents.filter(a => a.status === 'active');
        return active[Math.floor(Math.random() * active.length)]?.id || '';
      }
    });
  }

  private setupWebSocketServer(): void {
    this.wss?.on('connection', (ws: WebSocket) => {
      ws.on('message', (data: string) => {
        const message = JSON.parse(data.toString());
        this.handleAgentMessage(ws, message);
      });

      ws.on('close', () => {
        this.handleAgentDisconnection(ws);
      });
    });
  }

  private handleAgentMessage(ws: WebSocket, message: any): void {
    switch (message.type) {
      case 'register':
        this.registerAgent(message.agentId, message.capabilities, ws);
        break;
      case 'heartbeat':
        this.updateHeartbeat(message.agentId);
        break;
      case 'task_claim':
        this.handleTaskClaim(message.agentId, message.taskId);
        break;
      case 'conflict':
        this.resolveConflict(message.taskId, message.agents, message.strategy);
        break;
    }
  }

  registerAgent(agentId: string, capabilities: string[], ws: WebSocket): void {
    this.agents.set(agentId, {
      id: agentId,
      status: 'idle',
      lastHeartbeat: Date.now(),
      capabilities
    });

    ws.send(JSON.stringify({
      type: 'registered',
      agentId,
      timestamp: Date.now()
    }));

    this.broadcastAgentState();
  }

  private updateHeartbeat(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.lastHeartbeat = Date.now();
    }
  }

  private handleTaskClaim(agentId: string, taskId: string): void {
    const agent = this.agents.get(agentId);
    const conflictingAgents = Array.from(this.agents.values())
      .filter(a => a.currentTask === taskId && a.id !== agentId);

    if (conflictingAgents.length > 0) {
      this.initiateConflictResolution(taskId, [agentId, ...conflictingAgents.map(a => a.id)]);
    } else if (agent) {
      agent.status = 'active';
      agent.currentTask = taskId;
      this.broadcastAgentState();
    }
  }

  private initiateConflictResolution(taskId: string, agentIds: string[]): void {
    const agents = agentIds.map(id => this.agents.get(id)).filter(Boolean) as AgentState[];
    const strategy = this.conflictStrategies.get('priority');
    const winner = strategy?.resolve(agents, taskId);

    this.broadcast({
      type: 'conflict_resolved',
      taskId,
      winner,
      timestamp: Date.now()
    });
  }

  private resolveConflict(taskId: string, agentIds: string[], strategy: string): void {
    const resolution = this.conflictStrategies.get(strategy);
    if (!resolution) return;

    const agents = agentIds.map(id => this.agents.get(id)).filter(Boolean) as AgentState[];
    const winner = resolution.resolve(agents, taskId);

    agents.forEach(agent => {
      if (agent.id === winner) {
        agent.status = 'active';
        agent.currentTask = taskId;
      } else {
        agent.status = 'idle';
        agent.currentTask = undefined;
      }
    });

    this.broadcast({
      type: 'conflict_resolved',
      taskId,
      winner,
      strategy: resolution.strategy,
      timestamp: Date.now()
    });
  }

  private handleAgentDisconnection(ws: WebSocket): void {
    for (const [agentId, agent] of this.agents) {
      if (agent.lastHeartbeat < Date.now() - 30000) {
        this.agents.delete(agentId);
        this.broadcastAgentState();
      }
    }
  }

  private broadcast(message: any): void {
    this.wss?.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  private broadcastAgentState(): void {
    this.broadcast({
      type: 'agent_state',
      agents: Array.from(this.agents.values()),
      timestamp: Date.now()
    });
  }

  getActiveAgents(): AgentState[] {
    return Array.from(this.agents.values()).filter(a => a.status === 'active');
  }

  assignTask(taskId: string, requiredCapabilities: string[]): string | null {
    const eligibleAgents = Array.from(this.agents.values())
      .filter(a =>
        a.status === 'idle' &&
        requiredCapabilities.every(cap => a.capabilities.includes(cap))
      );

    if (eligibleAgents.length === 0) return null;

    const selected = eligibleAgents[0];
    selected.status = 'active';
    selected.currentTask = taskId;

    this.broadcast({
      type: 'task_assigned',
      taskId,
      agentId: selected.id,
      timestamp: Date.now()
    });

    return selected.id;
  }

  shutdown(): void {
    this.wss?.close();
    this.agents.clear();
  }
}
