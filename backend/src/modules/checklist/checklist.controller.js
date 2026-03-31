import { sendError, sendSuccess } from "../../utils/api-response.js";
import {
  createChecklist,
  deleteChecklist,
  getChecklistById,
  listChecklists,
  updateChecklist
} from "./checklist.service.js";

export async function getChecklists(req, res) {
  try {
    const result = await listChecklists();
    return sendSuccess(res, result, "Checklists fetched successfully");
  } catch (error) {
    return sendError(res, error.message, error.statusCode || 500);
  }
}

export async function getChecklist(req, res) {
  try {
    const result = await getChecklistById(Number(req.params.id));
    return sendSuccess(res, result, "Checklist fetched successfully");
  } catch (error) {
    return sendError(res, error.message, error.statusCode || 500);
  }
}

export async function addChecklist(req, res) {
  try {
    const result = await createChecklist(req.body, req.user.id);
    return sendSuccess(res, result, "Checklist created successfully", 201);
  } catch (error) {
    return sendError(res, error.message, error.statusCode || 500);
  }
}

export async function editChecklist(req, res) {
  try {
    const result = await updateChecklist(Number(req.params.id), req.body, req.user.id);
    return sendSuccess(res, result, "Checklist updated successfully");
  } catch (error) {
    return sendError(res, error.message, error.statusCode || 500);
  }
}

export async function removeChecklist(req, res) {
  try {
    const result = await deleteChecklist(Number(req.params.id), req.user.id);
    return sendSuccess(res, result, "Checklist deleted successfully");
  } catch (error) {
    return sendError(res, error.message, error.statusCode || 500);
  }
}
