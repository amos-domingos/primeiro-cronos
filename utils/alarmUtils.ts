
import { Alarm, AlarmType } from '../types';

export const generateId = (): string => Math.random().toString(36).substr(2, 9);

export const checkAlarmCondition = (alarm: Alarm, now: Date): boolean => {
  if (!alarm.isEnabled) return false;

  const dayOfWeek = now.getDay(); 
  const dayOfMonth = now.getDate();
  const month = now.getMonth();
  const year = now.getFullYear();

  const getRefDateParts = (dateStr?: string) => {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split('-').map(Number);
    return { y, m: m - 1, d }; 
  };

  const ref = getRefDateParts(alarm.date);

  switch (alarm.type) {
    case AlarmType.DAILY:
      return true;
    case AlarmType.ODD_DAYS:
      // Dias ímpares: 1, 3, 5, 7, 9...
      return dayOfMonth % 2 !== 0;
    case AlarmType.EVEN_DAYS:
      // Dias pares: 2, 4, 6, 8, 10...
      return dayOfMonth % 2 === 0;
    case AlarmType.CUSTOM:
      return alarm.customDays.includes(dayOfWeek);
    case AlarmType.SHIFT:
      if (!ref || !alarm.intervalDays) return false;
      const startDate = new Date(ref.y, ref.m, ref.d);
      startDate.setHours(0,0,0,0);
      const currentDate = new Date(year, month, dayOfMonth);
      currentDate.setHours(0,0,0,0);
      const diffTime = currentDate.getTime() - startDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < 0) return false;
      return diffDays % alarm.intervalDays === 0;
    default:
      return false;
  }
};

export const getTimeUntilNextOccurrence = (alarm: Alarm): string => {
  const now = new Date();
  const [targetHours, targetMinutes] = alarm.time.split(':').map(Number);
  
  for (let i = 0; i <= 366; i++) {
    const testDate = new Date(now);
    testDate.setDate(now.getDate() + i);
    testDate.setHours(targetHours, targetMinutes, 0, 0);

    if (testDate.getTime() <= now.getTime()) continue;

    if (checkAlarmCondition(alarm, testDate)) {
      const diffMs = testDate.getTime() - now.getTime();
      const totalMinutes = Math.floor(diffMs / (1000 * 60));
      const days = Math.floor(totalMinutes / (60 * 24));
      const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
      const minutes = totalMinutes % 60;

      const parts = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0) parts.push(`${hours}h`);
      if (minutes > 0 || (days === 0 && hours === 0)) parts.push(`${minutes}m`);

      return parts.join(' ');
    }
  }
  return '---';
};

export const getNextOccurrenceText = (alarm: Alarm): string => {
  if (!alarm.isEnabled) return 'Desativado';
  
  switch (alarm.type) {
    case AlarmType.DAILY: return 'Diário';
    case AlarmType.ODD_DAYS: return 'Dias Ímpares';
    case AlarmType.EVEN_DAYS: return 'Dias Pares';
    case AlarmType.SHIFT: return `Plantão ${alarm.intervalDays}d`;
    case AlarmType.CUSTOM: 
      const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      if (alarm.customDays.length === 7) return 'Diário';
      return alarm.customDays.map(d => days[d]).join(', ');
    default: return 'Uma vez';
  }
};
