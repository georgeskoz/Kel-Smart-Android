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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff, Lock, Mail, Headphones } from 'lucide-react-native';
import { signIn, resetPassword, isFirebaseConfigured } from '@/lib/firebase';
import { useAuthStore } from '@/lib/state/authStore';
import { Linking } from 'react-native';
import { Copyright } from '@/components/Copyright';

export default function LoginScreen() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [errorVisible, setErrorVisible] = useState(false);

  const [forgotVisible, setForgotVisible] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState('');

  const configured = isFirebaseConfigured();

  function showError(msg: string) {
    setErrorMsg(msg);
    setErrorVisible(true);
  }

  async function handleSignIn() {
    if (!email.trim() || !password.trim()) {
      showError('Please enter your email and password.');
      return;
    }

    if (!configured) {
      showError('Firebase is not configured. Please add your Firebase environment variables.');
      return;
    }

    setLoading(true);
    try {
      const profile = await signIn(email.trim().toLowerCase(), password);
      setUser(profile);
      if (profile.role === 'admin') {
        router.replace('/admin' as any);
      } else {
        router.replace('/(tabs)');
      }
    } catch (e: any) {
      const code = e?.code ?? '';
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        showError('Invalid email or password. Please try again.');
      } else if (code === 'auth/too-many-requests') {
        showError('Too many failed attempts. Please try again later.');
      } else {
        showError(e?.message ?? 'Sign in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  function openForgotPassword() {
    setForgotEmail(email);
    setForgotSent(false);
    setForgotError('');
    setForgotVisible(true);
  }

  function closeForgotPassword() {
    setForgotVisible(false);
  }

  async function handleForgotSubmit() {
    if (!forgotEmail.trim()) {
      setForgotError('Please enter your email address.');
      return;
    }

    if (!configured) {
      setForgotError('Firebase is not configured. Please add your Firebase environment variables.');
      return;
    }

    setForgotError('');
    setForgotLoading(true);
    try {
      await resetPassword(forgotEmail.trim().toLowerCase());
      setForgotSent(true);
    } catch (e: any) {
      const code = e?.code ?? '';
      if (code === 'auth/user-not-found') {
        // Don't reveal whether the account exists — same success message either way.
        setForgotSent(true);
      } else if (code === 'auth/invalid-email') {
        setForgotError('Please enter a valid email address.');
      } else {
        setForgotError(e?.message ?? 'Something went wrong. Please try again.');
      }
    } finally {
      setForgotLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
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
          <Text style={styles.cardTitle}>Sign In</Text>
          <Text style={styles.cardSubtitle}>Access your tank monitoring dashboard</Text>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.inputWrap}>
              <Mail size={16} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                testID="login-email-input"
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
                testID="login-password-input"
                style={[styles.input, styles.inputPassword]}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
                autoComplete="password"
                returnKeyType="done"
                onSubmitEditing={handleSignIn}
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

          {/* Forgot Password */}
          <Pressable
            testID="forgot-password-link"
            onPress={openForgotPassword}
            style={styles.forgotRow}
            hitSlop={8}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </Pressable>

          {/* Sign In Button */}
          <Pressable
            testID="login-submit-button"
            onPress={handleSignIn}
            disabled={loading}
            style={({ pressed }) => [styles.signInBtn, pressed && { opacity: 0.85 }]}
          >
            <LinearGradient
              colors={loading ? ['#8891AC', '#8891AC'] : ['#26335F', '#1E294C']}
              style={styles.signInBtnGradient}
            >
              {loading
                ? <ActivityIndicator color="#FFFFFF" />
                : <Text style={styles.signInBtnText}>Sign In</Text>}
            </LinearGradient>
          </Pressable>

          {/* Sign Up */}
          <Pressable
            testID="signup-link"
            onPress={() => router.push('/signup')}
            style={styles.signupRow}
            hitSlop={8}
          >
            <Text style={styles.signupText}>Don't have an account? <Text style={styles.signupLink}>Sign Up</Text></Text>
          </Pressable>
        </View>

        {/* Support */}
        <Pressable
          style={({ pressed }) => [styles.supportBtn, pressed && { opacity: 0.75 }]}
          onPress={() => Linking.openURL('mailto:support@kel-es.com?subject=KEL Smart App Support')}
        >
          <Headphones size={15} color="#26335F" />
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
            <Text style={styles.modalTitle}>Sign In Failed</Text>
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

      {/* Forgot Password Modal */}
      <Modal
        visible={forgotVisible}
        transparent
        animationType="fade"
        onRequestClose={closeForgotPassword}
      >
        <Pressable style={styles.modalOverlay} onPress={closeForgotPassword}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            {forgotSent ? (
              <>
                <Text style={styles.modalTitle}>Check Your Email</Text>
                <Text style={styles.modalMessage}>
                  If an account exists for this email, a password reset link has been sent.
                </Text>
                <Pressable style={styles.modalBtn} onPress={closeForgotPassword}>
                  <Text style={styles.modalBtnText}>OK</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>Reset Password</Text>
                <Text style={styles.modalMessage}>
                  Enter your email and we'll send you a link to reset your password.
                </Text>
                <View style={styles.forgotInputWrap}>
                  <Mail size={16} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    testID="forgot-password-email-input"
                    style={styles.input}
                    value={forgotEmail}
                    onChangeText={setForgotEmail}
                    placeholder="you@company.com"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                  />
                </View>
                {forgotError ? <Text style={styles.forgotErrorText}>{forgotError}</Text> : null}
                <View style={styles.modalBtnRow}>
                  <Pressable style={styles.modalCancelBtn} onPress={closeForgotPassword}>
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    testID="forgot-password-submit-button"
                    style={styles.modalConfirmBtn}
                    onPress={handleForgotSubmit}
                    disabled={forgotLoading}
                  >
                    {forgotLoading
                      ? <ActivityIndicator color="#FFFFFF" size="small" />
                      : <Text style={styles.modalConfirmText}>Send Link</Text>}
                  </Pressable>
                </View>
              </>
            )}
          </Pressable>
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
    marginBottom: 40,
    marginTop: 20,
  },
  logoImage: {
    width: 220,
    height: 110,
    marginBottom: 8,
  },
  appName: {
    fontSize: 28,
    fontFamily: 'IBMPlexMono_700Bold',
    color: '#111827',
    letterSpacing: 2,
    marginTop: 4,
  },
  appNameAccent: {
    color: '#26335F',
  },
  logoSubtitle: {
    fontSize: 10,
    fontFamily: 'IBMPlexMono_400Regular',
    color: '#9CA3AF',
    letterSpacing: 3,
    marginTop: 4,
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
  forgotRow: {
    alignSelf: 'flex-end',
    paddingVertical: 4,
    marginTop: -8,
    marginBottom: 8,
  },
  forgotText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#26335F',
  },
  signInBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#26335F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  signInBtnGradient: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInBtnText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  signupRow: {
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 16,
  },
  signupText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#4B5563',
  },
  signupLink: {
    color: '#26335F',
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
    backgroundColor: '#26335F',
    borderRadius: 10,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  modalBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
  },
  forgotInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
  },
  forgotErrorText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#EF4444',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
  },
  modalConfirmBtn: {
    flex: 1,
    height: 44,
    backgroundColor: '#26335F',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
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
    color: '#26335F',
  },
});
