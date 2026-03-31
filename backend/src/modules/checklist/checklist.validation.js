import { body, param } from "express-validator";

export const checklistIdValidation = [
  param("id").isInt({ min: 1 }).withMessage("Valid checklist id is required")
];

export const checklistPayloadValidation = [
  body("parameterName")
    .trim()
    .notEmpty()
    .withMessage("Parameter name is required")
    .isLength({ min: 3, max: 200 })
    .withMessage("Parameter name must be between 3 and 200 characters"),
  body("description")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must not exceed 500 characters"),
  body("toolId")
    .notEmpty()
    .withMessage("Tool selection is required")
    .isInt({ min: 1 })
    .withMessage("Valid tool id is required"),
  body("severity")
    .trim()
    .notEmpty()
    .withMessage("Severity is required")
    .isIn(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
    .withMessage("Severity must be LOW, MEDIUM, HIGH, or CRITICAL"),
  body("weight")
    .notEmpty()
    .withMessage("Weight is required")
    .isFloat({ min: 0.01, max: 999.99 })
    .withMessage("Weight must be between 0.01 and 999.99"),
  body("evidenceRequired")
    .isBoolean()
    .withMessage("evidenceRequired must be true or false"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be true or false")
];
