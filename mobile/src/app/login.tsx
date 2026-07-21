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
import { signIn, isFirebaseConfigured } from '@/lib/firebase';
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
              <Mail size={16} color="#4B5563" style={styles.inputIcon} />
              <TextInput
                testID="login-email-input"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@company.com"
                placeholderTextColor="#4B5563"
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
              <Lock size={16} color="#4B5563" style={styles.inputIcon} />
              <TextInput
                testID="login-password-input"
                style={[styles.input, styles.inputPassword]}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#4B5563"
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
                  ? <EyeOff size={16} color="#4B5563" />
                  : <Eye size={16} color="#4B5563" />}
              </Pressable>
            </View>
          </View>

          {/* Sign In Button */}
          <Pressable
            testID="login-submit-button"
            onPress={handleSignIn}
            disabled={loading}
            style={({ pressed }) => [styles.signInBtn, pressed && { opacity: 0.85 }]}
          >
            <LinearGradient
              colors={loading ? ['#78350F', '#78350F'] : ['#F59E0B', '#D97706']}
              style={styles.signInBtnGradient}
            >
              {loading
                ? <ActivityIndicator color="#5A5A5A" />
                : <Text style={styles.signInBtnText}>Sign In</Text>}
            </LinearGradient>
          </Pressable>

          {/* Admin provisioning note */}
          <Text style={styles.adminNote}>Access is provided by your company administrator.</Text>
        </View>

        {/* Support */}
        <Pressable
          style={({ pressed }) => [styles.supportBtn, pressed && { opacity: 0.75 }]}
          onPress={() => Linking.openURL('mailto:support@kel-es.com?subject=KEL Smart App Support')}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#5A5A5A',
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
    color: '#FFFFFF',
    letterSpacing: 2,
    marginTop: 4,
  },
  appNameAccent: {
    color: '#F59E0B',
  },
  logoSubtitle: {
    fontSize: 10,
    fontFamily: 'IBMPlexMono_400Regular',
    color: '#4B5563',
    letterSpacing: 3,
    marginTop: 4,
  },
  card: {
    backgroundColor: '#252525',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#30363D',
    padding: 24,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#E0E0E0',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#252525',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#30363D',
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
    color: '#FFFFFF',
  },
  inputPassword: {
    paddingRight: 8,
  },
  eyeBtn: {
    padding: 4,
  },
  signInBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#F59E0B',
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
    color: '#0D1117',
    letterSpacing: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#252525',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#30363D',
    padding: 24,
    width: '100%',
    maxWidth: 340,
    gap: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
  },
  modalMessage: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
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
    color: '#0D1117',
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
  adminNote: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#4B5563',
    textAlign: 'center',
    marginTop: 16,
  },
});
