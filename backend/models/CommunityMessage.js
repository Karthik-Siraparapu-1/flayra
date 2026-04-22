const mongoose = require('mongoose');

const CommunityMessageSchema = new mongoose.Schema({
  communityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    required: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String, // Can be encrypted on the client
    default: '',
  },
  imageUrl: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    enum: ['text', 'image', 'system'],
    default: 'text'
  }
}, { timestamps: true });

CommunityMessageSchema.index({ communityId: 1, createdAt: 1 });

module.exports = mongoose.model('CommunityMessage', CommunityMessageSchema);
