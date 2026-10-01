const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router
  .route('/')
  .get(examController.getExaminations)
  .post(authorize('ADMIN'), examController.createExamination);

router
  .route('/:id')
  .get(examController.getExaminationById)
  .put(authorize('ADMIN'), examController.updateExamination)
  .delete(authorize('ADMIN'), examController.deleteExamination);

router.post('/:id/assign-setter', authorize('ADMIN'), examController.assignSetter);
router.post('/:id/setter-response', authorize('EXAM_SETTER'), examController.setterResponse);

module.exports = router;
