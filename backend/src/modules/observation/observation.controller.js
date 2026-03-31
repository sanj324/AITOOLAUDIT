import { sendError, sendSuccess } from "../../utils/api-response.js";
import { listObservations, updateObservationStatus } from "./observation.service.js";

export async function getObservations(req, res) {
  try {
    const result = await listObservations(req.user);
    return sendSuccess(res, result, "Observations fetched successfully");
  } catch (error) {
    return sendError(res, error.message, error.statusCode || 500);
  }
}

export async function editObservationStatus(req, res) {
  try {
    const result = await updateObservationStatus(Number(req.params.id), req.body.status, req.user.id);
    return sendSuccess(res, result, "Observation status updated successfully");
  } catch (error) {
    return sendError(res, error.message, error.statusCode || 500);
  }
}
