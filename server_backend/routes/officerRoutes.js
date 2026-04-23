const express = require('express');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const officerController = require('../controllers/officerController');

const router = express.Router();

router.use(auth, authorize('officer'));

router.get('/dashboard', officerController.getDashboard);

module.exports = router;
