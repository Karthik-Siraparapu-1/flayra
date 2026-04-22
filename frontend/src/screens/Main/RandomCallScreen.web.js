import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { RTCViewMock as RTCView } from '../../mocks/WebMocks';
import io from 'socket.io-client';
import useAuthStore from '../../store/authStore';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, SHADOWS, TYPOGRAPHY } from '../../theme/designSystem';
import GlassCard from '../../components/ui/GlassCard';
import { LinearGradient } from 'expo-linear-gradient';
import VibrantButton from '../../components/ui/VibrantButton';
const RTCPeerConnection = class { onicecandidate=null; ontrack=null; addTrack(){}; createOffer(){return {sdp:''}}; createAnswer(){return {sdp:''}}; setLocalDescription(){}; setRemoteDescription(){}; addIceCandidate(){}; close(){}; };
const RTCIceCandidate = class {};
const RTCSessionDescription = class {};
const mediaDevices = { enumerateDevices: async ()=>[], getUserMedia: async ()=>({toURL:()=>'', getTracks:()=>[], getVideoTracks:()=>[{_switchCamera:()=>{}}]}) };

const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5001' : 'http://localhost:5001';

const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

export default function RandomCallScreen({ navigation }) {
  const { user } = useAuthStore();
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callStatus, setCallStatus] = useState('Idle'); // Idle, Searching, Connected
  const [isFrontCamera, setIsFrontCamera] = useState(true);

  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(BASE_URL);

    socketRef.current.on('webrtc_paired', async ({ peerId, initiator }) => {
      setCallStatus('Connecting...');
      initiateWebRTCConfig(initiator);
    });

    socketRef.current.on('webrtc_offer', async (data) => {
      if (!peerConnectionRef.current) return;
      try {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        socketRef.current.emit('webrtc_answer', { sdp: answer });
      } catch (err) {
        console.error('Error handling offer', err);
      }
    });

    socketRef.current.on('webrtc_answer', async (data) => {
      if (!peerConnectionRef.current) return;
      try {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
      } catch (err) {
        console.error('Error handling answer', err);
      }
    });

    socketRef.current.on('webrtc_ice_candidate', async (data) => {
      if (!peerConnectionRef.current) return;
      try {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (err) {
        console.error('Error adding ICE candidate', err);
      }
    });

    socketRef.current.on('webrtc_peer_left', () => {
      setCallStatus('Peer left the call.');
      cleanupCall();
    });

    return () => {
      cleanupCall();
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  const initiateWebRTCConfig = async (isInitiator) => {
    peerConnectionRef.current = new RTCPeerConnection(configuration);

    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit('webrtc_ice_candidate', { candidate: event.candidate });
      }
    };

    peerConnectionRef.current.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
        setCallStatus('Connected');
      }
    };

    if (localStream) {
      localStream.getTracks().forEach(track => {
        peerConnectionRef.current.addTrack(track, localStream);
      });
    }

    if (isInitiator) {
      try {
        const offer = await peerConnectionRef.current.createOffer();
        await peerConnectionRef.current.setLocalDescription(offer);
        socketRef.current.emit('webrtc_offer', { sdp: offer });
      } catch (err) {
        console.error('Error creating offer', err);
      }
    }
  };

  const startLocalStream = async () => {
    try {
      const sourceInfos = await mediaDevices.enumerateDevices();
      let videoSourceId;
      for (let i = 0; i < sourceInfos.length; i++) {
        const sourceInfo = sourceInfos[i];
        if (sourceInfo.kind === 'videoinput' && sourceInfo.facing === (isFrontCamera ? 'front' : 'environment')) {
          videoSourceId = sourceInfo.deviceId;
        }
      }

      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: {
          width: 640,
          height: 480,
          frameRate: 30,
          facingMode: (isFrontCamera ? 'user' : 'environment'),
          deviceId: videoSourceId
        }
      });

      setLocalStream(stream);
    } catch (err) {
      console.error('Error accessing media devices.', err);
    }
  };

  const startSearch = async () => {
    setCallStatus('Searching');
    setRemoteStream(null);
    if (!localStream) {
      await startLocalStream();
    }
    const userId = user?.id || user?._id;
    socketRef.current.emit('join_random_queue', userId);
  };

  const endCall = () => {
    socketRef.current.emit('leave_random_call');
    cleanupCall();
    setCallStatus('Idle');
  };

  const cleanupCall = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setRemoteStream(null);
  };

  const toggleCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      videoTrack._switchCamera();
      setIsFrontCamera(!isFrontCamera);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.videoContainer}>
        {remoteStream ? (
          <RTCView sourceURL={remoteStream.toURL()} style={styles.remoteVideo} objectFit="cover" />
        ) : (
          <LinearGradient
            colors={[COLORS.secondary, '#0f172a']}
            style={styles.placeholderVideo}
          >
            <View style={styles.searchingPulse}>
               <Icon name="videocam" size={80} color="rgba(255,255,255,0.1)" />
            </View>
            <Text style={styles.statusText}>
              {callStatus === 'Searching' ? 'Finding your next connection...' : 'Start a random encounter'}
            </Text>
          </LinearGradient>
        )}

        <View style={styles.overlayHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="close-outline" size={32} color={COLORS.white} />
          </TouchableOpacity>
          <GlassCard style={styles.headerBadge} intensity={40}>
             <Text style={styles.headerTitle}>Random Call</Text>
          </GlassCard>
        </View>

        {localStream && (
          <View style={styles.localVideoWrapper}>
            <RTCView sourceURL={localStream.toURL()} style={styles.localVideo} objectFit="cover" zOrder={1} />
            <View style={styles.localOverlay}>
               <Text style={styles.localText}>You</Text>
            </View>
          </View>
        )}

        <View style={styles.floatingControls}>
          {callStatus === 'Idle' || callStatus === 'Peer left the call.' ? (
            <VibrantButton 
              title="Start Matching" 
              onPress={startSearch} 
              style={styles.startButton}
              icon="flash"
            />
          ) : (
            <View style={styles.callControls}>
              <TouchableOpacity style={styles.glassBtn} onPress={toggleCamera}>
                 <Icon name="camera-reverse-outline" size={26} color={COLORS.white} />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.endCallBtn} onPress={endCall}>
                 <Icon name="call" size={30} color={COLORS.white} />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.glassBtn} onPress={startSearch}>
                 <Icon name="play-skip-forward" size={26} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.secondary },
  videoContainer: { flex: 1, position: 'relative' },
  remoteVideo: { flex: 1, backgroundColor: '#000' },
  placeholderVideo: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statusText: { color: COLORS.white, fontSize: 18, fontWeight: '700', marginTop: 30, textAlign: 'center', paddingHorizontal: 40, letterSpacing: 0.5 },
  overlayHeader: { position: 'absolute', top: 60, left: 20, right: 20, flexDirection: 'row', alignItems: 'center', zIndex: 10 },
  backBtn: { padding: 5 },
  headerBadge: { paddingHorizontal: 15, paddingVertical: 8, marginLeft: 15 },
  headerTitle: { color: COLORS.white, fontWeight: '800', fontSize: 16 },
  localVideoWrapper: { position: 'absolute', bottom: 120, right: 20, width: 110, height: 160, borderRadius: 20, overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', ...SHADOWS.heavy },
  localVideo: { flex: 1, backgroundColor: '#000' },
  localOverlay: { position: 'absolute', bottom: 10, left: 10, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  localText: { color: COLORS.white, fontSize: 10, fontWeight: '700' },
  floatingControls: { position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center', zIndex: 20 },
  startButton: { width: 220 },
  callControls: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  glassBtn: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  endCallBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.error, justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '135deg' }], ...SHADOWS.heavy }
});
