const express = require('express');
const router = express.Router();
const recordingController = require('../controllers/recordingController');
const auth = require('../middleware/auth');

router.get('/community/:id', auth, recordingController.getCommunityRecordings);
router.post('/', auth, recordingController.startRecording);
router.put('/:id/end', auth, recordingController.endRecording);
router.delete('/:id', auth, recordingController.deleteRecording);

module.exports = router;
