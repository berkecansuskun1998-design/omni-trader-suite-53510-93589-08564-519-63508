export const LiveIndicator = () => {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
        <div className="absolute inset-0 w-2 h-2 bg-success rounded-full animate-ping opacity-75" />
      </div>
      <span className="text-xs font-medium text-success uppercase tracking-wider">Live</span>
    </div>
  );
};
