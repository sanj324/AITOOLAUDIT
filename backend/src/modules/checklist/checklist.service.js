import { prisma } from "../../config/prisma.js";
import { createAuditTrailLog } from "../audit-trail/audit-trail.service.js";

function mapChecklist(checklist) {
  return {
    id: checklist.id,
    parameterName: checklist.parameter_name,
    description: checklist.description,
    toolId: checklist.tool_id,
    severity: checklist.severity,
    weight: Number(checklist.weight),
    evidenceRequired: checklist.evidence_required,
    isActive: checklist.is_active,
    createdAt: checklist.created_at,
    updatedAt: checklist.updated_at,
    tool: checklist.tool
      ? {
          id: checklist.tool.id,
          toolName: checklist.tool.tool_name,
          riskLevel: checklist.tool.risk_level
        }
      : undefined
  };
}

async function ensureToolExists(toolId) {
  const tool = await prisma.tool_master.findFirst({
    where: {
      id: toolId,
      is_deleted: false
    }
  });

  if (!tool) {
    const error = new Error("Checklist must be linked to an existing tool");
    error.statusCode = 400;
    throw error;
  }

  return tool;
}

export async function listChecklists() {
  const checklists = await prisma.checklist_master.findMany({
    where: {
      is_deleted: false
    },
    include: {
      tool: true
    },
    orderBy: [
      {
        tool: {
          tool_name: "asc"
        }
      },
      {
        parameter_name: "asc"
      }
    ]
  });

  return checklists.map(mapChecklist);
}

export async function getChecklistById(id) {
  const checklist = await prisma.checklist_master.findFirst({
    where: {
      id,
      is_deleted: false
    },
    include: {
      tool: true
    }
  });

  if (!checklist) {
    const error = new Error("Checklist not found");
    error.statusCode = 404;
    throw error;
  }

  return mapChecklist(checklist);
}

export async function createChecklist(payload, userId = null) {
  await ensureToolExists(Number(payload.toolId));

  const existingChecklist = await prisma.checklist_master.findFirst({
    where: {
      parameter_name: payload.parameterName,
      tool_id: Number(payload.toolId),
      is_deleted: false
    }
  });

  if (existingChecklist) {
    const error = new Error("This checklist parameter already exists for the selected tool");
    error.statusCode = 409;
    throw error;
  }

  const checklist = await prisma.checklist_master.create({
    data: {
      parameter_name: payload.parameterName,
      description: payload.description || null,
      tool_id: Number(payload.toolId),
      severity: payload.severity,
      weight: payload.weight,
      evidence_required: payload.evidenceRequired,
      is_active: payload.isActive ?? true
    },
    include: {
      tool: true
    }
  });

  await createAuditTrailLog({
    userId,
    action: "CHECKLIST_CREATED",
    entity: "CHECKLIST_MASTER",
    entityId: checklist.id,
    description: `Checklist parameter ${checklist.parameter_name} created`
  });

  return mapChecklist(checklist);
}

export async function updateChecklist(id, payload, userId = null) {
  await getChecklistById(id);
  await ensureToolExists(Number(payload.toolId));

  const duplicateChecklist = await prisma.checklist_master.findFirst({
    where: {
      parameter_name: payload.parameterName,
      tool_id: Number(payload.toolId),
      is_deleted: false,
      NOT: {
        id
      }
    }
  });

  if (duplicateChecklist) {
    const error = new Error("Another checklist parameter already exists for this tool");
    error.statusCode = 409;
    throw error;
  }

  const checklist = await prisma.checklist_master.update({
    where: { id },
    data: {
      parameter_name: payload.parameterName,
      description: payload.description || null,
      tool_id: Number(payload.toolId),
      severity: payload.severity,
      weight: payload.weight,
      evidence_required: payload.evidenceRequired,
      is_active: payload.isActive ?? true
    },
    include: {
      tool: true
    }
  });

  await createAuditTrailLog({
    userId,
    action: "CHECKLIST_UPDATED",
    entity: "CHECKLIST_MASTER",
    entityId: checklist.id,
    description: `Checklist parameter ${checklist.parameter_name} updated`
  });

  return mapChecklist(checklist);
}

export async function deleteChecklist(id, userId = null) {
  const existing = await getChecklistById(id);

  await prisma.checklist_master.update({
    where: { id },
    data: {
      is_deleted: true,
      is_active: false
    }
  });

  await createAuditTrailLog({
    userId,
    action: "CHECKLIST_SOFT_DELETED",
    entity: "CHECKLIST_MASTER",
    entityId: id,
    description: `Checklist parameter ${existing.parameterName || "record"} marked inactive and deleted`
  });

  return { id };
}
