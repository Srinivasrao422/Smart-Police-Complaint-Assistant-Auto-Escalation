const mongoose = require('mongoose');

const adminSettingSchema = new mongoose.Schema(
  {
    slaTime: { type: Number, default: 48 },
    notificationsEnabled: { type: Boolean, default: true },
    theme: { type: String, default: 'system', trim: true },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      weekly: { type: Boolean, default: false },
    },
    sla: {
      level1Hours: { type: Number, default: 48 },
      level2Hours: { type: Number, default: 96 },
    },
    systemPreferences: {
      defaultPriority: { type: String, default: 'Medium' },
      autoEscalation: { type: Boolean, default: true },
      reportFormat: { type: String, default: 'pdf' },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AdminSetting', adminSettingSchema);
