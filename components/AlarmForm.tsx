
import React, { useState, useRef, useEffect } from 'react';
import { Alarm, AlarmType } from '../types';
import { generateId } from '../utils/alarmUtils';
import { X, Music, Smartphone, Lock, Upload, Tag, Calendar, Bell, ChevronDown, ChevronUp } from 'lucide-react';
import { audioStorageService } from '../services/audioStorageService';

interface SystemSound {
  name: string;
  uri: string;
}

interface AlarmFormProps {
  initialData?: Alarm | null;
  isPremium: boolean;
  onSave: (alarm: Alarm) => void;
  onCancel: () => void;
}

export const AlarmForm: React.FC<AlarmFormProps> = ({ initialData, isPremium, onSave, onCancel }) => {
  const [type, setType] = useState<AlarmType>(initialData?.type || AlarmType.WEEKLY);
  const [time, setTime] = useState(initialData?.time || '07:00');
  const [label, setLabel] = useState(initialData?.label || '');
  const [customDays, setCustomDays] = useState<number[]>(initialData?.customDays || [1, 2, 3, 4, 5]);
  const [startDate, setStartDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [interval, setInterval] = useState(initialData?.intervalDays || 2);
  const [duration, setDuration] = useState(initialData?.durationSeconds ?? 30);
  const [snooze, setSnooze] = useState(initialData ? Math.floor(initialData.snoozeSeconds / 60) : 5);
  const [sound, setSound] = useState({ uri: initialData?.soundUri || 'classic', name: initialData?.soundName || 'Padrão' });
  const [systemSounds, setSystemSounds] = useState<SystemSound[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSoundList, setShowSoundList] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const weekDays = [
    { label: 'D', value: 0 }, { label: 'S', value: 1 }, { label: 'T', value: 2 },
    { label: 'Q', value: 3 }, { label: 'Q', value: 4 }, { label: 'S', value: 5 }, { label: 'S', value: 6 },
  ];

  useEffect(() => {
    if ((window as any).AndroidAlarm?.getSystemRingtones) {
      (window as any).AndroidAlarm.getSystemRingtones();
    }

    const handleRingtonesLoaded = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) setSystemSounds(e.detail);
    };

    window.addEventListener('systemRingtonesLoaded', handleRingtonesLoaded);
    return () => window.removeEventListener('systemRingtonesLoaded', handleRingtonesLoaded);
  }, []);

  const toggleDay = (day: number) => {
    setType(AlarmType.WEEKLY);
    if (customDays.includes(day)) {
      setCustomDays(customDays.filter(d => d !== day));
    } else {
      setCustomDays([...customDays, day]);
    }
  };

  const selectShift = (days: number) => {
    if (!isPremium) return;
    setInterval(days);
    setType(AlarmType.SHIFT);
    setShowDatePicker(true);
  };

  const applyPresetWeek = (preset: string) => {
    setType(AlarmType.WEEKLY);
    if (preset === '5x2') setCustomDays([1, 2, 3, 4, 5]);
    else if (preset === '6x1') setCustomDays([1, 2, 3, 4, 5, 6]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const id = `custom_${Date.now()}`;
      await audioStorageService.saveSound(id, file);
      setSound({ uri: id, name: file.name.substring(0, 20) });
      setShowSoundList(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: initialData?.id || generateId(),
      time,
      label: label || 'Novo Alarme',
      isEnabled: true,
      type,
      customDays,
      date: type === AlarmType.SHIFT ? startDate : null,
      intervalDays: interval,
      durationSeconds: duration,
      snoozeSeconds: snooze * 60,
      soundUri: sound.uri,
      soundName: sound.name,
      volume: 1.0,
      fadeDurationSeconds: 0,
      vibrationEnabled: true,
      vibrationPattern: 'continuous',
      lastStoppedDate: null
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
      <form onSubmit={handleSubmit} className="bg-[#0b0f1a] w-full max-w-lg rounded-t-[40px] border-t border-white/10 p-8 space-y-6 shadow-2xl overflow-y-auto max-h-[95vh] scrollbar-hide">
        
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <h2 className="text-xl font-black uppercase italic tracking-tighter text-white">Configurar Alarme</h2>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Ajuste personalizado CRONOS</span>
          </div>
          <button type="button" onClick={onCancel} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 active:scale-90 transition-all">
            <X size={20}/>
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
            <Tag size={12}/> Nome
          </label>
          <input 
            type="text"
            placeholder="Nome do alarme..."
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white focus:outline-none focus:border-indigo-500/50"
          />
        </div>

        <div className="flex justify-center py-2">
          <input 
            type="time" 
            required
            value={time} 
            onChange={(e) => setTime(e.target.value)}
            className="bg-transparent text-8xl font-mono font-bold text-indigo-500 focus:outline-none tracking-tighter"
          />
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
            <Bell size={12}/> Dias de Execução
          </label>

          <div className="flex justify-between items-center bg-white/5 p-4 rounded-[32px] border border-white/5">
            {weekDays.map(day => (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleDay(day.value)}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                  type === AlarmType.WEEKLY && customDays.includes(day.value)
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/40'
                    : 'bg-white/5 text-slate-600 hover:bg-white/10'
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[
              { label: '5x2', val: 5, shift: false },
              { label: '6x1', val: 6, shift: false },
              { label: '12x36', val: 2, shift: true },
              { label: '24x72', val: 4, shift: true }
            ].map(item => (
              <button
                key={item.label}
                type="button"
                onClick={() => item.shift ? selectShift(item.val) : applyPresetWeek(item.label)}
                className={`py-4 rounded-2xl text-[10px] font-black border transition-all ${
                  type === AlarmType.SHIFT && interval === item.val ? 'bg-indigo-600 text-white' : 'bg-white/5 border-white/10 text-slate-400'
                }`}
              >
                {item.label} {!isPremium && item.shift && <Lock size={8} className="inline ml-0.5 text-amber-500"/>}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-white/5 rounded-[32px] border border-white/10 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowSoundList(!showSoundList)}
              className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center text-indigo-500">
                  <Music size={20} />
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold text-white">Som</div>
                  <div className="text-[10px] text-indigo-400 font-bold italic">{sound.name}</div>
                </div>
              </div>
              {showSoundList ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
            </button>

            {showSoundList && (
              <div className="max-h-64 overflow-y-auto divide-y divide-white/5 border-t border-white/5">
                <div onClick={() => fileInputRef.current?.click()} className="flex items-center gap-4 p-4 hover:bg-white/10 cursor-pointer">
                  <Upload size={14} className="text-indigo-400"/>
                  <span className="text-xs font-black text-white uppercase italic">Meus Sons</span>
                </div>
                {systemSounds.map((s, idx) => (
                  <div key={idx} onClick={() => { setSound({ uri: s.uri, name: s.name }); setShowSoundList(false); }} className="p-4 text-xs text-slate-400 hover:bg-white/5">
                    {s.name}
                  </div>
                ))}
              </div>
            )}
            <input type="file" ref={fileInputRef} hidden accept="audio/*" onChange={handleFileUpload} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-[32px] p-5 border border-white/5 space-y-4">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Duração: <b className="text-indigo-400">{duration}s</b></span>
            <input type="range" min="5" max="60" step="5" value={duration} onChange={(e) => setDuration(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none accent-indigo-500" />
          </div>
          <div className="bg-white/5 rounded-[32px] p-5 border border-white/5 space-y-4">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Soneca: <b className="text-indigo-400">{snooze}m</b></span>
            <input type="range" min="0" max="15" step="1" value={snooze} onChange={(e) => setSnooze(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none accent-indigo-500" />
          </div>
        </div>

        <button type="submit" className="w-full py-6 bg-indigo-600 rounded-[32px] font-black uppercase italic tracking-widest text-lg shadow-2xl active:scale-95 transition-all text-white">
          SALVAR
        </button>
      </form>

      {showDatePicker && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur-xl p-6">
          <div className="bg-[#0b0f1a] w-full max-w-sm rounded-[40px] p-8 border border-white/10 space-y-6 text-center shadow-3xl">
            <h3 className="text-xl font-black text-white uppercase italic">Início do Plantão</h3>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-white/5 border border-indigo-500/30 rounded-2xl py-5 text-center text-indigo-400 font-mono font-bold focus:outline-none"/>
            <button onClick={() => setShowDatePicker(false)} className="w-full py-5 bg-indigo-600 rounded-3xl font-black uppercase text-xs">CONCLUIR</button>
          </div>
        </div>
      )}
    </div>
  );
};
