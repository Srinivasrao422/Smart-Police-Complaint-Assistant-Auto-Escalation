const mongoose = require('mongoose');
const Notification = require('../models/Notification');

exports.getNotifications = async (req, res, next) => {
  try {
    const notes = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    res.json(notes);
  } catch (err) {
    next(err);
  }
};

exports.createNotification = async (req, res, next) => {
  try {
    const { user, message } = req.body || {};
    if (!user || !message) {
      return res.status(400).json({ message: 'User and message are required' });
    }
    if (!mongoose.isValidObjectId(user)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    const note = await Notification.create({ user, message });
    res.status(201).json(note);
  } catch (err) {
    next(err);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const note = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { read: true },
      { new: true }
    );
    if (!note) return res.status(404).json({ message: 'Notification not found' });
    res.json(note);
  } catch (err) {
    next(err);
  }
};

exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ user: req.user.id, read: false }, { read: true });
    res.json({ message: 'Notifications marked as read' });
  } catch (err) {
    next(err);
  }
};
