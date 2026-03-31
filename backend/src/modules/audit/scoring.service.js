const responseScoreMap = {
  COMPLIANT: 2,
  PARTIAL: 1,
  NON_COMPLIANT: 0
};

export function calculateScoreSummary(checklistItems = []) {
  let achievedScore = 0;
  let maxPossibleScore = 0;
  let scoredItems = 0;

  for (const item of checklistItems) {
    const weight = Number(item.weight);
    const responseStatus = item.response?.responseStatus;

    if (!responseStatus || responseStatus === "NA") {
      continue;
    }

    scoredItems += 1;
    maxPossibleScore += 2 * weight;
    achievedScore += (responseScoreMap[responseStatus] ?? 0) * weight;
  }

  const auditScorePercent =
    maxPossibleScore > 0 ? Number(((achievedScore / maxPossibleScore) * 100).toFixed(2)) : 0;

  return {
    achievedScore: Number(achievedScore.toFixed(2)),
    maxPossibleScore: Number(maxPossibleScore.toFixed(2)),
    scoredItems,
    auditScorePercent,
    toolScore: {
      scorePercent: auditScorePercent
    }
  };
}
