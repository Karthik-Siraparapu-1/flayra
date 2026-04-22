const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/profile', protect, userController.getProfile);
router.put('/update', protect, userController.updateProfile);
router.get('/nearby', protect, userController.getNearbyUsers);
router.get('/rankings', protect, userController.getRankings);
router.get('/analytics', protect, userController.getProfileAnalytics);
router.post('/report', protect, userController.reportUser);

module.exports = router;
