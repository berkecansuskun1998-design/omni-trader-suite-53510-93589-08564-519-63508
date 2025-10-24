import { useState } from 'react';
import { CreditCard, Copy, Check, QrCode } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAccount } from 'wagmi';

const PAYMENT_TOKENS = [
  { symbol: 'ETH', name: 'Ethereum', icon: '⟠' },
  { symbol: 'USDT', name: 'Tether', icon: '₮' },
  { symbol: 'USDC', name: 'USD Coin', icon: '$' },
  { symbol: 'BTC', name: 'Bitcoin', icon: '₿' },
];

export const CryptoPayment = () => {
  const { isConnected, address } = useAccount();
  const [selectedToken, setSelectedToken] = useState(PAYMENT_TOKENS[0]);
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!recipient) {
      toast.error('Please enter recipient address');
      return;
    }
    toast.success('Payment initiated', {
      description: `Sending ${amount} ${selectedToken.symbol}`,
    });
    setAmount('');
    setRecipient('');
  };

  return (
    <Card className="p-4 space-y-4 bg-gradient-to-br from-chart-2/10 via-background to-chart-3/10 border-chart-2/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-chart-2" />
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
            Crypto Payment
          </h3>
        </div>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          <QrCode className="w-3 h-3" />
        </Button>
      </div>

      {isConnected && address && (
        <div className="p-3 rounded-lg bg-muted/30 border border-border space-y-2">
          <div className="text-xs text-muted-foreground">Your Address</div>
          <div className="flex items-center justify-between gap-2">
            <code className="text-xs text-foreground font-mono flex-1 truncate">
              {address}
            </code>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopy(address)}
              className="h-6 w-6 p-0 flex-shrink-0"
            >
              {copied ? (
                <Check className="w-3 h-3 text-primary" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Token Selection */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">Select Token</label>
        <div className="grid grid-cols-4 gap-2">
          {PAYMENT_TOKENS.map((token) => (
            <Button
              key={token.symbol}
              variant={selectedToken.symbol === token.symbol ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedToken(token)}
              className="flex-col h-auto py-2 gap-1"
            >
              <span className="text-lg">{token.icon}</span>
              <span className="text-[10px]">{token.symbol}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Amount Input */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">Amount</label>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="0.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 text-right font-semibold"
          />
          <div className="flex items-center px-3 rounded-lg bg-muted border border-border">
            <span className="text-sm font-semibold text-foreground">
              {selectedToken.symbol}
            </span>
          </div>
        </div>
        {amount && (
          <div className="text-xs text-muted-foreground text-right">
            ≈ ${(parseFloat(amount) * 1850.5).toFixed(2)} USD
          </div>
        )}
      </div>

      {/* Recipient Input */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">Recipient Address</label>
        <Input
          type="text"
          placeholder="0x..."
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          className="font-mono text-xs"
        />
      </div>

      {/* Transaction Details */}
      {amount && recipient && (
        <div className="space-y-1 p-3 rounded-lg bg-muted/30 border border-border">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Gas Fee (Est.)</span>
            <span className="text-foreground">~$1.20</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Total</span>
            <span className="text-foreground font-semibold">
              {amount} {selectedToken.symbol} + Gas
            </span>
          </div>
        </div>
      )}

      {/* Send Button */}
      <Button
        onClick={handleSend}
        className="w-full"
        disabled={!isConnected || !amount || !recipient}
      >
        {!isConnected ? 'Connect Wallet' : 'Send Payment'}
      </Button>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-2">
        {['0.1', '0.5', '1.0'].map((val) => (
          <Button
            key={val}
            variant="outline"
            size="sm"
            onClick={() => setAmount(val)}
            className="text-xs"
          >
            {val} {selectedToken.symbol}
          </Button>
        ))}
      </div>
    </Card>
  );
};
