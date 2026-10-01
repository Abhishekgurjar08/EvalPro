const express = require('express');
const router = express.Router();
const blueprintController = require('../controllers/blueprintController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/exam/:examId', blueprintController.getBlueprintByExam);
router.post('/', authorize('ADMIN', 'EXAM_SETTER'), blueprintController.createOrUpdateBlueprint);

module.exports = router;
