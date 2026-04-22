const Recording = require('../models/Recording');
const Community = require('../models/Community');

// Get recordings for a community
exports.getCommunityRecordings = async (req, res) => {
  try {
    const { id } = req.params;
    const recordings = await Recording.find({ communityId: id })
      .populate('hostId', 'firstName lastName profilePhotos')
      .populate('speakers', 'firstName profilePhotos')
      .sort({ createdAt: -1 });
    
    res.json(recordings);
  } catch (err) {
    console.error('Error fetching recordings:', err);
    res.status(500).json({ error: 'Server error fetching recordings' });
  }
};

// Start a recording (Metadata entry)
exports.startRecording = async (req, res) => {
  try {
    const { communityId, title, speakers, isLive } = req.body;
    const hostId = req.user.id || req.user._id;

    const newRecording = new Recording({
      communityId,
      title,
      hostId,
      speakers: speakers || [hostId],
      isLive: true
    });

    await newRecording.save();
    res.status(201).json(newRecording);
  } catch (err) {
    console.error('Error starting recording:', err);
    res.status(500).json({ error: 'Server error starting recording' });
  }
};

// End a recording and save final metadata
exports.endRecording = async (req, res) => {
  try {
    const { id } = req.params;
    const { duration, audioUrl, participantCount } = req.body;
    
    const recording = await Recording.findById(id);
    if (!recording) return res.status(404).json({ error: 'Recording not found' });

    // Check permissions (Admin or Host)
    const community = await Community.findById(recording.communityId);
    const userId = req.user.id || req.user._id;
    
    if (recording.hostId.toString() !== userId.toString() && community.admin.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Not authorized to end this recording' });
    }

    recording.duration = duration;
    recording.audioUrl = audioUrl;
    recording.participantCount = participantCount;
    recording.isLive = false;
    
    await recording.save();
    res.json(recording);
  } catch (err) {
    console.error('Error ending recording:', err);
    res.status(500).json({ error: 'Server error ending recording' });
  }
};

// Delete a recording
exports.deleteRecording = async (req, res) => {
  try {
    const { id } = req.params;
    const recording = await Recording.findById(id);
    if (!recording) return res.status(404).json({ error: 'Recording not found' });

    const community = await Community.findById(recording.communityId);
    const userId = req.user.id || req.user._id;

    // Both Admin and original Host can delete
    if (recording.hostId.toString() !== userId.toString() && community.admin.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this vibe' });
    }

    await Recording.findByIdAndDelete(id);
    res.json({ message: 'Vibe deleted successfully' });
  } catch (err) {
    console.error('Error deleting recording:', err);
    res.status(500).json({ error: 'Server error deleting recording' });
  }
};
