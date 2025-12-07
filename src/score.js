// Scoring utility for SME Self-Assessment (minimal implementation)

function calculateThemeMean(scores) {
  if (!scores || scores.length === 0) return null;
  const sum = scores.reduce((a, b) => a + b, 0);
  return sum / scores.length;
}

function calculatePercentage(mean) {
  if (mean === null || mean === undefined) return null;
  return ((mean - 1) / 4) * 100;
}

function determinePerformanceBand(mean) {
  if (mean === null || mean === undefined) return null;
  if (mean <= 2.0) return 'needs_improvement';
  if (mean <= 3.0) return 'below_average';
  if (mean <= 4.0) return 'moderate';
  return 'strong';
}

function calculateScores({ responses, questions, themes }) {
  // responses: [{ questionId, score }]
  // questions: { [questionId]: { themeId, reverseScored } }
  // themes: { [themeId]: { weight } }

  const scoresByTheme = {};

  responses.forEach((r) => {
    const q = questions[r.questionId];
    if (!q) return;
    const rawScore = Number(r.score);
    const score = q.reverseScored ? (6 - rawScore) : rawScore;
    if (!scoresByTheme[q.themeId]) scoresByTheme[q.themeId] = [];
    scoresByTheme[q.themeId].push(score);
  });

  const themeScores = [];
  let weightedSum = 0;
  let totalWeight = 0;

  Object.keys(scoresByTheme).forEach((themeId) => {
    const arr = scoresByTheme[themeId];
    const mean = calculateThemeMean(arr);
    const percentage = calculatePercentage(mean);
    const weight = (themes[themeId] && themes[themeId].weight) ? themes[themeId].weight : 1;

    weightedSum += mean * weight;
    totalWeight += weight;

    themeScores.push({
      themeId,
      meanScore: Number(mean.toFixed(2)),
      percentage: Number(percentage.toFixed(2))
    });
  });

  const compositeMean = totalWeight ? (weightedSum / totalWeight) : null;
  const compositePercentage = compositeMean !== null ? Number(calculatePercentage(compositeMean).toFixed(2)) : null;

  return {
    themeScores,
    summary: {
      compositeMean: compositeMean !== null ? Number(compositeMean.toFixed(2)) : null,
      compositePercentage,
      performanceBand: determinePerformanceBand(compositeMean)
    }
  };
}

module.exports = {
  calculateThemeMean,
  calculatePercentage,
  determinePerformanceBand,
  calculateScores
};
