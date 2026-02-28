#!/usr/bin/env bun
/**
 * Research Agent - Specialized agent for literature review and knowledge synthesis
 *
 * Capabilities:
 * - Research paper analysis and synthesis
 * - Citation graph construction
 * - Knowledge extraction and summarization
 * - Trend detection in research literature
 */

interface ResearchPaper {
  id: string
  title: string
  authors: string[]
  abstract: string
  year: number
  citations: string[]
  keywords: string[]
  relevanceScore: number
}

interface SynthesisResult {
  topic: string
  paperCount: number
  keyFindings: string[]
  commonThemes: string[]
  researchGaps: string[]
  futureDirections: string[]
}

interface CitationGraph {
  nodes: Map<string, ResearchPaper>
  edges: Map<string, string[]>
  centrality: Map<string, number>
}

class ResearchAgent {
  private papers: Map<string, ResearchPaper> = new Map()
  private citationGraph: CitationGraph = {
    nodes: new Map(),
    edges: new Map(),
    centrality: new Map()
  }

  constructor() {
    console.log('📚 Initializing Research Agent...\n')
    console.log('✅ Research Agent ready')
    console.log('   Capabilities: literature review, synthesis, citation analysis')
  }

  /**
   * ANALYZE PAPER - Extract key information from research paper
   */
  async analyzePaper(paperContent: {
    title: string
    authors: string[]
    abstract: string
    year: number
    citations: string[]
  }): Promise<ResearchPaper> {
    console.log(`\n📖 Analyzing paper: "${paperContent.title}"`)

    const paper: ResearchPaper = {
      id: crypto.randomUUID(),
      title: paperContent.title,
      authors: paperContent.authors,
      abstract: paperContent.abstract,
      year: paperContent.year,
      citations: paperContent.citations,
      keywords: this.extractKeywords(paperContent.abstract),
      relevanceScore: 0.85 // Would be calculated in production
    }

    this.papers.set(paper.id, paper)
    this.citationGraph.nodes.set(paper.id, paper)
    this.citationGraph.edges.set(paper.id, paper.citations)

    console.log(`   ✓ Extracted ${paper.keywords.length} keywords`)
    console.log(`   ✓ Found ${paper.citations.length} citations`)

    return paper
  }

  private extractKeywords(abstract: string): string[] {
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'])
    const words = abstract.toLowerCase().split(/\W+/)
    const frequency = new Map<string, number>()

    for (const word of words) {
      if (word.length > 4 && !commonWords.has(word)) {
        frequency.set(word, (frequency.get(word) || 0) + 1)
      }
    }

    return [...frequency.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(e => e[0])
  }

  /**
   * SYNTHESIZE RESEARCH - Combine multiple papers into coherent overview
   */
  synthesizeResearch(topic: string, paperIds: string[]): SynthesisResult {
    console.log(`\n🔄 Synthesizing research on: ${topic}`)
    console.log(`   Analyzing ${paperIds.length} papers...`)

    const relevantPapers = paperIds
      .map(id => this.papers.get(id))
      .filter(p => p !== undefined) as ResearchPaper[]

    const keyFindings: string[] = []
    const allKeywords = new Map<string, number>()

    // Extract findings and keywords
    for (const paper of relevantPapers) {
      // Simulate extracting key findings from abstract
      const sentences = paper.abstract.split('. ')
      keyFindings.push(...sentences.slice(0, 2).map(s => s.trim()))

      for (const keyword of paper.keywords) {
        allKeywords.set(keyword, (allKeywords.get(keyword) || 0) + 1)
      }
    }

    // Find common themes (keywords appearing in multiple papers)
    const commonThemes = [...allKeywords.entries()]
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([keyword, _]) => keyword)

    // Identify research gaps (areas not covered)
    const researchGaps = this.identifyGaps(relevantPapers, commonThemes)

    // Suggest future directions
    const futureDirections = this.suggestDirections(relevantPapers, researchGaps)

    const result: SynthesisResult = {
      topic,
      paperCount: relevantPapers.length,
      keyFindings: keyFindings.slice(0, 5),
      commonThemes,
      researchGaps,
      futureDirections
    }

    console.log(`   ✓ Synthesis complete`)
    console.log(`   Key findings: ${result.keyFindings.length}`)
    console.log(`   Common themes: ${result.commonThemes.length}`)
    console.log(`   Research gaps: ${result.researchGaps.length}`)

    return result
  }

  private identifyGaps(papers: ResearchPaper[], themes: string[]): string[] {
    const gaps: string[] = []

    // Simulate gap detection
    if (!themes.includes('scalability')) {
      gaps.push('Scalability of proposed methods not thoroughly evaluated')
    }

    if (!themes.includes('security')) {
      gaps.push('Security implications not adequately addressed')
    }

    if (!themes.includes('real-world')) {
      gaps.push('Lack of real-world deployment validation')
    }

    // Check for recent developments
    const latestYear = Math.max(...papers.map(p => p.year))
    if (latestYear < 2025) {
      gaps.push('Research may not incorporate latest 2025-2026 developments')
    }

    return gaps
  }

  private suggestDirections(papers: ResearchPaper[], gaps: string[]): string[] {
    const directions: string[] = []

    for (const gap of gaps) {
      directions.push(`Address: ${gap}`)
    }

    // Add directional suggestions based on trends
    directions.push('Extend research to larger-scale systems')
    directions.push('Incorporate multi-modal learning approaches')
    directions.push('Investigate energy-efficient implementations')

    return directions.slice(0, 5)
  }

  /**
   * COMPUTE CITATION IMPACT - Calculate paper influence
   */
  computeCitationImpact(paperId: string): {
    citationCount: number
    centrality: number
    hIndex: number
  } {
    const paper = this.papers.get(paperId)
    if (!paper) {
      throw new Error('Paper not found')
    }

    // Count direct citations
    let citationCount = 0
    for (const [_, citations] of this.citationGraph.edges) {
      if (citations.includes(paperId)) {
        citationCount++
      }
    }

    // Calculate centrality (simplified PageRank)
    const centrality = this.calculateCentrality(paperId)

    // Calculate h-index (papers with h citations each)
    const allCitations = [...this.papers.values()].map(p =>
      [...this.citationGraph.edges.values()].filter(c => c.includes(p.id)).length
    )
    const hIndex = this.calculateHIndex(allCitations)

    return { citationCount, centrality, hIndex }
  }

  private calculateCentrality(paperId: string): number {
    let centrality = 0

    // Count incoming citations
    for (const [_, citations] of this.citationGraph.edges) {
      if (citations.includes(paperId)) {
        centrality++
      }
    }

    // Add value based on citing papers' centrality (recursive)
    for (const [id, citations] of this.citationGraph.edges) {
      if (citations.includes(paperId)) {
        centrality += (this.citationGraph.centrality.get(id) || 0) * 0.5
      }
    }

    this.citationGraph.centrality.set(paperId, centrality)
    return centrality
  }

  private calculateHIndex(citations: number[]): number {
    const sorted = [...citations].sort((a, b) => b - a)
    let hIndex = 0

    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i] >= i + 1) {
        hIndex = i + 1
      } else {
        break
      }
    }

    return hIndex
  }

  /**
   * FIND TRENDING TOPICS - Detect emerging research areas
   */
  findTrendingTopics(yearRange: [number, number] = [2024, 2026]): {
    topic: string
    growth: number
    papers: number
  }[] {
    console.log(`\n📈 Finding trending topics (${yearRange[0]}-${yearRange[1]})`)

    const relevantPapers = [...this.papers.values()].filter(
      p => p.year >= yearRange[0] && p.year <= yearRange[1]
    )

    const topicFrequency = new Map<string, { count: number; trend: number }>()

    for (const paper of relevantPapers) {
      for (const keyword of paper.keywords) {
        const current = topicFrequency.get(keyword) || { count: 0, trend: 0 }
        topicFrequency.set(keyword, {
          count: current.count + 1,
          trend: current.trend + (paper.year - 2024) // Weight recent papers higher
        })
      }
    }

    const trending = [...topicFrequency.entries()]
      .filter(([_, data]) => data.count >= 2)
      .sort((a, b) => b[1].trend - a[1].trend)
      .slice(0, 10)
      .map(([topic, data]) => ({
        topic,
        growth: data.trend / data.count,
        papers: data.count
      }))

    console.log(`   ✓ Found ${trending.length} trending topics`)

    for (const t of trending.slice(0, 5)) {
      console.log(`      • ${t.topic}: ${t.papers} papers, ${(t.growth * 100).toFixed(1)}% growth`)
    }

    return trending
  }

  getMetrics() {
    return {
      papersAnalyzed: this.papers.size,
      citationGraphSize: this.citationGraph.nodes.size,
      totalCitations: [...this.citationGraph.edges.values()].reduce((sum, c) => sum + c.length, 0)
    }
  }
}

export { ResearchAgent, ResearchPaper, SynthesisResult, CitationGraph }

if (import.meta.main) {
  console.log('🧪 Research Agent Test\n')

  const agent = new ResearchAgent()

  // Add sample papers
  const papers = [
    {
      title: 'Swarm Intelligence for Multi-Agent Systems',
      authors: ['Smith, J.', 'Doe, A.'],
      abstract: 'This paper presents novel swarm intelligence techniques for coordinating multi-agent systems. Our approach achieves 40% improvement in coordination efficiency.',
      year: 2025,
      citations: []
    },
    {
      title: 'Recursive Self-Improvement in AI Systems',
      authors: ['Johnson, M.', 'Williams, R.'],
      abstract: 'We demonstrate a framework for autonomous AI self-improvement. The system shows continuous learning and adaptation over time.',
      year: 2026,
      citations: []
    },
    {
      title: 'Hierarchical Agent Coordination',
      authors: ['Brown, S.', 'Lee, K.'],
      abstract: 'A hierarchical approach to agent coordination that scales to thousands of agents. Performance improves linearly with agent count.',
      year: 2025,
      citations: []
    }
  ]

  // Analyze papers
  for (const paper of papers) {
    agent.analyzePaper(paper)
  }

  // Test synthesis
  const synthesis = agent.synthesizeResearch('multi-agent systems', [...agent.papers.keys()])

  // Test trending topics
  const trending = agent.findTrendingTopics([2024, 2026])

  // Test citation impact
  if (agent.papers.size > 0) {
    const impact = agent.computeCitationImpact([...agent.papers.keys()][0])
    console.log(`\nImpact: citations=${impact.citationCount}, h-index=${impact.hIndex}`)
  }

  console.log('\n✅ Research Agent loaded')
}
