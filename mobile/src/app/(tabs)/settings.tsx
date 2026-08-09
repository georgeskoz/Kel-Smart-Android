import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  Pressable,
  Linking,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Wifi,
  Bell,
  Volume2,
  Clock,
  Gauge,
  Info,
  ChevronRight,
  LogOut,
  Shield,
  UserPen,
  HeadphonesIcon,
  Mail,
  Phone,
  Trash2,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { isFirebaseConfigured, subscribeSensors, signOut, deleteAccount } from '@/lib/firebase';
import { useAuthStore } from '@/lib/state/authStore';
import { Copyright } from '@/components/Copyright';

function SettingRow({
  icon,
  label,
  value,
  onPress,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.settingRow, pressed && onPress ? { opacity: 0.7 } : null]}
    >
      <View style={styles.settingIcon}>{icon}</View>
      <Text style={styles.settingLabel}>{label}</Text>
      <View style={styles.settingRight}>
        {value ? <Text style={styles.settingValue}>{value}</Text> : null}
        {children}
        {onPress ? <ChevronRight size={14} color="#9CA3AF" /> : null}
      </View>
    </Pressable>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function UserAvatar({ name, size = 52 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const palette = ['#3B82F6', '#8B5CF6', '#10B981', '#26335F', '#EF4444'];
  const color = palette[name.charCodeAt(0) % palette.length];
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: `${color}28`, borderColor: `${color}55` }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.36, color }]}>{initials}</Text>
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundAlertsEnabled, setSoundAlertsEnabled] = useState(false);
  const [updateInterval, setUpdateInterval] = useState<'5s' | '10s' | '30s' | '1m'>('10s');
  const [units, setUnits] = useState<'%' | 'Liters' | 'Gallons'>('Liters');
  const [firebaseConnected, setFirebaseConnected] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReauthModal, setShowReauthModal] = useState(false);
  const [reAuthPassword, setReAuthPassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const configured = isFirebaseConfigured();

  useEffect(() => {
    if (!configured) return;
    const unsub = subscribeSensors(
      () => {},
      (connected) => setFirebaseConnected(connected)
    );
    return unsub;
  }, [configured]);

  async function handleLogout() {
    await signOut();
    logout();
    router.replace('/login' as any);
  }

  async function handleDeleteAccount(password?: string) {
    setIsDeleting(true);
    setDeleteError('');
    try {
      await deleteAccount(password);
      logout();
      router.replace('/login' as any);
    } catch (error: any) {
      setIsDeleting(false);
      const code = error?.code ?? '';
      if (code === 'auth/requires-recent-login') {
        // Need re-authentication — close confirm modal, open re-auth modal
        setShowDeleteModal(false);
        setReAuthPassword('');
        setShowReauthModal(true);
      } else if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setDeleteError('Incorrect password. Please try again.');
      } else {
        setDeleteError('Failed to delete account. Please try again.');
      }
    }
  }

  async function handleReauthAndDelete() {
    if (!reAuthPassword.trim()) {
      setDeleteError('Please enter your password.');
      return;
    }
    await handleDeleteAccount(reAuthPassword);
  }

  const displayName = user?.displayName ?? 'Guest';
  const email = user?.email ?? '';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <LinearGradient
          colors={['#FFFFFF', '#F3F4F6']}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Settings</Text>
        </LinearGradient>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile section */}
          {user ? (
            <>
              <SectionHeader title="PROFILE" />
              <View style={styles.card}>
                <View style={styles.profileRow}>
                  <UserAvatar name={displayName} size={52} />
                  <View style={styles.profileInfo}>
                    <Text style={styles.profileName}>{displayName}</Text>
                    <Text style={styles.profileEmail} numberOfLines={1}>{email}</Text>
                    <View style={[
                      styles.roleBadge,
                      user.role === 'admin'
                        ? { backgroundColor: '#DC262622', borderColor: '#DC262644' }
                        : { backgroundColor: '#10B98122', borderColor: '#10B98144' },
                    ]}>
                      <Text style={[
                        styles.roleBadgeText,
                        { color: user.role === 'admin' ? '#DC2626' : '#10B981' },
                      ]}>
                        {user.role === 'admin' ? 'ADMIN' : 'USER'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.divider} />
                <SettingRow
                  icon={<UserPen size={16} color="#26335F" />}
                  label="Edit Profile"
                  onPress={() => router.push('/edit-profile' as any)}
                />

                {user.role === 'admin' ? (
                  <>
                    <View style={styles.divider} />
                    <SettingRow
                      icon={<Shield size={16} color="#DC2626" />}
                      label="Admin Panel"
                      onPress={() => router.push('/admin' as any)}
                    />
                  </>
                ) : null}
              </View>
            </>
          ) : null}

          {/* Firebase status */}
          <SectionHeader title="CONNECTION" />
          <View style={styles.card}>
            <View style={styles.firebaseStatus}>
              <View style={styles.firebaseLeft}>
                <Wifi size={18} color={firebaseConnected ? '#10B981' : '#9CA3AF'} />
                <View>
                  <Text style={styles.firebaseTitle}>Firebase Realtime DB</Text>
                  <Text style={[styles.firebaseSubtitle, { color: firebaseConnected ? '#10B981' : configured ? '#26335F' : '#9CA3AF' }]}>
                    {firebaseConnected ? 'Connected — Live data' : configured ? 'Connecting...' : 'Add ENV vars to connect'}
                  </Text>
                </View>
              </View>
              <View style={[styles.statusPill, { backgroundColor: firebaseConnected ? '#10B98122' : configured ? '#26335F22' : '#9CA3AF22', borderColor: firebaseConnected ? '#10B98144' : configured ? '#26335F44' : '#9CA3AF44' }]}>
                <Text style={[styles.statusPillText, { color: firebaseConnected ? '#10B981' : configured ? '#26335F' : '#9CA3AF' }]}>
                  {firebaseConnected ? 'LIVE' : configured ? 'WAIT' : 'DEMO'}
                </Text>
              </View>
            </View>
          </View>

          {/* Update interval */}
          <SectionHeader title="DATA" />
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingIcon}>
                <Clock size={16} color="#111827" />
              </View>
              <Text style={styles.settingLabel}>Update Interval</Text>
              <View style={styles.segmentRow}>
                {(['5s', '10s', '30s', '1m'] as const).map((v) => (
                  <Pressable
                    key={v}
                    onPress={() => setUpdateInterval(v)}
                    style={[
                      styles.segment,
                      updateInterval === v && styles.segmentActive,
                    ]}
                  >
                    <Text style={[styles.segmentText, updateInterval === v && styles.segmentTextActive]}>
                      {v}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingIcon}>
                <Gauge size={16} color="#111827" />
              </View>
              <Text style={styles.settingLabel}>Units</Text>
              <View style={styles.segmentRow}>
                {(['%', 'Liters', 'Gallons'] as const).map((v) => (
                  <Pressable
                    key={v}
                    onPress={() => setUnits(v)}
                    style={[
                      styles.segment,
                      units === v && styles.segmentActive,
                    ]}
                  >
                    <Text style={[styles.segmentText, units === v && styles.segmentTextActive]}>
                      {v}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          {/* Notifications */}
          <SectionHeader title="NOTIFICATIONS" />
          <View style={styles.card}>
            <SettingRow
              icon={<Bell size={16} color="#111827" />}
              label="Push Notifications"
            >
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#E5E7EB', true: '#26335F44' }}
                thumbColor={notificationsEnabled ? '#26335F' : '#9CA3AF'}
              />
            </SettingRow>

            <View style={styles.divider} />

            <SettingRow
              icon={<Volume2 size={16} color="#111827" />}
              label="Sound Alerts"
            >
              <Switch
                value={soundAlertsEnabled}
                onValueChange={setSoundAlertsEnabled}
                trackColor={{ false: '#E5E7EB', true: '#26335F44' }}
                thumbColor={soundAlertsEnabled ? '#26335F' : '#9CA3AF'}
              />
            </SettingRow>
          </View>

          {/* About */}
          <SectionHeader title="ABOUT" />
          <View style={styles.card}>
            <SettingRow
              icon={<Info size={16} color="#111827" />}
              label="App Version"
              value="1.0.0"
            />
            <View style={styles.divider} />
            <SettingRow
              icon={<Shield size={16} color="#26335F" />}
              label="Privacy Policy"
              onPress={() => router.push('/privacy-policy' as any)}
            />
            <View style={styles.divider} />
            <View style={styles.aboutSection}>
              <Text style={styles.aboutTitle}><Text style={styles.aboutTitleAccent}>KEL</Text> Smart</Text>
              <Text style={styles.aboutSubtitle}>Professional Tank Monitoring System</Text>
              <Text style={styles.aboutBody}>
                Real-time IoT monitoring for ESP32 ultrasonic sensors. Monitor water, diesel, oil, and fuel tanks from anywhere.
              </Text>
              <Text style={styles.aboutFooter}>© 2025 KEL Industrial Systems</Text>
            </View>
          </View>

          {/* Support */}
          <SectionHeader title="SUPPORT" />
          <View style={styles.card}>
            <SettingRow
              icon={<Mail size={16} color="#26335F" />}
              label="Email Support"
              onPress={() => Linking.openURL('mailto:support@kel-es.com?subject=KEL Smart App Support')}
            />
            <View style={styles.divider} />
            <SettingRow
              icon={<Phone size={16} color="#26335F" />}
              label="Call Support"
              onPress={() => Linking.openURL('tel:+1234567890')}
            />
          </View>

          {/* Danger zone */}
          {user ? (
            <>
              <SectionHeader title="ACCOUNT" />
              <Pressable
                testID="logout-button"
                onPress={handleLogout}
                style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.85 }]}
              >
                <LinearGradient colors={['#EF4444', '#DC2626']} style={styles.logoutBtnGradient}>
                  <LogOut size={18} color="#fff" strokeWidth={2.5} />
                  <Text style={styles.logoutText}>Sign Out</Text>
                </LinearGradient>
              </Pressable>
              <Pressable
                testID="delete-account-button"
                onPress={() => setShowDeleteModal(true)}
                style={({ pressed }) => [styles.deleteAccountBtn, pressed && { opacity: 0.85 }]}
              >
                <View style={styles.deleteAccountBtnInner}>
                  <Trash2 size={16} color="#EF4444" strokeWidth={2.5} />
                  <Text style={styles.deleteAccountText}>Delete Account</Text>
                </View>
              </Pressable>
            </>
          ) : null}

          <View style={{ height: 40 }} />
          <Copyright />
        </ScrollView>

        <Modal
          visible={showDeleteModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDeleteModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalIconWrap}>
                <Trash2 size={28} color="#EF4444" strokeWidth={2} />
              </View>
              <Text style={styles.modalTitle}>Delete Account?</Text>
              <Text style={styles.modalBody}>
                This will permanently delete your account and all your data. This action cannot be undone.
              </Text>
              <View style={styles.modalActions}>
                <Pressable
                  testID="delete-cancel-button"
                  onPress={() => setShowDeleteModal(false)}
                  style={({ pressed }) => [styles.modalCancelBtn, pressed && { opacity: 0.8 }]}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  testID="delete-confirm-button"
                  onPress={() => handleDeleteAccount()}
                  style={({ pressed }) => [styles.modalDeleteBtn, pressed && { opacity: 0.8 }]}
                >
                  <Text style={styles.modalDeleteText}>Delete Forever</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Re-authentication modal */}
        <Modal
          visible={showReauthModal}
          transparent
          animationType="fade"
          onRequestClose={() => { setShowReauthModal(false); setDeleteError(''); }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalIconWrap}>
                <Trash2 size={28} color="#EF4444" strokeWidth={2} />
              </View>
              <Text style={styles.modalTitle}>Confirm Identity</Text>
              <Text style={styles.modalBody}>
                For security, please enter your password to permanently delete your account.
              </Text>
              <TextInput
                testID="reauth-password-input"
                style={styles.reAuthInput}
                placeholder="Your password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                value={reAuthPassword}
                onChangeText={(t) => { setReAuthPassword(t); setDeleteError(''); }}
                autoCapitalize="none"
              />
              {deleteError ? (
                <Text style={styles.reAuthError}>{deleteError}</Text>
              ) : null}
              <View style={styles.modalActions}>
                <Pressable
                  testID="reauth-cancel-button"
                  onPress={() => { setShowReauthModal(false); setDeleteError(''); }}
                  style={({ pressed }) => [styles.modalCancelBtn, pressed && { opacity: 0.8 }]}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  testID="reauth-confirm-button"
                  onPress={handleReauthAndDelete}
                  disabled={isDeleting}
                  style={({ pressed }) => [styles.modalDeleteBtn, (pressed || isDeleting) && { opacity: 0.7 }]}
                >
                  <Text style={styles.modalDeleteText}>{isDeleting ? 'Deleting...' : 'Delete Forever'}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'IBMPlexMono_700Bold',
    color: '#111827',
    letterSpacing: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionHeader: {
    fontSize: 11,
    fontFamily: 'IBMPlexMono_700Bold',
    color: '#111827',
    letterSpacing: 2,
    marginBottom: 8,
    marginLeft: 2,
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
    overflow: 'hidden',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  avatar: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'IBMPlexMono_700Bold',
  },
  profileInfo: {
    flex: 1,
    gap: 3,
  },
  profileName: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
  },
  profileEmail: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#4B5563',
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 2,
  },
  roleBadgeText: {
    fontSize: 9,
    fontFamily: 'IBMPlexMono_700Bold',
    letterSpacing: 0.8,
  },
  firebaseStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    gap: 12,
  },
  firebaseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  firebaseTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
  },
  firebaseSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 10,
    fontFamily: 'IBMPlexMono_700Bold',
    letterSpacing: 1,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  settingIcon: {
    width: 28,
    alignItems: 'center',
  },
  settingLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: '#111827',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    fontSize: 13,
    fontFamily: 'IBMPlexMono_400Regular',
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 14,
  },
  segmentRow: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 2,
    gap: 2,
  },
  segment: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  segmentActive: {
    backgroundColor: '#26335F',
  },
  segmentText: {
    fontSize: 11,
    fontFamily: 'IBMPlexMono_500Medium',
    color: '#4B5563',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  aboutSection: {
    padding: 16,
    gap: 4,
  },
  aboutTitle: {
    fontSize: 16,
    fontFamily: 'IBMPlexMono_700Bold',
    color: '#26335F',
    letterSpacing: 1,
  },
  aboutTitleAccent: {
    color: '#26335F',
  },
  aboutSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: '#111827',
    marginBottom: 8,
  },
  aboutBody: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#4B5563',
    lineHeight: 20,
  },
  aboutFooter: {
    fontSize: 11,
    fontFamily: 'IBMPlexMono_400Regular',
    color: '#9CA3AF',
    marginTop: 8,
  },
  logoutBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginBottom: 8,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  logoutBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 54,
  },
  logoutText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
    letterSpacing: 0.3,
  },
  deleteAccountBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EF444433',
    backgroundColor: '#EF444411',
  },
  deleteAccountBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 48,
  },
  deleteAccountText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#EF4444',
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
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  modalIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EF444422',
    borderWidth: 1,
    borderColor: '#EF444444',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#111827',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalBody: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
  },
  modalDeleteBtn: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDeleteText: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
  },
  reAuthInput: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
    marginBottom: 8,
  },
  reAuthError: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 12,
  },
});
