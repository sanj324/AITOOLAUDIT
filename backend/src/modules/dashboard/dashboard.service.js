import { prisma } from "../../config/prisma.js";
import { calculateScoreSummary } from "../audit/scoring.service.js";

function buildChecklistScoreItems(checklists, responses) {
  const responseByChecklistId = new Map(
    responses.map((response) => [response.checklist_id, response])
  );

  return checklists.map((item) => ({
    id: item.id,
    weight: Number(item.weight),
    response: responseByChecklistId.has(item.id)
      ? {
          responseStatus: responseByChecklistId.get(item.id).response_status
        }
      : null
  }));
}

export async function getDashboardMetrics() {
  const [audits, tools, observations] = await Promise.all([
    prisma.audit_master.findMany({
      where: { is_deleted: false },
      include: {
        tool: true,
        auditor: true,
        responses: true
      },
      orderBy: {
        created_at: "desc"
      }
    }),
    prisma.tool_master.findMany({
      where: {
        is_deleted: false
      },
      orderBy: {
        tool_name: "asc"
      }
    }),
    prisma.audit_observation.findMany({
      where: {
        is_deleted: false
      },
      include: {
        audit: {
          include: {
            tool: true
          }
        },
        checklist: true
      },
      orderBy: {
        created_at: "desc"
      }
    })
  ]);

  const checklists = await prisma.checklist_master.findMany({
    where: {
      is_deleted: false,
      is_active: true
    }
  });

  const checklistByToolId = new Map();
  for (const checklist of checklists) {
    if (!checklistByToolId.has(checklist.tool_id)) {
      checklistByToolId.set(checklist.tool_id, []);
    }
    checklistByToolId.get(checklist.tool_id).push(checklist);
  }

  const auditScores = audits.map((audit) => {
    const toolChecklists = checklistByToolId.get(audit.tool_id) || [];
    return {
      auditId: audit.id,
      toolId: audit.tool_id,
      scoreSummary: calculateScoreSummary(
        buildChecklistScoreItems(toolChecklists, audit.responses)
      )
    };
  });

  const compliancePercent =
    auditScores.length > 0
      ? Number(
          (
            auditScores.reduce(
              (sum, item) => sum + item.scoreSummary.auditScorePercent,
              0
            ) / auditScores.length
          ).toFixed(2)
        )
      : 0;

  const toolWiseCompliance = tools.map((tool) => {
    const toolAudits = auditScores.filter((item) => item.toolId === tool.id);
    const scorePercent =
      toolAudits.length > 0
        ? Number(
            (
              toolAudits.reduce(
                (sum, item) => sum + item.scoreSummary.auditScorePercent,
                0
              ) / toolAudits.length
            ).toFixed(2)
          )
        : 0;

    return {
      toolName: tool.tool_name,
      compliancePercent: scorePercent
    };
  });

  const severityDistribution = ["LOW", "MEDIUM", "HIGH", "CRITICAL"].map(
    (severity) => ({
      severity,
      count: observations.filter(
        (observation) => observation.severity === severity
      ).length
    })
  );

  const openObservations = observations.filter(
    (item) => item.status !== "CLOSED"
  ).length;

  const auditsByStatus = ["PLANNED", "IN_PROGRESS", "REVIEW_PENDING", "COMPLETED"].map(
    (status) => ({
      status,
      count: audits.filter((audit) => audit.status === status).length
    })
  );

  const recentAudits = audits.slice(0, 5).map((audit) => {
    const scoreSummary =
      auditScores.find((item) => item.auditId === audit.id)?.scoreSummary ||
      calculateScoreSummary([]);

    return {
      id: audit.id,
      auditName: audit.audit_name,
      team: audit.team,
      status: audit.status,
      toolName: audit.tool?.tool_name || "Unknown",
      auditorName: audit.auditor?.full_name || "Unassigned",
      compliancePercent: scoreSummary.auditScorePercent,
      observationCount: observations.filter((item) => item.audit_id === audit.id).length,
      updatedAt: audit.updated_at
    };
  });

  const recentObservations = observations.slice(0, 5).map((observation) => ({
    id: observation.id,
    title: observation.title,
    severity: observation.severity,
    status: observation.status,
    auditName: observation.audit?.audit_name || "Audit",
    toolName: observation.audit?.tool?.tool_name || "Unknown",
    checklistName: observation.checklist?.parameter_name || "Checklist item",
    updatedAt: observation.updated_at
  }));

  return {
    kpis: {
      totalAudits: audits.length,
      completedAudits: audits.filter((audit) => audit.status === "COMPLETED").length,
      highRiskFindings: observations.filter((item) =>
        ["HIGH", "CRITICAL"].includes(item.severity)
      ).length,
      openObservations,
      compliancePercent
    },
    charts: {
      toolWiseCompliance,
      severityDistribution
    },
    summaries: {
      auditsByStatus,
      recentAudits,
      recentObservations
    }
  };
}
