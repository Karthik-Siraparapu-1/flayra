const Swipe = require('../models/Swipe');
const Match = require('../models/Match');
const User = require('../models/User');
const { sendPushNotification } = require('../services/onesignal');
const BloomFilterService = require('../services/BloomFilterService');
const EventService = require('../services/EventService');

exports.swipeAction = async (req, res) => {
  try {
    const { swipedOnId, type } = req.body;
    const swiperId = req.user._id;

    if (!swipedOnId || !['right', 'left'].includes(type)) {
      return res.status(400).json({ error: 'Invalid swipe parameters' });
    }

    // 1. Record the swipe
    const newSwipe = new Swipe({ swiperId, swipedOnId, type });
    await newSwipe.save();

    // 2. Add to Elite Bloom Filter for near-zero latency exclusion lookup
    BloomFilterService.addSwipe(swiperId, swipedOnId);

    // 2. Check for a match if type is 'right'
    if (type === 'right') {
      const mutualSwipe = await Swipe.findOne({
        swiperId: swipedOnId,
        swipedOnId: swiperId,
        type: 'right'
      });

      if (mutualSwipe) {
        // --- IT'S A MATCH! ---
        const newMatch = new Match({
          users: [swiperId, swipedOnId]
        });
        await newMatch.save();

        // [ASYNC] Emit Match Event (Handles stats and notifications)
        EventService.emitEvent('match_created', { swiperId, swipedOnId });
        
        return res.json({ matchStatus: true, match: newMatch });
      } else {
        // [ASYNC] Emit Right Swipe (Handles stats update)
        EventService.emitEvent('swipe_right', { swiperId, swipedOnId });
      }
    }

    res.json({ matchStatus: false });
  } catch (err) {
      if (err.code === 11000) {
        return res.status(400).json({ error: 'You already swiped on this user' });
      }
      console.error(err);
      res.status(500).json({ error: 'Server error during swipe action' });
  }
};
