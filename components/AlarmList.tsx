import React from 'react';
import { Alarm } from '../types';
import { getNextOccurrenceText } from '../utils/alarmUtils';
import { Trash2, Clock, Music, ChevronRight } from 'lucide-react';
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
      <div className="flex flex-col items-center justify-center py-32 text-slate-500">
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
           <Clock size={32} className="opacity-20" />
        </div>
        <p className="text-xs font-black uppercase tracking-[0.2em] opacity-30">Nenhum alarme definido</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {alarms.map((alarm) => (
        <div
          key={alarm.id}
          onClick={() => onEdit(alarm)}
          className={`group relative glass rounded-[40px] p-8 transition-all active:scale-[0.97] cursor-pointer ${
            !alarm.isEnabled ? 'opacity-30' : 'active-glow border-white/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <span className="text-[10px] font-black uppercase text-primary tracking-[0.2em] mb-2 block">
                {alarm.label || 'DESPERTAR'}
              </span>
              
              <div className="text-6xl font-mono font-bold tracking-tighter leading-none mb-6">
                {alarm.time}
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                 <div className="px-4 py-1.5 bg-white/5 rounded-full border border-white/5 text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                    {getNextOccurrenceText(alarm)}
                 </div>
                 <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <Music size={12} /> {alarm.soundName}
                 </div>
              </div>
            </div>

            <div className="flex flex-col items-end justify-between h-full gap-8" onClick={(e) => e.stopPropagation()}>
              <Switch
                checked={alarm.isEnabled}
                onChange={(val) => onToggle(alarm.id, val)}
              />
              <button 
                onClick={() => onDelete(alarm.id)}
                className="p-3 text-slate-600 hover:text-red-400 transition-colors"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
          
          <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
             <ChevronRight size={24} className="text-white/20" />
          </div>
        </div>
      ))}
    </div>
  );
};