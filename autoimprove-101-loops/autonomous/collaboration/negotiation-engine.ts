/**
 * Negotiation Engine
 * Multi-agent negotiation system for resource and task allocation
 */

interface Proposal {
  id: string;
  proposer: string;
  task: string;
  offer: Record<string, any>;
  priority: number;
  timestamp: number;
}

interface Bid {
  agentId: string;
  proposalId: string;
  value: number;
  reasoning: string;
  constraints: string[];
}

interface NegotiationRound {
  proposalId: string;
  bids: Bid[];
  status: 'open' | 'closed' | 'failed';
  winner?: string;
  startTime: number;
}

export class NegotiationEngine {
  private proposals = new Map<string, Proposal>();
  private negotiationRounds = new Map<string, NegotiationRound>();
  private agentReputations = new Map<string, number>();
  private readonly NEGOTIATION_TIMEOUT = 30000; // 30 seconds

  submitProposal(proposer: string, task: string, offer: Record<string, any>, priority: number = 1): string {
    const proposal: Proposal = {
      id: `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      proposer,
      task,
      offer,
      priority,
      timestamp: Date.now()
    };

    this.proposals.set(proposal.id, proposal);
    this.initializeNegotiationRound(proposal.id);

    return proposal.id;
  }

  private initializeNegotiationRound(proposalId: string): void {
    const round: NegotiationRound = {
      proposalId,
      bids: [],
      status: 'open',
      startTime: Date.now()
    };

    this.negotiationRounds.set(proposalId, round);

    setTimeout(() => {
      this.closeNegotiation(proposalId);
    }, this.NEGOTIATION_TIMEOUT);
  }

  submitBid(agentId: string, proposalId: string, value: number, reasoning: string, constraints: string[] = []): void {
    const round = this.negotiationRounds.get(proposalId);
    if (!round || round.status !== 'open') {
      throw new Error(`Negotiation round ${proposalId} is not open`);
    }

    const bid: Bid = {
      agentId,
      proposalId,
      value: this.adjustBidByReputation(agentId, value),
      reasoning,
      constraints
    };

    round.bids.push(bid);
  }

  private adjustBidByReputation(agentId: string, value: number): number {
    const reputation = this.agentReputations.get(agentId) || 0.5;
    return value * (0.8 + (reputation * 0.4));
  }

  private closeNegotiation(proposalId: string): void {
    const round = this.negotiationRounds.get(proposalId);
    if (!round || round.status !== 'open') return;

    if (round.bids.length === 0) {
      round.status = 'failed';
      return;
    }

    const winner = this.selectWinner(round);
    round.winner = winner.agentId;
    round.status = 'closed';

    this.updateReputation(winner.agentId, true);

    round.bids.filter(b => b.agentId !== winner.agentId).forEach(bid => {
      this.updateReputation(bid.agentId, false);
    });
  }

  private selectWinner(round: NegotiationRound): Bid {
    const proposal = this.proposals.get(round.proposalId);
    if (!proposal) return round.bids[0];

    return round.bids
      .sort((a, b) => {
        const scoreA = this.calculateBidScore(a, proposal);
        const scoreB = this.calculateBidScore(b, proposal);
        return scoreB - scoreA;
      })[0];
  }

  private calculateBidScore(bid: Bid, proposal: Proposal): number {
    let score = bid.value;

    // Priority adjustment
    score *= (1 + (proposal.priority - 1) * 0.2);

    // Constraints penalty
    score *= (1 - (bid.constraints.length * 0.05));

    // Freshness bonus (earlier bids get slight bonus)
    const timeDiff = Date.now() - proposal.timestamp;
    score *= (1 + (10000 / (timeDiff + 10000)));

    return score;
  }

  private updateReputation(agentId: string, won: boolean): void {
    const current = this.agentReputations.get(agentId) || 0.5;
    const change = won ? 0.05 : -0.02;
    this.agentReputations.set(agentId, Math.max(0, Math.min(1, current + change)));
  }

  getNegotiationResult(proposalId: string): NegotiationRound | undefined {
    return this.negotiationRounds.get(proposalId);
  }

  getAgentReputation(agentId: string): number {
    return this.agentReputations.get(agentId) || 0.5;
  }

  multiAgentNegotiation(task: string, participants: string[], offers: Map<string, Record<string, any>>): string {
    const proposalId = this.submitProposal(
      'system',
      task,
      {},
      participants.length
    );

    participants.forEach(agentId => {
      const offer = offers.get(agentId) || {};
      const value = Object.values(offer).reduce((sum: number, v) => sum + (v as number), 0);
      this.submitBid(agentId, proposalId, value, `Offer from ${agentId}`);
    });

    this.closeNegotiation(proposalId);

    const result = this.negotiationRounds.get(proposalId);
    return result?.winner || '';
  }

  collaborativeDecision(task: string, options: string[], voters: string[]): { winner: string; consensus: number } {
    const votes = new Map<string, number>();

    voters.forEach(voter => {
      const preference = options[Math.floor(Math.random() * options.length)];
      votes.set(preference, (votes.get(preference) || 0) + 1);
    });

    const sortedVotes = Array.from(votes.entries()).sort((a, b) => b[1] - a[1]);
    const winner = sortedVotes[0][0];
    const consensus = sortedVotes[0][1] / voters.length;

    return { winner, consensus };
  }

  activeNegotiations(): NegotiationRound[] {
    return Array.from(this.negotiationRounds.values()).filter(r => r.status === 'open');
  }

  clearHistory(): void {
    const now = Date.now();
    for (const [id, round] of this.negotiationRounds) {
      if (round.status === 'closed' && now - round.startTime > 3600000) {
        this.negotiationRounds.delete(id);
        this.proposals.delete(id);
      }
    }
  }
}
