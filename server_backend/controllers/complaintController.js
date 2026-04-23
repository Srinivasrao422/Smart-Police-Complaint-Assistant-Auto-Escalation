// const Complaint = require('../models/Complaint');

// exports.create = async (req, res) => {
//   try {
//     const { title, description, category } = req.body || {};
//     if (!title || !description) return res.status(400).json({ message: 'Title and description are required' });

//     const complaint = new Complaint({ title, description, category, user: req.user.id });
//     await complaint.save();
//     res.status(201).json(complaint);
//   } catch (err) {
//     console.error('Create complaint error:', err && err.message ? err.message : err);
//     res.status(500).json({ message: 'Unable to create complaint' });
//   }
// };

// exports.my = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const total = await Complaint.countDocuments({ user: userId });
//     const pending = await Complaint.countDocuments({ user: userId, status: 'pending' });
//     const inProgress = await Complaint.countDocuments({ user: userId, status: 'in-progress' });
//     const resolved = await Complaint.countDocuments({ user: userId, status: 'resolved' });
//     const escalated = await Complaint.countDocuments({ user: userId, status: 'escalated' });

//     const recent = await Complaint.find({ user: userId })
//       .sort({ createdAt: -1 })
//       .limit(5)
//       .select('title status category createdAt')
//       .lean();

//     res.json({ total, pending, inProgress, resolved, escalated, recent });
//   } catch (err) {
//     console.error('Get my complaints error:', err && err.message ? err.message : err);
//     res.status(500).json({ message: 'Unable to fetch complaints' });
//   }
// };

// // keep existing list/get/update/remove functionality if needed
// exports.list = async (req, res) => {
//   try {
//     const items = await Complaint.find({}).sort({ createdAt: -1 }).limit(50).lean();
//     res.json({ items });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Unable to list complaints' });
//   }
// };

// exports.get = async (req, res) => {
//   try {
//     const complaint = await Complaint.findById(req.params.id).lean();
//     if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
//     res.json(complaint);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Unable to get complaint' });
//   }
// };

// module.exports = exports;





const Complaint = require('../models/Complaint');
const Feedback = require('../models/Feedback');
const { createNotification, notifyAdmins } = require('../utils/notifications');
const { emitComplaintEvent } = require('../utils/complaintEvents');
const { emitEvent } = require('../utils/realtime');
const {
  normalizePriority,
  extractCoordinates,
  getLocationLabel,
  normalizeLocation,
  syncLifecycleStage,
  computeRiskScore,
  detectRepeatOffender,
  appendTimelineEntry,
  appendActivityLog,
  enrichComplaint,
  ensureHighPriorityAlert,
  ensureSlaBreachAlert,
  processSlaBreaches,
  findLeastBusyOfficer,
  syncOfficerActiveCases,
} = require('../utils/adminAutomation');

const parseJsonField = (value, fallback) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch (err) {
    return fallback;
  }
};

const mapUploadedEvidence = (files = []) =>
  files.map((file) => ({
    name: file.originalname,
    url: `http://localhost:5000/uploads/${file.filename}`,
    mimeType: file.mimetype,
    tag: file.mimetype.startsWith('image/') ? 'Image' : 'Document',
    size: file.size || 0,
  }));

const canAccessComplaint = (req, complaint) => {
  if (!req.user || !complaint) return false;
  if (['admin', 'super-admin'].includes(req.user.role)) return true;
  if (req.user.role === 'officer') return complaint.assignedTo?.toString?.() === req.user.id || complaint.assignedTo?._id?.toString?.() === req.user.id;
  return complaint.user?._id?.toString?.() === req.user.id || complaint.user?.toString?.() === req.user.id;
};

const getPriorityWeight = (complaint) => {
  const value = `${complaint?.priority || complaint?.severity || ''}`.toLowerCase();
  if (value.includes('critical')) return 4;
  if (value.includes('high')) return 3;
  if (value.includes('medium')) return 2;
  return 1;
};

const classifyHotspot = (count = 0) => {
  if (count > 10) return 'High';
  if (count > 5) return 'Medium';
  return 'Low';
};

const emitLocationSignals = async (complaintDoc) => {
  const lat = complaintDoc?.coordinates?.lat;
  const lng = complaintDoc?.coordinates?.lng;
  if (typeof lat !== 'number' || typeof lng !== 'number') return;

  const complaint = await Complaint.findById(complaintDoc._id)
    .populate('user', 'name email phone role')
    .populate('assignedTo', 'name email phone department role')
    .lean();

  if (!complaint) return;

  const count = await Complaint.countDocuments({
    'coordinates.lat': lat,
    'coordinates.lng': lng,
  });

  const hotspotPayload = {
    location: {
      lat,
      lng,
      label: getLocationLabel(complaint.location),
    },
    count,
    classification: classifyHotspot(count),
    riskScore: count * getPriorityWeight(complaint),
    complaint,
  };

  emitEvent('newComplaintLocation', hotspotPayload, { room: 'admins' });
  if (count > 5) {
    emitEvent('hotspotSpike', hotspotPayload, { room: 'admins' });
  }
};

/**
 * CREATE COMPLAINT
 */
exports.create = async (req, res) => {
  try {
    console.log("REQ BODY:", req.body);

    const victim = parseJsonField(req.body?.victim, req.body?.victim || {});
    const accused = parseJsonField(req.body?.accused, req.body?.accused || []);
    const witnesses = parseJsonField(req.body?.witnesses, req.body?.witnesses || []);
    const verification = parseJsonField(req.body?.verification, req.body?.verification || {});
    const computedPriority = normalizePriority(req.body?.priority, req.body?.description);
    const coordinates = extractCoordinates(req.body, req.body?.location);
    const normalizedLocation = normalizeLocation(req.body?.location, coordinates);
    const repeat = await detectRepeatOffender(accused);

    const complaint = new Complaint({
      ...req.body,
      priority: computedPriority,
      location: normalizedLocation,
      coordinates: coordinates || undefined,
      lifecycleStage: 'Filed',
      evidenceFiles: [
        ...mapUploadedEvidence(req.files || []),
        ...(Array.isArray(req.body?.files)
          ? req.body.files.map((file) => ({
            name: file.name,
            url: file.url,
            mimeType: file.mimeType || file.type,
            tag: file.tag,
            size: file.size || 0,
          }))
          : []),
      ],
      verification: {
        signature: verification?.signature || req.body?.signature || null,
        method: verification?.method || (verification?.signature || req.body?.signature ? 'digital-signature' : null),
        timestamp: verification?.timestamp || new Date(),
        selfieUrl: verification?.selfieUrl || null,
        consentAccepted: verification?.consentAccepted ?? req.body?.consentAccepted ?? false,
        deviceAuth: verification?.deviceAuth || null,
      },
      signature: verification?.signature || req.body?.signature || null,
      victim,
      accused,
      witnesses,
      repeatOffender: repeat.repeatOffender,
      repeatOffenderNames: repeat.names,
      riskScore: computeRiskScore({
        priority: computedPriority,
        severity: req.body?.severity,
        frequency: repeat.repeatOffender ? 2 : 1,
        location: normalizedLocation,
      }),
      user: req.user.id
    });

    appendTimelineEntry(complaint, {
      action: 'creation',
      by: req.user.id,
      byName: req.user?.name || 'Citizen',
      meta: {
        priority: complaint.priority,
        status: complaint.status,
        lifecycleStage: complaint.lifecycleStage,
      },
    });
    appendActivityLog(complaint, {
      action: 'create',
      actor: req.user.id,
      actorName: req.user?.name || 'Citizen',
      message: 'Complaint created',
      meta: {
        priority: complaint.priority,
      },
    });

    const saved = await complaint.save();

    await createNotification(
      req.user.id,
      `Complaint ${saved.receiptId} created successfully.`
    );
    await notifyAdmins(`New complaint received: ${saved.receiptId}`);
    await emitComplaintEvent('newComplaint', saved._id.toString());
    await emitLocationSignals(saved);
    await ensureHighPriorityAlert(saved);
    await ensureSlaBreachAlert(saved);

    console.log("SAVED:", saved);

    res.status(201).json({
      ...enrichComplaint(saved),
      receiptId: saved.receiptId
    });
  } catch (err) {
    console.error("CREATE ERROR:", err);
    res.status(500).json({ message: "Unable to create complaint" });
  }
};

/**
 * GET MY DASHBOARD DATA
 */
exports.my = async (req, res) => {
  try {
    const userId = req.user.id;

    const total = await Complaint.countDocuments({ user: userId });
    const pending = await Complaint.countDocuments({ user: userId, status: 'pending' });
    const inProgress = await Complaint.countDocuments({ user: userId, status: 'in-progress' });
    const resolved = await Complaint.countDocuments({ user: userId, status: 'resolved' });
    const escalated = await Complaint.countDocuments({ user: userId, status: 'escalated' });

    const recent = await Complaint.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title receiptId status category createdAt priority location')
      .lean();

    res.json({
      total,
      pending,
      inProgress,
      resolved,
      escalated,
      recent: recent.map((item) => ({ ...item, location: getLocationLabel(item.location) })),
    });
  } catch (err) {
    console.error('Get my complaints error:', err?.message || err);
    res.status(500).json({ message: 'Unable to fetch complaints' });
  }
};

/**
 * LIST ALL (ADMIN)
 */
exports.list = async (req, res) => {
  try {
    await processSlaBreaches();
    const filter = {};
    if (req.query?.status) filter.status = req.query.status;
    if (req.query?.category) filter.category = req.query.category;
    if (req.query?.priority) filter.priority = normalizePriority(req.query.priority);
    if (req.query?.startDate || req.query?.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) filter.createdAt.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.createdAt.$lte = new Date(`${req.query.endDate}T23:59:59.999Z`);
    }
    if (req.query?.q) {
      filter.$or = [
        { receiptId: { $regex: req.query.q, $options: 'i' } },
        { title: { $regex: req.query.q, $options: 'i' } },
        { description: { $regex: req.query.q, $options: 'i' } },
        { category: { $regex: req.query.q, $options: 'i' } },
        { 'location.label': { $regex: req.query.q, $options: 'i' } },
        { officerName: { $regex: req.query.q, $options: 'i' } },
        { 'victim.fullName': { $regex: req.query.q, $options: 'i' } },
      ];
    }

    const items = await Complaint.find(filter)
      .populate('user', 'name email')
      .populate('assignedTo', 'name email phone department role')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ items: items.map((item) => enrichComplaint(item)) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Unable to list complaints' });
  }
};

/**
 * GET SINGLE
 */
exports.get = async (req, res) => {
  try {
    let complaint = await Complaint.findById(req.params.id)
      .populate('user', 'name email phone address')
      .populate('assignedTo', 'name email phone department role')
      .populate('latestFeedback')
      .lean();

    if (!complaint) {
      complaint = await Complaint.findOne({ receiptId: req.params.id })
        .populate('user', 'name email phone address')
        .populate('assignedTo', 'name email phone department role')
        .populate('latestFeedback')
        .lean();
    }

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (!canAccessComplaint(req, complaint)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    res.json(enrichComplaint(complaint));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Unable to get complaint' });
  }
};

/**
 * UPDATE
 */
exports.update = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (!canAccessComplaint(req, complaint)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const previousStatus = complaint.status;
    if (req.user.role === 'citizen') {
      return res.status(403).json({ message: 'Citizens cannot update complaint workflow' });
    }

    const permittedFields = ['description', 'remarks', 'priority', 'status'];
    permittedFields.forEach((field) => {
      if (req.body?.[field] !== undefined) complaint[field] = req.body[field];
    });
    complaint.priority = normalizePriority(req.body?.priority ?? complaint.priority, req.body?.description ?? complaint.description);
    const coordinates = extractCoordinates(req.body || complaint, req.body?.location || complaint.location);
    if (coordinates) {
      complaint.coordinates = coordinates;
    }
    if (req.body?.location !== undefined) {
      complaint.location = normalizeLocation(req.body.location, coordinates || complaint.coordinates);
    }
    complaint.evidenceFiles = [
      ...(complaint.evidenceFiles || []),
      ...mapUploadedEvidence(req.files || []),
    ];
    const repeat = await detectRepeatOffender(complaint.accused || []);
    complaint.repeatOffender = repeat.repeatOffender;
    complaint.repeatOffenderNames = repeat.names;

    if (req.body?.status && previousStatus !== complaint.status) {
      complaint.lastStatusChangeAt = new Date();
      if (complaint.status === 'resolved') {
        complaint.resolvedAt = new Date();
        complaint.resolutionHours = Number(((complaint.resolvedAt.getTime() - new Date(complaint.createdAt).getTime()) / 36e5).toFixed(1));
      } else if (complaint.status === 'closed') {
        complaint.resolvedAt = complaint.resolvedAt || new Date();
      } else {
        complaint.resolvedAt = undefined;
        complaint.resolutionHours = null;
      }
    }
    complaint.lifecycleStage = syncLifecycleStage(complaint, 'update');
    complaint.riskScore = computeRiskScore({
      priority: complaint.priority,
      severity: complaint.severity,
      frequency: complaint.repeatOffender ? 2 : 1,
      location: complaint.location,
    });

    appendTimelineEntry(complaint, {
      action: complaint.status === 'resolved' ? 'resolution' : complaint.status === 'closed' ? 'closure' : 'update',
      by: req.user.id,
      byName: req.user?.name || 'System',
      meta: {
        previousStatus,
        nextStatus: complaint.status,
        priority: complaint.priority,
        lifecycleStage: complaint.lifecycleStage,
      },
    });
    appendActivityLog(complaint, {
      action: complaint.status === 'resolved' ? 'resolve' : 'update',
      actor: req.user.id,
      actorName: req.user?.name || 'System',
      message: `Complaint updated${req.body?.status ? ` to ${complaint.status}` : ''}`,
      meta: {
        previousStatus,
        nextStatus: complaint.status,
        priority: complaint.priority,
      },
    });

    const updated = await complaint.save();
    await ensureHighPriorityAlert(updated);
    await ensureSlaBreachAlert(updated);

    if (req.body?.status && previousStatus !== updated.status) {
      await createNotification(
        updated.user,
        `Complaint ${updated.receiptId} status updated to ${updated.status}.`
      );
    }

    await emitComplaintEvent('complaintUpdated', updated._id.toString());

    res.json(enrichComplaint(updated));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Unable to update complaint' });
  }
};

/**
 * DELETE
 */
exports.remove = async (req, res) => {
  try {
    const deleted = await Complaint.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    res.json({ message: 'Complaint deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Unable to delete complaint' });
  }
};

/**
 * ASSIGN (ADMIN)
 */
exports.assign = async (req, res) => {
  try {
    const { officerId, officerName, status } = req.body;

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    let resolvedOfficerId = officerId;
    let resolvedOfficerName = officerName;
    if (!resolvedOfficerId) {
      const suggestedOfficer = await findLeastBusyOfficer();
      if (suggestedOfficer?._id) {
        resolvedOfficerId = suggestedOfficer._id.toString();
        resolvedOfficerName = suggestedOfficer.name;
      }
    }

    if (resolvedOfficerId) complaint.assignedTo = resolvedOfficerId;
    if (resolvedOfficerName) complaint.officerName = resolvedOfficerName;
    complaint.status = status || 'in-progress';
    appendTimelineEntry(complaint, {
      action: 'assign',
      by: req.user.id,
      byName: req.user?.name || 'Admin',
      meta: {
        officerId: resolvedOfficerId,
        officerName: resolvedOfficerName,
      },
    });
    appendActivityLog(complaint, {
      action: 'assign',
      actor: req.user.id,
      actorName: req.user?.name || 'Admin',
      message: `Assigned to ${resolvedOfficerName || resolvedOfficerId || 'officer'}`,
      meta: {
        officerId: resolvedOfficerId,
        officerName: resolvedOfficerName,
      },
    });

    await complaint.save();
    await syncOfficerActiveCases();

    await createNotification(
      complaint.user,
      `Complaint ${complaint.receiptId} status updated to ${complaint.status}.`
    );
    await emitComplaintEvent('complaintUpdated', complaint._id.toString());

    await ensureSlaBreachAlert(complaint);
    res.json(enrichComplaint(complaint));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Unable to assign complaint' });
  }
};

/**
 * RECENT (OPTIONAL)
 */
exports.recent = async (req, res) => {
  try {
    const items = await Complaint.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.json({ items: items.map((item) => ({ ...item, location: getLocationLabel(item.location) })) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Unable to fetch recent complaints' });
  }
};

exports.getByReceipt = async (req, res) => {
  try {
    const complaint = await Complaint.findOne({ receiptId: req.params.receiptId })
      .populate('user', 'name email phone address')
      .populate('assignedTo', 'name email phone department role')
      .populate('latestFeedback')
      .lean();

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (!canAccessComplaint(req, complaint)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    res.json(enrichComplaint(complaint));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Unable to get complaint' });
  }
};

exports.addFeedback = async (req, res) => {
  try {
    const { rating, text } = req.body || {};
    const complaint = await Complaint.findOne({
      receiptId: req.params.receiptId,
      user: req.user.id,
    });

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(422).json({ message: 'Valid rating is required' });
    }

    const feedback = await Feedback.create({
      complaint: complaint._id,
      user: req.user.id,
      rating,
      text: text || '',
    });

    complaint.latestFeedback = feedback._id;
    appendTimelineEntry(complaint, {
      action: 'feedback',
      by: req.user.id,
      byName: req.user?.name || 'Citizen',
      meta: { rating },
    });
    appendActivityLog(complaint, {
      action: 'feedback',
      actor: req.user.id,
      actorName: req.user?.name || 'Citizen',
      message: `Citizen submitted feedback (${rating}/5)`,
    });
    await complaint.save();

    await notifyAdmins(`Feedback received for ${complaint.receiptId}`);

    const payload = {
      ...(await Feedback.findById(feedback._id)
        .populate('user', 'name email')
        .populate('complaint', 'receiptId title status')
        .lean()),
      complaintId: complaint._id.toString(),
      receiptId: complaint.receiptId,
    };

    emitEvent('feedbackAdded', payload);
    emitEvent('feedbackAdded', payload, { room: 'admins' });

    res.status(201).json(payload);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Unable to submit feedback' });
  }
};
