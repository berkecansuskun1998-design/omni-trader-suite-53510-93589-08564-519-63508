import { useState, useEffect, useRef, memo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAccount, useBalance, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { toast } from 'sonner';
import { Terminal as TerminalIcon, Send, Zap } from 'lucide-react';

interface TerminalLog {
  message: string;
  level: 'info' | 'warn' | 'error' | 'success' | 'trade';
  timestamp: Date;
}

interface Position {
  exchange: string;
  symbol: string;
  side: 'long' | 'short';
  entryPrice: number;
  amount: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
}

interface AdvancedTerminalProps {
  logs?: TerminalLog[];
}

export const AdvancedTerminal = memo(({ logs: externalLogs = [] }: AdvancedTerminalProps) => {
  const [logs, setLogs] = useState<TerminalLog[]>(externalLogs);
  const [command, setCommand] = useState('');
  const [positions, setPositions] = useState<Position[]>([]);
  const [demoBalance, setDemoBalance] = useState(100000);
  const [omni99Balance, setOmni99Balance] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const { sendTransaction, data: txHash } = useSendTransaction();
  const { isSuccess: txSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (externalLogs.length > 0) {
      setLogs(prev => [...prev, ...externalLogs]);
    }
  }, [externalLogs]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    if (txSuccess) {
      addLog('Transaction confirmed successfully!', 'success');
    }
  }, [txSuccess]);

  useEffect(() => {
    addLog('🚀 Advanced Trading Terminal initialized', 'success');
    addLog('Type "help" for available commands', 'info');
  }, []);

  const addLog = (message: string, level: TerminalLog['level'] = 'info') => {
    setLogs(prev => [...prev, { message, level, timestamp: new Date() }]);
  };

  const executeTrade = (
    exchange: string,
    symbol: string,
    side: 'long' | 'short',
    amount: number,
    price: number
  ) => {
    const cost = amount * price;
    if (cost > demoBalance) {
      addLog(`❌ Insufficient demo balance. Required: $${cost.toFixed(2)}, Available: $${demoBalance.toFixed(2)}`, 'error');
      return;
    }

    setDemoBalance(prev => prev - cost);
    
    const newPosition: Position = {
      exchange,
      symbol,
      side,
      entryPrice: price,
      amount,
      currentPrice: price,
      pnl: 0,
      pnlPercent: 0
    };

    setPositions(prev => [...prev, newPosition]);
    addLog(`✅ ${side.toUpperCase()} ${amount} ${symbol} @ $${price} on ${exchange}`, 'trade');
    addLog(`Demo Balance: $${(demoBalance - cost).toFixed(2)}`, 'info');
  };

  const closePosition = (index: number) => {
    const pos = positions[index];
    const returnAmount = pos.amount * pos.currentPrice;
    const profit = returnAmount - (pos.amount * pos.entryPrice);
    
    setDemoBalance(prev => prev + returnAmount);
    setPositions(prev => prev.filter((_, i) => i !== index));
    
    addLog(`📊 Closed ${pos.side.toUpperCase()} ${pos.symbol} position. P&L: $${profit.toFixed(2)}`, profit >= 0 ? 'success' : 'error');
    addLog(`Demo Balance: $${(demoBalance + returnAmount).toFixed(2)}`, 'info');
  };

  const handleCommand = () => {
    if (!command.trim()) return;

    addLog(`> ${command}`, 'info');
    const parts = command.toLowerCase().split(' ');
    const cmd = parts[0];

    try {
      switch (cmd) {
        case 'help':
          addLog('📖 Available Commands:', 'info');
          addLog('  buy <exchange> <symbol> <amount> - Execute demo buy order', 'info');
          addLog('  sell <exchange> <symbol> <amount> - Execute demo sell order', 'info');
          addLog('  positions - Show all open positions', 'info');
          addLog('  balance - Show demo and OMNI99 balance', 'info');
          addLog('  close <index> - Close position by index', 'info');
          addLog('  wallet - Show Web3 wallet info', 'info');
          addLog('  send <address> <amount> - Send crypto (Web3)', 'info');
          addLog('  buyomni99 <amount> - Purchase OMNI99 tokens', 'info');
          addLog('  market <symbol> - Get market price', 'info');
          addLog('  exchanges - List supported exchanges', 'info');
          addLog('  clear - Clear terminal', 'info');
          break;

        case 'buy':
        case 'long': {
          const [, exchange = 'binance', symbol = 'BTCUSDT', amountStr = '0.01'] = parts;
          const amount = parseFloat(amountStr);
          const price = 67890 + Math.random() * 1000;
          executeTrade(exchange, symbol, 'long', amount, price);
          break;
        }

        case 'sell':
        case 'short': {
          const [, exchange = 'binance', symbol = 'BTCUSDT', amountStr = '0.01'] = parts;
          const amount = parseFloat(amountStr);
          const price = 67890 + Math.random() * 1000;
          executeTrade(exchange, symbol, 'short', amount, price);
          break;
        }

        case 'positions':
          if (positions.length === 0) {
            addLog('No open positions', 'info');
          } else {
            addLog('📈 Open Positions:', 'info');
            positions.forEach((pos, i) => {
              addLog(
                `  [${i}] ${pos.exchange.toUpperCase()} ${pos.symbol} ${pos.side.toUpperCase()} | Entry: $${pos.entryPrice.toFixed(2)} | Amount: ${pos.amount} | P&L: $${pos.pnl.toFixed(2)} (${pos.pnlPercent.toFixed(2)}%)`,
                pos.pnl >= 0 ? 'success' : 'error'
              );
            });
          }
          break;

        case 'close': {
          const index = parseInt(parts[1]);
          if (isNaN(index) || index < 0 || index >= positions.length) {
            addLog('❌ Invalid position index', 'error');
          } else {
            closePosition(index);
          }
          break;
        }

        case 'balance':
          addLog(`💰 Demo Balance: $${demoBalance.toFixed(2)}`, 'success');
          addLog(`🪙 OMNI99 Balance: ${omni99Balance.toFixed(2)} OMNI99`, 'success');
          if (isConnected && balance) {
            addLog(`🔗 Wallet Balance: ${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}`, 'success');
          }
          break;

        case 'wallet':
          if (!isConnected) {
            addLog('❌ Wallet not connected. Use the wallet button to connect.', 'error');
          } else {
            addLog(`🔗 Connected Wallet: ${address?.slice(0, 6)}...${address?.slice(-4)}`, 'success');
            if (balance) {
              addLog(`💎 Balance: ${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}`, 'success');
            }
          }
          break;

        case 'send': {
          if (!isConnected) {
            addLog('❌ Wallet not connected', 'error');
            break;
          }
          const [, toAddress, amountStr] = parts;
          if (!toAddress || !amountStr) {
            addLog('❌ Usage: send <address> <amount>', 'error');
            break;
          }
          try {
            sendTransaction({
              to: toAddress as `0x${string}`,
              value: parseEther(amountStr)
            });
            addLog(`📤 Sending ${amountStr} to ${toAddress}...`, 'info');
          } catch (error) {
            addLog(`❌ Transaction failed: ${error}`, 'error');
          }
          break;
        }

        case 'buyomni99': {
          const amount = parseFloat(parts[1] || '0');
          if (amount <= 0) {
            addLog('❌ Usage: buyomni99 <amount>', 'error');
            break;
          }
          const cost = amount * 0.01;
          if (cost > demoBalance) {
            addLog(`❌ Insufficient balance. Required: $${cost.toFixed(2)}`, 'error');
            break;
          }
          setDemoBalance(prev => prev - cost);
          setOmni99Balance(prev => prev + amount);
          addLog(`✅ Purchased ${amount} OMNI99 for $${cost.toFixed(2)}`, 'success');
          addLog(`🪙 New OMNI99 Balance: ${omni99Balance + amount}`, 'success');
          break;
        }

        case 'market': {
          const symbol = parts[1] || 'BTCUSDT';
          const prices: Record<string, number> = {
            btcusdt: 67890 + Math.random() * 1000,
            ethusdt: 3456 + Math.random() * 100,
            bnbusdt: 589 + Math.random() * 10,
            solusdt: 145 + Math.random() * 5,
          };
          const price = prices[symbol.toLowerCase()] || 100 + Math.random() * 10;
          addLog(`📊 ${symbol.toUpperCase()}: $${price.toFixed(2)}`, 'success');
          break;
        }

        case 'exchanges':
          addLog('🏦 Supported Exchanges:', 'info');
          addLog('  • binance - Binance (Crypto)', 'info');
          addLog('  • coinbase - Coinbase (Crypto)', 'info');
          addLog('  • okx - OKX (Crypto)', 'info');
          addLog('  • kucoin - KuCoin (Crypto)', 'info');
          addLog('  • nyse - New York Stock Exchange', 'info');
          addLog('  • nasdaq - NASDAQ', 'info');
          addLog('  • forex - Forex Trading', 'info');
          addLog('  • cme - Chicago Mercantile Exchange', 'info');
          break;

        case 'clear':
          setLogs([]);
          addLog('Terminal cleared', 'info');
          break;

        default:
          addLog(`❌ Unknown command: ${cmd}. Type "help" for available commands.`, 'error');
      }
    } catch (error) {
      addLog(`❌ Error executing command: ${error}`, 'error');
    }

    setCommand('');
    inputRef.current?.focus();
  };

  const getLogColor = (level: TerminalLog['level']) => {
    switch (level) {
      case 'error': return 'text-red-500 bg-red-500/5';
      case 'warn': return 'text-yellow-500 bg-yellow-500/5';
      case 'success': return 'text-green-500 bg-green-500/5';
      case 'trade': return 'text-blue-500 bg-blue-500/5';
      default: return 'text-foreground/80';
    }
  };

  return (
    <Card className="p-4 space-y-3 bg-gradient-to-br from-card via-card/95 to-primary/5 border-primary/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 ring-2 ring-primary/30">
            <TerminalIcon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h4 className="text-sm font-black text-foreground uppercase tracking-wide">
              Advanced Trading Terminal
            </h4>
            <p className="text-[9px] text-muted-foreground font-mono">
              Multi-Exchange | Web3 Enabled | Real-time Execution
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <div className="flex items-center gap-1.5">
            <Zap className="h-3 w-3 text-green-500" />
            <span className="text-green-500 font-bold">ACTIVE</span>
          </div>
          <div className="text-muted-foreground">
            Balance: ${demoBalance.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-background/50 to-card backdrop-blur-xl">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />

        <ScrollArea className="h-[300px] p-4 relative z-10">
          <div ref={scrollRef} className="space-y-1.5 font-mono text-xs">
            {logs.length === 0 && (
              <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
                <div className="h-1 w-1 rounded-full bg-primary" />
                <span>Terminal ready. Type "help" to get started...</span>
              </div>
            )}
            {logs.map((log, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-2 transition-all hover:bg-primary/5 rounded px-2 py-1 ${getLogColor(log.level)}`}
              >
                <span className="text-primary/70 font-bold flex-shrink-0 text-[10px]">
                  {log.timestamp.toLocaleTimeString()}
                </span>
                <span className={`flex-1 ${log.level === 'error' ? 'font-bold' : ''}`}>
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary font-mono text-sm">
            $
          </span>
          <Input
            ref={inputRef}
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCommand()}
            placeholder="Type command (e.g., 'buy binance BTCUSDT 0.01' or 'help')"
            className="pl-7 font-mono text-xs bg-background/50 border-primary/30 focus:border-primary"
            autoFocus
          />
        </div>
        <Button
          onClick={handleCommand}
          size="sm"
          className="px-4"
          disabled={!command.trim()}
        >
          <Send className="h-3 w-3 mr-1" />
          Execute
        </Button>
      </div>

      <div className="flex gap-2 text-[10px] text-muted-foreground font-mono">
        <span>Press Enter to execute</span>
        <span className="text-primary">|</span>
        <span>Type "help" for commands</span>
      </div>
    </Card>
  );
});

AdvancedTerminal.displayName = 'AdvancedTerminal';
