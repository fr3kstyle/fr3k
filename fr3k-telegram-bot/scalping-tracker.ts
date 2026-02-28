#!/usr/bin/env bun
/**
 * PAI Scalping Trade Tracker
 * High-leverage scalping system with $1000 starting kitty
 * Tracks entries, TP/SL, fees, and continuous monitoring
 */

interface Trade {
  id: string;
  timestamp: number;
  pair: string;
  entryPrice: number;
  tp: number;
  sl: number;
  leverage: number;
  positionSize: number; // in USDT
  direction: 'LONG' | 'SHORT';
  status: 'PENDING' | 'ACTIVE' | 'TP_HIT' | 'SL_HIT' | 'MANUAL_CLOSE';
  exitPrice?: number;
  pnl?: number;
  fees?: number;
  netPnl?: number;
}

interface Portfolio {
  startingKitty: number;
  currentKitty: number;
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalFees: number;
  totalPnl: number;
}

class ScalpingTracker {
  private trades: Trade[] = [];
  private portfolio: Portfolio;
  private config = {
    maxPositionSize: 200, // 20% of $1000 kitty
    defaultLeverage: 20,
    feeRate: 0.00055, // Bybit taker fee
    riskPerTrade: 0.02 // 2% risk per trade
  };

  constructor(startingKitty: number = 1000) {
    this.portfolio = {
      startingKitty,
      currentKitty: startingKitty,
      totalTrades: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      totalFees: 0,
      totalPnl: 0
    };
    this.loadState();
  }

  async findTopScalpingOpportunities(): Promise<any[]> {
    console.log('🔍 Scanning for high-leverage scalping opportunities...');

    // TODO: Integrate with BEHEMOTH for real market data
    // For now, return mock structure

    const opportunities = [
      {
        pair: 'BTC/USDT',
        entry: 97500,
        tp: 98250,
        sl: 96800,
        leverage: 20,
        direction: 'LONG',
        confidence: 0.75,
        reason: 'Bounce from support, RSI oversold'
      },
      {
        pair: 'ETH/USDT',
        entry: 3250,
        tp: 3320,
        sl: 3180,
        leverage: 25,
        direction: 'LONG',
        confidence: 0.70,
        reason: 'ETH breakout confirmed'
      },
      {
        pair: 'SOL/USDT',
        entry: 245,
        tp: 255,
        sl: 238,
        leverage: 20,
        direction: 'LONG',
        confidence: 0.68,
        reason: 'Strong momentum'
      }
    ];

    return opportunities;
  }

  executeTrade(opportunity: any): Trade {
    const positionSize = Math.min(
      this.config.maxPositionSize,
      this.portfolio.currentKitty * this.config.riskPerTrade / this.config.defaultLeverage
    );

    const trade: Trade = {
      id: `TRADE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      pair: opportunity.pair,
      entryPrice: opportunity.entry,
      tp: opportunity.tp,
      sl: opportunity.sl,
      leverage: opportunity.leverage,
      positionSize,
      direction: opportunity.direction,
      status: 'ACTIVE'
    };

    this.trades.push(trade);
    this.saveState();

    this.logTradeExecution(trade, opportunity.reason);

    return trade;
  }

  async checkTradeStatus(trade: Trade, currentPrice: number): Promise<void> {
    if (trade.status !== 'ACTIVE') return;

    let hitTarget = false;
    let exitPrice: number;

    if (trade.direction === 'LONG') {
      if (currentPrice >= trade.tp) {
        hitTarget = true;
        exitPrice = trade.tp;
        trade.status = 'TP_HIT';
      } else if (currentPrice <= trade.sl) {
        hitTarget = false;
        exitPrice = trade.sl;
        trade.status = 'SL_HIT';
      }
    } else {
      if (currentPrice <= trade.tp) {
        hitTarget = true;
        exitPrice = trade.tp;
        trade.status = 'TP_HIT';
      } else if (currentPrice >= trade.sl) {
        hitTarget = false;
        exitPrice = trade.sl;
        trade.status = 'SL_HIT';
      }
    }

    if (trade.status !== 'ACTIVE') {
      trade.exitPrice = exitPrice;
      this.calculatePnL(trade);
      this.updatePortfolio(trade);
      this.logTradeExit(trade, hitTarget);
      this.saveState();
    }
  }

  private calculatePnL(trade: Trade): void {
    if (!trade.exitPrice) return;

    const priceDiff = trade.direction === 'LONG'
      ? trade.exitPrice - trade.entryPrice
      : trade.entryPrice - trade.exitPrice;

    const rawPnl = (priceDiff / trade.entryPrice) * trade.positionSize * trade.leverage;
    trade.fees = trade.positionSize * this.config.feeRate * 2; // entry + exit
    trade.pnl = rawPnl;
    trade.netPnl = rawPnl - trade.fees;
  }

  private updatePortfolio(trade: Trade): void {
    if (trade.netPnl === undefined) return;

    this.portfolio.currentKitty += trade.netPnl;
    this.portfolio.totalTrades++;
    this.portfolio.totalPnl += trade.pnl || 0;
    this.portfolio.totalFees += trade.fees || 0;

    if (trade.netPnl > 0) {
      this.portfolio.wins++;
    } else {
      this.portfolio.losses++;
    }

    this.portfolio.winRate = (this.portfolio.wins / this.portfolio.totalTrades) * 100;
  }

  private logTradeExecution(trade: Trade, reason: string): void {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 NEW TRADE EXECUTED');
    console.log('='.repeat(60));
    console.log(`ID:          ${trade.id}`);
    console.log(`Pair:        ${trade.pair}`);
    console.log(`Direction:   ${trade.direction}`);
    console.log(`Entry:       $${trade.entryPrice.toLocaleString()}`);
    console.log(`TP:          $${trade.tp.toLocaleString()} (+${((trade.tp / trade.entryPrice - 1) * 100).toFixed(2)}%)`);
    console.log(`SL:          $${trade.sl.toLocaleString()} (${((trade.sl / trade.entryPrice - 1) * 100).toFixed(2)}%)`);
    console.log(`Leverage:    ${trade.leverage}x`);
    console.log(`Position:    $${trade.positionSize.toFixed(2)} USDT`);
    console.log(`Reason:      ${reason}`);
    console.log('='.repeat(60) + '\n');
  }

  private logTradeExit(trade: Trade, hitTP: boolean): void {
    const emoji = hitTP ? '✅' : '❌';
    const result = hitTP ? 'TP HIT' : 'SL HIT';
    const pnlPercent = ((trade.netPnl! / trade.positionSize) * 100).toFixed(2);

    console.log('\n' + '='.repeat(60));
    console.log(`${emoji} TRADE CLOSED: ${result}`);
    console.log('='.repeat(60));
    console.log(`ID:          ${trade.id}`);
    console.log(`Pair:        ${trade.pair}`);
    console.log(`Entry:       $${trade.entryPrice.toLocaleString()}`);
    console.log(`Exit:        $${trade.exitPrice!.toLocaleString()}`);
    console.log(`Gross PnL:   $${(trade.pnl!).toFixed(2)} USDT`);
    console.log(`Fees:        $${trade.fees!.toFixed(2)} USDT`);
    console.log(`Net PnL:     $${trade.netPnl!.toFixed(2)} USDT (${pnlPercent}%)`);
    console.log('='.repeat(60) + '\n');
  }

  printPortfolioStatus(): void {
    console.log('\n' + '─'.repeat(60));
    console.log('📊 PORTFOLIO STATUS');
    console.log('─'.repeat(60));
    console.log(`Starting Kitty:  $${this.portfolio.startingKitty.toFixed(2)} USDT`);
    console.log(`Current Kitty:   $${this.portfolio.currentKitty.toFixed(2)} USDT`);
    console.log(`Total PnL:       $${this.portfolio.totalPnl.toFixed(2)} USDT`);
    console.log(`Total Fees:      $${this.portfolio.totalFees.toFixed(2)} USDT`);
    console.log(`Net PnL:         $${(this.portfolio.totalPnl - this.portfolio.totalFees).toFixed(2)} USDT`);
    console.log(`Total Trades:    ${this.portfolio.totalTrades}`);
    console.log(`Wins:            ${this.portfolio.wins}`);
    console.log(`Losses:          ${this.portfolio.losses}`);
    console.log(`Win Rate:        ${this.portfolio.winRate.toFixed(2)}%`);
    console.log(`ROI:             ${(((this.portfolio.currentKitty - this.portfolio.startingKitty) / this.portfolio.startingKitty) * 100).toFixed(2)}%`);
    console.log('─'.repeat(60) + '\n');
  }

  printActiveTrades(): void {
    const active = this.trades.filter(t => t.status === 'ACTIVE');

    if (active.length === 0) {
      console.log('\n✅ No active trades\n');
      return;
    }

    console.log('\n' + '─'.repeat(60));
    console.log('📈 ACTIVE TRADES');
    console.log('─'.repeat(60));

    active.forEach(trade => {
      const now = Date.now();
      const elapsed = Math.floor((now - trade.timestamp) / 1000 / 60);
      console.log(`${trade.pair} ${trade.direction} | Entry: $${trade.entryPrice} | ${elapsed}m ago | TP: $${trade.tp} | SL: $${trade.sl}`);
    });

    console.log('─'.repeat(60) + '\n');
  }

  printTradeHistory(): void {
    const completed = this.trades.filter(t => t.status !== 'PENDING' && t.status !== 'ACTIVE');

    if (completed.length === 0) {
      console.log('\n📝 No completed trades yet\n');
      return;
    }

    console.log('\n' + '─'.repeat(60));
    console.log('📜 TRADE HISTORY');
    console.log('─'.repeat(60));

    completed.slice(-10).forEach(trade => {
      const emoji = trade.status === 'TP_HIT' ? '✅' : '❌';
      const pnl = trade.netPnl ? `$${trade.netPnl.toFixed(2)}` : 'N/A';
      console.log(`${emoji} ${trade.pair} ${trade.direction} | PnL: ${pnl} | ${trade.status}`);
    });

    console.log('─'.repeat(60) + '\n');
  }

  private saveState(): void {
    const state = {
      trades: this.trades,
      portfolio: this.portfolio
    };

    Bun.write('/tmp/pai-scalping-state.json', JSON.stringify(state, null, 2));
  }

  private loadState(): void {
    try {
      const data = Bun.file('/tmp/pai-scalping-state.json').exists();
      if (data) {
        const state = JSON.parse(Bun.file('/tmp/pai-scalping-state.json').text());
        this.trades = state.trades || [];
        this.portfolio = state.portfolio || this.portfolio;
      }
    } catch (e) {
      console.log('📝 No existing state found, starting fresh');
    }
  }

  async runContinuousMonitoring(): Promise<void> {
    console.log('🔄 Starting continuous trade monitoring...\n');

    setInterval(() => {
      this.printActiveTrades();
      this.printPortfolioStatus();

      // TODO: Integrate with BEHEMOTH to check current prices
      // For now, this is where we'd check each active trade
    }, 60000); // Check every minute
  }
}

// Main execution
async function main() {
  const tracker = new ScalpingTracker(1000);

  console.log('\n🤖 PAI Scalping System v1.0');
  console.log('Starting Kitty: $1000 USDT\n');

  // Print current status
  tracker.printPortfolioStatus();
  tracker.printActiveTrades();
  tracker.printTradeHistory();

  // Find opportunities
  const opportunities = await tracker.findTopScalpingOpportunities();

  console.log('\n🎯 TOP 3 SCALPING OPPORTUNITIES:');
  console.log('─'.repeat(60));

  opportunities.slice(0, 3).forEach((opp, i) => {
    const reward = ((opp.tp / opp.entry - 1) * 100).toFixed(2);
    const risk = ((opp.entry / opp.sl - 1) * 100).toFixed(2);
    const rr = (parseFloat(reward) / parseFloat(risk)).toFixed(2);

    console.log(`\n${i + 1}. ${opp.pair} ${opp.direction}`);
    console.log(`   Entry: $${opp.entry.toLocaleString()}`);
    console.log(`   TP:    $${opp.tp.toLocaleString()} (+${reward}%)`);
    console.log(`   SL:    $${opp.sl.toLocaleString()} (-${risk}%)`);
    console.log(`   Leverage: ${opp.leverage}x`);
    console.log(`   R:R:    1:${rr}`);
    console.log(`   Confidence: ${opp.confidence * 100}%`);
    console.log(`   Reason: ${opp.reason}`);
  });

  console.log('\n' + '─'.repeat(60));

  // TODO: Execute trades when API keys are provided
  console.log('\n⚠️  Ready to execute trades once Bybit API keys are configured');
  console.log('    Run: npx fr3k-behemoth setup-keys\n');

  // Start monitoring
  await tracker.runContinuousMonitoring();
}

main();
