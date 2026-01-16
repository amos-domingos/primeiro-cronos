
export enum AlarmType {
  WEEKLY = 'weekly',
  SHIFT = 'shift'
}

export type VibrationPattern = 'continuous' | 'heartbeat' | 'rapid' | 'staccato';

export interface AppSettings {
  batterySaver: boolean;
  disableWakeLock: boolean;
  lowFiUI: boolean;
  disableHaptics: boolean;
  volumeBoost: boolean;
  installDate?: number;
}

export interface Alarm {
  id: string;
  time: string;
  label: string;
  isEnabled: boolean;
  type: AlarmType;
  customDays: number[];
  date: string | null;
  intervalDays: number;
  durationSeconds: number;
  snoozeSeconds: number; 
  soundUri: string;
  soundName: string;
  volume: number; 
  fadeDurationSeconds: number; 
  vibrationEnabled: boolean;
  vibrationPattern: VibrationPattern;
  lastStoppedDate: string | null;
}
