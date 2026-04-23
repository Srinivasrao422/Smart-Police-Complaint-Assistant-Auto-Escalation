const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  title: String,
  description: String,
  category: String,
  location: {
    label: { type: String, trim: true, default: '' },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
  },
  severity: { type: String, default: "medium" },
  lifecycleStage: {
    type: String,
    enum: ['Filed', 'Verified', 'Assigned', 'In Progress', 'Resolved', 'Closed'],
    default: 'Filed',
    index: true,
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Low',
  },
  coordinates: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
  },
  sections: [{ type: String }],
  evidenceFiles: [
    {
      name: { type: String, trim: true },
      url: { type: String, trim: true },
      mimeType: { type: String, trim: true },
      tag: { type: String, trim: true },
      size: { type: Number, default: 0 },
    }
  ],
  signature: String,
  verification: {
    signature: { type: String, default: null },
    method: { type: String, trim: true, default: null },
    timestamp: { type: Date, default: null },
    selfieUrl: { type: String, trim: true, default: null },
    consentAccepted: { type: Boolean, default: false },
    deviceAuth: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  victim: Object,
  accused: Array,
  witnesses: Array,
  repeatOffender: { type: Boolean, default: false, index: true },
  repeatOffenderNames: [{ type: String, trim: true }],
  riskScore: { type: Number, default: 0, min: 0 },
  receiptId: {
    type: String,
    unique: true,
    sparse: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  officerName: { type: String },
  remarks: { type: String, trim: true },
  readAt: { type: Date },
  readBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastStatusChangeAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date },
  resolutionHours: { type: Number, default: null },
  slaHours: { type: Number, default: 48 },
  escalationLevel: { type: String, trim: true, default: "L1 - Officer" },
  highPriorityAlertedAt: { type: Date, default: null },
  slaBreachedNotifiedAt: { type: Date, default: null },
  activityLogs: [
    {
      action: { type: String, trim: true },
      message: { type: String, trim: true },
      actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      actorName: { type: String, trim: true },
      createdAt: { type: Date, default: Date.now },
      meta: { type: mongoose.Schema.Types.Mixed }
    }
  ],
  latestFeedback: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Feedback'
  },
  timeline: [
    {
      action: { type: String, trim: true },
      time: { type: Date, default: Date.now },
      by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      byName: { type: String, trim: true },
      meta: { type: mongoose.Schema.Types.Mixed },
    }
  ],

  status: {
    type: String,
    enum: ['pending', 'in-progress', 'resolved', 'escalated', 'closed'],
    default: 'pending'
  },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }

}, { timestamps: true, strict: false });

complaintSchema.index({ title: 'text', description: 'text', category: 1 });

complaintSchema.pre("save", function (next) {
  if (!this.receiptId) {
    this.receiptId = "CMP-" + Date.now() + "-" + Math.floor(Math.random() * 10000);
  }
  if (!this.timeline) {
    this.timeline = [];
  }
  if (this.isModified("status") && !this.isNew) {
    this.lastStatusChangeAt = new Date();
    if (this.status === "resolved" && !this.resolvedAt) {
      this.resolvedAt = new Date();
    }
    if (this.status !== "resolved" && this.resolvedAt) {
      this.resolvedAt = undefined;
      this.resolutionHours = null;
    }
  }
  if (typeof next === "function") {
    next();
  }
});

module.exports = mongoose.model('Complaint', complaintSchema);
