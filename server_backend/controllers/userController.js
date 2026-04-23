const User = require('../models/User');
const mongoose = require('mongoose');

const sanitizeUser = (user) => {
  if (!user) return null;
  const obj = typeof user.toObject === 'function' ? user.toObject() : { ...user };
  delete obj.password;
  return obj;
};

exports.list = async (req, res, next) => {
  try {
    const page = req.query.page ? parseInt(req.query.page, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 25;
    const skip = (page - 1) * limit;
    const filter = {};
    if (req.query.q) filter.$or = [ { name: { $regex: req.query.q, $options: 'i' } }, { email: { $regex: req.query.q, $options: 'i' } } ];
    const [items, total] = await Promise.all([
      User.find(filter).select('-password').skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);
    res.json({ items, total, page, limit });
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const allowedFields = ['name', 'email', 'phone', 'address', 'profilePic'];
    const payload = Object.fromEntries(
      Object.entries(req.body || {}).filter(([key]) => allowedFields.includes(key))
    );

    const updated = await User.findByIdAndUpdate(req.user.id, payload, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!updated) return res.status(404).json({ message: 'User not found' });

    res.json(sanitizeUser(updated));
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: 'Email already registered' });
    }
    next(err);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });
    const { status } = req.body;
    if (!['active','blocked'].includes(status)) return res.status(422).json({ message: 'Invalid status' });
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.status = status;
    await user.save();
    res.json({ message: 'Updated', user: { id: user._id.toString(), name: user.name, email: user.email, status: user.status } });
  } catch (err) {
    next(err);
  }
};
