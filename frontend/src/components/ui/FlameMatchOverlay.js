import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Image } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  withTiming, 
  withDelay, 
  withSequence,
  runOnJS
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Audio } from 'expo-av';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, SHADOWS, TYPOGRAPHY } from '../../theme/designSystem';

const { width, height } = Dimensions.get('window');

export default function FlameMatchOverlay({ currentUser, matchedUser, onClose, onMessageFlow }) {
  const [sound, setSound] = useState(null);
  
  // Animation Values
  const opacity = useSharedValue(0);
  const leftAvatarX = useSharedValue(-width);
  const rightAvatarX = useSharedValue(width);
  const scale = useSharedValue(0.5);
  const textOpacity = useSharedValue(0);

  useEffect(() => {
    playSound();
    
    // Fade in overlay
    opacity.value = withTiming(1, { duration: 400 });

    // Bring avatars together
    leftAvatarX.value = withSpring(-30, { damping: 12 });
    rightAvatarX.value = withSpring(30, { damping: 12 });

    // Pop the whole connected entity
    scale.value = withDelay(400, withSequence(
      withSpring(1.2, { damping: 10 }),
      withSpring(1, { damping: 10 })
    ));

    // Fade in text
    textOpacity.value = withDelay(800, withTiming(1, { duration: 500 }));

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const playSound = async () => {
    try {
      // Assuming you have a gentle 'spark/chime' sound in assets. 
      // Fallback logic if it fails is handled by catch.
      const { sound: sparkSound } = await Audio.Sound.createAsync(
        require('../../../assets/placeholder_vibe.mp3') // TODO: Replace with real spark.mp3
      );
      setSound(sparkSound);
      await sparkSound.playAsync();
    } catch (err) {
      console.log('Spark sound failed to play (might be missing asset)', err);
    }
  };

  const handleClose = () => {
    opacity.value = withTiming(0, { duration: 300 }, (finished) => {
      if (finished) runOnJS(onClose)();
    });
  };

  const leftAvatarStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: leftAvatarX.value }]
  }));

  const rightAvatarStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: rightAvatarX.value }]
  }));

  const popStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: withTiming(textOpacity.value === 1 ? 0 : 20) }]
  }));

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill}>
        <LinearGradient 
          colors={['rgba(225, 29, 72, 0.2)', 'rgba(88, 28, 135, 0.6)']} 
          style={StyleSheet.absoluteFill} 
        />
        
        <View style={styles.content}>
          <Animated.View style={[styles.avatarsContainer, popStyle]}>
             <Animated.View style={[styles.avatarWrapper, styles.leftWrapper, leftAvatarStyle]}>
                <View style={[styles.auraRing, { borderColor: '#fb7185' }]} />
                <Image 
                  source={{ uri: currentUser?.profilePhotos?.[0] || 'https://via.placeholder.com/100' }} 
                  style={styles.avatar} 
                />
             </Animated.View>

             <Animated.View style={[styles.avatarWrapper, styles.rightWrapper, rightAvatarStyle]}>
                <View style={[styles.auraRing, { borderColor: '#fbbf24' }]} />
                <Image 
                  source={{ uri: matchedUser?.profilePhotos?.[0] || 'https://via.placeholder.com/100' }} 
                  style={styles.avatar} 
                />
             </Animated.View>
             
             {/* The Heart/Spark Icon in the middle */}
             <View style={styles.sparkCenter}>
                <Icon name="heart" size={40} color={COLORS.primary} />
             </View>
          </Animated.View>

          <Animated.View style={[styles.textContainer, textStyle]}>
            <Text style={styles.matchTitle}>Aura Spark!</Text>
            <Text style={styles.matchSubtitle}>You and {matchedUser?.firstName} share a connection.</Text>
            
            <View style={styles.actions}>
               <TouchableOpacity 
                 activeOpacity={0.8} 
                 style={styles.messageBtn}
                 onPress={onMessageFlow}
               >
                  <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.btnGradient}>
                     <Icon name="flash" size={20} color={COLORS.white} style={{marginRight: 8}} />
                     <Text style={styles.btnText}>Send a Love Note</Text>
                  </LinearGradient>
               </TouchableOpacity>

               <TouchableOpacity activeOpacity={0.6} style={styles.keepSwipingBtn} onPress={handleClose}>
                  <Text style={styles.keepSwipingText}>Keep Discovering</Text>
               </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  avatarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 180,
    width: '100%',
    position: 'relative'
  },
  avatarWrapper: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.heavy
  },
  leftWrapper: { zIndex: 1 },
  rightWrapper: { zIndex: 2 },
  auraRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    opacity: 0.8
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: COLORS.white
  },
  sparkCenter: {
    position: 'absolute',
    zIndex: 3,
    backgroundColor: COLORS.white,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.heavy
  },
  textContainer: {
    marginTop: 60,
    alignItems: 'center',
    width: '100%'
  },
  matchTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: COLORS.white,
    textShadowColor: 'rgba(225, 29, 72, 0.8)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
    marginBottom: 10,
    letterSpacing: -1
  },
  matchSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 40
  },
  actions: {
    width: '100%',
    alignItems: 'center',
    gap: 20
  },
  messageBtn: {
    width: '80%',
    borderRadius: 30,
    overflow: 'hidden',
    ...SHADOWS.medium
  },
  btnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  btnText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  keepSwipingBtn: {
    paddingVertical: 15,
    paddingHorizontal: 30
  },
  keepSwipingText: {
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '800',
    fontSize: 15,
    textTransform: 'uppercase',
    letterSpacing: 1
  }
});
