
import React from 'react';
import { Alarm } from '../types';
import { getNextOccurrenceText } from '../utils/alarmUtils';
import { Trash2, Clock, Music, Calendar } from 'lucide-react';
import { Switch } from './ui/Switch';

interface AlarmListProps {
  alarms: Alarm[];
  lastSavedId?: string | null;
  onToggle: (id: string, enabled: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (alarm: Alarm) => void;
}

export const AlarmList: React.FC<AlarmListProps> = ({ alarms, lastSavedId, onToggle, onDelete, onEdit }) => {
  if (alarms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-500 animate-in fade-in zoom-in duration-700">
        <div className="w-24 h-24 bg-white/5 rounded-[40px] flex items-center justify-center mb-8 rotate-12">
           <Clock size={40} className="opacity-20 text-indigo-500" />
        </div>
        <p className="text-sm font-black uppercase tracking-[0.4em] opacity-40">Sem Alarmes Definidos</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {alarms.map((alarm) => (
        <div
          key={alarm.id}
          onClick={() => onEdit(alarm)}
          className={`group relative rounded-[38px] p-7 transition-all duration-500 cursor-pointer overflow-hidden ${
            !alarm.isEnabled 
              ? 'bg-slate-900/30 border border-transparent opacity-50 grayscale' 
              : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-indigo-500/30 shadow-2xl'
          } ${lastSavedId === alarm.id ? 'ring-2 ring-indigo-500 ring-offset-4 ring-offset-[#020617]' : ''}`}
        >
          {alarm.isEnabled && (
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 blur-[40px] rounded-full -mr-10 -mt-10" />
          )}

          <div className="flex items-start justify-between relative z-10">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${alarm.isEnabled ? 'text-indigo-400' : 'text-slate-500'}`}>
                  {alarm.label || 'Alarme'}
                </span>
                {alarm.isEnabled && (
                   <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                )}
              </div>
              
              <div className={`text-6xl font-mono font-bold tracking-tighter transition-colors ${alarm.isEnabled ? 'text-white' : 'text-slate-600'}`}>
                {alarm.time}
              </div>
              
              <div className="mt-5 flex flex-wrap items-center gap-3">
                 <div className="px-4 py-1.5 bg-white/5 rounded-full text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                    <Calendar size={10} className="text-indigo-500" />
                    {getNextOccurrenceText(alarm)}
                 </div>
                 {alarm.isEnabled && alarm.date && (
                   <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Início: {new Date(alarm.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                   </div>
                 )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-8" onClick={(e) => e.stopPropagation()}>
              <Switch
                checked={alarm.isEnabled}
                onChange={(val) => onToggle(alarm.id, val)}
              />
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(alarm.id); }}
                className="p-3 text-slate-700 hover:text-red-500 transition-colors rounded-2xl hover:bg-red-500/10"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
