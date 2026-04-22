const Match = require('../models/Match');

/**
 * Advanced Social Intelligence (Elite DSA)
 * Provides Mutual Connection discovery and Graph traversal.
 */

/**
 * Get IDs of users who have matched with the given userId
 */
const getMatchedUserIds = async (userId) => {
    const matches = await Match.find({ users: userId }).select('users');
    // Extract the OTHER user from each match array
    return matches.map(m => m.users.find(u => u.toString() !== userId.toString()));
};

/**
 * Set Intersection (Mutual Connection Recovery)
 * Find shared IDs between two users.
 */
exports.getMutualConnections = async (userId, targetId) => {
    const [userMatches, targetMatches] = await Promise.all([
        getMatchedUserIds(userId),
        getMatchedUserIds(targetId)
    ]);

    const userMatchSet = new Set(userMatches.map(id => id.toString()));
    const mutuals = targetMatches.filter(id => userMatchSet.has(id.toString()));

    return {
        count: mutuals.length,
        mutualIds: mutuals
    };
};

/**
 * Bulk Mutual Connections (Optimized for Feed)
 * Calculates mutual counts for a list of target users efficiently.
 */
exports.getBulkMutualCounts = async (userId, targetUserIds) => {
    // 1. Get current user's match set (once)
    const myMatches = await getMatchedUserIds(userId);
    const myMatchSet = new Set(myMatches.map(id => id.toString()));

    // 2. Fetch all matches for the target user pool
    const targetPoolMatches = await Match.find({ users: { $in: targetUserIds } }).select('users');

    // 3. Map matches to target users
    const matchMap = {};
    targetPoolMatches.forEach(m => {
        const u1 = m.users[0].toString();
        const u2 = m.users[1].toString();
        
        // Populate for each user in the pair
        if (!matchMap[u1]) matchMap[u1] = [];
        if (!matchMap[u2]) matchMap[u2] = [];
        
        matchMap[u1].push(u2);
        matchMap[u2].push(u1);
    });

    // 4. Calculate intersections
    return targetUserIds.map(id => {
        const theirMatches = matchMap[id.toString()] || [];
        const mutualCount = theirMatches.filter(mid => mid !== userId.toString() && myMatchSet.has(mid)).length;
        return {
            userId: id,
            mutualCount
        };
    });
};
