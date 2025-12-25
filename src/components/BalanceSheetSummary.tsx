import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity, FileText, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

interface Summary {
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
  primary_income_source: string;
  recommended_itr_form: string;
  tax_regime_suggestion: string;
}

interface BalanceSheetSummaryProps {
  summary: Summary;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatCompact = (amount: number) => {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)}Cr`;
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)}L`;
  } else if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return `₹${amount}`;
};

export function BalanceSheetSummary({ summary }: BalanceSheetSummaryProps) {
  if (!summary) {
    return null;
  }

  const netWorthPositive = summary.net_worth >= 0;

  return (
    <div className="space-y-6">
      {/* Main Financial Ticker Display */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Total Assets - Green */}
        <div className="ticker-card p-6 group hover:shadow-glow-profit transition-shadow duration-300">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-profit animate-pulse" />
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                TOTAL ASSETS
              </span>
            </div>
            <ArrowUpRight className="h-5 w-5 text-profit" />
          </div>
          <div className="space-y-1">
            <p className="digital-value text-3xl font-bold profit-indicator">
              {formatCompact(summary.total_assets)}
            </p>
            <p className="text-xs text-muted-foreground font-mono">
              {formatCurrency(summary.total_assets)}
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-border/30">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-profit" />
              <span className="text-xs text-profit font-mono">POSITIVE FLOW</span>
            </div>
          </div>
        </div>

        {/* Total Liabilities - Red */}
        <div className="ticker-card p-6 group hover:shadow-glow-loss transition-shadow duration-300">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-loss animate-pulse" />
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                TOTAL LIABILITIES
              </span>
            </div>
            <ArrowDownRight className="h-5 w-5 text-loss" />
          </div>
          <div className="space-y-1">
            <p className="digital-value text-3xl font-bold loss-indicator">
              {formatCompact(summary.total_liabilities)}
            </p>
            <p className="text-xs text-muted-foreground font-mono">
              {formatCurrency(summary.total_liabilities)}
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-border/30">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-loss" />
              <span className="text-xs text-loss font-mono">OUTFLOW</span>
            </div>
          </div>
        </div>

        {/* Net Worth - Dynamic Color */}
        <div className={`ticker-card p-6 group transition-shadow duration-300 ${netWorthPositive ? 'hover:shadow-glow-profit' : 'hover:shadow-glow-loss'}`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${netWorthPositive ? 'bg-profit' : 'bg-loss'} animate-pulse`} />
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                NET WORTH
              </span>
            </div>
            {netWorthPositive ? (
              <ArrowUpRight className="h-5 w-5 text-profit" />
            ) : (
              <ArrowDownRight className="h-5 w-5 text-loss" />
            )}
          </div>
          <div className="space-y-1">
            <p className={`digital-value text-3xl font-bold ${netWorthPositive ? 'profit-indicator' : 'loss-indicator'}`}>
              {formatCompact(Math.abs(summary.net_worth))}
            </p>
            <p className="text-xs text-muted-foreground font-mono">
              {formatCurrency(summary.net_worth)}
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-border/30">
            <div className="flex items-center gap-2">
              {netWorthPositive ? (
                <>
                  <TrendingUp className="h-4 w-4 text-profit" />
                  <span className="text-xs text-profit font-mono">HEALTHY</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-4 w-4 text-loss" />
                  <span className="text-xs text-loss font-mono">DEFICIT</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Info Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recommended ITR */}
        <div className="ticker-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-mono">Recommended Form</p>
                <p className="text-xl font-bold font-mono text-info">{summary.recommended_itr_form}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase font-mono">Regime</p>
              <p className="text-sm font-mono text-foreground">{summary.tax_regime_suggestion}</p>
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="ticker-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-mono">Analysis Status</p>
                <p className="text-sm font-mono text-primary">COMPLETE</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-profit animate-pulse" />
              <span className="text-xs font-mono text-profit">LIVE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}