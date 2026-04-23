// const { body, param, query, validationResult } = require('express-validator');

// exports.createRules = [
//   body('title').trim().notEmpty().withMessage('Title is required'),
//   body('description').trim().notEmpty().withMessage('Description is required'),
//   body('category').optional().trim(),
//   body('location').optional().trim(),
//   body('victim.fullName').optional().trim(),
//   body('victim.mobile').optional().trim(),
// ];

// exports.updateRules = [
//   param('id').isMongoId().withMessage('Invalid complaint id'),
//   body('title').optional().trim(),
//   body('description').optional().trim(),
//   body('category').optional().trim(),
//   body('location').optional().trim(),
// ];

// exports.assignRules = [
//   param('id').isMongoId().withMessage('Invalid complaint id'),
//   body('officerId').isMongoId().withMessage('Invalid officer id'),
// ];

// exports.listRules = [
//   query('page').optional().isInt({ min: 1 }).toInt(),
//   query('limit').optional().isInt({ min: 1 }).toInt(),
//   query('status').optional().isString(),
//   query('category').optional().isString(),
//   query('q').optional().isString(),
// ];

// exports.validate = (req, res, next) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
//   next();
// };






// const express = require('express');
// const router = express.Router();

// const complaintController = require('../controllers/complaintController');
// const auth = require('../middleware/auth');
// const authorize = require('../middleware/authorize');

// const {
//   createRules,
//   updateRules,
//   assignRules,
//   listRules,
//   validate
// } = require('../validators/complaintValidator');

// // ✅ SAFE: only use function that exists
// if (typeof complaintController.recent === "function") {
//   router.get('/recent', complaintController.recent);
// } else {
//   router.get('/recent', complaintController.list);
// }

// // Get my complaints
// router.get('/my', auth, complaintController.my);

// // List all complaints
// router.get('/', listRules, validate, complaintController.list);

// // Create complaint
// router.post('/', auth, createRules, validate, complaintController.create);

// // Get single complaint
// router.get('/:id', complaintController.get);

// // Update complaint
// router.patch('/:id', auth, updateRules, validate, complaintController.update);

// // Delete complaint
// router.delete('/:id', auth, complaintController.remove);

// // Assign complaint (admin only)
// router.patch(
//   '/:id/assign',
//   auth,
//   authorize('admin'),
//   assignRules,
//   validate,
//   complaintController.assign
// );

// module.exports = router;


const { body, validationResult } = require('express-validator');

// CREATE RULES
const createRules = [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
];

// UPDATE RULES
const updateRules = [
  body('title').optional(),
  body('description').optional(),
  body('status').optional().isIn(['pending', 'in-progress', 'resolved', 'escalated', 'closed']).withMessage('Invalid status'),
];

// ASSIGN RULES
const assignRules = [
  body('officerId').optional(),
  body('officerName').optional(),
  body('status').optional().isIn(['pending', 'in-progress', 'resolved', 'escalated']).withMessage('Invalid status')
];

// LIST RULES (SAFE EMPTY)
const listRules = [];

// ✅ FIXED VALIDATE FUNCTION
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({
      errors: errors.array()
    });
  }

  next(); // 🚨 MUST EXIST
};

module.exports = {
  createRules,
  updateRules,
  assignRules,
  listRules,
  validate
};
