import { sendError, sendSuccess } from "../../utils/api-response.js";
import {
  analyzeAuditScreenshot,
  createAudit,
  getAuditById,
  listAuditMeta,
  listAudits,
  saveAuditResponse,
  updateAuditStatus
} from "./audit.service.js";

export async function getAuditMetadata(req, res) {
  try {
    const result = await listAuditMeta();
    return sendSuccess(res, result, "Audit metadata fetched successfully");
  } catch (error) {
    return sendError(res, error.message, error.statusCode || 500);
  }
}

export async function createAuditPlan(req, res) {
  try {
    const result = await createAudit(req.body, req.user);
    return sendSuccess(res, result, "Audit plan created successfully", 201);
  } catch (error) {
    return sendError(res, error.message, error.statusCode || 500);
  }
}

export async function getAudits(req, res) {
  try {
    const result = await listAudits(req.user);
    return sendSuccess(res, result, "Audits fetched successfully");
  } catch (error) {
    return sendError(res, error.message, error.statusCode || 500);
  }
}

export async function getAudit(req, res) {
  try {
    const result = await getAuditById(Number(req.params.id), req.user);
    return sendSuccess(res, result, "Audit fetched successfully");
  } catch (error) {
    return sendError(res, error.message, error.statusCode || 500);
  }
}

export async function saveResponse(req, res) {
  try {
    const result = await saveAuditResponse(Number(req.params.id), req.body, req.file, req.user);
    return sendSuccess(res, result, "Audit response saved successfully");
  } catch (error) {
    return sendError(res, error.message, error.statusCode || 500);
  }
}

export async function changeAuditStatus(req, res) {
  try {
    const result = await updateAuditStatus(Number(req.params.id), req.body.status, req.user);
    return sendSuccess(res, result, "Audit status updated successfully");
  } catch (error) {
    return sendError(res, error.message, error.statusCode || 500);
  }
}

export async function analyzeScreenshot(req, res) {
  try {
    const result = await analyzeAuditScreenshot(
      Number(req.params.id),
      Number(req.body.checklistId),
      req.file,
      req.user
    );
    return sendSuccess(res, result, "Screenshot analyzed successfully");
  } catch (error) {
    return sendError(res, error.message, error.statusCode || 500);
  }
}
