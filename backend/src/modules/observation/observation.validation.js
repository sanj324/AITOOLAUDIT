import { body, param } from "express-validator";

export const observationIdValidation = [
  param("id").isInt({ min: 1 }).withMessage("Valid observation id is required")
];

export const observationStatusValidation = [
  body("status")
    .trim()
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["OPEN", "IN_PROGRESS", "CLOSED"])
    .withMessage("Status must be OPEN, IN_PROGRESS, or CLOSED")
];
