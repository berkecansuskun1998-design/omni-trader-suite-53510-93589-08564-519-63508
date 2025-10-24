import { useState } from 'react';
import { Layers, TrendingUp, Shield, Zap, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

type OrderType = 'trailing_stop' | 'iceberg' | 'twap' | 'oco' | 'bracket';

export const AdvancedOrderTypes = () => {
  const [orderType, setOrderType] = useState<OrderType>('trailing_stop');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');

  const orderTypes = [
    {
      id: 'trailing_stop' as OrderType,
      name: 'Trailing Stop',
      icon: TrendingUp,
      description: 'Auto-adjusting stop loss',
      color: 'text-chart-4',
    },
    {
      id: 'iceberg' as OrderType,
      name: 'Iceberg Order',
      icon: Layers,
      description: 'Hide large orders',
      color: 'text-chart-2',
    },
    {
      id: 'twap' as OrderType,
      name: 'TWAP',
      icon: Zap,
      description: 'Time-weighted average',
      color: 'text-chart-3',
    },
    {
      id: 'oco' as OrderType,
      name: 'OCO',
      icon: Repeat,
      description: 'One-cancels-other',
      color: 'text-primary',
    },
    {
      id: 'bracket' as OrderType,
      name: 'Bracket Order',
      icon: Shield,
      description: 'TP + SL combo',
      color: 'text-success',
    },
  ];

  const placeOrder = () => {
    if (!quantity || !price) {
      toast.error('Please fill in all fields');
      return;
    }

    const selectedType = orderTypes.find(t => t.id === orderType);
    toast.success('Advanced order placed!', {
      description: `${selectedType?.name}: ${quantity} @ $${price}`,
    });
  };

  const selectedOrder = orderTypes.find(t => t.id === orderType);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Layers className="w-4 h-4 text-chart-4" />
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Advanced Orders</h3>
      </div>

      {/* Order Type Selector */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Order Type</Label>
        <div className="grid grid-cols-2 gap-2">
          {orderTypes.map((type) => (
            <Button
              key={type.id}
              variant={orderType === type.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setOrderType(type.id)}
              className={`h-auto py-3 flex-col gap-1 ${
                orderType === type.id ? 'ring-2 ring-primary' : ''
              }`}
            >
              <type.icon className={`w-4 h-4 ${orderType === type.id ? 'text-primary-foreground' : type.color}`} />
              <span className="text-[10px] font-medium">{type.name}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Description */}
      {selectedOrder && (
        <div className={`p-3 rounded-lg border bg-gradient-to-r from-${selectedOrder.color.replace('text-', '')}/10 to-transparent border-${selectedOrder.color.replace('text-', '')}/20`}>
          <div className="flex items-center gap-2 mb-1">
            <selectedOrder.icon className={`w-3 h-3 ${selectedOrder.color}`} />
            <span className={`text-xs font-semibold ${selectedOrder.color}`}>{selectedOrder.name}</span>
          </div>
          <div className="text-[10px] text-muted-foreground">{selectedOrder.description}</div>
        </div>
      )}

      {/* Order Form */}
      <div className="space-y-3 p-3 rounded-lg bg-muted/20 border border-border">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Quantity</Label>
          <Input
            type="number"
            placeholder="0.00"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="h-9"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Price</Label>
          <Input
            type="number"
            placeholder="0.00"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="h-9"
          />
        </div>

        {/* Order-Specific Settings */}
        {orderType === 'trailing_stop' && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Trailing %</Label>
            <Input type="number" placeholder="2.5" className="h-9" />
          </div>
        )}

        {orderType === 'iceberg' && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Visible Quantity</Label>
            <Input type="number" placeholder="10%" className="h-9" />
          </div>
        )}

        {orderType === 'twap' && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Duration (minutes)</Label>
            <Input type="number" placeholder="30" className="h-9" />
          </div>
        )}

        {orderType === 'oco' && (
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Limit Price</Label>
              <Input type="number" placeholder="0.00" className="h-9" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Stop Price</Label>
              <Input type="number" placeholder="0.00" className="h-9" />
            </div>
          </div>
        )}

        {orderType === 'bracket' && (
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Take Profit</Label>
              <Input type="number" placeholder="0.00" className="h-9" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Stop Loss</Label>
              <Input type="number" placeholder="0.00" className="h-9" />
            </div>
          </div>
        )}

        <Button onClick={placeOrder} className="w-full h-10 font-semibold">
          Place {selectedOrder?.name}
        </Button>
      </div>

      {/* Info */}
      <div className="p-3 rounded-lg bg-muted/20 border border-border text-xs text-muted-foreground">
        💡 Advanced orders help manage large positions with minimal market impact
      </div>
    </div>
  );
};
