import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, Plus, ChevronDown, ChevronUp, Trash2, Shield, UserCheck, Smartphone } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { getAllUsers, updateUserRole, deleteUser, createUser, isFirebaseConfigured } from '@/lib/firebase';
import type { UserProfile } from '@/lib/state/authStore';
import { Copyright } from '@/components/Copyright';

type FilterTab = 'all' | 'users' | 'admins';

function UserAvatar({ name, size = 42 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const palette = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];
  const color = palette[name.charCodeAt(0) % palette.length];
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: `${color}28`, borderColor: `${color}55` }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.36, color }]}>{initials}</Text>
    </View>
  );
}

function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel,
  confirmColor,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmColor: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.modalOverlay} onPress={onCancel}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalMessage}>{message}</Text>
          <View style={styles.modalBtnRow}>
            <Pressable style={styles.modalCancelBtn} onPress={onCancel}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.modalConfirmBtn, { backgroundColor: confirmColor }]} onPress={onConfirm}>
              <Text style={styles.modalConfirmText}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

function AddUserModal({
  visible,
  onClose,
  onAdd,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (email: string, password: string, displayName: string, role: 'user' | 'admin') => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleAdd() {
    if (!name.trim() || !email.trim() || password.length < 6) {
      setError('Please fill all required fields. Password min 6 chars.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onAdd(email.trim().toLowerCase(), password, name.trim(), role);
      setName(''); setEmail(''); setPassword(''); setRole('user');
      onClose();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to create user.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={[styles.modalCard, { width: '100%', maxWidth: 400 }]} onPress={() => {}}>
          <Text style={styles.modalTitle}>Add New User</Text>

          <TextInput
            style={styles.addInput}
            value={name}
            onChangeText={setName}
            placeholder="Full Name"
            placeholderTextColor="#4B5563"
          />
          <TextInput
            style={styles.addInput}
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor="#4B5563"
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.addInput}
            value={password}
            onChangeText={setPassword}
            placeholder="Password (min 6 chars)"
            placeholderTextColor="#4B5563"
            secureTextEntry
          />

          <View style={styles.roleToggleRow}>
            <Pressable
              style={[styles.roleToggleBtn, role === 'user' && styles.roleToggleBtnActive]}
              onPress={() => setRole('user')}
            >
              <Text style={[styles.roleToggleText, role === 'user' && styles.roleToggleTextActive]}>User</Text>
            </Pressable>
            <Pressable
              style={[styles.roleToggleBtn, role === 'admin' && styles.roleToggleBtnActiveRed]}
              onPress={() => setRole('admin')}
            >
              <Text style={[styles.roleToggleText, role === 'admin' && styles.roleToggleTextActiveRed]}>Admin</Text>
            </Pressable>
          </View>

          {error ? <Text style={styles.addError}>{error}</Text> : null}

          <View style={styles.modalBtnRow}>
            <Pressable style={styles.modalCancelBtn} onPress={onClose}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.modalConfirmBtn, { backgroundColor: '#F59E0B' }]} onPress={handleAdd} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#5A5A5A" size="small" />
                : <Text style={[styles.modalConfirmText, { color: '#5A5A5A' }]}>Create</Text>}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function UserItem({
  user,
  onPromote,
  onDemote,
  onDelete,
  onAddDevice,
}: {
  user: UserProfile;
  onPromote: (uid: string) => void;
  onDemote: (uid: string) => void;
  onDelete: (uid: string) => void;
  onAddDevice: (uid: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const initials = (user.displayName || user.email).split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <View style={styles.userItemWrap}>
      <Pressable
        style={({ pressed }) => [styles.userItem, pressed && { opacity: 0.85 }]}
        onPress={() => setExpanded((v) => !v)}
      >
        <UserAvatar name={user.displayName || user.email} size={42} />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.displayName || 'Unknown'}</Text>
          <Text style={styles.userEmail} numberOfLines={1}>{user.email}</Text>
        </View>
        <View style={styles.userRight}>
          <View style={[
            styles.roleBadge,
            user.role === 'admin'
              ? { backgroundColor: '#DC262622', borderColor: '#DC262644' }
              : { backgroundColor: '#10B98122', borderColor: '#10B98144' },
          ]}>
            <Text style={[styles.roleBadgeText, { color: user.role === 'admin' ? '#DC2626' : '#10B981' }]}>
              {user.role.toUpperCase()}
            </Text>
          </View>
          {expanded ? <ChevronUp size={14} color="#4B5563" /> : <ChevronDown size={14} color="#4B5563" />}
        </View>
      </Pressable>

      {expanded ? (
        <View style={styles.expandedActions}>
          <Pressable
            style={[styles.actionBtn, { backgroundColor: '#F59E0B18', borderColor: '#F59E0B33' }]}
            onPress={() => onAddDevice(user.uid)}
          >
            <Smartphone size={14} color="#F59E0B" />
            <Text style={[styles.actionBtnText, { color: '#F59E0B' }]}>Add Device</Text>
          </Pressable>
          {user.role === 'user' ? (
            <Pressable
              style={[styles.actionBtn, { backgroundColor: '#DC262618', borderColor: '#DC262633' }]}
              onPress={() => onPromote(user.uid)}
            >
              <Shield size={14} color="#DC2626" />
              <Text style={[styles.actionBtnText, { color: '#DC2626' }]}>Promote to Admin</Text>
            </Pressable>
          ) : null}
          {user.role === 'admin' ? (
            <Pressable
              style={[styles.actionBtn, { backgroundColor: '#10B98118', borderColor: '#10B98133' }]}
              onPress={() => onDemote(user.uid)}
            >
              <UserCheck size={14} color="#10B981" />
              <Text style={[styles.actionBtnText, { color: '#10B981' }]}>Demote to User</Text>
            </Pressable>
          ) : null}
          <Pressable
            style={[styles.actionBtn, { backgroundColor: '#EF444418', borderColor: '#EF444433' }]}
            onPress={() => onDelete(user.uid)}
          >
            <Trash2 size={14} color="#EF4444" />
            <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Delete User</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

export default function AdminUsersScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterTab>('all');
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    confirmColor: string;
    onConfirm: () => void;
  }>({ visible: false, title: '', message: '', confirmLabel: '', confirmColor: '#EF4444', onConfirm: () => {} });
  const [addModalVisible, setAddModalVisible] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAllUsers();
      setUsers(result);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filtered = users.filter((u) => {
    const matchesSearch =
      !search ||
      u.displayName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === 'all' ||
      (filter === 'users' && u.role === 'user') ||
      (filter === 'admins' && u.role === 'admin');
    return matchesSearch && matchesFilter;
  });

  function confirmPromote(uid: string) {
    const u = users.find((x) => x.uid === uid);
    setConfirmModal({
      visible: true,
      title: 'Promote to Admin',
      message: `Give admin access to ${u?.displayName ?? 'this user'}? They will have full system control.`,
      confirmLabel: 'Promote',
      confirmColor: '#DC2626',
      onConfirm: async () => {
        setConfirmModal((m) => ({ ...m, visible: false }));
        await updateUserRole(uid, 'admin');
        setUsers((prev) => prev.map((x) => x.uid === uid ? { ...x, role: 'admin' } : x));
      },
    });
  }

  function confirmDemote(uid: string) {
    const u = users.find((x) => x.uid === uid);
    setConfirmModal({
      visible: true,
      title: 'Demote to User',
      message: `Remove admin access from ${u?.displayName ?? 'this user'}?`,
      confirmLabel: 'Demote',
      confirmColor: '#F59E0B',
      onConfirm: async () => {
        setConfirmModal((m) => ({ ...m, visible: false }));
        await updateUserRole(uid, 'user');
        setUsers((prev) => prev.map((x) => x.uid === uid ? { ...x, role: 'user' } : x));
      },
    });
  }

  function confirmDelete(uid: string) {
    const u = users.find((x) => x.uid === uid);
    setConfirmModal({
      visible: true,
      title: 'Delete User',
      message: `Permanently delete ${u?.displayName ?? 'this user'}? This cannot be undone.`,
      confirmLabel: 'Delete',
      confirmColor: '#EF4444',
      onConfirm: async () => {
        setConfirmModal((m) => ({ ...m, visible: false }));
        await deleteUser(uid);
        setUsers((prev) => prev.filter((x) => x.uid !== uid));
      },
    });
  }

  async function handleAddUser(
    email: string,
    password: string,
    displayName: string,
    role: 'user' | 'admin'
  ) {
    const newUser = await createUser(email, password, displayName, role);
    setUsers((prev) => [newUser, ...prev]);
  }

  function handleAddDevice(uid: string) {
    router.push(`/admin/install-device?userId=${uid}` as any);
  }

  const adminCount = users.filter((u) => u.role === 'admin').length;
  const userCount = users.filter((u) => u.role === 'user').length;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.container}>
        {/* Search */}
        <View style={styles.searchWrap}>
          <Search size={16} color="#4B5563" />
          <TextInput
            testID="users-search-input"
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search users..."
            placeholderTextColor="#4B5563"
            autoCapitalize="none"
          />
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterRow}>
          {(['all', 'users', 'admins'] as FilterTab[]).map((tab) => {
            const count = tab === 'all' ? users.length : tab === 'users' ? userCount : adminCount;
            return (
              <Pressable
                key={tab}
                style={[styles.filterTab, filter === tab && styles.filterTabActive]}
                onPress={() => setFilter(tab)}
              >
                <Text style={[styles.filterTabText, filter === tab && styles.filterTabTextActive]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
                <View style={[styles.filterCount, filter === tab && styles.filterCountActive]}>
                  <Text style={[styles.filterCountText, filter === tab && styles.filterCountTextActive]}>
                    {count}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* User List */}
        {loading ? (
          <ActivityIndicator color="#F59E0B" style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No users found</Text>
            {!isFirebaseConfigured() && (
              <Text style={styles.emptySubtext}>Firebase not configured — showing empty state</Text>
            )}
          </View>
        ) : (
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {filtered.map((u, idx) => (
              <React.Fragment key={u.uid}>
                {idx > 0 && <View style={styles.listDivider} />}
                <UserItem
                  user={u}
                  onPromote={confirmPromote}
                  onDemote={confirmDemote}
                  onDelete={confirmDelete}
                  onAddDevice={handleAddDevice}
                />
              </React.Fragment>
            ))}
            <Copyright />
            <View style={{ height: 100 }} />
          </ScrollView>
        )}

        {/* FAB */}
        <Pressable
          testID="add-user-fab"
          style={({ pressed }) => [styles.fab, pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] }]}
          onPress={() => setAddModalVisible(true)}
        >
          <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.fabGradient}>
            <Plus size={24} color="#5A5A5A" strokeWidth={2.5} />
          </LinearGradient>
        </Pressable>
      </View>

      <ConfirmModal
        {...confirmModal}
        onCancel={() => setConfirmModal((m) => ({ ...m, visible: false }))}
      />

      <AddUserModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onAdd={handleAddUser}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#5A5A5A',
  },
  container: {
    flex: 1,
    backgroundColor: '#5A5A5A',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#252525',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#30363D',
    margin: 16,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#252525',
    borderWidth: 1,
    borderColor: '#5A5A5A',
  },
  filterTabActive: {
    backgroundColor: '#F59E0B18',
    borderColor: '#F59E0B44',
  },
  filterTabText: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: '#E0E0E0',
  },
  filterTabTextActive: {
    color: '#F59E0B',
  },
  filterCount: {
    backgroundColor: '#5A5A5A',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  filterCountActive: {
    backgroundColor: '#F59E0B33',
  },
  filterCountText: {
    fontSize: 10,
    fontFamily: 'IBMPlexMono_700Bold',
    color: '#E0E0E0',
  },
  filterCountTextActive: {
    color: '#F59E0B',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  listDivider: {
    height: 1,
    backgroundColor: '#5A5A5A',
  },
  userItemWrap: {
    backgroundColor: '#252525',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#5A5A5A',
    overflow: 'hidden',
    marginBottom: 8,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  avatar: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'IBMPlexMono_700Bold',
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
  },
  userEmail: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#E0E0E0',
  },
  userRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  roleBadgeText: {
    fontSize: 9,
    fontFamily: 'IBMPlexMono_700Bold',
    letterSpacing: 0.8,
  },
  expandedActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#5A5A5A',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    borderRadius: 28,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#4B5563',
  },
  emptySubtext: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#374151',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
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
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    backgroundColor: '#5A5A5A',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
  },
  modalConfirmBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
  addInput: {
    backgroundColor: '#5A5A5A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#30363D',
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
  },
  roleToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#5A5A5A',
    borderRadius: 8,
    padding: 3,
    gap: 3,
  },
  roleToggleBtn: {
    flex: 1,
    height: 36,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleToggleBtnActive: {
    backgroundColor: '#10B98122',
    borderWidth: 1,
    borderColor: '#10B98144',
  },
  roleToggleBtnActiveRed: {
    backgroundColor: '#DC262622',
    borderWidth: 1,
    borderColor: '#DC262644',
  },
  roleToggleText: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: '#4B5563',
  },
  roleToggleTextActive: {
    color: '#10B981',
    fontFamily: 'Inter_600SemiBold',
  },
  roleToggleTextActiveRed: {
    color: '#DC2626',
    fontFamily: 'Inter_600SemiBold',
  },
  addError: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#EF4444',
  },
});
