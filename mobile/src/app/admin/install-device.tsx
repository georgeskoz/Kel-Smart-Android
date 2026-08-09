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
  Save,
  Smartphone,
  Droplets,
  AlertTriangle,
  User,
} from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ref, set, get } from 'firebase/database';
import { getFirebaseDB, getUserProfile } from '@/lib/firebase';
import { Copyright } from '@/components/Copyright';

type TankType = 'Water' | 'Diesel' | 'Oil' | 'Gasoline' | 'Other';

const TANK_TYPES: { label: TankType; color: string; bg: string; border: string }[] = [
  { label: 'Water', color: '#3B82F6', bg: '#3B82F618', border: '#3B82F633' },
  { label: 'Diesel', color: '#26335F', bg: '#26335F18', border: '#26335F33' },
  { label: 'Oil', color: '#8B5CF6', bg: '#8B5CF618', border: '#8B5CF633' },
  { label: 'Gasoline', color: '#EAB308', bg: '#EAB30818', border: '#EAB30833' },
  { label: 'Other', color: '#6B7280', bg: '#6B728018', border: '#6B728033' },
];

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
            <AlertTriangle size={24} color={isError ? '#EF4444' : '#10B981'} />
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

export default function InstallDeviceScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();

  const [userName, setUserName] = useState<string>('');
  const [loadingUser, setLoadingUser] = useState(true);

  const [name, setName] = useState('');
  const [type, setType] = useState<TankType>('Water');
  const [capacity, setCapacity] = useState('');
  const [sensorId, setSensorId] = useState('');
  const [criticalAlert, setCriticalAlert] = useState('10');
  const [lowAlert, setLowAlert] = useState('20');
  const [highAlert, setHighAlert] = useState('90');
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<{ visible: boolean; title: string; message: string; isError: boolean }>({
    visible: false,
    title: '',
    message: '',
    isError: false,
  });

  useEffect(() => {
    async function fetchUser() {
      if (!userId) {
        setLoadingUser(false);
        return;
      }
      try {
        const profile = await getUserProfile(userId);
        setUserName(profile?.displayName ?? profile?.email ?? userId);
      } catch {
        setUserName(userId);
      } finally {
        setLoadingUser(false);
      }
    }
    fetchUser();
  }, [userId]);

  function showModal(title: string, message: string, isError: boolean) {
    setModal({ visible: true, title, message, isError });
  }

  async function handleSave() {
    if (!name.trim()) {
      showModal('Missing Name', 'Please enter a tank name.', true);
      return;
    }
    if (!sensorId.trim()) {
      showModal('Missing Sensor ID', 'Please enter the Sensor ID that matches your ESP32 TANK_ID.', true);
      return;
    }
    const capacityNum = parseFloat(capacity);
    if (!capacity || isNaN(capacityNum) || capacityNum <= 0) {
      showModal('Invalid Capacity', 'Please enter a valid capacity in liters.', true);
      return;
    }
    if (!userId) {
      showModal('No User', 'No target user specified.', true);
      return;
    }

    const lowNum = parseFloat(lowAlert) || 20;
    const highNum = parseFloat(highAlert) || 90;
    const critNum = parseFloat(criticalAlert) || 10;

    const db = getFirebaseDB();
    if (!db) {
      showModal('Not Connected', 'Firebase is not configured. Please add your Firebase environment variables.', true);
      return;
    }

    setSaving(true);
    try {
      const sensorRef = ref(db, `sensors/${sensorId.trim()}`);
      const existing = await get(sensorRef);
      if (existing.exists()) {
        showModal(
          'Sensor ID In Use',
          `A tank is already registered with sensor ID "${sensorId.trim()}". Double-check the ID, or use that tank's own Add Tank flow to link this user as a member instead of provisioning here.`,
          true
        );
        setSaving(false);
        return;
      }
      await set(sensorRef, {
        name: name.trim(),
        type,
        capacity: capacityNum,
        level: 0,
        status: 'offline',
        signal: 0,
        lowAlert: lowNum,
        highAlert: highNum,
        criticalAlert: critNum,
        members: { [userId]: true },
        timestamp: Date.now(),
      });
      showModal(
        'Device Installed',
        `"${name.trim()}" has been installed for ${userName}. It will go online once the sensor connects.`,
        false
      );
    } catch (e: any) {
      showModal('Save Failed', e?.message ?? 'Failed to install device. Please try again.', true);
    } finally {
      setSaving(false);
    }
  }

  function handleModalClose() {
    setModal((m) => ({ ...m, visible: false }));
    if (!modal.isError) {
      router.back();
    }
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
            <Text style={styles.headerTitle}>Install Device</Text>
            {loadingUser ? (
              <ActivityIndicator color="#26335F" size="small" />
            ) : (
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                For: {userName}
              </Text>
            )}
          </View>
          <View style={{ width: 40 }} />
        </LinearGradient>
      </SafeAreaView>

      {/* User banner */}
      {!loadingUser && userName ? (
        <View style={styles.userBanner}>
          <User size={14} color="#26335F" />
          <Text style={styles.userBannerText}>
            Installing for{' '}
            <Text style={{ color: '#26335F', fontFamily: 'Inter_600SemiBold' }}>{userName}</Text>
          </Text>
        </View>
      ) : null}

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
          {/* Tank Name */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>TANK NAME</Text>
            <View style={styles.inputWrap}>
              <TextInput
                testID="tank-name-input"
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Site A Water Tank"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Tank Type */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>TANK TYPE</Text>
            <View style={styles.chipRow}>
              {TANK_TYPES.map((t) => (
                <Pressable
                  key={t.label}
                  testID={`type-chip-${t.label.toLowerCase()}`}
                  onPress={() => setType(t.label)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: type === t.label ? t.bg : '#FFFFFF',
                      borderColor: type === t.label ? t.border : '#E5E7EB',
                    },
                  ]}
                >
                  <View style={[styles.chipDot, { backgroundColor: t.color }]} />
                  <Text style={[styles.chipText, { color: type === t.label ? t.color : '#4B5563' }]}>
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Capacity */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>CAPACITY</Text>
            <View style={styles.inputWrap}>
              <Droplets size={16} color="#9CA3AF" style={{ marginRight: 8 }} />
              <TextInput
                testID="capacity-input"
                style={[styles.input, { flex: 1 }]}
                value={capacity}
                onChangeText={setCapacity}
                placeholder="1000"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
              <Text style={styles.inputUnit}>Liters</Text>
            </View>
          </View>

          {/* Sensor ID */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>SENSOR ID</Text>
            <Text style={styles.sectionHint}>Must match the TANK_ID in your ESP32 firmware</Text>
            <View style={styles.inputWrap}>
              <Smartphone size={16} color="#9CA3AF" style={{ marginRight: 8 }} />
              <TextInput
                testID="sensor-id-input"
                style={[styles.input, { flex: 1, fontFamily: 'IBMPlexMono_400Regular' }]}
                value={sensorId}
                onChangeText={setSensorId}
                placeholder="tank_001"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Alert Thresholds */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ALERT THRESHOLDS</Text>
            <Text style={styles.sectionHint}>Set percentage levels to trigger alerts</Text>
            <View style={styles.thresholdRow}>
              <View style={styles.thresholdItem}>
                <View style={[styles.thresholdHeader, { borderBottomColor: '#EF444444' }]}>
                  <View style={[styles.thresholdDot, { backgroundColor: '#EF4444' }]} />
                  <Text style={[styles.thresholdLabel, { color: '#EF4444' }]}>Critical</Text>
                </View>
                <View style={styles.thresholdInputWrap}>
                  <TextInput
                    testID="critical-alert-input"
                    style={styles.thresholdInput}
                    value={criticalAlert}
                    onChangeText={setCriticalAlert}
                    placeholder="10"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                  />
                  <Text style={styles.thresholdUnit}>%</Text>
                </View>
              </View>

              <View style={styles.thresholdItem}>
                <View style={[styles.thresholdHeader, { borderBottomColor: '#26335F44' }]}>
                  <View style={[styles.thresholdDot, { backgroundColor: '#26335F' }]} />
                  <Text style={[styles.thresholdLabel, { color: '#26335F' }]}>Low</Text>
                </View>
                <View style={styles.thresholdInputWrap}>
                  <TextInput
                    testID="low-alert-input"
                    style={styles.thresholdInput}
                    value={lowAlert}
                    onChangeText={setLowAlert}
                    placeholder="20"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                  />
                  <Text style={styles.thresholdUnit}>%</Text>
                </View>
              </View>

              <View style={styles.thresholdItem}>
                <View style={[styles.thresholdHeader, { borderBottomColor: '#3B82F644' }]}>
                  <View style={[styles.thresholdDot, { backgroundColor: '#3B82F6' }]} />
                  <Text style={[styles.thresholdLabel, { color: '#3B82F6' }]}>High</Text>
                </View>
                <View style={styles.thresholdInputWrap}>
                  <TextInput
                    testID="high-alert-input"
                    style={styles.thresholdInput}
                    value={highAlert}
                    onChangeText={setHighAlert}
                    placeholder="90"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                  />
                  <Text style={styles.thresholdUnit}>%</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Save Button */}
          <Pressable
            testID="install-device-button"
            onPress={handleSave}
            disabled={saving}
            style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }, saving && { opacity: 0.7 }]}
          >
            <LinearGradient colors={['#26335F', '#1E294C']} style={styles.saveBtnGradient}>
              {saving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Save size={18} color="#FFFFFF" strokeWidth={2.5} />
                  <Text style={styles.saveBtnText}>Install Device</Text>
                </>
              )}
            </LinearGradient>
          </Pressable>

          <View style={{ height: 40 }} />
          <Copyright />
        </ScrollView>
      </KeyboardAvoidingView>

      <InfoModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        isError={modal.isError}
        onClose={handleModalClose}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
    gap: 3,
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
  },
  userBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#26335F11',
    borderBottomWidth: 1,
    borderBottomColor: '#26335F22',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  userBannerText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'IBMPlexMono_700Bold',
    color: '#111827',
    letterSpacing: 2,
    marginBottom: 8,
  },
  sectionHint: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#4B5563',
    marginBottom: 8,
    marginTop: -4,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    height: 52,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
  },
  inputUnit: {
    fontSize: 13,
    fontFamily: 'IBMPlexMono_400Regular',
    color: '#9CA3AF',
    marginLeft: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  chipText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  thresholdRow: {
    flexDirection: 'row',
    gap: 10,
  },
  thresholdItem: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  thresholdHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  thresholdDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  thresholdLabel: {
    fontSize: 10,
    fontFamily: 'IBMPlexMono_700Bold',
    letterSpacing: 0.5,
  },
  thresholdInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  thresholdInput: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'IBMPlexMono_700Bold',
    color: '#111827',
  },
  thresholdUnit: {
    fontSize: 12,
    fontFamily: 'IBMPlexMono_400Regular',
    color: '#4B5563',
  },
  saveBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#26335F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  saveBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 54,
  },
  saveBtnText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
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
});
