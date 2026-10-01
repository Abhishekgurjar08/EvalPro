const express = require('express');
const router = express.Router();
const scannerController = require('../controllers/scannerController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/status', scannerController.getScannerStatus);
router.post('/ingest/:examinationId', authorize('ADMIN'), scannerController.ingestScannedBatch);
router.post('/feed/:examinationId', authorize('ADMIN'), scannerController.triggerScannerFeed);

module.exports = router;
