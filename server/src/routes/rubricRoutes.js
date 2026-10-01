const express = require('express');
const router = express.Router();
const rubricController = require('../controllers/rubricController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/question/:questionId', rubricController.getRubricByQuestion);
router.post('/', authorize('ADMIN', 'EXAM_SETTER'), rubricController.createOrUpdateRubric);

module.exports = router;
