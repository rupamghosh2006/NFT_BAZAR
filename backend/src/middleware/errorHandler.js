function errorHandler(err, req, res, _next) {
  console.error(`[Error] ${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  const statusCode = err.statusCode || err.status || 500;
  const response = {
    success: false,
    error: {
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  };

  if (err.errors) {
    response.error.details = err.errors;
  }

  res.status(statusCode).json(response);
}

module.exports = errorHandler;
