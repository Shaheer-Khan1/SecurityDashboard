import { useQuery } from "@tanstack/react-query";
import { Camera, Video, AlertTriangle, HardDrive } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { SystemStatusCard } from "@/components/dashboard/system-status";
import { RecentEvents } from "@/components/dashboard/recent-events";
import { AnalyticsChart } from "@/components/analytics/analytics-chart";
import { CameraGrid } from "@/components/cameras/camera-grid";
import type { DashboardStats, SystemStatus, AnalyticsEvent, Camera as CameraType } from "@shared/schema";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: systemStatus, isLoading: statusLoading } = useQuery<SystemStatus>({
    queryKey: ["/api/system/status"],
  });

  const { data: recentEvents = [], isLoading: eventsLoading } = useQuery<AnalyticsEvent[]>({
    queryKey: ["/api/analytics/events/recent"],
  });

  const { data: cameras = [], isLoading: camerasLoading } = useQuery<CameraType[]>({
    queryKey: ["/api/cameras"],
  });

  const { data: chartData = [], isLoading: chartLoading } = useQuery<any[]>({
    queryKey: ["/api/analytics/chart"],
  });

  const defaultStats: DashboardStats = {
    totalCameras: 16,
    activeCameras: 14,
    recordingCameras: 12,
    offlineCameras: 2,
    totalEvents: 1247,
    criticalEvents: 3,
    totalStorage: "4 TB",
    usedStorage: "2.8 TB",
  };

  const displayStats = stats || defaultStats;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Security monitoring overview and system status
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Cameras"
          value={displayStats.totalCameras}
          icon={Camera}
          description={`${displayStats.activeCameras} active`}
          variant="default"
        />
        <StatCard
          title="Recording"
          value={displayStats.recordingCameras}
          icon={Video}
          trend={{ value: 8, isPositive: true }}
          variant="success"
        />
        <StatCard
          title="Critical Events"
          value={displayStats.criticalEvents}
          icon={AlertTriangle}
          description="Last 24 hours"
          variant="danger"
        />
        <StatCard
          title="Storage Used"
          value={displayStats.usedStorage}
          icon={HardDrive}
          description={`of ${displayStats.totalStorage}`}
          variant="warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AnalyticsChart
            data={chartData.length > 0 ? chartData : generateMockChartData()}
            isLoading={chartLoading}
            title="Event Activity (24h)"
          />
        </div>
        <div>
          <SystemStatusCard
            status={systemStatus || {
              serverStatus: "online",
              cpuUsage: 45,
              memoryUsage: 62,
              diskUsage: 70,
              uptime: "14d 6h 32m",
              lastSync: "2 min ago",
            }}
            isLoading={statusLoading}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Camera Feeds</h2>
              <a
                href="/cameras"
                className="text-sm text-primary hover:underline"
                data-testid="link-view-all-cameras"
              >
                View all cameras
              </a>
            </div>
            <CameraGrid
              cameras={cameras.slice(0, 4)}
              isLoading={camerasLoading}
            />
          </div>
        </div>
        <div>
          <RecentEvents events={recentEvents.slice(0, 8)} isLoading={eventsLoading} />
        </div>
      </div>
    </div>
  );
}

function generateMockChartData() {
  const hours = Array.from({ length: 24 }, (_, i) => {
    const hour = (new Date().getHours() - 23 + i + 24) % 24;
    return {
      time: `${hour.toString().padStart(2, "0")}:00`,
      events: Math.floor(Math.random() * 50) + 10,
      motion: Math.floor(Math.random() * 30) + 5,
    };
  });
  return hours;
}
