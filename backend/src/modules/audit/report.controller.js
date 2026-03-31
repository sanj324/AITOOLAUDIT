import { sendError } from "../../utils/api-response.js";
import { buildAuditExcelReport, buildAuditPdfReport } from "./report.service.js";

export async function exportAuditExcel(req, res) {
  try {
    const buffer = await buildAuditExcelReport(Number(req.params.id), req.user);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=audit-report-${req.params.id}.xlsx`
    );
    return res.send(buffer);
  } catch (error) {
    return sendError(res, error.message, error.statusCode || 500);
  }
}

export async function exportAuditPdf(req, res) {
  try {
    const buffer = await buildAuditPdfReport(Number(req.params.id), req.user);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=audit-report-${req.params.id}.pdf`
    );
    return res.send(buffer);
  } catch (error) {
    return sendError(res, error.message, error.statusCode || 500);
  }
}
