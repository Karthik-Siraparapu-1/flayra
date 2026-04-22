// Flayra Discover Screen - Premium Social Discovery
import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  Dimensions, 
  ActivityIndicator, 
  Alert, 
  TouchableOpacity, 
  Animated, 
  Platform 
} from 'react-native';
import Swiper from 'react-native-deck-swiper';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../config/api';
import useAuthStore from '../../store/authStore';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, SPACING, SIZES, TYPOGRAPHY, SHADOWS } from '../../theme/designSystem';
import GlassCard from '../../components/ui/GlassCard';
import ShimmerSkeleton from '../../components/ui/ShimmerSkeleton';
import FlameMatchOverlay from '../../components/ui/FlameMatchOverlay';

const { width, height } = Dimensions.get('window');

export default function DiscoverScreen({ navigation }) {
  const { user } = useAuthStore();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matchedUser, setMatchedUser] = useState(null);
  const swiperRef = useRef(null);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const response = await api.get('/discover'); // Using the dedicated discover route
      // Filter out self (backend usually does this, but being safe)
      const filtered = response.data.filter(p => p._id !== (user?.id || user?._id));
      setProfiles(filtered);
    } catch (e) {
      console.error("Error fetching profiles:", e);
      Alert.alert("Error", "Could not load profiles");
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (index, type) => {
    if (index >= profiles.length) return;
    const targetUser = profiles[index];

    try {
      const response = await api.post('/swipe', {
        swipedOnId: targetUser._id,
        type: type
      });

      if (response.data.matchStatus) {
        setMatchedUser(targetUser);
      }
    } catch (e) {
      if (e?.response?.status === 429) {
        Alert.alert(
          "🛡️ Elite Limit Reached",
          "You've reached your daily campus swipe limit. Wait for the 'Token Bucket' to refill or upgrade to Flayra Pro for unlimited reach!",
          [{ text: "Understood", style: "cancel" }]
        );
      } else {
        console.error("Error recording swipe:", e?.response?.data || e.message);
      }
    }
  };

  const renderCard = (card) => {
    if (!card) return <View style={styles.card} />;

    const chemScore = parseFloat(card.auraChemistry) || 0;
    const matchColor = chemScore > 85 ? '#fb7185' : 
                       chemScore > 50 ? '#fbbf24' : '#38bdf8';
    
    const isHighAura = chemScore > 85;

    return (
      <View style={[styles.card, isHighAura && styles.auraGlowBorder]}>
        {isHighAura && (
           <Animated.View style={styles.auraPulseOverlay} />
        )}
        <Image
          source={{ uri: card.profilePhotos && card.profilePhotos.length > 0 ? card.profilePhotos[0] : 'https://via.placeholder.com/600x800.png?text=Flayra+Student' }}
          style={styles.cardImage}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.95)']}
          style={styles.cardGradient}
        >
          <View style={styles.cardInfo}>
            <View style={styles.badgeRow}>
              {card.mutualCount > 0 && (
                <GlassCard intensity={40} tint="light" style={styles.mutualBadge}>
                   <Icon name="people" size={12} color={COLORS.white} />
                   <Text style={styles.mutualText}>{card.mutualCount} Mutuals</Text>
                </GlassCard>
              )}
              
              {card.auraChemistry && (
                <GlassCard intensity={45} tint="light" style={[styles.matchBadge, { borderColor: matchColor, backgroundColor: isHighAura ? 'rgba(251,113,133,0.2)' : 'transparent' }]}>
                   <Icon name="heart-half" size={12} color={matchColor} style={{ marginRight: 4 }} />
                   <Text style={[styles.matchText, { color: matchColor }]}>{card.auraChemistry}% Aura Spark</Text>
                </GlassCard>
              )}
            </View>

            <View style={styles.nameRow}>
              <Text style={styles.cardName}>{card.firstName}, {card.age}</Text>
              {card.globalScore > 500 && (
                 <View style={styles.eliteStatus}>
                    <Icon name="medal" size={16} color="#fbbf24" />
                 </View>
              )}
              {card.isVerified && <Icon name="checkmark-circle" size={24} color="#38bdf8" style={{marginLeft: 8}} />}
            </View>
            
            <View style={styles.uniRow}>
              <Icon name="school" size={14} color="rgba(255,255,255,0.8)" />
              <Text style={styles.cardUniversity}>{card.branch || 'Student'} • {card.university}</Text>
            </View>
            
            {card.bio ? <Text style={styles.cardBio} numberOfLines={2}>{card.bio}</Text> : null}
            
            {card.matchFactors && card.matchFactors.length > 0 && (
               <View style={styles.factorsContainer}>
                 {card.matchFactors.map((factor, idx) => (
                   <View key={idx} style={styles.factorRow}>
                      <Icon name="checkmark-circle-outline" size={12} color="#10b981" />
                      <Text style={styles.factorText}>{factor}</Text>
                   </View>
                 ))}
               </View>
            )}

            <View style={styles.tagsContainer}>
              {card.interests && card.interests.slice(0, 3).map((interest, idx) => (
                <GlassCard key={idx} intensity={25} tint="light" style={styles.tag}>
                  <Text style={styles.tagText}>{interest}</Text>
                </GlassCard>
              ))}
              {card.hobbies && card.hobbies.length > 0 && (
                 <GlassCard intensity={15} tint="light" style={styles.tagHint}>
                    <Text style={styles.tagHintText}>+{card.hobbies.length} Hobbies</Text>
                 </GlassCard>
              )}
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={[COLORS.white, '#f8fafc']} style={styles.container}>
        <View style={styles.header}>
           <ShimmerSkeleton width={150} height={40} borderRadius={10} />
           <ShimmerSkeleton width={50} height={50} borderRadius={25} />
        </View>
        <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
           <ShimmerSkeleton width={width - 40} height={height * 0.65} borderRadius={30} />
           <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginTop: 30 }}>
              <ShimmerSkeleton width={75} height={75} borderRadius={37.5} />
              <ShimmerSkeleton width={75} height={75} borderRadius={37.5} />
           </View>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[COLORS.white, '#f8fafc']} style={styles.container}>
      <View style={styles.header}>
        {/* Profile Avatar (Top Left) */}
        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Profile')}
          style={styles.avatarBtn}
        >
          {user?.profilePhotos?.[0] ? (
            <Image source={{ uri: user.profilePhotos[0] }} style={styles.profileIcon} />
          ) : (
            <View style={[styles.profileIcon, { backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' }]}>
               <Text style={styles.avatarInitial}>{user?.firstName?.charAt(0)}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Central Discover Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Discover</Text>
        </View>

        {/* Right Actions (Map + Random Call) */}
        <View style={styles.headerActions}>
          <TouchableOpacity 
            activeOpacity={0.7}
            style={styles.headerIconBtn}
            onPress={() => navigation.navigate('Map')}
          >
            <Icon name="map-outline" size={24} color={COLORS.secondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            activeOpacity={0.7}
            style={[styles.headerIconBtn, styles.accentBtn]}
            onPress={() => navigation.navigate('RandomCall')}
          >
            <Icon name="videocam" size={22} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      {profiles.length > 0 ? (
        <View style={styles.mainContent}>
          <View style={styles.swiperContainer}>
            <Swiper
              ref={swiperRef}
              cards={profiles}
              renderCard={renderCard}
              onSwipedLeft={(index) => handleSwipe(index, 'left')}
              onSwipedRight={(index) => handleSwipe(index, 'right')}
              stackSize={3}
              backgroundColor="transparent"
              cardIndex={0}
              animateCardOpacity
              containerStyle={styles.swiperWrapper}
              cardVerticalMargin={10}
              overlayLabels={{
                left: {
                  title: 'NOPE',
                  style: {
                    label: { backgroundColor: COLORS.error, color: COLORS.white, fontSize: 32, fontWeight: '900', padding: 10, borderRadius: 15, transform: [{ rotate: '15deg' }] },
                    wrapper: { flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'flex-start', marginTop: 50, marginLeft: -30 }
                  }
                },
                right: {
                  title: 'LIKE',
                  style: {
                    label: { backgroundColor: COLORS.success, color: COLORS.white, fontSize: 32, fontWeight: '900', padding: 10, borderRadius: 15, transform: [{ rotate: '-15deg' }] },
                    wrapper: { flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', marginTop: 50, marginLeft: 30 }
                  }
                }
              }}
            />
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              activeOpacity={0.8}
              style={[styles.actionButton, styles.nopeButton]} 
              onPress={() => swiperRef.current.swipeLeft()}
            >
              <Icon name="close" size={36} color={COLORS.error} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              activeOpacity={0.8}
              style={[styles.actionButton, styles.likeButton]} 
              onPress={() => swiperRef.current.swipeRight()}
            >
              <Icon name="heart" size={36} color={COLORS.success} />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Icon name="planet-outline" size={80} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyTitle}>You&apos;ve seen everyone!</Text>
          <Text style={styles.emptySubtitle}>Check back later for more campus connections.</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={fetchProfiles}>
             <Text style={styles.refreshButtonText}>Refresh Search</Text>
          </TouchableOpacity>
        </View>
      )}

      {matchedUser && (
        <FlameMatchOverlay 
          currentUser={user} 
          matchedUser={matchedUser} 
          onClose={() => setMatchedUser(null)}
          onMessageFlow={() => {
            setMatchedUser(null);
            Alert.alert("Love Note", `Open chat with ${matchedUser.firstName} (Coming Next)`);
          }}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.white, ...SHADOWS.light },
  avatarBtn: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden', ...SHADOWS.light, borderWidth: 2, borderColor: COLORS.white },
  profileIcon: { width: '100%', height: '100%' },
  avatarInitial: { color: COLORS.white, fontWeight: '900', fontSize: 18 },
  titleContainer: { position: 'absolute', left: 0, right: 0, top: 60, height: 44, justifyContent: 'center', alignItems: 'center', pointerEvents: 'none' },
  title: { fontSize: 22, fontWeight: '900', color: COLORS.secondary, letterSpacing: -0.5 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.lightGray, justifyContent: 'center', alignItems: 'center' },
  accentBtn: { backgroundColor: COLORS.primary },
  randomCallBtn: { ...SHADOWS.medium },
  btnInner: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  mainContent: { flex: 1 },
  swiperContainer: { flex: 1, marginTop: -20 }, 
  swiperWrapper: { backgroundColor: 'transparent' },
  card: { height: height * 0.65, borderRadius: 32, backgroundColor: COLORS.white, overflow: 'hidden', ...SHADOWS.heavy, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  auraGlowBorder: { borderColor: 'rgba(251, 113, 133, 0.8)', borderWidth: 3, ...SHADOWS.heavy, shadowColor: '#fb7185' },
  auraPulseOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(251, 113, 133, 0.1)', zIndex: 1 },
  cardImage: { width: '100%', height: '100%' },
  cardGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%', justifyContent: 'flex-end', padding: 25, zIndex: 2 },
  cardInfo: { },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  mutualBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderHorizontal: 1, borderColor: 'rgba(255,255,255,0.2)' },
  mutualText: { color: COLORS.white, fontSize: 11, fontWeight: '700', marginLeft: 4 },
  matchBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1 },
  matchText: { fontSize: 11, fontWeight: '800' },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  cardName: { fontSize: 30, fontWeight: '900', color: COLORS.white, letterSpacing: -0.5 },
  eliteStatus: { marginLeft: 8, backgroundColor: 'rgba(251,191,36,0.15)', padding: 4, borderRadius: 8 },
  uniRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardUniversity: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.85)', marginLeft: 6 },
  cardBio: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontStyle: 'italic', marginBottom: 15, lineHeight: 18 },
  factorsContainer: { marginBottom: 15, backgroundColor: 'rgba(16,185,129,0.08)', padding: 10, borderRadius: 12 },
  factorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  factorText: { fontSize: 11, fontWeight: '700', color: '#10b981', marginLeft: 6, textTransform: 'capitalize' },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginRight: 8, marginBottom: 8 },
  tagText: { color: COLORS.white, fontSize: 11, fontWeight: '700' },
  tagHint: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, marginBottom: 8 },
  tagHintText: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIconCircle: { width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(220,38,38,0.05)', justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
  emptyTitle: { color: COLORS.secondary, fontSize: 24, fontWeight: '800', marginBottom: 10 },
  emptySubtitle: { color: COLORS.gray, fontSize: 16, textAlign: 'center', marginBottom: 30 },
  refreshButton: { backgroundColor: COLORS.primary, paddingHorizontal: 30, paddingVertical: 15, borderRadius: 30, ...SHADOWS.medium },
  refreshButtonText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-evenly', paddingBottom: 40, marginTop: 10 },
  actionButton: { width: 70, height: 70, borderRadius: 35, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', ...SHADOWS.medium, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  nopeButton: { },
  likeButton: { }
});

