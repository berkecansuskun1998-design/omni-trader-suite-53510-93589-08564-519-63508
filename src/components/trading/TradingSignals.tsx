import { TrendingUp, TrendingDown, Zap, AlertTriangle, CheckCircle } from 'lucide-react';
import { Candle } from '@/types/trading';
import { calcRSI, calcMACD } from '@/lib/indicators';

interface TradingSignalsProps {
  candles: Candle[];
  symbol: string;
}

export function TradingSignals({ candles, symbol }: TradingSignalsProps) {
  if (candles.length < 50) {
    return (
      <div className="relative overflow-hidden rounded-2xl border-2 border-primary/25 bg-gradient-to-br from-card to-card/70 p-6 backdrop-blur-xl animate-fade-in">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 ring-2 ring-primary/40 animate-pulse">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="text-sm font-black text-foreground uppercase tracking-wide">AI Signal Engine</h4>
            <p className="text-[9px] text-muted-foreground font-mono">Initializing advanced indicators...</p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 text-sm text-primary">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="font-mono font-medium">Analyzing market data</span>
        </div>
      </div>
    );
  }

  const closes = candles.map(c => c.y[3]);
  const rsi = calcRSI(closes, 14);
  const macd = calcMACD(closes);
  
  const currentRSI = rsi[rsi.length - 1];
  const currentMACD = macd.macd[macd.macd.length - 1];
  const currentSignal = macd.signal[macd.signal.length - 1];
  const currentPrice = closes[closes.length - 1];
  const prevPrice = closes[closes.length - 2];

  const signals = [];

  // RSI Signals
  if (currentRSI !== null) {
    if (currentRSI < 30) {
      signals.push({
        type: 'BUY',
        indicator: 'RSI',
        message: 'Oversold condition',
        strength: 'STRONG',
        value: currentRSI.toFixed(2),
      });
    } else if (currentRSI > 70) {
      signals.push({
        type: 'SELL',
        indicator: 'RSI',
        message: 'Overbought condition',
        strength: 'STRONG',
        value: currentRSI.toFixed(2),
      });
    } else if (currentRSI < 40) {
      signals.push({
        type: 'BUY',
        indicator: 'RSI',
        message: 'Approaching oversold',
        strength: 'MODERATE',
        value: currentRSI.toFixed(2),
      });
    } else if (currentRSI > 60) {
      signals.push({
        type: 'SELL',
        indicator: 'RSI',
        message: 'Approaching overbought',
        strength: 'MODERATE',
        value: currentRSI.toFixed(2),
      });
    }
  }

  // MACD Signals
  if (currentMACD !== null && currentSignal !== null) {
    const prevMACD = macd.macd[macd.macd.length - 2];
    const prevSignal = macd.signal[macd.signal.length - 2];
    
    if (prevMACD !== null && prevSignal !== null) {
      // Bullish crossover
      if (prevMACD < prevSignal && currentMACD > currentSignal) {
        signals.push({
          type: 'BUY',
          indicator: 'MACD',
          message: 'Bullish crossover',
          strength: 'STRONG',
          value: 'Cross Up',
        });
      }
      // Bearish crossover
      if (prevMACD > prevSignal && currentMACD < currentSignal) {
        signals.push({
          type: 'SELL',
          indicator: 'MACD',
          message: 'Bearish crossover',
          strength: 'STRONG',
          value: 'Cross Down',
        });
      }
    }
  }

  // Trend Signals
  const trend = currentPrice > prevPrice ? 'UP' : 'DOWN';
  const momentum = Math.abs(((currentPrice - prevPrice) / prevPrice) * 100);
  
  if (momentum > 0.5) {
    signals.push({
      type: trend === 'UP' ? 'BUY' : 'SELL',
      indicator: 'MOMENTUM',
      message: `Strong ${trend.toLowerCase()}ward movement`,
      strength: momentum > 1 ? 'STRONG' : 'MODERATE',
      value: `${momentum.toFixed(2)}%`,
    });
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-primary/25 bg-gradient-to-br from-card via-card/80 to-card/60 p-6 shadow-2xl shadow-primary/10 backdrop-blur-2xl animate-fade-in">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-60" />
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/8 rounded-full blur-3xl animate-pulse" />
      
      <div className="relative z-10 mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 ring-2 ring-primary/40 shadow-lg shadow-primary/25">
            <Zap className="h-5 w-5 text-primary animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-black text-foreground uppercase tracking-wide">AI Signal Matrix</h4>
            <p className="text-[9px] text-muted-foreground font-mono">Real-time algorithmic analysis</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/15 ring-1 ring-primary/30">
          <div className="h-2 w-2 rounded-full bg-primary animate-breathe shadow-lg shadow-primary/50" />
          <span className="text-xs font-black text-primary">{signals.length} ACTIVE</span>
        </div>
      </div>

      <div className="relative z-10 space-y-3">
        {signals.length === 0 ? (
          <div className="flex items-center justify-center gap-3 rounded-xl border-2 border-dashed border-muted/30 bg-muted/10 p-6 backdrop-blur-xl">
            <CheckCircle className="h-5 w-5 text-success" />
            <span className="text-sm font-medium text-muted-foreground">No strong signals detected - Market in neutral state</span>
          </div>
        ) : (
          signals.map((signal, idx) => {
            const isBuy = signal.type === 'BUY';
            const isStrong = signal.strength === 'STRONG';
            
            return (
              <div
                key={idx}
                className={`group relative overflow-hidden rounded-xl border-2 p-4 transition-all duration-500 hover:scale-[1.02] animate-fade-in-up ${
                  isBuy
                    ? 'border-success/40 bg-gradient-to-br from-success/15 to-success/5 hover:border-success/60 hover:shadow-2xl hover:shadow-success/25'
                    : 'border-destructive/40 bg-gradient-to-br from-destructive/15 to-destructive/5 hover:border-destructive/60 hover:shadow-2xl hover:shadow-destructive/25'
                }`}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-current to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-10`} />
                <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent ${isBuy ? 'via-success' : 'via-destructive'} to-transparent opacity-50`} />
                
                <div className="relative z-10 flex items-start gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ring-2 shadow-lg ${
                    isBuy 
                      ? 'bg-success/20 ring-success/40 shadow-success/25' 
                      : 'bg-destructive/20 ring-destructive/40 shadow-destructive/25'
                  }`}>
                    {isBuy ? (
                      <TrendingUp className={`h-6 w-6 ${isStrong ? 'text-success animate-pulse' : 'text-success/80'}`} />
                    ) : (
                      <TrendingDown className={`h-6 w-6 ${isStrong ? 'text-destructive animate-pulse' : 'text-destructive/80'}`} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`font-mono text-base font-black uppercase tracking-wider ${
                        isBuy ? 'text-success' : 'text-destructive'
                      }`}>
                        {signal.type}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs font-black text-foreground uppercase tracking-wide">
                        {signal.indicator}
                      </span>
                      {isStrong && (
                        <>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-primary/20 text-xs font-black text-primary ring-1 ring-primary/40">
                            <AlertTriangle className="h-3 w-3 animate-pulse" />
                            STRONG
                          </span>
                        </>
                      )}
                    </div>
                    
                    <p className="text-sm text-foreground/80 font-medium mb-2">
                      {signal.message}
                    </p>
                    
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/40 backdrop-blur-xl">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Value</span>
                      <span className="font-mono text-sm font-black text-primary">{signal.value}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="relative z-10 mt-5 overflow-hidden rounded-xl border-2 border-primary/20 bg-gradient-to-br from-background/80 to-background/60 p-4 backdrop-blur-xl">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div className="text-xs font-black text-muted-foreground uppercase tracking-wider mb-3">Technical Overview</div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">RSI (14)</div>
            <div className={`font-mono text-lg font-black ${
              currentRSI && currentRSI < 30 ? 'text-success' :
              currentRSI && currentRSI > 70 ? 'text-destructive' :
              'text-primary'
            }`}>
              {currentRSI?.toFixed(1) || '—'}
            </div>
            <div className="text-[9px] text-muted-foreground font-medium mt-0.5">
              {currentRSI && currentRSI < 30 ? 'OVERSOLD' :
               currentRSI && currentRSI > 70 ? 'OVERBOUGHT' :
               'NEUTRAL'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Trend</div>
            <div className={`font-mono text-lg font-black ${
              trend === 'UP' ? 'text-success' : 'text-destructive'
            }`}>
              {trend}
            </div>
            <div className="text-[9px] text-muted-foreground font-medium mt-0.5">
              {momentum.toFixed(2)}% MOVE
            </div>
          </div>
          <div className="text-center">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Momentum</div>
            <div className={`font-mono text-lg font-black ${
              momentum > 1 ? 'text-primary' : 'text-muted-foreground'
            }`}>
              {momentum > 1 ? 'HIGH' : 'LOW'}
            </div>
            <div className="text-[9px] text-muted-foreground font-medium mt-0.5">
              {momentum > 1 ? 'VOLATILE' : 'STABLE'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
