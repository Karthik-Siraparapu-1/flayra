const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  university: {
    type: String, // Extracted from email domain
    required: true,
  },
  nickname: {
    type: String,
    required: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
    required: true,
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true,
  },
  country: { type: String, default: '' },
  state: { type: String, default: '' },
  branch: { type: String, default: '' },
  academicYear: { type: String, default: '' },
  class: { type: String, default: '' },
  interests: [{ type: String }],
  hobbies: [{ type: String }],
  hometown: { type: String, default: '' },
  bio: { type: String, default: '' },
  socialLinks: {
    instagram: { type: String, default: '' },
    x: { type: String, default: '' },
    facebook: { type: String, default: '' }
  },
  profilePhotos: [{ type: String }], // URLs from Cloudinary
  followersCount: { type: Number, default: 0 },
  followingCount: { type: Number, default: 0 },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }, // [longitude, latitude]
  },
  mapVisibility: { type: Boolean, default: true },
  stats: {
    likes: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    shares: { type: Number, default: 0 }
  },
  auraType: {
    type: String,
    enum: ['Radiant Rose', 'Midnight Gold', 'Electric Violet', 'Classic Purple'],
    default: 'Classic Purple'
  },
  romanticIntent: {
    type: String,
    enum: ['Deep Conversations', 'Campus Soulmate', 'Late Night Vibes', 'Casual Connections', 'Not Sure Yet'],
    default: 'Campus Soulmate'
  },
  globalScore: { type: Number, default: 0 },
}, { timestamps: true });

// GeoJSON index for location-based queries
UserSchema.index({ location: '2dsphere' });
UserSchema.index({ globalScore: -1 });

module.exports = mongoose.model('User', UserSchema);
