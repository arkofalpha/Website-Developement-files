/**
 * Calculate theme mean score
 */
export function calculateThemeMean(scores) {
  if (!scores || scores.length === 0) return null;
  const sum = scores.reduce((a, b) => a + b, 0);
  return sum / scores.length;
}

/**
 * Calculate percentage from mean (1-5 scale to 0-100%)
 */
export function calculatePercentage(mean) {
  if (mean === null || mean === undefined) return null;
  return ((mean - 1) / 4) * 100;
}

/**
 * Determine performance band based on mean score
 */
export function determinePerformanceBand(mean) {
  if (mean === null || mean === undefined) return null;
  if (mean <= 2.0) return 'needs_improvement';
  if (mean <= 3.0) return 'below_average';
  if (mean <= 4.0) return 'moderate';
  return 'strong';
}

/**
 * Calculate scores for an assessment
 * @param {Array} responses - Array of {questionId, score, comment}
 * @param {Array} questions - Array of question objects with themeId and reverseScored
 * @param {Array} themes - Array of theme objects with id and weight
 */
export function calculateScores(responses, questions, themes) {
  // Create lookup maps
  const questionMap = new Map(questions.map(q => [q.id, q]));
  const themeMap = new Map(themes.map(t => [t.id, t]));

  // Group responses by theme
  const scoresByTheme = new Map();

  responses.forEach((response) => {
    const question = questionMap.get(response.question_id);
    if (!question) return;

    const rawScore = Number(response.score);
    const score = question.reverse_scored ? (6 - rawScore) : rawScore;

    if (!scoresByTheme.has(question.theme_id)) {
      scoresByTheme.set(question.theme_id, []);
    }
    scoresByTheme.get(question.theme_id).push(score);
  });

  // Calculate theme scores
  const themeScores = [];
  let weightedSum = 0;
  let totalWeight = 0;

  scoresByTheme.forEach((scores, themeId) => {
    const mean = calculateThemeMean(scores);
    const percentage = calculatePercentage(mean);
    const theme = themeMap.get(themeId);
    const weight = theme?.weight || 1.0;

    weightedSum += mean * weight;
    totalWeight += weight;

    themeScores.push({
      theme_id: themeId,
      mean_score: Number(mean.toFixed(2)),
      percentage: Number(percentage.toFixed(2)),
    });
  });

  // Calculate composite scores
  const compositeMean = totalWeight > 0 ? weightedSum / totalWeight : null;
  const compositePercentage = compositeMean !== null 
    ? Number(calculatePercentage(compositeMean).toFixed(2)) 
    : null;
  const performanceBand = determinePerformanceBand(compositeMean);

  return {
    themeScores,
    summary: {
      composite_mean: compositeMean !== null ? Number(compositeMean.toFixed(2)) : null,
      composite_percentage: compositePercentage,
      performance_band: performanceBand,
    },
  };
}

