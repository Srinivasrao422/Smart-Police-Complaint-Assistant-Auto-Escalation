const Complaint = require('../models/Complaint');
const User = require('../models/User');
const AdminLog = require('../models/AdminLog');
const { createNotification, notifyAdmins } = require('./notifications');
const { emitEvent } = require('./realtime');

const OFFICER_ROLES = ['officer'];
const ACTIVE_CASE_STATUSES = ['pending', 'in-progress', 'escalated'];
const DEFAULT_SLA_HOURS = 48;

const inferPriorityFromText = (description = '') => {
  const text = `${description}`.toLowerCase();
  if (/(urgent|attack|missing)/.test(text)) return 'High';
  if (/(fraud|harassment)/.test(text)) return 'Medium';
  return 'Low';
};

const normalizePriority = (value, description = '') => {
  const normalized = `${value || ''}`.trim().toLowerCase();
  if (normalized === 'critical') return 'High';
  if (normalized === 'high') return 'High';
  if (normalized === 'medium') return 'Medium';
  if (normalized === 'low') return 'Low';
  return inferPriorityFromText(description);
};

const getLocationLabel = (location, fallback = 'Unknown') => {
  if (typeof location === 'string') return location || fallback;
  if (location && typeof location === 'object') {
    if (location.label) return location.label;
    if (Number.isFinite(location.lat) && Number.isFinite(location.lng)) {
      return `Lat ${Number(location.lat).toFixed(5)}, Lng ${Number(location.lng).toFixed(5)}`;
    }
  }
  return fallback;
};

const normalizeLocation = (location, coordinates = null) => {
  if (location && typeof location === 'object' && !Array.isArray(location)) {
    const lat = Number(location.lat);
    const lng = Number(location.lng);
    return {
      label: `${location.label || ''}`.trim(),
      lat: Number.isFinite(lat) ? Number(lat.toFixed(6)) : null,
      lng: Number.isFinite(lng) ? Number(lng.toFixed(6)) : null,
    };
  }

  const fallback = coordinates && Number.isFinite(coordinates.lat) && Number.isFinite(coordinates.lng)
    ? { lat: Number(coordinates.lat.toFixed(6)), lng: Number(coordinates.lng.toFixed(6)) }
    : { lat: null, lng: null };

  return {
    label: typeof location === 'string' ? location.trim() : '',
    lat: fallback.lat,
    lng: fallback.lng,
  };
};

const extractCoordinates = (source = {}, fallbackLocation = '') => {
  const lat = Number(source.lat ?? source.latitude ?? source.coordinates?.lat ?? source.location?.lat);
  const lng = Number(source.lng ?? source.longitude ?? source.coordinates?.lng ?? source.location?.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return {
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
    };
  }

  const fallbackText = typeof fallbackLocation === 'string'
    ? fallbackLocation
    : getLocationLabel(fallbackLocation, '');
  const match = `${fallbackText || ''}`.match(/lat\s*([+-]?\d+(\.\d+)?)\s*,?\s*lng\s*([+-]?\d+(\.\d+)?)/i);
  if (match) {
    return {
      lat: Number(Number(match[1]).toFixed(6)),
      lng: Number(Number(match[3]).toFixed(6)),
    };
  }
  return null;
};

const appendTimelineEntry = (complaint, payload) => {
  complaint.timeline = complaint.timeline || [];
  complaint.timeline.unshift({
    time: new Date(),
    ...payload,
  });
};

const appendActivityLog = (complaint, payload) => {
  complaint.activityLogs = complaint.activityLogs || [];
  complaint.activityLogs.unshift({
    createdAt: new Date(),
    ...payload,
  });
};

const syncLifecycleStage = (complaint, action = '') => {
  if (!complaint) return 'Filed';
  if (complaint.status === 'closed') return 'Closed';
  if (complaint.status === 'resolved') return 'Resolved';
  if (complaint.assignedTo && complaint.status === 'in-progress') return 'In Progress';
  if (complaint.assignedTo) return 'Assigned';
  if (action === 'verify' || complaint.readAt) return 'Verified';
  return 'Filed';
};

const getLocationWeight = (location = {}) => {
  if (Number.isFinite(location?.lat) && Number.isFinite(location?.lng)) return 3;
  return 1;
};

const computeRiskScore = ({ priority, severity, frequency = 1, location }) => {
  const priorityValue = normalizePriority(priority, severity);
  const severityWeight = priorityValue === 'High' ? 5 : priorityValue === 'Medium' ? 3 : 1;
  const frequencyWeight = Math.max(1, Number(frequency) || 1);
  const locationWeight = getLocationWeight(location);
  return severityWeight + frequencyWeight + locationWeight;
};

const detectRepeatOffender = async (accused = []) => {
  const names = accused
    .map((entry) => `${entry?.name || ''}`.trim().toLowerCase())
    .filter(Boolean);

  if (!names.length) return { repeatOffender: false, names: [] };

  const complaints = await Complaint.find({
    accused: {
      $elemMatch: {
        name: { $in: names.map((name) => new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')) },
      },
    },
  })
    .select('accused')
    .lean();

  const repeated = new Set();
  complaints.forEach((complaint) => {
    (complaint.accused || []).forEach((entry) => {
      const name = `${entry?.name || ''}`.trim().toLowerCase();
      if (names.includes(name)) repeated.add(entry.name.trim());
    });
  });

  return { repeatOffender: repeated.size > 0, names: Array.from(repeated) };
};

const getSlaSnapshot = (complaint) => {
  const createdAt = new Date(complaint.createdAt || Date.now());
  const slaHours = complaint.slaHours || DEFAULT_SLA_HOURS;
  const deadline = new Date(createdAt.getTime() + slaHours * 36e5);
  const diffHours = (deadline.getTime() - Date.now()) / 36e5;
  const remainingHours = Number(diffHours.toFixed(1));
  const exceededHours = Number(Math.max(0, -diffHours).toFixed(1));

  return {
    slaHours,
    deadline,
    remainingHours,
    exceededHours,
    breached: diffHours < 0,
  };
};

const enrichComplaint = (complaint) => {
  const plain = complaint.toObject ? complaint.toObject() : { ...complaint };
  const sla = getSlaSnapshot(plain);
  const normalizedLocation = normalizeLocation(plain.location, plain.coordinates);
  return {
    ...plain,
    location: getLocationLabel(plain.location),
    locationData: normalizedLocation,
    coordinates: {
      lat: normalizedLocation.lat,
      lng: normalizedLocation.lng,
    },
    priority: normalizePriority(plain.priority, plain.description),
    sla,
  };
};

const logAdminAction = async (adminId, action, meta = {}, complaintId = null) => {
  if (!adminId || !action) return null;
  return AdminLog.create({
    adminId,
    action,
    complaintId,
    meta,
    timestamp: new Date(),
  });
};

const syncOfficerActiveCases = async () => {
  const counts = await Complaint.aggregate([
    { $match: { assignedTo: { $ne: null }, status: { $in: ACTIVE_CASE_STATUSES } } },
    { $group: { _id: '$assignedTo', activeCases: { $sum: 1 } } },
  ]);

  const countMap = new Map(counts.map((item) => [String(item._id), item.activeCases]));
  const officers = await User.find({ role: { $in: OFFICER_ROLES } }).select('_id');

  await Promise.all(
    officers.map((officer) =>
      User.updateOne({ _id: officer._id }, { $set: { activeCases: countMap.get(String(officer._id)) || 0 } })
    )
  );
};

const findLeastBusyOfficer = async () => {
  await syncOfficerActiveCases();
  return User.findOne({ role: { $in: OFFICER_ROLES }, status: 'active' })
    .select('name email phone department role activeCases')
    .sort({ activeCases: 1, updatedAt: 1, name: 1 })
    .lean();
};

const notifySmartAlert = async (complaint, type, message) => {
  if (!complaint?._id || !message) return;
  emitEvent('smartAlert', { type, complaintId: complaint._id.toString(), receiptId: complaint.receiptId, message }, { room: 'admins' });
  await notifyAdmins(message);
};

const ensureHighPriorityAlert = async (complaint) => {
  if (!complaint || complaint.highPriorityAlertedAt || normalizePriority(complaint.priority, complaint.description) !== 'High') return;
  complaint.highPriorityAlertedAt = new Date();
  await complaint.save();
  await notifySmartAlert(complaint, 'high-priority', `High priority complaint detected: ${complaint.receiptId}`);
};

const ensureSlaBreachAlert = async (complaint) => {
  if (!complaint || complaint.status === 'resolved' || complaint.slaBreachedNotifiedAt) return;
  const sla = getSlaSnapshot(complaint);
  if (!sla.breached) return;
  complaint.slaBreachedNotifiedAt = new Date();
  if (complaint.status !== 'escalated') {
    complaint.status = 'escalated';
    complaint.escalationLevel = complaint.escalationLevel || 'L2 - Senior Officer';
    appendTimelineEntry(complaint, {
      action: 'sla-breach',
      by: null,
      byName: 'System',
      meta: { exceededHours: sla.exceededHours },
    });
    appendActivityLog(complaint, {
      action: 'sla-breach',
      actorName: 'System',
      message: `SLA breached by ${sla.exceededHours} hours`,
      meta: { exceededHours: sla.exceededHours },
    });
  }
  await complaint.save();
  await notifySmartAlert(complaint, 'sla-breach', `SLA breached for complaint ${complaint.receiptId}`);
  await createNotification(complaint.user, `Complaint ${complaint.receiptId} exceeded its SLA and has been escalated.`);
};

const processSlaBreaches = async () => {
  const complaints = await Complaint.find({
    status: { $in: ACTIVE_CASE_STATUSES },
    slaBreachedNotifiedAt: null,
  });

  for (const complaint of complaints) {
    // eslint-disable-next-line no-await-in-loop
    await ensureSlaBreachAlert(complaint);
  }
};

module.exports = {
  ACTIVE_CASE_STATUSES,
  OFFICER_ROLES,
  DEFAULT_SLA_HOURS,
  inferPriorityFromText,
  normalizePriority,
  getLocationLabel,
  normalizeLocation,
  extractCoordinates,
  appendTimelineEntry,
  appendActivityLog,
  getSlaSnapshot,
  enrichComplaint,
  logAdminAction,
  syncOfficerActiveCases,
  findLeastBusyOfficer,
  ensureHighPriorityAlert,
  ensureSlaBreachAlert,
  processSlaBreaches,
  notifySmartAlert,
  syncLifecycleStage,
  computeRiskScore,
  detectRepeatOffender,
};
