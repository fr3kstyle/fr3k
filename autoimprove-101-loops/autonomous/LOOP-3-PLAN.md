# FR3K ALGORITHM - LOOP 3 PHASE 3: PLAN

## LOOP 3 Component Specifications

### Component 1: SSH Reverse Tunnel Manager
**File:** `distributed-agents/ssh-reverse-tunnel.ts`
**Lines:** ~350 lines

**Key Features:**
- Auto-establish SSH reverse tunnel (local → cloud)
- Tunnel: `ssh -R 18790:localhost:18789 cloud-gateway`
- Connection health monitoring with ping/pong
- Auto-reconnection with exponential backoff
- Port conflict detection and resolution
- Connection state tracking (connecting, connected, disconnected, error)

**API:**
```typescript
class SSHReverseTunnel {
  establish(config: TunnelConfig): Promise<boolean>
  close(): Promise<void>
  isConnected(): boolean
  getConnectionState(): ConnectionState
  onReconnect(callback: () => void): void
}
```

### Component 2: Node Pairing Protocol
**File:** `distributed-agents/node-pairing-protocol.ts`
**Lines:** ~300 lines

**Key Features:**
- Public/private keypair generation (Ed25519)
- Node ID system (UUID-based)
- Registration handshake (node → gateway)
- Authentication token exchange (JWT)
- Node discovery and listing
- Role-based access (gateway, node, viewer)

**API:**
```typescript
class NodePairingProtocol {
  generateNodeKeypair(): Promise<KeyPair>
  registerNode(config: NodeConfig): Promise<string>
  authenticateNode(token: string): Promise<boolean>
  discoverNodes(): Promise<NodeInfo[]>
  getNodeInfo(nodeId: string): Promise<NodeInfo | null>
}
```

### Component 3: Distributed Command Bus
**File:** `distributed-agents/distributed-command-bus.ts`
**Lines:** ~400 lines

**Key Features:**
- Command queue system (FIFO)
- Remote command execution over SSH
- Result streaming (real-time output)
- Timeout and cancellation
- Parallel execution across nodes
- Error handling and retry logic
- Command history and audit trail

**API:**
```typescript
class DistributedCommandBus {
  queueCommand(command: Command): Promise<string>
  executeOnNode(nodeId: string, command: string): Promise<CommandResult>
  executeOnAllNodes(command: string): Promise<Map<string, CommandResult>>
  cancelCommand(commandId: string): Promise<boolean>
  getCommandHistory(): Promise<CommandRecord[]>
  streamResults(commandId: string): AsyncIterable<string>
}
```

### Component 4: Node Health Monitor
**File:** `distributed-agents/node-health-monitor.ts`
**Lines:** ~250 lines

**Key Features:**
- Heartbeat system (ping every 30s)
- Status tracking (online, offline, limited, error)
- Resource monitoring (CPU, memory, disk, network)
- Alert system for node failures
- Auto-reconnection logic
- Health dashboard data

**API:**
```typescript
class NodeHealthMonitor {
  startMonitoring(nodeId: string): void
  stopMonitoring(nodeId: string): void
  getNodeHealth(nodeId: string): Promise<NodeHealth>
  getAllNodesHealth(): Promise<Map<string, NodeHealth>>
  onNodeDown(callback: (nodeId: string) => void): void
  onNodeRecovered(callback: (nodeId: string) => void): void
}
```

### Component 5: Gateway Service
**File:** `distributed-agents/gateway-service.ts`
**Lines:** ~200 lines

**Key Features:**
- Central node registry
- Connection management (accept/drop nodes)
- Command routing to nodes
- Status aggregation
- Web dashboard (optional)
- REST API for external control

**API:**
```typescript
class GatewayService {
  start(): Promise<void>
  stop(): Promise<void>
  acceptNode(nodeId: string): Promise<boolean>
  removeNode(nodeId: string): Promise<boolean>
  routeCommand(nodeId: string, command: string): Promise<CommandResult>
  broadcastCommand(command: string): Promise<Map<string, CommandResult>>
  getRegisteredNodes(): Promise<NodeInfo[]>
  getSystemStatus(): Promise<SystemStatus>
}
```

## File Structure

```
/mnt/sdcard/claude-integrations/autonomous/distributed-agents/
├── ssh-reverse-tunnel.ts (350 lines) - SSH reverse tunnel manager
├── node-pairing-protocol.ts (300 lines) - Node authentication & pairing
├── distributed-command-bus.ts (400 lines) - Remote command execution
├── node-health-monitor.ts (250 lines) - Health monitoring system
├── gateway-service.ts (200 lines) - Central gateway service
└── README.md - Documentation and usage
```

**Total Code:** ~1,500 lines across 5 TypeScript files

## Integration Points

### Existing Systems → New Distributed Components
1. **Multi-Agent Orchestrator** → Execute on distributed nodes
   - Run pipeline/graph/debate across multiple machines
   - Assign agent roles to different nodes

2. **Autonomous GitHub Agent** → Run on multiple nodes
   - Parallel issue processing
   - Distributed repository scanning
   - Shared reputation learning

3. **Lane-Based Concurrency** → Cross-node lanes
   - Distribute task lanes across fleet
   - Global lane coordination

4. **Agent Memory Sharing** → Cross-node memory
   - Distributed memory access
   - Fleet-wide learning

5. **Model Fallback Chain** → Node-level fallback
   - Each node has different models
   - Fleet-wide model availability

### New Components → External Systems
1. **Gateway Service** → Cloud deployment
   - Deploy to AWS/VPS (public IP)
   - Accept SSH reverse tunnels

2. **SSH Tunnel Manager** → Local nodes
   - Run on home servers, laptops, edge devices
   - Auto-connect to gateway

3. **Command Bus** → REST API
   - External control interface
   - Telegram integration point

## Implementation Order

### Step 1: SSH Reverse Tunnel Manager
- Core infrastructure
- Prerequisite for all other components
- Independent testing possible

### Step 2: Node Pairing Protocol
- Security layer
- Required for command bus
- Can test with manual tunnel

### Step 3: Distributed Command Bus
- Core functionality
- Depends on tunnel + pairing
- Enables remote control

### Step 4: Node Health Monitor
- Operational visibility
- Can run in parallel with command bus
- Improves reliability

### Step 5: Gateway Service
- Integration layer
- Ties everything together
- Final system assembly

## Testing Strategy

### Unit Testing (Per Component)
- SSH Tunnel: Mock cloud server, test connection
- Node Pairing: Mock registration, test auth flow
- Command Bus: Mock SSH, test execution
- Health Monitor: Mock heartbeats, test alerts
- Gateway: Mock nodes, test routing

### Integration Testing (End-to-End)
1. Start gateway on cloud
2. Register first node
3. Establish SSH tunnel
4. Execute test command
5. Verify result
6. Add second node
7. Test multi-node commands
8. Simulate node failure
9. Verify reconnection

### Load Testing
- 10+ nodes simultaneously
- 100+ commands in queue
- Continuous 24-hour operation

## Success Criteria

### Functional Requirements
✅ SSH reverse tunnel auto-establishes
✅ Node can register with gateway
✅ Commands execute on remote nodes
✅ Results stream back correctly
✅ Health monitoring detects failures
✅ Auto-reconnection works
✅ Multi-node coordination works

### Non-Functional Requirements
✅ Connection establishes within 10 seconds
✅ Commands execute within 5 seconds
✅ Reconnection within 30 seconds of failure
✅ Support for 10+ nodes
✅ 99.9% uptime with reconnection
✅ Secure authentication (no plaintext)
✅ Audit trail for all commands

## Next Phase: BUILD

Start implementing components in order:
1. ssh-reverse-tunnel.ts
2. node-pairing-protocol.ts
3. distributed-command-bus.ts
4. node-health-monitor.ts
5. gateway-service.ts

Each component will be fully tested before moving to the next.
