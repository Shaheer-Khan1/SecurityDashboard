import { useQuery } from "@tanstack/react-query";
import {
  Camera, Video, AlertTriangle, HardDrive, CheckCircle, XCircle,
  Power, PowerOff, Cpu, Network, Users, Shield, Radio, Clock,
  Activity, ToggleLeft, Calendar, Server
} from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { SystemStatusCard } from "@/components/dashboard/system-status";
import { RecentEvents } from "@/components/dashboard/recent-events";
import { AnalyticsChart } from "@/components/analytics/analytics-chart";
import { CameraGrid } from "@/components/cameras/camera-grid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DashboardStats, SystemStatus, AnalyticsEvent, Camera as CameraType } from "@shared/schema";

export default function Dashboard() {
  const { data: stats } = useQuery<DashboardStats>({ queryKey: ["/api/dashboard/stats"] });
  const { data: systemStatus, isLoading: statusLoading } = useQuery<SystemStatus>({ queryKey: ["/api/system/status"] });
  const { data: recentEvents = [], isLoading: eventsLoading } = useQuery<AnalyticsEvent[]>({ queryKey: ["/api/analytics/events/recent"] });
  const { data: cameras = [], isLoading: camerasLoading } = useQuery<CameraType[]>({ queryKey: ["/api/cameras"] });
  const { data: chartData = [], isLoading: chartLoading } = useQuery<any[]>({ queryKey: ["/api/analytics/chart"] });
  const { data: ioDevices } = useQuery<any>({ queryKey: ["/api/io-devices"] });
  const { data: connections } = useQuery<any>({ queryKey: ["/api/users/connections"] });
  const { data: licenses } = useQuery<any>({ queryKey: ["/api/server/licenses"] });
  const { data: masterSlave } = useQuery<any>({ queryKey: ["/api/server/master-slave"] });
  const { data: lprStatus } = useQuery<any>({ queryKey: ["/api/lpr/status"] });
  const { data: rtspStatus } = useQuery<any>({ queryKey: ["/api/rtsp/status"] });
  const { data: failoverStatus } = useQuery<any>({ queryKey: ["/api/failover/status"] });
  const { data: globalEvents } = useQuery<any>({ queryKey: ["/api/events/global"] });
  const { data: scheduledEvents } = useQuery<any>({ queryKey: ["/api/events/scheduled"] });
  const { data: cameraGroups } = useQuery<any>({ queryKey: ["/api/cameras/groups/summary"] });

  const defaultStats: DashboardStats = {
    totalCameras: 0, activeCameras: 0, recordingCameras: 0, offlineCameras: 0,
    totalEvents: 0, criticalEvents: 0, totalStorage: "N/A", usedStorage: "N/A",
  };
  const displayStats = stats || defaultStats;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Security monitoring overview — live data from Digifort</p>
      </div>

      {/* ── CAMERAS ─────────────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <Camera className="h-4 w-4" /> Cameras
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Cameras with breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Camera className="h-4 w-4" /> TOTAL CAMERAS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-4">{displayStats.totalCameras}</div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <div>
                    <div className="font-semibold">{displayStats.activeCameras}</div>
                    <div className="text-xs text-muted-foreground">Activated</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-semibold">{displayStats.totalCameras - displayStats.activeCameras}</div>
                    <div className="text-xs text-muted-foreground">Deactivated</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Power className="h-4 w-4 text-green-500" />
                  <div>
                    <div className="font-semibold">{displayStats.recordingCameras}</div>
                    <div className="text-xs text-muted-foreground">Working</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <PowerOff className="h-4 w-4 text-red-500" />
                  <div>
                    <div className="font-semibold">{displayStats.offlineCameras}</div>
                    <div className="text-xs text-muted-foreground">Not Working</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Camera Groups */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">CAMERA GROUPS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-3">{cameraGroups?.total ?? "—"}</div>
              <div className="space-y-1 max-h-20 overflow-y-auto">
                {cameraGroups?.groups?.length > 0
                  ? cameraGroups.groups.map((g: any, i: number) => (
                    <div key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                      {g.name || "Unnamed"}
                    </div>
                  ))
                  : <p className="text-xs text-muted-foreground">No groups</p>
                }
              </div>
            </CardContent>
          </Card>

          <StatCard title="Recording" value={displayStats.recordingCameras} icon={Video} variant="success" />
          <StatCard title="Critical Events" value={displayStats.criticalEvents} icon={AlertTriangle} description="Last 24 hours" variant="danger" />
        </div>
      </section>

      {/* ── SYSTEM STATUS + CHART ────────────────────────────── */}
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
            status={systemStatus || { serverStatus: "online", cpuUsage: 0, memoryUsage: 0, diskUsage: 0, uptime: "—", lastSync: "—" }}
            isLoading={statusLoading}
          />
        </div>
      </div>

      {/* ── SERVER INFO ──────────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <Server className="h-4 w-4" /> Server
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Server Version */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">VERSION INFO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Edition</span><span className="font-medium">{systemStatus?.serverInfo?.edition ?? "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Version</span><span className="font-medium">{systemStatus?.serverInfo?.version ?? "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Platform</span><span className="font-medium">{systemStatus?.serverInfo?.platform ?? "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="font-medium">{systemStatus?.serverInfo?.serverType ?? "—"}</span></div>
            </CardContent>
          </Card>

          {/* Connections */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" /> CONNECTIONS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Active</span><span className="font-medium">{systemStatus?.connections ?? "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Clients</span><span className="font-medium">{systemStatus?.clients ?? "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">User Sessions</span><span className="font-medium">{connections?.total ?? "—"}</span></div>
            </CardContent>
          </Card>

          {/* Network Traffic */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Network className="h-4 w-4" /> NETWORK TRAFFIC
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Input</span><span className="font-medium">{systemStatus?.inputTraffic ?? "0.00"} Kbps</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Output</span><span className="font-medium">{systemStatus?.outputTraffic ?? "0.00"} Kbps</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Uptime</span><span className="font-medium">{systemStatus?.uptime ?? "—"}</span></div>
            </CardContent>
          </Card>

          {/* Master/Slave */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Shield className="h-4 w-4" /> CLUSTER STATUS
              </CardTitle>
            </CardHeader>
            <CardContent>
              {masterSlave && Object.keys(masterSlave).length > 0 ? (
                <div className="space-y-1 text-sm">
                  {Object.entries(masterSlave).slice(0, 4).map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-muted-foreground capitalize">{k}</span>
                      <span className="font-medium text-xs">{String(v)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="text-green-600">Master</Badge>
                  <span className="text-muted-foreground text-xs">{systemStatus?.serverInfo?.serverType ?? "Standalone"}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── IO DEVICES + LPR + RTSP + FAILOVER ───────────────── */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <ToggleLeft className="h-4 w-4" /> Devices & Integrations
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* IO Devices */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ToggleLeft className="h-4 w-4" /> I/O DEVICES
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-3">{ioDevices?.total ?? "—"}</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                  <div>
                    <div className="font-semibold">{ioDevices?.active ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">Active</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Power className="h-3.5 w-3.5 text-green-500" />
                  <div>
                    <div className="font-semibold">{ioDevices?.working ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">Working</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* LPR */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Radio className="h-4 w-4" /> LPR
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-3">{lprStatus?.total ?? "—"}</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                  <div>
                    <div className="font-semibold">{lprStatus?.active ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">Active</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Power className="h-3.5 w-3.5 text-green-500" />
                  <div>
                    <div className="font-semibold">{lprStatus?.working ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">Working</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* RTSP */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="h-4 w-4" /> RTSP SERVER
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {rtspStatus?.status && Object.keys(rtspStatus.status).length > 0 ? (
                Object.entries(rtspStatus.status).slice(0, 4).map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-muted-foreground capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="font-medium text-xs">{String(v)}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">No RTSP data</p>
              )}
            </CardContent>
          </Card>

          {/* Failover */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Shield className="h-4 w-4" /> FAILOVER
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {failoverStatus && Object.keys(failoverStatus).length > 0 ? (
                Object.entries(failoverStatus).slice(0, 4).map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-muted-foreground capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="font-medium text-xs">{String(v)}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">No failover data</p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── EVENTS ───────────────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" /> Events
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> GLOBAL EVENTS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{globalEvents?.total ?? "—"}</div>
              <p className="text-xs text-muted-foreground mt-1">Configured global events</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" /> SCHEDULED EVENTS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{scheduledEvents?.total ?? "—"}</div>
              <p className="text-xs text-muted-foreground mt-1">Configured scheduled events</p>
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" /> RECENT EVENTS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RecentEvents events={recentEvents.slice(0, 4)} isLoading={eventsLoading} />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── LICENSES ─────────────────────────────────────────── */}
      {licenses && Object.keys(licenses).length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4" /> Licenses
          </h2>
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {Object.entries(licenses).slice(0, 8).map(([k, v]) => (
                  <div key={k} className="flex flex-col">
                    <span className="text-muted-foreground text-xs capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="font-semibold">{String(v)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* ── CAMERA FEEDS ─────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Camera className="h-4 w-4" /> Camera Feeds
          </h2>
          <a href="/cameras" className="text-sm text-primary hover:underline" data-testid="link-view-all-cameras">
            View all cameras
          </a>
        </div>
        <CameraGrid cameras={cameras.slice(0, 4)} isLoading={camerasLoading} />
      </section>
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
