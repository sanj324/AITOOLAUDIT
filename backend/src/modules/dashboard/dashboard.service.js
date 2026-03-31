import { prisma } from "../../config/prisma.js";
import { calculateScoreSummary } from "../audit/scoring.service.js";

function formatMonthKey(dateValue) {
  const date = new Date(dateValue);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric"
  });
}

function buildRecentMonthKeys(count = 6) {
  const keys = [];
  const now = new Date();

  for (let index = count - 1; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    keys.push(formatMonthKey(date));
  }

  return keys;
}

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

  const monthKeys = buildRecentMonthKeys(6);
  const monthlyTrend = monthKeys.map((monthKey) => {
    const monthAudits = audits.filter(
      (audit) => formatMonthKey(audit.created_at) === monthKey
    );
    const completedAudits = audits.filter(
      (audit) =>
        audit.status === "COMPLETED" && formatMonthKey(audit.updated_at) === monthKey
    );
    const monthScores = monthAudits
      .map(
        (audit) =>
          auditScores.find((item) => item.auditId === audit.id)?.scoreSummary.auditScorePercent ?? 0
      )
      .filter((value) => Number.isFinite(value));

    return {
      month: formatMonthLabel(monthKey),
      createdAudits: monthAudits.length,
      completedAudits: completedAudits.length,
      compliancePercent:
        monthScores.length > 0
          ? Number(
              (
                monthScores.reduce((sum, value) => sum + value, 0) / monthScores.length
              ).toFixed(2)
            )
          : 0
    };
  });

  const teamScores = new Map();
  for (const audit of audits) {
    const teamKey = audit.team || "Unassigned";
    const score =
      auditScores.find((item) => item.auditId === audit.id)?.scoreSummary.auditScorePercent ?? 0;

    if (!teamScores.has(teamKey)) {
      teamScores.set(teamKey, {
        team: teamKey,
        totalAudits: 0,
        totalScore: 0
      });
    }

    const current = teamScores.get(teamKey);
    current.totalAudits += 1;
    current.totalScore += score;
  }

  const teamWiseCompliance = Array.from(teamScores.values())
    .map((item) => ({
      team: item.team,
      totalAudits: item.totalAudits,
      compliancePercent:
        item.totalAudits > 0
          ? Number((item.totalScore / item.totalAudits).toFixed(2))
          : 0
    }))
    .sort((left, right) => right.compliancePercent - left.compliancePercent);

  const today = new Date();
  const slaTracker = {
    onTimeCompleted: 0,
    breachedCompleted: 0,
    overdueOpen: 0,
    dueSoon: 0
  };

  for (const audit of audits) {
    const endDate = new Date(audit.end_date);
    const completionDate = new Date(audit.updated_at);
    const daysToDue = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

    if (audit.status === "COMPLETED") {
      if (completionDate <= endDate) {
        slaTracker.onTimeCompleted += 1;
      } else {
        slaTracker.breachedCompleted += 1;
      }
      continue;
    }

    if (endDate < today) {
      slaTracker.overdueOpen += 1;
    } else if (daysToDue <= 7) {
      slaTracker.dueSoon += 1;
    }
  }

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
      severityDistribution,
      monthlyTrend,
      teamWiseCompliance
    },
    summaries: {
      auditsByStatus,
      recentAudits,
      recentObservations,
      slaTracker
    }
  };
}
