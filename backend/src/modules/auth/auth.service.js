import bcrypt from "bcryptjs";
import { prisma } from "../../config/prisma.js";
import { createAuditTrailLog } from "../audit-trail/audit-trail.service.js";
import { signToken } from "../../utils/jwt.js";

function mapUser(user) {
  return {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    department: user.department,
    designation: user.designation,
    lastLoginAt: user.last_login_at,
    role: {
      id: user.role.id,
      roleCode: user.role.role_code,
      roleName: user.role.role_name
    }
  };
}

export async function registerUser(payload) {
  const existingUser = await prisma.user_master.findUnique({
    where: { email: payload.email }
  });

  if (existingUser && !existingUser.is_deleted) {
    const error = new Error("User with this email already exists");
    error.statusCode = 409;
    throw error;
  }

  const role = await prisma.role_master.findFirst({
    where: {
      role_code: payload.roleCode,
      is_active: true,
      is_deleted: false
    }
  });

  if (!role) {
    const error = new Error("Selected role is unavailable");
    error.statusCode = 400;
    throw error;
  }

  const passwordHash = await bcrypt.hash(payload.password, 12);

  const user = await prisma.user_master.upsert({
    where: { email: payload.email },
    update: {
      full_name: payload.fullName,
      password_hash: passwordHash,
      role_id: role.id,
      department: payload.department || null,
      designation: payload.designation || null,
      is_deleted: false,
      is_active: true
    },
    create: {
      full_name: payload.fullName,
      email: payload.email,
      password_hash: passwordHash,
      role_id: role.id,
      department: payload.department || null,
      designation: payload.designation || null
    },
    include: {
      role: true
    }
  });

  const token = signToken({
    userId: user.id,
    roleCode: user.role.role_code
  });

  await createAuditTrailLog({
    userId: user.id,
    action: "USER_REGISTERED",
    entity: "USER_MASTER",
    entityId: user.id,
    description: `User ${user.email} registered with role ${user.role.role_name}`
  });

  return {
    token,
    user: mapUser(user)
  };
}

export async function loginUser(payload) {
  const user = await prisma.user_master.findUnique({
    where: { email: payload.email },
    include: {
      role: true
    }
  });

  if (!user || user.is_deleted || !user.is_active) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  const passwordMatches = await bcrypt.compare(payload.password, user.password_hash);

  if (!passwordMatches) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  const loginTime = new Date();

  await prisma.user_master.update({
    where: { id: user.id },
    data: {
      last_login_at: loginTime
    }
  });

  const token = signToken({
    userId: user.id,
    roleCode: user.role.role_code
  });

  await createAuditTrailLog({
    userId: user.id,
    action: "LOGIN",
    entity: "AUTH",
    entityId: user.id,
    description: `User ${user.email} logged into the system`
  });

  return {
    token,
    user: mapUser({
      ...user,
      last_login_at: loginTime
    })
  };
}
