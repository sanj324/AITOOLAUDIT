import { prisma } from "../../config/prisma.js";
import { createAuditTrailLog } from "../audit-trail/audit-trail.service.js";

function mapTool(tool) {
  return {
    id: tool.id,
    toolName: tool.tool_name,
    description: tool.description,
    riskLevel: tool.risk_level,
    isActive: tool.is_active,
    createdAt: tool.created_at,
    updatedAt: tool.updated_at,
    checklistCount: tool._count?.checklists ?? undefined
  };
}

export async function listTools() {
  const tools = await prisma.tool_master.findMany({
    where: {
      is_deleted: false
    },
    orderBy: {
      tool_name: "asc"
    },
    include: {
      _count: {
        select: {
          checklists: true
        }
      }
    }
  });

  return tools.map(mapTool);
}

export async function getToolById(id) {
  const tool = await prisma.tool_master.findFirst({
    where: {
      id,
      is_deleted: false
    },
    include: {
      _count: {
        select: {
          checklists: true
        }
      }
    }
  });

  if (!tool) {
    const error = new Error("Tool not found");
    error.statusCode = 404;
    throw error;
  }

  return mapTool(tool);
}

export async function createTool(payload, userId = null) {
  const existingTool = await prisma.tool_master.findUnique({
    where: { tool_name: payload.toolName }
  });

  if (existingTool && !existingTool.is_deleted) {
    const error = new Error("Tool name already exists");
    error.statusCode = 409;
    throw error;
  }

  const tool = await prisma.tool_master.upsert({
    where: {
      tool_name: payload.toolName
    },
    update: {
      tool_name: payload.toolName,
      description: payload.description || null,
      risk_level: payload.riskLevel,
      is_active: payload.isActive ?? true,
      is_deleted: false
    },
    create: {
      tool_name: payload.toolName,
      description: payload.description || null,
      risk_level: payload.riskLevel,
      is_active: payload.isActive ?? true
    },
    include: {
      _count: {
        select: {
          checklists: true
        }
      }
    }
  });

  await createAuditTrailLog({
    userId,
    action: "TOOL_CREATED",
    entity: "TOOL_MASTER",
    entityId: tool.id,
    description: `Tool ${tool.tool_name} created with risk level ${tool.risk_level}`
  });

  return mapTool(tool);
}

export async function updateTool(id, payload, userId = null) {
  await getToolById(id);

  const duplicateTool = await prisma.tool_master.findFirst({
    where: {
      tool_name: payload.toolName,
      is_deleted: false,
      NOT: {
        id
      }
    }
  });

  if (duplicateTool) {
    const error = new Error("Another tool already uses this name");
    error.statusCode = 409;
    throw error;
  }

  const tool = await prisma.tool_master.update({
    where: { id },
    data: {
      tool_name: payload.toolName,
      description: payload.description || null,
      risk_level: payload.riskLevel,
      is_active: payload.isActive ?? true
    },
    include: {
      _count: {
        select: {
          checklists: true
        }
      }
    }
  });

  await createAuditTrailLog({
    userId,
    action: "TOOL_UPDATED",
    entity: "TOOL_MASTER",
    entityId: tool.id,
    description: `Tool ${tool.tool_name} updated`
  });

  return mapTool(tool);
}

export async function deleteTool(id, userId = null) {
  const tool = await prisma.tool_master.findFirst({
    where: {
      id,
      is_deleted: false
    },
    include: {
      checklists: {
        where: {
          is_deleted: false
        },
        select: {
          id: true
        }
      }
    }
  });

  if (!tool) {
    const error = new Error("Tool not found");
    error.statusCode = 404;
    throw error;
  }

  if (tool.checklists.length > 0) {
    const error = new Error("Tool cannot be deleted while active checklist records exist");
    error.statusCode = 400;
    throw error;
  }

  await prisma.tool_master.update({
    where: { id },
    data: {
      is_deleted: true,
      is_active: false
    }
  });

  await createAuditTrailLog({
    userId,
    action: "TOOL_SOFT_DELETED",
    entity: "TOOL_MASTER",
    entityId: id,
    description: `Tool ${tool.tool_name} marked inactive and deleted`
  });

  return { id };
}
