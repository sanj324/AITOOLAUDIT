import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { validateRequest } from "../../middleware/validate-request.js";
import { getCurrentUser, login, register } from "./auth.controller.js";
import { loginValidation, registerValidation } from "./auth.validation.js";

const router = Router();

router.post(
  "/register",
  authenticate,
  authorize(["ADMIN"]),
  registerValidation,
  validateRequest,
  register
);

router.post("/login", loginValidation, validateRequest, login);
router.get("/me", authenticate, getCurrentUser);

export default router;
