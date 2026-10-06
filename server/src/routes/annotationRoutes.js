const express = require('express');
const router = express.Router();
const annotationController = require('../controllers/annotationController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/:copyId', authorize('ADMIN', 'EVALUATOR'), annotationController.getAnnotations);
router.put('/:copyId', authorize('ADMIN', 'EVALUATOR'), annotationController.saveAnnotations);
router.post('/:copyId', authorize('ADMIN', 'EVALUATOR'), annotationController.saveAnnotations);
router.delete('/:copyId/page/:pageNumber', authorize('ADMIN', 'EVALUATOR'), annotationController.clearPageAnnotations);
router.delete('/item/:id', authorize('ADMIN', 'EVALUATOR'), annotationController.deleteAnnotation);

module.exports = router;
