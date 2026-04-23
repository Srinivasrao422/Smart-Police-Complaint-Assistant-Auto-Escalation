module.exports = function authorize(roles = []) {
  if (typeof roles === 'string') roles = [roles];
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (roles.length) {
      const role = req.user.role;
      const allowed = roles.some((expected) => expected === role || (expected === 'admin' && role === 'super-admin'));
      if (!allowed) return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
};
