export interface ReportAlarmSite {
  name: string;
  active: number;
  closed: number;
  total: number;
}

export interface ReportAlarmRegion {
  name: string;
  active: number;
  closed: number;
  total: number;
  sites: ReportAlarmSite[];
}

export interface ReportAlarmSummary {
  totals: { active: number; closed: number; total: number };
  regions: ReportAlarmRegion[];
}

export interface ReportAlarmRecord {
  id: string;
  camera: string;
  eventType: string;
  alarmStatus: string;
  region: string;
  site: string;
  severity?: string;
  description?: string;
  timestamp: string;
  zone?: string;
}

export interface AlarmReportContext {
  summary: ReportAlarmSummary;
  alarms: ReportAlarmRecord[];
  selectedRegion: string | null;
  selectedSite: string | null;
}

export type AlarmReportFormat = "pdf" | "excel" | "word" | "csv";

export function reportFileBaseName(context: AlarmReportContext): string {
  const scope = context.selectedSite ?? context.selectedRegion ?? "All-Regions";
  const stamp = new Date().toISOString().slice(0, 10);
  return `Digifort-Alarm-Report_${scope.replace(/[^\w-]+/g, "-")}_${stamp}`;
}

export function reportScopeLabel(context: AlarmReportContext): string {
  if (context.selectedSite) return `${context.selectedSite} (${context.selectedRegion})`;
  if (context.selectedRegion) return context.selectedRegion;
  return "All Regions";
}

export function formatReportTimestamp(value?: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
