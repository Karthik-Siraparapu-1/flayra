/**
 * Advanced AI-Powered Safety (Elite DSA)
 * Provides high-speed content filtering using Trie (Prefix Tree) and RegEx patterns.
 */

class TrieNode {
    constructor() {
        this.children = {};
        this.isEndOfWord = false;
    }
}

class Trie {
    constructor() {
        this.root = new TrieNode();
    }

    insert(word) {
        let node = this.root;
        for (const char of word.toLowerCase()) {
            if (!node.children[char]) node.children[char] = new TrieNode();
            node = node.children[char];
        }
        node.isEndOfWord = true;
    }
}

const toxicTrie = new Trie();
const patterns = [
    /\b(fuck|shit|bitch|bastard|dick|pussy|slut|whore|nigger|faggot|cunt)\b/gi,
    /\b(stupid|idiot|asshole|dumb|retard|loser)\b/gi,
    /\b(kill|suicide|death|die|stab|shoot|murder)\b/gi
];

// Initialize Trie with additional university-specific blacklist items
const universityBlacklist = [
  "cheating", "fraud", "scam", "drugs", "weed", "cocaine", "hack", "bypass",
  "assignment", "homework", "exam", "leak", "proxy", "impersonate", "bully",
  "harass", "threat", "violence", "steal", "theft", "spam", "bot"
];
universityBlacklist.forEach(word => toxicTrie.insert(word));

/**
 * Filter text using both Regex and Trie
 * Soft-filter approach: Replaces toxic content with ***
 */
exports.filterText = (text = "") => {
    if (!text) return "";
    let filteredText = text;

    // 1. High-speed pattern matching (Regex)
    patterns.forEach(pattern => {
        filteredText = filteredText.replace(pattern, (match) => "*".repeat(match.length));
    });

    // 2. Trie-based keyword matching (Prefix/Full Word)
    const words = filteredText.split(/\s+/);
    const sanitizedWords = words.map(word => {
        let node = toxicTrie.root;
        let isMatch = false;
        
        for (const char of word.toLowerCase()) {
          if (node.children[char]) {
            node = node.children[char];
            if (node.isEndOfWord) {
              isMatch = true;
              break;
            }
          } else {
            break;
          }
        }
        
        return isMatch ? "*".repeat(word.length) : word;
    });

    return sanitizedWords.join(" ");
};

/**
 * Check if content is toxic (Hard-rejection mode)
 */
exports.isToxic = (text = "") => {
    const filtered = this.filterText(text);
    return filtered.includes("*");
};
