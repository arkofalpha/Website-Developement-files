import express from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../config/database.js';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  generateToken,
  validatePassword,
} from '../utils/auth.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/v1/auth/register
 */
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 10 }),
    body('fullName').trim().isLength({ min: 2 }),
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

      const { email, password, fullName } = req.body;

      // Validate password strength
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: passwordValidation.message,
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Check if user exists
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL',
        [email]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({
          error: {
            code: 'CONFLICT',
            message: 'Email already registered',
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Hash password
      const passwordHash = await hashPassword(password);
      const emailVerificationToken = generateToken();
      const emailVerificationExpires = new Date();
      emailVerificationExpires.setHours(emailVerificationExpires.getHours() + 24);

      // Create user
      const result = await pool.query(
        `INSERT INTO users (email, password_hash, full_name, email_verification_token, email_verification_expires)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, full_name, role, created_at`,
        [email, passwordHash, fullName, emailVerificationToken, emailVerificationExpires]
      );

      const user = result.rows[0];

      // TODO: Send verification email
      // await sendVerificationEmail(user.email, emailVerificationToken);

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      res.status(201).json({
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        token: accessToken,
        refreshToken: refreshToken,
        emailVerified: false,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/auth/login
 */
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
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

      const { email, password } = req.body;

      // Find user
      const result = await pool.query(
        'SELECT id, email, password_hash, full_name, role, is_active FROM users WHERE email = $1 AND deleted_at IS NULL',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid email or password',
            timestamp: new Date().toISOString(),
          },
        });
      }

      const user = result.rows[0];

      if (!user.is_active) {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'Account is deactivated',
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Verify password
      const isValid = await comparePassword(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid email or password',
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Update last login
      await pool.query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      res.json({
        token: accessToken,
        refreshToken: refreshToken,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/auth/refresh
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Refresh token required',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const decoded = verifyToken(refreshToken);

    if (!decoded || decoded.type !== 'refresh') {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid refresh token',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Get user
    const result = await pool.query(
      'SELECT id, email, role FROM users WHERE id = $1 AND deleted_at IS NULL AND is_active = true',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not found',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const user = result.rows[0];
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    res.json({
      token: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/auth/logout
 */
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    // In a production system, you would invalidate the refresh token here
    // For now, we just return success
    res.json({
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/auth/me
 */
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, email, full_name, role, created_at, last_login, email_verified FROM users WHERE id = $1 AND deleted_at IS NULL',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const user = result.rows[0];
    res.json({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      createdAt: user.created_at,
      lastLogin: user.last_login,
      emailVerified: user.email_verified,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

