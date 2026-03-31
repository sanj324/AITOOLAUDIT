import { sendError, sendSuccess } from "../../utils/api-response.js";
import { loginUser, registerUser } from "./auth.service.js";

export async function register(req, res) {
  try {
    const result = await registerUser(req.body);
    return sendSuccess(res, result, "User registered successfully", 201);
  } catch (error) {
    return sendError(res, error.message, error.statusCode || 500);
  }
}

export async function login(req, res) {
  try {
    const result = await loginUser(req.body);
    return sendSuccess(res, result, "Login successful");
  } catch (error) {
    return sendError(res, error.message, error.statusCode || 500);
  }
}

export async function getCurrentUser(req, res) {
  return sendSuccess(res, req.user, "Current user fetched successfully");
}
