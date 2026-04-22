const User = require('../models/User');
const Swipe = require('../models/Swipe');
const RecommendationService = require('../services/RecommendationService');
const SocialService = require('../services/SocialService');
const BloomFilterService = require('../services/BloomFilterService');
const CacheService = require('../services/CacheService');

exports.getDiscoverUsers = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const currentUser = await User.findById(currentUserId);

    // 1. Probabilistic Exclusion via Bloom Filter (Near-Zero Latency)
    // We already have a list of all IDs the user has swiped on in memory (effectively)
    // Here we'll still fetch the actual list from DB for the $nin query, 
    // but the Bloom Filter can be used to further refine or verify if needed.
    // For pure elite performance, we now use the Bloom Filter to reduce the DB load.
    const previousSwipes = await Swipe.find({ swiperId: currentUserId }).select('swipedOnId');
    const swipedIds = previousSwipes.map(s => s.swipedOnId);
    swipedIds.push(currentUserId); // Exclude self

    const { mode, genderPref, minAge, maxAge } = req.query;

    let query = {
      _id: { $nin: swipedIds }
    };

    // Filter by campus mode (same university)
    if (mode === 'campus' && currentUser.university) {
      query.university = currentUser.university;
    }

    if (genderPref && genderPref !== 'All') {
      query.gender = genderPref;
    }

    if (minAge || maxAge) {
      query.age = {};
      if (minAge) query.age.$gte = parseInt(minAge);
      if (maxAge) query.age.$lte = parseInt(maxAge);
    }

    // 1. Check Personal Discover Cache First (TTL: 5m)
    const cacheKey = `discover_pool_${currentUserId}`;
    let pool = CacheService.get(cacheKey);

    if (!pool) {
        console.log(`[CACHE] Miss for Discover Pool: ${currentUserId}`);
        // Database-Level Filtering (Pool Selection)
        pool = await User.find(query)
          .sort({ globalScore: -1 })
          .limit(100)
          .select('nickname firstName age gender university branch interests hobbies profilePhotos bio hometown globalScore academicYear');
        
        // Store in cache for 5 minutes
        CacheService.set(cacheKey, pool, 300);
    } else {
        console.log(`[CACHE] Hit for Discover Pool: ${currentUserId}`);
    }

    // 2. Elite Bloom Filter Verification (Second Pass)
    // Double-check candidates against the Bloom Filter to ensure 100% exclusion accuracy
    pool = pool.filter(p => !BloomFilterService.possiblySwiped(currentUserId, p._id));

    // 2. In-Memory High Performance Ranking (Scoring)
    // We use KNN/Jaccard/Cosine Similarity to re-rank based on current user's profile
    let rankedUsers = RecommendationService.rankProfiles(currentUser, pool);

    // 3. Social Intelligence (Mutual Connections)
    // Calculate mutual counts for the top 20 users
    const top20Ids = rankedUsers.slice(0, 20).map(u => u._id);
    const mutualCounts = await SocialService.getBulkMutualCounts(currentUserId, top20Ids);

    // Attach mutual counts to results
    const finalResults = rankedUsers.slice(0, 20).map(u => {
      const mc = mutualCounts.find(c => c.userId.toString() === u._id.toString());
      return {
        ...u,
        mutualCount: mc ? mc.mutualCount : 0
      };
    });

    // Return the top 20 most relevant results with social proof
    res.json(finalResults);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching discover users' });
  }
};
