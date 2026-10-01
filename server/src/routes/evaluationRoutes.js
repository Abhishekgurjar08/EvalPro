const express = require('express');
const router = express.Router();
const evaluationController = require('../controllers/evaluationController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/save-draft', authorize('ADMIN', 'EVALUATOR'), evaluationController.saveDraftEvaluation);
router.post('/submit', authorize('ADMIN', 'EVALUATOR'), evaluationController.submitFinalEvaluation);
router.post('/approve-ai', authorize('ADMIN', 'EVALUATOR'), evaluationController.approveAiEvaluation);
router.get('/history', authorize('ADMIN', 'EVALUATOR'), evaluationController.getEvaluationHistory);

module.exports = router;
