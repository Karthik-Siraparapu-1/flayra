import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import useAuthStore from '../../store/authStore';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, SHADOWS, TYPOGRAPHY, SPACING } from '../../theme/designSystem';
import GlassCard from '../../components/ui/GlassCard';
import VibrantButton from '../../components/ui/VibrantButton';
import PremiumInput from '../../components/ui/PremiumInput';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileSetupScreen({ navigation }) {
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    nickname: '',
    age: '',
    gender: 'Male',
    branch: '',
    year: '',
    interests: '', // comma separated (e.g., Coding, Music)
    hometown: '',
    bio: ''
  });

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  const uploadProfilePhoto = async (uri, uid) => {
    try {
      // TODO: Upload to custom Node.js backend
      console.log('Would upload photo to custom backend:', uri);
      return uri; // Return local uri for now just to show it
    } catch (e) {
      console.error("Image upload error:", e);
      return null;
    }
  };

  const handleSetup = async () => {
    if (!formData.firstName || !formData.lastName || !formData.age) {
      Alert.alert('Error', 'First Name, Last Name, and Age are mandatory fields.');
      return;
    }

    try {
      setLoading(true);
      
      let photoUrl = '';
      if (photo) {
         photoUrl = await uploadProfilePhoto(photo, user.uid);
      }

      const domain = user?.email?.split('@')[1] || '';
      const interestsArray = formData.interests.split(',').map(i => i.trim()).filter(i => i);
      
      const userProfile = {
        id: user.uid || user.id || 'temp-id',
        email: user.email,
        universityDomain: domain,
        firstName: formData.firstName,
        lastName: formData.lastName,
        nickname: formData.nickname,
        age: parseInt(formData.age, 10),
        gender: formData.gender,
        university: domain,
        branch: formData.branch,
        year: formData.year,
        interests: interestsArray,
        hobbies: interestsArray, // keeping same as interests for simplicity
        hometown: formData.hometown,
        bio: formData.bio,
        profilePhotos: photoUrl ? [photoUrl] : [],
        socialLinks: {},
        stats: {
          followers: 0,
          reelLikes: 0,
          profileViews: 0,
          matches: 0
        },
        mapVisibility: true,
        profileCompleted: true,
        createdAt: new Date().toISOString()
      };

      // TODO: Save to custom Node js backend
      console.log('Would save profile to custom backend', userProfile);
      
      // Update global Zustand state, triggers App.js to load MainTabNavigator
      updateUser({ ...userProfile });
    } catch (error) {
      console.error(error);
      Alert.alert('Setup Failed', 'Could not save profile details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Profile</Text>
          <Text style={styles.subtitle}>Let the campus know who you are</Text>
        </View>

        <TouchableOpacity 
          activeOpacity={0.8}
          style={styles.imagePickerWrapper} 
          onPress={pickImage}
        >
          <View style={styles.imagePicker}>
            {photo ? (
              <Image source={{ uri: photo }} style={styles.profileImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Icon name="camera-outline" size={32} color={COLORS.primary} />
                <Text style={styles.imagePlaceholderText}>Add Photo</Text>
              </View>
            )}
          </View>
          <View style={styles.editBadge}>
            <Icon name="pencil" size={14} color={COLORS.white} />
          </View>
        </TouchableOpacity>

        <GlassCard style={styles.formSection} intensity={20}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <View style={styles.row}>
            <View style={{flex: 1, marginRight: 10}}>
              <PremiumInput
                label="First Name"
                placeholder="John"
                value={formData.firstName}
                onChangeText={(txt) => setFormData({...formData, firstName: txt})}
              />
            </View>
            <View style={{flex: 1}}>
              <PremiumInput
                label="Last Name"
                placeholder="Doe"
                value={formData.lastName}
                onChangeText={(txt) => setFormData({...formData, lastName: txt})}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={{flex: 1, marginRight: 10}}>
              <PremiumInput
                label="Nickname"
                placeholder="Johnny"
                value={formData.nickname}
                onChangeText={(txt) => setFormData({...formData, nickname: txt})}
              />
            </View>
            <View style={{width: 80}}>
              <PremiumInput
                label="Age"
                keyboardType="numeric"
                placeholder="21"
                value={formData.age}
                onChangeText={(txt) => setFormData({...formData, age: txt})}
              />
            </View>
          </View>
        </GlassCard>

        <GlassCard style={styles.formSection} intensity={20}>
          <Text style={styles.sectionTitle}>Academic Details</Text>
          <PremiumInput
            label="Branch / Major"
            icon="book-outline"
            placeholder="Computer Science"
            value={formData.branch}
            onChangeText={(txt) => setFormData({...formData, branch: txt})}
          />
          <PremiumInput
            label="Academic Year"
            icon="calendar-outline"
            placeholder="3rd Year"
            value={formData.year}
            onChangeText={(txt) => setFormData({...formData, year: txt})}
          />
        </GlassCard>

        <GlassCard style={styles.formSection} intensity={20}>
          <Text style={styles.sectionTitle}>About You</Text>
          <PremiumInput
            label="Interests"
            icon="heart-outline"
            placeholder="Coding, Music, Travel"
            value={formData.interests}
            onChangeText={(txt) => setFormData({...formData, interests: txt})}
          />
          <PremiumInput
            label="Hometown"
            icon="location-outline"
            placeholder="New York"
            value={formData.hometown}
            onChangeText={(txt) => setFormData({...formData, hometown: txt})}
          />
          <PremiumInput
            label="Bio"
            placeholder="Tell us a bit about yourself..."
            multiline
            style={{height: 100}}
            value={formData.bio}
            onChangeText={(txt) => setFormData({...formData, bio: txt})}
          />
        </GlassCard>

        <VibrantButton
          title="Finish Setup"
          onPress={handleSetup}
          loading={loading}
          style={styles.mainButton}
        />
        <View style={{height: 40}} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { padding: 24, paddingTop: 60 },
  header: { marginBottom: 35 },
  title: { fontSize: 36, fontWeight: '900', color: COLORS.secondary, marginBottom: 8 },
  subtitle: { fontSize: 16, color: COLORS.gray, fontWeight: '500' },
  imagePickerWrapper: { alignSelf: 'center', marginBottom: 40, position: 'relative' },
  imagePicker: { width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(220,38,38,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.white, ...SHADOWS.medium },
  profileImage: { width: 130, height: 130, borderRadius: 65 },
  imagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
  imagePlaceholderText: { color: COLORS.primary, fontWeight: '800', marginTop: 8, fontSize: 14 },
  editBadge: { position: 'absolute', bottom: 5, right: 5, backgroundColor: COLORS.secondary, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: COLORS.white },
  formSection: { marginBottom: 25, padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.secondary, marginBottom: 20 },
  row: { flexDirection: 'row' },
  mainButton: { marginTop: 10 }
});
