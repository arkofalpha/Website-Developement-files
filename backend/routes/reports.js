import express from 'express';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { generatePDFReport } from '../utils/pdfGenerator.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
router.use(authenticate);

// Ensure reports directory exists
const reportsDir = path.join(__dirname, '../reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

/**
 * GET /api/v1/reports/:assessmentId/pdf
 * Generate and download PDF report
 */
router.get('/:assessmentId/pdf', async (req, res, next) => {
  try {
    const { assessmentId } = req.params;

    // Verify assessment belongs to user
    const assessmentResult = await pool.query(
      `SELECT a.id, a.completed_at, bp.business_name, bp.sector
       FROM assessments a
       JOIN business_profiles bp ON a.business_profile_id = bp.id
       WHERE a.id = $1 AND a.user_id = $2 AND a.status = 'completed' AND a.deleted_at IS NULL`,
      [assessmentId, req.user.id]
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
      [assessmentId]
    );

    if (summaryResult.rows.length === 0) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Assessment results not available',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Get theme scores
    const themeScoresResult = await pool.query(
      `SELECT ts.theme_id, ts.mean_score, ts.percentage, t.name as theme_name, ts.performance_band
       FROM theme_scores ts
       JOIN themes t ON ts.theme_id = t.id
       WHERE ts.assessment_id = $1
       ORDER BY t.order_index`,
      [assessmentId]
    );

    // Prepare data for PDF
    const pdfData = {
      business: {
        name: assessment.business_name,
        sector: assessment.sector,
      },
      summary: {
        compositeMean: parseFloat(summaryResult.rows[0].composite_mean),
        compositePercentage: parseFloat(summaryResult.rows[0].composite_percentage),
        performanceBand: summaryResult.rows[0].performance_band,
      },
      themeScores: themeScoresResult.rows.map(row => ({
        themeId: row.theme_id,
        themeName: row.theme_name,
        meanScore: parseFloat(row.mean_score),
        percentage: parseFloat(row.percentage),
        performanceBand: row.performance_band,
      })),
      completedAt: assessment.completed_at,
    };

    // Generate PDF
    const filename = `assessment-${assessmentId}-${Date.now()}.pdf`;
    const filePath = path.join(reportsDir, filename);

    await generatePDFReport(pdfData, filePath);

    // Save PDF record to database
    await pool.query(
      `INSERT INTO pdf_reports (assessment_id, file_path, file_size, expires_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT DO NOTHING`,
      [
        assessmentId,
        filePath,
        fs.statSync(filePath).size,
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      ]
    );

    // Send file
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="assessment-report-${assessmentId}.pdf"`);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    // Clean up file after sending (optional - or keep for caching)
    fileStream.on('end', () => {
      // Optionally delete file after 1 hour
      setTimeout(() => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }, 3600000);
    });
  } catch (error) {
    next(error);
  }
});

export default router;

