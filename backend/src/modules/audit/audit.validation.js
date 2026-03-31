import { body, param } from "express-validator";

export const auditIdValidation = [
  param("id").isInt({ min: 1 }).withMessage("Valid audit id is required")
];

export const createAuditValidation = [
  body("auditName")
    .trim()
    .notEmpty()
    .withMessage("Audit name is required")
    .isLength({ min: 3, max: 200 })
    .withMessage("Audit name must be between 3 and 200 characters"),
  body("auditType")
    .trim()
    .notEmpty()
    .withMessage("Audit type is required")
    .isLength({ min: 3, max: 100 })
    .withMessage("Audit type must be between 3 and 100 characters"),
  body("team")
    .trim()
    .notEmpty()
    .withMessage("Team is required")
    .isLength({ min: 2, max: 150 })
    .withMessage("Team must be between 2 and 150 characters"),
  body("toolId")
    .notEmpty()
    .withMessage("Tool scope is required")
    .isInt({ min: 1 })
    .withMessage("Valid tool id is required"),
  body("auditorId")
    .notEmpty()
    .withMessage("Auditor is required")
    .isInt({ min: 1 })
    .withMessage("Valid auditor id is required"),
  body("startDate")
    .notEmpty()
    .withMessage("Start date is required")
    .isISO8601()
    .withMessage("Start date must be valid"),
  body("endDate")
    .notEmpty()
    .withMessage("End date is required")
    .isISO8601()
    .withMessage("End date must be valid"),
  body("status")
    .optional()
    .isIn(["PLANNED", "IN_PROGRESS", "REVIEW_PENDING", "COMPLETED"])
    .withMessage("Invalid audit status")
];

export const auditStatusValidation = [
  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["PLANNED", "IN_PROGRESS", "REVIEW_PENDING", "COMPLETED"])
    .withMessage("Invalid audit status")
];

export const responseValidation = [
  body("checklistId")
    .notEmpty()
    .withMessage("Checklist id is required")
    .isInt({ min: 1 })
    .withMessage("Valid checklist id is required"),
  body("responseStatus")
    .trim()
    .notEmpty()
    .withMessage("Response status is required")
    .isIn(["COMPLIANT", "PARTIAL", "NON_COMPLIANT", "NA"])
    .withMessage("Invalid response status"),
  body("comments")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Comments must not exceed 1000 characters"),
  body("observationTitle")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 200 })
    .withMessage("Observation title must not exceed 200 characters"),
  body("observationDescription")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Observation description must not exceed 1000 characters"),
  body("observationSeverity")
    .optional({ values: "falsy" })
    .trim()
    .isIn(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
    .withMessage("Observation severity must be LOW, MEDIUM, HIGH, or CRITICAL"),
  body("observationRecommendation")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Observation recommendation must not exceed 1000 characters")
];

export const screenshotAnalysisValidation = [
  body("checklistId")
    .notEmpty()
    .withMessage("Checklist id is required")
    .isInt({ min: 1 })
    .withMessage("Valid checklist id is required")
];
