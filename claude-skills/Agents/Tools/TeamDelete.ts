#!/usr/bin/env bun
/**
 * TeamDelete - Dissolve agent teams
 *
 * Part of Agent Teams architecture from Claude Opus 4.6
 * Dissolves a team and optionally archives its state
 *
 * Usage:
 *   bun run TeamDelete.ts --team <team-id>
 *   bun run TeamDelete.ts --team <team-id> --archive
 */

interface Team {
  id: string;
  name: string;
  agents: string[];
  messages: any[];
  shared_tasks: string[];
  created_at: number;
  status: string;
}

const TEAMS_DB = "/tmp/pai-teams.json";
const ARCHIVE_DIR = "/tmp/pai-teams-archive";

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

async function archiveTeam(team: Team): Promise<string> {
  // Ensure archive directory exists
  await Bun.write(`${ARCHIVE_DIR}/.gitkeep`, "");

  const archivePath = `${ARCHIVE_DIR}/${team.id}-${Date.now()}.json`;
  await Bun.write(archivePath, JSON.stringify(team, null, 2));

  return archivePath;
}

async function deleteTeam(teamId: string, archive: boolean): Promise<void> {
  const teams = await loadTeams();

  if (!teams[teamId]) {
    console.error(`❌ Team not found: ${teamId}`);
    console.log(`   Available teams: ${Object.keys(teams).join(", ") || "none"}`);
    process.exit(1);
  }

  const team = teams[teamId];

  // Archive if requested
  let archivePath = "";
  if (archive) {
    archivePath = await archiveTeam(team);
  }

  // Delete from active teams
  delete teams[teamId];
  await Bun.write(TEAMS_DB, JSON.stringify(teams, null, 2));

  // Output
  console.log(`✅ Team dissolved`);
  console.log(`   Name: ${team.name}`);
  console.log(`   ID: ${teamId}`);
  console.log(`   Existed for: ${Math.round((Date.now() - team.created_at) / 1000)} seconds`);
  console.log(`   Agents: ${team.agents.join(", ")}`);
  console.log(`   Tasks: ${team.shared_tasks?.length || 0}`);
  console.log(`   Messages: ${team.messages?.length || 0}`);

  if (archivePath) {
    console.log(`   Archived to: ${archivePath}`);
  }
}

// CLI Interface
const args = process.argv.slice(2);

if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
  console.log(`
TeamDelete - Dissolve agent teams

Usage:
  bun run TeamDelete.ts --team <team-id> [options]

Options:
  --team <team-id>    Team ID to dissolve (required)
  --archive           Archive team state before deletion
  --list              List all active teams

Examples:
  # Dissolve team
  bun run TeamDelete.ts --team research-team-abc123

  # Dissolve and archive
  bun run TeamDelete.ts --team research-team-abc123 --archive

  # List teams
  bun run TeamDelete.ts --list
`);
  process.exit(0);
}

// List teams mode
if (args.includes("--list")) {
  const teams = loadTeams();
  const activeTeams = Object.values(teams);

  console.log(`📋 Active Teams (${activeTeams.length})`);
  console.log("");

  if (activeTeams.length === 0) {
    console.log("   No active teams");
  } else {
    activeTeams.forEach(team => {
      const age = Math.round((Date.now() - team.created_at) / 1000);
      console.log(`   • ${team.name}`);
      console.log(`     ID: ${team.id}`);
      console.log(`     Age: ${age}s`);
      console.log(`     Agents: ${team.agents.join(", ")}`);
      console.log(`     Tasks: ${team.shared_tasks?.length || 0}`);
      console.log("");
    });
  }

  process.exit(0);
}

// Parse arguments
let teamId = "";
let archive = false;

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case "--team":
      teamId = args[++i];
      break;
    case "--archive":
      archive = true;
      break;
  }
}

// Validate
if (!teamId) {
  console.error("❌ --team is required");
  process.exit(1);
}

// Delete team
deleteTeam(teamId, archive).catch(err => {
  console.error(`❌ Error deleting team: ${err.message}`);
  process.exit(1);
});
