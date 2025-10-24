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
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Brain className="w-4 h-4 text-chart-2 animate-pulse" />
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">AI Sentiment</h3>
      </div>

      {/* Overall Sentiment */}
      <div className="p-4 rounded-lg bg-gradient-to-br from-chart-2/20 to-transparent border border-chart-2/30">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-muted-foreground uppercase">Market Sentiment</span>
          <Zap className="w-4 h-4 text-chart-2" />
        </div>
        <div className={`text-3xl font-bold ${getSentimentColor(sentiment.overall)} mb-2`}>
          {sentiment.overall}/100
        </div>
        <div className="text-sm text-foreground font-medium mb-3">
          {getSentimentLabel(sentiment.overall)}
        </div>
        <Progress value={sentiment.overall} className="h-2" />
      </div>

      {/* Bull vs Bear */}
      <div className="p-3 rounded-lg bg-muted/30 border border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-success" />
            <span className="text-xs font-medium text-success">Bullish</span>
          </div>
          <span className="text-sm font-bold text-success">{sentiment.bullish}%</span>
        </div>
        <Progress value={sentiment.bullish} className="h-2 mb-3" />
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-destructive" />
            <span className="text-xs font-medium text-destructive">Bearish</span>
          </div>
          <span className="text-sm font-bold text-destructive">{sentiment.bearish}%</span>
        </div>
        <Progress value={sentiment.bearish} className="h-2" />
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
          <div className="text-xs text-muted-foreground mb-1">Fear & Greed</div>
          <div className={`text-lg font-bold ${getSentimentColor(sentiment.fearGreed)}`}>
            {sentiment.fearGreed}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-chart-1/10 border border-chart-1/20">
          <div className="text-xs text-muted-foreground mb-1">Social Volume</div>
          <div className="text-lg font-bold text-chart-1">
            {sentiment.socialVolume}K
          </div>
        </div>
      </div>

      <div className="p-3 rounded-lg bg-gradient-to-r from-success/10 to-chart-3/10 border border-success/20">
        <div className="text-xs text-muted-foreground mb-1">News Positivity</div>
        <div className="flex items-center justify-between">
          <Progress value={sentiment.newsPositivity} className="h-2 flex-1 mr-3" />
          <span className="text-sm font-bold text-success">{sentiment.newsPositivity}%</span>
        </div>
      </div>

      <div className="p-2 rounded-lg bg-chart-2/10 border border-chart-2/20 text-center">
        <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
          <Brain className="w-3 h-3" />
          <span>Powered by AI Analysis</span>
        </div>
      </div>
    </div>
  );
};
