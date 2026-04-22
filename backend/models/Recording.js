const mongoose = require('mongoose');

const RecordingSchema = new mongoose.Schema({
  communityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  speakers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  participantCount: {
    type: Number,
    default: 0,
  },
  duration: {
    type: Number, // In seconds
    default: 0,
  },
  audioUrl: {
    type: String, // URL to the recording file
    default: '',
  },
  isLive: {
    type: Boolean,
    default: false, // Tracks if currently recording
  }
}, { timestamps: true });

RecordingSchema.index({ communityId: 1, createdAt: -1 });

module.exports = mongoose.model('Recording', RecordingSchema);
