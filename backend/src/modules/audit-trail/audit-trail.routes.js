import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { getAuditTrailLogs } from "./audit-trail.controller.js";

const router = Router();

router.use(authenticate);
router.get("/", authorize(["ADMIN", "AUDITOR", "REVIEWER"]), getAuditTrailLogs);

export default router;
