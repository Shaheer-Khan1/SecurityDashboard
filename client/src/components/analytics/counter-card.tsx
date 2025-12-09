import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCcw, TrendingUp, TrendingDown } from "lucide-react";
import type { AnalyticsCounter } from "@shared/schema";

interface CounterCardProps {
  counter: AnalyticsCounter;
  trend?: number;
  onReset?: (id: string) => void;
}

export function CounterCard({ counter, trend, onReset }: CounterCardProps) {
  const isPositiveTrend = trend && trend > 0;
  
  return (
    <Card>
      <CardHeader className="pb-2 flex-row items-center justify-between gap-2">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {counter.name}
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {counter.configuration}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onReset?.(counter.id)}
          data-testid={`button-reset-counter-${counter.id}`}
        >
          <RefreshCcw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold" data-testid={`counter-value-${counter.id}`}>
            {counter.value.toLocaleString()}
          </span>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 text-sm ${
              isPositiveTrend 
                ? "text-green-600 dark:text-green-400" 
                : "text-red-600 dark:text-red-400"
            }`}>
              {isPositiveTrend ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
        {counter.lastReset && (
          <p className="text-xs text-muted-foreground mt-2">
            Last reset: {new Date(counter.lastReset).toLocaleDateString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
