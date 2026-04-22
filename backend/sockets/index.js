const Message = require('../models/Message');
const Match = require('../models/Match');
const Community = require('../models/Community');
const CommunityMessage = require('../models/CommunityMessage');
const EventService = require('../services/EventService');
const SecurityService = require('../services/SecurityService');

let waitingQueue = [];
let activeCalls = new Map(); // Map socket.id -> peer socket.id

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // User joins a specific match chat room
    socket.on('join_room', (matchId) => {
      socket.join(matchId);
      console.log(`User joined room: ${matchId}`);
    });

    // Handle incoming messages
    socket.on('send_message', async (data) => {
      const { matchId, senderId, text } = data;
      
      try {
        const sanitizedText = SecurityService.filterText(text);

        // 1. Save message to DB
        const newMessage = new Message({
          matchId,
          senderId,
          text: sanitizedText
        });
        await newMessage.save();

        // 2. Update Match's lastMessage
        await Match.findByIdAndUpdate(matchId, {
          lastMessage: sanitizedText,
          lastMessageTimestamp: Date.now()
        });

        // 3. Emit the message to the room
        io.to(matchId).emit('receive_message', newMessage);

        // 4. [ASYNC] Handle Push Notification in background
        const matchData = await Match.findById(matchId).populate('users');
        if (matchData) {
          const receiver = matchData.users.find(u => u._id.toString() !== senderId.toString());
          if (receiver) {
            EventService.emitEvent('new_message', { 
                receiverId: receiver._id, 
                text: sanitizedText, 
                matchId 
            });
          }
        }

      } catch (err) {
        console.error('Error handling send_message:', err);
      }
    });

    // Handle Typing Indicators
    socket.on('typing_start', (data) => {
      const { matchId, userId } = data;
      socket.to(matchId).emit('user_typing', { userId, typing: true });
    });

    socket.on('typing_stop', (data) => {
      const { matchId, userId } = data;
      socket.to(matchId).emit('user_typing', { userId, typing: false });
    });

    // Handle Read Receipts
    socket.on('message_read', async (data) => {
      const { matchId, userId } = data;
      // In a real app, we would update the Message model's read status here
      // For now, we just broadcast to the other user
      socket.to(matchId).emit('messages_marked_read', { userId });
    });

    // --- COMMUNITY SOCKETS ---

    // User joins a community room
    socket.on('join_community', (communityId) => {
       socket.join(`comm_${communityId}`);
       console.log(`User joined community room: ${communityId}`);
    });

    // Handle community messaging
    socket.on('send_community_message', async (data) => {
       const { communityId, senderId, text, imageUrl } = data;
       
       try {
          const sanitizedText = SecurityService.filterText(text);

          const newMessage = new CommunityMessage({
             communityId,
             senderId,
             text: sanitizedText,
             imageUrl
          });
          await newMessage.save();

          // Update community's last message for the list view
          await Community.findByIdAndUpdate(communityId, {
             lastMessage: sanitizedText,
             lastMessageTimestamp: Date.now()
          });

          // Emit to all users in the community room
          io.to(`comm_${communityId}`).emit('receive_community_message', newMessage);

       } catch (err) {
          console.error('Error handling community message:', err);
       }
    });

    socket.on('community_typing_start', (data) => {
       const { communityId, userId, firstName } = data;
       socket.to(`comm_${communityId}`).emit('user_community_typing', { userId, firstName, typing: true });
    });

    socket.on('community_typing_stop', (data) => {
       const { communityId, userId } = data;
       socket.to(`comm_${communityId}`).emit('user_community_typing', { userId, typing: false });
    });

    // --- COMMUNITY VOICE STAGE SOCKETS ---

    socket.on('start_voice_stage', async (data) => {
       const { communityId, userId } = data;
       try {
          const community = await Community.findById(communityId);
          if (!community) return;

          // Check permissions
          if (community.voiceCfg.canStart === 'Admin' && community.admin.toString() !== userId.toString()) {
             return socket.emit('voice_error', { message: 'Only admins can spark a discussion here.' });
          }

          // Update community state
          community.activeStage = {
             isActive: true,
             hostId: userId,
             speakers: [userId],
             startTime: Date.now()
          };
          await community.save();

          io.to(`comm_${communityId}`).emit('voice_stage_started', { communityId, hostId: userId, mode: community.voiceCfg.mode });
       } catch (err) {
          console.error('Error starting voice stage:', err);
       }
    });

    socket.on('join_voice_stage', async (data) => {
       const { communityId, userId } = data;
       socket.join(`voice_${communityId}`);
       
       const community = await Community.findById(communityId).populate('activeStage.speakers', 'firstName profilePhotos');
       if (community && community.activeStage.isActive) {
          socket.emit('voice_stage_sync', { 
             speakers: community.activeStage.speakers,
             mode: community.voiceCfg.mode,
             isRecording: community.voiceCfg.isRecordable
          });
       }
    });

    socket.on('voice_signal', (data) => {
       const { communityId, targetUserId, signal } = data;
       // Relay WebRTC signal to specific participant in the community
       // In a real SFU, this would go to the media server. 
       // In Mesh, we broadcast or relay to specific socket.
       socket.to(`comm_${communityId}`).emit('voice_signal_receive', {
          senderId: data.senderId,
          signal
       });
    });

    socket.on('voice_speaking_status', (data) => {
       const { communityId, userId, isSpeaking } = data;
       io.to(`comm_${communityId}`).emit('user_speaking', { userId, isSpeaking });
    });

    socket.on('end_voice_stage', async (data) => {
       const { communityId, userId } = data;
       try {
          const community = await Community.findById(communityId);
          if (!community) return;

          if (community.activeStage.hostId.toString() === userId.toString() || community.admin.toString() === userId.toString()) {
             community.activeStage.isActive = false;
             await community.save();
             io.to(`comm_${communityId}`).emit('voice_stage_ended', { communityId });
          }
       } catch (err) {
          console.error('Error ending voice stage:', err);
       }
    });

    // --- WEBRTC SIGNALING ---

    // --- WEBRTC SIGNALING ---

    // Handle WebRTC Random Video Call Signaling
    socket.on('join_random_queue', (userId) => {
      console.log(`User ${userId} joined random queue on socket: ${socket.id}`);
      
      const existingUserIndex = waitingQueue.findIndex(u => u.userId === userId || u.socketId === socket.id);
      if (existingUserIndex > -1) {
        waitingQueue.splice(existingUserIndex, 1);
      }

      if (waitingQueue.length > 0) {
        // Match found!
        const peer = waitingQueue.shift();
        
        activeCalls.set(socket.id, peer.socketId);
        activeCalls.set(peer.socketId, socket.id);

        console.log(`Paired ${socket.id} with ${peer.socketId}`);
        
        // Notify both peers
        socket.emit('webrtc_paired', { peerId: peer.userId, initiator: false });
        io.to(peer.socketId).emit('webrtc_paired', { peerId: userId, initiator: true });
      } else {
        // Wait in queue
        waitingQueue.push({ socketId: socket.id, userId });
      }
    });

    socket.on('webrtc_offer', (data) => {
      const peerSocketId = activeCalls.get(socket.id);
      if (peerSocketId) {
        io.to(peerSocketId).emit('webrtc_offer', { sdp: data.sdp });
      }
    });

    socket.on('webrtc_answer', (data) => {
      const peerSocketId = activeCalls.get(socket.id);
      if (peerSocketId) {
        io.to(peerSocketId).emit('webrtc_answer', { sdp: data.sdp });
      }
    });

    socket.on('webrtc_ice_candidate', (data) => {
      const peerSocketId = activeCalls.get(socket.id);
      if (peerSocketId) {
        io.to(peerSocketId).emit('webrtc_ice_candidate', { candidate: data.candidate });
      }
    });

    socket.on('leave_random_call', () => {
      const peerSocketId = activeCalls.get(socket.id);
      if (peerSocketId) {
        io.to(peerSocketId).emit('webrtc_peer_left');
        activeCalls.delete(peerSocketId);
      }
      activeCalls.delete(socket.id);
      
      // Also remove from queue if waiting
      waitingQueue = waitingQueue.filter(u => u.socketId !== socket.id);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      const peerSocketId = activeCalls.get(socket.id);
      if (peerSocketId) {
        io.to(peerSocketId).emit('webrtc_peer_left');
        activeCalls.delete(peerSocketId);
      }
      activeCalls.delete(socket.id);
      waitingQueue = waitingQueue.filter(u => u.socketId !== socket.id);
    });
  });
};
