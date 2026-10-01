const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/dashboard-stats', authorize('ADMIN'), reportController.getAdminDashboardStats);
router.get('/comprehensive', authorize('ADMIN'), reportController.getComprehensiveReports);

module.exports = router;
