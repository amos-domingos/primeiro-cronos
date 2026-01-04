export enum AlarmType {
  ONCE = 'once',
  DAILY = 'daily',
  WEEKDAYS = 'weekdays',
  WEEKENDS = 'weekends',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  ODD_DAYS = 'odd_days',
  EVEN_DAYS = 'even_days',
  CUSTOM = 'custom'
}

export type VibrationPattern = 'continuous' | 'heartbeat' | 'rapid' | 'staccato';

export interface Alarm {
  id: string;
  time: string; // Format "HH:mm"
  date?: string; // Format "YYYY-MM-DD"
  label: string;
  isEnabled: boolean;
  type: AlarmType;
  customDays: number[]; // 0 (Sunday) - 6 (Saturday)
  
  // Settings
  durationSeconds: number;
  snoozeEnabled: boolean;
  snoozeSeconds: number;
  
  // Sound Settings
  soundUri: string;
  soundName: string;
  volume: number; // 0 to 1
  fadeDurationSeconds: number; // 0 to 60
  
  // Vibration Settings
  vibrationEnabled: boolean;
  vibrationPattern: VibrationPattern;

  // Internal state
  lastStoppedDate: string | null;
}

export interface SnoozeSession {
  alarmId: string;
  snoozeUntil: number;
}