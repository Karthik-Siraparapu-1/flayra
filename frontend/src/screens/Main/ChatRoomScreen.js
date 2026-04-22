import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Image } from 'react-native';
import io from 'socket.io-client';
import api from '../../config/api';
import useAuthStore from '../../store/authStore';
import Icon from 'react-native-vector-icons/Ionicons';
import CryptoJS from 'crypto-js';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS, TYPOGRAPHY, SPACING } from '../../theme/designSystem';
import GlassCard from '../../components/ui/GlassCard';

// Extremely basic symmetric key for MVP. In a real app, use ECDH or a securely generated key exchange.
const CHAT_SECRET_KEY = "Flayra-Super-Secret-AES-Key-2026"; 
const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5001' : 'http://localhost:5001';

export default function ChatRoomScreen({ route, navigation }) {
  const { matchId, otherUser } = route.params;
  const { user } = useAuthStore();
  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  
  const flatListRef = useRef();
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await api.get(`/message/${matchId}`);
        const decryptedMessages = response.data.map(msg => {
          let decryptedText = msg.text;
          if (msg.text) {
            try {
              const bytes = CryptoJS.AES.decrypt(msg.text, CHAT_SECRET_KEY);
              decryptedText = bytes.toString(CryptoJS.enc.Utf8);
            } catch (e) {
              console.error("Decryption failed:", e);
              decryptedText = "Message unreadable (encryption error)";
            }
          }
          return { id: msg._id, ...msg, text: decryptedText };
        });
        setMessages(decryptedMessages);
        setLoading(false);
        scrollToBottom();
      } catch (err) {
        console.error("Error fetching messages:", err);
        setLoading(false);
      }
    };

    fetchMessages();

    // Connect to Socket.IO
    socketRef.current = io(BASE_URL);
    socketRef.current.emit('join_room', matchId);

    // Listen for new messages
    socketRef.current.on('receive_message', (newMessage) => {
      let decryptedText = newMessage.text;
      if (newMessage.text) {
        try {
          const bytes = CryptoJS.AES.decrypt(newMessage.text, CHAT_SECRET_KEY);
          decryptedText = bytes.toString(CryptoJS.enc.Utf8);
        } catch (e) {
          decryptedText = "Message unreadable";
        }
      }
      setMessages(prev => [...prev, { id: newMessage._id, ...newMessage, text: decryptedText }]);
      scrollToBottom();
      
      // Mark as read when receiving in an open chat
      socketRef.current.emit('message_read', { matchId, userId: user.id || user._id });
    });

    // Listen for typing events
    socketRef.current.on('user_typing', (data) => {
       if (data.userId !== (user.id || user._id)) {
          setIsOtherUserTyping(data.typing);
          scrollToBottom();
       }
    });

    socketRef.current.on('messages_marked_read', (data) => {
       // Optional: Update last seen or tick marks UI
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [matchId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (flatListRef.current && messages.length > 0) {
        flatListRef.current.scrollToEnd({ animated: true });
      }
    }, 100);
  };

  const handleInputChange = (text) => {
    setInputText(text);
    
    if (socketRef.current) {
      socketRef.current.emit('typing_start', { matchId, userId: user.id || user._id });
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current.emit('typing_stop', { matchId, userId: user.id || user._id });
      }, 2000);
    }
  };

  const handleSendText = async () => {
    if (!inputText.trim()) return;
    const textToSend = inputText.trim();
    setInputText('');
    
    // Stop typing immediately on send
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socketRef.current.emit('typing_stop', { matchId, userId: user.id || user._id });
    
    let encryptedText = null;
    if (textToSend) {
      encryptedText = CryptoJS.AES.encrypt(textToSend, CHAT_SECRET_KEY).toString();
    }
    
    if (socketRef.current) {
      socketRef.current.emit('send_message', {
        matchId,
        senderId: user._id || user.id,
        text: encryptedText
      });
    }
  };

  const renderMessage = ({ item }) => {
    const isMe = item.senderId === (user.uid || user.id || user._id);
    
    return (
      <View style={[styles.messageWrapper, isMe ? styles.myWrapper : styles.theirWrapper]}>
        {isMe ? (
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.myBubble}
          >
            {item.imageUrl && <Image source={{ uri: item.imageUrl }} style={styles.chatImage} />}
            {item.text && <Text style={styles.myText}>{item.text}</Text>}
            <View style={styles.messageFooter}>
              <Text style={styles.myTime}>
                {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
              </Text>
              <Icon name="checkmark-done" size={12} color="rgba(255,255,255,0.6)" style={{marginLeft: 4}} />
            </View>
          </LinearGradient>
        ) : (
          <View style={styles.theirBubble}>
            {item.imageUrl && <Image source={{ uri: item.imageUrl }} style={styles.chatImage} />}
            {item.text && <Text style={styles.theirText}>{item.text}</Text>}
            <Text style={styles.theirTime}>
              {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={COLORS.primary} /></View>;

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={styles.header}>
         <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-back-outline" size={28} color={COLORS.secondary} />
         </TouchableOpacity>
         <View style={styles.headerUser}>
            <View style={styles.headerAvatarContainer}>
              {otherUser?.profilePhotos?.[0] ? (
                <Image source={{ uri: otherUser.profilePhotos[0] }} style={styles.headerAvatar} />
              ) : (
                <View style={[styles.headerAvatar, { backgroundColor: COLORS.lightGray, justifyContent: 'center', alignItems: 'center' }]}>
                  <Icon name="person" size={20} color={COLORS.gray} />
                </View>
              )}
              <View style={styles.onlineDot} />
            </View>
            <View>
              <Text style={styles.headerName}>{otherUser?.firstName || 'User'}</Text>
              <Text style={styles.headerStatus}>online</Text>
            </View>
         </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={scrollToBottom}
        ListFooterComponent={() => isOtherUserTyping && (
           <View style={styles.typingIndicator}>
              <View style={styles.typingDot} />
              <View style={[styles.typingDot, { opacity: 0.6 }]} />
              <View style={[styles.typingDot, { opacity: 0.3 }]} />
              <Text style={styles.typingText}>{otherUser?.firstName} is forming chemistry...</Text>
           </View>
        )}
      />
      
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TouchableOpacity style={styles.attachBtn}>
            <Icon name="heart-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Send a flame..."
            placeholderTextColor="rgba(0,0,0,0.3)"
            value={inputText}
            onChangeText={handleInputChange}
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendButton, !inputText.trim() && { opacity: 0.5 }]} 
            onPress={handleSendText} 
            disabled={!inputText.trim()}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              style={StyleSheet.absoluteFill}
              borderRadius={20}
            />
            <Icon name="paper-plane" size={18} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fcfcfc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 15, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)', ...SHADOWS.light },
  backBtn: { marginRight: 15 },
  headerUser: { flexDirection: 'row', alignItems: 'center' },
  headerAvatarContainer: { position: 'relative', marginRight: 12 },
  headerAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: COLORS.primaryLight },
  onlineDot: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.success, borderWidth: 2, borderColor: COLORS.white },
  headerName: { fontSize: 18, fontWeight: '900', color: COLORS.secondary, letterSpacing: 0.2 },
  headerStatus: { fontSize: 11, color: COLORS.success, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  listContent: { padding: 20, paddingBottom: 30 },
  messageWrapper: { marginBottom: 15, maxWidth: '85%' },
  myWrapper: { alignSelf: 'flex-end' },
  theirWrapper: { alignSelf: 'flex-start' },
  myBubble: { padding: 14, borderRadius: 20, borderBottomRightRadius: 4, ...SHADOWS.medium },
  theirBubble: { padding: 14, borderRadius: 20, borderBottomLeftRadius: 4, backgroundColor: COLORS.white, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', ...SHADOWS.light },
  chatImage: { width: 220, height: 280, borderRadius: 12, marginBottom: 8 },
  myText: { fontSize: 16, color: COLORS.white, fontWeight: '600', lineHeight: 22 },
  theirText: { fontSize: 16, color: COLORS.secondary, fontWeight: '500', lineHeight: 22 },
  messageFooter: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', marginTop: 4 },
  myTime: { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  theirTime: { fontSize: 10, color: COLORS.gray, alignSelf: 'flex-end', marginTop: 4, fontWeight: '600' },
  typingIndicator: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, marginBottom: 15 },
  typingDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.primary, marginRight: 3 },
  typingText: { fontSize: 12, color: COLORS.gray, fontWeight: '600', fontStyle: 'italic', marginLeft: 4 },
  inputContainer: { paddingHorizontal: 15, paddingBottom: Platform.OS === 'ios' ? 35 : 15, paddingTop: 10, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, borderRadius: 30, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  attachBtn: { padding: 8 },
  input: { flex: 1, fontSize: 16, color: COLORS.secondary, paddingHorizontal: 10, maxHeight: 100, paddingTop: 10, paddingBottom: 10, fontWeight: '500' },
  sendButton: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', marginLeft: 5, overflow: 'hidden' },
});
