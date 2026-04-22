const express = require('express');
const router = express.Router();
const reelsController = require('../controllers/reelsController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

router.post('/upload', protect, upload.single('video'), reelsController.uploadReel);
router.get('/', protect, reelsController.getReelsFeed);
router.post('/:id/like', protect, reelsController.likeReel);

module.exports = router;
