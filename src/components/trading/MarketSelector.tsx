import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Bitcoin, 
  TrendingUp, 
  DollarSign, 
  Package, 
  Activity,
  Star,
  Plus
} from 'lucide-react';
import { AssetType } from '@/types/trading';
import { POPULAR_SYMBOLS } from '@/lib/market-data';

interface MarketSelectorProps {
  onSelectSymbol: (symbol: string, assetType: AssetType) => void;
  selectedSymbol?: string;
}

export const MarketSelector = ({ onSelectSymbol, selectedSymbol }: MarketSelectorProps) => {
  const [activeTab, setActiveTab] = useState<AssetType>('crypto');

  const assetIcons = {
    crypto: Bitcoin,
    stock: TrendingUp,
    forex: DollarSign,
    commodity: Package,
    index: Activity,
  };

  const assetLabels = {
    crypto: 'Cryptocurrency',
    stock: 'Stocks',
    forex: 'Forex',
    commodity: 'Commodities',
    index: 'Indices',
  };

  return (
    <Card className="bg-background/95 backdrop-blur border-primary/20">
      <div className="p-4 border-b border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Elite Market Explorer</h2>
          </div>
          <Badge variant="outline" className="border-primary/30">
            Multi-Asset Terminal
          </Badge>
        </div>
      </div>

      <div className="p-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AssetType)}>
          <TabsList className="grid w-full grid-cols-5 bg-background/50">
            {(Object.keys(assetIcons) as AssetType[]).map((type) => {
              const Icon = assetIcons[type];
              return (
                <TabsTrigger 
                  key={type} 
                  value={type}
                  className="data-[state=active]:bg-primary/20"
                >
                  <Icon className="w-4 h-4 mr-1" />
                  {assetLabels[type]}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {(Object.keys(assetIcons) as AssetType[]).map((type) => (
            <TabsContent key={type} value={type} className="space-y-2 mt-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {POPULAR_SYMBOLS[type]?.map((symbol) => (
                  <Button
                    key={symbol}
                    variant={selectedSymbol === symbol ? "default" : "outline"}
                    className={`justify-between ${
                      selectedSymbol === symbol 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-primary/10'
                    }`}
                    onClick={() => onSelectSymbol(symbol, type)}
                  >
                    <span className="font-mono text-xs">{symbol}</span>
                    {selectedSymbol === symbol && <Star className="w-3 h-3 fill-current" />}
                  </Button>
                ))}
              </div>
              
              <Button variant="ghost" className="w-full mt-4 border border-dashed border-primary/30">
                <Plus className="w-4 h-4 mr-2" />
                Add Custom {assetLabels[type]}
              </Button>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </Card>
  );
};
