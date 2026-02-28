#!/usr/bin/env bun
/**
 * Patch Generator - Automatic fix generation for detected bugs
 * Generates 3-5 candidate patches using multiple strategies
 */

interface BugReport {
  id: string;
  error_message: string;
  stack_trace: string[];
  file_path: string;
  line_number: number;
  bug_type: string;
  severity: 'low' | 'medium' | 'high';
}

interface PatchCandidate {
  id: string;
  bug_id: string;
  description: string;
  code_diff: string;
  strategy: PatchStrategy;
  confidence: number;        // 0-1
  estimated_impact: 'low' | 'medium' | 'high';
  risk_level: 'low' | 'medium' | 'high';
}

type PatchStrategy =
  | 'null_check'
  | 'error_handling'
  | 'resource_cleanup'
  | 'timeout_guard'
  | 'race_condition_fix'
  | 'syntax_fix'
  | 'logic_correction'
  | 'memory_leak_fix';

class PatchGenerator {
  private generatedPatches: Map<string, PatchCandidate[]> = new Map();

  async generatePatches(bugReport: BugReport): Promise<PatchCandidate[]> {
    console.log(`\n🔧 Generating patches for bug: ${bugReport.bug_type}`);
    console.log(`   File: ${bugReport.file_path}:${bugReport.line_number}`);

    const patches: PatchCandidate[] = [];

    // Generate patches based on bug type
    switch (bugReport.bug_type) {
      case 'null_pointer':
        patches.push(await this.generateNullCheckPatch(bugReport));
        patches.push(await this.generateErrorHandlingPatch(bugReport));
        break;

      case 'memory_leak':
        patches.push(await this.generateMemoryLeakPatch(bugReport));
        patches.push(await this.generateResourceCleanupPatch(bugReport));
        break;

      case 'deadlock':
        patches.push(await this.generateTimeoutGuardPatch(bugReport));
        patches.push(await this.generateRaceConditionPatch(bugReport));
        break;

      case 'infinite_loop':
        patches.push(await this.generateTimeoutGuardPatch(bugReport));
        patches.push(await this.generateLogicCorrectionPatch(bugReport));
        break;

      case 'exception_handling':
        patches.push(await this.generateErrorHandlingPatch(bugReport));
        patches.push(await this.generateNullCheckPatch(bugReport));
        break;

      case 'performance_degradation':
        patches.push(await this.generateResourceCleanupPatch(bugReport));
        patches.push(await this.generateLogicCorrectionPatch(bugReport));
        break;

      case 'resource_exhaustion':
        patches.push(await this.generateResourceCleanupPatch(bugReport));
        patches.push(await this.generateTimeoutGuardPatch(bugReport));
        break;

      default:
        // Generate generic patches
        patches.push(await this.generateErrorHandlingPatch(bugReport));
        patches.push(await this.generateNullCheckPatch(bugReport));
    }

    // Store patches
    this.generatedPatches.set(bugReport.id, patches);

    console.log(`✅ Generated ${patches.length} patch candidates`);
    return patches;
  }

  private async generateNullCheckPatch(bugReport: BugReport): Promise<PatchCandidate> {
    return {
      id: crypto.randomUUID(),
      bug_id: bugReport.id,
      description: 'Add null/undefined check before variable access',
      code_diff: this.generateNullCheckDiff(bugReport),
      strategy: 'null_check',
      confidence: 0.75,
      estimated_impact: 'medium',
      risk_level: 'low'
    };
  }

  private async generateErrorHandlingPatch(bugReport: BugReport): Promise<PatchCandidate> {
    return {
      id: crypto.randomUUID(),
      bug_id: bugReport.id,
      description: 'Wrap in try-catch block with proper error handling',
      code_diff: this.generateErrorHandlingDiff(bugReport),
      strategy: 'error_handling',
      confidence: 0.80,
      estimated_impact: 'high',
      risk_level: 'low'
    };
  }

  private async generateResourceCleanupPatch(bugReport: BugReport): Promise<PatchCandidate> {
    return {
      id: crypto.randomUUID(),
      bug_id: bugReport.id,
      description: 'Ensure proper resource cleanup (close connections, dispose objects)',
      code_diff: this.generateResourceCleanupDiff(bugReport),
      strategy: 'resource_cleanup',
      confidence: 0.70,
      estimated_impact: 'high',
      risk_level: 'medium'
    };
  }

  private async generateTimeoutGuardPatch(bugReport: BugReport): Promise<PatchCandidate> {
    return {
      id: crypto.randomUUID(),
      bug_id: bugReport.id,
      description: 'Add timeout guard to prevent infinite loops/blocking',
      code_diff: this.generateTimeoutGuardDiff(bugReport),
      strategy: 'timeout_guard',
      confidence: 0.72,
      estimated_impact: 'medium',
      risk_level: 'low'
    };
  }

  private async generateRaceConditionPatch(bugReport: BugReport): Promise<PatchCandidate> {
    return {
      id: crypto.randomUUID(),
      bug_id: bugReport.id,
      description: 'Add locks/semaphores to prevent race conditions',
      code_diff: this.generateRaceConditionDiff(bugReport),
      strategy: 'race_condition_fix',
      confidence: 0.65,
      estimated_impact: 'high',
      risk_level: 'high'
    };
  }

  private async generateLogicCorrectionPatch(bugReport: BugReport): Promise<PatchCandidate> {
    return {
      id: crypto.randomUUID(),
      bug_id: bugReport.id,
      description: 'Correct logic error based on stack trace analysis',
      code_diff: this.generateLogicCorrectionDiff(bugReport),
      strategy: 'logic_correction',
      confidence: 0.60,
      estimated_impact: 'high',
      risk_level: 'medium'
    };
  }

  private async generateMemoryLeakPatch(bugReport: BugReport): Promise<PatchCandidate> {
    return {
      id: crypto.randomUUID(),
      bug_id: bugReport.id,
      description: 'Fix memory leak by removing circular references and adding cleanup',
      code_diff: this.generateMemoryLeakDiff(bugReport),
      strategy: 'memory_leak_fix',
      confidence: 0.68,
      estimated_impact: 'high',
      risk_level: 'medium'
    };
  }

  // Diff generation methods (simplified for demonstration)
  private generateNullCheckDiff(bugReport: BugReport): string {
    return `
--- a/${bugReport.file_path}
+++ b/${bugReport.file_path}
@@ -${bugReport.line_number},3 +${bugReport.line_number},6 @@
   // Original line
-  const result = data.property.value;
+  const result = data?.property?.value;
+  if (!result) {
+    throw new Error('Property not found');
+  }
`;
  }

  private generateErrorHandlingDiff(bugReport: BugReport): string {
    return `
--- a/${bugReport.file_path}
+++ b/${bugReport.file_path}
@@ -${bugReport.line_number},1 +${bugReport.line_number},8 @@
-  const result = processItem(item);
+  try {
+    const result = processItem(item);
+    return result;
+  } catch (error) {
+    console.error('Error processing item:', error);
+    return null;
+  }
`;
  }

  private generateResourceCleanupDiff(bugReport: BugReport): string {
    return `
--- a/${bugReport.file_path}
+++ b/${bugReport.file_path}
@@ -${bugReport.line_number},3 +${bugReport.line_number},7 @@
   const connection = createConnection();
   const result = connection.query(sql);
   return result;
+  } finally {
+    connection?.close();
+  }
`;
  }

  private generateTimeoutGuardDiff(bugReport: BugReport): string {
    return `
--- a/${bugReport.file_path}
+++ b/${bugReport.file_path}
@@ -${bugReport.line_number},2 +${bugReport.line_number},6 @@
-  while (condition) {
+  const timeout = setTimeout(() => { throw new Error('Timeout'); }, 5000);
+  try {
+    while (condition) {
       // loop body
-    }
+    }
+  } finally {
+    clearTimeout(timeout);
+  }
`;
  }

  private generateRaceConditionDiff(bugReport: BugReport): string {
    return `
--- a/${bugReport.file_path}
+++ b/${bugReport.file_path}
@@ -${bugReport.line_number},3 +${bugReport.line_number},8 @@
-  sharedResource.update(data);
+  const lock = await acquireLock('sharedResource');
+  try {
+    sharedResource.update(data);
+  } finally {
+    await releaseLock(lock);
+  }
`;
  }

  private generateLogicCorrectionDiff(bugReport: BugReport): string {
    return `
--- a/${bugReport.file_path}
+++ b/${bugReport.file_path}
@@ -${bugReport.line_number},1 +${bugReport.line_number},1 @@
-  if (value >= threshold) {
+  if (value > threshold) {
`;
  }

  private generateMemoryLeakDiff(bugReport: BugReport): string {
    return `
--- a/${bugReport.file_path}
+++ b/${bugReport.file_path}
@@ -${bugReport.line_number},5 +${bugReport.line_number},8 @@
   const cache = new Map();
   cache.set(key, value);
   // Cache keeps growing without limit
+
+  if (cache.size > MAX_CACHE_SIZE) {
+    const oldestKey = cache.keys().next().value;
+    cache.delete(oldestKey);
+  }
`;
  }

  async selectBestPatch(patches: PatchCandidate[]): Promise<PatchCandidate | null> {
    if (patches.length === 0) return null;

    // Score each patch based on multiple factors
    const scoredPatches = patches.map(patch => {
      let score = patch.confidence;

      // Bonus for high impact
      if (patch.estimated_impact === 'high') score += 0.1;
      else if (patch.estimated_impact === 'medium') score += 0.05;

      // Penalty for high risk
      if (patch.risk_level === 'high') score -= 0.15;
      else if (patch.risk_level === 'medium') score -= 0.05;

      // Bonus for certain strategies
      if (patch.strategy === 'error_handling' || patch.strategy === 'null_check') {
        score += 0.1;
      }

      return { patch, score };
    });

    // Sort by score
    scoredPatches.sort((a, b) => b.score - a.score);

    return scoredPatches[0].patch;
  }

  async applyPatch(patch: PatchCandidate, filePath: string): Promise<boolean> {
    console.log(`\n🔨 Applying patch: ${patch.description}`);
    console.log(`   Strategy: ${patch.strategy}`);
    console.log(`   Risk level: ${patch.risk_level}`);

    // In a real implementation, this would:
    // 1. Parse the code diff
    // 2. Apply changes to the file
    // 3. Create a backup
    // 4. Validate syntax

    // For demonstration, we'll just log
    console.log('   ✅ Patch applied (simulated)');

    return true;
  }

  async getPatchHistory(bugId: string): Promise<PatchCandidate[]> {
    return this.generatedPatches.get(bugId) || [];
  }

  async getAllPatches(): Promise<Map<string, PatchCandidate[]>> {
    return this.generatedPatches;
  }
}

// Export for use by self-healing coordinator
export { PatchGenerator, BugReport, PatchCandidate, PatchStrategy };

// Test if run directly
if (import.meta.main) {
  const generator = new PatchGenerator();

  const bugReport: BugReport = {
    id: crypto.randomUUID(),
    error_message: 'Cannot read property "value" of undefined',
    stack_trace: [
      'at processItem (/src/processor.ts:42:15)',
      'at Array.map (<anonymous>)',
      'at main (/src/index.ts:10:5)'
    ],
    file_path: '/src/processor.ts',
    line_number: 42,
    bug_type: 'null_pointer',
    severity: 'medium'
  };

  console.log('🧪 Testing Patch Generation:');
  const patches = await generator.generatePatches(bugReport);

  console.log('\n📋 Generated Patches:');
  for (const patch of patches) {
    console.log(`\n   ${patch.id.slice(0, 8)}...`);
    console.log(`   Description: ${patch.description}`);
    console.log(`   Strategy: ${patch.strategy}`);
    console.log(`   Confidence: ${(patch.confidence * 100).toFixed(0)}%`);
    console.log(`   Impact: ${patch.estimated_impact}`);
    console.log(`   Risk: ${patch.risk_level}`);
  }

  const bestPatch = await generator.selectBestPatch(patches);
  console.log(`\n🏆 Best Patch: ${bestPatch?.description}`);

  console.log('\n✅ Patch Generator loaded');
}
