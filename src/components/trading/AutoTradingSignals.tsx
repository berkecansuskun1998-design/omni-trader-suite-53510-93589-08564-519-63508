import { useState } from 'react';
import { Zap, TrendingUp, TrendingDown, AlertCircle, Play, Pause, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface AutoSignal {
  id: string;
  type: 'buy' | 'sell';
  symbol: string;
  strategy: string;
  confidence: number;
  entry: number;
  stopLoss: number;
  takeProfit: number;
  timestamp: number;
}

export const AutoTradingSignals = () => {
  const [isActive, setIsActive] = useState(false);
  const [autoExecute, setAutoExecute] = useState(false);
  const [signals] = useState<AutoSignal[]>([
    {
      id: '1',
      type: 'buy',
      symbol: 'BTCUSDT',
      strategy: 'RSI Oversold + MACD Cross',
      confidence: 87,
      entry: 67500,
      stopLoss: 66000,
      takeProfit: 70000,
      timestamp: Date.now() - 300000,
    },
    {
      id: '2',
      type: 'sell',
      symbol: 'ETHUSDT',
      strategy: 'Bearish Divergence',
      confidence: 73,
      entry: 3250,
      stopLoss: 3350,
      takeProfit: 3050,
      timestamp: Date.now() - 600000,
    },
  ]);

  const toggleActive = () => {
    setIsActive(!isActive);
    toast.success(isActive ? 'Auto signals paused' : 'Auto signals activated');
  };

  const toggleAutoExecute = () => {
    setAutoExecute(!autoExecute);
    toast.info(autoExecute ? 'Manual execution mode' : 'Auto execution enabled');
  };

  const executeSignal = (signal: AutoSignal) => {
    toast.success(`${signal.type.toUpperCase()} order placed`, {
      description: `${signal.symbol} @ $${signal.entry}`,
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-success';
    if (confidence >= 60) return 'text-chart-4';
    return 'text-muted-foreground';
  };

  const getTimeAgo = (timestamp: number) => {
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className={`w-4 h-4 ${isActive ? 'text-chart-4 animate-pulse' : 'text-muted-foreground'}`} />
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Auto Signals</h3>
        </div>
        <Button
          variant={isActive ? 'default' : 'outline'}
          size="sm"
          onClick={toggleActive}
          className="gap-1"
        >
          {isActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          {isActive ? 'Active' : 'Paused'}
        </Button>
      </div>

      {/* Settings Panel */}
      <div className="p-3 rounded-lg bg-muted/20 border border-border space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="auto-execute" className="text-xs font-medium cursor-pointer">
            Auto Execute Trades
          </Label>
          <Switch
            id="auto-execute"
            checked={autoExecute}
            onCheckedChange={toggleAutoExecute}
          />
        </div>

        <Button variant="outline" size="sm" className="w-full gap-1">
          <Settings className="w-3 h-3" />
          Configure Strategies
        </Button>
      </div>

      {/* Active Signals */}
      {isActive ? (
        <div className="space-y-2">
          {signals.map((signal) => (
            <div
              key={signal.id}
              className={`p-3 rounded-lg border transition-all hover:scale-[1.02] ${
                signal.type === 'buy'
                  ? 'bg-success/5 border-success/20'
                  : 'bg-destructive/5 border-destructive/20'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {signal.type === 'buy' ? (
                    <TrendingUp className="w-4 h-4 text-success" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-destructive" />
                  )}
                  <span className="text-sm font-bold text-foreground">{signal.symbol}</span>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                  signal.type === 'buy'
                    ? 'bg-success/20 text-success'
                    : 'bg-destructive/20 text-destructive'
                }`}>
                  {signal.type.toUpperCase()}
                </span>
              </div>

              {/* Strategy & Confidence */}
              <div className="mb-3">
                <div className="text-xs text-foreground font-medium mb-1">{signal.strategy}</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-muted/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        signal.confidence >= 80 ? 'bg-success' :
                        signal.confidence >= 60 ? 'bg-chart-4' : 'bg-muted-foreground'
                      }`}
                      style={{ width: `${signal.confidence}%` }}
                    />
                  </div>
                  <span className={`text-xs font-bold ${getConfidenceColor(signal.confidence)}`}>
                    {signal.confidence}%
                  </span>
                </div>
              </div>

              {/* Trade Details */}
              <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                <div>
                  <div className="text-muted-foreground">Entry</div>
                  <div className="text-foreground font-medium">${signal.entry.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Stop Loss</div>
                  <div className="text-destructive font-medium">${signal.stopLoss.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Target</div>
                  <div className="text-success font-medium">${signal.takeProfit.toLocaleString()}</div>
                </div>
              </div>

              {/* Action & Timestamp */}
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <span className="text-[10px] text-muted-foreground">{getTimeAgo(signal.timestamp)}</span>
                {!autoExecute && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => executeSignal(signal)}
                    className={`h-7 gap-1 ${
                      signal.type === 'buy'
                        ? 'border-success/50 hover:bg-success/10'
                        : 'border-destructive/50 hover:bg-destructive/10'
                    }`}
                  >
                    Execute
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center rounded-lg bg-muted/20 border border-border">
          <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <div className="text-sm text-muted-foreground">Auto signals paused</div>
          <div className="text-xs text-muted-foreground mt-1">Click Active to start receiving signals</div>
        </div>
      )}

      {/* Stats */}
      {isActive && (
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-lg bg-success/10 border border-success/20">
            <div className="text-[10px] text-muted-foreground uppercase mb-1">Success Rate</div>
            <div className="text-lg font-bold text-success">78.5%</div>
          </div>
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="text-[10px] text-muted-foreground uppercase mb-1">Today's Signals</div>
            <div className="text-lg font-bold text-primary">12</div>
          </div>
        </div>
      )}
    </div>
  );
};
