import { useState, useEffect } from 'react';
import { ShoppingCart, TrendingUp, TrendingDown, Zap, Shield, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AssetType, MarketType } from '@/types/trading';

interface OrderPanelProps {
  symbol?: string;
  currentPrice?: number;
  assetType?: AssetType;
  exchange?: string;
}

export const OrderPanel = ({ 
  symbol = 'BTCUSDT', 
  currentPrice = 0,
  assetType = 'crypto',
  exchange = 'BINANCE'
}: OrderPanelProps) => {
  const [orderType, setOrderType] = useState('market');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [leverage, setLeverage] = useState('1');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [loading, setLoading] = useState(false);
  const [feeData, setFeeData] = useState<any>(null);

  // Fetch trading fees
  useEffect(() => {
    const fetchFees = async () => {
      const { data } = await supabase
        .from('trading_fees')
        .select('*')
        .eq('asset_type', assetType)
        .eq('active', true)
        .maybeSingle();
      
      setFeeData(data);
    };
    
    fetchFees();
  }, [assetType]);

  // Calculate fees
  const calculateFees = () => {
    if (!feeData || !quantity || !currentPrice) return { tradingFee: 0, commission: 0, total: 0, notionalValue: 0 };
    
    const qty = parseFloat(quantity);
    const orderPrice = orderType === 'market' ? currentPrice : (parseFloat(price) || currentPrice);
    const notionalValue = qty * orderPrice;
    
    const tradingFee = notionalValue * (orderType === 'market' ? feeData.taker_fee : feeData.maker_fee);
    const commission = notionalValue * feeData.platform_commission_rate;
    const total = notionalValue + tradingFee + commission;
    
    return { tradingFee, commission, total, notionalValue };
  };

  const placeOrder = async () => {
    if (orderType !== 'market' && (!price || parseFloat(price) <= 0)) {
      toast.error('Please enter a valid price');
      return;
    }

    if (!quantity || parseFloat(quantity) <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Please login to place orders');
        return;
      }

      const orderPrice = orderType === 'market' ? currentPrice : parseFloat(price);
      const orderQuantity = parseFloat(quantity);
      const orderLeverage = parseInt(leverage) || 1;
      const fees = calculateFees();

      // Create order with fees
      const { data: order, error: orderError } = await supabase
        .from('trading_orders')
        .insert({
          user_id: user.id,
          symbol,
          side,
          order_type: orderType,
          quantity: orderQuantity,
          price: orderPrice,
          leverage: orderLeverage,
          status: orderType === 'market' ? 'filled' : 'pending',
          filled_quantity: orderType === 'market' ? orderQuantity : 0,
          asset_type: assetType,
          market_type: 'spot' as MarketType,
          exchange,
          trading_fee: fees.tradingFee,
          commission_fee: fees.commission,
          total_cost: fees.total,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // For market orders, create position immediately
      if (orderType === 'market') {
        const { error: positionError } = await supabase
          .from('user_positions')
          .insert({
            user_id: user.id,
            symbol,
            side,
            entry_price: orderPrice,
            quantity: orderQuantity,
            current_price: orderPrice,
            leverage: orderLeverage,
            stop_loss: stopLoss ? parseFloat(stopLoss) : null,
            take_profit: takeProfit ? parseFloat(takeProfit) : null,
            status: 'open',
            asset_type: assetType,
            market_type: 'spot' as MarketType,
            exchange,
            total_fees: fees.tradingFee + fees.commission,
            commission_paid: fees.commission,
          });

        if (positionError) throw positionError;

        // Record commission earning
        if (fees.commission > 0) {
          await supabase.from('commission_earnings').insert({
            user_id: user.id,
            order_id: order.id,
            amount: fees.commission,
            asset_type: assetType,
            symbol,
          });
        }

        toast.success(`${side.toUpperCase()} position opened!`, {
          description: `${quantity} ${symbol} @ $${orderPrice.toFixed(2)} | Fee: $${fees.tradingFee.toFixed(2)}`,
        });
      } else {
        toast.success(`${side.toUpperCase()} ${orderType} order placed!`, {
          description: `${quantity} ${symbol} @ $${price}`,
        });
      }

      // Reset form
      setPrice('');
      setQuantity('');
      setStopLoss('');
      setTakeProfit('');
      setLeverage('1');
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const fees = calculateFees();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-chart-4/15 ring-2 ring-chart-4/35 shadow-lg shadow-chart-4/20">
            <ShoppingCart className="w-5 h-5 text-chart-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-foreground uppercase tracking-wide">Order Execution</h3>
            <p className="text-[9px] text-muted-foreground font-mono">Multi-Asset Trading</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] font-mono">
            {assetType.toUpperCase()}
          </Badge>
          <div className="flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-primary animate-pulse" />
            <span className="text-[10px] font-mono font-bold text-primary">ACTIVE</span>
          </div>
        </div>
      </div>

      <Tabs value={side} onValueChange={(v) => setSide(v as 'buy' | 'sell')}>
        <TabsList className="grid w-full grid-cols-2 p-1.5 bg-muted/40 backdrop-blur-2xl rounded-xl border border-border/40">
          <TabsTrigger 
            value="buy" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-success/30 data-[state=active]:to-success/20 data-[state=active]:text-success data-[state=active]:shadow-2xl data-[state=active]:shadow-success/30 data-[state=active]:ring-2 data-[state=active]:ring-success/40 font-black text-xs transition-all duration-300 rounded-lg"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            BUY LONG
          </TabsTrigger>
          <TabsTrigger 
            value="sell" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-destructive/30 data-[state=active]:to-destructive/20 data-[state=active]:text-destructive data-[state=active]:shadow-2xl data-[state=active]:shadow-destructive/30 data-[state=active]:ring-2 data-[state=active]:ring-destructive/40 font-black text-xs transition-all duration-300 rounded-lg"
          >
            <TrendingDown className="w-4 h-4 mr-2" />
            SELL SHORT
          </TabsTrigger>
        </TabsList>

        <TabsContent value={side} className="space-y-3">
          {/* Order Type */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-foreground uppercase tracking-wider">Order Type</Label>
            <Select value={orderType} onValueChange={setOrderType}>
              <SelectTrigger className="h-10 border-primary/20 bg-primary/5 hover:bg-primary/10 font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="market">
                  <div className="flex items-center gap-2 font-semibold">
                    <Zap className="w-4 h-4 text-warning" />
                    <span>Market Order</span>
                  </div>
                </SelectItem>
                <SelectItem value="limit">
                  <div className="flex items-center gap-2">
                    <span>📊 Limit Order</span>
                  </div>
                </SelectItem>
                <SelectItem value="stop_loss">
                  <div className="flex items-center gap-2">
                    <span>🛡️ Stop Loss</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Price Input */}
          {orderType !== 'market' && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Price (USDT)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="h-9"
              />
            </div>
          )}

          {/* Quantity Input */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Quantity</Label>
            <Input
              type="number"
              step="0.00000001"
              placeholder="0.00"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="h-9"
            />
            <div className="flex gap-1">
              {[25, 50, 75, 100].map((pct) => (
                <Button
                  key={pct}
                  variant="outline"
                  size="sm"
                  className="flex-1 h-7 text-xs"
                  onClick={() => setQuantity((1 * (pct / 100)).toFixed(8))}
                >
                  {pct}%
                </Button>
              ))}
            </div>
          </div>

          {/* Leverage Input */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Leverage</Label>
            <Select value={leverage} onValueChange={setLeverage}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 5, 10, 20, 50, 100].map((lev) => (
                  <SelectItem key={lev} value={lev.toString()}>
                    {lev}x
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fee Display */}
          {feeData && quantity && currentPrice > 0 && (
            <div className="p-3 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-lg border border-primary/20 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Order Value:</span>
                <span className="text-foreground font-mono font-bold">${fees.notionalValue.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Trading Fee ({(feeData[orderType === 'market' ? 'taker_fee' : 'maker_fee'] * 100).toFixed(3)}%):</span>
                <span className="text-foreground font-mono">${fees.tradingFee.toFixed(4)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  Platform Commission ({(feeData.platform_commission_rate * 100).toFixed(3)}%):
                  <Info className="w-3 h-3" />
                </span>
                <span className="text-primary font-mono">${fees.commission.toFixed(4)}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold pt-1.5 border-t border-primary/20">
                <span>Total Cost:</span>
                <span className="text-primary font-mono text-sm">${fees.total.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Advanced Risk Management */}
          <div className="space-y-3 p-4 rounded-xl bg-gradient-to-br from-muted/30 to-muted/10 border border-border/50 backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-chart-4/20 ring-2 ring-chart-4/30">
                <Shield className="w-4 h-4 text-chart-4" />
              </div>
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">Risk Management</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-destructive uppercase tracking-wider flex items-center gap-1">
                  <div className="h-1 w-1 rounded-full bg-destructive" />
                  Stop Loss
                </Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  className="h-9 text-xs font-mono font-bold border-destructive/30 bg-destructive/5 focus:border-destructive focus:ring-destructive"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-success uppercase tracking-wider flex items-center gap-1">
                  <div className="h-1 w-1 rounded-full bg-success" />
                  Take Profit
                </Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={takeProfit}
                  onChange={(e) => setTakeProfit(e.target.value)}
                  className="h-9 text-xs font-mono font-bold border-success/30 bg-success/5 focus:border-success focus:ring-success"
                />
              </div>
            </div>

            {/* Risk/Reward Display */}
            {stopLoss && takeProfit && (currentPrice || price) && (
              <div className="metric-card p-2.5 rounded-lg">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">Risk/Reward</span>
                  <span className="font-mono font-bold text-primary">
                    1:{((parseFloat(takeProfit) - (currentPrice || parseFloat(price))) / ((currentPrice || parseFloat(price)) - parseFloat(stopLoss))).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Ultra-Elite Execution Button */}
          <Button
            onClick={placeOrder}
            disabled={loading}
            className={`relative w-full h-14 font-black text-base uppercase tracking-widest transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] overflow-hidden rounded-xl disabled:opacity-50 disabled:cursor-not-allowed ${
              side === 'buy'
                ? 'bg-gradient-to-r from-success via-success to-success/80 hover:from-success/90 hover:to-success/70 text-white shadow-2xl shadow-success/40 hover:shadow-[0_0_50px_rgba(16,185,129,0.5)] ring-2 ring-success/50'
                : 'bg-gradient-to-r from-destructive via-destructive to-destructive/80 hover:from-destructive/90 hover:to-destructive/70 text-white shadow-2xl shadow-destructive/40 hover:shadow-[0_0_50px_rgba(239,68,68,0.5)] ring-2 ring-destructive/50'
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            <div className="relative z-10 flex items-center justify-center gap-3">
              {loading ? (
                <span>PROCESSING...</span>
              ) : (
                <>
                  {side === 'buy' ? (
                    <>
                      <TrendingUp className="w-6 h-6" />
                      <span>EXECUTE BUY {orderType.toUpperCase()}</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-6 h-6" />
                      <span>EXECUTE SELL {orderType.toUpperCase()}</span>
                    </>
                  )}
                  <Zap className="w-5 h-5 animate-pulse" />
                </>
              )}
            </div>
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
};
