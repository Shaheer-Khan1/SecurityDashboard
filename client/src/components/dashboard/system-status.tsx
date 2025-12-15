import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Server, Cpu, HardDrive, Clock } from "lucide-react";
import type { SystemStatus } from "@shared/schema";

interface SystemStatusCardProps {
  status?: SystemStatus;
  isLoading?: boolean;
}

const statusColors = {
  online: "bg-green-500",
  offline: "bg-red-500",
  degraded: "bg-amber-500",
};

export function SystemStatusCard({ status, isLoading }: SystemStatusCardProps) {
  if (isLoading || !status) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Server className="h-5 w-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                <div className="h-2 bg-muted rounded w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            System Status
          </div>
          <Badge variant="outline" className="capitalize">
            <span className={`h-2 w-2 rounded-full mr-2 ${statusColors[status.serverStatus]}`} />
            {status.serverStatus}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm flex items-center gap-2">
                <Cpu className="h-4 w-4 text-muted-foreground" />
                CPU Usage
              </span>
              <span className="text-sm font-medium" data-testid="stat-cpu-usage">{status.cpuUsage}%</span>
            </div>
            <Progress value={status.cpuUsage} className="h-2" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-muted-foreground" />
                Memory Usage
              </span>
              <span className="text-sm font-medium" data-testid="stat-memory-usage">{status.memoryUsage}%</span>
            </div>
            <Progress value={status.memoryUsage} className="h-2" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-muted-foreground" />
                Disk Usage
              </span>
              <span className="text-sm font-medium" data-testid="stat-disk-usage">{status.diskUsage}%</span>
            </div>
            <Progress value={status.diskUsage} className="h-2" />
          </div>
        </div>
        <div className="pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Uptime: {status.uptime}
          </div>
          <span>Last sync: {status.lastSync}</span>
        </div>
      </CardContent>
    </Card>
  );
}
