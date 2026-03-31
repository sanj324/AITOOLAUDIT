import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { validateRequest } from "../../middleware/validate-request.js";
import { editObservationStatus, getObservations } from "./observation.controller.js";
import { observationIdValidation, observationStatusValidation } from "./observation.validation.js";

const router = Router();

router.use(authenticate);
router.get("/", authorize(["ADMIN", "AUDITOR", "REVIEWER"]), getObservations);
router.patch(
  "/:id/status",
  authorize(["ADMIN", "AUDITOR", "REVIEWER"]),
  [...observationIdValidation, ...observationStatusValidation],
  validateRequest,
  editObservationStatus
);

export default router;
