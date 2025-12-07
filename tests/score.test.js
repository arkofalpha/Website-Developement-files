const { calculateThemeMean, calculatePercentage, calculateScores } = require('../src/score');

test('calculateThemeMean returns correct mean', () => {
  expect(calculateThemeMean([5,5,5])).toBeCloseTo(5.0, 5);
  expect(calculateThemeMean([1,3,5])).toBeCloseTo(3.0, 5);
});

test('calculatePercentage maps mean to percent', () => {
  expect(calculatePercentage(5)).toBeCloseTo(100.0, 5);
  expect(calculatePercentage(1)).toBeCloseTo(0.0, 5);
  expect(calculatePercentage(3)).toBeCloseTo(50.0, 5);
});

test('calculateScores produces expected summary for full responses', () => {
  const responses = [
    { questionId: 'q1', score: 5 },
    { questionId: 'q2', score: 5 },
    { questionId: 'q3', score: 3 }
  ];
  const questions = {
    q1: { themeId: 't1', reverseScored: false },
    q2: { themeId: 't1', reverseScored: false },
    q3: { themeId: 't2', reverseScored: false }
  };
  const themes = {
    t1: { weight: 1 },
    t2: { weight: 1 }
  };

  const { summary, themeScores } = calculateScores({ responses, questions, themes });
  // t1 mean = (5+5)/2 = 5 -> percentage 100
  const t1 = themeScores.find(t => t.themeId === 't1');
  expect(t1.meanScore).toBeCloseTo(5.0, 2);
  expect(t1.percentage).toBeCloseTo(100.0, 2);

  // composite mean = (5 + 3) / 2 = 4 -> percentage 75
  expect(summary.compositeMean).toBeCloseTo(4.0, 2);
  expect(summary.compositePercentage).toBeCloseTo(75.0, 2);
  expect(summary.performanceBand).toBe('moderate');
});
