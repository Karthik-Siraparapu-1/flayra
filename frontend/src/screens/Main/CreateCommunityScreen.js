import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import api from '../../config/api';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../theme/designSystem';
import GlassCard from '../../components/ui/GlassCard';
import useAuthStore from '../../store/authStore';

export default function CreateCommunityScreen({ navigation }) {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'Interest',
    isPrivate: false,
    voiceCfg: {
      canStart: 'Anyone',
      mode: 'GroupCall',
      isRecordable: true
    }
  });
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please provide a name for your community.');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/community', formData);
      Alert.alert('Success!', 'Your community has been sparked.', [
        { text: 'Enter Aura', onPress: () => navigation.navigate('CommunityDetail', { community: response.data }) }
      ]);
    } catch (err) {
      console.error('Error creating community:', err);
      Alert.alert('Error', 'Failed to create community. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  const types = ['Interest', 'College', 'Personal', 'Public'];

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient colors={[COLORS.white, '#f8fafc']} style={StyleSheet.absoluteFill} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="close-outline" size={30} color={COLORS.secondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Spark New Group</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <GlassCard intensity={20} style={styles.formCard}>
          <Text style={styles.label}>COMMUNITY NAME</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Design Enthusiasts, CS 2026..."
            placeholderTextColor="rgba(0,0,0,0.3)"
            value={formData.name}
            onChangeText={(val) => setFormData({...formData, name: val})}
          />

          <Text style={styles.label}>DESCRIPTION</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="What's this aura about?"
            placeholderTextColor="rgba(0,0,0,0.3)"
            value={formData.description}
            onChangeText={(val) => setFormData({...formData, description: val})}
            multiline
            numberOfLines={4}
          />

          <Text style={styles.label}>VIBE TYPE</Text>
          <View style={styles.typeContainer}>
            {types.map(t => (
              <TouchableOpacity 
                key={t}
                style={[styles.typeBtn, formData.type === t && styles.typeBtnActive]}
                onPress={() => setFormData({...formData, type: t})}
              >
                <Text style={[styles.typeText, formData.type === t && styles.typeTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.divider} />

          <View style={styles.switchRow}>
            <View>
               <Text style={styles.switchLabel}>Private Group</Text>
               <Text style={styles.switchSublabel}>Only members can see the discussion</Text>
            </View>
            <TouchableOpacity 
              onPress={() => setFormData({...formData, isPrivate: !formData.isPrivate})}
              style={[styles.toggle, formData.isPrivate && styles.toggleActive]}
            >
               <View style={[styles.toggleDot, formData.isPrivate && styles.toggleDotActive]} />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>VOICE DISCUSSIONS</Text>

          <Text style={styles.label}>WHO CAN START?</Text>
          <View style={styles.typeContainer}>
            {['Anyone', 'Admin'].map(p => (
              <TouchableOpacity 
                key={p}
                style={[styles.typeBtn, formData.voiceCfg.canStart === p && styles.typeBtnActive]}
                onPress={() => setFormData({...formData, voiceCfg: {...formData.voiceCfg, canStart: p}})}
              >
                <Text style={[styles.typeText, formData.voiceCfg.canStart === p && styles.typeTextActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>DISCUSSION MODE</Text>
          <View style={styles.typeContainer}>
            {[
              { id: 'Stage', label: 'Moderated Stage' },
              { id: 'GroupCall', label: 'Free Group Call' }
            ].map(m => (
              <TouchableOpacity 
                key={m.id}
                style={[styles.typeBtn, formData.voiceCfg.mode === m.id && styles.typeBtnActive]}
                onPress={() => setFormData({...formData, voiceCfg: {...formData.voiceCfg, mode: m.id}})}
              >
                <Text style={[styles.typeText, formData.voiceCfg.mode === m.id && styles.typeTextActive]}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.switchRow}>
            <View>
               <Text style={styles.switchLabel}>Record Stage</Text>
               <Text style={styles.switchSublabel}>Save discussions for &quot;Recorded Vibes&quot; tab</Text>
            </View>
            <TouchableOpacity 
              onPress={() => setFormData({...formData, voiceCfg: {...formData.voiceCfg, isRecordable: !formData.voiceCfg.isRecordable}})}
              style={[styles.toggle, formData.voiceCfg.isRecordable && styles.toggleActive]}
            >
               <View style={[styles.toggleDot, formData.voiceCfg.isRecordable && styles.toggleDotActive]} />
            </TouchableOpacity>
          </View>
        </GlassCard>

        <TouchableOpacity 
          style={styles.submitBtn} 
          onPress={handleCreate}
          disabled={loading}
        >
          <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.submitBtnInner}>
            {loading ? <ActivityIndicator color={COLORS.white} /> : (
              <>
                <Icon name="flash" size={20} color={COLORS.white} />
                <Text style={styles.submitText}>SPARK COMMUNITY</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backBtn: { padding: 5 },
  title: { fontSize: 20, fontWeight: '900', color: COLORS.secondary },
  scrollContent: { padding: 20 },
  formCard: { padding: 20, borderRadius: 24, marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '900', color: COLORS.primary, letterSpacing: 1.5, marginTop: 10, marginBottom: 5 },
  label: { fontSize: 10, fontWeight: '900', color: COLORS.gray, letterSpacing: 1, marginBottom: 10, marginTop: 15, textTransform: 'uppercase' },
  input: { backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 12, padding: 15, fontSize: 16, color: COLORS.secondary, fontWeight: '600' },
  textArea: { height: 100, textAlignVertical: 'top' },
  typeContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 5 },
  typeBtn: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.05)', borderWidth: 1, borderColor: 'transparent' },
  typeBtnActive: { backgroundColor: 'rgba(251, 113, 133, 0.1)', borderColor: COLORS.primary },
  typeText: { fontSize: 13, fontWeight: '700', color: COLORS.gray },
  typeTextActive: { color: COLORS.primary },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginVertical: 25 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchLabel: { fontSize: 16, fontWeight: '800', color: COLORS.secondary },
  switchSublabel: { fontSize: 12, color: COLORS.gray, fontWeight: '500', marginTop: 2 },
  toggle: { width: 50, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.1)', padding: 2 },
  toggleActive: { backgroundColor: COLORS.primary },
  toggleDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.white },
  toggleDotActive: { alignSelf: 'flex-end' },
  submitBtn: { marginTop: 30, ...SHADOWS.medium },
  submitBtnInner: { height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center', flexDirection: 'row' },
  submitText: { color: COLORS.white, fontWeight: '900', fontSize: 16, letterSpacing: 1, marginLeft: 10 }
});
