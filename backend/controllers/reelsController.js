const Reel = require('../models/Reel');
const User = require('../models/User');
const SecurityService = require('../services/SecurityService');
const ReelDiscoveryService = require('../services/ReelDiscoveryService');

exports.uploadReel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    const { caption } = req.body;
    
    const newReel = new Reel({
      userId: req.user._id,
      videoUrl: req.file.path, // Cloudinary URL
      caption: caption ? SecurityService.filterText(caption) : ''
    });

    await newReel.save();
    res.status(201).json({ message: 'Reel uploaded successfully', reel: newReel });
  } catch (err) {
    console.error('Error uploading reel:', err);
    res.status(500).json({ error: 'Server error during reel upload' });
  }
};

exports.getReelsFeed = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const currentUser = await User.findById(currentUserId);
    
    // 1. Fetch potential reels pool (Elite: Top 50 most recent)
    const reelsPool = await Reel.find()
      .populate('userId', 'nickname firstName profilePhotos username branch')
      .sort({ createdAt: -1 })
      .limit(50);

    // 2. Perform AI-Driven Hybrid Ranking (Semantic Similarity + Recency)
    const rankedFeed = ReelDiscoveryService.rankReels(currentUser, reelsPool);

    // Return the top 20 most relevant reels
    res.json(rankedFeed.slice(0, 20));
  } catch (err) {
    console.error('Error fetching reels feed:', err);
    res.status(500).json({ error: 'Server error fetching reels feed' });
  }
};

exports.likeReel = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const reel = await Reel.findById(id);
    if (!reel) return res.status(404).json({ error: 'Reel not found' });

    const isLiked = reel.likedBy.includes(userId);

    if (isLiked) {
      // Unlike
      reel.likedBy = reel.likedBy.filter(uid => uid.toString() !== userId.toString());
      reel.likes = Math.max(0, (reel.likes || 0) - 1);
    } else {
      // Like
      reel.likedBy.push(userId);
      reel.likes = (reel.likes || 1) + 1; // Basic increment, but logic could be better
      // Reset to correct count from array for consistency
      reel.likes = reel.likedBy.length;
    }

    await reel.save();
    res.json({ liked: !isLiked, likesCount: reel.likes });
  } catch (err) {
    console.error('Error liking reel:', err);
    res.status(500).json({ error: 'Server error during reel like action' });
  }
};
