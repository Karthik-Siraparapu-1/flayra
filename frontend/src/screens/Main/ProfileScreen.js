import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import useAuthStore from '../../store/authStore';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, SHADOWS, TYPOGRAPHY, SPACING, SIZES } from '../../theme/designSystem';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import GlassCard from '../../components/ui/GlassCard';
import api from '../../config/api';

export default function ProfileScreen({ navigation }) {
  const { user, logout, updateUser } = useAuthStore();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditingVibe, setIsEditingVibe] = useState(false);
  const [tempAura, setTempAura] = useState(user?.auraType || 'Classic Purple');
  const [tempIntent, setTempIntent] = useState(user?.romanticIntent || 'Campus Soulmate');

  const AURA_TYPES = ['Radiant Rose', 'Midnight Gold', 'Electric Violet', 'Classic Purple'];
  const INTENTS = ['Deep Conversations', 'Campus Soulmate', 'Late Night Vibes', 'Casual Connections', 'Not Sure Yet'];

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get('/user/analytics');
      setAnalytics(response.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVibe = async () => {
    try {
      setLoading(true);
      const res = await api.put('/user/update', {
        auraType: tempAura,
        romanticIntent: tempIntent
      });
      if(updateUser) updateUser(res.data); // If zustand supports this
      setIsEditingVibe(false);
    } catch (e) {
      console.error('Failed to update vibe:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.modalOverlay}>
      <TouchableOpacity 
        style={styles.closeArea} 
        activeOpacity={1} 
        onPress={() => navigation.goBack()}
       >
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
      </TouchableOpacity>
      
      <View style={styles.drawerContainer}>
        <LinearGradient
          colors={[COLORS.secondary, '#1e1b4b', '#2e1065', COLORS.secondary]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.drawerCloseBtn}>
             <Icon name="chevron-forward" size={24} color={COLORS.white} />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.avatarWrapper}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.accent]}
            style={styles.avatarGlow}
          />
          <View style={styles.avatarContainer}>
            {user?.profilePhoto ? (
               <Image source={{ uri: user.profilePhoto }} style={styles.avatarImage} />
            ) : (
               <Text style={styles.avatarText}>{user?.firstName?.charAt(0)}</Text>
            )}
          </View>
          <TouchableOpacity style={styles.editIconBtn}>
             <Icon name="pencil" size={14} color={COLORS.white} />
          </TouchableOpacity>
        </View>
        <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
        <View style={styles.uniBadge}>
           <Icon name="sparkles" size={12} color={COLORS.accent} style={{marginRight: 4}} />
           <Text style={styles.university}>{user?.university || 'University Elite'}</Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Core Stats Bar */}
        <GlassCard style={styles.infoRow} intensity={30}>
           <View style={styles.statBox}>
              <Text style={styles.statValue}>{analytics?.stats?.totalFollowers || 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
           </View>
           <View style={styles.statDivider} />
           <View style={styles.statBox}>
              <Text style={styles.statValue}>{analytics?.stats?.totalLikes || 0}</Text>
              <Text style={styles.statLabel}>Total Likes</Text>
           </View>
           <View style={styles.statDivider} />
           <View style={styles.statBox}>
              <Text style={styles.statValue}>{analytics?.impactScore || 0}</Text>
              <Text style={styles.statLabel}>Impact Score</Text>
           </View>
        </GlassCard>

        {/* Elite Social Insights Section */}
        <View style={styles.sectionHeader}>
           <Text style={styles.sectionTitle}>Elite Social Insights</Text>
           <View style={styles.tierBadge}>
              <Text style={styles.tierText}>{analytics?.socialTier || 'Elite User'}</Text>
           </View>
        </View>

        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 20 }} />
        ) : (
          <GlassCard style={styles.insightsCard} intensity={25}>
            <View style={styles.insightRow}>
               <View style={styles.insightItem}>
                  <Icon name="trending-up" size={20} color={COLORS.success} />
                  <Text style={styles.insightValue}>{analytics?.stats?.discoveryRate || '0%'}</Text>
                  <Text style={styles.insightLabel}>Discovery Rate</Text>
               </View>
               <View style={styles.insightItem}>
                  <Icon name="shield-checkmark" size={20} color={COLORS.primary} />
                  <Text style={styles.insightValue}>{analytics?.stats?.matchQuality || 'N/A'}</Text>
                  <Text style={styles.insightLabel}>Match Quality</Text>
               </View>
            </View>
            
            <View style={styles.divider} />
            
            <Text style={styles.recTitle}>AI Optimization Tips</Text>
            {analytics?.recommendations?.map((rec, i) => (
              <View key={i} style={styles.recItem}>
                 <Icon name="sparkles" size={14} color="#FFD700" style={{marginRight: 8}} />
                 <Text style={styles.recText}>{rec}</Text>
              </View>
            ))}
          </GlassCard>
        )}

        {/* Aura Vibe Section */}
        <View style={styles.sectionHeader}>
           <Text style={styles.sectionTitle}>Personal Aura Vibe</Text>
           <TouchableOpacity onPress={() => setIsEditingVibe(!isEditingVibe)} style={styles.editVibeBtn}>
              <Text style={styles.editVibeText}>{isEditingVibe ? "Cancel" : "Edit Vibe"}</Text>
           </TouchableOpacity>
        </View>

        {isEditingVibe ? (
          <GlassCard style={styles.vibeCard} intensity={30}>
            <Text style={styles.editLabel}>SELECT YOUR AURA</Text>
            <View style={styles.editGrid}>
               {AURA_TYPES.map(aura => (
                 <TouchableOpacity 
                   key={aura} 
                   style={[styles.editTag, tempAura === aura && styles.editTagActive]}
                   onPress={() => setTempAura(aura)}
                 >
                   <Text style={[styles.editTagText, tempAura === aura && styles.editTagTextActive]}>{aura}</Text>
                 </TouchableOpacity>
               ))}
            </View>

            <Text style={[styles.editLabel, { marginTop: 15 }]}>RELATIONSHIP INTENT</Text>
            <View style={styles.editGrid}>
               {INTENTS.map(intent => (
                 <TouchableOpacity 
                   key={intent} 
                   style={[styles.editTag, tempIntent === intent && styles.editTagActive]}
                   onPress={() => setTempIntent(intent)}
                 >
                   <Text style={[styles.editTagText, tempIntent === intent && styles.editTagTextActive]}>{intent}</Text>
                 </TouchableOpacity>
               ))}
            </View>

            <TouchableOpacity style={styles.saveVibeBtn} onPress={handleSaveVibe}>
               <Text style={styles.saveVibeText}>Spark My Profile</Text>
            </TouchableOpacity>
          </GlassCard>
        ) : (
          <GlassCard style={styles.vibeCard} intensity={20}>
             <View style={styles.vibeContainer}>
                {user?.auraType && (
                  <View style={[styles.vibeTag, { borderColor: '#fbbf24', backgroundColor: 'rgba(251,191,36,0.1)' }]}>
                     <Icon name="color-palette" size={12} color="#fbbf24" style={{marginRight: 4}} />
                     <Text style={[styles.vibeTagText, { color: '#fbbf24' }]}>{user.auraType}</Text>
                  </View>
                )}
                {user?.romanticIntent && (
                  <View style={[styles.vibeTag, { borderColor: '#fb7185', backgroundColor: 'rgba(251,113,133,0.1)' }]}>
                     <Icon name="heart-half" size={12} color="#fb7185" style={{marginRight: 4}} />
                     <Text style={[styles.vibeTagText, { color: '#fb7185' }]}>{user.romanticIntent}</Text>
                  </View>
                )}
                {!user?.auraType && !user?.romanticIntent && ['Romantic', 'Elite', 'Ambitious'].map((vibe, idx) => (
                  <View key={idx} style={styles.vibeTag}>
                     <Text style={styles.vibeTagText}>{vibe}</Text>
                  </View>
                ))}
             </View>
          </GlassCard>
        )}

        <View style={styles.detailsSection}>
          <GlassCard style={styles.infoCard} intensity={20}>
            <View style={styles.infoItem}>
              <Icon name="at-circle-outline" size={20} color={COLORS.gray} style={{marginRight: 12}} />
              <View>
                <Text style={styles.infoLabel}>Username</Text>
                <Text style={styles.infoValue}>@{user?.nickname || user?.username || 'not_set'}</Text>
              </View>
            </View>
          </GlassCard>

          <GlassCard style={styles.infoCard} intensity={20}>
            <View style={styles.infoItem}>
              <Icon name="mail-outline" size={20} color={COLORS.gray} style={{marginRight: 12}} />
              <View>
                <Text style={styles.infoLabel}>Email Address</Text>
                <Text style={styles.infoValue}>{user?.email}</Text>
              </View>
            </View>
          </GlassCard>
        </View>
      </View>

      <TouchableOpacity activeOpacity={0.7} style={styles.logoutButton} onPress={logout}>
         <Icon name="log-out-outline" size={20} color="#fca5a5" style={{marginRight: 8}} />
         <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
      </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, flexDirection: 'row', backgroundColor: 'transparent' },
  closeArea: { flex: 0.2, height: '100%' },
  drawerContainer: { flex: 0.8, height: '100%', backgroundColor: COLORS.secondary, ...SHADOWS.heavy, borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.1)' },
  drawerCloseBtn: { position: 'absolute', top: 60, left: 10, zIndex: 10, padding: 10 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 60 },
  header: { alignItems: 'center', marginTop: 40, marginBottom: 30 },
  avatarWrapper: { position: 'relative', marginBottom: 20, justifyContent: 'center', alignItems: 'center' },
  avatarGlow: { position: 'absolute', width: 125, height: 125, borderRadius: 65, opacity: 0.4 },
  avatarContainer: { width: 110, height: 110, borderRadius: 55, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', ...SHADOWS.heavy, borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)' },
  avatarImage: { width: 110, height: 110, borderRadius: 55 },
  avatarText: { fontSize: 44, fontWeight: '900', color: COLORS.white, textShadowColor: 'rgba(0,0,0,0.1)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  editIconBtn: { position: 'absolute', bottom: 5, right: 5, backgroundColor: COLORS.primary, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.white, ...SHADOWS.light },
  name: { fontSize: 24, fontWeight: '900', color: COLORS.white, marginBottom: 8, letterSpacing: 0.5 },
  uniBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  university: { fontSize: 11, color: COLORS.accent, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  content: { flex: 1 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingVertical: 20, marginBottom: 30, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  statBox: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '900', color: COLORS.white },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '700', marginTop: 4, textTransform: 'uppercase' },
  statDivider: { width: 1, height: '40%', backgroundColor: 'rgba(255,255,255,0.1)' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: COLORS.white, letterSpacing: 0.5 },
  tierBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(253, 230, 138, 0.15)', borderWidth: 1, borderColor: 'rgba(253, 230, 138, 0.3)' },
  tierText: { fontSize: 9, fontWeight: '900', color: COLORS.accent, textTransform: 'uppercase', letterSpacing: 1 },
  insightsCard: { padding: 15, marginBottom: 20 },
  insightRow: { flexDirection: 'row', justifyContent: 'space-around' },
  insightItem: { alignItems: 'center' },
  insightValue: { fontSize: 16, fontWeight: '900', color: COLORS.white, marginVertical: 4 },
  insightLabel: { fontSize: 9, color: 'rgba(255,255,255,0.5)', fontWeight: '800', textTransform: 'uppercase' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 12 },
  recTitle: { fontSize: 13, fontWeight: '900', color: COLORS.white, marginBottom: 8 },
  recItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  recText: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  vibeCard: { padding: 15, marginBottom: 20 },
  vibeContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  vibeTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(251, 113, 133, 0.15)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(251, 113, 133, 0.3)' },
  vibeTagText: { color: COLORS.white, fontWeight: '700', fontSize: 11 },
  editVibeBtn: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  editVibeText: { color: COLORS.white, fontSize: 10, fontWeight: '700' },
  editLabel: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.5)', letterSpacing: 1, marginBottom: 10 },
  editGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  editTag: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'transparent' },
  editTagActive: { borderColor: COLORS.accent, backgroundColor: 'rgba(236,72,153,0.2)' },
  editTagText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' },
  editTagTextActive: { color: COLORS.white, fontWeight: 'bold' },
  saveVibeBtn: { marginTop: 20, backgroundColor: COLORS.accent, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  saveVibeText: { color: COLORS.white, fontWeight: '900', fontSize: 14, letterSpacing: 0.5 },
  detailsSection: { gap: 12 },
  infoCard: { padding: 15 },
  infoItem: { flexDirection: 'row', alignItems: 'center' },
  infoLabel: { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: '700', color: COLORS.white },
  logoutButton: { height: 55, flexDirection: 'row', backgroundColor: 'rgba(244,63,94,0.1)', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(244,63,94,0.2)' },
  logoutText: { color: '#fca5a5', fontSize: 15, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }
});
