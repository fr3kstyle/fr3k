/**
 * Memory Manager - Unified access to all memory types
 *
 * Provides read/write access to Semantic, Episodic, and Procedural memory.
 * Handles serialization, search, and memory lifecycle.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { getPaiDir } from './paths';
import type {
  SemanticMemory,
  EpisodicMemory,
  ProceduralMemory,
  ExampleEntry,
  MemorySearchQuery,
  MemorySearchResult,
  MemoryStats,
} from './memory-types';

const MEMORY_DIR = join(getPaiDir(), 'MEMORY');
const SEMANTIC_DIR = join(MEMORY_DIR, 'SEMANTIC');
const EPISODIC_DIR = join(MEMORY_DIR, 'EPISODIC');
const PROCEDURAL_DIR = join(MEMORY_DIR, 'PROCEDURAL');

// Ensure directories exist
function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

// ============================================================================
// SEMANTIC MEMORY
// ============================================================================

export class SemanticMemoryStore {
  private dir: string;
  private indexFile: string;
  private index: Map<string, SemanticMemory>;

  constructor() {
    ensureDir(SEMANTIC_DIR);
    this.dir = SEMANTIC_DIR;
    this.indexFile = join(this.dir, 'index.json');
    this.index = this.loadIndex();
  }

  private loadIndex(): Map<string, SemanticMemory> {
    if (!existsSync(this.indexFile)) {
      return new Map();
    }
    try {
      const data = JSON.parse(readFileSync(this.indexFile, 'utf-8'));
      return new Map(Object.entries(data));
    } catch {
      return new Map();
    }
  }

  private saveIndex(): void {
    const obj = Object.fromEntries(this.index);
    writeFileSync(this.indexFile, JSON.stringify(obj, null, 2));
  }

  /**
   * Store a semantic memory
   */
  store(memory: Omit<SemanticMemory, 'id' | 'createdAt' | 'updatedAt' | 'accessCount' | 'lastAccessed'>): SemanticMemory {
    const now = new Date().toISOString();
    const semanticMemory: SemanticMemory = {
      id: generateId(),
      ...memory,
      createdAt: now,
      updatedAt: now,
      accessCount: 0,
      lastAccessed: now,
    };

    this.index.set(semanticMemory.id, semanticMemory);
    this.saveIndex();

    // Also save as individual file for easy inspection
    const filePath = join(this.dir, `${semanticMemory.id}.json`);
    writeFileSync(filePath, JSON.stringify(semanticMemory, null, 2));

    return semanticMemory;
  }

  /**
   * Get a semantic memory by ID
   */
  get(id: string): SemanticMemory | undefined {
    const memory = this.index.get(id);
    if (memory) {
      memory.accessCount++;
      memory.lastAccessed = new Date().toISOString();
      this.saveIndex();
    }
    return memory;
  }

  /**
   * Search semantic memories
   */
  search(query: MemorySearchQuery = {}): MemorySearchResult<SemanticMemory>[] {
    const results: MemorySearchResult<SemanticMemory>[] = [];

    for (const memory of this.index.values()) {
      const matchReasons: string[] = [];
      let relevance = 0;

      // Category filter
      if (query.category && memory.category !== query.category) {
        continue;
      }

      // Tag filter
      if (query.tags && query.tags.length > 0) {
        const matchingTags = query.tags.filter(t => memory.tags.includes(t));
        if (matchingTags.length === 0) continue;
        relevance += matchingTags.length / query.tags.length * 0.3;
        matchReasons.push(`tags: ${matchingTags.join(', ')}`);
      }

      // Confidence filter
      if (query.minConfidence && memory.confidence < query.minConfidence) {
        continue;
      }

      // Text search
      if (query.query) {
        const queryLower = query.query.toLowerCase();
        const contentLower = memory.content.toLowerCase();
        const tagLower = memory.tags.join(' ').toLowerCase();

        if (contentLower.includes(queryLower)) {
          relevance += 0.5;
          matchReasons.push('content match');
        }
        if (tagLower.includes(queryLower)) {
          relevance += 0.2;
          matchReasons.push('tag match');
        }
      } else {
        relevance += 0.5; // Base relevance for filter-only queries
      }

      if (relevance > 0) {
        results.push({ item: memory, relevance, matchReasons });
      }
    }

    // Sort by relevance and limit
    results.sort((a, b) => b.relevance - a.relevance);
    if (query.limit) {
      return results.slice(0, query.limit);
    }
    return results;
  }

  /**
   * Update a semantic memory
   */
  update(id: string, updates: Partial<Omit<SemanticMemory, 'id' | 'createdAt'>>): boolean {
    const memory = this.index.get(id);
    if (!memory) return false;

    const updated = {
      ...memory,
      ...updates,
      id: memory.id,
      createdAt: memory.createdAt,
      updatedAt: new Date().toISOString(),
    };

    this.index.set(id, updated);
    this.saveIndex();

    const filePath = join(this.dir, `${id}.json`);
    writeFileSync(filePath, JSON.stringify(updated, null, 2));

    return true;
  }

  /**
   * Delete a semantic memory
   */
  delete(id: string): boolean {
    if (!this.index.has(id)) return false;

    this.index.delete(id);
    this.saveIndex();

    const filePath = join(this.dir, `${id}.json`);
    if (existsSync(filePath)) {
      // unlink would be async, use sync
      const { unlinkSync } = require('fs');
      try { unlinkSync(filePath); } catch {}
    }

    return true;
  }

  /**
   * Get all memories
   */
  getAll(): SemanticMemory[] {
    return Array.from(this.index.values());
  }
}

// ============================================================================
// EPISODIC MEMORY
// ============================================================================

export class EpisodicMemoryStore {
  private dir: string;
  private indexFile: string;
  private examplesFile: string;
  private index: Map<string, EpisodicMemory>;

  constructor() {
    ensureDir(EPISODIC_DIR);
    this.dir = EPISODIC_DIR;
    this.indexFile = join(this.dir, 'index.json');
    this.examplesFile = join(this.dir, 'examples.json');
    this.index = this.loadIndex();
  }

  private loadIndex(): Map<string, EpisodicMemory> {
    if (!existsSync(this.indexFile)) {
      return new Map();
    }
    try {
      const data = JSON.parse(readFileSync(this.indexFile, 'utf-8'));
      return new Map(Object.entries(data));
    } catch {
      return new Map();
    }
  }

  private saveIndex(): void {
    const obj = Object.fromEntries(this.index);
    writeFileSync(this.indexFile, JSON.stringify(obj, null, 2));
  }

  /**
   * Store an episodic memory
   */
  store(memory: Omit<EpisodicMemory, 'id' | 'timestamp' | 'accessCount' | 'lastAccessed'>): EpisodicMemory {
    const now = new Date().toISOString();
    const episodicMemory: EpisodicMemory = {
      id: generateId(),
      ...memory,
      timestamp: now,
      accessCount: 0,
      lastAccessed: now,
    };

    this.index.set(episodicMemory.id, episodicMemory);
    this.saveIndex();

    // Save as individual file
    const filePath = join(this.dir, `${episodicMemory.id}.json`);
    writeFileSync(filePath, JSON.stringify(episodicMemory, null, 2));

    // If it's a success with rating 7+, add to examples
    if (episodicMemory.category === 'few_shot_example' ||
        (episodicMemory.outcome === 'success' && (episodicMemory.rating || 0) >= 7)) {
      this.addExample(episodicMemory);
    }

    return episodicMemory;
  }

  /**
   * Get an episodic memory by ID
   */
  get(id: string): EpisodicMemory | undefined {
    const memory = this.index.get(id);
    if (memory) {
      memory.accessCount++;
      memory.lastAccessed = new Date().toISOString();
      this.saveIndex();
    }
    return memory;
  }

  /**
   * Search episodic memories
   */
  search(query: MemorySearchQuery = {}): MemorySearchResult<EpisodicMemory>[] {
    const results: MemorySearchResult<EpisodicMemory>[] = [];

    for (const memory of this.index.values()) {
      const matchReasons: string[] = [];
      let relevance = 0;

      // Category filter
      if (query.category && memory.category !== query.category) {
        continue;
      }

      // Task type filter
      if (query.taskType && memory.taskType !== query.taskType) {
        continue;
      }

      // Tag filter
      if (query.tags && query.tags.length > 0) {
        const matchingTags = query.tags.filter(t => memory.tags.includes(t));
        if (matchingTags.length === 0) continue;
        relevance += matchingTags.length / query.tags.length * 0.3;
        matchReasons.push(`tags: ${matchingTags.join(', ')}`);
      }

      // Rating filter
      if (query.minRating && (!memory.rating || memory.rating < query.minRating)) {
        continue;
      }

      // Text search
      if (query.query) {
        const queryLower = query.query.toLowerCase();
        const contentLower = memory.content.toLowerCase();
        const tagLower = memory.tags.join(' ').toLowerCase();

        if (contentLower.includes(queryLower)) {
          relevance += 0.5;
          matchReasons.push('content match');
        }
        if (tagLower.includes(queryLower)) {
          relevance += 0.2;
          matchReasons.push('tag match');
        }
      } else {
        relevance += 0.5;
      }

      if (relevance > 0) {
        results.push({ item: memory, relevance, matchReasons });
      }
    }

    results.sort((a, b) => b.relevance - a.relevance);
    if (query.limit) {
      return results.slice(0, query.limit);
    }
    return results;
  }

  /**
   * Add to examples store
   */
  private addExample(memory: EpisodicMemory): void {
    const examples = this.loadExamples();
    const example: ExampleEntry = {
      id: memory.id,
      taskType: memory.taskType,
      task: memory.content.split('\n')[0], // First line as task summary
      approach: memory.content,
      result: memory.outcome,
      rating: memory.rating || 8,
      timestamp: memory.timestamp,
      sessionId: memory.sessionId,
      tags: memory.tags,
      metadata: {},
    };

    examples[memory.id] = example;
    this.saveExamples(examples);
  }

  private loadExamples(): Record<string, ExampleEntry> {
    if (!existsSync(this.examplesFile)) {
      return {};
    }
    try {
      return JSON.parse(readFileSync(this.examplesFile, 'utf-8'));
    } catch {
      return {};
    }
  }

  private saveExamples(examples: Record<string, ExampleEntry>): void {
    writeFileSync(this.examplesFile, JSON.stringify(examples, null, 2));
  }

  /**
   * Get examples by task type
   */
  getExamples(taskType: string, minRating: number = 7, limit: number = 5): ExampleEntry[] {
    const examples = this.loadExamples();
    return Object.values(examples)
      .filter(e => e.taskType === taskType && e.rating >= minRating)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
  }

  /**
   * Get all examples
   */
  getAllExamples(): ExampleEntry[] {
    const examples = this.loadExamples();
    return Object.values(examples);
  }

  /**
   * Get all episodic memories
   */
  getAll(): EpisodicMemory[] {
    return Array.from(this.index.values());
  }
}

// ============================================================================
// PROCEDURAL MEMORY
// ============================================================================

export class ProceduralMemoryStore {
  private dir: string;
  private indexFile: string;
  private index: Map<string, ProceduralMemory>;

  constructor() {
    ensureDir(PROCEDURAL_DIR);
    this.dir = PROCEDURAL_DIR;
    this.indexFile = join(this.dir, 'index.json');
    this.index = this.loadIndex();
  }

  private loadIndex(): Map<string, ProceduralMemory> {
    if (!existsSync(this.indexFile)) {
      return new Map();
    }
    try {
      const data = JSON.parse(readFileSync(this.indexFile, 'utf-8'));
      return new Map(Object.entries(data));
    } catch {
      return new Map();
    }
  }

  private saveIndex(): void {
    const obj = Object.fromEntries(this.index);
    writeFileSync(this.indexFile, JSON.stringify(obj, null, 2));
  }

  /**
   * Store a procedural memory
   */
  store(memory: Omit<ProceduralMemory, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'lastUsed' | 'version'>): ProceduralMemory {
    const now = new Date().toISOString();
    const proceduralMemory: ProceduralMemory = {
      id: generateId(),
      ...memory,
      version: 1,
      effectiveness: memory.effectiveness ?? 0.5,
      usageCount: 0,
      lastUsed: now,
      createdAt: now,
      updatedAt: now,
    };

    this.index.set(proceduralMemory.id, proceduralMemory);
    this.saveIndex();

    const filePath = join(this.dir, `${proceduralMemory.id}.json`);
    writeFileSync(filePath, JSON.stringify(proceduralMemory, null, 2));

    return proceduralMemory;
  }

  /**
   * Get a procedural memory by ID
   */
  get(id: string): ProceduralMemory | undefined {
    const memory = this.index.get(id);
    if (memory) {
      memory.usageCount++;
      memory.lastUsed = new Date().toISOString();
      this.saveIndex();
    }
    return memory;
  }

  /**
   * Get by name
   */
  getByName(name: string): ProceduralMemory | undefined {
    for (const memory of this.index.values()) {
      if (memory.name === name) {
        return this.get(memory.id);
      }
    }
    return undefined;
  }

  /**
   * Search procedural memories
   */
  search(query: MemorySearchQuery = {}): MemorySearchResult<ProceduralMemory>[] {
    const results: MemorySearchResult<ProceduralMemory>[] = [];

    for (const memory of this.index.values()) {
      const matchReasons: string[] = [];
      let relevance = 0;

      // Category filter
      if (query.category && memory.category !== query.category) {
        continue;
      }

      // Tag filter
      if (query.tags && query.tags.length > 0) {
        const matchingTags = query.tags.filter(t => memory.tags.includes(t));
        if (matchingTags.length === 0) continue;
        relevance += matchingTags.length / query.tags.length * 0.3;
        matchReasons.push(`tags: ${matchingTags.join(', ')}`);
      }

      // Text search
      if (query.query) {
        const queryLower = query.query.toLowerCase();
        const contentLower = memory.content.toLowerCase();
        const nameLower = memory.name.toLowerCase();
        const tagLower = memory.tags.join(' ').toLowerCase();

        if (contentLower.includes(queryLower)) {
          relevance += 0.4;
          matchReasons.push('content match');
        }
        if (nameLower.includes(queryLower)) {
          relevance += 0.4;
          matchReasons.push('name match');
        }
        if (tagLower.includes(queryLower)) {
          relevance += 0.2;
          matchReasons.push('tag match');
        }
      } else {
        // Sort by effectiveness for filter-only queries
        relevance = memory.effectiveness;
      }

      if (relevance > 0) {
        results.push({ item: memory, relevance, matchReasons });
      }
    }

    results.sort((a, b) => b.relevance - a.relevance);
    if (query.limit) {
      return results.slice(0, query.limit);
    }
    return results;
  }

  /**
   * Update effectiveness based on outcome
   */
  updateEffectiveness(id: string, outcome: 'success' | 'failure' | 'partial'): boolean {
    const memory = this.index.get(id);
    if (!memory) return false;

    // Simple decay learning: new effect = old * 0.9 + new * 0.1
    const newEffect = outcome === 'success' ? 1 : outcome === 'failure' ? 0 : 0.5;
    memory.effectiveness = memory.effectiveness * 0.9 + newEffect * 0.1;
    memory.updatedAt = new Date().toISOString();

    this.saveIndex();

    const filePath = join(this.dir, `${id}.json`);
    writeFileSync(filePath, JSON.stringify(memory, null, 2));

    return true;
  }

  /**
   * Get all memories
   */
  getAll(): ProceduralMemory[] {
    return Array.from(this.index.values());
  }
}

// ============================================================================
// UNIFIED MEMORY MANAGER
// ============================================================================

export class MemoryManager {
  public readonly semantic: SemanticMemoryStore;
  public readonly episodic: EpisodicMemoryStore;
  public readonly procedural: ProceduralMemoryStore;

  constructor() {
    this.semantic = new SemanticMemoryStore();
    this.episodic = new EpisodicMemoryStore();
    this.procedural = new ProceduralMemoryStore();
  }

  /**
   * Get memory statistics
   */
  getStats(): MemoryStats {
    const semanticMemories = this.semantic.getAll();
    const episodicMemories = this.episodic.getAll();
    const proceduralMemories = this.procedural.getAll();

    const semanticByCategory: Record<string, number> = {};
    for (const m of semanticMemories) {
      semanticByCategory[m.category] = (semanticByCategory[m.category] || 0) + 1;
    }

    const episodicByTaskType: Record<string, number> = {};
    for (const m of episodicMemories) {
      episodicByTaskType[m.taskType] = (episodicByTaskType[m.taskType] || 0) + 1;
    }

    const proceduralTotal = proceduralMemories.length;
    const avgEffectiveness = proceduralTotal > 0
      ? proceduralMemories.reduce((sum, m) => sum + m.effectiveness, 0) / proceduralTotal
      : 0;

    return {
      semantic: {
        total: semanticMemories.length,
        byCategory: semanticByCategory,
      },
      episodic: {
        total: episodicMemories.length,
        byTaskType: episodicByTaskType,
        examples: this.episodic.getAllExamples().length,
      },
      procedural: {
        total: proceduralTotal,
        avgEffectiveness,
      },
    };
  }

  /**
   * Search across all memory types
   */
  searchAll(query: MemorySearchQuery = {}): {
    semantic: MemorySearchResult<SemanticMemory>[];
    episodic: MemorySearchResult<EpisodicMemory>[];
    procedural: MemorySearchResult<ProceduralMemory>[];
  } {
    return {
      semantic: this.semantic.search(query),
      episodic: this.episodic.search(query),
      procedural: this.procedural.search(query),
    };
  }
}

// Singleton instance
let managerInstance: MemoryManager | null = null;

export function getMemoryManager(): MemoryManager {
  if (!managerInstance) {
    managerInstance = new MemoryManager();
  }
  return managerInstance;
}
