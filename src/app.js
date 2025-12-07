const express = require('express');
const bodyParser = require('body-parser');
const score = require('./score');

const app = express();
app.use(bodyParser.json());

// In-memory datastore (for sample integration tests only)
const themes = {
  't1': { name: 'Problem Identification', weight: 1 },
  't2': { name: 'Business Positioning', weight: 1 }
};

const questions = {
  'q1': { themeId: 't1', reverseScored: false, text: 'My business has a clear problem it\'s trying to solve.' },
  'q2': { themeId: 't1', reverseScored: false, text: 'The problem affects a large population.' },
  'q3': { themeId: 't2', reverseScored: false, text: 'My business targets end users directly (B2C).' }
};

let assessments = {};
let responsesStore = {};
let idCounter = 1;

// Create assessment
app.post('/api/assessments', (req, res) => {
  const id = `a${idCounter++}`;
  assessments[id] = { id, status: 'draft', businessProfileId: req.body.businessProfileId || null, createdAt: new Date().toISOString() };
  responsesStore[id] = [];

  // Build themes payload
  const themesPayload = Object.keys(themes).map((tid) => ({ id: tid, name: themes[tid].name, questions: Object.keys(questions).filter(qid => questions[qid].themeId === tid).map(qid => ({ id: qid, text: questions[qid].text })) }));

  res.status(201).json({ id, status: 'draft', startedAt: assessments[id].createdAt, themes: themesPayload });
});

// Add responses
app.put('/api/assessments/:id/responses', (req, res) => {
  const id = req.params.id;
  if (!assessments[id]) return res.status(404).json({ error: 'Assessment not found' });
  const incoming = req.body.responses || [];

  // Enforce unique responses per question in this sample
  incoming.forEach(r => {
    // remove existing for same question
    responsesStore[id] = responsesStore[id].filter(rr => rr.questionId !== r.questionId);
    responsesStore[id].push({ questionId: r.questionId, score: Number(r.score), comment: r.comment || null });
  });

  res.json({ id, status: 'in_progress', completedResponses: responsesStore[id].length, totalQuestions: Object.keys(questions).length });
});

// Submit assessment
app.post('/api/assessments/:id/submit', (req, res) => {
  const id = req.params.id;
  if (!assessments[id]) return res.status(404).json({ error: 'Assessment not found' });
  const stored = responsesStore[id] || [];
  // For sample, require all questions answered
  const totalQuestions = Object.keys(questions).length;
  if (stored.length < totalQuestions) return res.status(400).json({ error: 'Incomplete responses', missing: totalQuestions - stored.length });

  const { themeScores, summary } = score.calculateScores({ responses: stored, questions, themes });

  assessments[id].status = 'completed';
  assessments[id].completedAt = new Date().toISOString();

  res.json({ id, status: 'completed', completedAt: assessments[id].completedAt, summary, themeScores });
});

module.exports = app;

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Sample app listening on ${port}`));
}
