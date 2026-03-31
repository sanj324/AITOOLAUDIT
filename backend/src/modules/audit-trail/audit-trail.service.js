import { prisma } from "../../config/prisma.js";

function mapAuditTrailLog(log) {
  return {
    id: log.id,
    action: log.action,
    entity: log.entity,
    entityId: log.entity_id,
    description: log.description,
    timestamp: log.created_at,
    user: log.user
      ? {
          id: log.user.id,
          fullName: log.user.full_name,
          email: log.user.email
        }
      : null
  };
}

export async function createAuditTrailLog({
  userId = null,
  action,
  entity,
  entityId = null,
  description = null
}) {
  return prisma.audit_trail_log.create({
    data: {
      user_id: userId,
      action,
      entity,
      entity_id: entityId,
      description
    }
  });
}

export async function listAuditTrailLogs() {
  const logs = await prisma.audit_trail_log.findMany({
    include: {
      user: {
        select: {
          id: true,
          full_name: true,
          email: true
        }
      }
    },
    orderBy: {
      created_at: "desc"
    }
  });

  return logs.map(mapAuditTrailLog);
}
