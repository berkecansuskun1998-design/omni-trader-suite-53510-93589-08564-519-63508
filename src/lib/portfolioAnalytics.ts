import { supabase } from '@/integrations/supabase/client';

export interface Trade {
  id: string;
  userId: string;
  exchange: string;
  symbol: string;
  side: 'buy' | 'sell';
  entryPrice: number;
  exitPrice?: number;
  amount: number;
  entryTime: Date;
  exitTime?: Date;
  pnl?: number;
  pnlPercent?: number;
  fees: number;
  status: 'open' | 'closed';
}

export interface PortfolioPosition {
  symbol: string;
  exchange: string;
  amount: number;
  averageEntryPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  totalValue: number;
}

export interface PerformanceMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnL: number;
  totalPnLPercent: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  averageHoldTime: number;
  totalFees: number;
  netProfit: number;
}

export interface DailyPnL {
  date: Date;
  pnl: number;
  cumulativePnL: number;
  trades: number;
  winRate: number;
}

export interface TaxReport {
  year: number;
  totalGains: number;
  totalLosses: number;
  netGains: number;
  shortTermGains: number;
  longTermGains: number;
  trades: Array<{
    date: Date;
    symbol: string;
    type: 'short_term' | 'long_term';
    gain: number;
  }>;
  generatedAt: Date;
}

export class PortfolioAnalytics {
  private userId: string | null = null;

  async initialize(userId: string) {
    this.userId = userId;
  }

  async recordTrade(trade: Omit<Trade, 'id' | 'userId' | 'status'>): Promise<Trade> {
    if (!this.userId) throw new Error('User not initialized');

    const newTrade: Trade = {
      id: `trd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: this.userId,
      ...trade,
      status: trade.exitPrice ? 'closed' : 'open'
    };

    if (trade.exitPrice) {
      const priceDiff = trade.side === 'buy' 
        ? trade.exitPrice - trade.entryPrice 
        : trade.entryPrice - trade.exitPrice;
      
      newTrade.pnl = (priceDiff * trade.amount) - trade.fees;
      newTrade.pnlPercent = (priceDiff / trade.entryPrice) * 100;
    }

    await supabase.from('trades').insert({
      id: newTrade.id,
      user_id: newTrade.userId,
      exchange: newTrade.exchange,
      symbol: newTrade.symbol,
      side: newTrade.side,
      entry_price: newTrade.entryPrice,
      exit_price: newTrade.exitPrice,
      amount: newTrade.amount,
      entry_time: newTrade.entryTime.toISOString(),
      exit_time: newTrade.exitTime?.toISOString(),
      pnl: newTrade.pnl,
      pnl_percent: newTrade.pnlPercent,
      fees: newTrade.fees,
      status: newTrade.status
    });

    return newTrade;
  }

  async closeTrade(tradeId: string, exitPrice: number, exitTime: Date): Promise<Trade> {
    if (!this.userId) throw new Error('User not initialized');

    const { data: tradeData, error } = await supabase
      .from('trades')
      .select('*')
      .eq('id', tradeId)
      .eq('user_id', this.userId)
      .single();

    if (error || !tradeData) throw new Error('Trade not found');

    const priceDiff = tradeData.side === 'buy'
      ? exitPrice - tradeData.entry_price
      : tradeData.entry_price - exitPrice;

    const pnl = (priceDiff * tradeData.amount) - tradeData.fees;
    const pnlPercent = (priceDiff / tradeData.entry_price) * 100;

    await supabase
      .from('trades')
      .update({
        exit_price: exitPrice,
        exit_time: exitTime.toISOString(),
        pnl,
        pnl_percent: pnlPercent,
        status: 'closed'
      })
      .eq('id', tradeId);

    return {
      id: tradeData.id,
      userId: tradeData.user_id,
      exchange: tradeData.exchange,
      symbol: tradeData.symbol,
      side: tradeData.side,
      entryPrice: tradeData.entry_price,
      exitPrice,
      amount: tradeData.amount,
      entryTime: new Date(tradeData.entry_time),
      exitTime,
      pnl,
      pnlPercent,
      fees: tradeData.fees,
      status: 'closed'
    };
  }

  async getOpenPositions(): Promise<PortfolioPosition[]> {
    if (!this.userId) throw new Error('User not initialized');

    const { data: openTrades, error } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', this.userId)
      .eq('status', 'open');

    if (error) throw error;

    const positionsMap = new Map<string, PortfolioPosition>();

    for (const trade of openTrades || []) {
      const key = `${trade.exchange}_${trade.symbol}`;
      
      if (positionsMap.has(key)) {
        const pos = positionsMap.get(key)!;
        const totalAmount = pos.amount + trade.amount;
        pos.averageEntryPrice = 
          (pos.averageEntryPrice * pos.amount + trade.entry_price * trade.amount) / totalAmount;
        pos.amount = totalAmount;
      } else {
        positionsMap.set(key, {
          symbol: trade.symbol,
          exchange: trade.exchange,
          amount: trade.amount,
          averageEntryPrice: trade.entry_price,
          currentPrice: trade.entry_price,
          unrealizedPnL: 0,
          unrealizedPnLPercent: 0,
          totalValue: trade.entry_price * trade.amount
        });
      }
    }

    return Array.from(positionsMap.values());
  }

  async calculatePerformanceMetrics(startDate?: Date, endDate?: Date): Promise<PerformanceMetrics> {
    if (!this.userId) throw new Error('User not initialized');

    let query = supabase
      .from('trades')
      .select('*')
      .eq('user_id', this.userId)
      .eq('status', 'closed');

    if (startDate) {
      query = query.gte('entry_time', startDate.toISOString());
    }
    if (endDate) {
      query = query.lte('exit_time', endDate.toISOString());
    }

    const { data: trades, error } = await query;
    if (error) throw error;

    if (!trades || trades.length === 0) {
      return {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        totalPnL: 0,
        totalPnLPercent: 0,
        averageWin: 0,
        averageLoss: 0,
        largestWin: 0,
        largestLoss: 0,
        profitFactor: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        averageHoldTime: 0,
        totalFees: 0,
        netProfit: 0
      };
    }

    const totalTrades = trades.length;
    const winningTrades = trades.filter(t => (t.pnl || 0) > 0);
    const losingTrades = trades.filter(t => (t.pnl || 0) < 0);

    const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const totalFees = trades.reduce((sum, t) => sum + (t.fees || 0), 0);

    const grossProfit = winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0));

    const averageWin = winningTrades.length > 0 
      ? grossProfit / winningTrades.length 
      : 0;
    
    const averageLoss = losingTrades.length > 0 
      ? grossLoss / losingTrades.length 
      : 0;

    const largestWin = winningTrades.length > 0
      ? Math.max(...winningTrades.map(t => t.pnl || 0))
      : 0;

    const largestLoss = losingTrades.length > 0
      ? Math.min(...losingTrades.map(t => t.pnl || 0))
      : 0;

    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : 0;

    const returns = trades.map(t => t.pnl_percent || 0);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;

    let peak = 0;
    let maxDrawdown = 0;
    let cumulative = 0;

    for (const trade of trades.sort((a, b) => 
      new Date(a.entry_time).getTime() - new Date(b.entry_time).getTime()
    )) {
      cumulative += trade.pnl || 0;
      if (cumulative > peak) {
        peak = cumulative;
      }
      const drawdown = peak - cumulative;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    const totalHoldTime = trades.reduce((sum, t) => {
      if (t.exit_time) {
        return sum + (new Date(t.exit_time).getTime() - new Date(t.entry_time).getTime());
      }
      return sum;
    }, 0);

    const averageHoldTime = totalHoldTime / totalTrades / (1000 * 60 * 60);

    return {
      totalTrades,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: (winningTrades.length / totalTrades) * 100,
      totalPnL,
      totalPnLPercent: avgReturn,
      averageWin,
      averageLoss,
      largestWin,
      largestLoss,
      profitFactor,
      sharpeRatio,
      maxDrawdown,
      averageHoldTime,
      totalFees,
      netProfit: totalPnL - totalFees
    };
  }

  async getDailyPnL(startDate: Date, endDate: Date): Promise<DailyPnL[]> {
    if (!this.userId) throw new Error('User not initialized');

    const { data: trades, error } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', this.userId)
      .eq('status', 'closed')
      .gte('exit_time', startDate.toISOString())
      .lte('exit_time', endDate.toISOString())
      .order('exit_time', { ascending: true });

    if (error) throw error;

    const dailyMap = new Map<string, { pnl: number; trades: Trade[] }>();

    for (const trade of trades || []) {
      const dateKey = new Date(trade.exit_time).toISOString().split('T')[0];
      
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, { pnl: 0, trades: [] });
      }

      const day = dailyMap.get(dateKey)!;
      day.pnl += trade.pnl || 0;
      day.trades.push(trade as any);
    }

    let cumulativePnL = 0;
    const dailyPnL: DailyPnL[] = [];

    for (const [dateStr, data] of Array.from(dailyMap.entries()).sort()) {
      cumulativePnL += data.pnl;
      const winningTrades = data.trades.filter(t => (t.pnl || 0) > 0).length;
      
      dailyPnL.push({
        date: new Date(dateStr),
        pnl: data.pnl,
        cumulativePnL,
        trades: data.trades.length,
        winRate: data.trades.length > 0 ? (winningTrades / data.trades.length) * 100 : 0
      });
    }

    return dailyPnL;
  }

  async generateTaxReport(year: number): Promise<TaxReport> {
    if (!this.userId) throw new Error('User not initialized');

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    const { data: trades, error } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', this.userId)
      .eq('status', 'closed')
      .gte('exit_time', startDate.toISOString())
      .lte('exit_time', endDate.toISOString());

    if (error) throw error;

    let totalGains = 0;
    let totalLosses = 0;
    let shortTermGains = 0;
    let longTermGains = 0;

    const taxTrades: TaxReport['trades'] = [];

    for (const trade of trades || []) {
      const pnl = trade.pnl || 0;
      const holdTime = new Date(trade.exit_time).getTime() - new Date(trade.entry_time).getTime();
      const holdDays = holdTime / (1000 * 60 * 60 * 24);
      
      const isLongTerm = holdDays > 365;
      
      if (pnl > 0) {
        totalGains += pnl;
        if (isLongTerm) {
          longTermGains += pnl;
        } else {
          shortTermGains += pnl;
        }
      } else {
        totalLosses += Math.abs(pnl);
      }

      taxTrades.push({
        date: new Date(trade.exit_time),
        symbol: trade.symbol,
        type: isLongTerm ? 'long_term' : 'short_term',
        gain: pnl
      });
    }

    const report: TaxReport = {
      year,
      totalGains,
      totalLosses,
      netGains: totalGains - totalLosses,
      shortTermGains,
      longTermGains,
      trades: taxTrades,
      generatedAt: new Date()
    };

    await supabase.from('tax_reports').insert({
      user_id: this.userId,
      year,
      total_gains: totalGains,
      total_losses: totalLosses,
      net_gains: report.netGains,
      short_term_gains: shortTermGains,
      long_term_gains: longTermGains,
      generated_at: report.generatedAt.toISOString()
    });

    return report;
  }

  async getPortfolioValue(): Promise<number> {
    const positions = await this.getOpenPositions();
    return positions.reduce((sum, pos) => sum + pos.totalValue, 0);
  }

  async getPortfolioAllocation(): Promise<Array<{ asset: string; value: number; percentage: number }>> {
    const positions = await this.getOpenPositions();
    const totalValue = positions.reduce((sum, pos) => sum + pos.totalValue, 0);

    return positions.map(pos => ({
      asset: pos.symbol,
      value: pos.totalValue,
      percentage: totalValue > 0 ? (pos.totalValue / totalValue) * 100 : 0
    }));
  }
}

export const portfolioAnalytics = new PortfolioAnalytics();
