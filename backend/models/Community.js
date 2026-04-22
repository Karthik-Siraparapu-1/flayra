const mongoose = require('mongoose');

const CommunitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  type: {
    type: String,
    enum: ['Personal', 'College', 'Interest', 'Public'],
    default: 'Interest',
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  avatarImage: {
    type: String,
    default: '', // Cloudinary URL
  },
  bannerImage: {
    type: String,
    default: '', // Cloudinary URL
  },
  university: {
    type: String, // Optional, for college-specific filtering
    default: '',
  },
  isPrivate: {
    type: Boolean,
    default: false,
  },
  voiceCfg: {
    canStart: { type: String, enum: ['Anyone', 'Admin'], default: 'Anyone' },
    mode: { type: String, enum: ['Stage', 'GroupCall'], default: 'GroupCall' },
    isRecordable: { type: Boolean, default: true },
  },
  activeStage: {
    isActive: { type: Boolean, default: false },
    hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    speakers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    startTime: { type: Date }
  },
  lastMessage: {
    type: String,
    default: '',
  },
  lastMessageTimestamp: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

// Index for name-based search and university filtering
CommunitySchema.index({ name: 'text', university: 1 });

module.exports = mongoose.model('Community', CommunitySchema);
