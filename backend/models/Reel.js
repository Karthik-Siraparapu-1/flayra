const mongoose = require('mongoose');

const ReelSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  videoUrl: {
    type: String, // Cloudinary URL
    required: true,
  },
  caption: {
    type: String,
    default: '',
  },
  likes: {
    type: Number,
    default: 0,
  },
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  views: {
    type: Number,
    default: 0,
  },
  shares: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

ReelSchema.index({ createdAt: -1 }); // Fast sorting by newest

module.exports = mongoose.model('Reel', ReelSchema);
