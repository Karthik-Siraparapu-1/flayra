const mongoose = require('mongoose');

const SwipeSchema = new mongoose.Schema({
  swiperId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  swipedOnId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['right', 'left'],
    required: true,
  }
}, { timestamps: true });

// Prevent duplicate swipes and optimize lookups
SwipeSchema.index({ swiperId: 1, swipedOnId: 1 }, { unique: true });
SwipeSchema.index({ swiperId: 1, type: 1 });
SwipeSchema.index({ swipedOnId: 1, type: 1 });

module.exports = mongoose.model('Swipe', SwipeSchema);
