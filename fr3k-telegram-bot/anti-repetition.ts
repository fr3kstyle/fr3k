#!/usr/bin/env bun
/**
 * Anti-Repetition System for PAI Telegram Bot
 *
 * Prevents repetitive responses by:
 * - Buffering last 5 responses
 * - Checking for >80% similarity
 * - Forcing variation if too repetitive
 */

interface BufferedResponse {
  id: string;
  text: string;
  timestamp: number;
  userId: string;
  similarity: number;
}

export class AntiRepetitionSystem {
  private responseBuffer: BufferedResponse[] = [];
  private readonly BUFFER_SIZE = 5;
  private readonly SIMILARITY_THRESHOLD = 0.8;
  private readonly VARIATION_TEMPLATES = [
    "Here's another way to look at it: {response}",
    "Let me rephrase that: {response}",
    "To clarify: {response}",
    "In other words: {response}",
    "Let me put it differently: {response}",
    "To elaborate: {response}",
    "Here's a different perspective: {response}",
    "Let me explain this differently: {response}",
    "In summary: {response}",
    "The core point is: {response}",
  ];

  /**
   * Calculate similarity between two texts using word overlap
   */
  private calculateSimilarity(text1: string, text2: string): number {
    // Normalize texts
    const normalize = (text: string) =>
      text.toLowerCase()
           .replace(/[^\w\s]/g, '')
           .split(/\s+/)
           .filter(word => word.length > 2);

    const words1 = normalize(text1);
    const words2 = normalize(text2);

    if (words1.length === 0 || words2.length === 0) {
      return 0;
    }

    // Calculate Jaccard similarity
    const set1 = new Set(words1);
    const set2 = new Set(words2);

    const intersection = Array.from(set1).filter(x => set2.has(x)).length;
    const union = new Set([...words1, ...words2]).size;

    return intersection / union;
  }

  /**
   * Check if response is repetitive
   */
  private isRepetitive(response: string, userId: string): { isRepetitive: boolean; similarity: number } {
    // Clean and normalize response
    const cleanResponse = response.trim();

    let maxSimilarity = 0;

    // Compare with buffer
    for (const buffered of this.responseBuffer) {
      if (buffered.userId === userId) {
        const similarity = this.calculateSimilarity(cleanResponse, buffered.text);
        maxSimilarity = Math.max(maxSimilarity, similarity);

        if (similarity >= this.SIMILARITY_THRESHOLD) {
          return { isRepetitive: true, similarity };
        }
      }
    }

    return { isRepetitive: false, similarity: maxSimilarity };
  }

  /**
   * Generate variation response
   */
  private generateVariation(response: string): string {
    const template = this.VARIATION_TEMPLATES[
      Math.floor(Math.random() * this.VARIATION_TEMPLATES.length)
    ];

    return template.replace("{response}", response);
  }

  /**
   * Process response through anti-repetition system
   */
  public processResponse(
    response: string,
    userId: string,
    messageId: string
  ): { finalResponse: string; wasModified: boolean; similarity: number } {
    // Check for repetition
    const { isRepetitive, similarity } = this.isRepetitive(response, userId);

    if (!isRepetitive) {
      // Not repetitive, add to buffer
      this.addToBuffer(response, userId, messageId);
      return {
        finalResponse: response,
        wasModified: false,
        similarity
      };
    }

    // Repetitive detected, generate variation
    const variedResponse = this.generateVariation(response);

    // Log the variation
    console.log(`🔄 Repetition detected (similarity: ${Math.round(similarity * 100)}%) - generating variation`);

    // Add varied response to buffer
    this.addToBuffer(variedResponse, userId, messageId);

    return {
      finalResponse: variedResponse,
      wasModified: true,
      similarity
    };
  }

  /**
   * Add response to buffer
   */
  private addToBuffer(response: string, userId: string, messageId: string): void {
    const newEntry: BufferedResponse = {
      id: messageId,
      text: response,
      timestamp: Date.now(),
      userId,
      similarity: 0, // Will be calculated on next comparison
    };

    this.responseBuffer.push(newEntry);

    // Maintain buffer size
    if (this.responseBuffer.length > this.BUFFER_SIZE) {
      this.responseBuffer.shift();
    }

    // Clean old entries (older than 1 hour)
    const oneHourAgo = Date.now() - 3600000;
    this.responseBuffer = this.responseBuffer.filter(entry => entry.timestamp > oneHourAgo);
  }

  /**
   * Get buffer statistics
   */
  public getBufferStats(): { size: number; userCounts: Record<string, number> } {
    const userCounts: Record<string, number> = {};

    this.responseBuffer.forEach(entry => {
      userCounts[entry.userId] = (userCounts[entry.userId] || 0) + 1;
    });

    return {
      size: this.responseBuffer.length,
      userCounts
    };
  }

  /**
   * Clear buffer (for testing or cleanup)
   */
  public clearBuffer(): void {
    this.responseBuffer = [];
  }

  /**
   * Get buffer contents (for debugging)
   */
  public getBuffer(): BufferedResponse[] {
    return [...this.responseBuffer];
  }
}

// Singleton instance
export const antiRepetitionSystem = new AntiRepetitionSystem();