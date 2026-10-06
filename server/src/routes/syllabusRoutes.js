const express = require('express');
const router = express.Router();
const syllabusController = require('../controllers/syllabusController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', syllabusController.getSyllabi);
router.get('/exam/:examId', syllabusController.getSyllabusByExam);
router.post('/', authorize('ADMIN'), syllabusController.createOrUpdateSyllabus);

module.exports = router;
