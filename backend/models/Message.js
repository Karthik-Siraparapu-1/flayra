const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String, // Ideally client-side encrypted
    default: '',
  },
  imageUrl: {
    type: String, // Cloudinary URL for image sharing
    default: '',
  },
  voiceUrl: {
    type: String, // Voice notes
    default: '',
  },
  read: {
    type: Boolean,
    default: false,
  }
}, { timestamps: true });

MessageSchema.index({ matchId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', MessageSchema);
