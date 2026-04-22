const Message = require('../models/Message');

exports.getMessages = async (req, res) => {
  try {
    const { matchId } = req.params;
    
    // Make sure to paginate this later, for MVP getting all or last 50
    const messages = await Message.find({ matchId })
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ error: 'Server error fetching messages' });
  }
};
