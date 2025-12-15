import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnalyticsChart } from "@/components/analytics/analytics-chart";
import { CounterCard } from "@/components/analytics/counter-card";
import { Activity, RefreshCcw, TrendingUp, Users, Car, AlertTriangle } from "lucide-react";
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

  const resetCounterMutation = useMutation({
    mutationFn: async (counterId: string) => {
      return apiRequest("POST", `/api/analytics/counters/${counterId}/reset`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/counters"] });
      toast({
        title: "Counter reset",
        description: "The counter has been reset successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reset counter.",
        variant: "destructive",
      });
    },
  });

  const activeConfigs = configs.filter((c) => c.active);
  const workingConfigs = configs.filter((c) => c.working);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Video analytics configurations, counters, and insights
          </p>
        </div>
        <Button variant="outline" onClick={() => refetchCounters()} data-testid="button-refresh-analytics">
          <RefreshCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-md bg-primary/10">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Configs</p>
                <p className="text-2xl font-bold" data-testid="stat-active-configs">
                  {activeConfigs.length}
                </p>
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
                  {workingConfigs.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-md bg-blue-500/10">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">People Counted</p>
                <p className="text-2xl font-bold" data-testid="stat-people-counted">
                  {countersLoading ? "..." : (counters.find(c => c.name.includes("People"))?.value.toLocaleString() || "N/A")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-md bg-amber-500/10">
                <Car className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vehicles Detected</p>
                <p className="text-2xl font-bold" data-testid="stat-vehicles-detected">
                  {countersLoading ? "..." : (counters.find(c => c.name.includes("Vehicle"))?.value.toLocaleString() || "N/A")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="counters" data-testid="tab-counters">Counters</TabsTrigger>
          <TabsTrigger value="configurations" data-testid="tab-configurations">Configurations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnalyticsChart
              data={chartData}
              title="Detection Trends"
              type="area"
            />
            <AnalyticsChart
              data={chartData.map(d => ({ ...d, events: d.motion || 0, motion: undefined }))}
              title="Motion Activity"
              type="line"
            />
          </div>
        </TabsContent>

        <TabsContent value="counters" className="space-y-4">
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
                      <CardTitle className="text-sm font-medium truncate">
                        {config.name}
                      </CardTitle>
                      <Badge variant={config.active ? "default" : "secondary"} className="text-xs">
                        {config.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-xs text-muted-foreground mb-2">
                      Camera: {config.camera}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {config.working ? (
                        <Badge variant="outline" className="text-xs text-green-600 dark:text-green-400">
                          Working
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-amber-600 dark:text-amber-400">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Check Status
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {config.events.length} events
                      </Badge>
                    </div>
                    {config.statusMessage && (
                      <p className="text-xs text-muted-foreground mt-2 truncate">
                        {config.statusMessage}
                      </p>
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
      </Tabs>
    </div>
  );
}
