# KEL TankIQ Mobile App

A professional tank monitoring app with real-time Firebase sensor data, role-based authentication, and an admin control panel.

## Features

### Authentication
- Firebase Email/Password authentication
- Role-based access: `user` and `admin`
- Auto-routing based on role on login
- Demo accounts pre-configured

### User Dashboard
- View own tanks (filtered by userId on sensor)
- Real-time level monitoring
- Tank history charts (8-hour)
- Personal alerts only
- Profile management

### Admin Control Panel
- System-wide statistics (total users, tanks, alerts)
- View ALL tanks across all users
- User management: create, edit, promote/demote, delete
- System alerts overview
- Quick actions panel

## Demo Accounts

| Role  | Email                    | Password  |
|-------|--------------------------|-----------|
| Admin | admin@keltankiq.com      | Admin123! |
| User  | user@keltankiq.com       | User123!  |

> These accounts must be created in Firebase Console (Authentication + Firestore) before they work.

## Setup

### Firebase Configuration
Set these env vars in the ENV tab:
```
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_DATABASE_URL=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
```

### Firebase Rules
Apply the Firestore rules from the auth guide to allow role-based access.

### Firestore User Document Structure
```
/users/{uid}
  uid: string
  email: string
  displayName: string
  role: 'user' | 'admin'
  company?: string
  phone?: string
  photoURL?: string
  createdAt: string (ISO)
  lastLogin: string (ISO)
  preferences: { emailAlerts, pushNotifications, units, language }
  subscription: { plan, tanksLimit }
```

## App Structure

```
mobile/src/app/
  _layout.tsx         - Root layout with auth gate
  login.tsx           - Login screen
  signup.tsx          - Registration screen
  (tabs)/
    _layout.tsx       - Tab bar (with Admin button for admins)
    index.tsx         - Tank dashboard (user-scoped)
    alerts.tsx        - Alerts (user-scoped)
    settings.tsx      - Settings + profile + logout
  admin/
    _layout.tsx       - Admin stack navigator
    index.tsx         - Admin control panel
    users.tsx         - User management
  tank-detail.tsx     - Tank detail view
```

## Technology Stack
- Expo 53 / React Native 0.79
- Expo Router (file-based routing)
- Firebase (Realtime DB + Auth + Firestore)
- Zustand (auth state)
- React Query (server state)
- NativeWind / TailwindCSS
- react-native-reanimated
