
import { Alarm, AlarmType } from '../types';

export const generateId = (): string => Math.random().toString(36).substr(2, 9);

export const checkAlarmCondition = (alarm: Alarm, now: Date): boolean => {
  if (!alarm.isEnabled) return false;

  if (alarm.type === AlarmType.WEEKLY) {
    return alarm.customDays.includes(now.getDay());
  }

  if (alarm.type === AlarmType.SHIFT && alarm.date) {
    const startDate = new Date(alarm.date + 'T00:00:00');
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const diffTime = today.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return false;
    return diffDays % alarm.intervalDays === 0;
  }

  return false;
};

export const getNextOccurrenceText = (alarm: Alarm): string => {
  if (!alarm.isEnabled) return 'Desativado';
  
  if (alarm.type === AlarmType.WEEKLY) {
    if (alarm.customDays.length === 7) return 'Todos os dias';
    if (alarm.customDays.length === 0) return 'Nenhum dia';
    const daysMap = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return alarm.customDays.sort().map(d => daysMap[d]).join(', ');
  }

  if (alarm.type === AlarmType.SHIFT && alarm.date) {
    return `Escala: a cada ${alarm.intervalDays} dias`;
  }

  return 'Configuração pendente';
};
