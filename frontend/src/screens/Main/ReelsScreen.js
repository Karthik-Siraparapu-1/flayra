import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, TouchableOpacity, ActivityIndicator, Image, Platform } from 'react-native';
import { Video } from 'expo-av';
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
      </TouchableOpacity>
      
      {!isPlaying && (
         <View style={styles.playIconOverlay}>
            <Icon name="play" size={60} color="rgba(255,255,255,0.6)" />
         </View>
      )}

      {/* Right Action Bar */}
      <View style={styles.actionsContainer}>
        <View style={styles.avatarContainer}>
           <Image source={{ uri: item.userId?.profilePhotos?.[0] || 'https://via.placeholder.com/50' }} style={styles.avatar} />
           <View style={styles.plusIcon}>
              <Icon name="add" size={12} color="#fff" />
           </View>
        </View>
        <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
          <Icon name={liked ? "heart" : "heart-outline"} size={38} color={liked ? "#ef4444" : "#fff"} />
          <Text style={styles.actionText}>{item.likesCount + (liked ? 1 : 0)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Icon name="chatbubble-outline" size={35} color="#fff" />
          <Text style={styles.actionText}>{item.commentsCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Icon name="paper-plane-outline" size={35} color="#fff" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Info Overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.6)']}
        style={styles.infoGradient}
      >
        <View style={styles.infoContainer}>
          <Text style={styles.username}>@{item.userId?.username || item.userId?.firstName || 'user'}</Text>
          {item.caption ? <Text style={styles.caption} numberOfLines={2}>{item.caption}</Text> : null}
        </View>
      </LinearGradient>
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
        await api.post(`/reels/${reelId}/like`, { liked: isLiked });
      } catch (e) {
        console.error('Error liking reel:', e);
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
            <TouchableOpacity onPress={() => navigation.navigate('ReelsUpload')}>
               <Icon name="add-circle-outline" size={32} color="#fff" />
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
  container: { flex: 1, backgroundColor: COLORS.black },
  loadingContainer: { flex: 1, backgroundColor: COLORS.black, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white },
  emptyText: { color: COLORS.gray, fontSize: 20, fontWeight: '700', marginTop: 20 },
  uploadBtn: { marginTop: 20, backgroundColor: COLORS.primary, paddingHorizontal: 30, paddingVertical: 15, borderRadius: 25, ...SHADOWS.medium },
  uploadBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  header: { position: 'absolute', top: 55, left: 20, right: 20, zIndex: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 28, fontWeight: '900', color: COLORS.white, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 10 },
  reelContainer: { height: REEL_HEIGHT, width: width, backgroundColor: COLORS.black },
  videoWrapper: { flex: 1 },
  video: { flex: 1 },
  playIconOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, justifyContent: 'center', alignItems: 'center' },
  actionsContainer: { position: 'absolute', right: 15, bottom: 120, alignItems: 'center' },
  avatarContainer: { borderWidth: 2, borderColor: COLORS.white, borderRadius: 28, marginBottom: 25, position: 'relative' },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  plusIcon: { position: 'absolute', bottom: -5, right: 18, backgroundColor: COLORS.primary, width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.white },
  actionBtn: { alignItems: 'center', marginBottom: 22 },
  actionText: { color: COLORS.white, fontSize: 13, fontWeight: '700', marginTop: 4, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 },
  infoGradient: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '25%', justifyContent: 'flex-end', paddingBottom: 110, paddingHorizontal: 20 },
  infoContainer: { maxWidth: '80%' },
  username: { color: COLORS.white, fontSize: 18, fontWeight: '800', marginBottom: 8, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 5 },
  caption: { color: 'rgba(255,255,255,0.9)', fontSize: 15, fontWeight: '500', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 }
});
