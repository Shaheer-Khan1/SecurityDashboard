import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AuditLog } from "@shared/schema";

interface Props {
  logs: AuditLog[];
}

export function AuditHighlights({ logs }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Audit Logs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {logs.slice(0, 6).map((log) => (
          <div key={log.id} className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-medium">{log.action}</p>
              <p className="text-xs text-muted-foreground">
                {log.details || "No details"} • {log.ipAddress || "n/a"}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 text-right">
              <Badge variant="outline">{log.category}</Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(log.timestamp).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
        {logs.length === 0 && (
          <p className="text-sm text-muted-foreground">No audit activity.</p>
        )}
      </CardContent>
    </Card>
  );
}








