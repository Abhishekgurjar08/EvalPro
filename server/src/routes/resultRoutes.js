const express = require('express');
const router = express.Router();
const resultController = require('../controllers/resultController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', resultController.getResults);
router.post('/publish/:examinationId', authorize('ADMIN'), resultController.publishResults);
router.get('/:id', resultController.getStudentResultDetails);

module.exports = router;
