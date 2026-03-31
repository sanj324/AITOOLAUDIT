import { body } from "express-validator";

export const registerValidation = [
  body("fullName")
    .trim()
    .notEmpty()
    .withMessage("Full name is required")
    .isLength({ min: 3, max: 150 })
    .withMessage("Full name must be between 3 and 150 characters"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Enter a valid email")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isStrongPassword({
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    })
    .withMessage("Password must contain uppercase, lowercase, number, and symbol"),
  body("roleCode")
    .trim()
    .notEmpty()
    .withMessage("Role code is required")
    .isIn(["ADMIN", "AUDITOR", "REVIEWER"])
    .withMessage("Invalid role code"),
  body("department")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Department must not exceed 100 characters"),
  body("designation")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Designation must not exceed 100 characters")
];

export const loginValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Enter a valid email")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
];
