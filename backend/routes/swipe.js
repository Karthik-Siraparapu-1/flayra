const express = require('express');
const router = express.Router();
const swipeController = require('../controllers/swipeController');
const { protect } = require('../middleware/authMiddleware');
const { limitStrict } = require('../middleware/RateLimitMiddleware');

router.post('/', protect, limitStrict, swipeController.swipeAction);

module.exports = router;
