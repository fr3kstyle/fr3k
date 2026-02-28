#!/usr/bin/env bun
/**
 * Sandbox Validator - Safe testing environment for patch validation
 * Validates patches in isolated environment before deployment
 */

interface PatchTestCase {
  name: string;
  input: any;
  expected_output: any;
  timeout_ms: number;
}

interface ValidationResult {
  patch_id: string;
  passed: boolean;
  test_results: {
    name: string;
    passed: boolean;
    error?: string;
    execution_time_ms: number;
  }[];
  performance_regression: boolean;
  memory_leak_detected: boolean;
  safety_score: number;        // 0-100
  overall_confidence: number;   // 0-1
}

class SandboxValidator {
  private validationHistory: Map<string, ValidationResult[]> = new Map();
  private baselineMetrics: Map<string, { avg_time: number; max_memory: number }> = new Map();

  async validatePatch(
    patchId: string,
    originalCode: string,
    patchedCode: string,
    testCases: PatchTestCase[]
  ): Promise<ValidationResult> {
    console.log(`\n🧪 Validating patch ${patchId.slice(0, 8)}...`);
    console.log(`   Test cases: ${testCases.length}`);

    const startTime = Date.now();
    const testResults: ValidationResult['test_results'] = [];

    // Run test cases on patched code
    for (const testCase of testCases) {
      const result = await this.runTestCase(testCase, patchedCode);
      testResults.push(result);
    }

    // Check for performance regression
    const performanceRegression = await this.checkPerformanceRegression(patchId, testResults);

    // Check for memory leaks
    const memoryLeakDetected = await this.checkMemoryLeaks(patchedCode, testCases);

    // Calculate safety score
    const safetyScore = this.calculateSafetyScore(testResults, performanceRegression, memoryLeakDetected);

    // Calculate overall confidence
    const passRate = testResults.filter(r => r.passed).length / testResults.length;
    const overallConfidence = (passRate * 0.6) + (safetyScore / 100 * 0.4);

    const result: ValidationResult = {
      patch_id: patchId,
      passed: passRate >= 0.8 && !performanceRegression && !memoryLeakDetected,
      test_results: testResults,
      performance_regression: performanceRegression,
      memory_leak_detected: memoryLeakDetected,
      safety_score: safetyScore,
      overall_confidence: overallConfidence
    };

    // Store in history
    if (!this.validationHistory.has(patchId)) {
      this.validationHistory.set(patchId, []);
    }
    this.validationHistory.get(patchId)!.push(result);

    const duration = Date.now() - startTime;
    console.log(`   ✅ Validation complete (${duration}ms)`);
    console.log(`   Pass rate: ${(passRate * 100).toFixed(0)}%`);
    console.log(`   Safety score: ${safetyScore.toFixed(0)}/100`);
    console.log(`   Overall: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);

    return result;
  }

  private async runTestCase(testCase: PatchTestCase, code: string): Promise<{
    name: string;
    passed: boolean;
    error?: string;
    execution_time_ms: number;
  }> {
    const startTime = Date.now();

    try {
      // Create isolated execution context
      const context = this.createIsolatedContext(code);

      // Execute with timeout
      const result = await this.executeWithTimeout(context, testCase.input, testCase.timeout_ms);

      const executionTime = Date.now() - startTime;

      // Validate output
      const passed = this.deepEquals(result, testCase.expected_output);

      return {
        name: testCase.name,
        passed,
        execution_time_ms: executionTime
      };
    } catch (error) {
      return {
        name: testCase.name,
        passed: false,
        error: (error as Error).message,
        execution_time_ms: Date.now() - startTime
      };
    }
  }

  private createIsolatedContext(code: string): any {
    // In a real implementation, this would create a truly isolated sandbox
    // using vm2, worker threads, or containers

    // For demonstration, we'll create a function with limited scope
    try {
      // Remove any imports that could escape sandbox
      const sanitizedCode = code
        .replace(/import\s+.*\s+from\s+['"][^'"]+['"]/g, '// import removed')
        .replace(/require\s*\(['"][^'"]+['"]\)/g, '/* require removed */');

      // Create function in isolated scope
      const fn = new Function('input', `
        'use strict';
        ${sanitizedCode}
        return typeof process !== 'undefined' ? process.exitCode : undefined;
      `);

      return fn;
    } catch (error) {
      throw new Error(`Failed to create isolated context: ${(error as Error).message}`);
    }
  }

  private async executeWithTimeout(context: any, input: any, timeoutMs: number): Promise<any> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Execution timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      try {
        const result = context(input);
        clearTimeout(timer);
        resolve(result);
      } catch (error) {
        clearTimeout(timer);
        reject(error);
      }
    });
  }

  private async checkPerformanceRegression(
    patchId: string,
    testResults: ValidationResult['test_results'][]
  ): Promise<boolean> {
    // Calculate average execution time
    const avgTime = testResults.reduce((sum, r) => sum + r.execution_time_ms, 0) / testResults.length;

    // Get baseline (if available)
    const baseline = this.baselineMetrics.get(patchId);

    if (!baseline) {
      // Establish baseline
      this.baselineMetrics.set(patchId, { avg_time: avgTime, max_memory: 0 });
      return false;
    }

    // Check if performance degraded by more than 20%
    const regression = avgTime > baseline.avg_time * 1.2;

    if (regression) {
      console.log(`   ⚠️ Performance regression detected: ${avgTime.toFixed(0)}ms vs baseline ${baseline.avg_time.toFixed(0)}ms`);
    }

    return regression;
  }

  private async checkMemoryLeaks(code: string, testCases: PatchTestCase[]): Promise<boolean> {
    // In a real implementation, this would:
    // 1. Run code multiple times
    // 2. Monitor memory usage
    // 3. Check for continuous growth

    // For demonstration, we'll do a basic check for common leak patterns
    const leakPatterns = [
      /setInterval\([^)]*\)\s*(?!.*clearInterval)/,
      /addEventListener\([^)]*\)\s*(?!.*removeEventListener)/,
      /new Map\(\)\s*(?!.*\.clear)/,
      /new Set\(\)\s*(?!.*\.clear)/
    ];

    for (const pattern of leakPatterns) {
      if (pattern.test(code)) {
        console.log('   ⚠️ Potential memory leak pattern detected');
        return true;
      }
    }

    return false;
  }

  private calculateSafetyScore(
    testResults: ValidationResult['test_results'][],
    performanceRegression: boolean,
    memoryLeakDetected: boolean
  ): number {
    let score = 100;

    // Deduct for failed tests
    const failedTests = testResults.filter(r => !r.passed).length;
    score -= failedTests * 10;

    // Deduct for performance regression
    if (performanceRegression) score -= 20;

    // Deduct for memory leaks
    if (memoryLeakDetected) score -= 30;

    return Math.max(0, score);
  }

  private deepEquals(a: any, b: any): boolean {
    if (a === b) return true;

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((item, i) => this.deepEquals(item, b[i]));
    }

    if (typeof a === 'object' && typeof b === 'object' && a !== null && b !== null) {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);

      if (keysA.length !== keysB.length) return false;

      return keysA.every(key => this.deepEquals(a[key], b[key]));
    }

    return false;
  }

  async getValidationHistory(patchId: string): Promise<ValidationResult[]> {
    return this.validationHistory.get(patchId) || [];
  }

  async setBaseline(patchId: string, avgTime: number, maxMemory: number): Promise<void> {
    this.baselineMetrics.set(patchId, { avg_time: avgTime, max_memory: maxMemory });
  }
}

// Export for use by self-healing coordinator
export { SandboxValidator, PatchTestCase, ValidationResult };

// Test if run directly
if (import.meta.main) {
  const validator = new SandboxValidator();

  const patchId = crypto.randomUUID();
  const originalCode = 'function processData(data) { return data.map(x => x * 2); }';
  const patchedCode = 'function processData(data) { if (!data) throw new Error("No data"); return data.map(x => x * 2); }';

  const testCases: PatchTestCase[] = [
    {
      name: 'Valid input',
      input: [1, 2, 3],
      expected_output: [2, 4, 6],
      timeout_ms: 1000
    },
    {
      name: 'Null input',
      input: null,
      expected_output: null, // Expected to throw
      timeout_ms: 1000
    }
  ];

  console.log('🧪 Testing Sandbox Validation:');
  const result = await validator.validatePatch(patchId, originalCode, patchedCode, testCases);

  console.log('\n📋 Validation Result:');
  console.log(`   Passed: ${result.passed}`);
  console.log(`   Safety Score: ${result.safety_score}/100`);
  console.log(`   Confidence: ${(result.overall_confidence * 100).toFixed(0)}%`);
  console.log(`   Performance Regression: ${result.performance_regression}`);
  console.log(`   Memory Leak: ${result.memory_leak_detected}`);

  console.log('\n✅ Sandbox Validator loaded');
}
