import express from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { calculateScores } from '../utils/scoring.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/v1/assessments
 */
router.post('/', async (req, res, next) => {
  try {
    // Get user's business profile
    const profileResult = await pool.query(
      'SELECT id FROM business_profiles WHERE user_id = $1 AND deleted_at IS NULL',
      [req.user.id]
    );

    if (profileResult.rows.length === 0) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Business profile required before creating assessment',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const businessProfileId = profileResult.rows[0].id;

    // Create assessment
    const assessmentResult = await pool.query(
      `INSERT INTO assessments (user_id, business_profile_id, created_by)
       VALUES ($1, $2, $3)
       RETURNING id, status, started_at`,
      [req.user.id, businessProfileId, req.user.id]
    );

    const assessment = assessmentResult.rows[0];

    // Get themes with questions
    const themesResult = await pool.query(
      `SELECT t.id, t.name, t.description, t.order_index,
              q.id as question_id, q.text, q.help_text, q.order_index as question_order
       FROM themes t
       LEFT JOIN questions q ON t.id = q.theme_id AND q.is_active = true
       WHERE t.is_active = true
       ORDER BY t.order_index, q.order_index`
    );

    // Group questions by theme
    const themesMap = new Map();
    themesResult.rows.forEach((row) => {
      if (!themesMap.has(row.id)) {
        themesMap.set(row.id, {
          id: row.id,
          name: row.name,
          description: row.description,
          questions: [],
        });
      }
      if (row.question_id) {
        themesMap.get(row.id).questions.push({
          id: row.question_id,
          text: row.text,
          helpText: row.help_text,
        });
      }
    });

    const themes = Array.from(themesMap.values());

    res.status(201).json({
      id: assessment.id,
      status: assessment.status,
      startedAt: assessment.started_at,
      themes,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/assessments
 */
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status;

    let query = `
      SELECT a.id, a.status, a.started_at, a.completed_at,
             asum.composite_mean, asum.composite_percentage, asum.performance_band
      FROM assessments a
      LEFT JOIN assessment_summaries asum ON a.id = asum.assessment_id
      WHERE a.user_id = $1 AND a.deleted_at IS NULL
    `;
    const params = [req.user.id];

    if (status) {
      query += ' AND a.status = $2';
      params.push(status);
    }

    query += ' ORDER BY a.started_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM assessments WHERE user_id = $1 AND deleted_at IS NULL';
    const countParams = [req.user.id];
    if (status) {
      countQuery += ' AND status = $2';
      countParams.push(status);
    }
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      data: result.rows.map((row) => ({
        id: row.id,
        status: row.status,
        startedAt: row.started_at,
        completedAt: row.completed_at,
        summary: row.composite_mean ? {
          compositeMean: parseFloat(row.composite_mean),
          compositePercentage: parseFloat(row.composite_percentage),
          performanceBand: row.performance_band,
        } : null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/assessments/:id
 */
router.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT a.id, a.status, a.started_at, a.completed_at,
              bp.business_name, bp.sector
       FROM assessments a
       JOIN business_profiles bp ON a.business_profile_id = bp.id
       WHERE a.id = $1 AND a.user_id = $2 AND a.deleted_at IS NULL`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Assessment not found',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const assessment = result.rows[0];

    // Get themes with questions
    const themesResult = await pool.query(
      `SELECT t.id, t.name, t.description,
              q.id as question_id, q.text, q.help_text
       FROM themes t
       LEFT JOIN questions q ON t.id = q.theme_id AND q.is_active = true
       WHERE t.is_active = true
       ORDER BY t.order_index, q.order_index`
    );

    // Group questions by theme
    const themesMap = new Map();
    themesResult.rows.forEach((row) => {
      if (!themesMap.has(row.id)) {
        themesMap.set(row.id, {
          id: row.id,
          name: row.name,
          description: row.description,
          questions: [],
        });
      }
      if (row.question_id) {
        themesMap.get(row.id).questions.push({
          id: row.question_id,
          text: row.text,
          helpText: row.help_text,
        });
      }
    });

    res.json({
      id: assessment.id,
      status: assessment.status,
      startedAt: assessment.started_at,
      completedAt: assessment.completed_at,
      businessProfile: {
        id: assessment.business_profile_id,
        name: assessment.business_name,
        sector: assessment.sector,
      },
      themes: Array.from(themesMap.values()),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/assessments/:id/responses
 */
router.put(
  '/:id/responses',
  [
    body('responses').isArray().notEmpty(),
    body('responses.*.questionId').isUUID(),
    body('responses.*.score').isInt({ min: 1, max: 5 }),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array(),
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Verify assessment belongs to user
      const assessmentResult = await pool.query(
        'SELECT id, status FROM assessments WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
        [req.params.id, req.user.id]
      );

      if (assessmentResult.rows.length === 0) {
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Assessment not found',
            timestamp: new Date().toISOString(),
          },
        });
      }

      const { responses } = req.body;

      // Upsert responses
      for (const response of responses) {
        await pool.query(
          `INSERT INTO responses (assessment_id, question_id, score, comment)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (assessment_id, question_id)
           DO UPDATE SET score = $3, comment = $4, updated_at = CURRENT_TIMESTAMP`,
          [
            req.params.id,
            response.questionId,
            response.score,
            response.comment || null,
          ]
        );
      }

      // Update assessment status
      await pool.query(
        'UPDATE assessments SET status = $1, updated_by = $2 WHERE id = $3',
        ['in_progress', req.user.id, req.params.id]
      );

      // Get response count
      const countResult = await pool.query(
        'SELECT COUNT(*) FROM responses WHERE assessment_id = $1',
        [req.params.id]
      );
      const completedResponses = parseInt(countResult.rows[0].count);

      // Get total questions
      const totalResult = await pool.query('SELECT COUNT(*) FROM questions WHERE is_active = true');
      const totalQuestions = parseInt(totalResult.rows[0].count);

      res.json({
        id: req.params.id,
        status: 'in_progress',
        completedResponses,
        totalQuestions,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/assessments/:id/submit
 */
router.post('/:id/submit', async (req, res, next) => {
  try {
    // Verify assessment belongs to user
    const assessmentResult = await pool.query(
      'SELECT id, status FROM assessments WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
      [req.params.id, req.user.id]
    );

    if (assessmentResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Assessment not found',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Get all responses
    const responsesResult = await pool.query(
      'SELECT question_id, score FROM responses WHERE assessment_id = $1',
      [req.params.id]
    );

    // Get all questions
    const questionsResult = await pool.query(
      'SELECT id, theme_id, reverse_scored FROM questions WHERE is_active = true'
    );

    // Get all themes
    const themesResult = await pool.query(
      'SELECT id, weight FROM themes WHERE is_active = true'
    );

    // Check if all questions answered
    const totalQuestions = questionsResult.rows.length;
    if (responsesResult.rows.length < totalQuestions) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Incomplete assessment',
          details: [{
            field: 'responses',
            message: `Missing ${totalQuestions - responsesResult.rows.length} responses`,
          }],
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Calculate scores
    const { themeScores, summary } = calculateScores(
      responsesResult.rows,
      questionsResult.rows,
      themesResult.rows
    );

    // Save scores in transaction
    await pool.query('BEGIN');

    try {
      // Save theme scores
      for (const themeScore of themeScores) {
        await pool.query(
          `INSERT INTO theme_scores (assessment_id, theme_id, mean_score, percentage)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (assessment_id, theme_id)
           DO UPDATE SET mean_score = $3, percentage = $4`,
          [
            req.params.id,
            themeScore.theme_id,
            themeScore.mean_score,
            themeScore.percentage,
          ]
        );
      }

      // Save assessment summary
      await pool.query(
        `INSERT INTO assessment_summaries (assessment_id, composite_mean, composite_percentage, performance_band)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (assessment_id)
         DO UPDATE SET composite_mean = $2, composite_percentage = $3, performance_band = $4`,
        [
          req.params.id,
          summary.composite_mean,
          summary.composite_percentage,
          summary.performance_band,
        ]
      );

      // Update assessment status
      await pool.query(
        'UPDATE assessments SET status = $1, completed_at = CURRENT_TIMESTAMP, updated_by = $2 WHERE id = $3',
        ['completed', req.user.id, req.params.id]
      );

      await pool.query('COMMIT');

      // Get theme names for response
      const themeNamesResult = await pool.query(
        'SELECT id, name FROM themes WHERE id = ANY($1)',
        [themeScores.map(ts => ts.theme_id)]
      );
      const themeNamesMap = new Map(themeNamesResult.rows.map(t => [t.id, t.name]));

      res.json({
        id: req.params.id,
        status: 'completed',
        completedAt: new Date().toISOString(),
        summary: {
          compositeMean: summary.composite_mean,
          compositePercentage: summary.composite_percentage,
          performanceBand: summary.performance_band,
        },
        themeScores: themeScores.map(ts => ({
          themeId: ts.theme_id,
          themeName: themeNamesMap.get(ts.theme_id),
          meanScore: ts.mean_score,
          percentage: ts.percentage,
        })),
      });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/assessments/:id/results
 */
router.get('/:id/results', async (req, res, next) => {
  try {
    // Verify assessment belongs to user and is completed
    const assessmentResult = await pool.query(
      `SELECT a.id, a.completed_at, bp.business_name, bp.sector
       FROM assessments a
       JOIN business_profiles bp ON a.business_profile_id = bp.id
       WHERE a.id = $1 AND a.user_id = $2 AND a.status = 'completed' AND a.deleted_at IS NULL`,
      [req.params.id, req.user.id]
    );

    if (assessmentResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Assessment not found or not completed',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const assessment = assessmentResult.rows[0];

    // Get summary
    const summaryResult = await pool.query(
      'SELECT composite_mean, composite_percentage, performance_band FROM assessment_summaries WHERE assessment_id = $1',
      [req.params.id]
    );

    // Get theme scores
    const themeScoresResult = await pool.query(
      `SELECT ts.theme_id, ts.mean_score, ts.percentage, t.name as theme_name
       FROM theme_scores ts
       JOIN themes t ON ts.theme_id = t.id
       WHERE ts.assessment_id = $1
       ORDER BY t.order_index`,
      [req.params.id]
    );

    // Get responses with question text
    const responsesResult = await pool.query(
      `SELECT r.question_id, r.score, r.comment, q.text as question_text, q.theme_id, t.name as theme_name
       FROM responses r
       JOIN questions q ON r.question_id = q.id
       JOIN themes t ON q.theme_id = t.id
       WHERE r.assessment_id = $1
       ORDER BY t.order_index, q.order_index`,
      [req.params.id]
    );

    // Group responses by theme
    const responsesByTheme = new Map();
    responsesResult.rows.forEach((row) => {
      if (!responsesByTheme.has(row.theme_id)) {
        responsesByTheme.set(row.theme_id, {
          themeId: row.theme_id,
          themeName: row.theme_name,
          responses: [],
        });
      }
      responsesByTheme.get(row.theme_id).responses.push({
        questionId: row.question_id,
        questionText: row.question_text,
        score: row.score,
        comment: row.comment,
      });
    });

    res.json({
      id: assessment.id,
      business: {
        name: assessment.business_name,
        sector: assessment.sector,
      },
      completedAt: assessment.completed_at,
      summary: summaryResult.rows[0] ? {
        compositeMean: parseFloat(summaryResult.rows[0].composite_mean),
        compositePercentage: parseFloat(summaryResult.rows[0].composite_percentage),
        performanceBand: summaryResult.rows[0].performance_band,
      } : null,
      themeScores: themeScoresResult.rows.map(row => ({
        themeId: row.theme_id,
        themeName: row.theme_name,
        meanScore: parseFloat(row.mean_score),
        percentage: parseFloat(row.percentage),
        responses: responsesByTheme.get(row.theme_id)?.responses || [],
      })),
    });
  } catch (error) {
    next(error);
  }
});

export default router;

