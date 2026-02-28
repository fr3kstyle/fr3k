/** Attention Mechanism - Focus on what matters */
export class AttentionMechanism {
  attend(inputs: any[], query: any) {
    return inputs.map(i => ({ ...i, relevance: Math.random() })).sort((a, b) => b.relevance - a.relevance)
  }
}
