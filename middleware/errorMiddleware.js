const errorMiddleware = (err, req, res, next) => {
  console.error('========================================');
  console.error('❌ SERVER ERROR');
  console.error('Method:', req.method);
  console.error('URL:', req.originalUrl);
  console.error('Message:', err.message);
  console.error('========================================');

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  /*
  |--------------------------------------------------------------------------
  | Mongoose Validation Error
  |--------------------------------------------------------------------------
  */

  if (err.name === 'ValidationError') {
    statusCode = 400;

    const errors = Object.values(err.errors).map((error) => ({
      field: error.path,
      message: error.message,
    }));

    return res.status(statusCode).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Mongoose Cast Error
  |--------------------------------------------------------------------------
  */

  if (err.name === 'CastError') {
    statusCode = 400;

    return res.status(statusCode).json({
      success: false,
      message: `Invalid ${err.path}: ${err.value}`,
    });
  }

  /*
  |--------------------------------------------------------------------------
  | MongoDB Duplicate Key Error
  |--------------------------------------------------------------------------
  */

  if (err.code === 11000) {
    statusCode = 409;

    const duplicateField = Object.keys(err.keyValue || {})[0];

    return res.status(statusCode).json({
      success: false,
      message: duplicateField
        ? `${duplicateField} already exists`
        : 'Duplicate data already exists',
    });
  }

  /*
  |--------------------------------------------------------------------------
  | JSON Parsing Error
  |--------------------------------------------------------------------------
  */

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON format',
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Default Error Response
  |--------------------------------------------------------------------------
  */

  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && {
      error: err.name,
    }),
  });
};

module.exports = errorMiddleware;