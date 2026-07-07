import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";
import { saveAs } from "file-saver";
import { BRAND, getLogoBufferAndDims, timestampStamp } from "./report-branding";
import {
  type AlarmReportContext,
  formatReportTimestamp,
  reportFileBaseName,
  reportScopeLabel,
} from "./alarm-report-types";

const PRIMARY = "A6262C";
const PRIMARY_DARK = "7A1B20";
const INK = "1F2937";
const MUTED = "6B7280";
const LIGHT_FILL = "F3F4F6";
const ZEBRA_FILL = "FAFAFA";
const BORDER_GRAY = "D1D5DB";

const cellBorder = {
  top: { style: BorderStyle.SINGLE, size: 2, color: BORDER_GRAY },
  bottom: { style: BorderStyle.SINGLE, size: 2, color: BORDER_GRAY },
  left: { style: BorderStyle.SINGLE, size: 2, color: BORDER_GRAY },
  right: { style: BorderStyle.SINGLE, size: 2, color: BORDER_GRAY },
};

function headerCell(text: string, widthPct: number, fill = PRIMARY_DARK): TableCell {
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.SOLID, fill, color: "auto" },
    verticalAlign: VerticalAlign.CENTER,
    borders: cellBorder,
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: true, color: "FFFFFF", size: 20 })],
      }),
    ],
  });
}

function bodyCell(
  text: string,
  widthPct: number,
  opts: { bold?: boolean; color?: string; shade?: string; align?: (typeof AlignmentType)[keyof typeof AlignmentType] } = {},
): TableCell {
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    verticalAlign: VerticalAlign.CENTER,
    borders: cellBorder,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    shading: opts.shade ? { type: ShadingType.SOLID, fill: opts.shade, color: "auto" } : undefined,
    children: [
      new Paragraph({
        alignment: opts.align,
        children: [new TextRun({ text, bold: opts.bold, color: opts.color ?? INK, size: 18 })],
      }),
    ],
  });
}

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 320, after: 140 },
    children: [new TextRun({ text, color: PRIMARY, bold: true })],
  });
}

export async function generateAlarmWordReport(context: AlarmReportContext): Promise<void> {
  const { summary, alarms } = context;
  const logo = await getLogoBufferAndDims();

  const headerChildren: Paragraph[] = [];
  if (logo) {
    const h = 30;
    const w = (logo.width / logo.height) * h;
    headerChildren.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [
          new ImageRun({
            type: "png",
            data: logo.buffer,
            transformation: { width: w, height: h },
          } as any),
        ],
      }),
    );
  }

  const docHeader = new Header({ children: headerChildren });
  const docFooter = new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: `${BRAND.name} — Confidential Alarm Analytics Report   •   Page `,
            size: 16,
            color: MUTED,
          }),
          new TextRun({ children: [PageNumber.CURRENT], size: 16, color: MUTED }),
          new TextRun({ text: " of ", size: 16, color: MUTED }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: MUTED }),
        ],
      }),
    ],
  });

  const body: (Paragraph | Table)[] = [];

  body.push(
    new Paragraph({
      spacing: { after: 60 },
      children: [new TextRun({ text: `${BRAND.name} Alarm Analytics Report`, bold: true, size: 40, color: INK })],
    }),
    new Paragraph({
      spacing: { after: 80 },
      children: [new TextRun({ text: BRAND.tagline, italics: true, size: 20, color: MUTED })],
    }),
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({ text: "Scope: ", bold: true, size: 20, color: INK }),
        new TextRun({ text: reportScopeLabel(context), size: 20, color: INK }),
      ],
    }),
    new Paragraph({
      spacing: { after: 260 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: PRIMARY } },
      children: [
        new TextRun({ text: "Generated: ", bold: true, size: 18, color: MUTED }),
        new TextRun({ text: timestampStamp(), size: 18, color: MUTED }),
      ],
    }),
  );

  // Executive summary KPI table
  body.push(sectionHeading("Executive Summary"));
  body.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [headerCell("Metric", 60), headerCell("Value", 40)],
        }),
        new TableRow({
          children: [bodyCell("Total Alarms", 60, { bold: true }), bodyCell(String(summary.totals.total), 40, { bold: true, align: AlignmentType.RIGHT })],
        }),
        new TableRow({
          children: [
            bodyCell("Active (Open)", 60, { bold: true, shade: LIGHT_FILL }),
            bodyCell(String(summary.totals.active), 40, { bold: true, color: "B91C1C", shade: LIGHT_FILL, align: AlignmentType.RIGHT }),
          ],
        }),
        new TableRow({
          children: [
            bodyCell("Closed", 60, { bold: true }),
            bodyCell(String(summary.totals.closed), 40, { bold: true, align: AlignmentType.RIGHT }),
          ],
        }),
        new TableRow({
          children: [
            bodyCell("Regions Covered", 60, { bold: true, shade: LIGHT_FILL }),
            bodyCell(String(summary.regions.length), 40, { bold: true, align: AlignmentType.RIGHT, shade: LIGHT_FILL }),
          ],
        }),
      ],
    }),
  );

  // Regional breakdown
  body.push(sectionHeading("Regional Breakdown"));
  const regionRows: TableRow[] = [
    new TableRow({
      children: [
        headerCell("Region", 34),
        headerCell("Active", 16),
        headerCell("Closed", 16),
        headerCell("Total", 16),
        headerCell("Sites", 18),
      ],
    }),
  ];
  summary.regions.forEach((r, i) => {
    const shade = i % 2 === 1 ? ZEBRA_FILL : undefined;
    regionRows.push(
      new TableRow({
        children: [
          bodyCell(r.name, 34, { bold: true, shade }),
          bodyCell(String(r.active), 16, { color: "B91C1C", bold: true, shade, align: AlignmentType.CENTER }),
          bodyCell(String(r.closed), 16, { shade, align: AlignmentType.CENTER }),
          bodyCell(String(r.total), 16, { shade, align: AlignmentType.CENTER }),
          bodyCell(String(r.sites.length), 18, { shade, align: AlignmentType.CENTER }),
        ],
      }),
    );
  });
  body.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: regionRows }));

  // Site breakdown (if a region is selected)
  if (context.selectedRegion) {
    const region = summary.regions.find((r) => r.name === context.selectedRegion);
    if (region) {
      body.push(sectionHeading(`Site Breakdown — ${region.name}`));
      const siteRows: TableRow[] = [
        new TableRow({
          children: [headerCell("Site", 40), headerCell("Active", 20), headerCell("Closed", 20), headerCell("Total", 20)],
        }),
      ];
      region.sites.forEach((s, i) => {
        const shade = i % 2 === 1 ? ZEBRA_FILL : undefined;
        siteRows.push(
          new TableRow({
            children: [
              bodyCell(s.name, 40, { bold: true, shade }),
              bodyCell(String(s.active), 20, { color: "B91C1C", bold: true, shade, align: AlignmentType.CENTER }),
              bodyCell(String(s.closed), 20, { shade, align: AlignmentType.CENTER }),
              bodyCell(String(s.total), 20, { shade, align: AlignmentType.CENTER }),
            ],
          }),
        );
      });
      body.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: siteRows }));
    }
  }

  // Alarm list
  body.push(sectionHeading(`Alarm List (${alarms.length})`));
  const alarmRows: TableRow[] = [
    new TableRow({
      children: [
        headerCell("Date / Time", 16),
        headerCell("Region", 12),
        headerCell("Site", 16),
        headerCell("Camera", 14),
        headerCell("Event", 14),
        headerCell("Status", 10),
        headerCell("Description", 18),
      ],
    }),
  ];
  alarms.slice(0, 500).forEach((a, i) => {
    const shade = i % 2 === 1 ? ZEBRA_FILL : undefined;
    const isActive = a.alarmStatus === "active";
    alarmRows.push(
      new TableRow({
        children: [
          bodyCell(formatReportTimestamp(a.timestamp), 16, { shade }),
          bodyCell(a.region, 12, { shade }),
          bodyCell(a.site, 16, { shade }),
          bodyCell(a.camera, 14, { shade }),
          bodyCell((a.eventType ?? "").replace(/_/g, " "), 14, { shade }),
          bodyCell(isActive ? "Active" : "Closed", 10, { bold: true, color: isActive ? "B91C1C" : MUTED, shade, align: AlignmentType.CENTER }),
          bodyCell(a.description ?? "—", 18, { shade }),
        ],
      }),
    );
  });
  body.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: alarmRows }));

  if (alarms.length > 500) {
    body.push(
      new Paragraph({
        spacing: { before: 160 },
        children: [
          new TextRun({
            text: `Showing first 500 of ${alarms.length} alarms. Export CSV/Excel for the full dataset.`,
            italics: true,
            size: 16,
            color: MUTED,
          }),
        ],
      }),
    );
  }

  const doc = new Document({
    sections: [
      {
        headers: { default: docHeader },
        footers: { default: docFooter },
        properties: {
          page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } },
        },
        children: body,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${reportFileBaseName(context)}.docx`);
}
