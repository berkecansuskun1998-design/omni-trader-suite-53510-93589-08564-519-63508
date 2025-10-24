import { useState } from 'react';
import { Shield, Calculator, TrendingUp, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export const RiskCalculator = () => {
  const [entry, setEntry] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [target, setTarget] = useState('');
  const [capital, setCapital] = useState('');
  const [risk, setRisk] = useState('2');

  const calculate = () => {
    const e = parseFloat(entry);
    const sl = parseFloat(stopLoss);
    const t = parseFloat(target);
    const c = parseFloat(capital);
    const r = parseFloat(risk);

    if (!e || !sl || !t || !c || !r) return null;

    const riskAmount = (c * r) / 100;
    const stopLossDistance = Math.abs(e - sl);
    const targetDistance = Math.abs(t - e);
    const riskReward = targetDistance / stopLossDistance;
    const positionSize = riskAmount / stopLossDistance;
    const potentialProfit = positionSize * targetDistance;
    const potentialLoss = riskAmount;

    return {
      riskReward: riskReward.toFixed(2),
      positionSize: positionSize.toFixed(4),
      potentialProfit: potentialProfit.toFixed(2),
      potentialLoss: potentialLoss.toFixed(2),
      breakeven: e.toFixed(2),
    };
  };

  const result = calculate();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-chart-4" />
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Risk Calculator</h3>
      </div>

      <div className="space-y-3 p-4 rounded-lg bg-gradient-to-br from-muted/30 to-transparent border border-border">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Entry Price</Label>
          <Input
            type="number"
            placeholder="50000"
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            className="h-9"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Stop Loss</Label>
            <Input
              type="number"
              placeholder="48000"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              className="h-9"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Target</Label>
            <Input
              type="number"
              placeholder="55000"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="h-9"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Capital ($)</Label>
            <Input
              type="number"
              placeholder="10000"
              value={capital}
              onChange={(e) => setCapital(e.target.value)}
              className="h-9"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Risk (%)</Label>
            <Input
              type="number"
              placeholder="2"
              value={risk}
              onChange={(e) => setRisk(e.target.value)}
              className="h-9"
            />
          </div>
        </div>
      </div>

      {result && (
        <div className="space-y-2 animate-fade-in">
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Risk/Reward Ratio</span>
              <Calculator className="w-3 h-3 text-primary" />
            </div>
            <div className="text-2xl font-bold text-primary">1:{result.riskReward}</div>
            <div className="text-[10px] text-muted-foreground mt-1">
              {parseFloat(result.riskReward) >= 2 ? '✓ Good ratio' : '⚠ Poor ratio'}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-lg bg-success/10 border border-success/20">
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp className="w-3 h-3 text-success" />
                <span className="text-[10px] text-muted-foreground uppercase">Potential Profit</span>
              </div>
              <div className="text-sm font-bold text-success">${result.potentialProfit}</div>
            </div>

            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="flex items-center gap-1 mb-1">
                <AlertTriangle className="w-3 h-3 text-destructive" />
                <span className="text-[10px] text-muted-foreground uppercase">Potential Loss</span>
              </div>
              <div className="text-sm font-bold text-destructive">${result.potentialLoss}</div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-muted/30 border border-border">
            <div className="text-xs text-muted-foreground mb-1">Position Size</div>
            <div className="text-lg font-bold text-foreground">{result.positionSize} units</div>
          </div>
        </div>
      )}
    </div>
  );
};
