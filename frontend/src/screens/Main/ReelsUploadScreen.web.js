import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, TextInput , ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { VideoMock as Video } from '../../mocks/WebMocks';
import { CLOUDINARY_VIDEO_UPLOAD_URL, CLOUDINARY_UPLOAD_PRESET } from '../../config/cloudinary';
import useAuthStore from '../../store/authStore';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, SHADOWS, TYPOGRAPHY } from '../../theme/designSystem';
import GlassCard from '../../components/ui/GlassCard';
import VibrantButton from '../../components/ui/VibrantButton';
import PremiumInput from '../../components/ui/PremiumInput';
import { LinearGradient } from 'expo-linear-gradient';

export default function ReelsUploadScreen({ navigation }) {
  const { user } = useAuthStore();
  const [videoUri, setVideoUri] = useState(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);

  const pickVideo = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 1,
      videoMaxDuration: 60,
    });

    if (!result.canceled) {
      setVideoUri(result.assets[0].uri);
    }
  };

  const handleUpload = async () => {
    if (!videoUri) return;

    setUploading(true);
    try {
      const data = new FormData();
      data.append('file', {
        uri: videoUri,
        type: 'video/mp4',
        name: `reel_${user.uid}_${Date.now()}.mp4`
      });
      data.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

      // Upload to Cloudinary
      const res = await fetch(CLOUDINARY_VIDEO_UPLOAD_URL, {
        method: 'POST',
        body: data,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data'
        }
      });
      
      const cloudinaryResponse = await res.json();
      
      if (cloudinaryResponse.secure_url) {
         // TODO: Save to custom Node.js backend instead of Firestore
         console.log('Would save reel to custom backend:', cloudinaryResponse.secure_url);

         Alert.alert('Success', 'Your reel is now live!');
         navigation.goBack();
      } else {
         throw new Error('Cloudinary upload failed');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Upload Failed', 'There was a problem uploading your reel.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
         <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="close-outline" size={32} color={COLORS.secondary} />
         </TouchableOpacity>
         <Text style={styles.headerTitle}>New Reel</Text>
         <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!videoUri ? (
          <TouchableOpacity 
            activeOpacity={0.7}
            style={styles.pickButton} 
            onPress={pickVideo}
          >
            <LinearGradient
              colors={['rgba(220,38,38,0.05)', 'rgba(220,38,38,0.01)']}
              style={styles.pickGradient}
            >
              <View style={styles.iconCircle}>
                <Icon name="videocam" size={40} color={COLORS.primary} />
              </View>
              <Text style={styles.pickText}>Choose a Video</Text>
              <Text style={styles.pickSubtext}>Share your campus moments</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={styles.previewContainer}>
            <Video
              source={{ uri: videoUri }}
              style={styles.videoPreview}
              resizeMode="cover"
              shouldPlay
              isLooping
              isMuted
            />
            <TouchableOpacity style={styles.changeBtn} onPress={pickVideo}>
               <Icon name="refresh" size={18} color={COLORS.white} />
               <Text style={styles.changeBtnText}>Change</Text>
            </TouchableOpacity>
          </View>
        )}

        {videoUri && (
          <GlassCard style={styles.formContainer} intensity={20}>
            <Text style={styles.sectionTitle}>Reel Details</Text>
            <PremiumInput
              label="Caption"
              placeholder="What's this about? #campuslife #fun"
              value={caption}
              onChangeText={setCaption}
              multiline
              style={{height: 120, textAlignVertical: 'top'}}
            />

            <VibrantButton
              title="Share Reel"
              onPress={handleUpload}
              loading={uploading}
              style={styles.uploadBtn}
              icon="paper-plane"
            />
          </GlassCard>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingBottom: 15, paddingHorizontal: 20, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.secondary },
  backBtn: { width: 32 },
  content: { padding: 24, paddingBottom: 60 },
  pickButton: { height: 400, borderRadius: 32, overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(220,38,38,0.1)', borderStyle: 'dashed' },
  pickGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  iconCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(220, 38, 38, 0.08)', justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
  pickText: { color: COLORS.secondary, fontSize: 22, fontWeight: '800', marginBottom: 8 },
  pickSubtext: { color: COLORS.gray, fontSize: 14, fontWeight: '500' },
  previewContainer: { height: 450, width: '100%', borderRadius: 32, overflow: 'hidden', marginBottom: 25, ...SHADOWS.medium },
  videoPreview: { flex: 1 },
  changeBtn: { position: 'absolute', top: 20, right: 20, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, flexDirection: 'row', alignItems: 'center', backdropFilter: 'blur(10px)' },
  changeBtnText: { color: COLORS.white, marginLeft: 6, fontWeight: '700', fontSize: 12 },
  formContainer: { padding: 20, marginTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.secondary, marginBottom: 20 },
  uploadBtn: { marginTop: 10 }
});
