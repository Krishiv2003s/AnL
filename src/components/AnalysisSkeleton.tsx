import { Skeleton } from "@/components/ui/skeleton";

export function BalanceSheetSkeleton() {
  return (
    <div className="ticker-card p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-5 w-24" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="ticker-card p-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-6 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
      <div className="h-64 flex items-end justify-between gap-2 px-4">
        {[40, 65, 45, 80, 55, 70, 50, 75, 60, 85, 45, 70].map((height, i) => (
          <Skeleton 
            key={i} 
            className="flex-1 rounded-t"
            style={{ height: `${height}%`, animationDelay: `${i * 0.05}s` }}
          />
        ))}
      </div>
    </div>
  );
}

export function AccountsTableSkeleton() {
  return (
    <div className="ticker-card p-6 animate-fade-in" style={{ animationDelay: "0.2s" }}>
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-5 w-20" />
      </div>
      <div className="space-y-3">
        {/* Header */}
        <div className="grid grid-cols-6 gap-4 pb-3 border-b border-border/50">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
        {/* Rows */}
        {[1, 2, 3, 4, 5].map((row) => (
          <div 
            key={row} 
            className="grid grid-cols-6 gap-4 py-3"
            style={{ animationDelay: `${row * 0.05}s` }}
          >
            {[1, 2, 3, 4, 5, 6].map((col) => (
              <Skeleton key={col} className="h-4 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function TaxComparisonSkeleton() {
  return (
    <div className="ticker-card p-6 animate-fade-in" style={{ animationDelay: "0.3s" }}>
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-6 w-44" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="p-4 rounded-lg border border-border/50 space-y-4">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-10 w-36" />
            <div className="space-y-2">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function InsightsSkeleton() {
  return (
    <div className="ticker-card p-6 animate-fade-in" style={{ animationDelay: "0.4s" }}>
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-5 w-16" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div 
            key={i} 
            className="p-4 rounded-lg border border-border/50 space-y-3"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-5 w-48" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AnalysisLoadingSkeleton() {
  return (
    <div className="space-y-8">
      <BalanceSheetSkeleton />
      <ChartSkeleton />
      <AccountsTableSkeleton />
      <TaxComparisonSkeleton />
      <InsightsSkeleton />
    </div>
  );
}
