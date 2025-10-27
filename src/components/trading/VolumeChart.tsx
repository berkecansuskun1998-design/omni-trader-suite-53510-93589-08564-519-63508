import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { Activity } from 'lucide-react';

interface VolumeChartProps {
  data: { x: number; y: number; color?: string }[];
}

export function VolumeChart({ data }: VolumeChartProps) {
  const options: ApexOptions = {
    chart: {
      type: 'bar',
      height: 100,
      background: 'transparent',
      toolbar: {
        show: false,
      },
      animations: {
        enabled: false,
      },
    },
    plotOptions: {
      bar: {
        colors: {
          ranges: [
            {
              from: 0,
              to: Number.MAX_VALUE,
              color: 'hsl(var(--primary))',
            },
          ],
        },
        columnWidth: '80%',
      },
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      type: 'datetime',
      labels: {
        show: false,
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      labels: {
        show: true,
        style: {
          colors: 'hsl(var(--muted-foreground))',
          fontSize: '10px',
        },
        formatter: (value) => {
          if (value >= 1e6) return (value / 1e6).toFixed(1) + 'M';
          if (value >= 1e3) return (value / 1e3).toFixed(1) + 'K';
          return value.toFixed(0);
        },
      },
    },
    grid: {
      show: false,
    },
    tooltip: {
      enabled: true,
      theme: 'dark',
      x: {
        format: 'dd MMM yyyy HH:mm',
      },
      y: {
        formatter: (value) => value.toLocaleString(),
      },
    },
  };

  return (
    <div className="relative rounded-xl border border-border/50 bg-gradient-to-br from-card/50 to-card/30 p-4 overflow-hidden">
      <div className="absolute top-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
      <div className="relative z-10">
        <div className="mb-2 flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Activity className="w-3.5 h-3.5 text-primary" />
          </div>
          <div>
            <div className="text-xs font-bold text-foreground">TRADING VOLUME</div>
            <div className="text-[10px] text-muted-foreground">Real-time activity</div>
          </div>
        </div>
        <ReactApexChart
          options={options}
          series={[{ name: 'Volume', data }]}
          type="bar"
          height={100}
        />
      </div>
    </div>
  );
}
