import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import api from '../../config/api';
import { COLORS, SHADOWS, SPACING, SIZES } from '../../theme/designSystem';
import GlassCard from '../../components/ui/GlassCard';
import useAuthStore from '../../store/authStore';

export default function CommunityListScreen({ navigation }) {
  const { user } = useAuthStore();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      const response = await api.get('/community');
      setCommunities(response.data);
    } catch (err) {
      console.error('Error fetching communities:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCommunities = communities.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const renderCommunityItem = ({ item }) => (
    <TouchableOpacity 
      activeOpacity={0.8}
      onPress={() => navigation.navigate('CommunityDetail', { community: item })}
      style={styles.cardWrapper}
    >
      <GlassCard intensity={25} style={styles.communityCard}>
        <View style={styles.avatarPlaceholder}>
           <LinearGradient
             colors={[COLORS.primary, COLORS.secondary]}
             style={StyleSheet.absoluteFill}
           />
           <Icon name="people" size={24} color={COLORS.white} />
        </View>
        <View style={styles.cardInfo}>
          <View style={styles.cardHeader}>
            <Text style={styles.communityName}>{item.name}</Text>
            {item.type === 'College' && (
              <View style={styles.collegeBadge}>
                 <Text style={styles.collegeText}>Campus</Text>
              </View>
            )}
          </View>
          <Text style={styles.lastMsg} numberOfLines={1}>
            {item.lastMessage || 'No discussion yet. Spark a flame!'}
          </Text>
          <View style={styles.cardFooter}>
            <Icon name="person-outline" size={12} color={COLORS.gray} />
            <Text style={styles.memberCount}>{item.members?.length || 0} members</Text>
          </View>
        </View>
        <Icon name="chevron-forward" size={20} color={COLORS.gray} />
      </GlassCard>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={[COLORS.white, '#f8fafc']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Communities</Text>
        <TouchableOpacity 
          style={styles.createBtn}
          onPress={() => navigation.navigate('CreateCommunity')}
        >
          <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.createBtnInner}>
            <Icon name="add" size={20} color={COLORS.white} />
            <Text style={styles.createBtnText}>Create</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="search-outline" size={20} color={COLORS.gray} />
          <TextInput
            placeholder="Search vibes, colleges, or topics..."
            placeholderTextColor={COLORS.gray}
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={filteredCommunities}
          keyExtractor={(item) => item._id}
          renderItem={renderCommunityItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Icon name="people-outline" size={80} color={COLORS.lightGray} />
              <Text style={styles.emptyText}>No communities found.</Text>
              <Text style={styles.emptySubtext}>Be the first to create one for your college!</Text>
            </View>
          )}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '900', color: COLORS.secondary },
  createBtn: { ...SHADOWS.light },
  createBtnInner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  createBtnText: { color: COLORS.white, fontWeight: '800', marginLeft: 4, fontSize: 13 },
  searchContainer: { paddingHorizontal: 20, marginBottom: 20 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, borderRadius: 15, paddingHorizontal: 15, height: 50 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: COLORS.secondary, fontWeight: '600' },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  cardWrapper: { marginBottom: 15 },
  communityCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 20 },
  avatarPlaceholder: { width: 55, height: 55, borderRadius: 18, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', ...SHADOWS.light },
  cardInfo: { flex: 1, marginLeft: 15 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  communityName: { fontSize: 17, fontWeight: '800', color: COLORS.secondary },
  collegeBadge: { marginLeft: 8, backgroundColor: 'rgba(56,189,248,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  collegeText: { fontSize: 9, color: '#0ea5e9', fontWeight: '900', textTransform: 'uppercase' },
  lastMsg: { fontSize: 13, color: COLORS.gray, fontWeight: '500', marginBottom: 6 },
  cardFooter: { flexDirection: 'row', alignItems: 'center' },
  memberCount: { fontSize: 11, color: COLORS.gray, fontWeight: '700', marginLeft: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 18, fontWeight: '800', color: COLORS.gray, marginTop: 20 },
  emptySubtext: { fontSize: 14, color: COLORS.gray, marginTop: 8, textAlign: 'center' }
});
