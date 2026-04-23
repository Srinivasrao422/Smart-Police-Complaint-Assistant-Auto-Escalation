const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaintController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const upload = require('../middleware/upload');
const { createRules, updateRules, assignRules, listRules, validate } = require('../validators/complaintValidator');

router.get('/recent', complaintController.recent || complaintController.list);
router.get('/my', auth, complaintController.my);
router.get('/receipt/:receiptId', auth, complaintController.getByReceipt);
router.get('/', auth, authorize('admin'), listRules, validate, complaintController.list);
router.post('/', auth, upload.array('files', 10), createRules, validate, complaintController.create);
router.post('/receipt/:receiptId/feedback', auth, complaintController.addFeedback);
router.get('/:id', auth, complaintController.get);
router.patch('/:id', auth, upload.array('files', 10), updateRules, validate, complaintController.update);
router.delete('/:id', auth, complaintController.remove);
router.patch('/:id/assign', auth, authorize('admin'), assignRules, validate, complaintController.assign);

module.exports = router;
