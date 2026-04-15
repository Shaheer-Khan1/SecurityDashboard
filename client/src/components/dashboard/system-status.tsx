import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Server, Cpu, HardDrive, Clock, Info, Users, Network, Activity } from "lucide-react";
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
          
          {status.globalMemoryMB !== undefined && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  Global Memory
                </span>
                <span className="text-sm font-medium">{status.globalMemoryMB} MB</span>
              </div>
            </div>
          )}
          
          {status.serverMemoryMB !== undefined && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  Server Memory
                </span>
                <span className="text-sm font-medium">{status.serverMemoryMB} MB</span>
              </div>
              <Progress value={status.memoryUsage} className="h-2" />
              <div className="text-xs text-muted-foreground mt-1">
                {status.memoryUsage}% of global memory
              </div>
            </div>
          )}
          
          {status.inputTraffic !== undefined && status.outputTraffic !== undefined && (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t">
              <div className="flex items-center gap-2">
                <Network className="h-4 w-4 text-blue-500" />
                <div>
                  <div className="text-xs text-muted-foreground">Input Traffic</div>
                  <div className="text-sm font-medium">{status.inputTraffic} Kbps</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-500" />
                <div>
                  <div className="text-xs text-muted-foreground">Output Traffic</div>
                  <div className="text-sm font-medium">{status.outputTraffic} Kbps</div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="pt-3 border-t space-y-2">
          {status.serverInfo && (
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-2">
              <div className="flex items-center gap-1">
                <Info className="h-3 w-3" />
                <span>{status.serverInfo.edition} {status.serverInfo.version}</span>
              </div>
              <div className="flex items-center gap-1">
                <Server className="h-3 w-3" />
                <span>{status.serverInfo.platform}</span>
              </div>
              {status.connections !== undefined && (
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{status.connections} connections</span>
                </div>
              )}
              {status.clients !== undefined && (
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{status.clients} clients</span>
                </div>
              )}
            </div>
          )}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Uptime: {status.uptime}
            </div>
            <span>Last sync: {status.lastSync}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
