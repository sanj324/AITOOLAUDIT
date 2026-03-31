import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { validateRequest } from "../../middleware/validate-request.js";
import { addTool, editTool, getTool, getTools, removeTool } from "./tool.controller.js";
import { toolIdValidation, toolPayloadValidation } from "./tool.validation.js";

const router = Router();

router.use(authenticate);
router.get("/", getTools);
router.get("/:id", toolIdValidation, validateRequest, getTool);
router.post("/", authorize(["ADMIN"]), toolPayloadValidation, validateRequest, addTool);
router.put("/:id", authorize(["ADMIN"]), [...toolIdValidation, ...toolPayloadValidation], validateRequest, editTool);
router.delete("/:id", authorize(["ADMIN"]), toolIdValidation, validateRequest, removeTool);

export default router;
