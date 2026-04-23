const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const err = new Error('Unauthorized');
    err.status = 401;
    return next(err);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.id || !decoded?.role) {
      const err = new Error('Invalid token');
      err.status = 401;
      return next(err);
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
    return next();
  } catch (err) {
    err.status = 401;
    err.message = 'Invalid token';
    return next(err);
  }
};
