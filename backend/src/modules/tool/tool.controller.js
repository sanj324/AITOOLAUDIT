import { sendError, sendSuccess } from "../../utils/api-response.js";
import { createTool, deleteTool, getToolById, listTools, updateTool } from "./tool.service.js";

export async function getTools(req, res) {
  try {
    const result = await listTools();
    return sendSuccess(res, result, "Tools fetched successfully");
  } catch (error) {
    return sendError(res, error.message, error.statusCode || 500);
  }
}

export async function getTool(req, res) {
  try {
    const result = await getToolById(Number(req.params.id));
    return sendSuccess(res, result, "Tool fetched successfully");
  } catch (error) {
    return sendError(res, error.message, error.statusCode || 500);
  }
}

export async function addTool(req, res) {
  try {
    const result = await createTool(req.body, req.user.id);
    return sendSuccess(res, result, "Tool created successfully", 201);
  } catch (error) {
    return sendError(res, error.message, error.statusCode || 500);
  }
}

export async function editTool(req, res) {
  try {
    const result = await updateTool(Number(req.params.id), req.body, req.user.id);
    return sendSuccess(res, result, "Tool updated successfully");
  } catch (error) {
    return sendError(res, error.message, error.statusCode || 500);
  }
}

export async function removeTool(req, res) {
  try {
    const result = await deleteTool(Number(req.params.id), req.user.id);
    return sendSuccess(res, result, "Tool deleted successfully");
  } catch (error) {
    return sendError(res, error.message, error.statusCode || 500);
  }
}
