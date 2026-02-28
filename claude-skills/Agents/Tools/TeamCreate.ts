#!/usr/bin/env bun
/**
 * TeamCreate - Create coordinated agent teams
 *
 * Part of Agent Teams architecture from Claude Opus 4.6
 * Enables multiple Claude Code sessions to coordinate as a team with shared task list
 *
 * Usage:
 *   bun run TeamCreate.ts --team "research-team" --agents "specialist,analyst,writer" --goal "Investigate X"
 *   bun run TeamCreate.ts --team "debug-team" --agents 3 --task "Debug this issue"
 */

interface TeamConfig {
  name: string;
  goal?: string;
  agents?: number | string[];
  context?: string;
  coordination?: "parallel" | "sequential" | "hierarchical";
  auto_dissolve?: boolean;
}

interface Team {
  id: string;
  name: string;
  goal?: string;
  agents: string[];
  coordination: "parallel" | "sequential" | "hierarchical";
  created_at: number;
  context?: string;
  shared_tasks: string[];
  status: "active" | "paused" | "completed" | "dissolved";
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

function generateTeamId(name: string): string {
  const timestamp = Date.now().toString(36);
  const hash = name.toLowerCase().replace(/[^a-z0-9]/g, "-");
  return `${hash}-${timestamp}`;
}

async function createTeam(config: TeamConfig): Promise<Team> {
  const teams = await loadTeams();

  // Check if team already exists
  const existingId = Object.keys(teams).find(id => teams[id].name === config.name);
  if (existingId) {
    console.error(`❌ Team "${config.name}" already exists`);
    console.log(`   Use existing team: ${existingId}`);
    process.exit(1);
  }

  // Determine agent composition
  let agents: string[];
  if (typeof config.agents === "number") {
    // Generate N agent names
    agents = Array.from({ length: config.agents }, (_, i) => `agent-${i + 1}`);
  } else if (Array.isArray(config.agents)) {
    agents = config.agents;
  } else {
    // Default: 3 specialized agents
    agents = ["specialist", "analyst", "synthesizer"];
  }

  const team: Team = {
    id: generateTeamId(config.name),
    name: config.name,
    goal: config.goal,
    agents,
    coordination: config.coordination || "parallel",
    created_at: Date.now(),
    context: config.context,
    shared_tasks: [],
    status: "active"
  };

  teams[team.id] = team;
  await saveTeams(teams);

  return team;
}

// CLI Interface
const args = process.argv.slice(2);

if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
  console.log(`
TeamCreate - Create coordinated agent teams

Usage:
  bun run TeamCreate.ts --team <name> [options]

Options:
  --team <name>          Team name (required)
  --agents <N|list>      Number of agents or comma-separated list
  --goal <description>   Team mission/goal
  --context <info>       Initial context for team
  --coordination <mode>  parallel|sequential|hierarchical (default: parallel)
  --auto-dissolve        Auto-dissolve when tasks complete

Examples:
  # Create research team with 3 agents
  bun run TeamCreate.ts --team "research-team" --agents 3 --goal "Investigate X"

  # Create team with specific agent types
  bun run TeamCreate.ts --team "security-audit" --agents "pentester,analyst,reporter" --goal "Audit system"

  # Create sequential coordination team
  bun run TeamCreate.ts --team "pipeline" --coordination sequential --goal "Multi-stage process"

Output:
  Returns team ID for use in TaskCreate, SendMessage, etc.
`);
  process.exit(0);
}

// Parse arguments
const config: TeamConfig = {
  name: "",
};

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case "--team":
      config.name = args[++i];
      break;
    case "--agents":
      const value = args[++i];
      if (value.includes(",")) {
        config.agents = value.split(",").map(a => a.trim());
      } else {
        config.agents = parseInt(value);
      }
      break;
    case "--goal":
      config.goal = args[++i];
      break;
    case "--context":
      config.context = args[++i];
      break;
    case "--coordination":
      config.coordination = args[++i] as any;
      break;
    case "--auto-dissolve":
      config.auto_dissolve = true;
      break;
  }
}

// Validate
if (!config.name) {
  console.error("❌ --team is required");
  process.exit(1);
}

// Create team
createTeam(config).then(team => {
  console.log(`✅ Team created`);
  console.log(`   ID: ${team.id}`);
  console.log(`   Name: ${team.name}`);
  console.log(`   Agents: ${team.agents.join(", ")}`);
  console.log(`   Coordination: ${team.coordination}`);
  if (team.goal) {
    console.log(`   Goal: ${team.goal}`);
  }
  console.log(`\nUse this team ID in TaskCreate: --team ${team.id}`);
}).catch(err => {
  console.error(`❌ Error creating team: ${err.message}`);
  process.exit(1);
});
