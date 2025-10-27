import { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { Exchange } from '@/types/trading';
import { EXCHANGES } from '@/lib/exchanges';
import { Loader2, Activity } from 'lucide-react';

interface DepthChartProps {
  exchange: Exchange;
  symbol: string;
}

interface DepthData {
  bids: [number, number][];
  asks: [number, number][];
}

export function DepthChart({ exchange, symbol }: DepthChartProps) {
  const [depthData, setDepthData] = useState<DepthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDepth = async () => {
      try {
        setLoading(true);
        let url = '';
        
        if (exchange === 'BINANCE') {
          url = EXCHANGES.BINANCE.depth(symbol, 100);
        } else if (exchange === 'OKX') {
          url = EXCHANGES.OKX.depth(symbol);
        } else if (exchange === 'KUCOIN') {
          url = EXCHANGES.KUCOIN.depth(symbol);
        } else if (exchange === 'COINBASE') {
          url = EXCHANGES.COINBASE.depth(symbol);
        }

        const response = await fetch(url);
        const data = await response.json();

        let bids: [number, number][] = [];
        let asks: [number, number][] = [];

        if (exchange === 'BINANCE') {
          bids = data.bids.slice(0, 50).map((b: any) => [parseFloat(b[0]), parseFloat(b[1])]);
          asks = data.asks.slice(0, 50).map((a: any) => [parseFloat(a[0]), parseFloat(a[1])]);
        } else if (exchange === 'OKX') {
          const d = data.data || data;
          bids = (d.bids || []).slice(0, 50).map((b: any) => [parseFloat(b[0]), parseFloat(b[1])]);
          asks = (d.asks || []).slice(0, 50).map((a: any) => [parseFloat(a[0]), parseFloat(a[1])]);
        } else if (exchange === 'KUCOIN') {
          const d = data.data || data;
          bids = (d.bids || []).slice(0, 50).map((b: any) => [parseFloat(b[0]), parseFloat(b[1])]);
          asks = (d.asks || []).slice(0, 50).map((a: any) => [parseFloat(a[0]), parseFloat(a[1])]);
        } else if (exchange === 'COINBASE') {
          bids = (data.bids || []).slice(0, 50).map((b: any) => [parseFloat(b[0]), parseFloat(b[1])]);
          asks = (data.asks || []).slice(0, 50).map((a: any) => [parseFloat(a[0]), parseFloat(a[1])]);
        }

        setDepthData({ bids, asks });
      } catch (error) {
        console.error('Failed to fetch depth data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDepth();
    const interval = setInterval(fetchDepth, 5000);
    return () => clearInterval(interval);
  }, [exchange, symbol]);

  if (loading || !depthData) {
    return (
      <div className="glass-panel flex h-[300px] items-center justify-center rounded-xl">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate cumulative depth
  let bidsCumulative = 0;
  const bidsDepth = depthData.bids.map(([price, volume]) => {
    bidsCumulative += volume;
    return { x: price, y: bidsCumulative };
  }).reverse();

  let asksCumulative = 0;
  const asksDepth = depthData.asks.map(([price, volume]) => {
    asksCumulative += volume;
    return { x: price, y: asksCumulative };
  });

  const series = [
    {
      name: 'Bids',
      data: bidsDepth,
      color: 'hsl(var(--success))',
    },
    {
      name: 'Asks',
      data: asksDepth,
      color: 'hsl(var(--destructive))',
    },
  ];

  const options: ApexOptions = {
    chart: {
      type: 'area',
      height: 300,
      background: 'transparent',
      toolbar: {
        show: false,
      },
      animations: {
        enabled: true,
        speed: 800,
      },
      zoom: {
        enabled: true,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: 'stepline',
      width: 2,
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.6,
        opacityTo: 0.1,
        stops: [0, 100],
      },
    },
    xaxis: {
      type: 'numeric',
      labels: {
        style: {
          colors: 'hsl(var(--muted-foreground))',
          fontSize: '10px',
        },
        formatter: (value: any) => (typeof value === 'number' ? value.toFixed(2) : String(value)),
      },
      title: {
        text: 'Price',
        style: {
          color: 'hsl(var(--foreground))',
          fontSize: '11px',
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: 'hsl(var(--muted-foreground))',
          fontSize: '10px',
        },
        formatter: (value: number) => {
          if (value >= 1e6) return (value / 1e6).toFixed(1) + 'M';
          if (value >= 1e3) return (value / 1e3).toFixed(1) + 'K';
          return value.toFixed(0);
        },
      },
      title: {
        text: 'Cumulative Volume',
        style: {
          color: 'hsl(var(--foreground))',
          fontSize: '11px',
        },
      },
    },
    grid: {
      borderColor: 'hsl(var(--border))',
      strokeDashArray: 4,
    },
    legend: {
      show: true,
      position: 'top',
      labels: {
        colors: 'hsl(var(--foreground))',
      },
    },
    tooltip: {
      theme: 'dark',
      x: {
        formatter: (value: any) => {
          const num = typeof value === 'number' ? value : parseFloat(value);
          return `Price: $${num.toFixed(6)}`;
        },
      },
      y: {
        formatter: (value: any) => {
          const num = typeof value === 'number' ? value : parseFloat(value);
          return `Volume: ${num.toLocaleString()}`;
        },
      },
    },
  };

  return (
    <div className="relative glass-panel animate-fade-in rounded-xl p-5 border border-border/50 overflow-hidden">
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl" />
      <div className="relative z-10">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 backdrop-blur-sm">
              <Activity className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">Elite Market Depth</h4>
              <p className="text-xs text-muted-foreground">Real-time order book visualization</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-success/10 border border-success/20">
              <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span className="text-success font-medium">Bids</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
              <span className="text-destructive font-medium">Asks</span>
            </div>
          </div>
        </div>
        
        <ReactApexChart options={options} series={series} type="area" height={300} />
      </div>
    </div>
  );
}
