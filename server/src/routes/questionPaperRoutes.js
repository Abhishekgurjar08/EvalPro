const express = require('express');
const router = express.Router();
const questionPaperController = require('../controllers/questionPaperController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router
  .route('/')
  .get(questionPaperController.getQuestionPapers)
  .post(authorize('ADMIN', 'EXAM_SETTER'), questionPaperController.createOrUpdateQuestionPaper);

router
  .route('/:id')
  .get(questionPaperController.getQuestionPaperById)
  .put(authorize('ADMIN', 'EXAM_SETTER'), questionPaperController.createOrUpdateQuestionPaper);

router.post('/:id/submit', authorize('ADMIN', 'EXAM_SETTER'), questionPaperController.submitQuestionPaper);
router.post('/:id/review', authorize('ADMIN'), questionPaperController.reviewQuestionPaper);

module.exports = router;
