import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, TouchableOpacity, ActivityIndicator, Image, Platform } from 'react-native';
import { VideoMock as Video } from '../../mocks/WebMocks';
import api from '../../config/api';
import Icon from 'react-native-vector-icons/Ionicons';
import useAuthStore from '../../store/authStore';
import { COLORS, SHADOWS, TYPOGRAPHY } from '../../theme/designSystem';
import GlassCard from '../../components/ui/GlassCard';
import { LinearGradient } from 'expo-linear-gradient';

const { height, width } = Dimensions.get('window');
const REEL_HEIGHT = height - 90; // Adjust based on bottom tab height

const SingleReel = ({ item, isVisible, onLike }) => {
  const video = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsPlaying(true);
      video.current?.playAsync();
    } else {
      setIsPlaying(false);
      video.current?.pauseAsync();
    }
  }, [isVisible]);

  const togglePlay = () => {
    if (isPlaying) {
      video.current?.pauseAsync();
      setIsPlaying(false);
    } else {
      video.current?.playAsync();
      setIsPlaying(true);
    }
  };

  const handleLike = () => {
    setLiked(!liked);
    onLike(item.id, !liked);
  };

  return (
    <View style={styles.reelContainer}>
      <TouchableOpacity activeOpacity={0.9} onPress={togglePlay} style={styles.videoWrapper}>
        <Video
          ref={video}
          style={styles.video}
          source={{ uri: item.videoUrl }}
          resizeMode="cover"
          isLooping
          shouldPlay={isVisible}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.bottomGradient}
        />
      </TouchableOpacity>
      
      {!isPlaying && (
         <View style={styles.playIconOverlay}>
            <Icon name="play" size={80} color="rgba(255,255,255,0.4)" />
         </View>
      )}

      {/* Right Action Bar */}
      <View style={styles.actionsContainer}>
        <View style={styles.avatarWrapper}>
           <Image source={{ uri: item.userId?.profilePhotos?.[0] || 'https://via.placeholder.com/100' }} style={styles.avatar} />
           <View style={styles.plusIcon}>
              <Icon name="add" size={14} color={COLORS.white} />
           </View>
        </View>
        
        <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
          <GlassCard style={styles.iconCircle} intensity={25}>
            <Icon name={liked ? "heart" : "heart-outline"} size={28} color={liked ? COLORS.primary : COLORS.white} />
          </GlassCard>
          <Text style={styles.actionText}>{item.likesCount + (liked ? 1 : 0)}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn}>
          <GlassCard style={styles.iconCircle} intensity={25}>
            <Icon name="chatbubble-outline" size={26} color={COLORS.white} />
          </GlassCard>
          <Text style={styles.actionText}>{item.commentsCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn}>
          <GlassCard style={styles.iconCircle} intensity={25}>
            <Icon name="share-social-outline" size={26} color={COLORS.white} />
          </GlassCard>
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Info */}
      <View style={styles.infoContainer}>
        <TouchableOpacity style={styles.userRow}>
          <Text style={styles.username}>@{item.userId?.username || 'user'}</Text>
          <View style={styles.verifiedBadge}>
            <Icon name="checkmark-sharp" size={10} color={COLORS.white} />
          </View>
        </TouchableOpacity>
        {item.caption ? <Text style={styles.caption} numberOfLines={2}>{item.caption}</Text> : null}
      </View>
    </View>
  );
};

export default function ReelsScreen({ navigation }) {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);

  useEffect(() => {
    fetchReels();
  }, []);

  const fetchReels = async () => {
    try {
      const response = await api.get('/reels');
      const formattedReels = response.data.map(r => ({ ...r, id: r._id }));
      setReels(formattedReels);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (reelId, isLiked) => {
      try {
        // await api.post(`/reels/${reelId}/like`, { liked: isLiked });
      } catch (e) {
        console.error(e);
      }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems && viewableItems.length > 0) {
      setActiveVideoIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator color="#0ea5e9" size="large"/></View>;

  return (
    <View style={styles.container}>
      {reels.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="videocam-outline" size={80} color="#334155" />
          <Text style={styles.emptyText}>No Reels yet.</Text>
          <TouchableOpacity 
             style={styles.uploadBtn}
             onPress={() => navigation.navigate('ReelsUpload')}
          >
             <Text style={styles.uploadBtnText}>Upload the First Reel</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <React.Fragment>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Reels</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ReelsUpload')} style={styles.addBtn}>
               <LinearGradient
                 colors={[COLORS.primary, COLORS.primaryDark]}
                 style={styles.addGradient}
               >
                 <Icon name="add" size={24} color={COLORS.white} />
               </LinearGradient>
            </TouchableOpacity>
          </View>
          <FlatList
            data={reels}
            keyExtractor={item => item.id}
            renderItem={({ item, index }) => (
              <SingleReel item={item} isVisible={activeVideoIndex === index} onLike={handleLike} />
            )}
            pagingEnabled
            showsVerticalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            snapToInterval={REEL_HEIGHT}
            snapToAlignment="start"
            decelerationRate="fast"
          />
        </React.Fragment>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.secondary },
  loadingContainer: { flex: 1, backgroundColor: COLORS.secondary, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.secondary },
  emptyText: { color: COLORS.white, fontSize: 20, fontWeight: '800', marginTop: 20, letterSpacing: 1 },
  uploadBtn: { marginTop: 30, backgroundColor: COLORS.primary, paddingHorizontal: 30, paddingVertical: 15, borderRadius: 30, ...SHADOWS.medium },
  uploadBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  header: { position: 'absolute', top: 60, left: 20, right: 20, zIndex: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 32, fontWeight: '900', color: COLORS.white, letterSpacing: -1, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  addBtn: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden', ...SHADOWS.medium },
  addGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  reelContainer: { height: REEL_HEIGHT, width: width, backgroundColor: '#000' },
  videoWrapper: { flex: 1 },
  video: { flex: 1 },
  bottomGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 250 },
  playIconOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, justifyContent: 'center', alignItems: 'center' },
  actionsContainer: { position: 'absolute', right: 15, bottom: 120, alignItems: 'center' },
  avatarWrapper: { marginBottom: 25, position: 'relative' },
  avatar: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: COLORS.white },
  plusIcon: { position: 'absolute', bottom: -5, right: 14, backgroundColor: COLORS.primary, width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.white },
  actionBtn: { alignItems: 'center', marginBottom: 20 },
  iconCircle: { width: 54, height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
  actionText: { color: COLORS.white, fontSize: 13, fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 },
  infoContainer: { position: 'absolute', left: 20, bottom: 120, maxWidth: '70%' },
  userRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  username: { color: COLORS.white, fontSize: 18, fontWeight: '800', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 },
  verifiedBadge: { marginLeft: 6, backgroundColor: COLORS.primary, borderRadius: 10, padding: 2 },
  caption: { color: 'rgba(255,255,255,0.9)', fontSize: 15, fontWeight: '500', lineHeight: 20, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 }
});
