# Distributed Agents - OpenClaw-style SSH Remote Control

FR3K Algorithm LOOP 3 - Distributed Agent System with SSH Reverse Tunnels

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    CLOUD GATEWAY (AWS/VPS)                        │
│  Public IP: xx.xx.xx.xx:18789                                     │
│  ✓ GatewayService - Central registry & command routing            │
│  ✓ NodePairingProtocol - Secure authentication                   │
│  ✓ DistributedCommandBus - Command execution                     │
│  ✓ NodeHealthMonitor - Health tracking                           │
└──────────────────────────────────────────────────────────────────┘
                              ▲
                              │ SSH Reverse Tunnel
                              │ Port 18790 → 18789
                              │
┌─────────────────────────────┼────────────────────────────────────┐
│                             │                                    │
│  ┌──────────────────────────┴────────────────────────────────┐  │
│  │  LOCAL NODE 1 (Home Server)                                │  │
│  │  - SSHReverseTunnel establishes reverse tunnel             │  │
│  │  - Runs autonomous GitHub agent                           │  │
│  │  - Executes commands from gateway                         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  LOCAL NODE 2 (Laptop)                                     │  │
│  │  - Establishes reverse tunnel                             │  │
│  │  - Runs multi-agent orchestrator                          │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

## Components

### 1. SSH Reverse Tunnel Manager (`ssh-reverse-tunnel.ts`)
- Auto-establish SSH reverse tunnel (local → cloud)
- Command: `ssh -R 18790:localhost:18789 user@cloud-gateway`
- Connection health monitoring
- Auto-reconnection with exponential backoff

### 2. Node Pairing Protocol (`node-pairing-protocol.ts`)
- Public/private keypair generation (Ed25519)
- Node registration and authentication
- JWT token exchange
- Node discovery

### 3. Distributed Command Bus (`distributed-command-bus.ts`)
- Command queue system (FIFO)
- Remote execution over SSH
- Result streaming
- Parallel execution across nodes

### 4. Node Health Monitor (`node-health-monitor.ts`)
- Heartbeat system (30s interval)
- Status tracking (online/offline/limited/error)
- Resource monitoring (CPU, memory, disk, network)
- Alert system

### 5. Gateway Service (`gateway-service.ts`)
- Central node registry
- Command routing
- Status aggregation
- REST API (optional)

## Usage

### Gateway (Cloud)

```typescript
import { GatewayService } from './gateway-service.ts'

const gateway = new GatewayService({
  port: 18789,
  maxNodes: 100
})

await gateway.start()

// Accept node
const result = await gateway.acceptNode({
  nodeId: 'node-1',
  nodeType: 'node',
  publicKey: '...',
  hostname: 'home-server',
  capabilities: ['github-agent', 'multi-agent']
})

// Route command
const response = await gateway.routeCommand('node-1', 'uname -a')

// Broadcast command
const results = await gateway.broadcastCommand('uptime')

// Get system status
const status = await gateway.getSystemStatus()
```

### Node (Local)

```typescript
import { SSHReverseTunnel } from './ssh-reverse-tunnel.ts'
import { NodePairingProtocol } from './node-pairing-protocol.ts'

// Establish reverse tunnel
const tunnel = new SSHReverseTunnel({
  cloudHost: 'gateway.example.com',
  cloudUser: 'fr3k',
  cloudPort: 22,
  localPort: 18789,
  remotePort: 18790,
  sshKeyPath: '~/.ssh/id_ed25519'
})

await tunnel.establish()

// Register with gateway
const pairing = new NodePairingProtocol()
await pairing.initNode()

const keypair = await pairing.generateNodeKeypair()
// Send registration request to gateway with public key
```

## Testing

Run each component individually:

```bash
# Test SSH tunnel
bun run ssh-reverse-tunnel.ts

# Test node pairing
bun run node-pairing-protocol.ts

# Test command bus
bun run distributed-command-bus.ts

# Test health monitor
bun run node-health-monitor.ts

# Test gateway
bun run gateway-service.ts
```

## Metrics

Total Code: ~1,500 lines across 5 TypeScript files

| Component | Lines | Purpose |
|-----------|-------|---------|
| SSH Reverse Tunnel | 350 | NAT traversal |
| Node Pairing | 300 | Authentication |
| Command Bus | 400 | Remote execution |
| Health Monitor | 250 | Fleet health |
| Gateway Service | 200 | Central control |

## Integration

### Existing Systems → Distributed Agents
- Multi-Agent Orchestrator → Execute across distributed nodes
- Autonomous GitHub Agent → Parallel processing on fleet
- Agent Memory Sharing → Cross-node memory access
- Lane-Based Concurrency → Global lane coordination
- Model Fallback Chain → Node-level model availability

### Deployment Targets
- **Gateway**: AWS EC2, DigitalOcean, Oracle Cloud (free tier)
- **Nodes**: Home servers, laptops, edge devices, cloud VMs

## Security

- Ed25519 keypair authentication
- JWT tokens with 24-hour expiration
- SSH encryption for all communication
- Role-based access control (gateway, node, viewer)
- Audit trail for all commands

## Next Steps

1. Deploy gateway to cloud VPS
2. Setup reverse tunnel from local nodes
3. Register nodes with gateway
4. Test command routing
5. Deploy autonomous agents to fleet

## Credits

Based on OpenClaw (145K+ stars) architecture for distributed agent control via SSH reverse tunnels.
