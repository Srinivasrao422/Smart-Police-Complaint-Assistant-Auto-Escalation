const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const AdminSetting = require('../models/AdminSetting');
const Feedback = require('../models/Feedback');
const ComplaintMessage = require('../models/ComplaintMessage');
const AdminLog = require('../models/AdminLog');
const { createNotification, notifyAdmins } = require('../utils/notifications');
const { emitComplaintEvent } = require('../utils/complaintEvents');
const { emitEvent } = require('../utils/realtime');
const {
  OFFICER_ROLES,
  normalizePriority,
  getLocationLabel,
  getSlaSnapshot,
  syncLifecycleStage,
  appendTimelineEntry,
  appendActivityLog,
  logAdminAction,
  syncOfficerActiveCases,
  findLeastBusyOfficer,
  processSlaBreaches,
  ensureHighPriorityAlert,
  ensureSlaBreachAlert,
  notifySmartAlert,
} = require('../utils/adminAutomation');

const STATUS_ORDER = ['pending', 'in-progress', 'resolved', 'escalated'];
const PRIORITY_ORDER = ['High', 'Medium', 'Low'];

const ensureSettings = async () => {
  let settings = await AdminSetting.findOne();
  if (!settings) settings = await AdminSetting.create({});
  if (typeof settings.slaTime !== 'number' || settings.slaTime <= 0) {
    settings.slaTime = settings.sla?.level1Hours || 48;
  }
  if (typeof settings.notificationsEnabled !== 'boolean') {
    settings.notificationsEnabled = !!(settings.notifications?.email || settings.notifications?.sms || settings.notifications?.weekly);
  }
  if (!settings.theme) {
    settings.theme = 'system';
  }
  if (settings.isModified()) {
    await settings.save();
  }
  return settings;
};

const serializeSettings = (settings) => ({
  _id: settings._id,
  slaTime: settings.slaTime ?? settings.sla?.level1Hours ?? 48,
  notificationsEnabled: settings.notificationsEnabled ?? !!(settings.notifications?.email || settings.notifications?.sms || settings.notifications?.weekly),
  theme: settings.theme || 'system',
  notifications: settings.notifications,
  sla: settings.sla,
  systemPreferences: settings.systemPreferences,
  createdAt: settings.createdAt,
  updatedAt: settings.updatedAt,
});

const startOfDay = (date = new Date()) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

const endOfDay = (date = new Date()) => {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
};

const getComplaintSlaHours = (complaint, settings) => {
  if (typeof complaint?.slaHours === 'number' && complaint.slaHours > 0) return complaint.slaHours;
  const priority = `${complaint?.priority || complaint?.severity || ''}`.toLowerCase();
  if (priority === 'high' || priority === 'critical') return settings?.sla?.level1Hours || 48;
  return settings?.sla?.level2Hours || 96;
};

const getTimeExceededHours = (complaint, settings) => {
  const elapsedHours = (Date.now() - new Date(complaint.createdAt).getTime()) / 36e5;
  return Math.max(0, Math.round(elapsedHours - getComplaintSlaHours(complaint, settings)));
};

const addComplaintLog = (complaint, payload) => {
  complaint.activityLogs = complaint.activityLogs || [];
  complaint.activityLogs.unshift({
    createdAt: new Date(),
    ...payload,
  });
};

const addUserLog = (user, payload) => {
  user.activityLogs = user.activityLogs || [];
  user.activityLogs.unshift({
    createdAt: new Date(),
    ...payload,
  });
};

const parseFilters = (query = {}) => {
  if (!query.filters) return query;
  if (typeof query.filters === 'string') {
    try {
      return { ...query, ...JSON.parse(query.filters) };
    } catch (err) {
      return query;
    }
  }
  return { ...query, ...query.filters };
};

const complaintBaseQuery = (query = {}) => {
  const params = parseFilters(query);
  const filter = {};
  if (params.status && params.status !== 'All' && STATUS_ORDER.includes(params.status)) filter.status = params.status;
  if (params.category && params.category !== 'All') filter.category = params.category;
  if (params.priority && params.priority !== 'All') filter.priority = normalizePriority(params.priority);
  const start = params.start || params.startDate;
  const end = params.end || params.endDate;
  if (start || end) {
    filter.createdAt = {};
    if (start) filter.createdAt.$gte = startOfDay(start);
    if (end) filter.createdAt.$lte = endOfDay(end);
  }
  if (params.q) {
    filter.$or = [
      { receiptId: { $regex: params.q, $options: 'i' } },
      { title: { $regex: params.q, $options: 'i' } },
      { description: { $regex: params.q, $options: 'i' } },
      { category: { $regex: params.q, $options: 'i' } },
      { 'location.label': { $regex: params.q, $options: 'i' } },
      { officerName: { $regex: params.q, $options: 'i' } },
      { 'victim.fullName': { $regex: params.q, $options: 'i' } },
    ];
  }
  return filter;
};

const priorityWeightExpression = {
  $switch: {
    branches: [
      { case: { $regexMatch: { input: { $ifNull: ['$priority', ''] }, regex: /critical/i } }, then: 4 },
      { case: { $regexMatch: { input: { $ifNull: ['$priority', ''] }, regex: /high/i } }, then: 3 },
      { case: { $regexMatch: { input: { $ifNull: ['$priority', ''] }, regex: /medium/i } }, then: 2 },
      { case: { $regexMatch: { input: { $ifNull: ['$severity', ''] }, regex: /critical/i } }, then: 4 },
      { case: { $regexMatch: { input: { $ifNull: ['$severity', ''] }, regex: /high/i } }, then: 3 },
      { case: { $regexMatch: { input: { $ifNull: ['$severity', ''] }, regex: /medium/i } }, then: 2 },
    ],
    default: 1,
  },
};

const hotspotLevelExpression = {
  $switch: {
    branches: [
      { case: { $gt: ['$count', 10] }, then: 'High' },
      { case: { $gt: ['$count', 5] }, then: 'Medium' },
    ],
    default: 'Low',
  },
};

const hotspotIntensity = (count = 0) => {
  if (count > 10) return 'High';
  if (count > 5) return 'Medium';
  return 'Low';
};

const hotspotFiltersWithoutDate = (query = {}) => {
  const filter = complaintBaseQuery(query);
  delete filter.createdAt;
  return filter;
};

const buildHotspotAggregation = (match = {}) => ([
  {
    $match: {
      ...match,
      'coordinates.lat': { $type: 'number' },
      'coordinates.lng': { $type: 'number' },
    },
  },
  {
    $group: {
      _id: {
        lat: '$coordinates.lat',
        lng: '$coordinates.lng',
        label: { $ifNull: ['$location.label', 'Unknown'] },
      },
      count: { $sum: 1 },
      riskScore: { $sum: priorityWeightExpression },
      categories: { $addToSet: { $ifNull: ['$category', 'Other'] } },
      priorities: { $addToSet: { $ifNull: ['$priority', 'Low'] } },
      latestComplaintAt: { $max: '$createdAt' },
    },
  },
  {
    $project: {
      _id: 0,
      location: {
        lat: '$_id.lat',
        lng: '$_id.lng',
        label: '$_id.label',
      },
      count: 1,
      riskScore: 1,
      classification: hotspotLevelExpression,
      categories: 1,
      priorities: 1,
      latestComplaintAt: 1,
    },
  },
  { $sort: { count: -1, riskScore: -1, latestComplaintAt: -1 } },
]);

const toHeatmapPoint = (complaint) => ({
  id: complaint._id?.toString?.() || complaint.id,
  receiptId: complaint.receiptId,
  title: complaint.title || 'Complaint',
  category: complaint.category || 'Other',
  priority: normalizePriority(complaint.priority, complaint.description),
  status: complaint.status || 'pending',
  location: getLocationLabel(complaint.location),
  createdAt: complaint.createdAt,
  lat: complaint.coordinates?.lat,
  lng: complaint.coordinates?.lng,
});

const toComplaintDetail = (complaint, settings) => {
  const createdAt = complaint.createdAt ? new Date(complaint.createdAt) : null;
  const resolvedAt = complaint.resolvedAt ? new Date(complaint.resolvedAt) : null;
  const resolutionHours = typeof complaint.resolutionHours === 'number'
    ? complaint.resolutionHours
    : complaint.status === 'resolved' && createdAt && resolvedAt
      ? Number(((resolvedAt.getTime() - createdAt.getTime()) / 36e5).toFixed(1))
      : null;

  return {
    ...complaint,
    location: getLocationLabel(complaint.location),
    priority: normalizePriority(complaint.priority, complaint.description),
    timeExceededHours: getTimeExceededHours(complaint, settings),
    slaDeadline: createdAt ? new Date(createdAt.getTime() + getComplaintSlaHours(complaint, settings) * 36e5) : null,
    resolutionHours,
    sla: getSlaSnapshot({ ...complaint, slaHours: getComplaintSlaHours(complaint, settings) }),
  };
};

exports.getOverview = async (req, res, next) => {
  try {
    console.log("Running analytics query...");
    try {
      await processSlaBreaches();
    } catch (err) {
      console.error("OVERVIEW PRECHECK ERROR:", err);
    }

    let settings = {};
    try {
      settings = await ensureSettings();
    } catch (err) {
      console.error("OVERVIEW SETTINGS ERROR:", err);
      settings = {};
    }

    const [total, pending, inProgress, resolved, escalated, highPriority, resolvedTodayAgg, resolutionAgg, officerPerformance] = await Promise.all([
      Complaint.countDocuments({}),
      Complaint.countDocuments({ status: { $regex: /pending/i } }),
      Complaint.countDocuments({ status: { $regex: /in-progress/i } }),
      Complaint.countDocuments({ status: { $regex: /resolved/i } }),
      Complaint.countDocuments({ status: { $regex: /escalated/i } }),
      Complaint.countDocuments({ priority: { $regex: /high/i } }),
      Complaint.aggregate([
        { $match: { resolvedAt: { $gte: startOfDay(), $lte: endOfDay() } } },
        { $count: 'count' },
      ]),
      Complaint.aggregate([
        { $match: { resolutionHours: { $ne: null } } },
        { $group: { _id: null, average: { $avg: '$resolutionHours' } } },
      ]),
      Complaint.aggregate([
        { $match: { assignedTo: { $ne: null } } },
        {
          $group: {
            _id: '$assignedTo',
            assigned: { $sum: 1 },
            resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
          },
        },
      ]),
    ]);

    res.json({
      totalCases: total,
      pending,
      inProgress,
      resolved,
      escalated,
      totalActiveCases: pending + inProgress + escalated,
      resolvedToday: resolvedTodayAgg[0]?.count || 0,
      averageResolutionTime: Number((resolutionAgg[0]?.average || 0).toFixed(1)),
      highPriorityCases: highPriority,
      officerPerformance: officerPerformance.length,
      settings: serializeSettings(settings),
    });
  } catch (err) {
    console.error("OVERVIEW ERROR:", err);
    res.status(200).json({
      totalCases: 0,
      pending: 0,
      inProgress: 0,
      resolved: 0,
      escalated: 0,
      totalActiveCases: 0,
      resolvedToday: 0,
      averageResolutionTime: 0,
      highPriorityCases: 0,
      settings: {},
    });
  }
};

exports.getOfficerPerformance = async (req, res, next) => {
  try {
    const items = await Complaint.aggregate([
      { $match: { assignedTo: { $ne: null } } },
      {
        $group: {
          _id: '$assignedTo',
          totalAssigned: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $in: ['$status', ['resolved', 'closed']] }, 1, 0] } },
          avgResolutionTime: { $avg: '$resolutionHours' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'officer',
        },
      },
      { $unwind: '$officer' },
      {
        $project: {
          _id: 0,
          officerId: '$officer._id',
          name: '$officer.name',
          department: '$officer.department',
          totalAssigned: 1,
          resolved: 1,
          avgResolutionTime: { $round: [{ $ifNull: ['$avgResolutionTime', 0] }, 1] },
        },
      },
      { $sort: { resolved: -1, totalAssigned: -1, name: 1 } },
    ]);

    res.json({ items });
  } catch (err) {
    next(err);
  }
};

exports.getCategoryAnalytics = async (req, res, next) => {
  try {
    console.log("Running analytics query...");
    const items = await Complaint.aggregate([
      { $group: { _id: { $ifNull: ['$category', 'Other'] }, count: { $sum: 1 } } },
      { $project: { _id: 0, category: '$_id', count: 1 } },
      { $sort: { count: -1, category: 1 } },
    ]);
    res.json({ items });
  } catch (err) {
    console.error("CATEGORY ERROR:", err);
    res.status(200).json({ items: [] });
  }
};

exports.getStatusAnalytics = async (req, res, next) => {
  try {
    console.log("Running analytics query...");
    const agg = await Complaint.aggregate([
      { $group: { _id: { $ifNull: ['$status', 'unknown'] }, count: { $sum: 1 } } },
    ]);
    const mapped = STATUS_ORDER.map((status) => ({
      status,
      count: agg.find((item) => item._id === status)?.count || 0,
    }));
    res.json({ items: mapped });
  } catch (err) {
    console.error("STATUS ERROR:", err);
    res.status(200).json({ items: [] });
  }
};

exports.getTrendAnalytics = async (req, res, next) => {
  try {
    const since = startOfDay(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000));
    const agg = await Complaint.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    const items = Array.from({ length: 7 }).map((_, index) => {
      const date = startOfDay(new Date(Date.now() - (6 - index) * 24 * 60 * 60 * 1000));
      const match = agg.find((entry) =>
        entry._id.year === date.getFullYear() &&
        entry._id.month === date.getMonth() + 1 &&
        entry._id.day === date.getDate()
      );
      return {
        date: date.toISOString(),
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: match?.count || 0,
      };
    });

    res.json({ items });
  } catch (err) {
    next(err);
  }
};

exports.getLocationAnalytics = async (req, res, next) => {
  try {
    const items = await Complaint.aggregate([
      { $group: { _id: { $ifNull: ['$location.label', 'Unknown'] }, count: { $sum: 1 } } },
      { $project: { _id: 0, location: '$_id', count: 1 } },
      { $sort: { count: -1, location: 1 } },
      { $limit: 8 },
    ]);
    res.json({ items });
  } catch (err) {
    next(err);
  }
};

exports.listComplaints = async (req, res, next) => {
  try {
    console.log("Running analytics query...");
    try {
      await processSlaBreaches();
    } catch (err) {
      console.error("COMPLAINT LIST PRECHECK ERROR:", err);
    }

    let settings = {};
    try {
      settings = await ensureSettings();
    } catch (err) {
      console.error("COMPLAINT LIST SETTINGS ERROR:", err);
      settings = {};
    }

    let filter = {};
    try {
      filter = complaintBaseQuery(req.query);
    } catch (err) {
      console.error("COMPLAINT FILTER ERROR:", err);
      filter = {};
    }

    const complaints = await Complaint.find(filter)
      .populate('user', 'name email phone')
      .populate('assignedTo', 'name email phone department role activeCases')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({
      items: complaints.map((complaint) => toComplaintDetail(complaint, settings)),
    });
  } catch (err) {
    console.error("COMPLAINT LIST ERROR:", err);
    res.status(200).json({ items: [] });
  }
};

exports.getOfficerWorkload = async (req, res, next) => {
  try {
    await syncOfficerActiveCases();
    const [officers, suggestedOfficer] = await Promise.all([
      User.find({ role: { $in: OFFICER_ROLES }, status: 'active' })
        .select('-password')
        .sort({ activeCases: 1, name: 1 })
        .lean(),
      findLeastBusyOfficer(),
    ]);

    res.json({
      items: officers,
      suggestedOfficer,
    });
  } catch (err) {
    next(err);
  }
};

exports.getMapComplaints = async (req, res, next) => {
  try {
    const filter = complaintBaseQuery(req.query);
    filter['coordinates.lat'] = { $ne: null };
    filter['coordinates.lng'] = { $ne: null };
    const items = await Complaint.find(filter)
      .select('receiptId title category status priority location coordinates createdAt')
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .lean();
    res.json({
      items: items.map((item) => ({
        ...item,
        location: getLocationLabel(item.location),
      })),
    });
  } catch (err) {
    next(err);
  }
};

exports.getMapData = async (req, res, next) => {
  try {
    const filter = complaintBaseQuery(req.query);
    filter['coordinates.lat'] = { $type: 'number' };
    filter['coordinates.lng'] = { $type: 'number' };

    const items = await Complaint.find(filter)
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 })
      .lean();

    res.json(items.map((item) => ({
      id: item._id?.toString(),
      lat: item.coordinates?.lat,
      lng: item.coordinates?.lng,
      title: item.title || 'Complaint',
      status: item.status || 'pending',
      category: item.category || 'Other',
      priority: normalizePriority(item.priority, item.description),
      assignedTo: item.assignedTo?.name || item.officerName || 'Unassigned',
      complaintId: item._id?.toString(),
      receiptId: item.receiptId,
      location: getLocationLabel(item.location),
    })));
  } catch (err) {
    next(err);
  }
};

exports.getHotspots = async (req, res) => {
  try {
    console.log('Running analytics query...');
    const items = await Complaint.aggregate(buildHotspotAggregation(complaintBaseQuery(req.query)));
    res.json(items);
  } catch (err) {
    console.error('HOTSPOT ERROR:', err);
    res.status(200).json([]);
  }
};

exports.getHeatmap = async (req, res) => {
  try {
    console.log('Running analytics query...');
    const filter = complaintBaseQuery(req.query);
    filter['coordinates.lat'] = { $type: 'number' };
    filter['coordinates.lng'] = { $type: 'number' };

    const complaints = await Complaint.find(filter)
      .select('receiptId title category priority status location coordinates createdAt description')
      .sort({ createdAt: -1 })
      .lean();

    res.json(complaints.map(toHeatmapPoint));
  } catch (err) {
    console.error('HEATMAP ERROR:', err);
    res.status(200).json([]);
  }
};

exports.getHotspotTrends = async (req, res) => {
  try {
    console.log('Running analytics query...');
    const baseFilter = hotspotFiltersWithoutDate(req.query);
    const now = new Date();
    const last24Start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const prev24Start = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const [recent, previous] = await Promise.all([
      Complaint.aggregate(buildHotspotAggregation({
        ...baseFilter,
        createdAt: { $gte: last24Start, $lte: now },
      })),
      Complaint.aggregate(buildHotspotAggregation({
        ...baseFilter,
        createdAt: { $gte: prev24Start, $lt: last24Start },
      })),
    ]);

    const previousMap = new Map(previous.map((item) => [
      `${item.location.lat}:${item.location.lng}`,
      item,
    ]));

    const compared = recent.map((item) => {
      const key = `${item.location.lat}:${item.location.lng}`;
      const before = previousMap.get(key);
      const previousCount = before?.count || 0;
      const change = item.count - previousCount;
      return {
        ...item,
        previousCount,
        change,
        trend: change > 0 ? 'increasing' : change < 0 ? 'decreasing' : 'stable',
        prediction: change > 0 ? 'next hotspot' : null,
      };
    });

    const missingRecent = previous
      .filter((item) => !recent.find((current) => current.location.lat === item.location.lat && current.location.lng === item.location.lng))
      .map((item) => ({
        ...item,
        previousCount: item.count,
        count: 0,
        change: -item.count,
        trend: 'decreasing',
        prediction: null,
      }));

    const all = [...compared, ...missingRecent];
    const increasingZones = all.filter((item) => item.change > 0).sort((a, b) => b.change - a.change);
    const decreasingZones = all.filter((item) => item.change < 0).sort((a, b) => a.change - b.change);
    const nextHotspots = increasingZones
      .map((item) => ({ ...item, classification: hotspotIntensity(item.count) }))
      .slice(0, 5);

    res.json({
      increasingZones,
      decreasingZones,
      nextHotspots,
    });
  } catch (err) {
    console.error('HOTSPOT TREND ERROR:', err);
    res.status(200).json({
      increasingZones: [],
      decreasingZones: [],
      nextHotspots: [],
    });
  }
};

exports.getInsights = async (req, res, next) => {
  try {
    const [commonCategory, complaintsPerArea, resolutionAgg] = await Promise.all([
      Complaint.aggregate([
        { $group: { _id: { $ifNull: ['$category', 'Other'] }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 },
      ]),
      Complaint.aggregate([
        { $group: { _id: { $ifNull: ['$location.label', 'Unknown'] }, count: { $sum: 1 } } },
        { $project: { _id: 0, area: '$_id', count: 1 } },
        { $sort: { count: -1, area: 1 } },
        { $limit: 10 },
      ]),
      Complaint.aggregate([
        { $match: { resolutionHours: { $ne: null } } },
        { $group: { _id: null, average: { $avg: '$resolutionHours' } } },
      ]),
    ]);

    res.json({
      mostCommonCategory: {
        category: commonCategory[0]?._id || 'N/A',
        count: commonCategory[0]?.count || 0,
      },
      complaintsPerArea,
      avgResolutionTime: Number((resolutionAgg[0]?.average || 0).toFixed(1)),
    });
  } catch (err) {
    next(err);
  }
};

exports.getAdminLogs = async (req, res, next) => {
  try {
    const items = await AdminLog.find({})
      .populate('adminId', 'name email role')
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();
    res.json({ items });
  } catch (err) {
    next(err);
  }
};

exports.listOfficers = async (req, res, next) => {
  try {
    await syncOfficerActiveCases();
    const officers = await User.find({ role: { $in: OFFICER_ROLES } })
      .select('name email department activeCases role status')
      .sort({ name: 1 })
      .lean();

    res.json({
      items: officers.map((officer) => ({
        _id: officer._id,
        name: officer.name,
        email: officer.email,
        department: officer.department || 'Operations',
        activeCases: officer.activeCases || 0,
        role: officer.role,
        status: officer.status,
      })),
    });
  } catch (err) {
    next(err);
  }
};

exports.createOfficer = async (req, res, next) => {
  try {
    const { name, email, password, department } = req.body || {};

    if (!name || !email || !password || !department) {
      return res.status(422).json({ message: 'Name, email, password and department are required' });
    }

    const existing = await User.findOne({ email: String(email).trim().toLowerCase() }).lean();
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const officer = await User.create({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      password: String(password),
      department: String(department).trim(),
      role: 'officer',
    });

    await logAdminAction(req.user.id, 'create-officer', { officerId: officer._id.toString(), email: officer.email });

    res.status(201).json({
      _id: officer._id,
      name: officer.name,
      email: officer.email,
      department: officer.department,
      activeCases: officer.activeCases || 0,
      role: officer.role,
    });
  } catch (err) {
    next(err);
  }
};

exports.getOfficer = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid officer id' });
    await syncOfficerActiveCases();
    const officer = await User.findById(id).select('-password').lean();
    if (!officer) return res.status(404).json({ message: 'Officer not found' });
    const complaints = await Complaint.find({ assignedTo: id })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('receiptId title category status priority createdAt')
      .lean();
    res.json({ ...officer, activeCases: officer.activeCases || 0, recentComplaints: complaints });
  } catch (err) {
    next(err);
  }
};

exports.listEscalations = async (req, res, next) => {
  try {
    const settings = await ensureSettings();
    const complaints = await Complaint.find({
      $or: [
        { status: 'escalated' },
        { priority: { $in: ['High', 'Critical'] }, status: { $ne: 'resolved' } },
      ],
    })
      .populate('assignedTo', 'name department phone email role')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    const items = complaints
      .map((complaint) => toComplaintDetail(complaint, settings))
      .filter((complaint) => complaint.status === 'escalated' || complaint.timeExceededHours > 0);

    const avgOverdue = items.length
      ? Number((items.reduce((sum, item) => sum + item.timeExceededHours, 0) / items.length).toFixed(1))
      : 0;

    res.json({
      items,
      summary: {
        activeEscalations: items.length,
        avgOverdueHours: avgOverdue,
        autoEscalatedToday: items.filter((item) => new Date(item.createdAt) >= startOfDay()).length,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.markComplaintRead = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    complaint.readAt = new Date();
    complaint.readBy = req.user.id;
    complaint.lifecycleStage = complaint.lifecycleStage === 'Filed' ? 'Verified' : complaint.lifecycleStage;
    addComplaintLog(complaint, {
      action: 'read',
      actor: req.user.id,
      message: 'Complaint opened by admin',
    });
    await complaint.save();
    await logAdminAction(req.user.id, 'complaint-read', { receiptId: complaint.receiptId }, complaint._id);
    res.json(complaint);
  } catch (err) {
    next(err);
  }
};

exports.assignComplaint = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { officerId } = req.body || {};
    if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(officerId)) {
      return res.status(400).json({ message: 'Invalid complaint or officer id' });
    }

    const [complaint, officer] = await Promise.all([
      Complaint.findById(id),
      User.findById(officerId).select('name email department role activeCases'),
    ]);

    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    if (!officer || !OFFICER_ROLES.includes(officer.role)) return res.status(404).json({ message: 'Officer not found' });

    const previousOfficerId = complaint.assignedTo?.toString() || null;
    complaint.assignedTo = officer._id;
    complaint.officerName = officer.name;
    complaint.status = complaint.status === 'pending' ? 'in-progress' : complaint.status;
    complaint.lifecycleStage = syncLifecycleStage(complaint, 'assign');
    complaint.priority = normalizePriority(complaint.priority, complaint.description);
    appendTimelineEntry(complaint, {
      action: 'assign',
      by: req.user.id,
      byName: req.user?.name || 'Admin',
      meta: { officerId: officer._id.toString(), officerName: officer.name },
    });
    addComplaintLog(complaint, {
      action: 'assign',
      actor: req.user.id,
      actorName: officer.name,
      message: `Assigned to ${officer.name}`,
      meta: { officerId: officer._id.toString() },
    });
    await complaint.save();
    await ensureHighPriorityAlert(complaint);
    if (previousOfficerId && previousOfficerId !== officer._id.toString()) {
      await User.updateOne({ _id: previousOfficerId }, { $inc: { activeCases: -1 } });
    }
    if (previousOfficerId !== officer._id.toString()) {
      await User.updateOne({ _id: officer._id }, { $inc: { activeCases: 1 } });
    }
    await syncOfficerActiveCases();
    await logAdminAction(req.user.id, 'assign-complaint', { receiptId: complaint.receiptId, officerId: officer._id.toString(), officerName: officer.name }, complaint._id);

    await createNotification(complaint.user, `Complaint ${complaint.receiptId} assigned to ${officer.name}.`);
    await createNotification(officer._id, `Complaint ${complaint.receiptId} assigned to you.`);
    await emitComplaintEvent('complaintUpdated', complaint._id.toString());
    res.json(complaint);
  } catch (err) {
    next(err);
  }
};

exports.updateComplaint = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid complaint id' });
    const complaint = await Complaint.findById(id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    const allowed = ['status', 'priority', 'remarks'];
    allowed.forEach((key) => {
      if (req.body?.[key] !== undefined) complaint[key] = req.body[key];
    });
    complaint.priority = normalizePriority(complaint.priority, complaint.description);

    if (req.body?.status === 'resolved') {
      complaint.resolvedAt = new Date();
      complaint.resolutionHours = Number(((complaint.resolvedAt.getTime() - new Date(complaint.createdAt).getTime()) / 36e5).toFixed(1));
    }
    if (req.body?.status === 'closed') {
      complaint.resolvedAt = complaint.resolvedAt || new Date();
    }
    if (req.body?.status && req.body.status !== 'resolved') {
      if (req.body.status !== 'closed') {
        complaint.resolvedAt = undefined;
        complaint.resolutionHours = null;
      }
    }
    complaint.lifecycleStage = syncLifecycleStage(complaint, 'update');

    appendTimelineEntry(complaint, {
      action: complaint.status === 'resolved' ? 'resolve' : 'update',
      by: req.user.id,
      byName: req.user?.name || 'Admin',
      meta: {
        status: complaint.status,
        priority: complaint.priority,
      },
    });
    addComplaintLog(complaint, {
      action: 'update',
      actor: req.user.id,
      message: `Complaint updated${req.body?.status ? ` to ${req.body.status}` : ''}`,
      meta: {
        status: complaint.status,
        priority: complaint.priority,
      },
    });
    await complaint.save();
    await ensureHighPriorityAlert(complaint);
    await ensureSlaBreachAlert(complaint);
    await syncOfficerActiveCases();
    await logAdminAction(req.user.id, 'update-complaint', { receiptId: complaint.receiptId, status: complaint.status, priority: complaint.priority }, complaint._id);
    await createNotification(complaint.user, `Complaint ${complaint.receiptId} updated to ${complaint.status}.`);
    await emitComplaintEvent('complaintUpdated', complaint._id.toString());
    res.json(complaint);
  } catch (err) {
    next(err);
  }
};

exports.escalateComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    complaint.status = 'escalated';
    complaint.lifecycleStage = syncLifecycleStage(complaint, 'escalate');
    complaint.escalationLevel = req.body?.level || 'L2 - Senior Officer';
    appendTimelineEntry(complaint, {
      action: 'escalate',
      by: req.user.id,
      byName: req.user?.name || 'Admin',
      meta: { escalationLevel: complaint.escalationLevel },
    });
    addComplaintLog(complaint, {
      action: 'escalate',
      actor: req.user.id,
      message: `Escalated to ${complaint.escalationLevel}`,
    });
    await complaint.save();
    await logAdminAction(req.user.id, 'escalate-complaint', { receiptId: complaint.receiptId, escalationLevel: complaint.escalationLevel }, complaint._id);
    await createNotification(complaint.user, `Complaint ${complaint.receiptId} escalated for priority review.`);
    await notifySmartAlert(complaint, 'escalation', `Complaint ${complaint.receiptId} escalated to ${complaint.escalationLevel}`);
    await emitComplaintEvent('complaintUpdated', complaint._id.toString());
    res.json(complaint);
  } catch (err) {
    next(err);
  }
};

exports.deleteComplaint = async (req, res, next) => {
  try {
    const deleted = await Complaint.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Complaint not found' });
    res.json({ message: 'Complaint deleted successfully' });
  } catch (err) {
    next(err);
  }
};

exports.shareComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('assignedTo', 'name email phone department')
      .lean();
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    await logAdminAction(req.user.id, 'share-complaint', { receiptId: complaint.receiptId, channel: req.body?.channel || 'json' }, complaint._id);
    res.json({
      sharedAt: new Date().toISOString(),
      channel: req.body?.channel || 'json',
      payload: {
        ...complaint,
        location: getLocationLabel(complaint.location),
      },
      message: `Case ${complaint.receiptId} prepared for sharing.`,
    });
  } catch (err) {
    next(err);
  }
};

exports.bulkComplaintAction = async (req, res, next) => {
  try {
    const { ids = [], action, officerId } = req.body || {};
    const complaintIds = ids.filter((id) => mongoose.isValidObjectId(id));
    if (!complaintIds.length || !action) {
      return res.status(422).json({ message: 'Complaint ids and action are required' });
    }

    const complaints = await Complaint.find({ _id: { $in: complaintIds } });
    if (!complaints.length) return res.status(404).json({ message: 'No complaints found' });

    if (action === 'export') {
      return res.json({
        items: complaints.map((complaint) => ({
          receiptId: complaint.receiptId,
          title: complaint.title,
          category: complaint.category,
          status: complaint.status,
          priority: complaint.priority,
          createdAt: complaint.createdAt,
          location: getLocationLabel(complaint.location),
        })),
      });
    }

    let officer = null;
    if (action === 'assign') {
      officer = officerId && mongoose.isValidObjectId(officerId)
        ? await User.findById(officerId).select('name department role')
        : await findLeastBusyOfficer();
      if (!officer) return res.status(404).json({ message: 'Officer not found' });
    }

    for (const complaint of complaints) {
      if (action === 'assign') {
        complaint.assignedTo = officer._id;
        complaint.officerName = officer.name;
        complaint.status = complaint.status === 'pending' ? 'in-progress' : complaint.status;
        appendTimelineEntry(complaint, {
          action: 'assign',
          by: req.user.id,
          byName: req.user?.name || 'Admin',
          meta: { officerId: officer._id.toString(), officerName: officer.name },
        });
      }
      if (action === 'close') {
        complaint.status = 'resolved';
        complaint.resolvedAt = new Date();
        complaint.resolutionHours = Number(((complaint.resolvedAt.getTime() - new Date(complaint.createdAt).getTime()) / 36e5).toFixed(1));
        appendTimelineEntry(complaint, {
          action: 'resolve',
          by: req.user.id,
          byName: req.user?.name || 'Admin',
        });
      }
      addComplaintLog(complaint, {
        action: `bulk-${action}`,
        actor: req.user.id,
        actorName: req.user?.name || 'Admin',
        message: `Bulk action executed: ${action}`,
      });
      // eslint-disable-next-line no-await-in-loop
      await complaint.save();
    }

    await syncOfficerActiveCases();
    await logAdminAction(req.user.id, `bulk-${action}`, { ids: complaintIds, officerId: officer?._id?.toString?.() || null });
    res.json({ message: `Bulk ${action} completed`, count: complaints.length });
  } catch (err) {
    next(err);
  }
};

exports.getComplaintMessages = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid complaint id' });
    const items = await ComplaintMessage.find({ complaint: id })
      .populate('sender', 'name email role')
      .sort({ createdAt: 1 })
      .lean();
    res.json({ items });
  } catch (err) {
    next(err);
  }
};

exports.postComplaintMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message } = req.body || {};
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid complaint id' });
    if (!message || !`${message}`.trim()) return res.status(422).json({ message: 'Message is required' });

    const complaint = await Complaint.findById(id).populate('user', '_id');
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    const created = await ComplaintMessage.create({
      complaint: complaint._id,
      sender: req.user.id,
      senderName: req.user?.name || 'Admin',
      senderRole: req.user?.role || 'admin',
      message: `${message}`.trim(),
    });

    appendTimelineEntry(complaint, {
      action: 'chat',
      by: req.user.id,
      byName: req.user?.name || 'Admin',
      meta: { preview: `${message}`.trim().slice(0, 80) },
    });
    addComplaintLog(complaint, {
      action: 'chat',
      actor: req.user.id,
      actorName: req.user?.name || 'Admin',
      message: 'Chat message posted',
    });
    await complaint.save();

    const payload = await ComplaintMessage.findById(created._id)
      .populate('sender', 'name email role')
      .lean();

    emitEvent('message', payload, { rooms: ['admins', complaint.user?._id?.toString?.()].filter(Boolean) });
    await logAdminAction(req.user.id, 'chat-message', { receiptId: complaint.receiptId }, complaint._id);
    res.status(201).json(payload);
  } catch (err) {
    next(err);
  }
};

exports.getReportData = async (req, res, next) => {
  try {
    const filter = complaintBaseQuery(req.query);
    const [complaints, statusAgg, categoryAgg, locationAgg] = await Promise.all([
      Complaint.find(filter).sort({ createdAt: -1 }).populate('user', 'name email').lean(),
      Complaint.aggregate([{ $match: filter }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Complaint.aggregate([{ $match: filter }, { $group: { _id: { $ifNull: ['$category', 'Other'] }, count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Complaint.aggregate([{ $match: filter }, { $group: { _id: { $ifNull: ['$location.label', 'Unknown'] }, count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 8 }]),
    ]);

    res.json({
      items: complaints.map((complaint) => ({
        ...complaint,
        location: getLocationLabel(complaint.location),
      })),
      summary: {
        total: complaints.length,
        dateRange: {
          start: req.query.start || null,
          end: req.query.end || null,
        },
        category: req.query.category || 'All',
      },
      status: STATUS_ORDER.map((label) => ({ label, count: statusAgg.find((item) => item._id === label)?.count || 0 })),
      categories: categoryAgg.map((item) => ({ label: item._id, count: item.count })),
      locations: locationAgg.map((item) => ({ label: item._id, count: item.count })),
    });
  } catch (err) {
    next(err);
  }
};

exports.getRecentFeedback = async (req, res, next) => {
  try {
    const items = await Feedback.find({})
      .populate('user', 'name email')
      .populate('complaint', 'receiptId title')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    res.json({ items });
  } catch (err) {
    next(err);
  }
};

exports.listUsers = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.q) {
      filter.$or = [
        { name: { $regex: req.query.q, $options: 'i' } },
        { email: { $regex: req.query.q, $options: 'i' } },
      ];
    }
    const users = await User.find(filter).select('-password').sort({ createdAt: -1 }).lean();
    const counts = await Complaint.aggregate([
      { $group: { _id: '$user', complaints: { $sum: 1 } } },
    ]);
    const map = new Map(counts.map((item) => [String(item._id), item.complaints]));
    res.json({
      items: users.map((user) => ({ ...user, complaints: map.get(String(user._id)) || 0 })),
    });
  } catch (err) {
    next(err);
  }
};

exports.getUser = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid user id' });
    const [user, complaints, notifications] = await Promise.all([
      User.findById(id).select('-password').lean(),
      Complaint.find({ user: id }).sort({ createdAt: -1 }).limit(20).lean(),
      Complaint.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(id) } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({
      ...user,
      complaintHistory: complaints.map((complaint) => ({
        ...complaint,
        location: getLocationLabel(complaint.location),
      })),
      complaintSummary: STATUS_ORDER.map((status) => ({
        status,
        count: notifications.find((item) => item._id === status)?.count || 0,
      })),
    });
  } catch (err) {
    next(err);
  }
};

exports.getUserComplaints = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid user id' });
    const complaints = await Complaint.find({ user: id }).sort({ createdAt: -1 }).lean();
    res.json({
      items: complaints.map((complaint) => ({
        ...complaint,
        location: getLocationLabel(complaint.location),
      })),
    });
  } catch (err) {
    next(err);
  }
};

exports.updateUserStatus = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { status } = req.body || {};
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid user id' });
    if (!['active', 'blocked'].includes(status)) return res.status(422).json({ message: 'Invalid status' });
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.status = status;
    addUserLog(user, {
      action: status === 'blocked' ? 'block' : 'unblock',
      actor: req.user.id,
      message: `Account ${status}`,
    });
    await user.save();
    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.resetUserPassword = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid user id' });
    const user = await User.findById(id).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const tempPassword = `Temp-${crypto.randomBytes(4).toString('hex')}`;
    user.password = tempPassword;
    addUserLog(user, {
      action: 'reset-password',
      actor: req.user.id,
      message: 'Password reset by admin',
    });
    await user.save();
    res.json({ message: 'Password reset successfully', temporaryPassword: tempPassword });
  } catch (err) {
    next(err);
  }
};

exports.getSettings = async (req, res, next) => {
  try {
    const settings = await ensureSettings();
    res.json(serializeSettings(settings));
  } catch (err) {
    next(err);
  }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const settings = await ensureSettings();
    if (req.body?.slaTime !== undefined) {
      settings.slaTime = Number(req.body.slaTime) || settings.slaTime;
      settings.sla.level1Hours = settings.slaTime;
      settings.sla.level2Hours = Math.max(settings.sla.level2Hours || settings.slaTime, settings.slaTime);
    }
    if (req.body?.notificationsEnabled !== undefined) {
      settings.notificationsEnabled = !!req.body.notificationsEnabled;
      settings.notifications.email = settings.notificationsEnabled;
      settings.notifications.sms = settings.notificationsEnabled;
    }
    if (req.body?.theme !== undefined) {
      settings.theme = `${req.body.theme || 'system'}`.trim() || 'system';
    }
    if (req.body?.notifications) {
      settings.notifications.email = req.body.notifications.email ?? settings.notifications.email;
      settings.notifications.sms = req.body.notifications.sms ?? settings.notifications.sms;
      settings.notifications.weekly = req.body.notifications.weekly ?? settings.notifications.weekly;
      settings.notificationsEnabled = !!(settings.notifications.email || settings.notifications.sms || settings.notifications.weekly);
    }
    if (req.body?.sla) {
      settings.sla.level1Hours = req.body.sla.level1Hours ?? settings.sla.level1Hours;
      settings.sla.level2Hours = req.body.sla.level2Hours ?? settings.sla.level2Hours;
      settings.slaTime = settings.sla.level1Hours;
    }
    if (req.body?.systemPreferences) {
      settings.systemPreferences.defaultPriority = req.body.systemPreferences.defaultPriority ?? settings.systemPreferences.defaultPriority;
      settings.systemPreferences.autoEscalation = req.body.systemPreferences.autoEscalation ?? settings.systemPreferences.autoEscalation;
      settings.systemPreferences.reportFormat = req.body.systemPreferences.reportFormat ?? settings.systemPreferences.reportFormat;
    }
    await settings.save();
    res.json(serializeSettings(settings));
  } catch (err) {
    next(err);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword || `${newPassword}`.length < 6) {
      return res.status(422).json({ message: 'Current password and a stronger new password are required' });
    }
    const user = await User.findById(req.user.id).select('+password');
    if (!user) return res.status(404).json({ message: 'Admin user not found' });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(401).json({ message: 'Current password is incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
};
