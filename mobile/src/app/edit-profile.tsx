import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  User,
  Lock,
  CheckCircle,
  AlertTriangle,
  FileText,
  ChevronRight,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  updateProfile,
} from 'firebase/auth';
import { getUserProfile, updateUserProfile, getFirebaseAuth } from '@/lib/firebase';
import { useAuthStore } from '@/lib/state/authStore';
import { Copyright } from '@/components/Copyright';

function InfoModal({
  visible,
  title,
  message,
  isError,
  onClose,
}: {
  visible: boolean;
  title: string;
  message: string;
  isError: boolean;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.modalCard}>
          <View style={[styles.modalIconWrap, { backgroundColor: isError ? '#EF444422' : '#10B98122' }]}>
            {isError ? (
              <AlertTriangle size={24} color="#EF4444" />
            ) : (
              <CheckCircle size={24} color="#10B981" />
            )}
          </View>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalMessage}>{message}</Text>
          <Pressable
            style={[styles.modalBtn, { backgroundColor: isError ? '#EF4444' : '#10B981' }]}
            onPress={onClose}
          >
            <Text style={styles.modalBtnText}>OK</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

function InputField({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  autoCapitalize,
  keyboardType,
  testID,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'words' | 'sentences' | 'characters';
  keyboardType?: 'default' | 'phone-pad';
  testID?: string;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputWrap}>
        <View style={styles.inputIcon}>{icon}</View>
        <TextInput
          testID={testID}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize ?? 'sentences'}
          keyboardType={keyboardType}
        />
      </View>
    </View>
  );
}

export default function EditProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [displayName, setDisplayName] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const [modal, setModal] = useState<{ visible: boolean; title: string; message: string; isError: boolean }>({
    visible: false,
    title: '',
    message: '',
    isError: false,
  });

  useEffect(() => {
    async function loadProfile() {
      if (!user?.uid) {
        setLoadingProfile(false);
        return;
      }
      try {
        const profile = await getUserProfile(user.uid);
        if (profile) {
          setDisplayName(profile.displayName ?? '');
        } else {
          setDisplayName(user.displayName ?? '');
        }
      } catch {
        setDisplayName(user.displayName ?? '');
      } finally {
        setLoadingProfile(false);
      }
    }
    loadProfile();
  }, [user?.uid]);

  function showModal(title: string, message: string, isError: boolean) {
    setModal({ visible: true, title, message, isError });
  }

  async function handleSaveProfile() {
    if (!user?.uid) return;
    if (!displayName.trim()) {
      showModal('Missing Name', 'Display name cannot be empty.', true);
      return;
    }
    setSavingProfile(true);
    try {
      await updateUserProfile(user.uid, {
        displayName: displayName.trim(),
      });

      const firebaseAuth = getFirebaseAuth();
      if (firebaseAuth?.currentUser) {
        await updateProfile(firebaseAuth.currentUser, { displayName: displayName.trim() });
      }

      // Update local store
      setUser({ ...user, displayName: displayName.trim() });
      showModal('Profile Updated', 'Your profile has been saved successfully.', false);
    } catch (e: any) {
      showModal('Save Failed', e?.message ?? 'Failed to update profile. Please try again.', true);
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showModal('Missing Fields', 'Please fill in all password fields.', true);
      return;
    }
    if (newPassword.length < 6) {
      showModal('Weak Password', 'New password must be at least 6 characters.', true);
      return;
    }
    if (newPassword !== confirmPassword) {
      showModal('Password Mismatch', 'New password and confirm password do not match.', true);
      return;
    }

    const firebaseAuth = getFirebaseAuth();
    const currentUser = firebaseAuth?.currentUser;
    if (!currentUser || !currentUser.email) {
      showModal('Not Signed In', 'You must be signed in to change your password.', true);
      return;
    }

    setSavingPassword(true);
    try {
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showModal('Password Changed', 'Your password has been updated successfully.', false);
    } catch (e: any) {
      const msg =
        e?.code === 'auth/wrong-password' || e?.code === 'auth/invalid-credential'
          ? 'Current password is incorrect.'
          : e?.message ?? 'Failed to change password.';
      showModal('Error', msg, true);
    } finally {
      setSavingPassword(false);
    }
  }

  if (loadingProfile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#F59E0B" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <LinearGradient colors={['#FFFFFF', '#F3F4F6']} style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
            testID="back-button"
          >
            <ArrowLeft size={20} color="#111827" />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Edit Profile</Text>
            <Text style={styles.headerSubtitle}>Update your account details</Text>
          </View>
          <View style={{ width: 40 }} />
        </LinearGradient>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Section */}
          <Text style={styles.sectionLabel}>PROFILE INFORMATION</Text>
          <View style={styles.card}>
            <InputField
              label="Display Name"
              icon={<User size={16} color="#9CA3AF" />}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your full name"
              autoCapitalize="words"
              testID="display-name-input"
            />
          </View>

          <Pressable
            testID="save-profile-button"
            onPress={handleSaveProfile}
            disabled={savingProfile}
            style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }, savingProfile && { opacity: 0.7 }]}
          >
            <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.saveBtnGradient}>
              {savingProfile ? (
                <ActivityIndicator color="#1A1A1A" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Save Profile</Text>
              )}
            </LinearGradient>
          </Pressable>

          {/* Password Section */}
          <Text style={[styles.sectionLabel, { marginTop: 8 }]}>CHANGE PASSWORD</Text>
          <View style={styles.card}>
            <InputField
              label="Current Password"
              icon={<Lock size={16} color="#9CA3AF" />}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              secureTextEntry
              autoCapitalize="none"
              testID="current-password-input"
            />
            <View style={styles.cardDivider} />
            <InputField
              label="New Password"
              icon={<Lock size={16} color="#9CA3AF" />}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="At least 6 characters"
              secureTextEntry
              autoCapitalize="none"
              testID="new-password-input"
            />
            <View style={styles.cardDivider} />
            <InputField
              label="Confirm New Password"
              icon={<Lock size={16} color="#9CA3AF" />}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repeat new password"
              secureTextEntry
              autoCapitalize="none"
              testID="confirm-password-input"
            />
          </View>

          <Pressable
            testID="change-password-button"
            onPress={handleChangePassword}
            disabled={savingPassword}
            style={({ pressed }) => [
              styles.saveBtn,
              { marginTop: 0 },
              pressed && { opacity: 0.85 },
              savingPassword && { opacity: 0.7 },
            ]}
          >
            <View style={[styles.saveBtnGradient, { backgroundColor: '#F3F4F6' }]}>
              {savingPassword ? (
                <ActivityIndicator color="#111827" size="small" />
              ) : (
                <Text style={[styles.saveBtnText, { color: '#111827' }]}>Change Password</Text>
              )}
            </View>
          </Pressable>

          {/* Legal Section */}
          <Text style={[styles.sectionLabel, { marginTop: 8 }]}>LEGAL</Text>
          <View style={styles.card}>
            <Pressable
              testID="privacy-policy-button"
              onPress={() => router.push('/privacy-policy' as any)}
              style={({ pressed }) => [styles.legalRow, pressed && { opacity: 0.7 }]}
            >
              <View style={styles.legalIconWrap}>
                <FileText size={18} color="#F59E0B" />
              </View>
              <Text style={styles.legalRowText}>Privacy Policy</Text>
              <ChevronRight size={18} color="#9CA3AF" />
            </Pressable>
          </View>

          <View style={{ height: 48 }} />
          <Copyright />
        </ScrollView>
      </KeyboardAvoidingView>

      <InfoModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        isError={modal.isError}
        onClose={() => setModal((m) => ({ ...m, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  safeTop: {
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'IBMPlexMono_700Bold',
    color: '#111827',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#4B5563',
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'IBMPlexMono_700Bold',
    color: '#111827',
    letterSpacing: 2,
    marginBottom: 10,
    marginLeft: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    marginBottom: 14,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 14,
  },
  fieldWrap: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  fieldLabel: {
    fontSize: 11,
    fontFamily: 'IBMPlexMono_500Medium',
    color: '#4B5563',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    height: 46,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
  },
  saveBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  saveBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
  },
  saveBtnText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#1A1A1A',
    letterSpacing: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
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
    maxWidth: 320,
    alignItems: 'center',
    gap: 12,
  },
  modalIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    color: '#111827',
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalBtn: {
    width: '100%',
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  modalBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  legalIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  legalRowText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
  },
});
