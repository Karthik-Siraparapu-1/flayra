import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Switch, TouchableOpacity, Alert, Image, Platform } from 'react-native';
import { MapViewMock as MapView, MarkerMock as Marker, CircleMock as Circle } from '../../mocks/WebMocks';
import * as Location from 'expo-location';
import api from '../../config/api';
import useAuthStore from '../../store/authStore';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, SHADOWS, TYPOGRAPHY } from '../../theme/designSystem';
import GlassCard from '../../components/ui/GlassCard';
import { LinearGradient } from 'expo-linear-gradient';

function getDistanceFromLatLonInM(lat1, lon1, lat2, lon2) {
  var R = 6371000; 
  var dLat = deg2rad(lat2-lat1);  
  var dLon = deg2rad(lon2-lon1); 
  var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; 
}

function deg2rad(deg) { return deg * (Math.PI/180); }

export default function MapScreen() {
  const { user, updateUser } = useAuthStore();
  const [location, setLocation] = useState(null);
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [isMapVisible, setIsMapVisible] = useState(user?.mapVisibility ?? true);
  const [crossPathIds, setCrossPathIds] = useState(new Set());

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
        if (!u.location || !u.location.coordinates) return;
        const dist = getDistanceFromLatLonInM(
          location.latitude, location.longitude,
          u.location.coordinates[1], u.location.coordinates[0] // lat is [1], lng is [0]
        );
        if (dist <= 100 && !crossPathIds.has(u._id)) {
           newCrossPathUsers.push(u);
           setCrossPathIds(prev => new Set([...prev, u._id]));
        }
      });
      setNearbyUsers(usersData);
      
      newCrossPathUsers.forEach(u => {
         Alert.alert(
           "Cross-Path! 🔔",
           `You crossed paths with ${u.firstName}!`,
           [
             { text: "Ignore", style: "cancel" },
             { text: "Connect", onPress: () => sendConnectionRequest(u) }
           ]
         );
      });
    } catch (err) {
      console.error(err);
    }
  };

  const sendConnectionRequest = async (targetUser) => {
     try {
       await api.post('/swipe', {
         swipedOnId: targetUser._id,
         type: 'right'
       });
       Alert.alert("Sent!", `Connection request sent to ${targetUser.firstName}`);
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
        <Text style={styles.loadingText}>Calibrating GPS...</Text>
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
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        }}
        showsUserLocation={false} 
      >
        {isMapVisible && (
          <>
            <Marker coordinate={{ latitude: location.latitude, longitude: location.longitude }} title="You" zIndex={2}>
              <View style={styles.myMarkerContainer}>
                <View style={styles.myMarkerInner} />
              </View>
            </Marker>
            <Circle
              center={{ latitude: location.latitude, longitude: location.longitude }}
              radius={100}
              strokeWidth={1}
              strokeColor="rgba(220, 38, 38, 0.5)"
              fillColor="rgba(220, 38, 38, 0.15)"
            />
          </>
        )}

        {nearbyUsers.map(u => (
          <Marker 
            key={u._id}
            coordinate={{ latitude: u.location.coordinates[1], longitude: u.location.coordinates[0] }}
            title={`${u.firstName}, ${u.age}`}
            description="Tap connection request ->"
            onCalloutPress={() => sendConnectionRequest(u)}
            zIndex={1}
          >
            <View style={styles.userMarkerContainer}>
               <Image source={{ uri: u.profilePhotos?.[0] || 'https://via.placeholder.com/50' }} style={styles.userMarkerImage} />
            </View>
          </Marker>
        ))}
      </MapView>

      <GlassCard style={styles.privacyPanel} intensity={30}>
         <View style={{ flex: 1 }}>
           <Text style={styles.privacyTitle}>Ghost Mode</Text>
           <Text style={styles.privacyDesc}>{!isMapVisible ? "Hidden from campus radar" : "Visible to nearby students"}</Text>
         </View>
         <Switch
           value={!isMapVisible}
           onValueChange={toggleVisibility}
           trackColor={{ false: 'rgba(0,0,0,0.1)', true: COLORS.primary }}
           thumbColor={COLORS.white}
         />
      </GlassCard>
      
      <View style={styles.headerOverlay}>
         <GlassCard style={styles.headerBadge} intensity={40}>
            <Text style={styles.headerText}>Campus Map</Text>
         </GlassCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white },
  loadingText: { color: COLORS.gray, marginTop: 15, fontSize: 16, fontWeight: '700' },
  map: { flex: 1 },
  headerOverlay: { position: 'absolute', top: 50, left: 20, right: 20, alignItems: 'center', zIndex: 10 },
  headerBadge: { paddingHorizontal: 20, paddingVertical: 10, ...SHADOWS.medium },
  headerText: { color: COLORS.secondary, fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
  myMarkerContainer: { height: 26, width: 26, borderRadius: 13, backgroundColor: 'rgba(220, 38, 38, 0.2)', justifyContent: 'center', alignItems: 'center' },
  myMarkerInner: { height: 14, width: 14, borderRadius: 7, backgroundColor: COLORS.primary, borderWidth: 3, borderColor: COLORS.white },
  userMarkerContainer: { height: 48, width: 48, borderRadius: 24, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.primary, ...SHADOWS.medium },
  userMarkerImage: { height: 40, width: 40, borderRadius: 20 },
  privacyPanel: { position: 'absolute', bottom: Platform.OS === 'ios' ? 100 : 85, left: 20, right: 20, padding: 18, flexDirection: 'row', alignItems: 'center' },
  privacyTitle: { color: COLORS.secondary, fontSize: 17, fontWeight: '800', marginBottom: 2 },
  privacyDesc: { color: COLORS.gray, fontSize: 12, fontWeight: '600' }
});
