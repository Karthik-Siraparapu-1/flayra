const EventEmitter = require('events');
const User = require('../models/User');
const { sendPushNotification } = require('./onesignal');

/**
 * Advanced Asynchronous Event Bus (Elite DSA)
 * Provides Pub/Sub capabilities for high-performance background processing.
 */

class EventBus extends EventEmitter {}
const eventBus = new EventBus();

/**
 * Register Background Handlers
 * This keeps the controllers clean and focused on user responses.
 */
exports.registerHandlers = () => {
    console.log('[EVENTS] Registering Elite background handlers...');

    // 1. Handle Right Swipes (Update stats in background)
    eventBus.on('swipe_right', async ({ swipedOnId }) => {
        try {
            await User.findByIdAndUpdate(swipedOnId, { $inc: { 'stats.likes': 1 } });
            console.log(`[EVENTS] Background stats updated for ${swipedOnId}`);
        } catch (err) {
            console.error('[EVENTS] Error updating swipe stats:', err);
        }
    });

    // 2. Handle Matches (Trigger push notifications)
    eventBus.on('match_created', async ({ swiperId, swipedOnId }) => {
        try {
            await sendPushNotification(
                [swiperId.toString(), swipedOnId.toString()],
                "New Match! 🎉",
                "You have a new match! Start talking now."
            );
            console.log(`[EVENTS] Match notifications sent for ${swiperId} & ${swipedOnId}`);
        } catch (err) {
            console.error('[EVENTS] Error sending match notifications:', err);
        }
    });

    // 3. Handle Messages (Trigger receiver push notifications)
    eventBus.on('new_message', async ({ receiverId, text, matchId }) => {
        try {
            await sendPushNotification(
                [receiverId.toString()],
                "New Message",
                text || "You received a new message in Flayra."
            );
            console.log(`[EVENTS] Message notification sent to ${receiverId}`);
        } catch (err) {
            console.error('[EVENTS] Error sending message notification:', err);
        }
    });
};

/**
 * Emit an event to the background bus
 */
exports.emitEvent = (eventName, data) => {
    console.log(`[EVENTS] Emitting event: ${eventName}`);
    eventBus.emit(eventName, data);
};
