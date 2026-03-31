import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { handleUploadError, uploadEvidence } from "../../middleware/upload.middleware.js";
import { validateRequest } from "../../middleware/validate-request.js";
import {
  analyzeScreenshot,
  changeAuditStatus,
  createAuditPlan,
  getAudit,
  getAuditMetadata,
  getAudits,
  saveResponse
} from "./audit.controller.js";
import { exportAuditExcel, exportAuditPdf } from "./report.controller.js";
import {
  auditIdValidation,
  auditStatusValidation,
  createAuditValidation,
  responseValidation,
  screenshotAnalysisValidation
} from "./audit.validation.js";

const router = Router();

router.use(authenticate);
router.get("/meta", authorize(["ADMIN", "AUDITOR", "REVIEWER"]), getAuditMetadata);
router.get("/", authorize(["ADMIN", "AUDITOR", "REVIEWER"]), getAudits);
router.get("/:id/export/excel", authorize(["ADMIN", "AUDITOR", "REVIEWER"]), auditIdValidation, validateRequest, exportAuditExcel);
router.get("/:id/export/pdf", authorize(["ADMIN", "AUDITOR", "REVIEWER"]), auditIdValidation, validateRequest, exportAuditPdf);
router.get("/:id", authorize(["ADMIN", "AUDITOR", "REVIEWER"]), auditIdValidation, validateRequest, getAudit);
router.post("/", authorize(["ADMIN", "AUDITOR"]), createAuditValidation, validateRequest, createAuditPlan);
router.patch(
  "/:id/status",
  authorize(["ADMIN", "AUDITOR", "REVIEWER"]),
  [...auditIdValidation, ...auditStatusValidation],
  validateRequest,
  changeAuditStatus
);
router.post(
  "/:id/analyze-screenshot",
  authorize(["ADMIN", "AUDITOR"]),
  auditIdValidation,
  uploadEvidence,
  handleUploadError,
  screenshotAnalysisValidation,
  validateRequest,
  analyzeScreenshot
);
router.post(
  "/:id/responses",
  authorize(["ADMIN", "AUDITOR"]),
  auditIdValidation,
  uploadEvidence,
  handleUploadError,
  responseValidation,
  validateRequest,
  saveResponse
);

export default router;
