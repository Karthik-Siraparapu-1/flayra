const express = require('express');
const router = express.Router();
const discoverController = require('../controllers/discoverController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, discoverController.getDiscoverUsers);

module.exports = router;
