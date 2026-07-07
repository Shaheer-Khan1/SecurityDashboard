import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Pie, PieChart, Cell, Label, Legend } from "recharts";
import {
  AlertTriangle,
  ArrowLeft,
  MapPin,
  Building2,
  ChevronLeft,
  Download,
  FileSpreadsheet,
  FileText,
  FileType,
  Loader2,
  Sheet as SheetIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlarmLocationDialog, type AlarmForMap } from "@/components/analytics/alarm-location-dialog";
import { useToast } from "@/hooks/use-toast";
import { generateAlarmReport, type AlarmReportFormat } from "@/lib/reports/alarm-report";
import type { Camera } from "@shared/schema";

interface AlarmSite {
  name: string;
  active: number;
  closed: number;
  total: number;
}

interface AlarmRegion {
  name: string;
  active: number;
  closed: number;
  total: number;
  sites: AlarmSite[];
}

interface AlarmSummary {
  totals: { active: number; closed: number; total: number };
  regions: AlarmRegion[];
}

interface AlarmRecord extends AlarmForMap {}

/** Per-region palette: dark = active, light = closed (same hue family). SVG-safe comma hsl(). */
const REGION_PALETTES = [
  { active: "hsl(221, 83%, 38%)", closed: "hsl(221, 45%, 72%)" },
  { active: "hsl(160, 64%, 32%)", closed: "hsl(160, 40%, 70%)" },
  { active: "hsl(38, 92%, 42%)", closed: "hsl(38, 55%, 74%)" },
  { active: "hsl(280, 65%, 40%)", closed: "hsl(280, 42%, 74%)" },
  { active: "hsl(350, 75%, 42%)", closed: "hsl(350, 48%, 76%)" },
];

const STATUS_COLORS = {
  active: "hsl(0, 72%, 42%)",
  closed: "hsl(0, 40%, 72%)",
};

const SLICE_STROKE = "#000000";
const SLICE_STROKE_WIDTH = 2;

function regionFill(index: number, status: "active" | "closed"): string {
  const palette = REGION_PALETTES[index % REGION_PALETTES.length];
  return status === "active" ? palette.active : palette.closed;
}

interface DualPieSlice {
  name: string;
  shortName: string;
  fullName: string;
  status: "active" | "closed";
  value: number;
  active: number;
  closed: number;
  total: number;
  fill: string;
  regionIndex: number;
  activeColor: string;
  closedColor: string;
  isGap?: boolean;
}

/** Stroke blends active↔closed of the same region; black gap slices sit between regions. */
function dualSliceStroke(entry: DualPieSlice): string {
  if (entry.isGap) return "none";
  return entry.status === "active" ? entry.closedColor : entry.activeColor;
}

/** Two adjacent slices per region/site: active (dark) + closed (light), same hue family. */
function buildDualStatusPieData(
  items: { name: string; fullName: string; active: number; closed: number; total: number }[],
): DualPieSlice[] {
  const slices: DualPieSlice[] = [];
  const grandTotal = items.reduce((sum, it) => sum + it.total, 0);
  const gapValue = Math.max(0.4, grandTotal * 0.006);

  items.forEach((item, i) => {
    const palette = REGION_PALETTES[i % REGION_PALETTES.length];
    const regionIndex = i % REGION_PALETTES.length;
    if (item.active > 0) {
      slices.push({
        name: `${item.name} · Active`,
        shortName: item.name,
        fullName: item.fullName,
        status: "active",
        value: item.active,
        active: item.active,
        closed: item.closed,
        total: item.total,
        fill: regionFill(regionIndex, "active"),
        regionIndex,
        activeColor: palette.active,
        closedColor: palette.closed,
      });
    }
    if (item.closed > 0) {
      slices.push({
        name: `${item.name} · Closed`,
        shortName: item.name,
        fullName: item.fullName,
        status: "closed",
        value: item.closed,
        active: item.active,
        closed: item.closed,
        total: item.total,
        fill: regionFill(regionIndex, "closed"),
        regionIndex,
        activeColor: palette.active,
        closedColor: palette.closed,
      });
    }
    if (i < items.length - 1) {
      slices.push({
        name: `__gap-${i}`,
        shortName: "",
        fullName: "",
        status: "closed",
        isGap: true,
        value: gapValue,
        active: 0,
        closed: 0,
        total: 0,
        fill: SLICE_STROKE,
        regionIndex: -1,
        activeColor: "",
        closedColor: "",
      });
    }
  });
  return slices;
}

function DualPieTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: DualPieSlice }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  if (d.isGap) return null;
  return (
    <div className="rounded-md border bg-background px-3 py-2 text-xs shadow">
      <p className="font-semibold">{d.fullName}</p>
      <p className="text-destructive">{d.active} active</p>
      <p className="text-muted-foreground">{d.closed} closed</p>
      <p className="text-muted-foreground">{d.total} total</p>
      <p className="text-muted-foreground mt-1">Click to drill down</p>
    </div>
  );
}

function ChartLegendKey({
  items,
}: {
  mode?: "region" | "site";
  items?: { name: string; fullName: string }[];
}) {
  return (
    <div className="flex flex-col items-center gap-2 mt-3">
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded-sm inline-block"
            style={{ backgroundColor: REGION_PALETTES[0].active }}
          />
          Active (dark)
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded-sm inline-block"
            style={{ backgroundColor: REGION_PALETTES[0].closed }}
          />
          Closed (light)
        </span>
      </div>
      {items && items.length > 0 && (
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
          {items.map((item, i) => {
            const palette = REGION_PALETTES[i % REGION_PALETTES.length];
            return (
              <span key={item.fullName} className="flex items-center gap-1 text-xs text-muted-foreground">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: palette.active }}
                />
                {item.name}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

const statusChartConfig: ChartConfig = {
  active: { label: "Active (Open)", color: STATUS_COLORS.active },
  closed: { label: "Closed", color: STATUS_COLORS.closed },
};

function StatusBadge({ status }: { status: string }) {
  const isActive = status === "active";
  return (
    <Badge
      variant={isActive ? "destructive" : "secondary"}
      className="text-xs capitalize"
    >
      {isActive ? "Active" : "Closed"}
    </Badge>
  );
}

const REPORT_FORMATS: { format: AlarmReportFormat; label: string; hint: string; icon: typeof FileText }[] = [
  { format: "pdf", label: "PDF Report", hint: "Print-ready corporate PDF", icon: FileText },
  { format: "word", label: "Word Document", hint: "Editable .docx report", icon: FileType },
  { format: "excel", label: "Excel Workbook", hint: "Multi-sheet .xlsx export", icon: FileSpreadsheet },
  { format: "csv", label: "CSV Data", hint: "Raw data for spreadsheets", icon: SheetIcon },
];

export function AlarmCharts() {
  const { toast } = useToast();
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  const [selectedAlarm, setSelectedAlarm] = useState<AlarmRecord | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<AlarmReportFormat | null>(null);

  const { data: summary, isLoading: summaryLoading } = useQuery<AlarmSummary>({
    queryKey: ["/api/alarms/summary"],
  });

  const { data: cameras = [] } = useQuery<Camera[]>({
    queryKey: ["/api/cameras"],
  });

  const alarmQueryKey = selectedSite
    ? `/api/alarms?region=${encodeURIComponent(selectedRegion!)}&site=${encodeURIComponent(selectedSite)}`
    : selectedRegion
      ? `/api/alarms?region=${encodeURIComponent(selectedRegion)}`
      : "/api/alarms";

  const { data: alarms = [], isLoading: alarmsLoading } = useQuery<AlarmRecord[]>({
    queryKey: [alarmQueryKey],
  });

  const regionItems = useMemo(() => {
    if (!summary?.regions) return [];
    return summary.regions.map((r) => ({
      name: r.name.replace(" Region", ""),
      fullName: r.name,
      active: r.active,
      closed: r.closed,
      total: r.total,
    }));
  }, [summary]);

  const regionChartData = useMemo(
    () => buildDualStatusPieData(regionItems),
    [regionItems],
  );

  const siteItems = useMemo(() => {
    if (!selectedRegion || !summary?.regions) return [];
    const region = summary.regions.find((r) => r.name === selectedRegion);
    if (!region) return [];
    return region.sites.map((s) => ({
      name: s.name.length > 22 ? s.name.slice(0, 20) + "…" : s.name,
      fullName: s.name,
      active: s.active,
      closed: s.closed,
      total: s.total,
    }));
  }, [summary, selectedRegion]);

  const siteChartData = useMemo(
    () => buildDualStatusPieData(siteItems),
    [siteItems],
  );

  const selectedRegionData = useMemo(
    () => summary?.regions.find((r) => r.name === selectedRegion) ?? null,
    [summary, selectedRegion],
  );

  const statusChartData = useMemo(() => {
    if (!summary?.totals) return [];
    return [
      { name: "active", value: summary.totals.active, fill: STATUS_COLORS.active },
      { name: "closed", value: summary.totals.closed, fill: STATUS_COLORS.closed },
    ];
  }, [summary]);

  const handleRegionClick = (slice: DualPieSlice) => {
    if (slice.isGap) return;
    setSelectedRegion(slice.fullName);
    setSelectedSite(null);
  };

  const handleSiteClick = (slice: DualPieSlice) => {
    if (slice.isGap) return;
    setSelectedSite(slice.fullName);
  };

  const backToRegions = () => {
    setSelectedRegion(null);
    setSelectedSite(null);
  };

  const backToRegionSites = () => {
    setSelectedSite(null);
  };

  const openAlarmMap = (alarm: AlarmRecord) => {
    setSelectedAlarm(alarm);
    setMapOpen(true);
  };

  const handleExportReport = async (format: AlarmReportFormat) => {
    if (!summary) return;
    setExportingFormat(format);
    try {
      await generateAlarmReport(format, {
        summary,
        alarms,
        selectedRegion,
        selectedSite,
      });
      toast({
        title: "Report generated",
        description: `Your ${REPORT_FORMATS.find((f) => f.format === format)?.label} has been downloaded.`,
      });
    } catch (error) {
      console.error("Failed to generate alarm report", error);
      toast({
        title: "Report generation failed",
        description: "Something went wrong while creating the report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setExportingFormat(null);
    }
  };

  if (summaryLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="h-64 flex items-center justify-center text-muted-foreground animate-pulse">
            Loading alarm analytics…
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
          No alarm data available. Ensure the mock server is running on port 8089.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Section header + report export */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-base font-semibold">Alarm Analytics</h2>
          <p className="text-xs text-muted-foreground">
            Scope: {selectedSite ?? selectedRegion ?? "All Regions"}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" disabled={!summary || exportingFormat !== null} className="gap-2">
              {exportingFormat ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {exportingFormat ? "Generating…" : "Export Report"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>Corporate report format</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {REPORT_FORMATS.map(({ format, label, hint, icon: Icon }) => (
              <DropdownMenuItem
                key={format}
                onClick={() => handleExportReport(format)}
                disabled={exportingFormat !== null}
                className="gap-2 py-2"
              >
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex flex-col">
                  <span className="text-sm">{label}</span>
                  <span className="text-xs text-muted-foreground">{hint}</span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Alarms</p>
            <p className="text-2xl font-bold">{summary.totals.total}</p>
          </CardContent>
        </Card>
        <Card className="border-destructive/30">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Active (Open)</p>
            <p className="text-2xl font-bold text-destructive">{summary.totals.active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Closed</p>
            <p className="text-2xl font-bold">{summary.totals.closed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Regions</p>
            <p className="text-2xl font-bold">{summary.regions.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Drill-down navigation */}
      {(selectedRegion || selectedSite) && (
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={backToRegions}>
            <ArrowLeft className="h-4 w-4 mr-1" /> All Regions
          </Button>
          {selectedRegion && selectedSite && (
            <Button variant="ghost" size="sm" onClick={backToRegionSites}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to {selectedRegion.replace(" Region", "")} sites
            </Button>
          )}
          {selectedRegion && (
            <Badge variant="outline" className="gap-1">
              <MapPin className="h-3 w-3" /> {selectedRegion}
            </Badge>
          )}
          {selectedSite && (
            <Badge variant="outline" className="gap-1">
              <Building2 className="h-3 w-3" /> {selectedSite}
            </Badge>
          )}
        </div>
      )}

      <AlarmLocationDialog
        alarm={selectedAlarm}
        cameras={cameras}
        open={mapOpen}
        onOpenChange={setMapOpen}
      />

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Active vs Closed — overall */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Alarm Status</CardTitle>
            <CardDescription className="text-xs">Active vs closed across all sites</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={statusChartConfig} className="mx-auto aspect-square max-h-[300px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                <Pie
                  data={statusChartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={3}
                >
                  {statusChartData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={entry.fill}
                      stroke={SLICE_STROKE}
                      strokeWidth={SLICE_STROKE_WIDTH}
                    />
                  ))}
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                            <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-2xl font-bold">
                              {summary.totals.active}
                            </tspan>
                            <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 18} className="fill-muted-foreground text-xs">
                              active
                            </tspan>
                          </text>
                        );
                      }
                    }}
                  />
                </Pie>
                <Legend />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Regional or Site drill-down chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="text-sm font-medium">
                  {!selectedRegion
                    ? "Alarms by Region"
                    : `Sites in ${selectedRegion.replace(" Region", "")}`}
                </CardTitle>
                <CardDescription className="text-xs">
                  {!selectedRegion
                    ? "Each region uses a dark shade for active and a lighter shade for closed — click any slice to drill down"
                    : selectedSite
                      ? `Filtered to ${selectedSite} — use back to see all sites`
                      : "Dark = active, light = closed per site — click a slice to filter the alarm list"}
                </CardDescription>
              </div>
              {selectedRegion && (
                <Button variant="outline" size="sm" onClick={selectedSite ? backToRegionSites : backToRegions}>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  {selectedSite ? "All sites" : "All regions"}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedRegion ? (
              <>
                <ChartContainer config={statusChartConfig} className="mx-auto aspect-[2/1] max-h-[340px] w-full min-h-[280px]">
                  <PieChart>
                    <ChartTooltip content={<DualPieTooltip />} />
                    <Pie
                      data={regionChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={130}
                      paddingAngle={0}
                      onClick={(_, index) => handleRegionClick(regionChartData[index])}
                      className="cursor-pointer"
                    >
                      {regionChartData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={entry.fill}
                          stroke={dualSliceStroke(entry)}
                          strokeWidth={entry.isGap ? 0 : 1}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <ChartLegendKey mode="region" items={regionItems} />
              </>
            ) : (
              <>
                <ChartContainer config={statusChartConfig} className="mx-auto aspect-[2/1] max-h-[340px] w-full min-h-[280px]">
                  <PieChart>
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload as DualPieSlice;
                        if (d.isGap) return null;
                        return (
                          <div className="rounded-md border bg-background px-3 py-2 text-xs shadow">
                            <p className="font-semibold">{d.fullName}</p>
                            <p className="capitalize text-muted-foreground">{d.status}</p>
                            <p className="text-destructive">{d.active} active</p>
                            <p className="text-muted-foreground">{d.closed} closed</p>
                            <p className="text-muted-foreground mt-1">Click to filter alarm list</p>
                          </div>
                        );
                      }}
                    />
                    <Pie
                      data={siteChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={130}
                      paddingAngle={0}
                      onClick={(_, index) => handleSiteClick(siteChartData[index])}
                      className="cursor-pointer"
                    >
                      {siteChartData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={entry.fill}
                          stroke={dualSliceStroke(entry)}
                          strokeWidth={entry.isGap ? 0 : 1}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <ChartLegendKey mode="site" items={siteItems} />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Site breakdown table (drill-down) */}
      {selectedRegion && selectedRegionData && !selectedSite && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Site Breakdown — {selectedRegion}
            </CardTitle>
            <CardDescription className="text-xs">
              Active and closed alarms per site in this region
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Site</th>
                    <th className="pb-2 font-medium text-destructive">Active</th>
                    <th className="pb-2 font-medium">Closed</th>
                    <th className="pb-2 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedRegionData.sites.map((s) => (
                    <tr
                      key={s.name}
                      className="border-b last:border-0 hover:bg-muted/50 cursor-pointer"
                      onClick={() => setSelectedSite(s.name)}
                    >
                      <td className="py-2 font-medium">{s.name}</td>
                      <td className="py-2 text-destructive font-semibold">{s.active}</td>
                      <td className="py-2">{s.closed}</td>
                      <td className="py-2">{s.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Regional breakdown table */}
      {!selectedRegion && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Regional Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Region</th>
                    <th className="pb-2 font-medium text-destructive">Active</th>
                    <th className="pb-2 font-medium">Closed</th>
                    <th className="pb-2 font-medium">Total</th>
                    <th className="pb-2 font-medium">Sites</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.regions.map((r) => (
                    <tr
                      key={r.name}
                      className="border-b last:border-0 hover:bg-muted/50 cursor-pointer"
                      onClick={() => { setSelectedRegion(r.name); setSelectedSite(null); }}
                    >
                      <td className="py-2 font-medium">{r.name}</td>
                      <td className="py-2 text-destructive font-semibold">{r.active}</td>
                      <td className="py-2">{r.closed}</td>
                      <td className="py-2">{r.total}</td>
                      <td className="py-2 text-muted-foreground">{r.sites.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtered alarm list */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            Alarm List
            {selectedRegion && (
              <span className="text-muted-foreground font-normal">
                — {selectedSite ?? selectedRegion}
              </span>
            )}
          </CardTitle>
          <CardDescription className="text-xs">
            Click an alarm to view its location on the map
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[280px]">
            {alarmsLoading ? (
              <div className="p-6 text-center text-muted-foreground animate-pulse">Loading alarms…</div>
            ) : alarms.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">No alarms for this filter</div>
            ) : (
              <div className="divide-y">
                {alarms.slice(0, 50).map((alarm) => (
                  <button
                    key={alarm.id}
                    type="button"
                    className="w-full flex items-start gap-3 px-4 py-3 hover:bg-muted/40 cursor-pointer text-left transition-colors"
                    onClick={() => openAlarmMap(alarm)}
                  >
                    <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${
                      alarm.alarmStatus === "active" ? "bg-destructive animate-pulse" : "bg-muted-foreground"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{alarm.eventType?.replace(/_/g, " ")}</span>
                        <StatusBadge status={alarm.alarmStatus} />
                        {alarm.severity && (
                          <Badge variant="outline" className="text-xs">{alarm.severity}</Badge>
                        )}
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground ml-auto shrink-0" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {alarm.camera} · {alarm.site} · {alarm.region}
                      </p>
                      {alarm.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{alarm.description}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
