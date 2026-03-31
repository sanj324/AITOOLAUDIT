import { sendError, sendSuccess } from "../../utils/api-response.js";
import { getDashboardMetrics } from "./dashboard.service.js";

export async function getDashboard(req, res) {
  try {
    const result = await getDashboardMetrics();
    return sendSuccess(res, result, "Dashboard metrics fetched successfully");
  } catch (error) {
    return sendError(res, error.message, error.statusCode || 500);
  }
}
