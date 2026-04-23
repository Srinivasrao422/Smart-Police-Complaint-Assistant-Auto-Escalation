const Complaint = require('../models/Complaint');

exports.getDashboard = async (req, res, next) => {
  try {
    const officerId = req.user.id;

    const complaints = await Complaint.find({ assignedTo: officerId })
      .populate('user', 'name email phone')
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean();

    const assignedComplaints = complaints.map((complaint) => ({
      ...complaint,
      assignedOfficer: complaint.officerName || req.user.name || 'Officer',
    }));

    const statusUpdates = assignedComplaints
      .flatMap((complaint) =>
        (complaint.timeline || []).map((entry) => ({
          complaintId: complaint._id,
          receiptId: complaint.receiptId,
          title: complaint.title || 'Complaint',
          status: complaint.status,
          action: entry.action,
          time: entry.time || entry.createdAt,
          byName: entry.byName || 'System',
        }))
      )
      .sort((a, b) => new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime())
      .slice(0, 20);

    res.json({
      assignedComplaints,
      statusUpdates,
      summary: {
        totalAssigned: assignedComplaints.length,
        pending: assignedComplaints.filter((item) => item.status === 'pending').length,
        inProgress: assignedComplaints.filter((item) => item.status === 'in-progress').length,
        resolved: assignedComplaints.filter((item) => item.status === 'resolved').length,
      },
    });
  } catch (err) {
    next(err);
  }
};
