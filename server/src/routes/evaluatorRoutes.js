const express = require('express');
const router = express.Router();
const evaluatorController = require('../controllers/evaluatorController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router
  .route('/')
  .get(authorize('ADMIN'), evaluatorController.getEvaluators)
  .post(authorize('ADMIN'), evaluatorController.createEvaluator);

router.put('/:id', authorize('ADMIN'), evaluatorController.updateEvaluator);
router.post('/assign-copies', authorize('ADMIN'), evaluatorController.assignCopiesToEvaluator);

module.exports = router;
