import { tracer } from "../observability/tracer.js";
import { TaskResult, Microtask } from "./types.js";

export class ResultOrchestrator {
  async merge(results: TaskResult[]): Promise<TaskResult> {
    const mergeSpan = tracer.startSpan("result.orchestration", {
      attributes: {
        "results.count": results.length,
        "results.success": results.filter(r => r.success).length,
        "results.failed": results.filter(r => !r.success).length
      }
    });

    try {
      if (results.length === 0) {
        throw new Error("No results to merge");
      }

      if (results.length === 1) {
        return results[0];
      }

      // Separate successful and failed results
      const successfulResults = results.filter(r => r.success);
      const failedResults = results.filter(r => !r.success);

      // If all results failed, return the first error
      if (successfulResults.length === 0) {
        const error = this.aggregateErrors(failedResults);
        return {
          success: false,
          error,
          content: null,
          metadata: {
            totalResults: results.length,
            failedCount: failedResults.length,
            error: "All microtasks failed"
          }
        };
      }

      // Calculate overall confidence
      const confidence = this.calculateConfidence(successfulResults);

      // Merge content based on content type
      const mergedContent = this.mergeContent(successfulResults);

      // Create metadata
      const metadata = {
        totalResults: results.length,
        successfulCount: successfulResults.length,
        failedCount: failedResults.length,
        confidence,
        mergedAt: new Date().toISOString(),
        mergeStrategy: this.determineMergeStrategy(results)
      };

      mergeSpan.setAttribute("merge.confidence", confidence);
      mergeSpan.setAttribute("merge.strategy", metadata.mergeStrategy);

      tracer.span.success(mergeSpan);

      return {
        success: true,
        content: mergedContent,
        metadata
      };

    } catch (error) {
      tracer.span.error(mergeSpan, error as Error);
      mergeSpan.end();
      throw error;
    } finally {
      mergeSpan.end();
    }
  }

  private aggregateErrors(failedResults: TaskResult[]): string {
    const errors = failedResults.map(r => r.error).filter(Boolean);
    if (errors.length === 0) {
      return "Unknown errors occurred";
    }
    if (errors.length === 1) {
      return errors[0];
    }
    return `Multiple errors: ${errors.slice(0, 3).join('; ')}`;
  }

  private calculateConfidence(results: TaskResult[]): number {
    if (results.length === 0) return 0;

    // Calculate confidence based on individual result confidences
    const confidences = results
      .map(r => r.metadata?.confidence ?? 0.5)
      .filter(c => c > 0);

    if (confidences.length === 0) {
      return 0.5; // Default confidence
    }

    // Weighted average based on result quality
    const totalConfidence = confidences.reduce((sum, c) => sum + c, 0);
    const avgConfidence = totalConfidence / confidences.length;

    // Adjust for redundancy (more similar results = higher confidence)
    const similarity = this.calculateResultSimilarity(results);
    return Math.min(1.0, (avgConfidence + similarity) / 2);
  }

  private calculateResultSimilarity(results: TaskResult[]): number {
    if (results.length < 2) return 1.0;

    // Simple similarity calculation based on content length and type
    const contents = results.map(r => r.content).filter(Boolean);
    if (contents.length < 2) return 0.5;

    const avgLength = contents.reduce((sum, c) => {
      return sum + (typeof c === 'string' ? c.length : JSON.stringify(c).length);
    }, 0) / contents.length;

    const variance = contents.reduce((sum, c) => {
      const length = typeof c === 'string' ? c.length : JSON.stringify(c).length;
      return sum + Math.pow(length - avgLength, 2);
    }, 0) / contents.length;

    // Lower variance = higher similarity
    const maxVariance = avgLength * avgLength;
    return Math.max(0, 1 - (variance / maxVariance));
  }

  private mergeContent(results: TaskResult[]): any {
    const allContents = results.map(r => r.content).filter(Boolean);

    if (allContents.length === 0) {
      return null;
    }

    if (allContents.length === 1) {
      return allContents[0];
    }

    // Determine content type and merge strategy
    const contentType = this.determineContentType(allContents);

    switch (contentType) {
      case 'string':
        return this.mergeStrings(allContents as string[]);
      case 'object':
        return this.mergeObjects(allContents as object[]);
      case 'array':
        return this.mergeArrays(allContents as any[][]);
      case 'research':
        return this.mergeResearchResults(allContents as any[]);
      case 'analysis':
        return this.mergeAnalysisResults(allContents as any[]);
      case 'validation':
        return this.mergeValidationResults(allContents as any[]);
      default:
        return this.concatenateContents(allContents);
    }
  }

  private determineContentType(contents: any[]): string {
    const firstContent = contents[0];

    if (typeof firstContent === 'string') {
      // Check if it's structured research data
      if (firstContent.includes('research') || firstContent.includes('data')) {
        return 'research';
      }
      return 'string';
    }

    if (Array.isArray(firstContent)) {
      return 'array';
    }

    if (typeof firstContent === 'object' && firstContent !== null) {
      // Check for specific types
      if (firstContent.research) return 'research';
      if (firstContent.analysis) return 'analysis';
      if (firstContent.validation) return 'validation';
      if (firstContent.generated) return 'generation';
      return 'object';
    }

    return 'unknown';
  }

  private mergeStrings(contents: string[]): string {
    // Simple concatenation with proper formatting
    return contents.join('\n\n');
  }

  private mergeObjects(contents: object[]): object {
    // Deep merge with conflict resolution
    const merged: any = {};

    for (const obj of contents) {
      for (const [key, value] of Object.entries(obj)) {
        if (!(key in merged)) {
          merged[key] = value;
        } else {
          // Handle conflicts
          merged[key] = this.mergeConflict(key, merged[key], value);
        }
      }
    }

    return merged;
  }

  private mergeArrays(contents: any[][]): any[] {
    // Concatenate and deduplicate
    const merged: any[] = [];
    const seen = new Set();

    for (const arr of contents) {
      for (const item of arr) {
        const key = JSON.stringify(item);
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(item);
        }
      }
    }

    return merged;
  }

  private mergeResearchResults(contents: any[]): any {
    // Consolidate research findings
    const merged = {
      research: [],
      data: [],
      sources: [],
      insights: [],
      metadata: {
        totalSources: 0,
        avgConfidence: 0,
        coverage: 0
      }
    };

    for (const result of contents) {
      if (result.research) merged.research.push(result.research);
      if (result.data) merged.data.push(result.data);
      if (result.sources) merged.sources.push(...result.sources);
      if (result.insights) merged.insights.push(...result.insights);
    }

    // Calculate metadata
    merged.metadata.totalSources = merged.sources.length;
    merged.metadata.avgConfidence = this.calculateConfidence(contents);
    merged.metadata.coverage = Math.min(1, merged.sources.length / 10); // Assuming 10 sources is good coverage

    return merged;
  }

  private mergeAnalysisResults(contents: any[]): any {
    // Consolidate analysis results
    const merged = {
      analysis: [],
      insights: [],
      patterns: [],
      metrics: {},
      summary: "",
      metadata: {
        totalAnalyses: contents.length,
        consensus: 0,
        confidence: 0
      }
    };

    for (const result of contents) {
      if (result.analysis) merged.analysis.push(result.analysis);
      if (result.insights) merged.insights.push(...result.insights);
      if (result.patterns) merged.patterns.push(...result.patterns);
      if (result.metrics) {
        Object.assign(merged.metrics, result.metrics);
      }
    }

    // Generate summary
    merged.summary = this.generateAnalysisSummary(merged);

    // Calculate metadata
    merged.metadata.consensus = this.calculateConsensus(contents);
    merged.metadata.confidence = this.calculateConfidence(contents);

    return merged;
  }

  private mergeValidationResults(contents: any[]): any {
    // Consolidate validation results
    const passed = contents.filter(r => r.validation?.passed).length;
    const total = contents.length;

    return {
      validation: {
        overall: passed / total,
        passed,
        total,
        details: contents.map(r => r.validation)
      },
      metrics: {
        accuracy: passed / total,
        coverage: 1,
        reliability: this.calculateConfidence(contents)
      },
      metadata: {
        totalChecks: total,
        passRate: passed / total,
        confidence: this.calculateConfidence(contents)
      }
    };
  }

  private concatenateContents(contents: any[]): any {
    // Fallback: concatenate as strings
    return contents.map(c => typeof c === 'string' ? c : JSON.stringify(c)).join('\n\n');
  }

  private mergeConflict(key: string, existing: any, incoming: any): any {
    // Simple conflict resolution: prioritize newer value
    // Could be enhanced with more sophisticated logic
    return incoming;
  }

  private generateAnalysisSummary(analysis: any): string {
    // Generate a summary from analysis results
    const insights = analysis.insights.slice(0, 5); // Top 5 insights
    return `Analysis completed with ${insights.length} key insights. Most significant: ${insights[0] || 'No clear insights found'}`;
  }

  private calculateConsensus(results: TaskResult[]): number {
    // Calculate agreement between results
    if (results.length < 2) return 1.0;

    // Simple consensus based on similarity
    let agreements = 0;
    const totalComparisons = results.length * (results.length - 1) / 2;

    for (let i = 0; i < results.length; i++) {
      for (let j = i + 1; j < results.length; j++) {
        if (this.resultsAgree(results[i], results[j])) {
          agreements++;
        }
      }
    }

    return totalComparisons > 0 ? agreements / totalComparisons : 0;
  }

  private resultsAgree(result1: TaskResult, result2: TaskResult): boolean {
    // Simple agreement check
    if (!result1.success || !result2.success) return false;

    const content1 = result1.content;
    const content2 = result2.content;

    if (typeof content1 === 'string' && typeof content2 === 'string') {
      // Check if both contain similar keywords
      const words1 = content1.toLowerCase().split(/\s+/);
      const words2 = content2.toLowerCase().split(/\s+/);

      const commonWords = words1.filter(word => words2.includes(word));
      const minCommonWords = Math.min(words1.length, words2.length) * 0.3;

      return commonWords.length >= minCommonWords;
    }

    return true; // Default to agreement
  }

  private determineMergeStrategy(results: TaskResult[]): string {
    const successfulResults = results.filter(r => r.success);
    const totalResults = results.length;

    if (successfulResults.length === 0) return 'error';
    if (successfulResults.length === 1) return 'single';
    if (successfulResults.length === totalResults) return 'all-success';
    return 'partial-success';
  }
}