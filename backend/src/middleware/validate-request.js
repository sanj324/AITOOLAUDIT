import { validationResult } from "express-validator";
import { sendError } from "../utils/api-response.js";

export function validateRequest(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return sendError(res, "Validation failed", 422, errors.array());
  }

  return next();
}
