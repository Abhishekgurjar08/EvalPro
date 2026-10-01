const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

// Feature 1: AI Question Paper Generation from Syllabus
router.post('/generate-paper', authorize('ADMIN', 'EXAM_SETTER'), aiController.generatePaperFromSyllabus);
router.post('/regenerate-question', authorize('ADMIN', 'EXAM_SETTER'), aiController.regenerateSingleQuestion);
router.post('/save-generated-paper', authorize('ADMIN', 'EXAM_SETTER'), aiController.saveGeneratedPaper);

// Feature 2: AI Answer Evaluation
router.post('/evaluate', authorize('ADMIN', 'EVALUATOR'), aiController.evaluateQuestionAnswer);
router.post('/decision', authorize('ADMIN', 'EVALUATOR'), aiController.recordEvaluatorDecision);

module.exports = router;
