import { useState } from 'react';
import { Bell, Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface Alert {
  id: string;
  symbol: string;
  condition: 'above' | 'below';
  price: number;
  active: boolean;
}

export const PriceAlerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([
    { id: '1', symbol: 'BTCUSDT', condition: 'above', price: 70000, active: true },
    { id: '2', symbol: 'ETHUSDT', condition: 'below', price: 3000, active: true },
  ]);
  const [newSymbol, setNewSymbol] = useState('BTCUSDT');
  const [newCondition, setNewCondition] = useState<'above' | 'below'>('above');
  const [newPrice, setNewPrice] = useState('');

  const addAlert = () => {
    if (!newPrice || parseFloat(newPrice) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    const alert: Alert = {
      id: Date.now().toString(),
      symbol: newSymbol,
      condition: newCondition,
      price: parseFloat(newPrice),
      active: true,
    };

    setAlerts([alert, ...alerts]);
    setNewPrice('');
    toast.success('Alert created!');
  };

  const deleteAlert = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id));
    toast.info('Alert deleted');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Bell className="w-4 h-4 text-chart-4" />
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Price Alerts</h3>
      </div>

      {/* Add New Alert */}
      <div className="space-y-2 p-3 rounded-lg bg-muted/20 border border-border">
        <div className="grid grid-cols-2 gap-2">
          <Select value={newSymbol} onValueChange={setNewSymbol}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BTCUSDT">BTC</SelectItem>
              <SelectItem value="ETHUSDT">ETH</SelectItem>
              <SelectItem value="BNBUSDT">BNB</SelectItem>
              <SelectItem value="SOLUSDT">SOL</SelectItem>
            </SelectContent>
          </Select>

          <Select value={newCondition} onValueChange={(v) => setNewCondition(v as 'above' | 'below')}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="above">Above</SelectItem>
              <SelectItem value="below">Below</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Price..."
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            className="h-9"
          />
          <Button onClick={addAlert} size="sm" className="gap-1">
            <Plus className="w-3 h-3" />
            Add
          </Button>
        </div>
      </div>

      {/* Active Alerts */}
      <div className="space-y-2">
        {alerts.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            No alerts set
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border hover:border-primary/30 transition-colors group"
            >
              <div className="flex items-center gap-3">
                {alert.condition === 'above' ? (
                  <TrendingUp className="w-4 h-4 text-success" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-destructive" />
                )}
                <div>
                  <div className="text-sm font-medium text-foreground">
                    {alert.symbol.replace('USDT', '')}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {alert.condition} ${alert.price.toLocaleString()}
                  </div>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteAlert(alert.id)}
                className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3 h-3 text-destructive" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
