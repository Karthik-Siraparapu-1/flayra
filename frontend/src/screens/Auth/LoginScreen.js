import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform, 
  Alert, 
  ImageBackground, 
  Dimensions, 
  TouchableOpacity, 
  Animated 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import useAuthStore from '../../store/authStore';
import { COLORS, SPACING, SIZES, TYPOGRAPHY, SHADOWS } from '../../theme/designSystem';
import GlassCard from '../../components/ui/GlassCard';
import VibrantButton from '../../components/ui/VibrantButton';
import PremiumInput from '../../components/ui/PremiumInput';
import Icon from 'react-native-vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [otpSent, setOtpSent] = useState(false);
  
  const [nickname, setNickname] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const { requestOTP, resendOTP, verifyOTP, isLoading, error } = useAuthStore();
  const [localError, setLocalError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleRequestOTP = async () => {
    setLocalError('');
    if (!email) {
      setLocalError('Please enter your university email.');
      return;
    }
    
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain || (!domain.endsWith('.edu') && !domain.endsWith('.ac.in') && !domain.includes('university'))) {
      setLocalError('Only educational emails (.edu, .ac.in) are allowed.');
      return;
    }

    if (!isLogin && (!firstName || !lastName || !nickname)) {
      setLocalError('Please fill in your name and nickname.');
      return;
    }

    const { success, message } = await requestOTP(email, isLogin);
    if (success) {
      setOtpSent(true);
      setResendTimer(30);
      Alert.alert('Success', 'OTP has been sent to your email.');
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    const { success } = await resendOTP(email, isLogin);
    if (success) {
      setResendTimer(30);
      Alert.alert('Success', 'A new OTP has been sent.');
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp) {
        setLocalError('Please enter the 6-digit OTP.');
        return;
    }
    
    const signupData = !isLogin ? {
        nickname, firstName, lastName, age: 18, gender: 'Other'
    } : null;

    const success = await verifyOTP(email, otp, isLogin, signupData);
    if (success) {
       // Authenticated
    }
  };

  return (
    <ImageBackground 
      source={require('../../../assets/premium_bg.png')} 
      style={styles.background}
      resizeMode="cover"
    >
      <LinearGradient
        colors={['rgba(255,255,255,0.1)', 'rgba(0,0,0,0.8)']}
        style={styles.gradient}
      >
        <KeyboardAvoidingView 
          style={styles.container} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Icon name="flame" size={40} color={COLORS.white} />
              </View>
              <Text style={styles.title}>Flayra</Text>
              <Text style={styles.subtitle}>Enter the Campus Aura</Text>
            </View>

            <GlassCard style={styles.card} intensity={40} tint="dark">
              <Text style={styles.formTitle}>
                {otpSent ? 'Verification' : (isLogin ? 'Welcome Back' : 'Join Flayra')}
              </Text>
              
              {!otpSent ? (
                <>
                  <PremiumInput
                    label="University Email"
                    icon="mail-outline"
                    placeholder="student@university.edu"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />

                  {!isLogin && (
                    <View style={styles.row}>
                      <View style={{ flex: 1, marginRight: 10 }}>
                        <PremiumInput
                          label="First Name"
                          placeholder="John"
                          value={firstName}
                          onChangeText={setFirstName}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <PremiumInput
                          label="Last Name"
                          placeholder="Doe"
                          value={lastName}
                          onChangeText={setLastName}
                        />
                      </View>
                    </View>
                  )}
                  
                  {!isLogin && (
                    <PremiumInput
                      label="Username"
                      icon="at-outline"
                      placeholder="johndoe123"
                      value={nickname}
                      onChangeText={setNickname}
                    />
                  )}
                </>
              ) : (
                <View style={styles.otpSection}>
                  <Text style={styles.otpInstruction}>Enter the 6-digit code sent to {email}</Text>
                  <PremiumInput
                    icon="lock-closed-outline"
                    placeholder="0 0 0 0 0 0"
                    keyboardType="numeric"
                    maxLength={6}
                    value={otp}
                    onChangeText={setOtp}
                    style={styles.otpInput}
                  />
                </View>
              )}

              {(error || localError) ? (
                <Text style={styles.errorText}>{error || localError}</Text>
              ) : null}

              <VibrantButton 
                title={otpSent ? 'Verify & Continue' : (isLogin ? 'Sign In' : 'Create Account')}
                onPress={otpSent ? handleVerifyOTP : handleRequestOTP}
                loading={isLoading}
                style={styles.mainButton}
              />
              
              {!otpSent ? (
                <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.toggleButton}>
                    <Text style={styles.toggleText}>
                      {isLogin ? "Don't have an account? " : "Already verified? "}
                      <Text style={styles.toggleTextBold}>
                        {isLogin ? "Sign Up" : "Sign In"}
                      </Text>
                    </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.resendContainer}>
                  <TouchableOpacity onPress={() => setOtpSent(false)} style={styles.smallToggle}>
                    <Text style={styles.smallToggleText}>Change Email</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    onPress={handleResendOTP} 
                    disabled={resendTimer > 0 || isLoading}
                    style={[styles.smallToggle, resendTimer > 0 && { opacity: 0.5 }]}
                  >
                    <Text style={styles.smallToggleText}>
                      {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Code"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </GlassCard>
            
            <View style={styles.footer}>
              <Text style={styles.footerText}>Secure • Encrypted • Campus Only</Text>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: width, height: height },
  gradient: { flex: 1 },
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', padding: 20 },
  header: { alignItems: 'center', marginBottom: 30 },
  logoContainer: { width: 80, height: 80, borderRadius: 28, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 15, ...SHADOWS.heavy },
  title: { fontSize: 48, fontWeight: '900', color: COLORS.white, letterSpacing: 2, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 10 },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.85)', fontWeight: '700', marginTop: 5, letterSpacing: 0.5 },
  card: { width: '100%', padding: 25 },
  formTitle: { fontSize: 26, fontWeight: '800', color: COLORS.white, marginBottom: 25, textAlign: 'center' },
  row: { flexDirection: 'row' },
  errorText: { color: COLORS.primaryLight, fontSize: 14, marginBottom: 15, textAlign: 'center', fontWeight: '600' },
  mainButton: { marginTop: 10 },
  toggleButton: { marginTop: 25, alignItems: 'center' },
  toggleText: { color: 'rgba(255,255,255,0.7)', fontSize: 15 },
  toggleTextBold: { color: COLORS.white, fontWeight: '800' },
  otpSection: { alignItems: 'center' },
  otpInstruction: { color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: 20, fontSize: 14 },
  resendContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 25 },
  smallToggle: { padding: 5 },
  smallToggleText: { color: COLORS.white, fontSize: 14, fontWeight: '700' },
  footer: { position: 'absolute', bottom: 40, width: width, alignItems: 'center' },
  footerText: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' }
});
