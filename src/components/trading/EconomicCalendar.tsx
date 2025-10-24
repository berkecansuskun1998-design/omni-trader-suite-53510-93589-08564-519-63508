import { Calendar, Clock, TrendingUp } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface EconomicEvent {
  time: string;
  currency: string;
  event: string;
  impact: 'high' | 'medium' | 'low';
  actual?: string;
  forecast?: string;
  previous?: string;
}

const mockEvents: EconomicEvent[] = [
  { time: '14:30', currency: 'USD', event: 'Non-Farm Payrolls', impact: 'high', forecast: '200K', previous: '187K' },
  { time: '15:00', currency: 'USD', event: 'Unemployment Rate', impact: 'high', forecast: '3.8%', previous: '3.9%' },
  { time: '16:00', currency: 'EUR', event: 'ECB Interest Rate Decision', impact: 'high', forecast: '4.50%', previous: '4.50%' },
  { time: '17:30', currency: 'GBP', event: 'GDP Growth Rate', impact: 'medium', forecast: '0.3%', previous: '0.1%' },
  { time: '18:00', currency: 'USD', event: 'FOMC Meeting Minutes', impact: 'high' },
  { time: '19:00', currency: 'JPY', event: 'BoJ Policy Rate', impact: 'high', forecast: '-0.10%', previous: '-0.10%' },
];

export const EconomicCalendar = () => {
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'medium': return 'bg-chart-4/20 text-chart-4 border-chart-4/30';
      case 'low': return 'bg-success/20 text-success border-success/30';
      default: return 'bg-muted/20 text-muted-foreground border-muted/30';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-chart-2" />
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Economic Calendar</h3>
      </div>

      <ScrollArea className="h-[300px]">
        <div className="space-y-2">
          {mockEvents.map((event, i) => (
            <div
              key={i}
              className="p-3 rounded-lg bg-muted/30 border border-border hover:border-primary/30 transition-all group"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs font-medium text-foreground">{event.time}</span>
                  <span className="text-xs font-bold text-primary">{event.currency}</span>
                </div>
                <div className={`text-[10px] px-2 py-0.5 rounded-full border uppercase ${getImpactColor(event.impact)}`}>
                  {event.impact}
                </div>
              </div>

              <div className="text-sm font-medium text-foreground mb-2">
                {event.event}
              </div>

              {(event.forecast || event.previous) && (
                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  {event.forecast && (
                    <div>
                      <div className="text-muted-foreground">Forecast</div>
                      <div className="text-foreground font-medium">{event.forecast}</div>
                    </div>
                  )}
                  {event.previous && (
                    <div>
                      <div className="text-muted-foreground">Previous</div>
                      <div className="text-foreground font-medium">{event.previous}</div>
                    </div>
                  )}
                  {event.actual && (
                    <div>
                      <div className="text-muted-foreground">Actual</div>
                      <div className="text-success font-bold">{event.actual}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-3 rounded-lg bg-gradient-to-r from-primary/10 to-chart-2/10 border border-primary/20">
        <div className="flex items-center gap-2 text-xs text-primary">
          <TrendingUp className="w-3 h-3" />
          <span className="font-medium">High impact events can cause 2-5% price movements</span>
        </div>
      </div>
    </div>
  );
};
