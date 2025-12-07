import request from 'supertest';
import app from '../server.js';
import pool from '../config/database.js';

describe('API Integration Tests', () => {
  let authToken;
  let userId;
  let businessProfileId;
  let assessmentId;

  beforeAll(async () => {
    // Create a test user
    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `test${Date.now()}@example.com`,
        password: 'Test1234!@#$',
        fullName: 'Test User',
      });

    authToken = registerResponse.body.token;
    userId = registerResponse.body.id;

    // Create business profile
    const profileResponse = await request(app)
      .post('/api/v1/business-profiles')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        businessName: 'Test Business',
        sector: 'Technology',
        country: 'USA',
        city: 'New York',
        employeeCount: 10,
      });

    businessProfileId = profileResponse.body.id;
  });

  afterAll(async () => {
    // Cleanup test data
    if (userId) {
      await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    }
    await pool.end();
  });

  describe('Authentication', () => {
    test('POST /api/v1/auth/register - should create new user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `newuser${Date.now()}@example.com`,
          password: 'Test1234!@#$',
          fullName: 'New User',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('token');
    });

    test('POST /api/v1/auth/login - should login user', async () => {
      // First register
      const email = `login${Date.now()}@example.com`;
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email,
          password: 'Test1234!@#$',
          fullName: 'Login User',
        });

      // Then login
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email,
          password: 'Test1234!@#$',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
    });

    test('GET /api/v1/auth/me - should get current user', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email');
    });
  });

  describe('Assessments', () => {
    test('POST /api/v1/assessments - should create assessment', async () => {
      const response = await request(app)
        .post('/api/v1/assessments')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('themes');
      expect(Array.isArray(response.body.themes)).toBe(true);

      assessmentId = response.body.id;
    });

    test('GET /api/v1/assessments - should list assessments', async () => {
      const response = await request(app)
        .get('/api/v1/assessments')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('PUT /api/v1/assessments/:id/responses - should save responses', async () => {
      // First get questions
      const assessmentResponse = await request(app)
        .get(`/api/v1/assessments/${assessmentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      const questions = assessmentResponse.body.themes
        .flatMap(theme => theme.questions)
        .slice(0, 2); // Just test with 2 questions

      const responses = questions.map(q => ({
        questionId: q.id,
        score: 3,
      }));

      const response = await request(app)
        .put(`/api/v1/assessments/${assessmentId}/responses`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ responses });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('completedResponses');
    });
  });
});

