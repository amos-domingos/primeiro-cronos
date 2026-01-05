import { Alarm, AlarmType } from '../types';

export const generateId = (): string => Math.random().toString(36).substr(2, 9);

export const checkAlarmCondition = (alarm: Alarm, now: Date): boolean => {
  if (!alarm.isEnabled) return false;

  const dayOfWeek = now.getDay(); // 0-6
  const dayOfMonth = now.getDate(); // 1-31
  const month = now.getMonth(); // 0-11
  const year = now.getFullYear();

  const getRefDateParts = (dateStr?: string) => {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split('-').map(Number);
    return { y, m: m - 1, d }; 
  };

  const ref = getRefDateParts(alarm.date);

  switch (alarm.type) {
    case AlarmType.ONCE:
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
      const refDateObj = new Date(ref.y, ref.m, ref.d);
      return dayOfWeek === refDateObj.getDay();
    case AlarmType.MONTHLY:
      if (!ref) return false;
      return dayOfMonth === ref.d;
    case AlarmType.YEARLY:
      if (!ref) return false;
      return dayOfMonth === ref.d && month === ref.m;
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
      if (days > 0) parts.push(`${days} ${days === 1 ? 'dia' : 'dias'}`);
      if (hours > 0) parts.push(`${hours} ${hours === 1 ? 'hora' : 'horas'}`);
      if (minutes > 0 || (days === 0 && hours === 0)) {
         parts.push(`${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`);
      }

      if (parts.length === 0) return 'menos de um minuto';
      if (parts.length === 1) return parts[0];
      const lastPart = parts.pop();
      return `${parts.join(', ')} e ${lastPart}`;
    }
  }
  return 'muito tempo';
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
    case AlarmType.SHIFT: return `Escala (${alarm.intervalDays} em ${alarm.intervalDays} dias)`;
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