const request = require('supertest');
const app = require('../src/app');

describe('Assessments integration', () => {
  it('creates an assessment, submits responses and gets results', async () => {
    // Create assessment
    const createRes = await request(app).post('/api/assessments').send({ businessProfileId: 'bp1' }).expect(201);
    const assessmentId = createRes.body.id;
    expect(createRes.body.themes.length).toBeGreaterThan(0);

    // Submit responses (complete all questions)
    const responses = [
      { questionId: 'q1', score: 5 },
      { questionId: 'q2', score: 5 },
      { questionId: 'q3', score: 3 }
    ];

    const putRes = await request(app).put(`/api/assessments/${assessmentId}/responses`).send({ responses }).expect(200);
    expect(putRes.body.completedResponses).toBe(3);

    // Submit assessment
    const submitRes = await request(app).post(`/api/assessments/${assessmentId}/submit`).expect(200);
    expect(submitRes.body.status).toBe('completed');
    expect(submitRes.body.summary).toHaveProperty('compositeMean');
  });
});
