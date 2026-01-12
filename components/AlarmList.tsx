
import React from 'react';
import { Alarm } from '../types';
import { getNextOccurrenceText } from '../utils/alarmUtils';
import { Trash2, Clock, Music, ChevronRight } from 'lucide-react';
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
      <div className="flex flex-col items-center justify-center py-32 text-slate-500 animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-white/5 rounded-[40px] flex items-center justify-center mb-8 rotate-12">
           <Clock size={40} className="opacity-20" />
        </div>
        <p className="text-sm font-black uppercase tracking-[0.3em] opacity-40">Nenhum Alarme</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {alarms.map((alarm) => (
        <div
          key={alarm.id}
          onClick={() => onEdit(alarm)}
          className={`group relative rounded-[32px] p-6 transition-all duration-300 cursor-pointer ${
            !alarm.isEnabled 
              ? 'bg-slate-900/40 border border-transparent opacity-60' 
              : 'bg-white/5 border border-white/10 hover:bg-white/10 shadow-lg'
          } ${lastSavedId === alarm.id ? 'ring-2 ring-primary ring-offset-4 ring-offset-[#020617]' : ''}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-black uppercase tracking-widest ${alarm.isEnabled ? 'text-primary' : 'text-slate-500'}`}>
                  {alarm.label || 'Despertar'}
                </span>
              </div>
              
              <div className={`text-5xl font-mono font-bold tracking-tighter transition-colors ${alarm.isEnabled ? 'text-white' : 'text-slate-600'}`}>
                {alarm.time}
              </div>
              
              <div className="mt-4 flex flex-wrap items-center gap-2">
                 <div className="px-3 py-1 bg-white/5 rounded-xl text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {getNextOccurrenceText(alarm)}
                 </div>
                 {alarm.isEnabled && (
                   <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary/70 uppercase tracking-wider">
                      <Music size={12} /> {alarm.soundName}
                   </div>
                 )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-6" onClick={(e) => e.stopPropagation()}>
              <Switch
                checked={alarm.isEnabled}
                onChange={(val) => onToggle(alarm.id, val)}
              />
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(alarm.id); }}
                className="p-2 text-slate-600 hover:text-red-400 transition-colors rounded-full hover:bg-red-400/10"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
