const mongoose = require('mongoose');

const complaintMessageSchema = new mongoose.Schema(
  {
    complaint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    senderName: {
      type: String,
      trim: true,
      required: true,
    },
    senderRole: {
      type: String,
      trim: true,
      default: 'admin',
    },
    message: {
      type: String,
      trim: true,
      required: true,
    },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model('ComplaintMessage', complaintMessageSchema);
