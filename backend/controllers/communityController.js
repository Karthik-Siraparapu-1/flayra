const Community = require('../models/Community');
const CommunityMessage = require('../models/CommunityMessage');
const User = require('../models/User');

// Create a new community
exports.createCommunity = async (req, res) => {
  try {
    const { name, description, type, isPrivate, university, voiceCfg } = req.body;
    const admin = req.user.id || req.user._id;

    const newCommunity = new Community({
      name,
      description,
      type,
      isPrivate,
      university: university || req.user.university,
      admin,
      members: [admin], // Admin is the first member
      voiceCfg: voiceCfg || {
        canStart: 'Anyone',
        mode: 'GroupCall',
        isRecordable: true
      }
    });

    await newCommunity.save();
    res.status(201).json(newCommunity);
  } catch (err) {
    console.error('Error creating community:', err);
    res.status(500).json({ error: 'Server error creating community' });
  }
};

// Get all communities available to the user
exports.getCommunities = async (req, res) => {
  try {
    const userUniversity = req.user.university;
    
    // Fetch communities that are either:
    // 1. Not university-locked
    // 2. Locked to the user's university
    // 3. User is already a member
    const communities = await Community.find({
      $or: [
        { university: '' },
        { university: userUniversity },
        { members: req.user.id || req.user._id }
      ]
    }).sort({ lastMessageTimestamp: -1 });

    res.json(communities);
  } catch (err) {
    console.error('Error fetching communities:', err);
    res.status(500).json({ error: 'Server error fetching communities' });
  }
};

// Get single community details
exports.getCommunityById = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate('members', 'firstName lastName profilePhotos nickname university')
      .populate('admin', 'firstName lastName nickname');
    
    if (!community) return res.status(404).json({ error: 'Community not found' });
    
    res.json(community);
  } catch (err) {
    console.error('Error fetching community:', err);
    res.status(500).json({ error: 'Server error fetching community' });
  }
};

// Join a community
exports.joinCommunity = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const community = await Community.findById(req.params.id);
    
    if (!community) return res.status(404).json({ error: 'Community not found' });
    
    if (community.members.includes(userId)) {
      return res.status(400).json({ error: 'Already a member' });
    }

    community.members.push(userId);
    await community.save();
    
    res.json({ message: 'Joined successfully', community });
  } catch (err) {
    console.error('Error joining community:', err);
    res.status(500).json({ error: 'Server error joining community' });
  }
};

// Leave a community
exports.leaveCommunity = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const community = await Community.findById(req.params.id);
    
    if (!community) return res.status(404).json({ error: 'Community not found' });
    
    if (community.admin.toString() === userId.toString()) {
      return res.status(400).json({ error: 'Admin cannot leave. Please delete or transfer ownership.' });
    }

    community.members = community.members.filter(m => m.toString() !== userId.toString());
    await community.save();
    
    res.json({ message: 'Left successfully' });
  } catch (err) {
    console.error('Error leaving community:', err);
    res.status(500).json({ error: 'Server error leaving community' });
  }
};

// Get community messages
exports.getCommunityMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const messages = await CommunityMessage.find({ communityId: id })
      .populate('senderId', 'firstName lastName nickname profilePhotos')
      .sort({ createdAt: 1 })
      .limit(100); // Limit to last 100 for performance
      
    res.json(messages);
  } catch (err) {
    console.error('Error fetching community messages:', err);
    res.status(500).json({ error: 'Server error fetching messages' });
  }
};
