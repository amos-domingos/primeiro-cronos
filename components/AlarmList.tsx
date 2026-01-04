import React from 'react';
import { Alarm, AlarmType } from '../types';
import { getNextOccurrenceText } from '../utils/alarmUtils';
import { Trash2, Edit2, Clock, Music, Smartphone } from 'lucide-react';
import { Switch } from './ui/Switch';

interface AlarmListProps {
  alarms: Alarm[];
  onToggle: (id: string, enabled: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (alarm: Alarm) => void;
}

export const AlarmList: React.FC<AlarmListProps> = ({ alarms, onToggle, onDelete, onEdit }) => {
  if (alarms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <Clock size={48} className="mb-4 opacity-50" />
        <p className="text-lg">Nenhum alarme configurado</p>
      </div>
    );
  }

  const formatSecondsLabel = (s: number) => {
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const rs = s % 60;
    return rs > 0 ? `${m}m${rs}s` : `${m}m`;
  };

  return (
    <div className="grid gap-4 pb-24">
      {alarms.map((alarm) => (
        <div
          key={alarm.id}
          className={`relative group bg-surface border border-slate-700 rounded-2xl p-5 transition-all hover:border-slate-600 ${
            !alarm.isEnabled ? 'opacity-60 grayscale-[0.5]' : ''
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="cursor-pointer flex-1" onClick={() => onEdit(alarm)}>
              <div className="text-4xl font-mono font-medium text-white tracking-tighter">
                {alarm.time}
              </div>
              <div className="text-sm text-slate-400 mt-1 font-medium flex items-center gap-2">
                {alarm.label && <span className="text-white">{alarm.label} •</span>}
                <span>{getNextOccurrenceText(alarm)}</span>
              </div>
              <div className="text-xs text-slate-500 mt-3 flex flex-wrap gap-x-4 gap-y-1">
                 <span className={`flex items-center gap-1 ${alarm.snoozeEnabled ? 'text-emerald-400/80' : 'text-slate-600'}`}>
                   {alarm.snoozeEnabled ? `Soneca: ${formatSecondsLabel(alarm.snoozeSeconds)}` : 'Sem Soneca'}
                 </span>
                 <span className="text-slate-500">
                   Duração: {formatSecondsLabel(alarm.durationSeconds)}
                 </span>
                 <span className="flex items-center gap-1 text-primary/80">
                   <Music size={10} /> {alarm.soundName || 'Clássico'}
                 </span>
                 {(alarm.vibrationEnabled ?? true) && (
                   <span className="flex items-center gap-1 text-primary/80" title="Vibração Ativada">
                     <Smartphone size={10} />
                   </span>
                 )}
              </div>
            </div>

            <div className="flex items-center gap-4 pl-4">
              <Switch
                checked={alarm.isEnabled}
                onChange={(val) => onToggle(alarm.id, val)}
              />
            </div>
          </div>
          
          <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                  onClick={() => onEdit(alarm)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
              >
                  <Edit2 size={18} />
              </button>
              <button 
                  onClick={() => onDelete(alarm.id)}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg"
              >
                  <Trash2 size={18} />
              </button>
          </div>
        </div>
      ))}
    </div>
  );
};