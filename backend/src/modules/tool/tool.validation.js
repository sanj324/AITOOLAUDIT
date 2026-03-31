import { body, param } from "express-validator";

export const toolIdValidation = [
  param("id").isInt({ min: 1 }).withMessage("Valid tool id is required")
];

export const toolPayloadValidation = [
  body("toolName")
    .trim()
    .notEmpty()
    .withMessage("Tool name is required")
    .isLength({ min: 2, max: 150 })
    .withMessage("Tool name must be between 2 and 150 characters"),
  body("description")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must not exceed 500 characters"),
  body("riskLevel")
    .trim()
    .notEmpty()
    .withMessage("Risk level is required")
    .isIn(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
    .withMessage("Risk level must be LOW, MEDIUM, HIGH, or CRITICAL"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be true or false")
];
