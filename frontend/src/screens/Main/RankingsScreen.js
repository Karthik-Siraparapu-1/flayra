import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Image, Platform, TouchableOpacity } from 'react-native';
import api from '../../config/api';
import Icon from 'react-native-vector-icons/Ionicons';
import { useIsFocused } from '@react-navigation/native';
import { COLORS, SHADOWS, TYPOGRAPHY, SPACING } from '../../theme/designSystem';
import GlassCard from '../../components/ui/GlassCard';
import { LinearGradient } from 'expo-linear-gradient';
import useAuthStore from '../../store/authStore';

export default function RankingsScreen() {
  const { user: currentUser } = useAuthStore();
  const [rankedUsers, setRankedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myRankData, setMyRankData] = useState(null);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      fetchRankings();
    }
  }, [isFocused]);

  const fetchRankings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/user/rankings');
      const data = response.data;
      setRankedUsers(data);
      
      // Find current user's rank
      const myIndex = data.findIndex(u => u._id === (currentUser?.id || currentUser?._id));
      if (myIndex !== -1) {
        setMyRankData({ ...data[myIndex], rank: myIndex + 1 });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item, index }) => {
    const isTop3 = index < 3;
    const isMe = item._id === (currentUser?.id || currentUser?._id);
    const rankColors = [
      ['#FFD700', '#F97316'], // Gold to Orange
      ['#CBD5E1', '#64748B'], // Silver to Slate
      ['#B45309', '#78350F']  // Bronze to Brown
    ];
    
    const glowColor = index === 0 ? 'rgba(251, 191, 36, 0.2)' : 
                      index === 1 ? 'rgba(148, 163, 184, 0.15)' : 
                      index === 2 ? 'rgba(180, 83, 9, 0.15)' : 'transparent';
    
    return (
      <View style={[
        styles.row, 
        isTop3 && styles.top3Row, 
        isTop3 && { shadowColor: rankColors[index][0], shadowOpacity: 0.3, shadowRadius: 15, elevation: 8, backgroundColor: glowColor },
        isMe && styles.meRow
      ]}>
        <View style={styles.rankBadge}>
           {isTop3 ? (
             <LinearGradient
               colors={rankColors[index]}
               style={styles.crownContainer}
             >
               <Icon name={index === 0 ? "ribbon" : "trophy"} size={14} color={COLORS.white} />
             </LinearGradient>
           ) : (
             <Text style={styles.rankText}>{index + 1}</Text>
           )}
        </View>
        
        <View style={styles.avatarWrapper}>
          <Image source={{ uri: item.profilePhotos?.[0] || 'https://via.placeholder.com/100' }} style={[styles.avatar, isTop3 && { borderColor: rankColors[index][0], borderWidth: 3 }]} />
          {isMe && <View style={styles.meIndicator}><Text style={styles.meIndicatorText}>YOU</Text></View>}
        </View>

        <View style={styles.infoContainer}>
           <Text style={styles.name} numberOfLines={1}>{item.firstName} {item.lastName}</Text>
           <Text style={styles.university} numberOfLines={1}>{item.university}</Text>
        </View>

        <View style={styles.scoreContainer}>
           <Icon name="flash" size={16} color={COLORS.primary} />
           <Text style={styles.scoreText}>{item.score.toFixed(0)}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Calibrating Global Elite Rankings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.white, '#f8fafc']}
        style={styles.header}
      >
        <Text style={styles.title}>Hall of Fame</Text>
        <Text style={styles.subtitle}>The most influential students worldwide 🚀</Text>
      </LinearGradient>
      
      <FlatList
        data={rankedUsers}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {myRankData && (
        <GlassCard intensity={80} style={styles.myRankFooter}>
           <View style={styles.myRankInfo}>
              <View style={styles.myRankBadge}>
                 <Text style={styles.myRankText}>#{myRankData.rank}</Text>
              </View>
              <View style={{ marginLeft: 15 }}>
                 <Text style={styles.myName}>Your Standing</Text>
                 <Text style={styles.myStats}>{myRankData.score.toFixed(0)} Power Score</Text>
              </View>
           </View>
           <TouchableOpacity style={styles.boostBtn}>
              <Icon name="rocket" size={20} color={COLORS.white} />
              <Text style={styles.boostText}>Boost</Text>
           </TouchableOpacity>
        </GlassCard>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white },
  loadingText: { color: COLORS.gray, marginTop: 16, fontSize: 16, fontWeight: '800' },
  header: { paddingTop: 70, paddingHorizontal: 24, paddingBottom: 20 },
  title: { fontSize: 34, fontWeight: '900', color: COLORS.secondary, letterSpacing: -1 },
  subtitle: { fontSize: 13, color: COLORS.gray, marginTop: 4, fontWeight: '700' },
  listContent: { padding: 20, paddingBottom: 120 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, padding: 16, borderRadius: 28, marginBottom: 15, ...SHADOWS.medium, borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)' },
  top3Row: { borderWidth: 1.5 },
  meRow: { borderColor: COLORS.primary, backgroundColor: 'rgba(220,38,38,0.02)' },
  rankBadge: { width: 40, alignItems: 'center' },
  rankText: { fontSize: 16, fontWeight: '900', color: COLORS.gray, opacity: 0.6 },
  crownContainer: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', ...SHADOWS.light },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 62, height: 62, borderRadius: 31, backgroundColor: COLORS.lightGray },
  meIndicator: { position: 'absolute', bottom: -5, left: -5, right: -5, backgroundColor: COLORS.primary, borderRadius: 8, paddingVertical: 2, alignItems: 'center' },
  meIndicatorText: { color: COLORS.white, fontSize: 8, fontWeight: '900' },
  infoContainer: { flex: 1, marginLeft: 18 },
  name: { fontSize: 18, fontWeight: '800', color: COLORS.secondary, marginBottom: 2 },
  university: { fontSize: 11, color: COLORS.gray, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  scoreContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.04)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18 },
  scoreText: { color: COLORS.secondary, fontWeight: '900', fontSize: 17, marginLeft: 5 },
  myRankFooter: { position: 'absolute', bottom: 30, left: 20, right: 20, height: 80, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, borderRadius: 25, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.3)', ...SHADOWS.heavy },

  myRankInfo: { flexDirection: 'row', alignItems: 'center' },
  myRankBadge: { width: 45, height: 45, borderRadius: 15, backgroundColor: COLORS.secondary, justifyContent: 'center', alignItems: 'center' },
  myRankText: { color: COLORS.white, fontWeight: '900', fontSize: 18 },
  myName: { fontSize: 13, fontWeight: '700', color: COLORS.gray, textTransform: 'uppercase' },
  myStats: { fontSize: 18, fontWeight: '900', color: COLORS.secondary },
  boostBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 15, gap: 8, ...SHADOWS.medium },
  boostText: { color: COLORS.white, fontWeight: '800', fontSize: 14 }
});

