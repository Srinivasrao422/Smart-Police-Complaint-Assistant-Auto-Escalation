const express = require('express');
const router = express.Router();
const { register, login, me } = require('../controllers/authController');
const auth = require('../middleware/auth');
const { registerRules, loginRules, validate } = require('../validators/authValidator');

router.post('/register', registerRules, validate, register);
router.post('/login', loginRules, validate, login);
router.get('/me', auth, me);

module.exports = router;
