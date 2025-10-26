import { Brain, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export const MarketSentiment = () => {
  // Mock data - in real app would come from AI analysis
  const sentiment = {
    overall: 68, // 0-100
    bullish: 68,
    bearish: 32,
    fearGreed: 72,
    socialVolume: 145,
    newsPositivity: 58,
  };

  const getSentimentColor = (value: number) => {
    if (value >= 70) return 'text-success';
    if (value >= 30) return 'text-chart-4';
    return 'text-destructive';
  };

  const getSentimentLabel = (value: number) => {
    if (value >= 75) return 'Extreme Greed';
    if (value >= 60) return 'Greed';
    if (value >= 40) return 'Neutral';
    if (value >= 25) return 'Fear';
    return 'Extreme Fear';
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-chart-2/15 ring-2 ring-chart-2/35 shadow-lg shadow-chart-2/20">
          <Brain className="w-5 h-5 text-chart-2 animate-pulse" />
        </div>
        <div>
          <h3 className="text-sm font-black text-foreground uppercase tracking-wide">AI Sentiment Engine</h3>
          <p className="text-[9px] text-muted-foreground font-mono">Neural market psychology analysis</p>
        </div>
      </div>

      {/* Elite Overall Sentiment */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-chart-2/30 bg-gradient-to-br from-chart-2/15 to-chart-2/5 p-6 shadow-2xl shadow-chart-2/15 backdrop-blur-xl">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-chart-2 to-transparent opacity-60" />
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-chart-2/10 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black text-muted-foreground uppercase tracking-wider">Global Market Sentiment</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-2/20 ring-2 ring-chart-2/40">
              <Zap className="w-4 h-4 text-chart-2 animate-pulse" />
            </div>
          </div>
          <div className={`text-5xl font-black ${getSentimentColor(sentiment.overall)} mb-3 drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]`}>
            {sentiment.overall}<span className="text-2xl text-muted-foreground">/100</span>
          </div>
          <div className="text-base text-foreground font-black mb-4 uppercase tracking-wide">
            {getSentimentLabel(sentiment.overall)}
          </div>
          <Progress value={sentiment.overall} className="h-3 rounded-full" />
        </div>
      </div>

      {/* Elite Bull vs Bear Analysis */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-border/30 bg-gradient-to-br from-card to-card/70 p-5 backdrop-blur-xl">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-foreground/20 to-transparent" />
        
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/20 ring-2 ring-success/40">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <span className="text-sm font-black text-success uppercase tracking-wider">Bulls</span>
            </div>
            <span className="text-2xl font-black text-success font-mono">{sentiment.bullish}%</span>
          </div>
          <Progress value={sentiment.bullish} className="h-3 rounded-full" />
        </div>
        
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent my-4" />
        
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/20 ring-2 ring-destructive/40">
                <TrendingDown className="w-5 h-5 text-destructive" />
              </div>
              <span className="text-sm font-black text-destructive uppercase tracking-wider">Bears</span>
            </div>
            <span className="text-2xl font-black text-destructive font-mono">{sentiment.bearish}%</span>
          </div>
          <Progress value={sentiment.bearish} className="h-3 rounded-full" />
        </div>
      </div>

      {/* Elite Advanced Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="relative overflow-hidden rounded-xl border-2 border-primary/25 bg-gradient-to-br from-primary/15 to-primary/5 p-4 backdrop-blur-xl">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          <div className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-2">Fear & Greed Index</div>
          <div className={`text-3xl font-black ${getSentimentColor(sentiment.fearGreed)} drop-shadow-[0_0_10px_rgba(56,189,248,0.3)]`}>
            {sentiment.fearGreed}
          </div>
          <div className="text-[9px] text-muted-foreground font-bold mt-1">
            {getSentimentLabel(sentiment.fearGreed).toUpperCase()}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border-2 border-chart-1/25 bg-gradient-to-br from-chart-1/15 to-chart-1/5 p-4 backdrop-blur-xl">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-chart-1/50 to-transparent" />
          <div className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-2">Social Volume</div>
          <div className="text-3xl font-black text-chart-1 drop-shadow-[0_0_10px_rgba(56,189,248,0.3)]">
            {sentiment.socialVolume}<span className="text-lg">K</span>
          </div>
          <div className="text-[9px] text-muted-foreground font-bold mt-1">
            MENTIONS/HOUR
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-xl border-2 border-success/25 bg-gradient-to-r from-success/15 to-chart-3/10 p-4 backdrop-blur-xl">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-success/50 to-transparent" />
        <div className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-3">News Sentiment Score</div>
        <div className="flex items-center justify-between gap-3">
          <Progress value={sentiment.newsPositivity} className="h-3 flex-1 rounded-full" />
          <span className="text-2xl font-black text-success font-mono">{sentiment.newsPositivity}%</span>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-xl border-2 border-chart-2/25 bg-gradient-to-br from-chart-2/10 to-chart-2/5 p-3 text-center backdrop-blur-xl">
        <div className="text-[9px] text-muted-foreground font-black flex items-center justify-center gap-2 uppercase tracking-wider">
          <Brain className="w-4 h-4 text-chart-2 animate-pulse" />
          <span>Powered by Advanced Neural Analysis</span>
        </div>
      </div>
    </div>
  );
};
