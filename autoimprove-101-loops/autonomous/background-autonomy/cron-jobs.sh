#!/bin/bash
# Background Autonomy - Continuous Self-Improvement Cron Jobs
# This file sets up complete autonomous operation

# Ensure FR3K agent is always running and improving
# Setup: crontab -e (add these lines)

# Every 15 minutes - Health check and auto-restart
*/15 * * * * /home/fr3k/.claude/projects/-home-fr3k/autonomous-background/health-check.sh >> /var/log/fr3k/health.log 2>&1

# Every hour - GitHub autonomous cycle
0 * * * * cd /mnt/sdcard/claude-integrations/autonomous/github-agent && bun run autonomous-github-agent.ts >> /var/log/fr3k/github-agent.log 2>&1

# Every 2 hours - Revenue optimization
0 */2 * * * cd /mnt/sdcard/claude-integrations/autonomous/revenue-engine && bun run revenue-engine.ts >> /var/log/fr3k/revenue.log 2>&1

# Every 6 hours - Self-improvement cycle
0 */6 * * * cd /mnt/sdcard/claude-integrations/runtime && bun run proactive-agent-core.ts >> /var/log/fr3k/improvement.log 2>&1

# Daily at 3 AM - Full system backup
0 3 * * * /home/fr3k/.claude/projects/-home-fr3k/autonomous-background/backup.sh >> /var/log/fr3k/backup.log 2>&1

# Daily at 6 AM - Research 2026 GitHub trends
0 6 * * * cd /home/fr3k && claude "research 2026 github self-improving agents and integrate best capabilities" >> /var/log/fr3k/research.log 2>&1

# Weekly on Sunday at 10 PM - Comprehensive review
0 22 * * 0 /home/fr3k/.claude/projects/-home-fr3k/autonomous-background/weekly-review.sh >> /var/log/fr3k/review.log 2>&1

# Monthly on 1st at 2 AM - Long-term planning
0 2 1 * * /home/fr3k/.claude/projects/-home-fr3k/autonomous-background/monthly-planning.sh >> /var/log/fr3k/planning.log 2>&1
