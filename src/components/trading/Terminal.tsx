import { useEffect, useRef, memo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TerminalProps {
  logs: Array<{ message: string; level: 'info' | 'warn' | 'error'; timestamp: Date }>;
}

export const Terminal = memo(({ logs }: TerminalProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 ring-2 ring-primary/30">
            <div className="h-3 w-3 rounded bg-gradient-to-br from-primary to-primary/60 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-black text-foreground uppercase tracking-wide">System Console</h4>
            <p className="text-[9px] text-muted-foreground font-mono">Real-time execution log stream</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono">
          <div className="h-1.5 w-1.5 rounded-full bg-success animate-breathe" />
          <span className="text-success font-bold">LIVE</span>
        </div>
      </div>
      
      <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-card to-card/50 backdrop-blur-xl">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
        
        <ScrollArea className="h-[220px] p-4 relative z-10">
          <div ref={scrollRef} className="space-y-1.5 font-mono text-xs">
            {logs.length === 0 && (
              <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
                <div className="h-1 w-1 rounded-full bg-primary" />
                <span>Initializing console stream...</span>
              </div>
            )}
            {logs.slice(-100).map((log, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-2 transition-all hover:bg-primary/5 rounded px-2 py-1 ${
                  log.level === 'error'
                    ? 'text-destructive bg-destructive/5'
                    : log.level === 'warn'
                    ? 'text-warning bg-warning/5'
                    : 'text-foreground/80'
                }`}
              >
                <span className="text-primary/70 font-bold flex-shrink-0 text-[10px]">
                  {log.timestamp.toLocaleTimeString()}
                </span>
                <span className={`flex-1 ${log.level === 'error' ? 'font-bold' : ''}`}>
                  {log.level === 'error' && '❌ '}
                  {log.level === 'warn' && '⚠️ '}
                  {log.level === 'info' && '✓ '}
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
});

Terminal.displayName = 'Terminal';
