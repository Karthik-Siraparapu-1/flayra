import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions,
  Platform
} from 'react-native';
import { Audio } from 'expo-av';
import { COLORS, SHADOWS, SPACING } from '../../theme/designSystem';
import Icon from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring 
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

export default function VibePlayer({ vibe, onClose }) {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);

  const translateY = useSharedValue(100);

  useEffect(() => {
    translateY.value = withSpring(0);
    loadAudio();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [vibe]);

  const loadAudio = async () => {
    try {
      // Mocking audio playback for demo purposes if URL is missing
      const source = vibe.audioUrl ? { uri: vibe.audioUrl } : require('../../../assets/placeholder_vibe.mp3');
      const { sound: newSound } = await Audio.Sound.createAsync(
        source,
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );
      setSound(newSound);
      setIsPlaying(true);
    } catch (err) {
      console.error('Error loading audio:', err);
    }
  };

  const onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setDuration(status.durationMillis);
      setPosition(status.positionMillis);
      setIsPlaying(status.isPlaying);
      if (status.didJustFinish) {
        setIsPlaying(false);
      }
    }
  };

  const togglePlay = async () => {
    if (!sound) return;
    if (isPlaying) {
      await sound.pauseAsync();
    } else {
      await sound.playAsync();
    }
  };

  const formatTime = (millis) => {
    const totalSeconds = millis / 1000;
    const seconds = Math.floor(totalSeconds % 60);
    const minutes = Math.floor(totalSeconds / 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }]
  }));

  const progress = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <BlurView intensity={80} tint="dark" style={styles.blur}>
        <View style={styles.content}>
          <TouchableOpacity style={styles.playBtn} onPress={togglePlay}>
            <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.playBtnInner}>
              <Icon name={isPlaying ? "pause" : "play"} size={24} color={COLORS.white} />
            </LinearGradient>
          </TouchableOpacity>
          
          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={1}>{vibe.title}</Text>
            <View style={styles.progressContainer}>
               <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progress}%` }]} />
               </View>
               <View style={styles.timeRow}>
                  <Text style={styles.timeText}>{formatTime(position)}</Text>
                  <Text style={styles.timeText}>{formatTime(duration)}</Text>
               </View>
            </View>
          </View>

          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Icon name="close-circle" size={30} color="rgba(255,255,255,0.3)" />
          </TouchableOpacity>
        </View>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80,
    left: 20,
    right: 20,
    zIndex: 1000,
    borderRadius: 24,
    overflow: 'hidden',
    ...SHADOWS.heavy
  },
  blur: { padding: 15 },
  content: { flexDirection: 'row', alignItems: 'center' },
  playBtn: { marginRight: 15 },
  playBtnInner: { width: 45, height: 45, borderRadius: 23, justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1 },
  title: { color: COLORS.white, fontWeight: '800', fontSize: 14, marginBottom: 8 },
  progressContainer: { width: '100%' },
  progressBar: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primary },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  timeText: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700' },
  closeBtn: { marginLeft: 15 }
});
