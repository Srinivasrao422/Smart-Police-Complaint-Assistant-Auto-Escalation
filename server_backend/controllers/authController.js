const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in environment');
}

const generateToken = (user) => {
  return jwt.sign({ id: user._id.toString(), email: user.email, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || '7d',
  });
};

const sanitizeUser = (userDoc) => {
  if (!userDoc) return null;
  const { _id, name, email, role, department, phone, address, profilePic, status, activeCases, createdAt, updatedAt } = userDoc;
  return { id: _id.toString(), name, email, role, department, phone, address, profilePic, status, activeCases, createdAt, updatedAt };
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Missing required fields' });
    const existing = await User.findOne({ email }).lean();
    if (existing) return res.status(409).json({ message: 'Email already registered' });
    const user = await User.create({ name, email, password, role });
    const token = generateToken(user);
    res.status(201).json({ user: sanitizeUser(user), token });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Missing required fields' });

    const lookupEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: lookupEmail }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const token = generateToken(user);
    const safeUser = await User.findById(user._id).lean();
    res.json({ user: sanitizeUser(safeUser), token });
  } catch (err) {
    err.status = err.status || 500;
    err.message = err.message || 'Login failed';
    throw err;
  }
};

exports.me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(sanitizeUser(user));
  } catch (err) {
    next(err);
  }
};
