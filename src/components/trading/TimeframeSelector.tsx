import { Timeframe } from '@/types/trading';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';

interface TimeframeSelectorProps {
  selected: Timeframe;
  onChange: (timeframe: Timeframe) => void;
}

const timeframes: Timeframe[] = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'];

export const TimeframeSelector = ({ selected, onChange }: TimeframeSelectorProps) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Timeframe</h3>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {timeframes.map((tf) => (
          <Button key={tf} variant={selected === tf ? 'default' : 'outline'} size="sm" onClick={() => onChange(tf)} className={`h-8 transition-all ${selected === tf ? 'shadow-lg shadow-primary/20' : 'hover:border-primary/30'}`}>
            {tf}
          </Button>
        ))}
      </div>
    </div>
  );
};
