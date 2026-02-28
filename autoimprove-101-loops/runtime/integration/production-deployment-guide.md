# FR3K Algorithm - Production Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the FR3K Algorithm v2.2 to production.

## Prerequisites

### System Requirements
- **OS**: Linux (Ubuntu 20.04+ recommended)
- **Memory**: 16GB RAM minimum
- **Storage**: 1GB available space
- **CPU**: 8+ cores recommended
- **Network**: Internet connection for package installation
- **Runtime**: Bun 1.0+ or Node.js 20+

### Software Dependencies
```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Or install Node.js
sudo apt-get install nodejs npm

# Install EdgeTTS for voice notifications
pip install edge-tts
```

## Installation Steps

### 1. Deploy Files

```bash
# Copy all files to target location
sudo mkdir -p /opt/fr3k-algorithm
sudo cp -r /mnt/sdcard/claude-integrations/runtime/* /opt/fr3k-algorithm/

# Set permissions
sudo chown -R fr3k:fr3k /opt/fr3k-algorithm
chmod +x /opt/fr3k-algorithm/**/*.ts
```

### 2. Configure Environment

```bash
# Create environment file
cat > /opt/fr3k-algorithm/.env << EOF
# FR3K Configuration
FR3K_VERSION=2.2
FR3K_ENV=production
FR3K_LOG_LEVEL=info

# Voice Server
VOICE_PORT=8888
VOICE_ENGINE=edgetts

# Memory
EPISODIC_MEMORY_PATH=/opt/fr3k-algorithm/memory/episodes
MAX_EPISODES=10000
EPISODE_TTL=7776000000

# Resources
CPU_CORES=8
MEMORY_GB=16
AGENT_SLOTS=100

# Monitoring
HEALTH_CHECK_INTERVAL=60000
WORKLOAD_PREDICTION_HORIZON=1h
EOF
```

### 3. Install Systemd Service

```bash
# Create systemd service file
sudo tee /etc/systemd/system/fr3k.service << EOF
[Unit]
Description=FR3K Algorithm v2.2
After=network.target

[Service]
Type=simple
User=fr3k
WorkingDirectory=/opt/fr3k-algorithm
EnvironmentFile=/opt/fr3k-algorithm/.env
ExecStart=/usr/bin/bun run /opt/fr3k-algorithm/router/runtime-integration.ts
Restart=always
RestartSec=10

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=fr3k

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/fr3k-algorithm

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable fr3k
sudo systemctl start fr3k
```

### 4. Verify Deployment

```bash
# Check service status
sudo systemctl status fr3k

# View logs
sudo journalctl -u fr3k -f

# Run integration tests
cd /opt/fr3k-algorithm/integration
bun run integration-test-suite.ts
```

## Configuration

### Capability Tuning

#### 1. Self-Discover Modules
Edit `capabilities/self-discover-modules.json` to enable/disable modules.

#### 2. Reflection Loop
Adjust iteration count in `capabilities/reflection-engine.md`:
```typescript
const REFLECTION_ITERATIONS = 3; // Increase for more refinement
```

#### 3. Hierarchical Decomposition
Configure specialist count:
```typescript
const SPECIALIST_COUNT = 5; // Number of parallel workers
```

#### 4. Swarm Intelligence
Set agent limits:
```typescript
const MAX_AGENTS = 100;
const NEIGHBOR_COUNT = 3; // Local mesh connections
```

#### 5. Resource Management
Adjust scaling thresholds:
```typescript
const SCALE_UP_THRESHOLD = 80; // Percent
const SCALE_DOWN_THRESHOLD = 30; // Percent
```

## Monitoring

### Health Checks

```bash
# Check system health
curl http://localhost:8888/health

# Get metrics
curl http://localhost:8888/metrics

# View resource utilization
curl http://localhost:8888/resources
```

### Log Analysis

```bash
# View recent logs
sudo journalctl -u fr3k -n 100

# Search for errors
sudo journalctl -u fr3k | grep -i error

# View performance metrics
sudo journalctl -u fr3k | grep -i "improvement\|speedup\|reduction"
```

### Performance Monitoring

Key metrics to monitor:
- Reasoning quality: Target >90%
- Error rate: Target <5%
- Response time: Target <500ms
- Resource utilization: Target 60-80%
- Agent health: All agents operational

## Scaling

### Vertical Scaling
Increase resources in `.env`:
```
CPU_CORES=16
MEMORY_GB=32
AGENT_SLOTS=200
```

### Horizontal Scaling
Deploy multiple instances:
```bash
# Scale to 3 instances
sudo systemctl clone fr3k fr3k@1
sudo systemctl clone fr3k fr3k@2
sudo systemctl start fr3k@1 fr3k@2
```

## Maintenance

### Updates

```bash
# Stop service
sudo systemctl stop fr3k

# Backup current version
sudo cp -r /opt/fr3k-algorithm /opt/fr3k-algorithm.backup

# Deploy new version
sudo cp -r /path/to/new/version/* /opt/fr3k-algorithm/

# Restart service
sudo systemctl start fr3k
```

### Memory Cleanup

```bash
# Prune old episodic memories
cd /opt/fr3k-algorithm/memory
bun run -e "import { VectorEpisodicMemory } from './vector-episodic-memory.ts'; const mem = new VectorEpisodicMemory(); mem.pruneOldEpisodes();"
```

### Performance Tuning

1. Monitor resource usage
2. Identify bottlenecks
3. Adjust thresholds in `resources/resource-orchestrator.ts`
4. Optimize based on workload patterns

## Troubleshooting

### Common Issues

#### 1. High Memory Usage
**Solution**: Reduce MAX_EPISODES or enable TTL pruning

#### 2. Slow Response Times
**Solution**: Increase CPU_CORES or reduce SPECIALIST_COUNT

#### 3. Voice Notifications Not Working
**Solution**: Check EdgeTTS installation and VOICE_PORT

#### 4. Agent Failures
**Solution**: Check logs, increase AGENT_SLOTS, reduce MAX_AGENTS

### Debug Mode

Enable debug logging:
```bash
# Edit .env
FR3K_LOG_LEVEL=debug

# Restart service
sudo systemctl restart fr3k

# View detailed logs
sudo journalctl -u fr3k -f | grep debug
```

## Security Considerations

1. **Network**: Restrict VOICE_PORT to localhost
2. **File Permissions**: Ensure proper ownership (fr3k:fr3k)
3. **Resources**: Set reasonable limits to prevent DoS
4. **Updates**: Regularly update dependencies
5. **Monitoring**: Monitor for anomalous behavior

## Backup and Recovery

### Backup Strategy

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d)
BACKUP_DIR="/backup/fr3k/$DATE"

mkdir -p $BACKUP_DIR
cp -r /opt/fr3k-algorithm/* $BACKUP_DIR/
tar czf $BACKUP_DIR.tar.gz $BACKUP_DIR/
rm -rf $BACKUP_DIR/

# Keep last 7 days
find /backup/fr3k -mtime +7 -delete
```

### Recovery

```bash
# Stop service
sudo systemctl stop fr3k

# Restore from backup
sudo rm -rf /opt/fr3k-algorithm/*
sudo tar xzf /backup/fr3k/YYYYMMDD.tar.gz -C /opt/fr3k-algorithm/

# Restart service
sudo systemctl start fr3k
```

## Performance Benchmarks

Expected performance (based on validation):

| Metric | Target | Expected |
|--------|--------|----------|
| Reasoning quality | 90%+ | 92.9% |
| Error rate | <5% | 4.4% |
| Task speedup | 3x | 3.2x |
| Memory retrieval | <100ms | ~80ms |
| Agent coordination | <200ms | ~150ms |

## Support and Documentation

- **Architecture**: See `final-system-architecture.md`
- **Metrics**: See `FINAL-METRICS.md`
- **Integration**: See `integration-test-suite.ts`
- **Research**: 30+ papers synthesized

## Version History

- **v2.2** (2026-02-28): 22 loops complete, 14 capabilities
- **v2.1** (2025-02-XX): Loop 19, initial production readiness
- **v2.0** (2025-02-XX): Loop 9, runtime integration
- **v1.0** (2024-XX-XX): Initial release

---

**Deployment Status**: Production Ready ✅
**Last Updated**: 2026-02-28
**Version**: 2.2
