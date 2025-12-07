/**
 * Global error handler middleware
 */
export function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  // Database errors
  if (err.code === '23505') { // Unique violation
    return res.status(409).json({
      error: {
        code: 'CONFLICT',
        message: 'Resource already exists',
        details: [{ field: 'email', message: 'Email already registered' }],
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown',
      },
    });
  }

  if (err.code === '23503') { // Foreign key violation
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid reference',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown',
      },
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: err.errors || [],
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown',
      },
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid token',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown',
      },
    });
  }

  // Default error
  res.status(err.status || 500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'An error occurred' 
        : err.message,
      timestamp: new Date().toISOString(),
      requestId: req.id || 'unknown',
    },
  });
}

