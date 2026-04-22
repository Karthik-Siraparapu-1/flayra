import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  Switch, 
  TouchableOpacity, 
  Alert, 
  Image, 
  Platform, 
  Animated, 
  Modal, 
  Dimensions 
} from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../config/api';
import useAuthStore from '../../store/authStore';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, SHADOWS, TYPOGRAPHY, SPACING } from '../../theme/designSystem';
import GlassCard from '../../components/ui/GlassCard';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

function getDistanceFromLatLonInM(lat1, lon1, lat2, lon2) {
  let R = 6371000; 
  let dLat = deg2rad(lat2-lat1);  
  let dLon = deg2rad(lon2-lon1); 
  let a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
  let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; 
}

function deg2rad(deg) { return deg * (Math.PI/180); }

const getBranchIcon = (branch = '') => {
  const b = branch.toLowerCase();
  if (b.includes('computer') || b.includes('it') || b.includes('engineer')) return 'laptop-outline';
  if (b.includes('art') || b.includes('design')) return 'color-palette-outline';
  if (b.includes('business') || b.includes('mba') || b.includes('commerce')) return 'briefcase-outline';
  if (b.includes('science') || b.includes('physics') || b.includes('chem')) return 'flask-outline';
  if (b.includes('medical') || b.includes('mbbs') || b.includes('pharm')) return 'medkit-outline';
  return 'person-outline';
};

const getBranchColor = (branch = '') => {
  const b = branch.toLowerCase();
  if (b.includes('computer') || b.includes('it') || b.includes('engineer')) return '#3b82f6'; // Blue
  if (b.includes('art') || b.includes('design')) return '#ec4899'; // Pink
  if (b.includes('business') || b.includes('mba') || b.includes('commerce')) return '#10b981'; // Green
  if (b.includes('science') || b.includes('physics') || b.includes('chem')) return '#8b5cf6'; // Purple
  if (b.includes('medical') || b.includes('mbbs') || b.includes('pharm')) return '#ef4444'; // Red
  return COLORS.primary;
};

export default function MapScreen({ navigation }) {
  const { user, updateUser } = useAuthStore();
  const [location, setLocation] = useState(null);
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [isMapVisible, setIsMapVisible] = useState(user?.mapVisibility ?? true);
  const [crossPathIds, setCrossPathIds] = useState(new Set());
  
  // Custom Modal State
  const [activeCrossPath, setActiveCrossPath] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Pulsing Animation
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.5,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location is required for the Map feature.');
        return;
      }
      
      let currentLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation(currentLocation.coords);
      
      if (user?.id || user?._id) {
        try {
          await api.put('/user/update', {
            location: { type: 'Point', coordinates: [currentLocation.coords.longitude, currentLocation.coords.latitude] },
            mapVisibility: isMapVisible
          });
        } catch (e) {
          console.error("Location update failed", e);
        }
      }
    })();
  }, []);

  useEffect(() => {
    if (!location || !(user?.id || user?._id)) return;

    let intervalId;
    if (isMapVisible) {
      fetchNearby();
      intervalId = setInterval(fetchNearby, 15000); 
    }

    return () => clearInterval(intervalId);
  }, [location, isMapVisible]);

  const fetchNearby = async () => {
    try {
      const response = await api.get(`/user/nearby?lng=${location.longitude}&lat=${location.latitude}&radius=1000`);
      const usersData = response.data;
      
      let newCrossPathUsers = [];
      usersData.forEach(u => {
        if (!u.location || !u.location.coordinates || u._id === (user?.id || user?._id)) return;
        const dist = getDistanceFromLatLonInM(
          location.latitude, location.longitude,
          u.location.coordinates[1], u.location.coordinates[0]
        );
        if (dist <= 100 && !crossPathIds.has(u._id)) {
           newCrossPathUsers.push(u);
           setCrossPathIds(prev => new Set([...prev, u._id]));
        }
      });
      setNearbyUsers(usersData);
      
      if (newCrossPathUsers.length > 0) {
        setActiveCrossPath(newCrossPathUsers[0]);
        setShowModal(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const sendConnectionRequest = async () => {
     if (!activeCrossPath) return;
     try {
       await api.post('/swipe', {
         swipedOnId: activeCrossPath._id,
         type: 'right'
       });
       setShowModal(false);
       Alert.alert("Sent!", `Connection request sent to ${activeCrossPath.firstName}`);
     } catch (e) {
       console.error("Failed to send request", e);
     }
  };

  const toggleVisibility = async () => {
    const newValue = !isMapVisible;
    setIsMapVisible(newValue);
    updateUser({ mapVisibility: newValue });
    if (user?.id || user?._id) {
      try {
        await api.put('/user/update', { mapVisibility: newValue });
      } catch (e) {}
    }
  };

  if (!location) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Calibrating Campus GPS...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView 
        style={styles.map}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.012,
          longitudeDelta: 0.012,
        }}
        showsUserLocation={false} 
        customMapStyle={mapStyle}
      >
        {isMapVisible && (
          <Marker coordinate={{ latitude: location.latitude, longitude: location.longitude }} zIndex={10}>
            <View style={styles.myMarkerContainer}>
              <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }], opacity: pulseAnim.interpolate({ inputRange:[1, 1.5], outputRange:[0.6, 0] }) }]} />
              <View style={styles.myMarkerInner} />
            </View>
          </Marker>
        )}

        {/* Campus Pulse - Density Heuristic */}
        {isMapVisible && nearbyUsers.length > 5 && (
           <Circle
             center={{ latitude: location.latitude, longitude: location.longitude }}
             radius={200}
             fillColor="rgba(220, 38, 38, 0.05)"
             strokeColor="rgba(220, 38, 38, 0.2)"
             strokeWidth={1}
           />
        )}

        {nearbyUsers.map(u => (
          <Marker 
            key={u._id}
            coordinate={{ latitude: u.location.coordinates[1], longitude: u.location.coordinates[0] }}
            zIndex={5}
          >
            <View style={[styles.userMarkerContainer, { borderColor: getBranchColor(u.branch) }]}>
               <View style={[styles.branchBadge, { backgroundColor: getBranchColor(u.branch) }]}>
                  <Icon name={getBranchIcon(u.branch)} size={10} color={COLORS.white} />
               </View>
               <Image source={{ uri: u.profilePhotos?.[0] || 'https://via.placeholder.com/100' }} style={styles.userMarkerImage} />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Cross Path Modal */}
      <Modal transparent visible={showModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.modalContent} intensity={60}>
             <View style={styles.modalHeader}>
                <View style={styles.pulseDot} />
                <Text style={styles.modalTitle}>Crossed Paths!</Text>
             </View>
             
             <View style={styles.modalUserRow}>
                <Image source={{ uri: activeCrossPath?.profilePhotos?.[0] || 'https://via.placeholder.com/100' }} style={styles.modalAvatar} />
                <View style={styles.modalInfo}>
                   <Text style={styles.modalName}>{activeCrossPath?.firstName}, {activeCrossPath?.age}</Text>
                   <Text style={styles.modalUni}>{activeCrossPath?.university}</Text>
                </View>
             </View>
             
             <Text style={styles.modalDesc}>You just crossed paths with {activeCrossPath?.firstName} within 100 meters. Shall we connect?</Text>
             
             <View style={styles.modalActions}>
                <TouchableOpacity style={styles.ignoreBtn} onPress={() => setShowModal(false)}>
                   <Text style={styles.ignoreText}>Maybe Later</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.connectBtn} onPress={sendConnectionRequest}>
                   <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.connectBtnInner}>
                      <Icon name="heart" size={18} color={COLORS.white} />
                      <Text style={styles.connectText}>Connect</Text>
                   </LinearGradient>
                </TouchableOpacity>
             </View>
          </GlassCard>
        </View>
      </Modal>

      <GlassCard style={styles.privacyPanel} intensity={50} tint="light">
         <View style={{ flex: 1 }}>
           <Text style={styles.privacyTitle}>Ghost Mode</Text>
           <Text style={styles.privacyDesc}>{!isMapVisible ? "You are hidden from the map" : "You are visible to others nearby"}</Text>
         </View>
         <Switch
           value={!isMapVisible}
           onValueChange={toggleVisibility}
           trackColor={{ false: '#e5e7eb', true: COLORS.primary }}
           thumbColor="#fff"
         />
      </GlassCard>
      
      <GlassCard style={styles.headerOverlay} intensity={60} tint="light">
         <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackBtn}>
            <Icon name="arrow-back" size={24} color={COLORS.secondary} />
         </TouchableOpacity>
         
         <View style={styles.headerTitleRow}>
            <Icon name="navigate-circle" size={20} color={COLORS.primary} style={{marginRight: 6}} />
            <Text style={styles.headerText}>Campus Map</Text>
         </View>

         <TouchableOpacity 
           activeOpacity={0.8}
           onPress={() => navigation.navigate('Profile')}
           style={styles.headerAvatarBtn}
         >
           {user?.profilePhotos?.[0] ? (
             <Image source={{ uri: user.profilePhotos[0] }} style={styles.headerAvatar} />
           ) : (
             <View style={[styles.headerAvatar, { backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={styles.avatarInitial}>{user?.firstName?.charAt(0)}</Text>
             </View>
           )}
         </TouchableOpacity>
      </GlassCard>
    </View>
  );
}

const mapStyle = [
  { "featureType": "poi", "stylers": [{ "visibility": "off" }] },
  { "featureType": "transit", "stylers": [{ "visibility": "off" }] }
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white },
  loadingText: { color: COLORS.gray, marginTop: 15, fontSize: 15, fontWeight: '700' },
  map: { flex: 1 },
  headerOverlay: { position: 'absolute', top: 60, left: 20, right: 20, padding: 10, height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerBackBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center' },
  headerText: { color: COLORS.secondary, fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  headerAvatarBtn: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden', ...SHADOWS.light, borderWidth: 2, borderColor: COLORS.white },
  headerAvatar: { width: '100%', height: '100%' },
  avatarInitial: { color: COLORS.white, fontWeight: '900', fontSize: 16 },
  myMarkerContainer: { height: 30, width: 30, justifyContent: 'center', alignItems: 'center' },
  pulseCircle: { position: 'absolute', height: 40, width: 40, borderRadius: 20, backgroundColor: COLORS.primary },
  myMarkerInner: { height: 18, width: 18, borderRadius: 9, backgroundColor: COLORS.primary, borderWidth: 3, borderColor: COLORS.white, ...SHADOWS.medium },
  userMarkerContainer: { height: 55, width: 55, borderRadius: 27.5, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', ...SHADOWS.heavy, borderWidth: 2, borderColor: COLORS.primary },
  userMarkerImage: { height: 48, width: 48, borderRadius: 24 },
  branchBadge: { position: 'absolute', top: -5, right: -5, backgroundColor: COLORS.secondary, width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', zIndex: 10, borderWidth: 2, borderColor: COLORS.white },
  privacyPanel: { position: 'absolute', bottom: Platform.OS === 'ios' ? 100 : 90, left: 20, right: 20, flexDirection: 'row', alignItems: 'center', padding: 18 },
  privacyTitle: { color: COLORS.secondary, fontSize: 16, fontWeight: '800', marginBottom: 2 },
  privacyDesc: { color: COLORS.gray, fontSize: 12, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', padding: 25, borderRadius: 30 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  pulseDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary, marginRight: 10 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: COLORS.secondary },
  modalUserRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  modalAvatar: { width: 70, height: 70, borderRadius: 35, borderWidth: 3, borderColor: COLORS.primary },
  modalInfo: { marginLeft: 15 },
  modalName: { fontSize: 20, fontWeight: '800', color: COLORS.secondary },
  modalUni: { fontSize: 13, color: COLORS.primary, fontWeight: '700', textTransform: 'uppercase' },
  modalDesc: { fontSize: 15, color: COLORS.gray, lineHeight: 22, marginBottom: 25, fontWeight: '500' },
  modalActions: { flexDirection: 'row', gap: 12 },
  ignoreBtn: { flex: 1, height: 50, justifyContent: 'center', alignItems: 'center', borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.05)' },
  ignoreText: { color: COLORS.gray, fontWeight: '700' },
  connectBtn: { flex: 1.5, height: 50, borderRadius: 15, overflow: 'hidden' },
  connectBtnInner: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  connectText: { color: COLORS.white, fontWeight: '800', fontSize: 16 }
});

