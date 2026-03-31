import { prisma } from "../config/prisma.js";
import { sendError } from "../utils/api-response.js";
import { verifyToken } from "../utils/jwt.js";

function extractBearerToken(headerValue) {
  if (!headerValue) {
    return null;
  }

  const [scheme, token] = headerValue.split(" ");
  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

export async function authenticate(req, res, next) {
  try {
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      return sendError(res, "Authentication token is missing", 401);
    }

    const decoded = verifyToken(token);

    const user = await prisma.user_master.findFirst({
      where: {
        id: decoded.userId,
        is_deleted: false,
        is_active: true
      },
      select: {
        id: true,
        full_name: true,
        email: true,
        department: true,
        designation: true,
        role: {
          select: {
            id: true,
            role_code: true,
            role_name: true
          }
        }
      }
    });

    if (!user) {
      return sendError(res, "User not found or inactive", 401);
    }

    req.user = {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      department: user.department,
      designation: user.designation,
      role: {
        id: user.role.id,
        roleCode: user.role.role_code,
        roleName: user.role.role_name
      }
    };

    return next();
  } catch (error) {
    return sendError(res, "Invalid or expired token", 401);
  }
}

export function authorize(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, "Authentication required", 401);
    }

    if (!allowedRoles.includes(req.user.role.roleCode)) {
      return sendError(res, "Access denied for this role", 403);
    }

    return next();
  };
}
