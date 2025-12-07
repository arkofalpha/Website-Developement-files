import express from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../config/database.js';
import { authenticate, authorizeOwnerOrAdmin } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/v1/business-profiles
 */
router.post(
  '/',
  [
    body('businessName').trim().isLength({ min: 2 }),
    body('sector').trim().notEmpty(),
    body('country').trim().notEmpty(),
    body('city').trim().notEmpty(),
    body('employeeCount').isInt({ min: 0 }),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array().map(e => ({
              field: e.param,
              message: e.msg,
            })),
            timestamp: new Date().toISOString(),
          },
        });
      }

      const {
        businessName,
        sector,
        country,
        city,
        employeeCount,
        registrationType,
        contactEmail,
        contactPhone,
      } = req.body;

      // Check if user already has a business profile
      const existing = await pool.query(
        'SELECT id FROM business_profiles WHERE user_id = $1 AND deleted_at IS NULL',
        [req.user.id]
      );

      if (existing.rows.length > 0) {
        return res.status(409).json({
          error: {
            code: 'CONFLICT',
            message: 'Business profile already exists',
            timestamp: new Date().toISOString(),
          },
        });
      }

      const result = await pool.query(
        `INSERT INTO business_profiles 
         (user_id, business_name, sector, country, city, employee_count, registration_type, contact_email, contact_phone, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id, business_name, sector, country, city, employee_count, registration_type, contact_email, contact_phone, created_at`,
        [
          req.user.id,
          businessName,
          sector,
          country,
          city,
          employeeCount,
          registrationType || null,
          contactEmail || null,
          contactPhone || null,
          req.user.id,
        ]
      );

      res.status(201).json({
        id: result.rows[0].id,
        businessName: result.rows[0].business_name,
        sector: result.rows[0].sector,
        country: result.rows[0].country,
        city: result.rows[0].city,
        employeeCount: result.rows[0].employee_count,
        registrationType: result.rows[0].registration_type,
        contactEmail: result.rows[0].contact_email,
        contactPhone: result.rows[0].contact_phone,
        createdAt: result.rows[0].created_at,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/business-profiles/me
 */
router.get('/me', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, business_name, sector, country, city, employee_count, registration_type, contact_email, contact_phone, created_at, updated_at FROM business_profiles WHERE user_id = $1 AND deleted_at IS NULL',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Business profile not found',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const profile = result.rows[0];
    res.json({
      id: profile.id,
      businessName: profile.business_name,
      sector: profile.sector,
      country: profile.country,
      city: profile.city,
      employeeCount: profile.employee_count,
      registrationType: profile.registration_type,
      contactEmail: profile.contact_email,
      contactPhone: profile.contact_phone,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/business-profiles/me
 */
router.put(
  '/me',
  [
    body('businessName').optional().trim().isLength({ min: 2 }),
    body('employeeCount').optional().isInt({ min: 0 }),
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

      const updates = {};
      const allowedFields = [
        'businessName',
        'sector',
        'country',
        'city',
        'employeeCount',
        'registrationType',
        'contactEmail',
        'contactPhone',
      ];

      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          const dbField = field === 'businessName' ? 'business_name' :
                         field === 'employeeCount' ? 'employee_count' :
                         field === 'registrationType' ? 'registration_type' :
                         field === 'contactEmail' ? 'contact_email' :
                         field === 'contactPhone' ? 'contact_phone' :
                         field;
          updates[dbField] = req.body[field];
        }
      });

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'No fields to update',
            timestamp: new Date().toISOString(),
          },
        });
      }

      updates.updated_at = new Date();
      updates.updated_by = req.user.id;

      const setClause = Object.keys(updates)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ');

      const result = await pool.query(
        `UPDATE business_profiles 
         SET ${setClause}
         WHERE user_id = $1 AND deleted_at IS NULL
         RETURNING id, business_name, sector, country, city, employee_count, registration_type, contact_email, contact_phone, updated_at`,
        [req.user.id, ...Object.values(updates)]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Business profile not found',
            timestamp: new Date().toISOString(),
          },
        });
      }

      const profile = result.rows[0];
      res.json({
        id: profile.id,
        businessName: profile.business_name,
        sector: profile.sector,
        country: profile.country,
        city: profile.city,
        employeeCount: profile.employee_count,
        registrationType: profile.registration_type,
        contactEmail: profile.contact_email,
        contactPhone: profile.contact_phone,
        updatedAt: profile.updated_at,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

