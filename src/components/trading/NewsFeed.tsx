import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { RefreshCw, ExternalLink } from 'lucide-react';
import { NewsItem } from '@/types/trading';

const NEWS_URL = 'https://min-api.cryptocompare.com/data/v2/news/?lang=EN&feeds=cointelegraph,coindesk';

export function NewsFeed() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const response = await fetch(NEWS_URL);
      if (!response.ok) throw new Error('Failed to fetch news');
      
      const data = await response.json();
      setNews(data.Data?.slice(0, 20) || []);
    } catch (error) {
      console.error('News fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 ring-2 ring-primary/35 shadow-lg shadow-primary/20">
            <div className="h-4 w-4 rounded bg-gradient-to-br from-primary to-primary/60 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-black text-foreground uppercase tracking-wide">Live News Feed</h4>
            <p className="text-[9px] text-muted-foreground font-mono">Real-time market intelligence</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchNews}
          disabled={loading}
          className="h-10 w-10 p-0 rounded-xl hover:bg-primary/15 hover:ring-2 hover:ring-primary/30 transition-all"
        >
          <RefreshCw className={`h-5 w-5 text-primary ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <ScrollArea className="h-[450px]">
        <div className="space-y-3">
          {loading && news.length === 0 && (
            <div className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="font-mono">Loading intelligence stream...</span>
            </div>
          )}
          
          {news.map((item, idx) => (
            <div
              key={idx}
              className="group relative overflow-hidden rounded-xl border-2 border-border/40 bg-gradient-to-br from-card to-card/70 p-4 backdrop-blur-xl transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 animate-fade-in-up"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative z-10 space-y-3">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 group/link"
                >
                  <div className="flex-1">
                    <h5 className="text-sm font-bold text-foreground group-hover/link:text-primary transition-colors leading-snug">
                      {item.title}
                    </h5>
                  </div>
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/30 transition-all group-hover/link:bg-primary/20 group-hover/link:ring-2">
                    <ExternalLink className="h-3.5 w-3.5 text-primary" />
                  </div>
                </a>
                
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{item.body}</p>
                
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  <span className="px-2 py-1 rounded-lg bg-primary/10 text-primary font-bold uppercase tracking-wider">
                    {item.source}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground font-medium">
                    {new Date(item.published_on * 1000).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
