const Complaint = require('../models/Complaint');
const { emitEvent } = require('./realtime');

const getComplaintPayload = async (id) => {
  const complaint = await Complaint.findById(id)
    .populate('user', 'name email phone role')
    .populate('assignedTo', 'name email phone department role')
    .lean();
  return complaint;
};

const emitComplaintEvent = async (event, complaintOrId, extra = {}) => {
  const complaint = typeof complaintOrId === 'string'
    ? await getComplaintPayload(complaintOrId)
    : await getComplaintPayload(complaintOrId?._id?.toString?.() || complaintOrId?._id || complaintOrId?.id);

  if (!complaint) return null;

  const payload = {
    ...extra,
    complaint,
  };

  emitEvent(event, payload);

  if (complaint.user?._id) {
    emitEvent(event, payload, { room: complaint.user._id.toString() });
  }

  if (complaint.assignedTo?._id) {
    emitEvent(event, payload, { room: complaint.assignedTo._id.toString() });
  }

  emitEvent(event, payload, { room: 'admins' });
  return complaint;
};

module.exports = { emitComplaintEvent, getComplaintPayload };
