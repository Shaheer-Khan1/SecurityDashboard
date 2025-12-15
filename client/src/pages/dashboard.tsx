import { useQuery } from "@tanstack/react-query";
import { Camera, Video, AlertTriangle, HardDrive } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { SystemStatusCard } from "@/components/dashboard/system-status";
import { RecentEvents } from "@/components/dashboard/recent-events";
import { AnalyticsChart } from "@/components/analytics/analytics-chart";
import { CameraGrid } from "@/components/cameras/camera-grid";
import { CounterCard } from "@/components/analytics/counter-card";
import { AnalyticsConfigList } from "@/components/dashboard/analytics-config-list";
import { AuditHighlights } from "@/components/dashboard/audit-highlights";
import type {
  DashboardStats,
  SystemStatus,
  AnalyticsEvent,
  Camera as CameraType,
  AnalyticsCounter,
  AnalyticsConfig,
  AuditLog,
} from "@shared/schema";

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

  const { data: counters = [], isLoading: countersLoading } = useQuery<AnalyticsCounter[]>({
    queryKey: ["/api/analytics/counters"],
  });

  const { data: configs = [] } = useQuery<AnalyticsConfig[]>({
    queryKey: ["/api/analytics/configurations"],
  });

  const { data: auditLogs = [] } = useQuery<AuditLog[]>({
    queryKey: ["/api/audit/logs"],
  });

  const cameraRecordingData =
    cameras
      .filter((c) => typeof c.recordingHours === "number")
      .sort((a, b) => (b.recordingHours || 0) - (a.recordingHours || 0))
      .slice(0, 8)
      .map((cam) => ({
        time: cam.name,
        events: cam.recordingHours || 0,
      })) ?? [];

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
          value={statsLoading ? "..." : stats?.totalCameras ?? "N/A"}
          icon={Camera}
          description={statsLoading ? "Loading..." : (stats?.activeCameras ? `${stats.activeCameras} active` : "No data")}
          variant="default"
        />
        <StatCard
          title="Recording"
          value={statsLoading ? "..." : stats?.recordingCameras ?? "N/A"}
          icon={Video}
          variant="success"
        />
        <StatCard
          title="Critical Events"
          value={statsLoading ? "..." : stats?.criticalEvents ?? "N/A"}
          icon={AlertTriangle}
          description="Last 24 hours"
          variant="danger"
        />
        <StatCard
          title="Storage Used"
          value={statsLoading ? "..." : stats?.usedStorage ?? "N/A"}
          icon={HardDrive}
          description={statsLoading ? "Loading..." : (stats?.totalStorage ? `of ${stats.totalStorage}` : "No data")}
          variant="warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AnalyticsChart
            data={chartData}
            isLoading={chartLoading}
            title="Event Activity (24h)"
          />
        </div>
        <div>
          <SystemStatusCard
            status={systemStatus}
            isLoading={statusLoading}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <AnalyticsChart
            data={cameraRecordingData}
            isLoading={camerasLoading}
            title="Recording Hours by Camera"
            type="line"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {counters.slice(0, 4).map((counter) => (
              <CounterCard key={counter.id} counter={counter} />
            ))}
            {countersLoading && counters.length === 0 && (
              <div className="text-sm text-muted-foreground">Loading counters...</div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
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
                <div className="divide-y divide-border rounded-lg border bg-card">
                  {cameras.slice(0, 6).map((camera) => (
                    <a
                      key={camera.name}
                      href="/cameras"
                      className="flex items-center justify-between gap-3 px-3 py-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{camera.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {camera.group || "No group"} {camera.model && `• ${camera.model}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-muted-foreground">
                          {camera.recordingHours !== undefined ? `${camera.recordingHours}h` : ""}
                        </span>
                        <span
                          className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground"
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${
                              (camera.status || (camera.active ? "online" : "offline")) === "recording"
                                ? "bg-red-500"
                                : (camera.status || (camera.active ? "online" : "offline")) === "online"
                                ? "bg-green-500"
                                : "bg-gray-400"
                            }`}
                          />
                          {camera.status || (camera.active ? "Online" : "Offline")}
                        </span>
                      </div>
                    </a>
                  ))}
                  {camerasLoading && cameras.length === 0 && (
                    <div className="px-3 py-4 text-sm text-muted-foreground">
                      Loading cameras...
                    </div>
                  )}
                  {!camerasLoading && cameras.length === 0 && (
                    <div className="px-3 py-4 text-sm text-muted-foreground">
                      No cameras found.
                    </div>
                  )}
                </div>
          </div>
        </div>
        <div>
          <RecentEvents events={recentEvents.slice(0, 8)} isLoading={eventsLoading} />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <AnalyticsConfigList configs={configs} />
          <AuditHighlights logs={auditLogs} />
        </div>
      </div>
    </div>
  );
}
