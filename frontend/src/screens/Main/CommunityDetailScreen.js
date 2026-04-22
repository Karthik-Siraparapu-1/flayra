import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  FlatList, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator, 
  Image 
} from 'react-native';
import io from 'socket.io-client';
import api from '../../config/api';
import useAuthStore from '../../store/authStore';
import Icon from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS, TYPOGRAPHY, SPACING } from '../../theme/designSystem';
import GlassCard from '../../components/ui/GlassCard';
import RecordingLibrary from '../../components/community/RecordingLibrary';
import SoundWaveVisualizer from '../../components/ui/SoundWaveVisualizer';
import VibePlayer from '../../components/ui/VibePlayer';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5001' : 'http://localhost:5001';

export default function CommunityDetailScreen({ route, navigation }) {
  const { community: initialCommunity } = route.params;
  const { user } = useAuthStore();
  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [community, setCommunity] = useState(initialCommunity);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState('');
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'recorded'
  const [voiceActive, setVoiceActive] = useState(false);
  const [speakers, setSpeakers] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [activeVibe, setActiveVibe] = useState(null);

  const pulseValue = useSharedValue(1);

  const flatListRef = useRef();
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (voiceActive) {
      pulseValue.value = withRepeat(withTiming(1.2, { duration: 1000 }), -1, true);
    } else {
      pulseValue.value = withTiming(1);
    }
  }, [voiceActive]);

  const auraStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseValue.value }],
    opacity: voiceActive ? 0.3 : 0
  }));

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await api.get(`/community/${community._id}/messages`);
        setMessages(response.data);
        setLoading(false);
        scrollToBottom();
      } catch (err) {
        console.error("Error fetching community history:", err);
        setLoading(false);
      }
    };

    fetchHistory();

    socketRef.current = io(BASE_URL);
    socketRef.current.emit('join_community', community._id);

    socketRef.current.on('receive_community_message', (msg) => {
      setMessages(prev => [...prev, msg]);
      scrollToBottom();
    });

    socketRef.current.on('user_community_typing', (data) => {
       if (data.userId !== (user.id || user._id)) {
          setIsTyping(data.typing);
          setTypingUser(data.firstName);
          scrollToBottom();
       }
    });

    socket.current.on('voice_stage_started', (data) => {
       setVoiceActive(true);
       setIsRecording(data.isRecording);
    });

    socket.current.on('voice_stage_ended', () => {
       setVoiceActive(false);
       setSpeakers([]);
    });

    socket.current.on('voice_stage_sync', (data) => {
       setVoiceActive(true);
       setSpeakers(data.speakers || []);
       setIsRecording(data.isRecording);
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [community._id]);

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
      socketRef.current.emit('community_typing_start', { 
        communityId: community._id, 
        userId: user.id || user._id,
        firstName: user.firstName 
      });
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current.emit('community_typing_stop', { 
          communityId: community._id, 
          userId: user.id || user._id 
        });
      }, 2000);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const textToSend = inputText.trim();
    setInputText('');

    if (socketRef.current) {
       socketRef.current.emit('send_community_message', {
          communityId: community._id,
          senderId: user.id || user._id,
          text: textToSend
       });
    }
  };

  const handleStartVoice = () => {
     if (socketRef.current) {
        socketRef.current.emit('start_voice_stage', { 
           communityId: community._id, 
           userId: user.id || user._id 
        });
     }
  };

  const renderMessage = ({ item }) => {
    const isMe = (item.senderId?._id || item.senderId) === (user.id || user._id);
    const senderName = item.senderId?.firstName || 'User';

    return (
      <View style={[styles.messageWrapper, isMe ? styles.myWrapper : styles.theirWrapper]}>
        {!isMe && <Text style={styles.senderText}>{senderName}</Text>}
        {isMe ? (
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.myBubble}
          >
            <Text style={styles.myText}>{item.text}</Text>
          </LinearGradient>
        ) : (
          <View style={styles.theirBubble}>
            <Text style={styles.theirText}>{item.text}</Text>
          </View>
        )}
      </View>
    );
  };

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
         <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{community.name}</Text>
            <Text style={styles.headerStatus}>{community.members?.length || 0} members online</Text>
         </View>
         <TouchableOpacity style={styles.infoBtn}>
            <Icon name="information-circle-outline" size={26} color={COLORS.gray} />
         </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'chat' && styles.activeTabBtn]} 
          onPress={() => setActiveTab('chat')}
        >
          <Text style={[styles.tabText, activeTab === 'chat' && styles.activeTabText]}>Aura Chat</Text>
          {activeTab === 'chat' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'recorded' && styles.activeTabBtn]} 
          onPress={() => setActiveTab('recorded')}
        >
          <Text style={[styles.tabText, activeTab === 'recorded' && styles.activeTabText]}>Recorded Vibes</Text>
          {activeTab === 'recorded' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>

      {voiceActive && (
        <View style={styles.voiceStageHeader}>
          <LinearGradient colors={['rgba(251, 113, 133, 0.05)', 'transparent']} style={StyleSheet.absoluteFill} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.speakersScroll}>
             {speakers.length === 0 ? (
               <View style={styles.emptyStage}>
                  <Text style={styles.emptyStageText}>Discussion is active. Join the vibe!</Text>
               </View>
             ) : (
               speakers.map(speaker => (
                 <View key={speaker._id} style={styles.speakerAvatarWrapper}>
                    <Animated.View style={[styles.aura, auraStyle]} />
                    <Image source={{ uri: speaker.profilePhotos?.[0] || 'https://via.placeholder.com/100' }} style={styles.speakerAvatar} />
                    <View style={styles.visualizerOverlay}>
                       <SoundWaveVisualizer active={true} size={10} color={COLORS.white} />
                    </View>
                 </View>
               ))
             )}
          </ScrollView>
          
          <View style={styles.voiceControls}>
             {isRecording && (
                <View style={styles.recordingBadge}>
                   <View style={styles.recordDot} />
                   <Text style={styles.recordText}>LIVE RECORD</Text>
                </View>
             )}
             <TouchableOpacity style={styles.joinVoiceBtn} onPress={() => console.log("Join Voice")}>
                <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.joinVoiceInner}>
                   <Icon name="mic" size={16} color={COLORS.white} />
                   <Text style={styles.joinVoiceText}>Join</Text>
                </LinearGradient>
             </TouchableOpacity>
          </View>
        </View>
      )}

      {!voiceActive && activeTab === 'chat' && (
        <TouchableOpacity style={styles.startVoiceBanner} onPress={handleStartVoice}>
           <Icon name="flash" size={16} color={COLORS.primary} />
           <Text style={styles.startVoiceText}>Spark a Voice Discussion</Text>
        </TouchableOpacity>
      )}

      {loading ? <View style={styles.center}><ActivityIndicator color={COLORS.primary} /></View> : (
        activeTab === 'chat' ? (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, index) => item._id || index.toString()}
            renderItem={renderMessage}
            contentContainerStyle={styles.listContent}
            onContentSizeChange={scrollToBottom}
            ListFooterComponent={() => isTyping && (
               <View style={styles.typingIndicator}>
                  <Text style={styles.typingText}>{typingUser} is typing...</Text>
               </View>
            )}
          />
        ) : (
          <RecordingLibrary 
            communityId={community._id} 
            onPlay={(vibe) => setActiveVibe(vibe)} 
          />
        )
      )}
      
      {activeTab === 'chat' && (
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TouchableOpacity style={styles.attachBtn}>
              <Icon name="happy-outline" size={24} color={COLORS.primary} />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor="rgba(0,0,0,0.3)"
              value={inputText}
              onChangeText={handleInputChange}
              multiline
            />
            <TouchableOpacity 
              style={[styles.sendButton, !inputText.trim() && { opacity: 0.5 }]} 
              onPress={handleSend}
              disabled={!inputText.trim()}
            >
              <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.sendBtnInner}>
                 <Icon name="send" size={18} color={COLORS.white} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {activeVibe && (
        <VibePlayer 
          vibe={activeVibe} 
          onClose={() => setActiveVibe(null)} 
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fcfcfc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 15, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  backBtn: { marginRight: 15 },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 18, fontWeight: '900', color: COLORS.secondary },
  headerStatus: { fontSize: 11, color: COLORS.success, fontWeight: '700', textTransform: 'uppercase' },
  infoBtn: { padding: 5 },
  tabBar: { flexDirection: 'row', backgroundColor: COLORS.white, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  tabBtn: { flex: 1, paddingVertical: 15, alignItems: 'center', position: 'relative' },
  activeTabBtn: { },
  tabText: { fontSize: 13, fontWeight: '700', color: COLORS.gray },
  activeTabText: { color: COLORS.secondary, fontWeight: '900' },
  tabIndicator: { position: 'absolute', bottom: 0, width: 40, height: 3, backgroundColor: COLORS.primary, borderRadius: 2 },
  voiceStageHeader: { backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)', paddingVertical: 12 },
  speakersScroll: { paddingHorizontal: 20, alignItems: 'center' },
  speakerAvatarWrapper: { marginRight: 15, position: 'relative', width: 50, height: 50, justifyContent: 'center', alignItems: 'center' },
  speakerAvatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: COLORS.primary },
  aura: { position: 'absolute', width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.primary },
  visualizerOverlay: { position: 'absolute', bottom: -2, right: -2, backgroundColor: COLORS.primary, borderRadius: 10, padding: 2, borderWidth: 2, borderColor: COLORS.white },
  emptyStage: { paddingVertical: 10 },
  emptyStageText: { fontSize: 13, color: COLORS.gray, fontWeight: '600', fontStyle: 'italic' },
  voiceControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 10 },
  recordingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(244,63,94,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  recordDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.error, marginRight: 5 },
  recordText: { fontSize: 9, fontWeight: '900', color: COLORS.error, letterSpacing: 0.5 },
  joinVoiceBtn: { ...SHADOWS.light },
  joinVoiceInner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  joinVoiceText: { color: COLORS.white, fontWeight: '800', fontSize: 13, marginLeft: 4 },
  startVoiceBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(251, 113, 133, 0.05)', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(251, 113, 133, 0.1)' },
  startVoiceText: { fontSize: 12, color: COLORS.primary, fontWeight: '800', marginLeft: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  listContent: { padding: 20, paddingBottom: 40 },
  messageWrapper: { marginBottom: 15, maxWidth: '85%' },
  myWrapper: { alignSelf: 'flex-end' },
  theirWrapper: { alignSelf: 'flex-start' },
  senderText: { fontSize: 11, fontWeight: '800', color: COLORS.gray, marginBottom: 4, marginLeft: 12 },
  myBubble: { padding: 14, borderRadius: 20, borderBottomRightRadius: 4, ...SHADOWS.medium },
  theirBubble: { padding: 14, borderRadius: 20, borderBottomLeftRadius: 4, backgroundColor: COLORS.white, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', ...SHADOWS.light },
  myText: { fontSize: 16, color: COLORS.white, fontWeight: '600', lineHeight: 22 },
  theirText: { fontSize: 16, color: COLORS.secondary, fontWeight: '500', lineHeight: 22 },
  typingIndicator: { paddingHorizontal: 10, marginBottom: 15 },
  typingText: { fontSize: 12, color: COLORS.gray, fontWeight: '600', fontStyle: 'italic' },
  inputContainer: { paddingHorizontal: 15, paddingBottom: Platform.OS === 'ios' ? 35 : 15, paddingTop: 10, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, borderRadius: 30, paddingHorizontal: 12, paddingVertical: 6 },
  attachBtn: { padding: 8 },
  input: { flex: 1, fontSize: 16, color: COLORS.secondary, paddingHorizontal: 10, maxHeight: 100, paddingTop: 10, paddingBottom: 10 },
  sendButton: { width: 42, height: 42, borderRadius: 21, overflow: 'hidden', marginLeft: 5 },
  sendBtnInner: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
