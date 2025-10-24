import { useState } from 'react';
import { Pencil, TrendingUp, Minus, Circle, Square, Triangle, Eraser, Save, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type DrawingTool = 'none' | 'trendline' | 'horizontal' | 'vertical' | 'rectangle' | 'circle' | 'fibonacci';

export const DrawingTools = () => {
  const [activeTool, setActiveTool] = useState<DrawingTool>('none');
  const [savedDrawings, setSavedDrawings] = useState<string[]>([]);

  const tools = [
    { id: 'trendline' as DrawingTool, icon: TrendingUp, label: 'Trend Line', color: 'text-chart-4' },
    { id: 'horizontal' as DrawingTool, icon: Minus, label: 'Horizontal', color: 'text-chart-2' },
    { id: 'rectangle' as DrawingTool, icon: Square, label: 'Rectangle', color: 'text-chart-3' },
    { id: 'circle' as DrawingTool, icon: Circle, label: 'Circle', color: 'text-chart-1' },
    { id: 'fibonacci' as DrawingTool, icon: Triangle, label: 'Fibonacci', color: 'text-primary' },
  ];

  const handleToolSelect = (tool: DrawingTool) => {
    setActiveTool(tool);
    toast.info(`${tool} tool activated`, {
      description: 'Click on chart to draw',
    });
  };

  const handleClear = () => {
    setActiveTool('none');
    toast.success('All drawings cleared');
  };

  const handleSave = () => {
    const drawingName = `Drawing ${savedDrawings.length + 1}`;
    setSavedDrawings([...savedDrawings, drawingName]);
    toast.success('Drawing template saved', {
      description: drawingName,
    });
  };

  const handleLoad = (name: string) => {
    toast.success('Drawing template loaded', {
      description: name,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Pencil className="w-4 h-4 text-chart-4" />
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Drawing Tools</h3>
      </div>

      {/* Tool Buttons */}
      <div className="grid grid-cols-3 gap-2">
        {tools.map((tool) => (
          <Button
            key={tool.id}
            variant={activeTool === tool.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleToolSelect(tool.id)}
            className={`flex-col h-auto py-3 gap-1 transition-all ${
              activeTool === tool.id ? 'ring-2 ring-primary' : ''
            }`}
          >
            <tool.icon className={`w-4 h-4 ${activeTool === tool.id ? 'text-primary-foreground' : tool.color}`} />
            <span className="text-[10px]">{tool.label}</span>
          </Button>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleClear}
          className="flex-1 gap-1"
        >
          <Eraser className="w-3 h-3" />
          Clear
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSave}
          className="flex-1 gap-1"
        >
          <Save className="w-3 h-3" />
          Save
        </Button>
      </div>

      {/* Drawing Settings */}
      {activeTool !== 'none' && (
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 animate-fade-in">
          <div className="text-xs font-medium text-primary mb-2">
            {activeTool.toUpperCase()} Active
          </div>
          <div className="text-[10px] text-muted-foreground space-y-1">
            <div>• Click to place first point</div>
            <div>• Click again to complete</div>
            <div>• Press ESC to cancel</div>
          </div>
        </div>
      )}

      {/* Saved Templates */}
      {savedDrawings.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Saved Templates
          </div>
          {savedDrawings.map((name, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border hover:border-primary/30 transition-colors group"
            >
              <span className="text-xs text-foreground">{name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleLoad(name)}
                className="h-7 gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Upload className="w-3 h-3" />
                Load
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Pro Tip */}
      <div className="p-3 rounded-lg bg-muted/20 border border-border text-xs text-muted-foreground">
        💡 <span className="font-medium">Pro Tip:</span> Use Fibonacci retracement to identify potential support/resistance levels
      </div>
    </div>
  );
};
