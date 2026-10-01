const express = require('express');
const router = express.Router();
const syllabusController = require('../controllers/syllabusController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/exam/:examId', syllabusController.getSyllabusByExam);
router.post('/', authorize('ADMIN', 'EXAM_SETTER'), syllabusController.createOrUpdateSyllabus);

module.exports = router;
