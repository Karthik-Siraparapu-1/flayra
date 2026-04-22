import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Simple mock for react-native-maps
export const MapViewMock = ({ children, style }) => (
  <View style={[style, styles.placeholder]}>
    <Text style={styles.text}>[Map Placeholder for Web Testing]</Text>
    {children}
  </View>
);

export const MarkerMock = ({ title, children }) => (
  <View style={styles.marker}>
    <Text style={styles.markerText}>{title || 'Marker'}</Text>
    {children}
  </View>
);

export const CircleMock = () => <View style={styles.circle} />;

// Simple mock for react-native-webrtc
export const RTCViewMock = ({ style }) => (
  <View style={[style, styles.placeholder, { backgroundColor: '#334155' }]}>
    <Text style={styles.text}>[Video Call Placeholder]</Text>
  </View>
);

// Simple mock for expo-av Video
export const VideoMock = ({ style }) => (
  <View style={[style, styles.placeholder, { backgroundColor: '#000' }]}>
    <Text style={styles.text}>[Video Player Placeholder]</Text>
  </View>
);

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderWidth: 2,
    borderColor: '#38bdf8',
    borderStyle: 'dashed',
  },
  text: {
    color: '#38bdf8',
    fontWeight: 'bold',
  },
  marker: {
    padding: 5,
    backgroundColor: 'rgba(56, 189, 248, 0.8)',
    borderRadius: 5,
  },
  markerText: {
    fontSize: 10,
    color: '#fff',
  },
  circle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.5)',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  }
});
