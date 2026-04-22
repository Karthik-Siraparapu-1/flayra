/**
 * Advanced Recommendation System (Elite DSA)
 * Provides Jaccard Similarity, Vector-based Cosine Similarity, and KNN Ranking.
 */

/**
 * Jaccard Similarity Coefficient
 * Intersection / Union of two arrays.
 * Perfect for Interests and Hobbies.
 */
const jaccardSimilarity = (arr1 = [], arr2 = []) => {
    if (arr1.length === 0 || arr2.length === 0) return 0;
    const s1 = new Set(arr1.map(i => i.toLowerCase()));
    const s2 = new Set(arr2.map(i => i.toLowerCase()));
    const intersection = new Set([...s1].filter(x => s2.has(x)));
    const union = new Set([...s1, ...s2]);
    return intersection.size / union.size;
};

/**
 * Simplified Cosine Similarity for text (Bio/Branch)
 * Uses keyword-based vector frequency.
 */
const cosineSimilarity = (str1 = "", str2 = "") => {
    const words1 = str1.toLowerCase().match(/\w+/g) || [];
    const words2 = str2.toLowerCase().match(/\w+/g) || [];
    
    if (words1.length === 0 || words2.length === 0) return 0;

    const allWords = new Set([...words1, ...words2]);
    const vec1 = {};
    const vec2 = {};
    
    allWords.forEach(word => {
        vec1[word] = words1.filter(w => w === word).length;
        vec2[word] = words2.filter(w => w === word).length;
    });

    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;

    allWords.forEach(word => {
        dotProduct += vec1[word] * vec2[word];
        mag1 += vec1[word] * vec1[word];
        mag2 += vec2[word] * vec2[word];
    });

    return dotProduct / (Math.sqrt(mag1) * Math.sqrt(mag2));
};

/**
 * Master Aura Chemistry (Weighted Multi-Factor KNN)
 * Heuristics for the "Best Spark"
 */
exports.calculateAuraChemistry = (currentUser, targetUser) => {
    let score = 0;
    const factors = [];

    // 1. Romantic Intent Alignment (Core Connection - Weight: 0.40)
    if (currentUser.romanticIntent === targetUser.romanticIntent) {
        score += 0.40;
        factors.push(`Both seeking ${currentUser.romanticIntent.toLowerCase()}`);
    } else {
        // Partial compatibility mapping could exist here, defaulting to +0.10 for any spark
        score += 0.10;
    }

    // 2. Aura Compatibility (Vibe Check - Weight: 0.20)
    if (currentUser.auraType === targetUser.auraType) {
        score += 0.20;
        factors.push(`Matching ${currentUser.auraType} Energy`);
    } else if (currentUser.auraType && targetUser.auraType) {
        score += 0.10; // Complementary auras
    }

    // 3. Interest Similarity (Jaccard - Weight: 0.25)
    const s1 = new Set((currentUser.interests || []).map(i => i.toLowerCase()));
    const s2 = new Set((targetUser.interests || []).map(i => i.toLowerCase()));
    const mutualInterests = [...s1].filter(x => s2.has(x));
    
    if (mutualInterests.length > 0) {
        factors.push(`Shared: ${mutualInterests[0]}`);
    }

    const interestSim = jaccardSimilarity(currentUser.interests, targetUser.interests);
    const hobbySim = jaccardSimilarity(currentUser.hobbies, targetUser.hobbies);
    score += ((interestSim + hobbySim) / 2) * 0.25;

    // 4. Bio Sentiment/Campus Alignment (Identity Similarity - Weight: 0.15)
    if (currentUser.branch === targetUser.branch) {
        score += 0.05;
        factors.push(`Same Branch`);
    }
    
    if (currentUser.bio && targetUser.bio) {
        const bioSim = cosineSimilarity(currentUser.bio, targetUser.bio);
        score += bioSim * 0.10;
        if (bioSim > 0.5) factors.push("Similar Vibes");
    }

    // 5. Global Quality Additive (Bonus up to 5%)
    const qualityNorm = Math.min((targetUser.globalScore || 0) / 1000, 1); 
    score += qualityNorm * 0.05;

    return {
        score: Math.min(score, 1),
        factors: factors.slice(0, 3) // Return top 3 factors
    };
};

/**
 * 2-Stage Re-ranking Algorithm
 */
exports.rankProfiles = (currentUser, profilePool) => {
    return profilePool.map(profile => {
        const { score, factors } = this.calculateAuraChemistry(currentUser, profile);
        // Convert to plain object to attach volatile score
        const profileObj = profile.toObject ? profile.toObject() : { ...profile };
        return {
            ...profileObj,
            auraChemistry: (score * 100).toFixed(1), // Percentage
            matchFactors: factors
        };
    }).sort((a, b) => b.auraChemistry - a.auraChemistry); // Sort by highest Aura Chemistry
};
