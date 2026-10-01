const express = require('express');
const router = express.Router();
const studentExamController = require('../controllers/studentExamController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/available', studentExamController.getAvailableExams);
router.post('/:id/start', authorize('STUDENT', 'ADMIN'), studentExamController.startExam);
router.post('/save-draft', authorize('STUDENT', 'ADMIN'), studentExamController.saveDraftAnswers);
router.post('/submit', authorize('STUDENT', 'ADMIN'), studentExamController.submitExam);
router.get('/my-attempts', authorize('STUDENT', 'ADMIN'), studentExamController.getMyAttempts);

module.exports = router;
