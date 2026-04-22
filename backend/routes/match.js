const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, matchController.getMatches);

module.exports = router;
