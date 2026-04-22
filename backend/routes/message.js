const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.get('/:matchId', protect, messageController.getMessages);

module.exports = router;
