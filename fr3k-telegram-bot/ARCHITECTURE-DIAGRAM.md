# PAI Telegram Bot - Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PAI TELEGRAM BOT SYSTEM                         │
│                          24/7 AUTONOMOUS MODE                          │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ MESSAGE FLOW                                                                 │
└──────────────────────────────────────────────────────────────────────────────┘

  User sends Telegram message
           │
           ▼
┌──────────────────────────────────────────────────────────────────┐
│  COMMUNICATION AGENT (Telegram Listener)                          │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ ✅ Instant acknowledgment (< 1 second)                      │  │
│  │ 📬 Queue message                                           │  │
│  │ 🔔 Voice notification (async)                              │  │
│  │ 🚩 Flag main bot                                           │  │
│  └────────────────────────────────────────────────────────────┘  │
│  Port: None (Telegram webhook)                                    │
│  Log: logs/communication-agent.log                                │
└──────────────────────────────────────────────────────────────────┘
           │
           │ Message Queue (JSON file)
           ▼
┌──────────────────────────────────────────────────────────────────┐
│  MAIN BOT (Message Processor)                                     │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 🔍 Monitor queue (500ms polling)                           │  │
│  │ 🤖 Call PAI (Claude Code)                                  │  │
│  │ 📤 Send response via Telegram                              │  │
│  │ 💾 Persist sessions                                        │  │
│  └────────────────────────────────────────────────────────────┘  │
│  Log: logs/main-bot.log                                            │
└──────────────────────────────────────────────────────────────────┘
           │
           │ During processing
           ▼
┌──────────────────────────────────────────────────────────────────┐
│  VOICE AGENT (Async Notification System)                          │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 🔊 Queue voice notifications                               │  │
│  │ 🎯 Priority-based processing                               │  │
│  │ 🔄 Automatic retry                                         │  │
│  │ 📡 HTTP API: localhost:8989                                │  │
│  └────────────────────────────────────────────────────────────┘  │
│  Port: 8989                                                        │
│  Log: logs/voice-agent.log                                          │
└──────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────────┐
│ KEY IMPROVEMENTS                                                            │
└──────────────────────────────────────────────────────────────────────────────┘

  ✅ ZERO BLOCKING
     • Instant acknowledgment - no waiting for PAI
     • Async voice - no waiting for TTS
     • Background processing - no UI freeze

  ✅ PRIORITY COMMUNICATION
     • Messages queued and processed in order
     • High-priority voice notifications
     • Flag-based signaling for immediate response

  ✅ FAULT ISOLATION
     • 3 independent processes
     • One crash doesn't kill the system
     • Separate logs for debugging

  ✅ 24/7 OPERATION
     • Background monitoring
     • Automatic queue processing
     • Persistent sessions


┌──────────────────────────────────────────────────────────────────────────────┐
│ VOICE NOTIFICATION PRIORITIES                                                │
└──────────────────────────────────────────────────────────────────────────────┘

  Priority 10 (CRITICAL): Errors, emergencies
  Priority  8 (HIGH):     User messages, completions
  Priority  5 (NORMAL):   Phase transitions, updates
  Priority  3 (LOW):      Status, background tasks
  Priority  1 (MINIMAL):  Debug, logs


┌──────────────────────────────────────────────────────────────────────────────┐
│ COMMANDS                                                                     │
└──────────────────────────────────────────────────────────────────────────────┘

  ./start-system.sh     - Start all 3 agents
  ./stop-system.sh      - Stop all agents gracefully
  tail -f logs/*.log    - Monitor all logs in real-time

  Telegram:
  /status               - View system status
  /clearqueue           - Clear message queue (emergency)


┌──────────────────────────────────────────────────────────────────────────────┐
│ INTER-PROCESS COMMUNICATION                                                  │
└──────────────────────────────────────────────────────────────────────────────┘

  Communication Agent → Main Bot
    • /tmp/pai-message-queue.json (message queue)
    • /tmp/pai-new-message.flag (signal file)

  Main Bot → Voice Agent
    • HTTP POST localhost:8989/notify

  Voice Agent → Voice Server
    • HTTP POST localhost:8888/notify


┌──────────────────────────────────────────────────────────────────────────────┐
│ STORAGE                                                                      │
└──────────────────────────────────────────────────────────────────────────────┘

  /tmp/pai-message-queue.json         - Message queue
  /tmp/pai-telegram-sessions.json     - PAI sessions
  /tmp/pai-voice-queue.json           - Voice notifications
  /tmp/pai-new-message.flag           - Signal file
  logs/                               - All agent logs


Built with ❤️ for fr3k by PAI

Priority: COMMUNICATION
Goal: Never wait, never block, always listening.
