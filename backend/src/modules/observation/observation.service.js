import { prisma } from "../../config/prisma.js";
import { createAuditTrailLog } from "../audit-trail/audit-trail.service.js";

function mapObservation(observation) {
  return {
    id: observation.id,
    auditId: observation.audit_id,
    checklistId: observation.checklist_id,
    title: observation.title,
    description: observation.description,
    severity: observation.severity,
    recommendation: observation.recommendation,
    status: observation.status,
    createdAt: observation.created_at,
    updatedAt: observation.updated_at,
    audit: observation.audit
      ? {
          id: observation.audit.id,
          auditName: observation.audit.audit_name,
          status: observation.audit.status
        }
      : undefined,
    checklist: observation.checklist
      ? {
          id: observation.checklist.id,
          parameterName: observation.checklist.parameter_name,
          toolId: observation.checklist.tool_id
        }
      : undefined,
    evidence: observation.response
      ? {
          fileName: observation.response.evidence_file_name,
          filePath: observation.response.evidence_file_path,
          fileSize: observation.response.evidence_file_size,
          comments: observation.response.comments
        }
      : null
  };
}

export async function upsertObservationFromResponse({
  auditId,
  checklist,
  responseStatus,
  comments,
  observationTitle,
  observationDescription,
  observationSeverity,
  observationRecommendation
}) {
  if (responseStatus !== "NON_COMPLIANT") {
    return null;
  }

  const title = observationTitle || `${checklist.parameterName} non-compliance`;
  const description =
    observationDescription ||
    comments ||
    checklist.description ||
    "Non-compliance identified during audit execution.";
  const severity = observationSeverity || checklist.severity;
  const recommendation =
    observationRecommendation ||
    `Implement corrective action for "${checklist.parameterName}" and provide supporting evidence for closure.`;

  const observation = await prisma.audit_observation.upsert({
    where: {
      audit_id_checklist_id: {
        audit_id: auditId,
        checklist_id: checklist.id
      }
    },
    update: {
      title,
      description,
      severity,
      recommendation,
      status: "OPEN",
      is_deleted: false
    },
    create: {
      audit_id: auditId,
      checklist_id: checklist.id,
      title,
      description,
      severity,
      recommendation,
      status: "OPEN"
    }
  });

  return observation;
}

export async function listObservations(user) {
  const where = {
    is_deleted: false
  };

  if (user.role.roleCode === "AUDITOR") {
    where.audit = {
      auditor_id: user.id
    };
  }

  const observations = await prisma.audit_observation.findMany({
    where,
    include: {
      audit: true,
      checklist: true
    },
    orderBy: {
      created_at: "desc"
    }
  });

  const responses = await prisma.audit_response.findMany({
    where: {
      audit_id: {
        in: observations.map((observation) => observation.audit_id)
      },
      checklist_id: {
        in: observations.map((observation) => observation.checklist_id)
      }
    }
  });

  const responseMap = new Map(
    responses.map((response) => [
      `${response.audit_id}-${response.checklist_id}`,
      response
    ])
  );

  return observations.map((observation) =>
    mapObservation({
      ...observation,
      response: responseMap.get(`${observation.audit_id}-${observation.checklist_id}`) || null
    })
  );
}

export async function updateObservationStatus(id, status, userId = null) {
  const existing = await prisma.audit_observation.findFirst({
    where: {
      id,
      is_deleted: false
    },
    include: {
      audit: true,
      checklist: true
    }
  });

  if (!existing) {
    const error = new Error("Observation not found");
    error.statusCode = 404;
    throw error;
  }

  const updated = await prisma.audit_observation.update({
    where: { id },
    data: { status },
    include: {
      audit: true,
      checklist: true
    }
  });

  const response = await prisma.audit_response.findUnique({
    where: {
      audit_id_checklist_id: {
        audit_id: updated.audit_id,
        checklist_id: updated.checklist_id
      }
    }
  });

  await createAuditTrailLog({
    userId,
    action: "OBSERVATION_STATUS_UPDATED",
    entity: "AUDIT_OBSERVATION",
    entityId: updated.id,
    description: `Observation ${updated.title} status changed to ${status}`
  });

  return mapObservation({
    ...updated,
    response
  });
}
