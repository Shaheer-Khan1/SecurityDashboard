import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { BRAND, getLogoDataUrl, timestampStamp } from "./report-branding";
import {
  type AlarmReportContext,
  formatReportTimestamp,
  reportFileBaseName,
  reportScopeLabel,
} from "./alarm-report-types";

const PRIMARY: [number, number, number] = [166, 38, 44]; // A6262C
const PRIMARY_DARK: [number, number, number] = [122, 27, 32]; // 7A1B20
const INK: [number, number, number] = [31, 41, 55];
const MUTED: [number, number, number] = [107, 114, 128];
const ACTIVE_RED: [number, number, number] = [185, 28, 28];
const LIGHT_FILL: [number, number, number] = [243, 244, 246];
const ZEBRA: [number, number, number] = [250, 250, 250];
const BORDER_GRAY: [number, number, number] = [209, 213, 219];

const MARGIN = 40;

function drawHeaderBand(doc: jsPDF, pageWidth: number, logoDataUrl: string | null) {
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, pageWidth, 64, "F");
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, "PNG", MARGIN, 14, 36, 36);
    } catch {
      // ignore malformed image
    }
  }
  const textX = logoDataUrl ? MARGIN + 46 : MARGIN;
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(`${BRAND.name} — Alarm Analytics Report`, textX, 30);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(BRAND.tagline, textX, 45);
}

function drawFooter(doc: jsPDF, pageWidth: number, pageHeight: number, pageNum: number, totalPages: number) {
  doc.setDrawColor(...BORDER_GRAY);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, pageHeight - 34, pageWidth - MARGIN, pageHeight - 34);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(`${BRAND.name} — Confidential Alarm Analytics Report`, MARGIN, pageHeight - 20);
  doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - MARGIN, pageHeight - 20, { align: "right" });
}

function sectionTitle(doc: jsPDF, text: string, y: number): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...PRIMARY);
  doc.text(text, MARGIN, y);
  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(1);
  doc.line(MARGIN, y + 4, doc.internal.pageSize.getWidth() - MARGIN, y + 4);
  return y + 18;
}

export async function generateAlarmPdfReport(context: AlarmReportContext): Promise<void> {
  const { summary, alarms } = context;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const logoDataUrl = await getLogoDataUrl();

  drawHeaderBand(doc, pageWidth, logoDataUrl);

  doc.setTextColor(...INK);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Scope: ${reportScopeLabel(context)}`, MARGIN, 84);
  doc.setTextColor(...MUTED);
  doc.text(`Generated: ${timestampStamp()}`, pageWidth - MARGIN, 84, { align: "right" });

  let y = 108;
  y = sectionTitle(doc, "Executive Summary", y);

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 6, lineColor: BORDER_GRAY, lineWidth: 0.5 },
    head: [["Total Alarms", "Active (Open)", "Closed", "Regions Covered"]],
    body: [[
      String(summary.totals.total),
      String(summary.totals.active),
      String(summary.totals.closed),
      String(summary.regions.length),
    ]],
    headStyles: { fillColor: PRIMARY_DARK, textColor: 255, fontStyle: "bold", halign: "center" },
    bodyStyles: { halign: "center", fontStyle: "bold" },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 1) {
        data.cell.styles.textColor = ACTIVE_RED;
      }
    },
  });

  y = ((doc as any).lastAutoTable?.finalY ?? y) + 26;
  y = sectionTitle(doc, "Regional Breakdown", y);

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 5, lineColor: BORDER_GRAY, lineWidth: 0.5, textColor: INK },
    head: [["Region", "Active", "Closed", "Total", "Sites"]],
    body: summary.regions.map((r) => [r.name, String(r.active), String(r.closed), String(r.total), String(r.sites.length)]),
    foot: [[
      "Total",
      String(summary.totals.active),
      String(summary.totals.closed),
      String(summary.totals.total),
      String(summary.regions.reduce((s, r) => s + r.sites.length, 0)),
    ]],
    headStyles: { fillColor: PRIMARY, textColor: 255, fontStyle: "bold" },
    footStyles: { fillColor: LIGHT_FILL, textColor: INK, fontStyle: "bold" },
    alternateRowStyles: { fillColor: ZEBRA },
    columnStyles: { 1: { halign: "center" }, 2: { halign: "center" }, 3: { halign: "center" }, 4: { halign: "center" } },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 1) {
        data.cell.styles.textColor = ACTIVE_RED;
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  y = ((doc as any).lastAutoTable?.finalY ?? y) + 26;

  if (context.selectedRegion) {
    const region = summary.regions.find((r) => r.name === context.selectedRegion);
    if (region) {
      if (y > doc.internal.pageSize.getHeight() - 140) {
        doc.addPage();
        y = 50;
      }
      y = sectionTitle(doc, `Site Breakdown — ${region.name}`, y);
      autoTable(doc, {
        startY: y,
        margin: { left: MARGIN, right: MARGIN },
        theme: "grid",
        styles: { fontSize: 9, cellPadding: 5, lineColor: BORDER_GRAY, lineWidth: 0.5, textColor: INK },
        head: [["Site", "Active", "Closed", "Total"]],
        body: region.sites.map((s) => [s.name, String(s.active), String(s.closed), String(s.total)]),
        headStyles: { fillColor: PRIMARY, textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: ZEBRA },
        columnStyles: { 1: { halign: "center" }, 2: { halign: "center" }, 3: { halign: "center" } },
        didParseCell: (data) => {
          if (data.section === "body" && data.column.index === 1) {
            data.cell.styles.textColor = ACTIVE_RED;
            data.cell.styles.fontStyle = "bold";
          }
        },
      });
      y = ((doc as any).lastAutoTable?.finalY ?? y) + 26;
    }
  }

  if (y > doc.internal.pageSize.getHeight() - 140) {
    doc.addPage();
    y = 50;
  }
  y = sectionTitle(doc, `Alarm List (${alarms.length})`, y);

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    theme: "grid",
    styles: { fontSize: 7.5, cellPadding: 4, lineColor: BORDER_GRAY, lineWidth: 0.4, textColor: INK, overflow: "linebreak" },
    head: [["Date / Time", "Region", "Site", "Camera", "Event", "Severity", "Status", "Description"]],
    body: alarms.slice(0, 1000).map((a) => [
      formatReportTimestamp(a.timestamp),
      a.region,
      a.site,
      a.camera,
      (a.eventType ?? "").replace(/_/g, " "),
      a.severity ?? "",
      a.alarmStatus === "active" ? "Active" : "Closed",
      a.description ?? "—",
    ]),
    headStyles: { fillColor: PRIMARY, textColor: 255, fontStyle: "bold", fontSize: 8 },
    alternateRowStyles: { fillColor: ZEBRA },
    columnStyles: {
      0: { cellWidth: 62 },
      1: { cellWidth: 50 },
      2: { cellWidth: 60 },
      3: { cellWidth: 55 },
      4: { cellWidth: 50 },
      5: { cellWidth: 40 },
      6: { cellWidth: 40, halign: "center" },
      7: { cellWidth: "auto" },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 6) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.textColor = data.cell.raw === "Active" ? ACTIVE_RED : MUTED;
      }
    },
  });

  if (alarms.length > 1000) {
    const finalY = ((doc as any).lastAutoTable?.finalY ?? y) + 16;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(
      `Showing first 1000 of ${alarms.length} alarms. Export CSV/Excel for the full dataset.`,
      MARGIN,
      finalY,
    );
  }

  const pageHeight = doc.internal.pageSize.getHeight();
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    if (p > 1) drawHeaderBand(doc, pageWidth, logoDataUrl);
    drawFooter(doc, pageWidth, pageHeight, p, totalPages);
  }

  doc.save(`${reportFileBaseName(context)}.pdf`);
}
