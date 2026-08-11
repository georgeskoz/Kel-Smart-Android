import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getDatabase, ref, onValue, off, get, set, update, remove, Database } from 'firebase/database';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  deleteUser as deleteFirebaseUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendPasswordResetEmail,
  Auth,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tank, TankAlert, TankType, isTankMember } from './tankData';
import { UserProfile } from './state/authStore';

// Firebase config from EXPO_PUBLIC_* env vars
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export function isFirebaseConfigured(): boolean {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.databaseURL &&
    firebaseConfig.projectId &&
    firebaseConfig.apiKey !== 'undefined'
  );
}

let app: FirebaseApp | null = null;
let db: Database | null = null;
let auth: Auth | null = null;

function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured()) return null;
  if (app) return app;
  try {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig as any);
    } else {
      app = getApps()[0];
    }
    return app;
  } catch (e) {
    console.warn('[Firebase] Init failed:', e);
    return null;
  }
}

export function getFirebaseDB(): Database | null {
  if (!isFirebaseConfigured()) return null;
  if (db) return db;
  try {
    const firebaseApp = getFirebaseApp();
    if (!firebaseApp) return null;
    db = getDatabase(firebaseApp);
    return db;
  } catch (e) {
    console.warn('[Firebase] DB init failed:', e);
    return null;
  }
}

export function getFirebaseAuth(): Auth | null {
  if (!isFirebaseConfigured()) return null;
  if (auth) return auth;
  try {
    const firebaseApp = getFirebaseApp();
    if (!firebaseApp) return null;

    // initializeAuth and getReactNativePersistence are available at runtime in the
    // RN bundle of firebase/auth but not in its TS types — require them dynamically,
    // inside this try/catch so a resolution failure degrades to plain getAuth()
    // instead of crashing the app at import time.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { initializeAuth, getReactNativePersistence } = require('firebase/auth') as {
      initializeAuth: (app: FirebaseApp, opts: { persistence: unknown }) => Auth;
      getReactNativePersistence: (storage: unknown) => unknown;
    };

    try {
      auth = initializeAuth(firebaseApp, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } catch {
      // Auth already initialized (e.g. hot reload) — reuse existing instance
      auth = getAuth(firebaseApp);
    }
    return auth;
  } catch (e) {
    console.warn('[Firebase] Auth init failed:', e);
    try {
      const firebaseApp = getFirebaseApp();
      auth = firebaseApp ? getAuth(firebaseApp) : null;
    } catch {
      auth = null;
    }
    return auth;
  }
}

// ─── Auth functions ──────────────────────────────────────────────────────────

export async function signIn(
  email: string,
  password: string
): Promise<UserProfile> {
  const firebaseAuth = getFirebaseAuth();
  if (!firebaseAuth) throw new Error('Firebase not configured');

  const cred = await signInWithEmailAndPassword(firebaseAuth, email, password);
  const profile = await getUserProfile(cred.user.uid);

  if (!profile) {
    // Create a default profile if none exists
    const defaultProfile: UserProfile = {
      uid: cred.user.uid,
      email: cred.user.email ?? email,
      displayName: cred.user.displayName ?? email.split('@')[0],
      role: 'user',
    };
    await saveUserProfile(defaultProfile);
    return defaultProfile;
  }

  return profile;
}

export async function signOut(): Promise<void> {
  const firebaseAuth = getFirebaseAuth();
  if (!firebaseAuth) return;
  await firebaseSignOut(firebaseAuth);
}

export async function resetPassword(email: string): Promise<void> {
  const firebaseAuth = getFirebaseAuth();
  if (!firebaseAuth) throw new Error('Firebase not configured');
  await sendPasswordResetEmail(firebaseAuth, email);
}

export async function signUp(
  email: string,
  password: string,
  displayName: string
): Promise<UserProfile> {
  const firebaseAuth = getFirebaseAuth();
  if (!firebaseAuth) throw new Error('Firebase not configured');

  const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password);

  await updateProfile(cred.user, { displayName });

  const profile: UserProfile = {
    uid: cred.user.uid,
    email,
    displayName,
    role: 'user',
    createdAt: Date.now(),
  };

  await saveUserProfile(profile);
  return profile;
}

export function subscribeToAuthState(
  callback: (user: UserProfile | null) => void
): () => void {
  const firebaseAuth = getFirebaseAuth();
  if (!firebaseAuth) {
    callback(null);
    return () => {};
  }

  const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
    if (!firebaseUser) {
      callback(null);
      return;
    }

    try {
      const profile = await getUserProfile(firebaseUser.uid);
      if (profile) {
        callback(profile);
      } else {
        // Build minimal profile from auth user
        const defaultProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email ?? '',
          displayName: firebaseUser.displayName ?? firebaseUser.email?.split('@')[0] ?? '',
          role: 'user',
        };
        callback(defaultProfile);
      }
    } catch (e) {
      console.warn('[Firebase] Auth state fetch profile failed:', e);
      callback(null);
    }
  });

  return unsubscribe;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const database = getFirebaseDB();
    if (!database) return null;
    const userRef = ref(database, `users/${uid}`);
    const snap = await get(userRef);
    if (!snap.exists()) return null;
    const data = snap.val();
    return {
      uid,
      email: data.email ?? '',
      displayName: data.displayName ?? '',
      role: data.role ?? 'user',
      photoURL: data.photoURL,
      createdAt: data.createdAt,
      capacity: data.capacity || { maxSensors: 99 },
    };
  } catch (e) {
    console.warn('[Firebase] getUserProfile failed:', e);
    return null;
  }
}

async function saveUserProfile(profile: UserProfile): Promise<void> {
  try {
    const database = getFirebaseDB();
    if (!database) return;
    const userRef = ref(database, `users/${profile.uid}`);
    await set(userRef, {
      ...profile,
      createdAt: profile.createdAt ?? Date.now(),
    });
  } catch (e) {
    console.warn('[Firebase] saveUserProfile failed:', e);
  }
}

export async function updateUserProfile(
  uid: string,
  data: Partial<UserProfile>
): Promise<void> {
  try {
    const database = getFirebaseDB();
    if (!database) return;
    const userRef = ref(database, `users/${uid}`);
    await update(userRef, data as any);
  } catch (e) {
    console.warn('[Firebase] updateUserProfile failed:', e);
    throw e;
  }
}

export async function deleteAccount(password?: string): Promise<void> {
  const firebaseAuth = getFirebaseAuth();
  const database = getFirebaseDB();
  if (!firebaseAuth) throw new Error('Firebase not configured');
  const currentUser = firebaseAuth.currentUser;
  if (!currentUser) throw new Error('No user logged in');

  // Re-authenticate if password is provided (required after a long session)
  if (password && currentUser.email) {
    const credential = EmailAuthProvider.credential(currentUser.email, password);
    await reauthenticateWithCredential(currentUser, credential);
  }

  // Delete user data from Realtime Database
  if (database) {
    try {
      const userRef = ref(database, `users/${currentUser.uid}`);
      await remove(userRef);
    } catch (e) {
      console.warn('[Firebase] deleteAccount - failed to delete user data:', e);
    }
  }

  // Delete the Firebase Auth account
  await deleteFirebaseUser(currentUser);
}

// ─── Admin functions ──────────────────────────────────────────────────────────

export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const database = getFirebaseDB();
    if (!database) return [];
    const usersRef = ref(database, 'users');
    const snap = await get(usersRef);
    if (!snap.exists()) return [];
    const val = snap.val();
    return Object.entries(val).map(([uid, data]: [string, any]) => ({
      uid,
      email: (data as any).email ?? '',
      displayName: (data as any).displayName ?? '',
      role: (data as any).role ?? 'user',
      photoURL: (data as any).photoURL,
      createdAt: (data as any).createdAt,
      capacity: (data as any).capacity || { maxSensors: 99 },
    } as UserProfile));
  } catch (e) {
    console.warn('[Firebase] getAllUsers failed:', e);
    return [];
  }
}

export async function getAllTanks(): Promise<Tank[]> {
  const database = getFirebaseDB();
  if (!database) return [];

  return new Promise((resolve) => {
    const sensorsRef = ref(database, 'sensors');
    onValue(
      sensorsRef,
      (snap) => {
        const val = snap.val();
        if (!val) {
          resolve([]);
          return;
        }
        const tanks = Object.entries(val).map(([id, raw]) => parseSensor(id, raw));
        resolve(tanks);
      },
      { onlyOnce: true }
    );
  });
}

export async function updateUserRole(
  uid: string,
  role: 'user' | 'admin'
): Promise<void> {
  const database = getFirebaseDB();
  if (!database) throw new Error('Firebase not configured');
  const userRef = ref(database, `users/${uid}`);
  await update(userRef, { role });
}

export async function deleteUser(uid: string): Promise<void> {
  const database = getFirebaseDB();
  if (!database) throw new Error('Firebase not configured');
  const userRef = ref(database, `users/${uid}`);
  await remove(userRef);
}

export async function createUser(
  email: string,
  password: string,
  displayName: string,
  role: 'user' | 'admin'
): Promise<UserProfile> {
  const firebaseAuth = getFirebaseAuth();
  if (!firebaseAuth) throw new Error('Firebase not configured');

  const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password);
  await updateProfile(cred.user, { displayName });

  const profile: UserProfile = {
    uid: cred.user.uid,
    email,
    displayName,
    role,
    createdAt: Date.now(),
  };

  await saveUserProfile(profile);
  return profile;
}

// ─── User-scoped subscriptions ───────────────────────────────────────────────

export function subscribeUserTanks(
  userId: string,
  isAdmin: boolean,
  onData: (tanks: Tank[]) => void,
  onConnected: (connected: boolean) => void
): () => void {
  const database = getFirebaseDB();
  if (!database) {
    onConnected(false);
    return () => {};
  }

  const sensorsRef = ref(database, 'sensors');
  const connectedRef = ref(database, '.info/connected');

  const connectedUnsub = onValue(connectedRef, (snap) => {
    onConnected(snap.val() === true);
  });

  const dataUnsub = onValue(
    sensorsRef,
    (snap) => {
      const val = snap.val();
      if (!val) {
        onData([]);
        return;
      }
      const all = Object.entries(val)
        .filter(([, raw]: [string, any]) => !raw.hidden)
        .map(([id, raw]) => parseSensor(id, raw));
      if (isAdmin) {
        onData(all);
      } else {
        // Only show tanks this user is a member of
        const filtered = all.filter((t) => isTankMember(t, userId));
        onData(filtered);
      }
    },
    (err) => {
      console.warn('[Firebase] Sensors error:', err);
      onConnected(false);
    }
  );

  return () => {
    off(sensorsRef);
    off(connectedRef);
  };
}

export async function addOrJoinTank(
  sensorId: string,
  fields: {
    name: string;
    type: TankType;
    capacity: number;
    lowAlert: number;
    highAlert: number;
    criticalAlert: number;
  },
  uid: string
): Promise<'created' | 'joined'> {
  const database = getFirebaseDB();
  if (!database) throw new Error('Firebase not configured');

  // Read only the members map, not the full sensor object — a user who isn't
  // a member yet can't read the full tank (name/capacity/alerts), but the
  // members map itself is readable by any signed-in user precisely so this
  // existence/capacity check works for someone who hasn't joined yet.
  const sensorRef = ref(database, `sensors/${sensorId}`);
  const membersRef = ref(database, `sensors/${sensorId}/members`);
  const membersSnap = await get(membersRef);

  if (membersSnap.exists()) {
    const members = membersSnap.val() || {};
    if (members[uid]) {
      return 'joined';
    }

    const memberCountSnap = await get(ref(database, `sensors/${sensorId}/memberCount`));
    const currentCount =
      typeof memberCountSnap.val() === 'number' ? memberCountSnap.val() : Object.keys(members).length;
    if (currentCount >= 3) {
      throw new Error('TANK_FULL');
    }

    // Tank already exists — join as an equal member without touching its config,
    // since the joining household member's own form values may not match what's
    // already configured (name, capacity, alert thresholds, etc.). members and
    // memberCount must move together in one atomic write — the rules require it.
    await update(sensorRef, {
      [`members/${uid}`]: true,
      memberCount: currentCount + 1,
    });
    return 'joined';
  }

  await set(sensorRef, {
    ...fields,
    members: { [uid]: true },
    memberCount: 1,
  });
  return 'created';
}

export async function leaveTank(sensorId: string, uid: string): Promise<void> {
  const database = getFirebaseDB();
  if (!database) throw new Error('Firebase not configured');

  const membersSnap = await get(ref(database, `sensors/${sensorId}/members`));
  const members = membersSnap.val() || {};
  const remaining = Object.keys(members).filter((m) => m !== uid);

  if (remaining.length === 0) {
    // Last member leaving — archive it the same way single-owner deletion worked before
    await update(ref(database, `sensors/${sensorId}`), { hidden: true, members: null, memberCount: null });
  } else {
    await update(ref(database, `sensors/${sensorId}`), {
      [`members/${uid}`]: null,
      memberCount: remaining.length,
    });
  }
}

// ─── Original subscriptions (kept for backwards compat) ──────────────────────

// Convert raw Firebase sensor data to Tank type
function parseSensor(id: string, raw: any): Tank {
  const type = (raw.type as TankType) || 'Other';
  const level = typeof raw.level === 'number' ? Math.round(raw.level) : 0;
  const signal = typeof raw.signal === 'number' ? raw.signal : 0;
  const ts = raw.timestamp ? new Date(raw.timestamp) : new Date();
  const isOnline = raw.status !== 'offline' && (Date.now() - ts.getTime()) < 60000;

  return {
    id,
    name: raw.name || id,
    type,
    level,
    capacity: raw.capacity || 1000,
    sensorId: id,
    lowAlert: typeof raw.lowAlert === 'number' ? raw.lowAlert : 20,
    highAlert: typeof raw.highAlert === 'number' ? raw.highAlert : 90,
    criticalAlert: typeof raw.criticalAlert === 'number' ? raw.criticalAlert : Math.round((typeof raw.lowAlert === 'number' ? raw.lowAlert : 20) * 0.6),
    lastUpdated: ts,
    signalStrength: signal,
    online: isOnline,
    members: raw.members || undefined,
  };
}

// Convert raw Firebase alert data to TankAlert type
function parseAlert(id: string, raw: any): TankAlert {
  const severity = raw.severity as 'critical' | 'low' | 'high' | 'offline';
  const type: TankAlert['type'] = severity || 'low';

  return {
    id,
    tankId: raw.tankId || '',
    tankName: raw.tankName || raw.tankId || '',
    type,
    level: typeof raw.level === 'number' ? raw.level : 0,
    timestamp: raw.timestamp ? new Date(raw.timestamp) : new Date(),
    message: raw.message || `${raw.tankName}: ${severity} alert`,
  };
}

// Subscribe to all sensors
export function subscribeSensors(
  onData: (tanks: Tank[]) => void,
  onConnected: (connected: boolean) => void
): () => void {
  const database = getFirebaseDB();
  if (!database) {
    onConnected(false);
    return () => {};
  }

  const sensorsRef = ref(database, 'sensors');
  const connectedRef = ref(database, '.info/connected');

  const connectedUnsubscribe = onValue(connectedRef, (snap) => {
    onConnected(snap.val() === true);
  });

  const dataUnsubscribe = onValue(sensorsRef, (snap) => {
    const val = snap.val();
    if (!val) {
      onData([]);
      return;
    }
    const tanks = Object.entries(val)
      .filter(([, raw]: [string, any]) => !raw.hidden)
      .map(([id, raw]) => parseSensor(id, raw));
    onData(tanks);
  }, (err) => {
    console.warn('[Firebase] Sensors error:', err);
    onConnected(false);
  });

  return () => {
    off(sensorsRef);
    off(connectedRef);
  };
}

// Subscribe to alerts (latest 20)
export function subscribeAlerts(
  onData: (alerts: TankAlert[]) => void
): () => void {
  const database = getFirebaseDB();
  if (!database) return () => {};

  const alertsRef = ref(database, 'alerts');

  onValue(alertsRef, (snap) => {
    const val = snap.val();
    if (!val) {
      onData([]);
      return;
    }
    const alerts = Object.entries(val)
      .map(([id, raw]) => parseAlert(id, raw))
      .filter((a) => !['restored'].includes(a.type))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 20);
    onData(alerts);
  });

  return () => {
    off(alertsRef);
  };
}

// Subscribe to a single sensor's history (last 8 hours)
export function subscribeHistory(
  tankId: string,
  onData: (points: { level: number; timestamp: Date }[]) => void
): () => void {
  const database = getFirebaseDB();
  if (!database) return () => {};

  const histRef = ref(database, `history/${tankId}`);
  const cutoff = Date.now() - 8 * 60 * 60 * 1000;

  onValue(histRef, (snap) => {
    const val = snap.val();
    if (!val) {
      onData([]);
      return;
    }
    const points = Object.values(val as Record<string, any>)
      .filter((p: any) => {
        if (!p.timestamp) return false;
        const ts = typeof p.timestamp === 'string' ? new Date(p.timestamp).getTime() : Number(p.timestamp);
        return ts > cutoff;
      })
      .map((p: any) => ({ level: p.level, timestamp: new Date(p.timestamp) }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    onData(points);
  });

  return () => {
    off(histRef);
  };
}
