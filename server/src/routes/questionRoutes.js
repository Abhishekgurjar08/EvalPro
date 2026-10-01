const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router
  .route('/')
  .get(questionController.getQuestions)
  .post(authorize('ADMIN', 'EXAM_SETTER'), questionController.createQuestion);

router.get('/subjects', questionController.getSubjects);

router
  .route('/:id')
  .get(questionController.getQuestionById)
  .put(authorize('ADMIN', 'EXAM_SETTER'), questionController.updateQuestion)
  .delete(authorize('ADMIN', 'EXAM_SETTER'), questionController.deleteQuestion);

module.exports = router;
