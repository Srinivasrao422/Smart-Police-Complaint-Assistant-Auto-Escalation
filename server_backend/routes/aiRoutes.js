const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { suggestSections } = require('../controllers/aiController');

router.post('/suggest', auth, suggestSections);

module.exports = router;
