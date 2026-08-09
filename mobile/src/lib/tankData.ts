export type TankType = 'Water' | 'Diesel' | 'Oil' | 'Gasoline' | 'Other';

export type TankStatus = 'Normal' | 'Low' | 'Critical' | 'Offline' | 'High';

export interface Tank {
  id: string;
  name: string;
  type: TankType;
  level: number;
  capacity: number;
  sensorId: string;
  lowAlert: number;
  highAlert: number;
  criticalAlert: number;
  lastUpdated: Date;
  signalStrength: number;
  online: boolean;
  members?: Record<string, true>;
}

export function isTankMember(tank: Pick<Tank, 'members'>, uid: string): boolean {
  return !!tank.members?.[uid];
}

export interface TankAlert {
  id: string;
  tankId: string;
  tankName: string;
  type: 'low' | 'critical' | 'high' | 'offline' | 'restored';
  level: number;
  timestamp: Date;
  message: string;
}

export const MOCK_TANKS: Tank[] = [
  {
    id: '1',
    name: 'Main Water Tank',
    type: 'Water',
    level: 75,
    capacity: 5000,
    sensorId: 'water_main_001',
    lowAlert: 20,
    highAlert: 90,
    criticalAlert: Math.round(20 * 0.6),
    lastUpdated: new Date(),
    signalStrength: -65,
    online: true,
  },
  {
    id: '2',
    name: 'Diesel Generator',
    type: 'Diesel',
    level: 23,
    capacity: 2000,
    sensorId: 'diesel_gen_001',
    lowAlert: 25,
    highAlert: 95,
    criticalAlert: Math.round(25 * 0.6),
    lastUpdated: new Date(Date.now() - 30000),
    signalStrength: -78,
    online: true,
  },
  {
    id: '3',
    name: 'Backup Oil Reserve',
    type: 'Oil',
    level: 91,
    capacity: 3000,
    sensorId: 'oil_backup_001',
    lowAlert: 10,
    highAlert: 90,
    criticalAlert: Math.round(10 * 0.6),
    lastUpdated: new Date(Date.now() - 120000),
    signalStrength: -82,
    online: true,
  },
  {
    id: '4',
    name: 'Fuel Storage',
    type: 'Gasoline',
    level: 8,
    capacity: 1500,
    sensorId: 'fuel_001',
    lowAlert: 15,
    highAlert: 95,
    criticalAlert: Math.round(15 * 0.6),
    lastUpdated: new Date(Date.now() - 600000),
    signalStrength: 0,
    online: false,
  },
];

export const MOCK_ALERTS: TankAlert[] = [
  {
    id: 'a1',
    tankId: '4',
    tankName: 'Fuel Storage',
    type: 'offline',
    level: 8,
    timestamp: new Date(Date.now() - 600000),
    message: 'Sensor offline - no data received for 10 minutes',
  },
  {
    id: 'a2',
    tankId: '4',
    tankName: 'Fuel Storage',
    type: 'critical',
    level: 8,
    timestamp: new Date(Date.now() - 900000),
    message: 'Critical: Level below 15% threshold',
  },
  {
    id: 'a3',
    tankId: '2',
    tankName: 'Diesel Generator',
    type: 'low',
    level: 23,
    timestamp: new Date(Date.now() - 3600000),
    message: 'Warning: Level below 25% threshold',
  },
  {
    id: 'a4',
    tankId: '3',
    tankName: 'Backup Oil Reserve',
    type: 'high',
    level: 91,
    timestamp: new Date(Date.now() - 7200000),
    message: 'High: Level exceeded 90% threshold',
  },
  {
    id: 'a5',
    tankId: '1',
    tankName: 'Main Water Tank',
    type: 'restored',
    level: 75,
    timestamp: new Date(Date.now() - 10800000),
    message: 'Connection restored - sensor back online',
  },
];

export function getTankStatus(tank: Tank): TankStatus {
  if (!tank.online) return 'Offline';
  if (tank.level <= (tank.criticalAlert ?? Math.round(tank.lowAlert * 0.6))) return 'Critical';
  if (tank.level <= tank.lowAlert) return 'Low';
  if (tank.level >= tank.highAlert) return 'High';
  return 'Normal';
}

export function getTankTypeColor(type: TankType): string {
  switch (type) {
    case 'Water':
      return '#3B82F6';
    case 'Diesel':
      return '#F97316';
    case 'Oil':
      return '#A855F7';
    case 'Gasoline':
      return '#EAB308';
    case 'Other':
      return '#6B7280';
  }
}

export function getStatusColor(status: TankStatus): string {
  switch (status) {
    case 'Normal':
      return '#10B981';
    case 'Low':
      return '#F59E0B';
    case 'Critical':
      return '#EF4444';
    case 'High':
      return '#F59E0B';
    case 'Offline':
      return '#6B7280';
  }
}

export function getFillColor(level: number): string {
  if (level <= 15) return '#EF4444';
  if (level <= 25) return '#F59E0B';
  return '#10B981';
}

export function formatVolume(level: number, capacity: number): string {
  const volume = Math.round((level / 100) * capacity);
  return volume.toLocaleString();
}

export function getSignalBars(strength: number): number {
  if (strength === 0) return 0;
  if (strength >= -60) return 4;
  if (strength >= -70) return 3;
  if (strength >= -80) return 2;
  return 1;
}

export function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
