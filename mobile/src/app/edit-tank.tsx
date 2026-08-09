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
import { ArrowLeft, Save, Droplets, AlertTriangle, Lock, Archive } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ref, get, update } from 'firebase/database';
import { getFirebaseDB, leaveTank } from '@/lib/firebase';
import { useAuthStore } from '@/lib/state/authStore';
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

function DeleteConfirmModal({
  visible,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.modalOverlay} onPress={onCancel}>
        <View style={styles.modalCard}>
          <View style={[styles.modalIconWrap, { backgroundColor: '#26335F22' }]}>
            <Archive size={24} color="#26335F" />
          </View>
          <Text style={styles.modalTitle}>Archive Tank?</Text>
          <Text style={styles.modalMessage}>
            The tank will be hidden from your dashboard but can be reactivated later.
          </Text>
          <View style={styles.deleteModalBtnRow}>
            <Pressable
              style={[styles.deleteModalBtn, styles.deleteModalCancelBtn]}
              onPress={onCancel}
              testID="delete-cancel-button"
            >
              <Text style={styles.deleteModalCancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.deleteModalBtn, styles.deleteModalConfirmBtn]}
              onPress={onConfirm}
              testID="delete-confirm-button"
            >
              <Text style={styles.deleteModalConfirmText}>Delete</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

export default function EditTankScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [type, setType] = useState<TankType>('Water');
  const [capacity, setCapacity] = useState('');
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
  const [deleteModal, setDeleteModal] = useState(false);

  function showModal(title: string, message: string, isError: boolean) {
    setModal({ visible: true, title, message, isError });
  }

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const db = getFirebaseDB();
    if (!db) {
      setLoading(false);
      return;
    }

    get(ref(db, 'sensors/' + id))
      .then((snap) => {
        const raw = snap.val();
        if (raw) {
          setName(raw.name || id);
          const tankType = (raw.type as TankType) || 'Water';
          setType(TANK_TYPES.some((t) => t.label === tankType) ? tankType : 'Water');
          setCapacity(String(raw.capacity || 1000));
          setLowAlert(String(raw.lowAlert ?? 20));
          setHighAlert(String(raw.highAlert ?? 90));
          setCriticalAlert(String(raw.criticalAlert ?? 10));
        }
      })
      .catch((e) => {
        console.warn('[EditTank] Load failed:', e);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  async function handleSave() {
    if (!name.trim()) {
      showModal('Missing Name', 'Please enter a tank name.', true);
      return;
    }
    const capacityNum = parseFloat(capacity);
    if (!capacity || isNaN(capacityNum) || capacityNum <= 0) {
      showModal('Invalid Capacity', 'Please enter a valid capacity in liters.', true);
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
      await update(ref(db, 'sensors/' + id), {
        name: name.trim(),
        type,
        capacity: capacityNum,
        lowAlert: lowNum,
        highAlert: highNum,
        criticalAlert: critNum,
      });
      showModal('Tank Updated', `"${name.trim()}" has been updated successfully.`, false);
    } catch (e: any) {
      showModal('Save Failed', e?.message ?? 'Failed to save tank. Please try again.', true);
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

  async function handleDelete() {
    const db = getFirebaseDB();
    if (!db) {
      showModal('Not Connected', 'Firebase is not configured.', true);
      return;
    }
    if (!user?.uid || !id) {
      showModal('Not Signed In', 'Please sign in again and retry.', true);
      return;
    }
    try {
      await leaveTank(id, user.uid);
      router.back();
    } catch (e: any) {
      showModal('Archive Failed', e?.message ?? 'Failed to archive tank. Please try again.', true);
    }
  }

  if (loading) {
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
              <Text style={styles.headerTitle}>Edit Tank</Text>
              <Text style={styles.headerSubtitle}>Update sensor config</Text>
            </View>
            <View style={{ width: 40 }} />
          </LinearGradient>
        </SafeAreaView>
        <View style={styles.loadingWrap} testID="loading-indicator">
          <ActivityIndicator size="large" color="#26335F" />
        </View>
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
            <Text style={styles.headerTitle}>Edit Tank</Text>
            <Text style={styles.headerSubtitle}>Update sensor config</Text>
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
          {/* Sensor ID (read-only) */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>SENSOR ID</Text>
            <View style={[styles.inputWrap, { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' }]}>
              <Lock size={16} color="#9CA3AF" style={{ marginRight: 8 }} />
              <Text style={[styles.input, { color: '#111827' }]} numberOfLines={1}>
                {id ?? '—'}
              </Text>
            </View>
          </View>

          {/* Tank Name */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>TANK NAME</Text>
            <View style={styles.inputWrap}>
              <TextInput
                testID="tank-name-input"
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Main Water Tank"
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
                  <Text style={[styles.chipText, { color: '#111827' }]}>
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
            testID="save-tank-button"
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
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                </>
              )}
            </LinearGradient>
          </Pressable>

          {/* Delete Button */}
          <Pressable
            testID="delete-tank-button"
            onPress={() => setDeleteModal(true)}
            style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.85 }]}
          >
            <LinearGradient colors={['#EF4444', '#DC2626']} style={styles.deleteBtnGradient}>
              <Archive size={18} color="#fff" strokeWidth={2.5} />
              <Text style={styles.deleteBtnText}>Delete Tank</Text>
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
      <DeleteConfirmModal
        visible={deleteModal}
        onCancel={() => setDeleteModal(false)}
        onConfirm={() => {
          setDeleteModal(false);
          handleDelete();
        }}
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
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  deleteModalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 4,
  },
  deleteModalBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteModalCancelBtn: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  deleteModalCancelText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
  },
  deleteModalConfirmBtn: {
    backgroundColor: '#EF4444',
  },
  deleteModalConfirmText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
  deleteBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 12,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  deleteBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 54,
  },
  deleteBtnText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
    letterSpacing: 0.3,
  },
});
