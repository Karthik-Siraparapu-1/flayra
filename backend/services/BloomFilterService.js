const Swipe = require('../models/Swipe');

/**
 * Advanced High-Performance Bloom Filter (Elite DSA)
 * Provides space-efficient probabilistic set membership checks.
 */

// Configuration: 2^18 bits (~256KB) for a low false-positive rate up to ~50k elements
const BIT_ARRAY_SIZE = 1 << 18;
const bitArray = new Uint8Array(BIT_ARRAY_SIZE / 8);

/**
 * Simple hash functions (FNV-1a style variants)
 */
const hash1 = (str) => {
    let hash = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return Math.abs(hash) % BIT_ARRAY_SIZE;
};

const hash2 = (str) => {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i);
    }
    return Math.abs(hash) % BIT_ARRAY_SIZE;
};

const hash3 = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash) % BIT_ARRAY_SIZE;
};

const setBit = (index) => {
    bitArray[index >> 3] |= (1 << (index % 8));
};

const getBit = (index) => {
    return (bitArray[index >> 3] & (1 << (index % 8))) !== 0;
};

const getCombinedKey = (swiperId, swipedOnId) => `${swiperId}:${swipedOnId}`;

/**
 * Add a swipe interaction to the Bloom Filter
 */
exports.addSwipe = (swiperId, swipedOnId) => {
    const key = getCombinedKey(swiperId, swipedOnId);
    setBit(hash1(key));
    setBit(hash2(key));
    setBit(hash3(key));
};

/**
 * Probabilistically check if a user has swiped on another user
 * Returns true if possibly swiped, false if definitely NOT swiped.
 */
exports.possiblySwiped = (swiperId, swipedOnId) => {
    const key = getCombinedKey(swiperId, swipedOnId);
    return getBit(hash1(key)) && getBit(hash2(key)) && getBit(hash3(key));
};

/**
 * Warm-up: Load all existing swipes from DB into the Bloom Filter on startup
 */
exports.warmUp = async () => {
    console.log('[BLOOM] Warming up Elite Bloom Filter...');
    const allSwipes = await Swipe.find({}).select('swiperId swipedOnId');
    allSwipes.forEach(s => {
        this.addSwipe(s.swiperId, s.swipedOnId);
    });
    console.log(`[BLOOM] Warm-up complete. Loaded ${allSwipes.length} swipes.`);
};
