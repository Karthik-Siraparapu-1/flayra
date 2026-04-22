import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator 
} from 'react-native';
import api from '../../config/api';
import { COLORS, SHADOWS, SPACING } from '../../theme/designSystem';
import GlassCard from '../ui/GlassCard';
import Icon from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';

export default function RecordingLibrary({ communityId, onPlay }) {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecordings();
  }, [communityId]);

  const fetchRecordings = async () => {
    try {
      const response = await api.get(`/recording/community/${communityId}`);
      setRecordings(response.data);
    } catch (err) {
      console.error('Error fetching recordings:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderRecordingItem = ({ item }) => (
    <TouchableOpacity 
      activeOpacity={0.8}
      onPress={() => onPlay(item)}
      style={styles.cardContainer}
    >
      <GlassCard intensity={20} style={styles.card}>
        <View style={styles.cardLeft}>
          <View style={styles.playingBadge}>
             <Icon name="play" size={16} color={COLORS.white} />
          </View>
          <View style={styles.info}>
            <Text style={styles.title}>{item.title}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.duration}>{formatDuration(item.duration)}</Text>
              <View style={styles.dot} />
              <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardRight}>
          <View style={styles.speakersList}>
            {item.speakers && item.speakers.slice(0, 3).map((speaker, idx) => (
              <Image 
                key={speaker._id} 
                source={{ uri: speaker.profilePhotos?.[0] || 'https://via.placeholder.com/100' }} 
                style={[styles.speakerAvatar, { marginLeft: idx === 0 ? 0 : -10 }]} 
              />
            ))}
            {item.speakers && item.speakers.length > 3 && (
              <View style={[styles.speakerAvatar, styles.moreBadge, { marginLeft: -10 }]}>
                <Text style={styles.moreText}>+{item.speakers.length - 3}</Text>
              </View>
            )}
          </View>
          <Text style={styles.participants}>{item.participantCount || 0} participants</Text>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  return (
    <FlatList
      data={recordings}
      keyExtractor={(item) => item._id}
      renderItem={renderRecordingItem}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={() => (
        <View style={styles.emptyContainer}>
          <Icon name="mic-off-outline" size={60} color={COLORS.gray} />
          <Text style={styles.emptyText}>No recorded vibes yet.</Text>
          <Text style={styles.emptySubtext}>Past voice discussions will appear here.</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  listContent: { padding: 20 },
  cardContainer: { marginBottom: 15 },
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderRadius: 20 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  playingBadge: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', ...SHADOWS.light },
  info: { marginLeft: 15 },
  title: { fontSize: 16, fontWeight: '800', color: COLORS.secondary, marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  duration: { fontSize: 12, color: COLORS.primary, fontWeight: '700' },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: COLORS.gray, marginHorizontal: 8 },
  date: { fontSize: 12, color: COLORS.gray, fontWeight: '600' },
  cardRight: { alignItems: 'flex-end', marginLeft: 10 },
  speakersList: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  speakerAvatar: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: COLORS.white },
  moreBadge: { backgroundColor: COLORS.lightGray, justifyContent: 'center', alignItems: 'center' },
  moreText: { fontSize: 8, fontWeight: '800', color: COLORS.gray },
  participants: { fontSize: 10, color: COLORS.gray, fontWeight: '700', textTransform: 'uppercase' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 16, fontWeight: '800', color: COLORS.secondary, marginTop: 15 },
  emptySubtext: { fontSize: 13, color: COLORS.gray, marginTop: 5, textAlign: 'center' }
});
