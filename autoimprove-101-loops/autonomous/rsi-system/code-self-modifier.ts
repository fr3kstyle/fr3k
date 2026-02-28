#!/usr/bin/env bun
/**
 * Code Self-Modifier - AI rewrites its own code
 *
 * Capability: Direct code manipulation and optimization
 */

interface CodeModification {
  filePath: string
  operation: 'replace' | 'insert' | 'delete' | 'refactor'
  target: string
  replacement: string
  confidence: number
}

class CodeSelfModifier {
  private modifications: CodeModification[] = []
  private rollbackStack: Map<string, string[]> = new Map()

  /**
   * GENERATE_OPTIMIZATION - AI suggests code improvements
   */
  async generateOptimization(code: string): Promise<CodeModification[]> {
    const optimizations: CodeModification[] = []

    // Pattern: Async/await optimization
    if (code.includes('.then(') && !code.includes('await')) {
      optimizations.push({
        filePath: 'auto-detected',
        operation: 'refactor',
        target: '.then(',
        replacement: 'await ',
        confidence: 0.9
      })
    }

    // Pattern: Const correctness
    if (code.includes('let ') && code.includes('let ') && !code.includes('const ')) {
      optimizations.push({
        filePath: 'auto-detected',
        operation: 'replace',
        target: 'let ',
        replacement: 'const ',
        confidence: 0.85
      })
    }

    // Pattern: Template literals
    if (code.includes("' + ") || code.includes('" + "')) {
      optimizations.push({
        filePath: 'auto-detected',
        operation: 'refactor',
        target: '" + "',
        replacement: '`',
        confidence: 0.8
      })
    }

    // Pattern: Nullish coalescing
    if (code.includes('|| null') || code.includes('|| undefined')) {
      optimizations.push({
        filePath: 'auto-detected',
        operation: 'replace',
        target: '|| undefined',
        replacement: '?? ',
        confidence: 0.95
      })
    }

    // Pattern: Optional chaining
    if (code.includes('&& ') && code.includes('.nil') === false) {
      optimizations.push({
        filePath: 'auto-detected',
        operation: 'replace',
        target: '&& ',
        replacement: '?.',
        confidence: 0.88
      })
    }

    return optimizations
  }

  /**
   * APPLY_MODIFICATION - Safely modify code
   */
  async applyModification(code: string, mod: CodeModification): Promise<{
    success: boolean
    newCode: string
    changes: number
  }> {
    // Save original for rollback
    const original = code

    try {
      let newCode = code
      let changes = 0

      switch (mod.operation) {
        case 'replace':
          const regex = new RegExp(this.escapeRegex(mod.target), 'g')
          newCode = code.replace(regex, mod.replacement)
          changes = (code.match(regex) || []).length
          break

        case 'insert':
          // Insert at position
          const insertPos = code.indexOf(mod.target)
          if (insertPos >= 0) {
            newCode = code.slice(0, insertPos) + mod.replacement + code.slice(insertPos)
            changes = 1
          }
          break

        case 'delete':
          newCode = code.replace(mod.target, '')
          changes = 1
          break

        case 'refactor':
          // More complex refactoring
          newCode = await this.refactorCode(code, mod)
          changes = 1
          break
      }

      // Validate the change
      if (this.validateChange(newCode)) {
        // Save to rollback stack
        if (!this.rollbackStack.has(mod.filePath)) {
          this.rollbackStack.set(mod.filePath, [])
        }
        this.rollbackStack.get(mod.filePath)!.push(original)

        this.modifications.push(mod)

        return {
          success: true,
          newCode,
          changes
        }
      } else {
        return {
          success: false,
          newCode: code,
          changes: 0
        }
      }

    } catch (error) {
      console.log(`Modification failed: ${(error as Error).message}`)
      return {
        success: false,
        newCode: code,
        changes: 0
      }
    }
  }

  /**
   * REFACTOR_CODE - Intelligent code refactoring
   */
  private async refactorCode(code: string, mod: CodeModification): Promise<string> {
    // Complex refactoring logic
    let refactored = code

    // Extract function refactoring
    if (code.length > 500 && mod.target === 'extract-function') {
      const functions = this.identifyExtractableFunctions(code)
      for (const func of functions) {
        const extracted = this.extractFunction(code, func)
        refactored = refactored.replace(func.code, extracted.call)
      }
    }

    return refactored
  }

  /**
   * IDENTIFY_EXTRACTABLE_FUNCTIONS
   */
  private identifyExtractableFunctions(code: string): Array<{
    name: string
    code: string
    start: number
    end: number
  }> {
    // Find repeated code patterns that could be functions
    const functions: any[] = []

    // Simplified: find code blocks >20 lines
    const lines = code.split('\n')
    let currentBlock: string[] = []
    let blockStart = 0

    for (let i = 0; i < lines.length; i++) {
      currentBlock.push(lines[i])

      if (currentBlock.length > 20 && (lines[i].includes('return') || lines[i].includes('}'))) {
        functions.push({
          name: `extracted_${functions.length}`,
          code: currentBlock.join('\n'),
          start: blockStart,
          end: i
        })
        currentBlock = []
        blockStart = i + 1
      }
    }

    return functions
  }

  /**
   * EXTRACT_FUNCTION
   */
  private extractFunction(fullCode: string, func: any): {
    name: string
    call: string
  } {
    const name = `extractedFunction_${Date.now()}`
    const params = this.identifyParameters(func.code)

    return {
      name,
      call: `${name}(${params})`
    }
  }

  /**
   * IDENTIFY_PARAMETERS
   */
  private identifyParameters(code: string): string {
    // Find variables used in the code block
    const vars = code.match(/const (\w+)/g) || []
    const uniqueVars = [...new Set(vars.map(v => v.replace('const ', '')))]

    return uniqueVars.slice(0, 3).join(', ')
  }

  /**
   * VALIDATE_CHANGE - Ensure modification is safe
   */
  private validateChange(code: string): boolean {
    // Syntax validation
    try {
      // Basic checks
      if (code.match(/[{]/g)?.length !== code.match(/}]/g)?.length) {
        return false // Unmatched braces
      }

      if (code.match(/\(/g)?.length !== code.match(/\)/g)?.length) {
        return false // Unmatched parens
      }

      // Check for obviously broken code
      if (code.includes('undefined;')) {
        return false
      }

      return true
    } catch {
      return false
    }
  }

  /**
   * ROLLBACK - Undo last modification
   */
  rollback(filePath: string): boolean {
    const history = this.rollbackStack.get(filePath)
    if (!history || history.length === 0) {
      return false
    }

    history.pop()
    return true
  }

  /**
   * BATCH_MODIFY - Apply multiple optimizations
   */
  async batchModify(code: string, modifications: CodeModification[]): Promise<{
    success: number
    failed: number
    finalCode: string
  }> {
    let currentCode = code
    let successCount = 0
    let failCount = 0

    for (const mod of modifications) {
      const result = await this.applyModification(currentCode, mod)

      if (result.success) {
        currentCode = result.newCode
        successCount++
      } else {
        failCount++
      }
    }

    return {
      success: successCount,
      failed: failCount,
      finalCode: currentCode
    }
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  getModificationHistory(): CodeModification[] {
    return [...this.modifications]
  }
}

// Export
export { CodeSelfModifier, CodeModification }

// Test
if (import.meta.main) {
  console.log('🧪 Code Self-Modifier Test\n')

  const modifier = new CodeSelfModifier()

  const testCode = `
let result = data && data.value || null
if (users.length > 0) {
  let name = users[0].name + " " + users[0].lastName
}
const value = getValue(data) || undefined
`

  console.log('Original code:')
  console.log(testCode)

  const optimizations = await modifier.generateOptimization(testCode)
  console.log(`\n✓ Generated ${optimizations.length} optimizations`)

  const result = await modifier.batchModify(testCode, optimizations)
  console.log(`\n📊 Results: ${result.success} successful, ${result.failed} failed`)

  console.log('\n✅ Code Self-Modifier loaded')
}
