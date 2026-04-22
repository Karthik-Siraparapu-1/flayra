const express = require('express');
const router = express.Router();
const communityController = require('../controllers/communityController');
const auth = require('../middleware/auth'); // Assuming auth middleware exists

router.post('/', auth, communityController.createCommunity);
router.get('/', auth, communityController.getCommunities);
router.get('/:id', auth, communityController.getCommunityById);
router.post('/:id/join', auth, communityController.joinCommunity);
router.post('/:id/leave', auth, communityController.leaveCommunity);
router.get('/:id/messages', auth, communityController.getCommunityMessages);

module.exports = router;
