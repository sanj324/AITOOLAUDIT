import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { validateRequest } from "../../middleware/validate-request.js";
import {
  addChecklist,
  editChecklist,
  getChecklist,
  getChecklists,
  removeChecklist
} from "./checklist.controller.js";
import {
  checklistIdValidation,
  checklistPayloadValidation
} from "./checklist.validation.js";

const router = Router();

router.use(authenticate);
router.get("/", getChecklists);
router.get("/:id", checklistIdValidation, validateRequest, getChecklist);
router.post("/", authorize(["ADMIN"]), checklistPayloadValidation, validateRequest, addChecklist);
router.put(
  "/:id",
  authorize(["ADMIN"]),
  [...checklistIdValidation, ...checklistPayloadValidation],
  validateRequest,
  editChecklist
);
router.delete("/:id", authorize(["ADMIN"]), checklistIdValidation, validateRequest, removeChecklist);

export default router;
