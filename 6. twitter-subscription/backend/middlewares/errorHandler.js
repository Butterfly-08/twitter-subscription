const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({
      success: false,
      code: 'AUTH_002',
      message: 'Form tampered with (CSRF violation)'
    });
  }

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = { errorHandler };
