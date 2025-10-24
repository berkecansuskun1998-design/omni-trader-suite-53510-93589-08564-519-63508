import { useState } from 'react';
import { LayoutGrid, Maximize2, Grid3x3, Columns2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type LayoutType = 'single' | 'dual-vertical' | 'dual-horizontal' | 'quad';

export const MultiChartLayout = () => {
  const [layout, setLayout] = useState<LayoutType>('single');

  const layouts = [
    { id: 'single' as LayoutType, icon: Maximize2, label: 'Single', cols: 1 },
    { id: 'dual-vertical' as LayoutType, icon: Columns2, label: 'Dual V', cols: 2 },
    { id: 'dual-horizontal' as LayoutType, icon: Columns2, label: 'Dual H', cols: 1, rotate: true },
    { id: 'quad' as LayoutType, icon: Grid3x3, label: 'Quad', cols: 2 },
  ];

  const handleLayoutChange = (newLayout: LayoutType) => {
    setLayout(newLayout);
    toast.success('Layout changed', {
      description: layouts.find(l => l.id === newLayout)?.label,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <LayoutGrid className="w-4 h-4 text-chart-4" />
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Chart Layout</h3>
      </div>

      {/* Layout Selector */}
      <div className="grid grid-cols-4 gap-2">
        {layouts.map((l) => (
          <Button
            key={l.id}
            variant={layout === l.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleLayoutChange(l.id)}
            className={`flex-col h-auto py-3 gap-1 transition-all ${
              layout === l.id ? 'ring-2 ring-primary' : ''
            }`}
          >
            <l.icon 
              className={`w-4 h-4 ${l.rotate ? 'rotate-90' : ''} ${
                layout === l.id ? 'text-primary-foreground' : 'text-chart-4'
              }`} 
            />
            <span className="text-[10px]">{l.label}</span>
          </Button>
        ))}
      </div>

      {/* Layout Preview */}
      <div className="p-4 rounded-lg bg-muted/20 border border-border">
        <div className="text-xs text-muted-foreground mb-3 text-center">Preview</div>
        
        {layout === 'single' && (
          <div className="aspect-video rounded border-2 border-dashed border-primary/30 bg-primary/5 flex items-center justify-center">
            <span className="text-xs text-muted-foreground">Main Chart</span>
          </div>
        )}

        {layout === 'dual-vertical' && (
          <div className="grid grid-cols-2 gap-2">
            <div className="aspect-video rounded border-2 border-dashed border-primary/30 bg-primary/5 flex items-center justify-center">
              <span className="text-xs text-muted-foreground">Chart 1</span>
            </div>
            <div className="aspect-video rounded border-2 border-dashed border-chart-4/30 bg-chart-4/5 flex items-center justify-center">
              <span className="text-xs text-muted-foreground">Chart 2</span>
            </div>
          </div>
        )}

        {layout === 'dual-horizontal' && (
          <div className="grid grid-rows-2 gap-2">
            <div className="aspect-video rounded border-2 border-dashed border-primary/30 bg-primary/5 flex items-center justify-center">
              <span className="text-xs text-muted-foreground">Chart 1</span>
            </div>
            <div className="aspect-video rounded border-2 border-dashed border-chart-4/30 bg-chart-4/5 flex items-center justify-center">
              <span className="text-xs text-muted-foreground">Chart 2</span>
            </div>
          </div>
        )}

        {layout === 'quad' && (
          <div className="grid grid-cols-2 grid-rows-2 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`aspect-video rounded border-2 border-dashed ${
                  i === 1 ? 'border-primary/30 bg-primary/5' :
                  i === 2 ? 'border-chart-4/30 bg-chart-4/5' :
                  i === 3 ? 'border-chart-2/30 bg-chart-2/5' :
                  'border-chart-3/30 bg-chart-3/5'
                } flex items-center justify-center`}
              >
                <span className="text-[10px] text-muted-foreground">Chart {i}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chart Assignment */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Chart Assignments
        </div>
        {layout !== 'single' && (
          <div className="space-y-1">
            {Array.from({ length: layout === 'quad' ? 4 : 2 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border text-xs"
              >
                <span className="text-muted-foreground">Chart {i + 1}</span>
                <select className="bg-background border border-border rounded px-2 py-1 text-foreground">
                  <option>BTC/USDT</option>
                  <option>ETH/USDT</option>
                  <option>BNB/USDT</option>
                </select>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
