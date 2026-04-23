const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const adminController = require('../controllers/adminController');

router.use(auth, authorize('admin'));

router.get('/analytics/overview', adminController.getOverview);
router.get('/analytics/categories', adminController.getCategoryAnalytics);
router.get('/analytics/category', adminController.getCategoryAnalytics);
router.get('/analytics/status', adminController.getStatusAnalytics);
router.get('/analytics/trend', adminController.getTrendAnalytics);
router.get('/analytics/location', adminController.getLocationAnalytics);
router.get('/analytics/insights', adminController.getInsights);
router.get('/analytics/officer-performance', adminController.getOfficerPerformance);
router.get('/hotspots', adminController.getHotspots);
router.get('/heatmap', adminController.getHeatmap);
router.get('/hotspots/trends', adminController.getHotspotTrends);
router.get('/map-data', adminController.getMapData);

router.post('/officers', adminController.createOfficer);
router.get('/officers', adminController.listOfficers);
router.get('/officers/workload', adminController.getOfficerWorkload);
router.get('/officers/:id', adminController.getOfficer);

router.get('/escalations', adminController.listEscalations);
router.get('/complaints', adminController.listComplaints);
router.get('/complaints/map', adminController.getMapComplaints);
router.post('/complaints/bulk', adminController.bulkComplaintAction);
router.get('/complaints/:id/messages', adminController.getComplaintMessages);
router.post('/complaints/:id/messages', adminController.postComplaintMessage);

router.patch('/complaints/:id/read', adminController.markComplaintRead);
router.patch('/complaints/:id/assign', adminController.assignComplaint);
router.patch('/complaints/:id', adminController.updateComplaint);
router.patch('/complaints/:id/escalate', adminController.escalateComplaint);
router.delete('/complaints/:id', adminController.deleteComplaint);
router.post('/complaints/:id/share', adminController.shareComplaint);

router.get('/reports', adminController.getReportData);
router.get('/feedback', adminController.getRecentFeedback);

router.get('/users', adminController.listUsers);
router.get('/users/:id', adminController.getUser);
router.get('/users/:id/complaints', adminController.getUserComplaints);
router.patch('/users/:id/status', adminController.updateUserStatus);
router.post('/users/:id/reset-password', adminController.resetUserPassword);

router.get('/settings', adminController.getSettings);
router.patch('/settings', adminController.updateSettings);
router.patch('/change-password', adminController.changePassword);
router.patch('/settings/password', adminController.changePassword);
router.get('/logs', adminController.getAdminLogs);

module.exports = router;
