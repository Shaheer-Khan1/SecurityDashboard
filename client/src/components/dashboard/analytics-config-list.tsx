import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AnalyticsConfig } from "@shared/schema";

interface Props {
  configs: AnalyticsConfig[];
}

export function AnalyticsConfigList({ configs }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Analytics Configurations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {configs.slice(0, 5).map((cfg) => (
          <div key={cfg.name} className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-medium">{cfg.name}</p>
              <p className="text-xs text-muted-foreground">
                {cfg.camera} • {cfg.events.join(", ")}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant={cfg.active ? "success" : "outline"}>
                {cfg.active ? "Active" : "Disabled"}
              </Badge>
              {cfg.status && (
                <span className="text-xs text-muted-foreground">{cfg.status}</span>
              )}
            </div>
          </div>
        ))}
        {configs.length === 0 && (
          <p className="text-sm text-muted-foreground">No configurations.</p>
        )}
      </CardContent>
    </Card>
  );
}








