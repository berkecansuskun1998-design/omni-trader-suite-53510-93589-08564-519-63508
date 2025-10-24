import { useState } from 'react';
import { ArrowDownUp, Settings, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAccount } from 'wagmi';

const TOKENS = [
  { symbol: 'ETH', name: 'Ethereum', balance: '2.4521' },
  { symbol: 'USDT', name: 'Tether', balance: '10,234.56' },
  { symbol: 'USDC', name: 'USD Coin', balance: '5,432.10' },
  { symbol: 'BTC', name: 'Bitcoin', balance: '0.1234' },
  { symbol: 'BNB', name: 'BNB', balance: '12.34' },
];

export const SwapInterface = () => {
  const { isConnected } = useAccount();
  const [fromToken, setFromToken] = useState(TOKENS[0]);
  const [toToken, setToToken] = useState(TOKENS[1]);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [slippage, setSlippage] = useState('0.5');

  const handleSwap = () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    toast.success('Swap initiated', {
      description: `Swapping ${fromAmount} ${fromToken.symbol} to ${toToken.symbol}`,
    });
  };

  const handleFlip = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const handleFromAmountChange = (value: string) => {
    setFromAmount(value);
    // Simulate exchange rate calculation
    if (value) {
      const rate = 1850.5; // Mock rate
      setToAmount((parseFloat(value) * rate).toFixed(2));
    } else {
      setToAmount('');
    }
  };

  return (
    <Card className="p-4 space-y-4 bg-gradient-to-br from-chart-4/10 via-background to-primary/5 border-chart-4/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ArrowDownUp className="w-4 h-4 text-chart-4" />
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
            Token Swap
          </h3>
        </div>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          <Settings className="w-3 h-3" />
        </Button>
      </div>

      {/* From Token */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">From</span>
          <span className="text-muted-foreground">
            Balance: {fromToken.balance}
          </span>
        </div>
        <div className="flex gap-2">
          <select
            value={fromToken.symbol}
            onChange={(e) => {
              const token = TOKENS.find((t) => t.symbol === e.target.value);
              if (token) setFromToken(token);
            }}
            className="bg-background border border-border rounded-lg px-3 py-2 text-sm font-semibold text-foreground w-28"
          >
            {TOKENS.map((token) => (
              <option key={token.symbol} value={token.symbol}>
                {token.symbol}
              </option>
            ))}
          </select>
          <Input
            type="number"
            placeholder="0.0"
            value={fromAmount}
            onChange={(e) => handleFromAmountChange(e.target.value)}
            className="flex-1 text-right font-semibold"
          />
        </div>
      </div>

      {/* Flip Button */}
      <div className="flex justify-center -my-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleFlip}
          className="h-8 w-8 p-0 rounded-full"
        >
          <ArrowDownUp className="w-4 h-4" />
        </Button>
      </div>

      {/* To Token */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">To</span>
          <span className="text-muted-foreground">
            Balance: {toToken.balance}
          </span>
        </div>
        <div className="flex gap-2">
          <select
            value={toToken.symbol}
            onChange={(e) => {
              const token = TOKENS.find((t) => t.symbol === e.target.value);
              if (token) setToToken(token);
            }}
            className="bg-background border border-border rounded-lg px-3 py-2 text-sm font-semibold text-foreground w-28"
          >
            {TOKENS.map((token) => (
              <option key={token.symbol} value={token.symbol}>
                {token.symbol}
              </option>
            ))}
          </select>
          <Input
            type="number"
            placeholder="0.0"
            value={toAmount}
            readOnly
            className="flex-1 text-right font-semibold bg-muted/50"
          />
        </div>
      </div>

      {/* Swap Details */}
      {fromAmount && (
        <div className="space-y-1 p-3 rounded-lg bg-muted/30 border border-border">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Rate</span>
            <span className="text-foreground">
              1 {fromToken.symbol} ≈ 1,850.5 {toToken.symbol}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Slippage Tolerance</span>
            <input
              type="number"
              value={slippage}
              onChange={(e) => setSlippage(e.target.value)}
              className="bg-background border border-border rounded px-2 py-1 w-16 text-right text-foreground"
            />
            <span className="text-muted-foreground">%</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Network Fee</span>
            <span className="text-foreground">~$2.50</span>
          </div>
        </div>
      )}

      {/* Info Banner */}
      <div className="flex items-start gap-2 p-2 rounded-lg bg-primary/10 border border-primary/20">
        <Info className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
        <p className="text-[10px] text-muted-foreground">
          Best route found via Uniswap V3. Transaction will be executed on-chain.
        </p>
      </div>

      {/* Swap Button */}
      <Button
        onClick={handleSwap}
        className="w-full"
        disabled={!isConnected || !fromAmount}
      >
        {!isConnected ? 'Connect Wallet' : 'Swap Tokens'}
      </Button>
    </Card>
  );
};
