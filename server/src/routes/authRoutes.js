const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/login', authController.login);
router.get('/me', protect, authController.getMe);
router.get('/users', protect, authorize('ADMIN'), authController.getUsers);
router.post('/users', protect, authorize('ADMIN'), authController.createUser);

module.exports = router;
