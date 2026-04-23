const Notification = require('../models/Notification');
const User = require('../models/User');
const { emitEvent } = require('./realtime');

const createNotification = async (user, message) => {
  if (!user || !message) return null;
  const note = await Notification.create({ user, message });
  emitEvent('notificationAdded', note, { room: user.toString() });
  return note;
};

const createNotificationsForUsers = async (userIds, message) => {
  const ids = [...new Set((userIds || []).filter(Boolean).map((value) => value.toString()))];
  if (!ids.length || !message) return [];
  const notes = await Notification.insertMany(ids.map((user) => ({ user, message })));
  notes.forEach((note) => emitEvent('notificationAdded', note, { room: note.user.toString() }));
  return notes;
};

const notifyAdmins = async (message) => {
  const admins = await User.find({ role: 'admin' }).select('_id').lean();
  return createNotificationsForUsers(admins.map((item) => item._id), message);
};

module.exports = { createNotification, createNotificationsForUsers, notifyAdmins };
