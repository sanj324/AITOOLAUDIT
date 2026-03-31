import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { getDashboard } from "./dashboard.controller.js";

const router = Router();

router.use(authenticate);
router.get("/", authorize(["ADMIN", "AUDITOR", "REVIEWER"]), getDashboard);

export default router;
