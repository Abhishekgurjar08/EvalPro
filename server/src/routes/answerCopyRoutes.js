const express = require('express');
const router = express.Router();
const answerCopyController = require('../controllers/answerCopyController');
const annotationController = require('../controllers/annotationController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', answerCopyController.getAnswerCopies);
router.get('/subject-stats', authorize('ADMIN'), answerCopyController.getSubjectWiseScannedStats);
router.get('/my-assigned', authorize('EVALUATOR'), answerCopyController.getMyAssignedCopies);
router.get('/:id', answerCopyController.getAnswerCopyById);

// Evaluator Remarks & Annotation Endpoints
router.get('/:id/annotations', authorize('ADMIN', 'EVALUATOR'), annotationController.getAnnotations);
router.put('/:id/annotations', authorize('ADMIN', 'EVALUATOR'), annotationController.saveAnnotations);
router.post('/:id/annotations', authorize('ADMIN', 'EVALUATOR'), annotationController.saveAnnotations);
router.delete('/:id/annotations/page/:pageNumber', authorize('ADMIN', 'EVALUATOR'), annotationController.clearPageAnnotations);

// Post-Examination Scanning & Mode Locking Endpoints
router.post('/scan-upload/:examinationId', authorize('ADMIN'), answerCopyController.uploadScannedCopies);
router.put('/:examinationId/complete-scanning', authorize('ADMIN'), answerCopyController.markScanningCompleted);
router.put('/:examinationId/select-evaluation-mode', authorize('ADMIN'), answerCopyController.selectEvaluationMode);
router.put('/:examinationId/lock-evaluation-mode', authorize('ADMIN'), answerCopyController.lockEvaluationMode);
router.put('/:examinationId/set-evaluation-method', authorize('ADMIN'), answerCopyController.setEvaluationMethod);

// Evaluator Assignment Endpoints
router.post('/:examinationId/assign', authorize('ADMIN'), answerCopyController.assignCopiesToEvaluator);
router.post('/:id/reassign', authorize('ADMIN'), answerCopyController.reassignCopy);

// AI Checking and Admin Mark Review Endpoints
router.post('/:examinationId/start-ai-evaluation', authorize('ADMIN'), answerCopyController.startAiEvaluation);
router.post('/:id/ai-evaluate', authorize('ADMIN'), answerCopyController.evaluateSingleCopyAi);
router.post('/:id/retry-question-ai', authorize('ADMIN', 'EVALUATOR'), answerCopyController.retryQuestionAi);
router.put('/:id/admin-save-marks', authorize('ADMIN'), answerCopyController.saveAdminFinalMarks);

router.delete('/:id', authorize('ADMIN'), answerCopyController.deleteAnswerCopy);

module.exports = router;
