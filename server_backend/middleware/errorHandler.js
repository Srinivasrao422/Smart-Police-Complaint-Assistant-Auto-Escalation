module.exports = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = Number(err.status || err.statusCode) || 500;
  const message = err.message || 'Internal server error';
  const isProduction = process.env.NODE_ENV === 'production';

  const error = isProduction && statusCode >= 500
    ? 'Internal server error'
    : {
        name: err.name || 'Error',
        code: err.code || null,
        details: err.details || null,
        stack: err.stack || null,
      };

  const logPayload = {
    method: req.method,
    path: req.originalUrl,
    statusCode,
    message,
    name: err.name,
    code: err.code,
    stack: err.stack,
  };

  if (statusCode >= 500) {
    console.error('Unhandled request error', logPayload);
  } else {
    console.warn('Handled request error', logPayload);
  }

  return res.status(statusCode).json({
    success: false,
    message,
    error,
  });
};
