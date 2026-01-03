import { Alarm, AlarmType } from '../types';

export const generateId = (): string => Math.random().toString(36).substr(2, 9);

export const checkAlarmCondition = (alarm: Alarm, now: Date): boolean => {
  if (!alarm.isEnabled) return false;

  const dayOfWeek = now.getDay(); // 0-6
  const dayOfMonth = now.getDate(); // 1-31
  const month = now.getMonth(); // 0-11
  const year = now.getFullYear();

  // Helper to parse reference date "YYYY-MM-DD" ensuring local timezone handling
  const getRefDateParts = (dateStr?: string) => {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split('-').map(Number);
    return { y, m: m - 1, d }; // Month is 0-indexed in JS Date
  };

  const ref = getRefDateParts(alarm.date);

  switch (alarm.type) {
    case AlarmType.ONCE:
      // If no date set, assume it runs today/tomorrow logic (standard handled by time check)
      // If date is set, strictly check date
      if (!ref) return true;
      return ref.d === dayOfMonth && ref.m === month && ref.y === year;

    case AlarmType.DAILY:
      return true;

    case AlarmType.WEEKDAYS:
      return dayOfWeek >= 1 && dayOfWeek <= 5;

    case AlarmType.WEEKENDS:
      return dayOfWeek === 0 || dayOfWeek === 6;

    case AlarmType.ODD_DAYS:
      return dayOfMonth % 2 !== 0;

    case AlarmType.EVEN_DAYS:
      return dayOfMonth % 2 === 0;

    case AlarmType.WEEKLY:
      if (!ref) return false;
      // Check if today is the same day of week as the reference date
      const refDateObj = new Date(ref.y, ref.m, ref.d);
      return dayOfWeek === refDateObj.getDay();

    case AlarmType.MONTHLY:
      if (!ref) return false;
      // Check if today is the same day of month
      return dayOfMonth === ref.d;

    case AlarmType.YEARLY:
      if (!ref) return false;
      // Check if today is same day and month
      return dayOfMonth === ref.d && month === ref.m;

    case AlarmType.CUSTOM:
      return alarm.customDays.includes(dayOfWeek);
      
    default:
      return false;
  }
};

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

export const getNextOccurrenceText = (alarm: Alarm): string => {
  if (!alarm.isEnabled) return 'Desativado';
  
  const formatDateBR = (isoDate?: string) => {
    if (!isoDate) return '';
    const [y, m, d] = isoDate.split('-');
    return `${d}/${m}`;
  };

  switch (alarm.type) {
    case AlarmType.DAILY: return 'Diariamente';
    case AlarmType.ONCE: return alarm.date ? `Em ${formatDateBR(alarm.date)}` : 'Uma vez';
    case AlarmType.WEEKDAYS: return 'Dias de semana';
    case AlarmType.WEEKENDS: return 'Fins de semana';
    case AlarmType.ODD_DAYS: return 'Dias ímpares';
    case AlarmType.EVEN_DAYS: return 'Dias pares';
    case AlarmType.WEEKLY: return alarm.date ? `Semanal (ref: ${formatDateBR(alarm.date)})` : 'Semanalmente';
    case AlarmType.MONTHLY: return alarm.date ? `Todo dia ${alarm.date.split('-')[2]}` : 'Mensalmente';
    case AlarmType.YEARLY: return alarm.date ? `Todo ${formatDateBR(alarm.date)}` : 'Anualmente';
    case AlarmType.CUSTOM: 
      const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      if (alarm.customDays.length === 7) return 'Diariamente';
      if (alarm.customDays.length === 0) return 'Nunca';
      return alarm.customDays.map(d => days[d]).join(', ');
    default: return '';
  }
};