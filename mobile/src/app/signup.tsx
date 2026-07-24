import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Modal,
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff, Lock, Mail, User, Headphones } from 'lucide-react-native';
import { signUp, isFirebaseConfigured } from '@/lib/firebase';
import { useAuthStore } from '@/lib/state/authStore';
import { Copyright } from '@/components/Copyright';

export default function SignupScreen() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [errorVisible, setErrorVisible] = useState(false);

  const configured = isFirebaseConfigured();

  function showError(msg: string) {
    setErrorMsg(msg);
    setErrorVisible(true);
  }

  async function handleSignUp() {
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      showError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      showError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      showError('Passwords do not match.');
      return;
    }

    if (!configured) {
      showError('Firebase is not configured. Please add your Firebase environment variables.');
      return;
    }

    setLoading(true);
    try {
      const profile = await signUp(email.trim().toLowerCase(), password, name.trim());
      setUser(profile);
      router.replace('/(tabs)');
    } catch (e: any) {
      const code = e?.code ?? '';
      if (code === 'auth/email-already-in-use') {
        showError('An account with this email already exists.');
      } else if (code === 'auth/weak-password') {
        showError('Password must be at least 6 characters.');
      } else if (code === 'auth/invalid-email') {
        showError('Please enter a valid email address.');
      } else {
        showError(e?.message ?? 'Sign up failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView testID="signup-screen" style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoSection}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.appName}><Text style={styles.appNameAccent}>KEL</Text> Smart</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Create Account</Text>
          <Text style={styles.cardSubtitle}>Sign up to start monitoring your tanks</Text>

          {/* Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={styles.inputWrap}>
              <User size={16} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                testID="signup-name-input"
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Jane Doe"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.inputWrap}>
              <Mail size={16} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                testID="signup-email-input"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@company.com"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputWrap}>
              <Lock size={16} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                testID="signup-password-input"
                style={[styles.input, styles.inputPassword]}
                value={password}
                onChangeText={setPassword}
                placeholder="At least 6 characters"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
                autoComplete="password-new"
                returnKeyType="next"
              />
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                style={styles.eyeBtn}
                hitSlop={8}
              >
                {showPassword
                  ? <EyeOff size={16} color="#9CA3AF" />
                  : <Eye size={16} color="#9CA3AF" />}
              </Pressable>
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirm Password</Text>
            <View style={styles.inputWrap}>
              <Lock size={16} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                testID="signup-confirm-password-input"
                style={[styles.input, styles.inputPassword]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showConfirmPassword}
                autoComplete="password-new"
                returnKeyType="done"
                onSubmitEditing={handleSignUp}
              />
              <Pressable
                onPress={() => setShowConfirmPassword((v) => !v)}
                style={styles.eyeBtn}
                hitSlop={8}
              >
                {showConfirmPassword
                  ? <EyeOff size={16} color="#9CA3AF" />
                  : <Eye size={16} color="#9CA3AF" />}
              </Pressable>
            </View>
          </View>

          {/* Sign Up Button */}
          <Pressable
            testID="signup-submit-button"
            onPress={handleSignUp}
            disabled={loading}
            style={({ pressed }) => [styles.signUpBtn, pressed && { opacity: 0.85 }]}
          >
            <LinearGradient
              colors={loading ? ['#FCD34D', '#FCD34D'] : ['#F59E0B', '#D97706']}
              style={styles.signUpBtnGradient}
            >
              {loading
                ? <ActivityIndicator color="#1A1A1A" />
                : <Text style={styles.signUpBtnText}>Sign Up</Text>}
            </LinearGradient>
          </Pressable>

          {/* Back to Sign In */}
          <Pressable
            testID="back-to-signin-link"
            onPress={() => router.back()}
            style={styles.backRow}
            hitSlop={8}
          >
            <Text style={styles.backText}>Already have an account? <Text style={styles.backLink}>Sign In</Text></Text>
          </Pressable>
        </View>

        {/* Support */}
        <Pressable
          style={({ pressed }) => [styles.supportBtn, pressed && { opacity: 0.75 }]}
          onPress={() => Linking.openURL('mailto:support@kel-es.com?subject=KEL Smart Access Request')}
        >
          <Headphones size={15} color="#F59E0B" />
          <Text style={styles.supportText}>Need help? Contact Support</Text>
        </Pressable>

        <Copyright />
      </ScrollView>

      {/* Error Modal */}
      <Modal
        visible={errorVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setErrorVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setErrorVisible(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Sign Up Failed</Text>
            <Text style={styles.modalMessage}>{errorMsg}</Text>
            <Pressable
              style={styles.modalBtn}
              onPress={() => setErrorVisible(false)}
            >
              <Text style={styles.modalBtnText}>OK</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  logoImage: {
    width: 200,
    height: 100,
    marginBottom: 8,
  },
  appName: {
    fontSize: 24,
    fontFamily: 'IBMPlexMono_700Bold',
    color: '#111827',
    letterSpacing: 2,
    marginTop: 4,
  },
  appNameAccent: {
    color: '#F59E0B',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 24,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: '#111827',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#4B5563',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: '#111827',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
  },
  inputPassword: {
    paddingRight: 8,
  },
  eyeBtn: {
    padding: 4,
  },
  signUpBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  signUpBtnGradient: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signUpBtnText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#1A1A1A',
    letterSpacing: 0.3,
  },
  backRow: {
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 16,
  },
  backText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#4B5563',
  },
  backLink: {
    color: '#F59E0B',
    fontFamily: 'Inter_700Bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 24,
    width: '100%',
    maxWidth: 340,
    gap: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    color: '#111827',
  },
  modalMessage: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
    lineHeight: 20,
  },
  modalBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: 10,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  modalBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#1A1A1A',
  },
  supportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    marginTop: 8,
  },
  supportText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#F59E0B',
  },
});
