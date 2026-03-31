import path from "path";
import fs from "fs";
import { prisma } from "../../config/prisma.js";
import { calculateScoreSummary } from "./scoring.service.js";
import { analyzeScreenshotWithAi } from "./screenshot-analysis.service.js";
import { createAuditTrailLog } from "../audit-trail/audit-trail.service.js";
import { upsertObservationFromResponse } from "../observation/observation.service.js";

function mapAudit(audit) {
  return {
    id: audit.id,
    auditName: audit.audit_name,
    auditType: audit.audit_type,
    team: audit.team,
    toolScope: audit.tool
      ? {
          id: audit.tool.id,
          toolName: audit.tool.tool_name,
          riskLevel: audit.tool.risk_level
        }
      : undefined,
    auditor: audit.auditor
      ? {
          id: audit.auditor.id,
          fullName: audit.auditor.full_name,
          email: audit.auditor.email
        }
      : undefined,
    startDate: audit.start_date,
    endDate: audit.end_date,
    status: audit.status,
    responseCount: audit.responses?.length,
    createdAt: audit.created_at,
    updatedAt: audit.updated_at
  };
}

function mapResponse(response) {
  return {
    id: response.id,
    checklistId: response.checklist_id,
    responseStatus: response.response_status,
    comments: response.comments,
    evidenceFileName: response.evidence_file_name,
    evidenceFilePath: response.evidence_file_path,
    evidenceFileSize: response.evidence_file_size,
    updatedAt: response.updated_at
  };
}

async function ensureAuditEditable(auditId) {
  const audit = await prisma.audit_master.findFirst({
    where: {
      id: auditId,
      is_deleted: false
    },
    include: {
      tool: true,
      auditor: true
    }
  });

  if (!audit) {
    const error = new Error("Audit not found");
    error.statusCode = 404;
    throw error;
  }

  return audit;
}

async function ensureTool(toolId) {
  const tool = await prisma.tool_master.findFirst({
    where: {
      id: toolId,
      is_deleted: false
    }
  });

  if (!tool) {
    const error = new Error("Selected tool scope is unavailable");
    error.statusCode = 400;
    throw error;
  }

  return tool;
}

async function ensureAuditor(auditorId) {
  const user = await prisma.user_master.findFirst({
    where: {
      id: auditorId,
      is_deleted: false,
      is_active: true,
      role: {
        role_code: {
          in: ["ADMIN", "AUDITOR"]
        }
      }
    },
    include: {
      role: true
    }
  });

  if (!user) {
    const error = new Error("Assigned auditor must be an active Admin or Auditor");
    error.statusCode = 400;
    throw error;
  }

  return user;
}

export async function listAuditMeta() {
  const [tools, auditors] = await Promise.all([
    prisma.tool_master.findMany({
      where: {
        is_deleted: false,
        is_active: true
      },
      orderBy: {
        tool_name: "asc"
      }
    }),
    prisma.user_master.findMany({
      where: {
        is_deleted: false,
        is_active: true,
        role: {
          role_code: {
            in: ["ADMIN", "AUDITOR"]
          }
        }
      },
      include: {
        role: true
      },
      orderBy: {
        full_name: "asc"
      }
    })
  ]);

  return {
    tools: tools.map((tool) => ({
      id: tool.id,
      toolName: tool.tool_name,
      riskLevel: tool.risk_level
    })),
    auditors: auditors.map((auditor) => ({
      id: auditor.id,
      fullName: auditor.full_name,
      email: auditor.email,
      roleCode: auditor.role.role_code
    }))
  };
}

export async function createAudit(payload, user) {
  const startDate = new Date(payload.startDate);
  const endDate = new Date(payload.endDate);

  if (endDate < startDate) {
    const error = new Error("End date cannot be earlier than start date");
    error.statusCode = 400;
    throw error;
  }

  await Promise.all([ensureTool(Number(payload.toolId)), ensureAuditor(Number(payload.auditorId))]);

  const audit = await prisma.audit_master.create({
    data: {
      audit_name: payload.auditName,
      audit_type: payload.auditType,
      team: payload.team,
      tool_id: Number(payload.toolId),
      auditor_id: Number(payload.auditorId),
      start_date: startDate,
      end_date: endDate,
      status: payload.status || "PLANNED"
    },
    include: {
      tool: true,
      auditor: true,
      responses: true
    }
  });

  await createAuditTrailLog({
    userId: user?.id || audit.auditor_id,
    action: "AUDIT_CREATED",
    entity: "AUDIT_MASTER",
    entityId: audit.id,
    description: `Audit ${audit.audit_name} created for tool ${audit.tool.tool_name}`
  });

  return mapAudit(audit);
}

export async function listAudits(user) {
  const where = {
    is_deleted: false
  };

  if (user.role.roleCode === "AUDITOR") {
    where.auditor_id = user.id;
  }

  const audits = await prisma.audit_master.findMany({
    where,
    include: {
      tool: true,
      auditor: true,
      responses: true
    },
    orderBy: {
      created_at: "desc"
    }
  });

  const results = await Promise.all(
    audits.map(async (audit) => {
      const checklistItems = await prisma.checklist_master.findMany({
        where: {
          tool_id: audit.tool_id,
          is_deleted: false,
          is_active: true
        }
      });

      const responseByChecklistId = new Map(
        audit.responses.map((response) => [response.checklist_id, response])
      );

      const scoredChecklistItems = checklistItems.map((item) => ({
        id: item.id,
        weight: Number(item.weight),
        response: responseByChecklistId.has(item.id)
          ? mapResponse(responseByChecklistId.get(item.id))
          : null
      }));

      const observationCount = await prisma.audit_observation.count({
        where: {
          audit_id: audit.id,
          is_deleted: false
        }
      });

      return {
        ...mapAudit(audit),
        scoreSummary: calculateScoreSummary(scoredChecklistItems),
        observationCount
      };
    })
  );

  return results;
}

export async function getAuditById(id, user) {
  const where = {
    id,
    is_deleted: false
  };

  if (user.role.roleCode === "AUDITOR") {
    where.auditor_id = user.id;
  }

  const audit = await prisma.audit_master.findFirst({
    where,
    include: {
      tool: true,
      auditor: true,
      responses: {
        include: {
          checklist: true
        }
      }
    }
  });

  if (!audit) {
    const error = new Error("Audit not found");
    error.statusCode = 404;
    throw error;
  }

  const checklistItems = await prisma.checklist_master.findMany({
    where: {
      tool_id: audit.tool_id,
      is_deleted: false,
      is_active: true
    },
    orderBy: [
      { severity: "desc" },
      { parameter_name: "asc" }
    ]
  });

  const responseByChecklistId = new Map(
    audit.responses.map((response) => [response.checklist_id, response])
  );

  const detailedChecklistItems = checklistItems.map((item) => ({
    id: item.id,
    parameterName: item.parameter_name,
    description: item.description,
    severity: item.severity,
    weight: Number(item.weight),
    evidenceRequired: item.evidence_required,
    response: responseByChecklistId.has(item.id)
      ? mapResponse(responseByChecklistId.get(item.id))
      : null
  }));

  return {
    ...mapAudit(audit),
    checklistItems: detailedChecklistItems,
    scoreSummary: calculateScoreSummary(detailedChecklistItems),
    observationCount: await prisma.audit_observation.count({
      where: {
        audit_id: audit.id,
        is_deleted: false
      }
    })
  };
}

export async function saveAuditResponse(auditId, payload, file, user) {
  const audit = await getAuditById(auditId, user);

  const checklist = audit.checklistItems.find(
    (item) => item.id === Number(payload.checklistId)
  );

  if (!checklist) {
    const error = new Error("Checklist item does not belong to this audit scope");
    error.statusCode = 400;
    throw error;
  }

  if (checklist.evidenceRequired && !file && !checklist.response?.evidenceFilePath) {
    const error = new Error("Evidence file is required for this checklist item");
    error.statusCode = 400;
    throw error;
  }

  const relativePath = file
    ? `/uploads/audit-evidence/${path.basename(file.path)}`
    : checklist.response?.evidenceFilePath || null;

  const response = await prisma.audit_response.upsert({
    where: {
      audit_id_checklist_id: {
        audit_id: auditId,
        checklist_id: Number(payload.checklistId)
      }
    },
    update: {
      response_status: payload.responseStatus,
      comments: payload.comments || null,
      evidence_file_name: file ? file.originalname : checklist.response?.evidenceFileName || null,
      evidence_file_path: relativePath,
      evidence_file_size: file ? file.size : checklist.response?.evidenceFileSize || null
    },
    create: {
      audit_id: auditId,
      checklist_id: Number(payload.checklistId),
      response_status: payload.responseStatus,
      comments: payload.comments || null,
      evidence_file_name: file ? file.originalname : null,
      evidence_file_path: relativePath,
      evidence_file_size: file ? file.size : null
    }
  });

  await upsertObservationFromResponse({
    auditId,
    checklist,
    responseStatus: payload.responseStatus,
    comments: payload.comments,
    observationTitle: payload.observationTitle,
    observationDescription: payload.observationDescription,
    observationSeverity: payload.observationSeverity,
    observationRecommendation: payload.observationRecommendation
  });

  await prisma.audit_master.update({
    where: { id: auditId },
    data: {
      status: audit.status === "PLANNED" ? "IN_PROGRESS" : audit.status
    }
  });

  await createAuditTrailLog({
    userId: user.id,
    action: "AUDIT_RESPONSE_SAVED",
    entity: "AUDIT_RESPONSE",
    entityId: response.id,
    description: `Response ${payload.responseStatus} saved for checklist ${checklist.parameterName} in audit ${audit.auditName}`
  });

  return mapResponse(response);
}

export async function analyzeAuditScreenshot(auditId, checklistId, file, user) {
  const audit = await getAuditById(auditId, user);
  const checklist = audit.checklistItems.find((item) => item.id === Number(checklistId));

  if (!checklist) {
    const error = new Error("Checklist item does not belong to this audit scope");
    error.statusCode = 400;
    throw error;
  }

  let analysisFilePath = file?.path || null;

  if (!analysisFilePath && checklist.response?.evidenceFilePath) {
    analysisFilePath = path.resolve(
      "e:\\AITOOLAUDIT\\backend",
      `.${checklist.response.evidenceFilePath}`
    );
  }

  if (!analysisFilePath || !fs.existsSync(analysisFilePath)) {
    const error = new Error("Upload a screenshot or use an existing saved evidence file for analysis");
    error.statusCode = 400;
    throw error;
  }

  const analysis = await analyzeScreenshotWithAi({
    filePath: analysisFilePath,
    toolName: audit.toolScope.toolName,
    parameterName: checklist.parameterName,
    parameterDescription: checklist.description,
    severity: checklist.severity
  });

  await createAuditTrailLog({
    userId: user.id,
    action: "SCREENSHOT_ANALYZED",
    entity: "AUDIT_RESPONSE",
    entityId: auditId,
    description: `Screenshot analyzed for checklist ${checklist.parameterName} in audit ${audit.auditName}`
  });

  return analysis;
}

export async function updateAuditStatus(id, status, user) {
  await getAuditById(id, user);

  const updated = await prisma.audit_master.update({
    where: { id },
    data: { status },
    include: {
      tool: true,
      auditor: true,
      responses: true
    }
  });

  await createAuditTrailLog({
    userId: user.id,
    action: "AUDIT_STATUS_UPDATED",
    entity: "AUDIT_MASTER",
    entityId: updated.id,
    description: `Audit ${updated.audit_name} status changed to ${status}`
  });

  return mapAudit(updated);
}
