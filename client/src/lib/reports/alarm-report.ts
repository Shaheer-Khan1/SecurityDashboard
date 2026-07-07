import type { AlarmReportContext, AlarmReportFormat } from "./alarm-report-types";
import { generateAlarmCsvReport } from "./alarm-report-csv";
import { generateAlarmExcelReport } from "./alarm-report-excel";
import { generateAlarmWordReport } from "./alarm-report-word";
import { generateAlarmPdfReport } from "./alarm-report-pdf";

export type { AlarmReportContext, AlarmReportFormat } from "./alarm-report-types";

/** Generates and downloads a professionally formatted alarm analytics report. */
export async function generateAlarmReport(
  format: AlarmReportFormat,
  context: AlarmReportContext,
): Promise<void> {
  switch (format) {
    case "csv":
      generateAlarmCsvReport(context);
      return;
    case "excel":
      await generateAlarmExcelReport(context);
      return;
    case "word":
      await generateAlarmWordReport(context);
      return;
    case "pdf":
      await generateAlarmPdfReport(context);
      return;
    default:
      throw new Error(`Unsupported report format: ${format}`);
  }
}
