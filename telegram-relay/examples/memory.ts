/**
 * Memory Persistence Example
 *
 * Pattern for giving your bot persistent memory across sessions.
 * Three options shown:
 * 1. Local JSON file (simplest)
 * 2. Supabase (cloud, searchable)
 * 3. Any database (pattern)
 *
 * Use this with the main relay to remember facts, goals, and conversations.
 */

import { readFile, writeFile } from "fs/promises";

// ============================================================
// TYPES
// ============================================================

interface Memory {
  facts: string[]; // Things to always remember
  goals: Goal[]; // Active goals
  completedGoals: CompletedGoal[]; // For history
}

interface Goal {
  text: string;
  deadline?: string;
  createdAt: string;
}

interface CompletedGoal {
  text: string;
  completedAt: string;
}

// ============================================================
// OPTION 1: LOCAL JSON FILE (Simplest)
// ============================================================

const MEMORY_FILE = process.env.MEMORY_FILE || "/tmp/bot-memory.json";

export async function loadMemory(): Promise<Memory> {
  try {
    const content = await readFile(MEMORY_FILE, "utf-8");
    return JSON.parse(content);
  } catch {
    return { facts: [], goals: [], completedGoals: [] };
  }
}

export async function saveMemory(memory: Memory): Promise<void> {
  await writeFile(MEMORY_FILE, JSON.stringify(memory, null, 2));
}

// Memory operations
export async function addFact(fact: string): Promise<string> {
  const memory = await loadMemory();
  memory.facts.push(fact);
  await saveMemory(memory);
  return `Remembered: "${fact}"`;
}

export async function addGoal(text: string, deadline?: string): Promise<string> {
  const memory = await loadMemory();
  memory.goals.push({
    text,
    deadline,
    createdAt: new Date().toISOString(),
  });
  await saveMemory(memory);
  return deadline ? `Goal set: "${text}" (by ${deadline})` : `Goal set: "${text}"`;
}

export async function completeGoal(searchText: string): Promise<string> {
  const memory = await loadMemory();
  const index = memory.goals.findIndex((g) =>
    g.text.toLowerCase().includes(searchText.toLowerCase())
  );

  if (index === -1) {
    return `No goal found matching "${searchText}"`;
  }

  const [completed] = memory.goals.splice(index, 1);
  memory.completedGoals.push({
    text: completed.text,
    completedAt: new Date().toISOString(),
  });
  await saveMemory(memory);

  return `Completed: "${completed.text}"`;
}

export async function getMemoryContext(): Promise<string> {
  const memory = await loadMemory();
  let context = "";

  if (memory.facts.length > 0) {
    context += "\nPERSISTENT MEMORY:\n";
    context += memory.facts.map((f) => `- ${f}`).join("\n");
  }

  if (memory.goals.length > 0) {
    context += "\n\nACTIVE GOALS:\n";
    context += memory.goals
      .map((g) => {
        const deadline = g.deadline ? ` (by ${g.deadline})` : "";
        return `- ${g.text}${deadline}`;
      })
      .join("\n");
  }

  return context;
}

// ============================================================
// OPTION 2: SUPABASE (Cloud, Searchable)
// ============================================================

/*
If you want cloud persistence and semantic search, use Supabase:

1. Create a Supabase project at https://supabase.com
2. Run the schema from examples/supabase-schema.sql
3. Set SUPABASE_URL and SUPABASE_ANON_KEY in .env

Example Supabase implementation:

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export async function addFactSupabase(fact: string): Promise<string> {
  const { error } = await supabase
    .from("memory")
    .insert({ type: "fact", content: fact });

  if (error) throw error;
  return `Remembered: "${fact}"`;
}

export async function searchMemory(query: string): Promise<string[]> {
  // If you have embeddings set up, you can do semantic search:
  // const embedding = await getEmbedding(query);
  // const { data } = await supabase.rpc("match_memory", { embedding, limit: 5 });

  // Simple text search:
  const { data } = await supabase
    .from("memory")
    .select("content")
    .textSearch("content", query);

  return data?.map((d) => d.content) || [];
}
*/

// ============================================================
// OPTION 3: INTEGRATE WITH RELAY
// ============================================================

/*
In your relay.ts, add memory commands:

// Parse user commands
if (text.startsWith("remember:")) {
  const fact = text.replace("remember:", "").trim();
  const result = await addFact(fact);
  await ctx.reply(result);
  return;
}

if (text.startsWith("track:")) {
  const goal = text.replace("track:", "").trim();
  const result = await addGoal(goal);
  await ctx.reply(result);
  return;
}

if (text.startsWith("done:")) {
  const search = text.replace("done:", "").trim();
  const result = await completeGoal(search);
  await ctx.reply(result);
  return;
}

// Add memory context to Claude prompts
const memoryContext = await getMemoryContext();
const fullPrompt = `
${memoryContext}

User: ${text}
`;
*/

// ============================================================
// INTENT DETECTION (Let Claude manage memory)
// ============================================================

/*
Instead of explicit commands, let Claude detect intent and manage memory.
Add this to your Claude prompt:

"
MEMORY MANAGEMENT:
When the user mentions something to remember, goals, or completions,
include these tags in your response:

[REMEMBER: fact to store]
[GOAL: goal text | DEADLINE: optional]
[DONE: search text for completed goal]

These will be processed automatically.
"

Then parse Claude's response:

async function processIntents(response: string): Promise<string> {
  let clean = response;

  const rememberMatch = response.match(/\[REMEMBER:\s*(.+?)\]/i);
  if (rememberMatch) {
    await addFact(rememberMatch[1]);
    clean = clean.replace(rememberMatch[0], "");
  }

  const goalMatch = response.match(/\[GOAL:\s*(.+?)(?:\s*\|\s*DEADLINE:\s*(.+?))?\]/i);
  if (goalMatch) {
    await addGoal(goalMatch[1], goalMatch[2]);
    clean = clean.replace(goalMatch[0], "");
  }

  const doneMatch = response.match(/\[DONE:\s*(.+?)\]/i);
  if (doneMatch) {
    await completeGoal(doneMatch[1]);
    clean = clean.replace(doneMatch[0], "");
  }

  return clean.trim();
}
*/
