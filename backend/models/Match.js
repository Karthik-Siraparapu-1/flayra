const mongoose = require('mongoose');

const MatchSchema = new mongoose.Schema({
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }],
  lastMessage: {
    type: String,
    default: '',
  },
  lastMessageTimestamp: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

// Indexes to quickly find matches for a given user
MatchSchema.index({ users: 1 });

module.exports = mongoose.model('Match', MatchSchema);
