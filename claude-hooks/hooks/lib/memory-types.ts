/**
 * Memory Type Definitions
 *
 * TypeScript types for the three-tier memory system:
 * - Semantic Memory: Facts, preferences, stable knowledge
 * - Episodic Memory: Events, experiences, few-shot examples
 * - Procedural Memory: Skills, prompts, refined patterns
 */

/**
 * Semantic Memory - Declarative knowledge about the user and their world
 */
export interface SemanticMemory {
  id: string;
  type: 'semantic';
  category: SemanticCategory;
  content: string;
  tags: string[];
  confidence: number; // 0-1, how certain we are about this fact
  source: 'user_direct' | 'inferred' | 'project' | 'system';
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  accessCount: number;
  lastAccessed: string; // ISO timestamp
}

export type SemanticCategory =
  | 'user_profile'      // Name, preferences, habits
  | 'user_preference'   // Specific likes/dislikes
  | 'project_context'   // Project-specific facts
  | 'technical_fact'    // Technical knowledge
  | 'relationship'      // People, teams, org structure
  | 'workflow'          // How user works
  | 'environment'       // Dev environment, tools
  | 'custom';           // User-defined categories

/**
 * Episodic Memory - Specific events and experiences
 */
export interface EpisodicMemory {
  id: string;
  type: 'episodic';
  category: EpisodicCategory;
  taskType: string; // e.g., "bug_fix", "feature_implementation", "code_review"
  content: string;
  outcome: 'success' | 'failure' | 'partial';
  rating?: number; // 1-10, if available
  sessionId: string;
  timestamp: string; // ISO timestamp
  embedding?: number[]; // For semantic search
  tags: string[];
  accessCount: number;
  lastAccessed: string;
}

export type EpisodicCategory =
  | 'task_execution'   // Completed tasks
  | 'few_shot_example' // Examples for future reference
  | 'success_pattern'  // Patterns to replicate
  | 'failure_case'     // Cases to avoid
  | 'user_interaction' // Conversational events
  | 'tool_usage'       // Tool invocation patterns
  | 'custom';

/**
 * Procedural Memory - How to do things, prompts, skills
 */
export interface ProceduralMemory {
  id: string;
  type: 'procedural';
  category: ProceduralCategory;
  name: string;
  content: string;
  version: number;
  effectiveness: number; // 0-1, based on outcomes
  usageCount: number;
  lastUsed: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export type ProceduralCategory =
  | 'system_prompt'     // Evolving system prompts
  | 'skill_definition'  // Refined skill definitions
  | 'response_format'   // Optimized response formats
  | 'tool_pattern'      // Effective tool usage patterns
  | 'reasoning_template' // Problem-solving templates
  | 'code_pattern'      // Reusable code patterns
  | 'custom';

/**
 * Example Store Entry - For few-shot selection
 */
export interface ExampleEntry {
  id: string;
  taskType: string;
  task: string;
  approach: string;
  result: string;
  rating: number; // 1-10
  embedding?: number[];
  timestamp: string;
  sessionId: string;
  tags: string[];
  metadata: {
    tools?: string[];
    files?: string[];
    duration?: number;
    complexity?: 'low' | 'medium' | 'high';
  };
}

/**
 * Memory Search Query
 */
export interface MemorySearchQuery {
  query?: string; // Text search
  tags?: string[]; // Tag filter
  category?: string; // Category filter
  minRating?: number; // Minimum rating
  minConfidence?: number; // Minimum confidence (semantic)
  taskType?: string; // Task type filter (episodic)
  limit?: number; // Max results
  includeEmbeddings?: boolean; // Use semantic search
}

/**
 * Memory Search Result
 */
export interface MemorySearchResult<T = SemanticMemory | EpisodicMemory | ProceduralMemory> {
  item: T;
  relevance: number; // 0-1
  matchReasons: string[]; // Why this matched
}

/**
 * Compaction State
 */
export interface CompactionState {
  toolOutputsCleared: number;
  filesSummarized: number;
  contextTokensSaved: number;
  lastCompaction: string;
  preservedContext: {
    recentFiles: string[];
    keyDecisions: string[];
    bugs: string[];
  };
}

/**
 * Memory Statistics
 */
export interface MemoryStats {
  semantic: {
    total: number;
    byCategory: Record<string, number>;
  };
  episodic: {
    total: number;
    byTaskType: Record<string, number>;
    examples: number;
  };
  procedural: {
    total: number;
    avgEffectiveness: number;
  };
}
