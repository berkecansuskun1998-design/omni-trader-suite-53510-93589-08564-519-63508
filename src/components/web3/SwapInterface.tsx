import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowDownUp, Zap, Info, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const TOKENS = [
  { symbol: 'ETH', name: 'Ethereum', icon: '⟠', price: 3420.5 },
  { symbol: 'BTC', name: 'Bitcoin', icon: '₿', price: 68500.0 },
  { symbol: 'USDT', name: 'Tether', icon: '₮', price: 1.0 },
  { symbol: 'BNB', name: 'BNB', icon: '🔸', price: 598.2 },
  { symbol: 'SOL', name: 'Solana', icon: '◎', price: 145.8 },
  { symbol: 'MATIC', name: 'Polygon', icon: '⬡', price: 0.82 },
];

export function SwapInterface() {
  const [fromToken, setFromToken] = useState(TOKENS[0]);
  const [toToken, setToToken] = useState(TOKENS[2]);
  const [fromAmount, setFromAmount] = useState('');
  const [slippage, setSlippage] = useState('0.5');
  const [isSwapping, setIsSwapping] = useState(false);

  const toAmount = fromAmount
    ? ((parseFloat(fromAmount) * fromToken.price) / toToken.price).toFixed(6)
    : '';

  const priceImpact = fromAmount ? ((parseFloat(fromAmount) * 0.003) / parseFloat(fromAmount)) * 100 : 0;
  const fee = fromAmount ? (parseFloat(fromAmount) * 0.003).toFixed(6) : '0';

  const handleSwap = async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    setIsSwapping(true);
    
    // Simulate swap
    setTimeout(() => {
      setIsSwapping(false);
      toast.success('Swap successful!', {
        description: `${fromAmount} ${fromToken.symbol} → ${toAmount} ${toToken.symbol}`,
      });
      setFromAmount('');
    }, 2000);
  };

  const flipTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount);
  };

  return (
    <Card className="glass-panel space-y-6 border-primary/20 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-chart-2 to-primary shadow-lg shadow-chart-2/30">
            <ArrowDownUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">DEX Swap</h3>
            <p className="text-xs text-muted-foreground">Best rates across multiple DEXs</p>
          </div>
        </div>
        <Badge variant="outline" className="border-chart-2/30 bg-chart-2/10 text-chart-2">
          <Zap className="mr-1 h-3 w-3" />
          Instant
        </Badge>
      </div>

      <div className="space-y-3">
        {/* From Token */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="glass-panel space-y-2 rounded-xl border border-border p-4 transition-all hover:border-primary/30"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">From</span>
            <Badge variant="outline" className="text-xs">
              Balance: 10.5 {fromToken.symbol}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              placeholder="0.0"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              className="glass-panel border-none text-2xl font-bold"
            />
            <Button
              variant="ghost"
              className="glass-panel gap-2 px-4"
              onClick={() => {
                const nextIndex = (TOKENS.indexOf(fromToken) + 1) % TOKENS.length;
                setFromToken(TOKENS[nextIndex]);
              }}
            >
              <span className="text-2xl">{fromToken.icon}</span>
              <div className="text-left">
                <div className="font-bold">{fromToken.symbol}</div>
                <div className="text-xs text-muted-foreground">${fromToken.price.toLocaleString()}</div>
              </div>
            </Button>
          </div>
        </motion.div>

        {/* Flip Button */}
        <div className="flex justify-center">
          <motion.button
            whileHover={{ scale: 1.1, rotate: 180 }}
            whileTap={{ scale: 0.9 }}
            onClick={flipTokens}
            className="glass-panel rounded-full border-2 border-primary/30 bg-background p-3 shadow-lg shadow-primary/20 transition-all hover:border-primary hover:shadow-primary/40"
          >
            <ArrowDownUp className="h-5 w-5 text-primary" />
          </motion.button>
        </div>

        {/* To Token */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="glass-panel space-y-2 rounded-xl border border-border p-4 transition-all hover:border-primary/30"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">To (estimated)</span>
            <Badge variant="outline" className="text-xs">
              Balance: 1,250 {toToken.symbol}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <Input
              type="text"
              placeholder="0.0"
              value={toAmount}
              readOnly
              className="glass-panel border-none text-2xl font-bold"
            />
            <Button
              variant="ghost"
              className="glass-panel gap-2 px-4"
              onClick={() => {
                const nextIndex = (TOKENS.indexOf(toToken) + 1) % TOKENS.length;
                setToToken(TOKENS[nextIndex]);
              }}
            >
              <span className="text-2xl">{toToken.icon}</span>
              <div className="text-left">
                <div className="font-bold">{toToken.symbol}</div>
                <div className="text-xs text-muted-foreground">${toToken.price.toLocaleString()}</div>
              </div>
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Swap Details */}
      {fromAmount && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel space-y-2 rounded-lg p-4"
        >
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Rate</span>
            <span className="font-mono font-medium">
              1 {fromToken.symbol} = {(fromToken.price / toToken.price).toFixed(4)} {toToken.symbol}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Price Impact</span>
            <span className={`font-mono font-medium ${priceImpact > 1 ? 'text-destructive' : 'text-success'}`}>
              <TrendingDown className="inline h-3 w-3" />
              {priceImpact.toFixed(2)}%
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Fee (0.3%)</span>
            <span className="font-mono font-medium text-chart-4">
              {fee} {fromToken.symbol}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Slippage Tolerance</span>
            <span className="font-mono font-medium">{slippage}%</span>
          </div>
        </motion.div>
      )}

      {/* Info Banner */}
      <div className="glass-panel flex items-start gap-3 rounded-lg border border-chart-2/30 bg-chart-2/5 p-3">
        <Info className="h-5 w-5 text-chart-2" />
        <div className="flex-1 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Best Route: Uniswap V3 → PancakeSwap</p>
          <p className="mt-1">Aggregating prices from 12+ DEXs for optimal rates</p>
        </div>
      </div>

      {/* Swap Button */}
      <Button
        onClick={handleSwap}
        disabled={isSwapping || !fromAmount}
        size="lg"
        className="w-full bg-gradient-to-r from-chart-2 to-primary hover:shadow-lg hover:shadow-chart-2/50"
      >
        {isSwapping ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="mr-2"
            >
              <ArrowDownUp className="h-5 w-5" />
            </motion.div>
            Swapping...
          </>
        ) : (
          <>
            <Zap className="mr-2 h-5 w-5" />
            Swap Now
          </>
        )}
      </Button>
    </Card>
  );
}
