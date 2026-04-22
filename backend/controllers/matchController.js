const Match = require('../models/Match');
const User = require('../models/User');

exports.getMatches = async (req, res) => {
  try {
    const userId = req.user._id;
    // Find matches where user is involved
    const matches = await Match.find({ users: userId })
      .sort({ lastMessageTimestamp: -1 })
      .populate('users', 'firstName lastName profilePhotos');

    // Format for frontend (extract 'otherUser')
    const formattedMatches = matches.map(match => {
      const otherUser = match.users.find(u => u._id.toString() !== userId.toString());
      return {
        matchId: match._id,
        lastMessage: match.lastMessage,
        lastMessageTimestamp: match.lastMessageTimestamp,
        otherUser
      };
    });

    res.json(formattedMatches);
  } catch (err) {
    console.error('Error fetching matches:', err);
    res.status(500).json({ error: 'Server error fetching matches' });
  }
};
