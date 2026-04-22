const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  reelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reel',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Comment', CommentSchema);
