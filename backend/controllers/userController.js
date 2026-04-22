const User = require('../models/User');
const Report = require('../models/Report');
const SecurityService = require('../services/SecurityService');
const CacheService = require('../services/CacheService');
const SpatialService = require('../services/SpatialService');
const AnalyticsService = require('../services/AnalyticsService');

// GET /user/profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching profile' });
  }
};

// PUT /user/update
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Allow updates to editable fields
    // Non-editable: email, firstName, lastName, age, gender (usually)
    const {
      nickname,
      country,
      state,
      branch,
      academicYear,
      class: userClass,
      interests,
      hobbies,
      hometown,
      bio,
      socialLinks,
      profilePhotos, // Assuming clients directly upload to Cloudinary and send URLs
      location,
      mapVisibility,
      auraType,
      romanticIntent
    } = req.body;

    if (nickname) user.nickname = SecurityService.filterText(nickname);
    if (country !== undefined) user.country = country;
    if (state !== undefined) user.state = state;
    if (branch !== undefined) user.branch = branch;
    if (academicYear !== undefined) user.academicYear = academicYear;
    if (userClass !== undefined) user.class = userClass;
    if (interests) user.interests = interests;
    if (hobbies) user.hobbies = hobbies;
    if (hometown !== undefined) user.hometown = hometown;
    if (bio !== undefined) user.bio = SecurityService.filterText(bio);
    if (socialLinks) user.socialLinks = socialLinks;
    if (profilePhotos) user.profilePhotos = profilePhotos;
    if (auraType) user.auraType = auraType;
    if (romanticIntent) user.romanticIntent = romanticIntent;
    if (location) {
      user.location = location; // { type: 'Point', coordinates: [lng, lat] }
      // Update Precision QuadTree in real-time
      SpatialService.insertUser(user._id, location.coordinates[0], location.coordinates[1], { firstName: user.firstName, age: user.age });
    }
    if (mapVisibility !== undefined) user.mapVisibility = mapVisibility;

    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error updating profile' });
  }
};

// GET /user/nearby
exports.getNearbyUsers = async (req, res) => {
  try {
    const { lng, lat, radius = 0.01 } = req.query; // default small radius in degrees

    if (!lng || !lat) {
      return res.status(400).json({ error: 'Longitude and latitude are required' });
    }

    // 1. Precise Quadtree Query (In-Memory Elite Performance)
    const nearbyPoints = SpatialService.queryNearby(
        parseFloat(lng), 
        parseFloat(lat), 
        parseFloat(radius), 
        parseFloat(radius)
    );

    // Map Quadtree points to Response format
    const results = nearbyPoints.map(p => ({
        _id: p.userData.userId,
        firstName: p.userData.firstName,
        age: p.userData.age,
        location: { type: 'Point', coordinates: [p.x, p.y] }
    }));

    res.json(results);
  } catch (err) {
    console.error('Error fetching nearby users:', err);
    res.status(500).json({ error: 'Server error fetching nearby users' });
  }
};

// GET /user/rankings
exports.getRankings = async (req, res) => {
  try {
    // 1. Check Elite Cache First (Sub-ms Latency)
    const cachedRankings = CacheService.get('rankings_global');
    if (cachedRankings) {
        console.log('[CACHE] Served rankings from memory');
        return res.json(cachedRankings);
    }

    // 2. Cache Miss: Perform Database Query (Heavy Operation)
    console.log('[CACHE] Miss - Re-calculating Rankings');
    const topUsers = await User.find({})
      .sort({ globalScore: -1 })
      .limit(100)
      .select('firstName lastName university profilePhotos globalScore stats followersCount');

    const rankedUsers = topUsers.map(u => {
      // Use the Elite Standard Impact Score
      const score = AnalyticsService.calculateImpactScore(u);
        
      return {
        _id: u._id,
        firstName: u.firstName,
        lastName: u.lastName,
        university: u.university,
        profilePhotos: u.profilePhotos,
        score: score
      };
    }).sort((a,b) => b.score - a.score);

    // 3. Store in Cache for 1 Hour (3600s)
    CacheService.set('rankings_global', rankedUsers, 3600);

    res.json(rankedUsers);
  } catch (err) {
    console.error('Error fetching rankings:', err);
    res.status(500).json({ error: 'Server error fetching rankings' });
  }
};

// POST /user/report
exports.reportUser = async (req, res) => {
  try {
    const { reportedUserId, reason } = req.body;
    const reporterId = req.user._id;

    if (!reportedUserId || !reason) {
      return res.status(400).json({ error: 'reportedUserId and reason are required' });
    }

    const newReport = new Report({
      reporterId,
      reportedUserId,
      reason
    });

    await newReport.save();
    res.status(201).json({ message: 'User reported successfully' });
  } catch (err) {
    console.error('Error reporting user:', err);
    res.status(500).json({ error: 'Server error reporting user' });
  }
};

// GET /user/analytics
exports.getProfileAnalytics = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // 1. Calculate Elite Social Insights
    const insights = await AnalyticsService.getSocialInsights(user);

    res.json(insights);
  } catch (err) {
    console.error('Error fetching analytics:', err);
    res.status(500).json({ error: 'Server error fetching analytics' });
  }
};
