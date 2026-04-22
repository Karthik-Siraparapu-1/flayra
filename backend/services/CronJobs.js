const cron = require('node-cron');
const Reel = require('../models/Reel');

const initCronJobs = () => {
  // Run daily at midnight to calculate ranking scores for reels
  cron.schedule('0 0 * * *', async () => {
    console.log('[Cron] Running daily Reels ranking update...');
    try {
      const reels = await Reel.find().populate('userId', 'followers');
      
      for (const reel of reels) {
        // (likes*2 + followers*3 + views*1.5 + shares*4)
        const followersCount = reel.userId?.followers?.length || 0;
        const score = (reel.likes * 2) + 
                      (followersCount * 3) + 
                      (reel.views * 1.5) + 
                      (reel.shares * 4);
                      
        // Add a 'rankingScore' field to schema temporarily or permanently for this
        // await Reel.findByIdAndUpdate(reel._id, { rankingScore: score });
      }
      console.log('[Cron] Reels ranking update complete.');
    } catch (err) {
      console.error('[Cron] Error updating reels ranking:', err);
    }
  });
};

module.exports = initCronJobs;
