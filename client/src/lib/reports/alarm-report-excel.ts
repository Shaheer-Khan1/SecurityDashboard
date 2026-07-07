import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { BRAND, getLogoBufferAndDims, timestampStamp } from "./report-branding";
import {
  type AlarmReportContext,
  formatReportTimestamp,
  reportFileBaseName,
  reportScopeLabel,
} from "./alarm-report-types";

const PRIMARY = { argb: "FFA6262C" };
const PRIMARY_DARK = { argb: "FF7A1B20" };
const HEADER_TEXT = { argb: "FFFFFFFF" };
const INK = { argb: "FF1F2937" };
const MUTED = { argb: "FF6B7280" };
const LIGHT = { argb: "FFF3F4F6" };
const ZEBRA = { argb: "FFFAFAFA" };
const ACTIVE_RED = { argb: "FFB91C1C" };

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FFD1D5DB" } },
  bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
  left: { style: "thin", color: { argb: "FFD1D5DB" } },
  right: { style: "thin", color: { argb: "FFD1D5DB" } },
};

function styleHeaderRow(row: ExcelJS.Row, fillArgb = PRIMARY) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: HEADER_TEXT, size: 11 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: fillArgb };
    cell.alignment = { vertical: "middle", horizontal: "left" };
    cell.border = THIN_BORDER;
  });
  row.height = 22;
}

function addTitleBlock(sheet: ExcelJS.Worksheet, context: AlarmReportContext, colSpan: number) {
  sheet.mergeCells(1, 1, 1, colSpan);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = `${BRAND.name} — Alarm Analytics Report`;
  titleCell.font = { bold: true, size: 16, color: { argb: "FF1F2937" } };
  sheet.getRow(1).height = 28;

  sheet.mergeCells(2, 1, 2, colSpan);
  const subCell = sheet.getCell(2, 1);
  subCell.value = `Scope: ${reportScopeLabel(context)}   •   Generated: ${timestampStamp()}`;
  subCell.font = { italic: true, size: 10, color: MUTED };
  sheet.getRow(2).height = 18;

  sheet.getRow(3).height = 6;
}

function autoWidth(sheet: ExcelJS.Worksheet, minWidths: number[]) {
  sheet.columns.forEach((col, i) => {
    let max = minWidths[i] ?? 10;
    col.eachCell?.({ includeEmpty: false }, (cell) => {
      const len = String(cell.value ?? "").length;
      if (len > max) max = len;
    });
    col.width = Math.min(max + 3, 60);
  });
}

export async function generateAlarmExcelReport(context: AlarmReportContext): Promise<void> {
  const { summary, alarms } = context;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = BRAND.name;
  workbook.created = new Date();

  const logo = await getLogoBufferAndDims();
  let logoImageId: number | null = null;
  if (logo) {
    logoImageId = workbook.addImage({ buffer: logo.buffer as any, extension: "png" });
  }

  // ---- Summary sheet ----
  const summarySheet = workbook.addWorksheet("Summary", {
    views: [{ showGridLines: false }],
  });
  if (logoImageId !== null && logo) {
    const h = 34;
    const w = (logo.width / logo.height) * h;
    summarySheet.addImage(logoImageId, {
      tl: { col: 4.3, row: 0.1 } as any,
      ext: { width: w, height: h },
    });
  }
  addTitleBlock(summarySheet, context, 5);

  const kpiHeaderRow = summarySheet.addRow(["Metric", "Value"]);
  styleHeaderRow(kpiHeaderRow, PRIMARY_DARK);
  const kpis: [string, number][] = [
    ["Total Alarms", summary.totals.total],
    ["Active (Open)", summary.totals.active],
    ["Closed", summary.totals.closed],
    ["Regions Covered", summary.regions.length],
  ];
  kpis.forEach(([label, value], i) => {
    const row = summarySheet.addRow([label, value]);
    row.eachCell((cell) => (cell.border = THIN_BORDER));
    row.getCell(1).font = { bold: true, color: INK };
    row.getCell(2).font = { bold: true, color: label === "Active (Open)" ? ACTIVE_RED : INK };
    row.getCell(2).alignment = { horizontal: "right" };
    if (i % 2 === 1) row.eachCell((cell) => (cell.fill = { type: "pattern", pattern: "solid", fgColor: LIGHT }));
  });
  summarySheet.getColumn(1).width = 26;
  summarySheet.getColumn(2).width = 16;

  const footerRow = summarySheet.addRow([]);
  footerRow.height = 10;
  const noteRow = summarySheet.addRow([
    `Confidential — generated automatically by ${BRAND.name} ${BRAND.tagline}.`,
  ]);
  noteRow.getCell(1).font = { italic: true, size: 9, color: MUTED };

  // ---- Regional Breakdown sheet ----
  const regionSheet = workbook.addWorksheet("Regional Breakdown", { views: [{ showGridLines: false }] });
  addTitleBlock(regionSheet, context, 5);
  const regionHeader = regionSheet.addRow(["Region", "Active", "Closed", "Total", "Sites"]);
  styleHeaderRow(regionHeader);
  summary.regions.forEach((r, i) => {
    const row = regionSheet.addRow([r.name, r.active, r.closed, r.total, r.sites.length]);
    row.eachCell((cell) => (cell.border = THIN_BORDER));
    row.getCell(2).font = { color: ACTIVE_RED, bold: true };
    if (i % 2 === 1) row.eachCell((cell) => (cell.fill = { type: "pattern", pattern: "solid", fgColor: ZEBRA }));
  });
  const regionTotalRow = regionSheet.addRow([
    "Total",
    summary.totals.active,
    summary.totals.closed,
    summary.totals.total,
    summary.regions.reduce((s, r) => s + r.sites.length, 0),
  ]);
  regionTotalRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.border = { top: { style: "double", color: { argb: "FF9CA3AF" } } };
  });
  autoWidth(regionSheet, [24, 10, 10, 10, 8]);

  // ---- Site Breakdown sheet (only when a region is selected) ----
  if (context.selectedRegion) {
    const region = summary.regions.find((r) => r.name === context.selectedRegion);
    if (region) {
      const siteSheet = workbook.addWorksheet("Site Breakdown", { views: [{ showGridLines: false }] });
      addTitleBlock(siteSheet, context, 4);
      const siteHeader = siteSheet.addRow(["Site", "Active", "Closed", "Total"]);
      styleHeaderRow(siteHeader);
      region.sites.forEach((s, i) => {
        const row = siteSheet.addRow([s.name, s.active, s.closed, s.total]);
        row.eachCell((cell) => (cell.border = THIN_BORDER));
        row.getCell(2).font = { color: ACTIVE_RED, bold: true };
        if (i % 2 === 1) row.eachCell((cell) => (cell.fill = { type: "pattern", pattern: "solid", fgColor: ZEBRA }));
      });
      autoWidth(siteSheet, [28, 10, 10, 10]);
    }
  }

  // ---- Alarm List sheet ----
  const alarmSheet = workbook.addWorksheet("Alarm List", { views: [{ showGridLines: false }] });
  addTitleBlock(alarmSheet, context, 9);
  const alarmHeader = alarmSheet.addRow([
    "ID",
    "Date / Time",
    "Region",
    "Site",
    "Camera",
    "Event Type",
    "Severity",
    "Status",
    "Description",
  ]);
  styleHeaderRow(alarmHeader);
  alarms.forEach((a, i) => {
    const row = alarmSheet.addRow([
      a.id,
      formatReportTimestamp(a.timestamp),
      a.region,
      a.site,
      a.camera,
      (a.eventType ?? "").replace(/_/g, " "),
      a.severity ?? "",
      a.alarmStatus === "active" ? "Active" : "Closed",
      a.description ?? "",
    ]);
    row.eachCell((cell) => (cell.border = THIN_BORDER));
    const statusCell = row.getCell(8);
    statusCell.font = { bold: true, color: a.alarmStatus === "active" ? ACTIVE_RED : MUTED };
    if (i % 2 === 1) row.eachCell((cell) => (cell.fill = { type: "pattern", pattern: "solid", fgColor: ZEBRA }));
  });
  alarmSheet.views = [{ state: "frozen", ySplit: 5, showGridLines: false }];
  autoWidth(alarmSheet, [10, 18, 14, 22, 16, 16, 10, 10, 30]);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, `${reportFileBaseName(context)}.xlsx`);
}
