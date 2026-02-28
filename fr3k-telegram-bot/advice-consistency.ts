/**
 * Advice Consistency Tracking System
 *
 * Prevents PAI from giving contradictory advice by maintaining a log
 * of all advice given and checking for contradictions before responding.
 */

export interface AdviceEntry {
  id: string;
  userId: string;
  timestamp: number;
  key: string;
  advice: string;
  category: string;
  hash: string;
}

export interface Contradiction {
  advice1: AdviceEntry;
  advice2: AdviceEntry;
  confidence: number;
  explanation: string;
}

export interface AdviceContext {
  userId: string;
  topic?: string;
  category?: string;
  urgency?: 'low' | 'medium' | 'high';
  priority?: number;
}

export class AdviceConsistencySystem {
  private adviceLog: Map<string, AdviceEntry[]> = new Map();
  private readonly MAX_LOG_SIZE = 100;
  private readonly CONTRADICTION_THRESHOLD = 0.75;
  private readonly LOG_FILE = "/tmp/pai-advice-consistency.json";

  constructor() {
    this.loadLog();
  }

  /**
   * Normalize advice text to extract key points for comparison
   */
  private normalizeAdvice(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Generate a semantic hash for the advice content
   */
  private generateHash(advice: string): string {
    const normalized = this.normalizeAdvice(advice);
    let hash = 0;

    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return hash.toString(36);
  }

  /**
   * Extract key topics/advice categories from text
   */
  private extractCategory(text: string): string {
    const categories = [
      'career', 'programming', 'business', 'health', 'relationship',
      'finance', 'education', 'technology', 'personal', 'professional'
    ];

    const normalizedText = text.toLowerCase();

    for (const category of categories) {
      if (normalizedText.includes(category) || normalizedText.includes(category + 's')) {
        return category;
      }
    }

    // If no specific category found, use content analysis
    if (text.includes('code') || text.includes('programming') || text.includes('software')) {
      return 'programming';
    }
    if (text.includes('money') || text.includes('finance') || text.includes('budget')) {
      return 'finance';
    }
    if (text.includes('job') || text.includes('career') || text.includes('work')) {
      return 'career';
    }

    return 'general';
  }

  /**
   * Calculate semantic similarity between two pieces of advice
   */
  private calculateSimilarity(text1: string, text2: string): number {
    const norm1 = this.normalizeAdvice(text1);
    const norm2 = this.normalizeAdvice(text2);

    // Simple word overlap similarity
    const words1 = new Set(norm1.split(' '));
    const words2 = new Set(norm2.split(' '));

    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Check if two advice entries contradict each other
   */
  private detectContradiction(entry1: AdviceEntry, entry2: AdviceEntry): Contradiction | null {
    if (entry1.userId !== entry2.userId) return null;
    if (entry1 === entry2) return null;

    const similarity = this.calculateSimilarity(entry1.advice, entry2.advice);

    // Skip if too similar (not contradictory)
    if (similarity > this.CONTRADICTION_THRESHOLD) return null;

    // Look for common contradiction patterns
    const contradictions = this.findContradictionPatterns(entry1.advice, entry2.advice);

    if (contradictions.length > 0) {
      return {
        advice1: entry1,
        advice2: entry2,
        confidence: 1 - similarity,
        explanation: contradictions.join('; ')
      };
    }

    return null;
  }

  /**
   * Find specific contradiction patterns in advice
   */
  private findContradictionPatterns(text1: string, text2: string): string[] {
    const contradictions: string[] = [];
    const patterns = [
      {
        keywords: ['always', 'never', 'avoid', 'must', 'should not'],
        check: (t1: string, t2: string) => {
          const words1 = text1.toLowerCase().split(' ');
          const words2 = text2.toLowerCase().split(' ');

          const absolute1 = words1.filter(word => ['always', 'never'].includes(word)).length > 0;
          const absolute2 = words2.filter(word => ['always', 'never'].includes(word)).length > 0;

          if (absolute1 && absolute2) {
            const oppositeWords = ['avoid', 'must not', 'should not', 'never'];
            const hasOpposition = words1.some(w => oppositeWords.includes(w)) ||
                                words2.some(w => oppositeWords.includes(w));

            if (hasOpposition) return true;
          }
          return false;
        }
      },
      {
        keywords: ['should', 'recommend', 'suggest'],
        check: (t1: string, t2: string) => {
          const words1 = text1.toLowerCase();
          const words2 = text2.toLowerCase();

          const should1 = words1.includes('should') || words1.includes('recommend');
          const should2 = words2.includes('should') || words2.includes('recommend');

          if (should1 && should2) {
            return true;
          }
          return false;
        }
      },
      {
        keywords: ['good', 'bad', 'benefit', 'harm', 'positive', 'negative'],
        check: (t1: string, t2: string) => {
          const words1 = text1.toLowerCase();
          const words2 = text2.toLowerCase();

          const good1 = words1.includes('good') || words1.includes('benefit') || words1.includes('positive');
          const bad1 = words1.includes('bad') || words1.includes('harm') || words1.includes('negative');
          const good2 = words2.includes('good') || words2.includes('benefit') || words2.includes('positive');
          const bad2 = words2.includes('bad') || words2.includes('harm') || words2.includes('negative');

          if ((good1 && bad2) || (bad1 && good2)) {
            return true;
          }
          return false;
        }
      }
    ];

    for (const pattern of patterns) {
      if (pattern.check(text1, text2)) {
        contradictions.push(`Contradiction detected with absolute statements`);
      }
    }

    return contradictions;
  }

  /**
   * Log new advice
   */
  async logAdvice(advice: string, context: AdviceContext): Promise<string> {
    const id = `advice-${Date.now()}-${context.userId}`;
    const category = context.category || this.extractCategory(advice);
    const hash = this.generateHash(advice);

    const entry: AdviceEntry = {
      id,
      userId: context.userId,
      timestamp: Date.now(),
      key: category,
      advice,
      category,
      hash
    };

    // Initialize user log if not exists
    if (!this.adviceLog.has(context.userId)) {
      this.adviceLog.set(context.userId, []);
    }

    // Add to log
    const userLog = this.adviceLog.get(context.userId)!;
    userLog.unshift(entry); // Add to beginning (newest first)

    // Trim log if too large
    if (userLog.length > this.MAX_LOG_SIZE) {
      userLog.pop();
    }

    // Save to disk
    await this.saveLog();

    return id;
  }

  /**
   * Check for contradictions before giving advice
   */
  async checkForContradictions(advice: string, context: AdviceContext): Promise<{
    hasContradiction: boolean;
    contradictions?: Contradiction[];
    resolvedResponse?: string;
  }> {
    if (!this.adviceLog.has(context.userId)) {
      return { hasContradiction: false };
    }

    const userLog = this.adviceLog.get(context.userId)!;
    const contradictions: Contradiction[] = [];

    // Check against recent advice (last 10 entries)
    const recentAdvice = userLog.slice(0, 10);

    for (const entry of recentAdvice) {
      const contradiction = this.detectContradiction(
        { ...entry, advice: entry.advice },
        {
          id: 'new-advice',
          userId: context.userId,
          timestamp: Date.now(),
          key: context.category || this.extractCategory(advice),
          advice,
          category: context.category || this.extractCategory(advice),
          hash: this.generateHash(advice)
        }
      );

      if (contradiction) {
        contradictions.push(contradiction);
      }
    }

    if (contradictions.length > 0) {
      // Generate resolution response
      const resolvedResponse = this.generateResolutionResponse(contradictions, advice);

      // Log the contradictory advice anyway but mark it as resolved
      await this.logAdvice(advice, context);

      return {
        hasContradiction: true,
        contradictions,
        resolvedResponse
      };
    }

    return { hasContradiction: false };
  }

  /**
   * Generate a response that acknowledges and resolves contradictions
   */
  private generateResolutionResponse(contradictions: Contradiction[], newAdvice: string): string {
    const explanations = contradictions.map(c =>
      `Earlier advice (${c.advice1.timestamp}) vs current (${Date.now()}): ${c.explanation}`
    );

    return `
⚠️ **Advice Consistency Notice**

I've detected a potential contradiction in my advice:

${explanations.join('\n')}

**Resolution:**
The context or circumstances may have changed, making the new advice appropriate. Here's how to reconcile this:

1. **Time-based considerations**: Earlier advice may have been based on different information
2. **Context evolution**: Your situation may have evolved since previous advice
3. **Nuanced approach**: Both pieces of advice may be valid in different contexts

**Current recommendation:** ${newAdvice}

**Note:** If you feel this is a genuine contradiction, please provide more context so I can give more targeted advice.
    `.trim();
  }

  /**
   * Get user's advice history
   */
  getAdviceHistory(userId: string, limit: number = 10): AdviceEntry[] {
    const userLog = this.adviceLog.get(userId) || [];
    return userLog.slice(0, limit);
  }

  /**
   * Clear old advice (for users who want to start fresh)
   */
  clearOldAdvice(userId: string, olderThanMs: number = 7 * 24 * 60 * 60 * 1000): void {
    if (!this.adviceLog.has(userId)) return;

    const userLog = this.adviceLog.get(userId)!;
    const cutoff = Date.now() - olderThanMs;

    const filtered = userLog.filter(entry => entry.timestamp > cutoff);
    this.adviceLog.set(userId, filtered);

    if (filtered.length < userLog.length) {
      this.saveLog();
    }
  }

  /**
   * Save log to disk
   */
  private async saveLog(): Promise<void> {
    try {
      const data = JSON.stringify(Object.fromEntries(this.adviceLog), null, 2);
      await Bun.write(this.LOG_FILE, data);
    } catch (error) {
      console.error("Failed to save advice consistency log:", error);
    }
  }

  /**
   * Load log from disk
   */
  private async loadLog(): Promise<void> {
    try {
      const data = await Bun.readableStreamToText(Bun.file(this.LOG_FILE).stream());
      const parsed = JSON.parse(data);

      this.adviceLog = new Map();
      for (const [userId, entries] of Object.entries(parsed)) {
        this.adviceLog.set(userId, entries as AdviceEntry[]);
      }
    } catch (error) {
      // If file doesn't exist or is corrupted, start with empty log
      this.adviceLog = new Map();
    }
  }

  /**
   * Get statistics for a user
   */
  getUserStats(userId: string): {
    totalAdvice: number;
    categories: { [key: string]: number };
    lastCheck: number | null;
    potentialContradictions: number;
  } {
    const userLog = this.adviceLog.get(userId) || [];
    const categories: { [key: string]: number } = {};

    userLog.forEach(entry => {
      categories[entry.category] = (categories[entry.category] || 0) + 1;
    });

    const potentialContradictions = this.countPotentialContradictions(userId);

    return {
      totalAdvice: userLog.length,
      categories,
      lastCheck: userLog.length > 0 ? userLog[0].timestamp : null,
      potentialContradictions
    };
  }

  /**
   * Count potential contradictions in user's history
   */
  private countPotentialContradictions(userId: string): number {
    const userLog = this.adviceLog.get(userId) || [];
    let count = 0;

    for (let i = 0; i < Math.min(userLog.length, 10); i++) {
      for (let j = i + 1; j < Math.min(userLog.length, 10); j++) {
        const contradiction = this.detectContradiction(userLog[i], userLog[j]);
        if (contradiction) {
          count++;
        }
      }
    }

    return count;
  }

  /**
   * Export advice data for a user
   */
  exportAdviceData(userId: string): string {
    const userLog = this.adviceLog.get(userId) || [];
    const stats = this.getUserStats(userId);

    return JSON.stringify({
      user: userId,
      exportDate: new Date().toISOString(),
      stats,
      advice: userLog
    }, null, 2);
  }
}

// Export singleton instance
export const adviceConsistencySystem = new AdviceConsistencySystem();