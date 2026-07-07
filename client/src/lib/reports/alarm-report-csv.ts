import { saveAs } from "file-saver";
import { BRAND, timestampStamp } from "./report-branding";
import {
  type AlarmReportContext,
  formatReportTimestamp,
  reportFileBaseName,
  reportScopeLabel,
} from "./alarm-report-types";

function csvEscape(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function csvRow(values: unknown[]): string {
  return values.map(csvEscape).join(",");
}

export function generateAlarmCsvReport(context: AlarmReportContext): void {
  const { summary, alarms } = context;
  const lines: string[] = [];

  lines.push(csvRow([`${BRAND.name} — Alarm Analytics Report`]));
  lines.push(csvRow([`Scope: ${reportScopeLabel(context)}`]));
  lines.push(csvRow([`Generated: ${timestampStamp()}`]));
  lines.push("");

  lines.push(csvRow(["SUMMARY"]));
  lines.push(csvRow(["Total Alarms", "Active", "Closed", "Regions"]));
  lines.push(
    csvRow([summary.totals.total, summary.totals.active, summary.totals.closed, summary.regions.length]),
  );
  lines.push("");

  lines.push(csvRow(["REGIONAL BREAKDOWN"]));
  lines.push(csvRow(["Region", "Active", "Closed", "Total", "Sites"]));
  summary.regions.forEach((r) => {
    lines.push(csvRow([r.name, r.active, r.closed, r.total, r.sites.length]));
  });
  lines.push("");

  if (context.selectedRegion) {
    const region = summary.regions.find((r) => r.name === context.selectedRegion);
    if (region) {
      lines.push(csvRow([`SITE BREAKDOWN — ${region.name}`]));
      lines.push(csvRow(["Site", "Active", "Closed", "Total"]));
      region.sites.forEach((s) => {
        lines.push(csvRow([s.name, s.active, s.closed, s.total]));
      });
      lines.push("");
    }
  }

  lines.push(csvRow(["ALARM LIST"]));
  lines.push(
    csvRow(["ID", "Date/Time", "Region", "Site", "Camera", "Event Type", "Severity", "Status", "Description"]),
  );
  alarms.forEach((a) => {
    lines.push(
      csvRow([
        a.id,
        formatReportTimestamp(a.timestamp),
        a.region,
        a.site,
        a.camera,
        (a.eventType ?? "").replace(/_/g, " "),
        a.severity ?? "",
        a.alarmStatus,
        a.description ?? "",
      ]),
    );
  });

  const csvContent = "\uFEFF" + lines.join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
  saveAs(blob, `${reportFileBaseName(context)}.csv`);
}
