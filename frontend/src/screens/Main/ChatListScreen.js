import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import api from '../../config/api';
import useAuthStore from '../../store/authStore';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, SHADOWS, TYPOGRAPHY, SPACING } from '../../theme/designSystem';
import GlassCard from '../../components/ui/GlassCard';

export default function ChatListScreen({ navigation }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();
  const { user } = useAuthStore();

  useEffect(() => {
    if (isFocused && user?.id || user?._id) {
      fetchMatches();
    }
  }, [isFocused]);

  const fetchMatches = async () => {
    try {
      const response = await api.get('/match');
      setMatches(response.data);
    } catch (error) {
      console.error("Error fetching matches:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    const { otherUser, matchId } = item;
    if (!otherUser) return null;

    return (
      <TouchableOpacity 
        activeOpacity={0.7}
        style={styles.chatRow} 
        onPress={() => navigation.navigate('ChatRoom', { matchId, otherUser })}
      >
        <View style={styles.avatarWrapper}>
          {otherUser.profilePhotos && otherUser.profilePhotos.length > 0 ? (
            <Image source={{ uri: otherUser.profilePhotos[0] }} style={styles.avatarImage} />
          ) : (
            <View style={styles.placeholderAvatar}>
              <Icon name="person" size={28} color={COLORS.gray} />
            </View>
          )}
          <View style={styles.onlineIndicator} />
        </View>
        <View style={styles.chatDetails}>
          <View style={styles.nameRow}>
             <Text style={styles.name} numberOfLines={1}>{otherUser.firstName} {otherUser.lastName}</Text>
             <Text style={styles.timeText}>Now</Text>
          </View>
          <Text style={styles.lastMsg} numberOfLines={1}>
            {item.lastMessage || 'Start a conversation! ✨'}
          </Text>
        </View>
        <Icon name="chevron-forward-outline" size={18} color={COLORS.lightGray} style={{marginLeft: 10}} />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <View style={styles.centerContainer}><ActivityIndicator color="#38bdf8" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>
      
      {matches.length === 0 ? (
        <View style={styles.centerContainer}>
          <Icon name="chatbubbles-outline" size={60} color="#334155" />
          <Text style={styles.emptyText}>No matches yet.</Text>
          <Text style={styles.emptySubText}>Keep swiping to find new connections!</Text>
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.matchId}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 10 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 15, backgroundColor: COLORS.white },
  headerTitle: { fontSize: 32, fontWeight: '900', color: COLORS.secondary },
  chatRow: { flexDirection: 'row', paddingHorizontal: 24, paddingVertical: 18, alignItems: 'center' },
  avatarWrapper: { width: 64, height: 64, borderRadius: 32, marginRight: 15, position: 'relative' },
  avatarImage: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.lightGray },
  placeholderAvatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.lightGray, justifyContent: 'center', alignItems: 'center' },
  onlineIndicator: { position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: COLORS.success, borderWidth: 2, borderColor: COLORS.white },
  chatDetails: { flex: 1, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.03)', paddingBottom: 10 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  name: { fontSize: 17, fontWeight: '700', color: COLORS.secondary },
  timeText: { fontSize: 12, color: COLORS.gray, fontWeight: '500' },
  lastMsg: { fontSize: 14, color: COLORS.gray, fontWeight: '500' },
  emptyText: { fontSize: 24, fontWeight: '800', color: COLORS.secondary, marginTop: 20 },
  emptySubText: { fontSize: 16, color: COLORS.gray, marginTop: 10, textAlign: 'center', paddingHorizontal: 40 }
});
