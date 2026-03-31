import { sendError, sendSuccess } from "../../utils/api-response.js";
import { listAuditTrailLogs } from "./audit-trail.service.js";

export async function getAuditTrailLogs(req, res) {
  try {
    const result = await listAuditTrailLogs();
    return sendSuccess(res, result, "Audit trail logs fetched successfully");
  } catch (error) {
    return sendError(res, error.message, error.statusCode || 500);
  }
}
