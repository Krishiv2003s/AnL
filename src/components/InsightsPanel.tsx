import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertCircle, Info, Lightbulb, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface Insight {
  insight_type: string;
  severity: "error" | "warning" | "info";
  title: string;
  description: string;
  recommendation: string;
  itr_form_suggestion: string | null;
}

interface InsightsPanelProps {
  insights: Insight[];
}

const severityConfig = {
  error: {
    icon: AlertCircle,
    borderColor: "border-l-destructive",
    bgColor: "bg-destructive/5",
    iconColor: "text-destructive",
    badge: "destructive" as const,
  },
  warning: {
    icon: AlertTriangle,
    borderColor: "border-l-warning",
    bgColor: "bg-warning/5",
    iconColor: "text-warning",
    badge: "warning" as const,
  },
  info: {
    icon: Info,
    borderColor: "border-l-info",
    bgColor: "bg-info/5",
    iconColor: "text-info",
    badge: "info" as const,
  },
};

export function InsightsPanel({ insights }: InsightsPanelProps) {
  if (!insights || insights.length === 0) {
    return null;
  }

  // Sort by severity: error > warning > info
  const sortedInsights = [...insights].sort((a, b) => {
    const order = { error: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  });

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-accent" />
          Tax Insights & Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedInsights.map((insight, index) => {
          const config = severityConfig[insight.severity];
          const Icon = config.icon;

          return (
            <div
              key={index}
              className={cn(
                "rounded-lg border-l-4 p-4",
                config.borderColor,
                config.bgColor
              )}
            >
              <div className="flex items-start gap-3">
                <Icon className={cn("h-5 w-5 mt-0.5 shrink-0", config.iconColor)} />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold">{insight.title}</h4>
                    <Badge variant={config.badge}>
                      {insight.severity.charAt(0).toUpperCase() + insight.severity.slice(1)}
                    </Badge>
                    {insight.itr_form_suggestion && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {insight.itr_form_suggestion}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{insight.description}</p>
                  {insight.recommendation && (
                    <div className="mt-2 rounded-md bg-background/50 p-3">
                      <p className="text-sm">
                        <span className="font-medium text-accent">Recommendation:</span>{" "}
                        {insight.recommendation}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
