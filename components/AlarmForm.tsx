import React, { useState, useRef, useEffect } from 'react';
import { Alarm, AlarmType, SoundType, VibrationPattern } from '../types';
import { generateId } from '../utils/alarmUtils';
import { X, Check, Music, Upload, Play, Square, Smartphone, Calendar, Waves } from 'lucide-react';
import { Switch } from './ui/Switch';
import { audioService } from '../services/audioService';

interface AlarmFormProps {
  initialData?: Alarm | null;
  onSave: (alarm: Alarm) => void;
  onCancel: () => void;
}

const PRESETS = [
  { id: 'classic', name: 'Clássico (Beep)' },
  { id: 'digital', name: 'Digital (Rápido)' },
  { id: 'gentle', name: 'Suave (Ondas)' },
];

const VIB_PATTERNS: { id: VibrationPattern; name: string }[] = [
  { id: 'continuous', name: 'Contínuo' },
  { id: 'heartbeat', name: 'Batida' },
  { id: 'rapid', name: 'Rápido' },
  { id: 'staccato', name: 'Intermitente' },
];

export const AlarmForm: React.FC<AlarmFormProps> = ({ initialData, onSave, onCancel }) => {
  const [time, setTime] = useState(initialData?.time || '07:00');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [label, setLabel] = useState(initialData?.label || '');
  const [type, setType] = useState<AlarmType>(initialData?.type || AlarmType.DAILY);
  const [customDays, setCustomDays] = useState<number[]>(initialData?.customDays || []);
  const [durationMinutes, setDurationMinutes] = useState(initialData?.durationMinutes || 5);
  const [snoozeEnabled, setSnoozeEnabled] = useState(initialData?.snoozeEnabled ?? true);
  const [snoozeMinutes, setSnoozeMinutes] = useState(initialData?.snoozeMinutes || 10);
  
  // Sound & Vibration State
  const [soundType, setSoundType] = useState<SoundType>(initialData?.soundType || 'preset');
  const [soundUri, setSoundUri] = useState(initialData?.soundUri || 'classic');
  const [soundName, setSoundName] = useState(initialData?.soundName || 'Clássico (Beep)');
  const [vibrationEnabled, setVibrationEnabled] = useState(initialData?.vibrationEnabled ?? true);
  const [vibrationPattern, setVibrationPattern] = useState<VibrationPattern>(initialData?.vibrationPattern || 'continuous');

  const [isPreviewing, setIsPreviewing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => audioService.stopAlarm();
  }, []);

  useEffect(() => {
    if (isPreviewing) {
      audioService.startAlarm(soundType, soundUri, vibrationEnabled, vibrationPattern);
    }
  }, [soundType, soundUri, isPreviewing, vibrationEnabled, vibrationPattern]);

  const togglePreview = () => {
    audioService.hapticFeedback('medium');
    if (isPreviewing) {
      audioService.stopAlarm();
      setIsPreviewing(false);
    } else {
      audioService.startAlarm(soundType, soundUri, vibrationEnabled, vibrationPattern);
      setIsPreviewing(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    audioService.hapticFeedback('heavy');
    audioService.stopAlarm(); 
    const newAlarm: Alarm = {
      id: initialData?.id || generateId(),
      time,
      date: [AlarmType.ONCE, AlarmType.WEEKLY, AlarmType.MONTHLY, AlarmType.YEARLY].includes(type) ? date : undefined,
      label,
      isEnabled: true,
      type,
      customDays,
      durationMinutes,
      snoozeEnabled,
      snoozeMinutes,
      soundType,
      soundUri,
      soundName,
      vibrationEnabled,
      vibrationPattern,
      lastStoppedDate: null
    };
    onSave(newAlarm);
  };

  const handleCancel = () => {
    audioService.hapticFeedback('light');
    audioService.stopAlarm();
    onCancel();
  };

  const toggleCustomDay = (day: number) => {
    audioService.hapticFeedback('light');
    if (customDays.includes(day)) {
      setCustomDays(customDays.filter(d => d !== day));
    } else {
      setCustomDays([...customDays, day]);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="bg-surface w-full max-w-lg rounded-3xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">{initialData ? 'Editar Alarme' : 'Novo Alarme'}</h2>
          <button type="button" onClick={handleCancel} className="text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <div className="flex flex-col items-center gap-4">
            <input
              type="time"
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="bg-transparent text-5xl font-mono font-bold text-white focus:outline-none border-b-2 border-slate-600 focus:border-primary p-2 text-center w-full max-w-[200px]"
            />
            {[AlarmType.ONCE, AlarmType.WEEKLY, AlarmType.MONTHLY, AlarmType.YEARLY].includes(type) && (
               <div className="flex items-center gap-2 text-slate-300">
                 <Calendar size={18} />
                 <input 
                   type="date"
                   required
                   value={date}
                   onChange={(e) => setDate(e.target.value)}
                   className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white outline-none"
                 />
               </div>
            )}
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-400">Repetição</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                { l: 'Uma vez', v: AlarmType.ONCE },
                { l: 'Diariamente', v: AlarmType.DAILY },
                { l: 'Dias Úteis', v: AlarmType.WEEKDAYS },
                { l: 'Semanal', v: AlarmType.WEEKLY },
                { l: 'Mensal', v: AlarmType.MONTHLY },
                { l: 'Ímpares', v: AlarmType.ODD_DAYS },
                { l: 'Pares', v: AlarmType.EVEN_DAYS },
                { l: 'Custom', v: AlarmType.CUSTOM },
              ].map((opt) => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => { audioService.hapticFeedback('light'); setType(opt.v as AlarmType); }}
                  className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                    type === opt.v ? 'bg-primary/20 text-primary border-primary' : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {opt.l}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 bg-slate-900/30 p-4 rounded-xl border border-slate-700/50">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300">
                  <Music className="text-primary w-5 h-5" />
                  <span className="text-sm font-medium">Som</span>
                </div>
                <button
                    type="button"
                    onClick={togglePreview}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${
                        isPreviewing ? 'bg-red-500/20 text-red-400' : 'bg-primary/20 text-primary'
                    }`}
                >
                    {isPreviewing ? <Square size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
                    {isPreviewing ? 'Parar' : 'Testar'}
                </button>
             </div>
             
             <div className="grid grid-cols-3 gap-2">
                {PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => { audioService.hapticFeedback('light'); setSoundUri(preset.id); setSoundName(preset.name); }}
                    className={`py-2 rounded-lg border text-[10px] font-bold ${
                      soundUri === preset.id ? 'bg-primary/10 border-primary text-primary' : 'bg-slate-800 border-slate-700 text-slate-500'
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
             </div>

             <div className="pt-4 border-t border-slate-700/50">
               <Switch
                 label="Vibração"
                 checked={vibrationEnabled}
                 onChange={(val) => { audioService.hapticFeedback('medium'); setVibrationEnabled(val); }}
               />
               
               {vibrationEnabled && (
                 <div className="mt-4 grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-2">
                    {VIB_PATTERNS.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => { audioService.hapticFeedback('light'); setVibrationPattern(p.id); }}
                        className={`py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 ${
                          vibrationPattern === p.id ? 'bg-secondary/10 border-secondary text-secondary' : 'bg-slate-800 border-slate-700 text-slate-500'
                        }`}
                      >
                        <Waves size={12} />
                        {p.name}
                      </button>
                    ))}
                 </div>
               )}
             </div>
          </div>

          <div className="space-y-6 bg-slate-900/30 p-4 rounded-xl border border-slate-700/50">
            <Switch
              label="Modo Soneca"
              checked={snoozeEnabled}
              onChange={setSnoozeEnabled}
            />
            {snoozeEnabled && (
               <div>
                 <div className="flex justify-between mb-2">
                   <label className="text-sm font-medium text-slate-300">Tempo de Soneca</label>
                   <span className="text-sm text-primary font-mono">{snoozeMinutes} min</span>
                 </div>
                 <input
                   type="range"
                   min="1" max="30"
                   value={snoozeMinutes}
                   onChange={(e) => setSnoozeMinutes(parseInt(e.target.value))}
                   className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                 />
               </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-slate-700">
          <button type="submit" className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl flex items-center justify-center gap-2">
            <Check size={20} /> Salvar Alarme
          </button>
        </div>
      </form>
    </div>
  );
};