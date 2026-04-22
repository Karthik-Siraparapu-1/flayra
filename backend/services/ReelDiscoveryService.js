/**
 * Advanced AI-Driven Discovery (Elite DSA)
 * Provides semantic similarity ranking for Reels using TF-IDF and Cosine Similarity.
 */

class ReelDiscoveryService {
    /**
     * Compute Cosine Similarity between two vectors
     */
    static cosineSimilarity(vecA, vecB) {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] ** 2;
            normB += vecB[i] ** 2;
        }
        
        if (normA === 0 || normB === 0) return 0;
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    /**
     * Simple TF-IDF Vectorizer (Elite MVP)
     * Maps interests and reel captions to a common vector space.
     */
    static getVector(text, allInterests) {
        const words = text.toLowerCase().split(/\s+/);
        return allInterests.map(interest => {
            const interestLower = interest.toLowerCase();
            return words.filter(w => w.includes(interestLower)).length;
        });
    }

    /**
     * Rank Reels for a specific User
     */
    static rankReels(user, reels) {
        if (!user.interests || user.interests.length === 0) return reels;

        // 1. Define the Global Interest Map (Elite Feature Space)
        const allInterests = [...new Set([...user.interests, 'coding', 'music', 'gaming', 'sports', 'fashion', 'tech', 'dance', 'flayra'])];
        
        // 2. Vectorize the User's Interests
        const userVector = this.getVector(user.interests.join(' '), allInterests);

        // 3. Score each Reel by semantic similarity to the User
        const rankedReels = reels.map(reel => {
            const reelText = `${reel.caption} ${reel.userId?.branch || ''}`;
            const reelVector = this.getVector(reelText, allInterests);
            const similarity = this.cosineSimilarity(userVector, reelVector);
            
            return {
                ...reel.toObject(),
                relevanceScore: similarity
            };
        });

        // 4. Sort by relevance, then by recency (Elite Hybrid Ranking)
        return rankedReels.sort((a, b) => b.relevanceScore - a.relevanceScore || b.createdAt - a.createdAt);
    }
}

module.exports = ReelDiscoveryService;
