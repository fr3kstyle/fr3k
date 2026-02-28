#!/usr/bin/env bun
/**
 * SendMessage - Direct inter-agent messaging
 *
 * Part of Agent Teams architecture from Claude Opus 4.6
 * Enables agents to send direct messages to teammates
 *
 * Usage:
 *   bun run SendMessage.ts --team <team-id> --from <agent> --to <agent> --message "..."
 *   bun run SendMessage.ts --team <team-id> --broadcast "Update for all"
 */

interface Message {
  id: string;
  team_id: string;
  from: string;
  to?: string;  // If undefined, it's a broadcast
  message: string;
  timestamp: number;
}

interface Team {
  id: string;
  name: string;
  agents: string[];
  messages: Message[];
}

const TEAMS_DB = "/tmp/pai-teams.json";

async function loadTeams(): Promise<Record<string, Team>> {
  try {
    const text = await Bun.file(TEAMS_DB).text();
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function saveTeams(teams: Record<string, Team>) {
  Bun.write(TEAMS_DB, JSON.stringify(teams, null, 2));
}

function generateMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function sendMessage(teamId: string, from: string, to: string | undefined, message: string): Promise<Message> {
  const teams = await loadTeams();

  if (!teams[teamId]) {
    console.error(`❌ Team not found: ${teamId}`);
    console.log(`   Available teams: ${Object.keys(teams).join(", ") || "none"}`);
    process.exit(1);
  }

  const team = teams[teamId];

  // Verify sender is on the team
  if (!team.agents.includes(from)) {
    console.error(`❌ Sender "${from}" is not on team "${team.name}"`);
    console.log(`   Team members: ${team.agents.join(", ")}`);
    process.exit(1);
  }

  // If specific recipient, verify they're on the team
  if (to && !team.agents.includes(to)) {
    console.error(`❌ Recipient "${to}" is not on team "${team.name}"`);
    console.log(`   Team members: ${team.agents.join(", ")}`);
    process.exit(1);
  }

  const msg: Message = {
    id: generateMessageId(),
    team_id: teamId,
    from,
    to,
    message,
    timestamp: Date.now()
  };

  // Initialize messages array if needed
  if (!team.messages) {
    team.messages = [];
  }

  team.messages.push(msg);
  await Bun.write(TEAMS_DB, JSON.stringify(teams, null, 2));

  return msg;
}

// CLI Interface
const args = process.argv.slice(2);

if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
  console.log(`
SendMessage - Direct inter-agent messaging

Usage:
  bun run SendMessage.ts --team <team-id> --from <agent> --to <agent> --message "..."
  bun run SendMessage.ts --team <team-id> --from <agent> --broadcast "..."

Options:
  --team <team-id>       Team ID (from TeamCreate)
  --from <agent-name>    Sender agent name
  --to <agent-name>      Recipient agent (optional for broadcast)
  --broadcast <message>  Send to all team members
  --message <text>       Message content

Examples:
  # Direct message
  bun run SendMessage.ts --team research-team-abc123 --from specialist --to analyst --message "Found important data"

  # Broadcast to team
  bun run SendMessage.ts --team research-team-abc123 --from synthesizer --broadcast "Ready for final review"

  # Query messages
  bun run SendMessage.ts --team research-team-abc123 --list

Output:
  Returns message ID and timestamp
`);
  process.exit(0);
}

// Parse arguments
let teamId = "";
let from = "";
let to: string | undefined = undefined;
let message = "";
let listMessages = false;

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case "--team":
      teamId = args[++i];
      break;
    case "--from":
      from = args[++i];
      break;
    case "--to":
      to = args[++i];
      break;
    case "--message":
      message = args[++i];
      break;
    case "--broadcast":
      message = args[++i];
      to = undefined; // Broadcast
      break;
    case "--list":
      listMessages = true;
      break;
  }
}

// List messages mode
if (listMessages) {
  const teams = loadTeams();
  const team = teams[teamId];

  if (!team) {
    console.error(`❌ Team not found: ${teamId}`);
    process.exit(1);
  }

  console.log(`📨 Messages for ${team.name} (${teamId})`);
  console.log("");

  if (!team.messages || team.messages.length === 0) {
    console.log("   No messages yet");
  } else {
    team.messages.forEach((msg, i) => {
      const recipient = msg.to ? `→ ${msg.to}` : "→ (broadcast)";
      const time = new Date(msg.timestamp).toLocaleTimeString();
      console.log(`   ${i + 1}. [${time}] ${msg.from} ${recipient}`);
      console.log(`      ${msg.message}`);
      console.log("");
    });
  }

  process.exit(0);
}

// Validate
if (!teamId || !from || !message) {
  console.error("❌ --team, --from, and --message/--broadcast are required");
  process.exit(1);
}

// Send message
sendMessage(teamId, from, to, message).then(msg => {
  const recipient = to ? `→ ${to}` : "→ (broadcast)";
  console.log(`✅ Message sent`);
  console.log(`   ID: ${msg.id}`);
  console.log(`   From: ${msg.from} ${recipient}`);
  console.log(`   At: ${new Date(msg.timestamp).toISOString()}`);
  console.log(`   Message: ${message}`);
}).catch(err => {
  console.error(`❌ Error sending message: ${err.message}`);
  process.exit(1);
});
