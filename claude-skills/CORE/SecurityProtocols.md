# FR3K Security Protocols

**Last Updated:** 2026-02-10
**Version:** 1.0

---

## Core Security Principles

1. **Zero Trust Architecture** - Verify everything, trust nothing
2. **Least Privilege** - Minimum required access for all operations
3. **Defense in Depth** - Multiple security layers
4. **Audit Everything** - Log all sensitive operations

---

## Credential Management

### API Keys & Tokens

**Rules:**
- ✅ Store in `.env` files or environment variables
- ✅ Never commit to git repositories
- ✅ Use different keys for development/production
- ✅ Rotate keys regularly (90 days recommended)

**Protected Files:**
```
.env
.env.* (except .env.example)
.env.aws
.env.google
infrastructure-info.txt
```

**Git Security:**
```bash
# Prevent committing secrets
git update-index --assume-unchanged .env
git update-index --assume-unchanged .env.aws
git update-index --assume-unchanged .env.google
```

### Telegram Bot Security

**Configuration:**
- Bot token: `TELEGRAM_BOT_TOKEN` (environment variable)
- User whitelist: `8188688460` (only this user can command FR3K)
- Session file: `/tmp/pai-telegram-sessions.json` (auto-cleanup)

**Security Measures:**
- All commands validated against whitelist
- No arbitrary code execution from Telegram
- Rate limiting on message processing
- Auto-reject unknown users

---

## System Security

### Service Management

**Security Checklist:**
- [ ] All systemd services run as user (not root)
- [ ] No hardcoded secrets in service files
- [ ] Proper file permissions (600 for sensitive files)
- [ ] Log files rotated and archived

**Commands:**
```bash
# Check service security
systemctl --user show pai-telegram-bot.service | grep -E "User|Group"
```

### Network Security

**Exposed Services:**
- Voice Server: `localhost:8888` (local only, no external exposure)
- FR3K Gateway: `localhost:3000` (local only)
- memU Bridge: `localhost:8899` (local only)

**Firewall Rules:**
```bash
# Ensure no external exposure
sudo ufw deny 8888
sudo ufw deny 3000
sudo ufw deny 8899
```

---

## Input Validation

### User Inputs

**Validation Rules:**
1. **Bash Commands:** Sanitize all user input before execution
2. **File Paths:** Validate paths, prevent directory traversal
3. **Code Execution:** Never `eval()` user input
4. **API Calls:** Validate all parameters

**Example:**
```typescript
// GOOD: Validate and sanitize
const safePath = path.normalize(userPath).startsWith(process.env.HOME);

// BAD: Direct use
eval(userCommand); // NEVER DO THIS
```

### Injection Prevention

**Vulnerabilities to Prevent:**
- ❌ Command Injection (via Bash tool)
- ❌ SQL Injection (if using databases)
- ❌ XSS (if rendering HTML)
- ❌ Path Traversal (file operations)

---

## Data Protection

### Sensitive Data Handling

**Classification:**
- **HIGH:** API keys, credentials, personal data
- **MEDIUM:** System configs, service definitions
- **LOW:** Public documentation, logs

**Storage Rules:**
- HIGH: Encrypt or environment variables only
- MEDIUM: File permissions 600
- LOW: Normal permissions acceptable

### Logging Security

**What to Log:**
- ✅ Security events (auth failures, access denied)
- ✅ Service starts/stops
- ✅ Errors and exceptions
- ✅ User actions

**What NOT to Log:**
- ❌ API keys or tokens
- ❌ Passwords
- ❌ Sensitive user data
- ❌ Full request bodies (sanitized only)

---

## Memory & State Security

### memU Integration

**Security Measures:**
- Hash-based embeddings (no external API dependency)
- Local storage only
- User-isolated memory (no cross-user leakage)
- Rate limiting with exponential backoff

**Best Practices:**
- Sanitize content before memorization
- No credentials in memory
- Regular cleanup of old data

### Nanobot Security

**Task Execution:**
- Validate all cron expressions
- No arbitrary command execution
- Workspace sandbox (~/.pai-workspace/)
- Audit all scheduled tasks

---

## Testing & Validation

### Security Testing

**Required Tests:**
1. Credential exposure scan
2. Input validation testing
3. Service isolation verification
4. Rate limiting effectiveness
5. Authorization checks

**Tools:**
```bash
# Scan for exposed credentials
grep -r "sk-ant\|API_KEY\|SECRET" ~/.claude/

# Check file permissions
find ~/.claude -type f -perm -o+r -name "*.env"
```

---

## Incident Response

### Security Incidents

**If Compromise Suspected:**
1. **Immediately** rotate all exposed credentials
2. Stop all FR3K services
3. Review logs for evidence
4. Report to user with findings
5. Implement preventive measures

**Recovery Steps:**
```bash
# Stop all services
systemctl --user stop pai-*

# Rotate credentials
# Update .env files

# Restart services
systemctl --user start pai-telegram-bot.service
```

---

## Compliance & Best Practices

### OWASP Top 10

FR3K system addresses:
1. **A01:2021** - Broken Access Control → User whitelist enforcement
2. **A02:2021** - Cryptographic Failures → No hardcoded credentials
3. **A03:2021** - Injection → Input validation on all paths
4. **A04:2021** - Insecure Design → Security-first architecture
5. **A05:2021** - Security Misconfiguration → Regular audits

### Security Checklist

**Daily:**
- [ ] Review error logs for anomalies
- [ ] Check service status

**Weekly:**
- [ ] Audit credential exposure
- [ ] Review service logs
- [ ] Update dependencies

**Monthly:**
- [ ] Rotate API keys
- [ ] Security audit
- [ ] Penetration testing (authorized scope)

---

## Contact & Reporting

**Security Issues:**
- Report immediately to user (fr3k)
- Document in `~/.claude/MEMORY/SECURITY/`
- Create improvement tasks
- Track until resolved

---

**Remember:** Security is continuous improvement, not one-time setup. Stay vigilant.
