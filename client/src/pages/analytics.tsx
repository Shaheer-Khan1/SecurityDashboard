import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnalyticsChart } from "@/components/analytics/analytics-chart";
import { AlarmCharts } from "@/components/analytics/alarm-charts";
import { CounterCard } from "@/components/analytics/counter-card";
import {
  Activity, RefreshCcw, TrendingUp, Users, Car, AlertTriangle,
  CheckCircle, XCircle, Camera, Hash, Clock
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { AnalyticsConfig, AnalyticsCounter } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function AnalyticsPage() {
  const { toast } = useToast();

  const { data: configs = [], isLoading: configsLoading } = useQuery<AnalyticsConfig[]>({
    queryKey: ["/api/analytics/configurations"],
  });

  const { data: counters = [], isLoading: countersLoading, refetch: refetchCounters } = useQuery<AnalyticsCounter[]>({
    queryKey: ["/api/analytics/counters"],
  });

  const { data: chartData = [] } = useQuery<any[]>({
    queryKey: ["/api/analytics/chart"],
  });

  const { data: analyticsStatus } = useQuery<any>({
    queryKey: ["/api/analytics/status"],
  });

  const { data: recentEvents = [], isLoading: eventsLoading } = useQuery<any[]>({
    queryKey: ["/api/analytics/events/recent"],
  });

  const resetCounterMutation = useMutation({
    mutationFn: async (counterId: string) => {
      return apiRequest("POST", `/api/analytics/counters/${counterId}/reset`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/counters"] });
      toast({ title: "Counter reset", description: "The counter has been reset successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to reset counter.", variant: "destructive" });
    },
  });

  const activeConfigs = configs.filter((c) => c.active);
  const workingConfigs = configs.filter((c) => c.working);
  const totalCounterValue = counters.reduce((sum, c) => sum + (c.value || 0), 0);

  const handleRefresh = () => {
    refetchCounters();
    queryClient.invalidateQueries({ queryKey: ["/api/analytics/configurations"] });
    queryClient.invalidateQueries({ queryKey: ["/api/analytics/status"] });
    queryClient.invalidateQueries({ queryKey: ["/api/analytics/events/recent"] });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Video analytics configurations, counters, and live insights
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} data-testid="button-refresh-analytics">
          <RefreshCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* ── SUMMARY STATS ────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-md bg-primary/10">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Configs</p>
                <p className="text-2xl font-bold" data-testid="stat-active-configs">
                  {analyticsStatus?.total ?? configs.length}
                </p>
                <p className="text-xs text-muted-foreground">{activeConfigs.length} active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-md bg-green-500/10">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Working</p>
                <p className="text-2xl font-bold" data-testid="stat-working-configs">
                  {analyticsStatus?.working ?? workingConfigs.length}
                </p>
                <p className="text-xs text-muted-foreground">of {analyticsStatus?.total ?? configs.length} configs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-md bg-blue-500/10">
                <Hash className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Counters</p>
                <p className="text-2xl font-bold">{counters.length}</p>
                <p className="text-xs text-muted-foreground">{totalCounterValue.toLocaleString()} total detections</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-md bg-amber-500/10">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Recent Events</p>
                <p className="text-2xl font-bold">{recentEvents.length}</p>
                <p className="text-xs text-muted-foreground">Last fetched</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── TABS ─────────────────────────────────────────────── */}
      <Tabs defaultValue="status" className="space-y-4">
        <TabsList>
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="overview" data-testid="tab-overview">Charts</TabsTrigger>
          <TabsTrigger value="alarms" data-testid="tab-alarms">Alarms</TabsTrigger>
          <TabsTrigger value="counters" data-testid="tab-counters">Counters</TabsTrigger>
          <TabsTrigger value="configurations" data-testid="tab-configurations">Configurations</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>

        {/* STATUS TAB */}
        <TabsContent value="status" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analyticsStatus?.configs?.length > 0 ? (
              analyticsStatus.configs.map((c: any, i: number) => (
                <Card key={i}>
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-sm font-medium truncate">{c.name || "Unnamed"}</CardTitle>
                      <Badge variant={c.active ? "default" : "secondary"} className="text-xs">
                        {c.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Camera className="h-3 w-3" /> {c.camera || "—"}
                    </div>
                    <div className="flex items-center gap-2">
                      {c.working ? (
                        <Badge variant="outline" className="text-xs text-green-600 dark:text-green-400">
                          <CheckCircle className="h-3 w-3 mr-1" /> Working
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-red-500">
                          <XCircle className="h-3 w-3 mr-1" /> Not Working
                        </Badge>
                      )}
                    </div>
                    {c.status && (
                      <p className="text-xs text-muted-foreground truncate">{c.status}</p>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : configsLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4 space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Activity className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">No analytics status data available</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* CHARTS TAB */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnalyticsChart data={chartData} title="Detection Trends" type="area" />
            <AnalyticsChart
              data={chartData.map(d => ({ ...d, events: d.motion || 0, motion: undefined }))}
              title="Motion Activity"
              type="line"
            />
          </div>
        </TabsContent>

        {/* ALARMS TAB — regional pie charts with drill-down */}
        <TabsContent value="alarms" className="space-y-4">
          <AlarmCharts />
        </TabsContent>

        {/* COUNTERS TAB */}
        <TabsContent value="counters" className="space-y-4">
          {counters.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Hash className="h-4 w-4" />
              <span>{counters.length} counter(s) — {totalCounterValue.toLocaleString()} total detections</span>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {countersLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6 space-y-4">
                    <div className="h-4 bg-muted rounded w-1/2" />
                    <div className="h-8 bg-muted rounded w-1/3" />
                  </CardContent>
                </Card>
              ))
            ) : counters.length > 0 ? (
              counters.map((counter) => (
                <CounterCard
                  key={counter.id}
                  counter={counter}
                  onReset={(id) => resetCounterMutation.mutate(id)}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Activity className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">No counters configured</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* CONFIGURATIONS TAB */}
        <TabsContent value="configurations" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {configsLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4 space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                    <div className="flex gap-2">
                      <div className="h-5 bg-muted rounded w-16" />
                      <div className="h-5 bg-muted rounded w-16" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : configs.length > 0 ? (
              configs.map((config) => (
                <Card key={config.name} data-testid={`config-card-${config.name}`}>
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-sm font-medium truncate">{config.name}</CardTitle>
                      <Badge variant={config.active ? "default" : "secondary"} className="text-xs">
                        {config.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-2">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Camera className="h-3 w-3" /> {config.camera}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {config.working ? (
                        <Badge variant="outline" className="text-xs text-green-600 dark:text-green-400">
                          <CheckCircle className="h-3 w-3 mr-1" /> Working
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-amber-600 dark:text-amber-400">
                          <AlertTriangle className="h-3 w-3 mr-1" /> Check Status
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {config.events?.length ?? 0} events
                      </Badge>
                    </div>
                    {config.statusMessage && (
                      <p className="text-xs text-muted-foreground mt-2 truncate">{config.statusMessage}</p>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Activity className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">No analytics configurations found</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* EVENTS TAB */}
        <TabsContent value="events" className="space-y-4">
          <div className="space-y-2">
            {eventsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-4 bg-muted rounded w-3/4" />
                  </CardContent>
                </Card>
              ))
            ) : recentEvents.length > 0 ? (
              recentEvents.map((event: any, i: number) => (
                <Card key={i}>
                  <CardContent className="p-4 flex items-start gap-3">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{event.EventType || event.eventType || "Event"}</span>
                        <Badge variant="outline" className="text-xs">
                          <Camera className="h-3 w-3 mr-1" />
                          {event.Camera || event.camera || "Unknown"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3" />
                        {event.DateTime || event.dateTime || event.Timestamp || event.timestamp || "—"}
                      </div>
                      {(event.AnalyticsConfiguration || event.analyticsConfiguration) && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          Config: {event.AnalyticsConfiguration || event.analyticsConfiguration}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <AlertTriangle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">No recent events</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
