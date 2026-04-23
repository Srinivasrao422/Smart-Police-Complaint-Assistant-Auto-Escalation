const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const upload = require('../middleware/upload');

router.get('/me', auth, userController.getMe);
router.put('/update', auth, userController.updateUser);
router.post('/upload', auth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Image is required' });
  res.json({ url: `http://localhost:5000/uploads/${req.file.filename}` });
});
router.get('/', auth, authorize('admin'), userController.list);
router.patch('/:id/status', auth, authorize('admin'), userController.updateStatus);

module.exports = router;
