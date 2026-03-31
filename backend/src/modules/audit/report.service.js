import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { getAuditById } from "./audit.service.js";

function formatDate(value) {
  return new Date(value).toLocaleDateString();
}

export async function buildAuditExcelReport(auditId, user) {
  const audit = await getAuditById(auditId, user);
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Audit Report");

  sheet.columns = [
    { header: "Parameter", key: "parameter", width: 32 },
    { header: "Severity", key: "severity", width: 14 },
    { header: "Weight", key: "weight", width: 12 },
    { header: "Response", key: "response", width: 18 },
    { header: "Comments", key: "comments", width: 45 },
    { header: "Evidence", key: "evidence", width: 28 }
  ];

  sheet.addRow(["Audit Name", audit.auditName]);
  sheet.addRow(["Audit Type", audit.auditType]);
  sheet.addRow(["Team", audit.team]);
  sheet.addRow(["Tool Scope", audit.toolScope.toolName]);
  sheet.addRow(["Auditor", audit.auditor.fullName]);
  sheet.addRow(["Dates", `${formatDate(audit.startDate)} - ${formatDate(audit.endDate)}`]);
  sheet.addRow(["Status", audit.status]);
  sheet.addRow(["Audit Score %", audit.scoreSummary?.auditScorePercent ?? 0]);
  sheet.addRow([]);

  sheet.addRow(sheet.columns.map((column) => column.header));
  const headerRow = sheet.lastRow;
  headerRow.font = { bold: true };

  audit.checklistItems.forEach((item) => {
    sheet.addRow({
      parameter: item.parameterName,
      severity: item.severity,
      weight: item.weight,
      response: item.response?.responseStatus || "PENDING",
      comments: item.response?.comments || "",
      evidence: item.response?.evidenceFileName || ""
    });
  });

  return workbook.xlsx.writeBuffer();
}

export async function buildAuditPdfReport(auditId, user) {
  const audit = await getAuditById(auditId, user);

  return await new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    doc.fontSize(18).text("AI Privacy & Security Internal Audit Report", {
      align: "center"
    });
    doc.moveDown();
    doc.fontSize(12).text(`Audit Name: ${audit.auditName}`);
    doc.text(`Audit Type: ${audit.auditType}`);
    doc.text(`Team: ${audit.team}`);
    doc.text(`Tool Scope: ${audit.toolScope.toolName}`);
    doc.text(`Auditor: ${audit.auditor.fullName}`);
    doc.text(`Dates: ${formatDate(audit.startDate)} - ${formatDate(audit.endDate)}`);
    doc.text(`Status: ${audit.status}`);
    doc.text(`Audit Score: ${audit.scoreSummary?.auditScorePercent ?? 0}%`);
    doc.text(`Observations: ${audit.observationCount ?? 0}`);
    doc.moveDown();

    audit.checklistItems.forEach((item, index) => {
      doc.fontSize(11).text(`${index + 1}. ${item.parameterName}`, {
        underline: true
      });
      doc.fontSize(10).text(`Severity: ${item.severity} | Weight: ${item.weight}`);
      doc.text(`Response: ${item.response?.responseStatus || "PENDING"}`);
      doc.text(`Comments: ${item.response?.comments || "None"}`);
      doc.text(`Evidence: ${item.response?.evidenceFileName || "Not attached"}`);
      doc.moveDown(0.8);
    });

    doc.end();
  });
}
