const { body, validationResult } = require('express-validator');

exports.registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().trim().isLength({ min: 6 }).withMessage('Phone is invalid'),
];

exports.loginRules = [
  body('email').trim().notEmpty().withMessage('Email or officer ID is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};
