import React, { useState, useRef, useEffect } from 'react';
import { Alarm, AlarmType, SoundType, VibrationPattern } from '../types';
import { generateId } from '../utils/alarmUtils';
import { X, Check, Music, Upload, Play, Square, Timer, Volume2, TrendingUp, CloudRain, Bird, Wind, Clock, Bell } from 'lucide-react';
import { Switch } from './ui/Switch';
import { audioService } from '../services/audioService';

interface AlarmFormProps {
  initialData?: Alarm | null;
  onSave: (alarm: Alarm) => void;
  onCancel: () => void;
}

const PRESETS = [
  { id: 'classic', name: 'Beep', icon: Music },
  { id: 'digital', name: 'Digital', icon: Music },
  { id: 'birds', name: 'Pássaros', icon: Bird },
  { id: 'rain', name: 'Chuva', icon: CloudRain },
  { id: 'zen', name: 'Zen', icon: Wind },
  { id: 'lofi', name: 'Lofi', icon: Music },
];

const WEEK_DAYS = [
  { label: 'Dom', value: 0 },
  { label: 'Seg', value: 1 },
  { label: 'Ter', value: 2 },
  { label: 'Qua', value: 3 },
  { label: 'Qui', value: 4 },
  { label: 'Sex', value: 5 },
  { label: 'Sáb', value: 6 },
];

export const AlarmForm: React.FC<AlarmFormProps> = ({ initialData, onSave, onCancel }) => {
  const [time, setTime] = useState(initialData?.time || '07:00');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [label, setLabel] = useState(initialData?.label || '');
  const [type, setType] = useState<AlarmType>(initialData?.type || AlarmType.DAILY);
  const [customDays, setCustomDays] = useState<number[]>(initialData?.customDays || [0, 1, 2, 3, 4, 5, 6]);
  
  // Snooze & Duration Settings (Segundos)
  const [snoozeEnabled, setSnoozeEnabled] = useState(initialData?.snoozeEnabled ?? true);
  // Compatibilidade: se vier do storage antigo em minutos, converte
  const [snoozeSeconds, setSnoozeSeconds] = useState(() => {
    if (initialData?.snoozeSeconds) return initialData.snoozeSeconds;
    // @ts-ignore - Handle legacy field
    return (initialData?.snoozeMinutes || 5) * 60;
  });
  const [durationSeconds, setDurationSeconds] = useState(() => {
    if (initialData?.durationSeconds) return initialData.durationSeconds;
    // @ts-ignore - Handle legacy field
    return (initialData?.durationMinutes || 5) * 60;
  });

  // Sound & Volume State
  const [soundType, setSoundType] = useState<SoundType>(initialData?.soundType || 'preset');
  const [soundUri, setSoundUri] = useState(initialData?.soundUri || 'classic');
  const [soundName, setSoundName] = useState(initialData?.soundName || 'Beep Clássico');
  const [volume, setVolume] = useState(initialData?.volume ?? 0.8);
  const [fadeDuration, setFadeDuration] = useState(initialData?.fadeDurationSeconds ?? 10);
  
  const [vibrationEnabled, setVibrationEnabled] = useState(initialData?.vibrationEnabled ?? true);
  const [vibrationPattern, setVibrationPattern] = useState<VibrationPattern>(initialData?.vibrationPattern || 'continuous');

  const [isPreviewing, setIsPreviewing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => audioService.stopAlarm();
  }, []);

  const formatSecondsLabel = (s: number) => {
    if (s < 60) return `${s} seg`;
    const m = Math.floor(s / 60);
    const rs = s % 60;
    return rs > 0 ? `${m}m ${rs}s` : `${m} min`;
  };

  const toggleDay = (day: number) => {
    let newDays;
    if (customDays.includes(day)) {
      newDays = customDays.filter(d => d !== day);
    } else {
      newDays = [...customDays, day].sort();
    }
    setCustomDays(newDays);
    setType(AlarmType.CUSTOM);
  };

  const handleTypeSelect = (newType: AlarmType) => {
    setType(newType);
    if (newType === AlarmType.DAILY) {
      setCustomDays([0, 1, 2, 3, 4, 5, 6]);
    } else if (newType === AlarmType.ODD_DAYS || newType === AlarmType.EVEN_DAYS || newType === AlarmType.ONCE) {
      setCustomDays([]);
    }
  };

  const togglePreview = () => {
    if (isPreviewing) {
      audioService.stopAlarm();
      setIsPreviewing(false);
    } else {
      audioService.startAlarm(soundType, soundUri, vibrationEnabled, vibrationPattern, volume, 0);
      setIsPreviewing(true);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        alert("Ops! Música muito grande. Tente um arquivo menor que 8MB para garantir o salvamento.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSoundUri(event.target.result as string);
          setSoundName(file.name);
          setSoundType('file');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    audioService.stopAlarm(); 
    
    let finalType = type;
    if (type === AlarmType.CUSTOM && customDays.length === 0) finalType = AlarmType.ONCE;

    onSave({
      id: initialData?.id || generateId(),
      time,
      date: [AlarmType.ONCE, AlarmType.WEEKLY, AlarmType.MONTHLY, AlarmType.YEARLY].includes(finalType) ? date : undefined,
      label,
      isEnabled: true,
      type: finalType,
      customDays: (finalType === AlarmType.CUSTOM || finalType === AlarmType.DAILY) ? customDays : [],
      durationSeconds,
      snoozeEnabled,
      snoozeSeconds,
      soundType,
      soundUri,
      soundName,
      volume,
      fadeDurationSeconds: fadeDuration,
      vibrationEnabled,
      vibrationPattern,
      lastStoppedDate: null
    });
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="bg-surface w-full max-w-lg rounded-3xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
          <h2 className="text-xl font-bold text-white tracking-tight">{initialData ? 'Editar Alarme' : 'Novo Alarme'}</h2>
          <button type="button" onClick={onCancel} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-slate-700">
          {/* Hora Principal */}
          <div className="flex flex-col items-center gap-6">
            <input
              type="time" required value={time} onChange={(e) => setTime(e.target.value)}
              className="bg-transparent text-7xl font-mono font-bold text-white focus:outline-none border-b-2 border-slate-600 focus:border-primary p-2 text-center w-full max-w-[240px]"
            />
            
            {/* Opções de Recorrência Rápida */}
            <div className="flex flex-col gap-4 w-full">
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  { l: 'Diário', v: AlarmType.DAILY },
                  { l: 'Ímpares', v: AlarmType.ODD_DAYS },
                  { l: 'Pares', v: AlarmType.EVEN_DAYS },
                  { l: 'Uma vez', v: AlarmType.ONCE },
                ].map((opt) => (
                  <button
                    key={opt.v} type="button" onClick={() => handleTypeSelect(opt.v as AlarmType)}
                    className={`py-2 px-4 rounded-xl text-xs font-bold border transition-all ${
                      type === opt.v ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    {opt.l}
                  </button>
                ))}
              </div>

              {/* Seletor de Dias da Semana */}
              <div className="flex justify-between items-center bg-slate-900/40 p-3 rounded-2xl border border-slate-700/30">
                {WEEK_DAYS.map((day) => {
                  const isSelected = (type === AlarmType.DAILY && customDays.includes(day.value)) || (type === AlarmType.CUSTOM && customDays.includes(day.value));
                  const isEffectivelyActive = [AlarmType.DAILY, AlarmType.CUSTOM].includes(type);
                  
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black transition-all border-2 ${
                        isSelected && isEffectivelyActive
                          ? 'bg-primary border-primary text-white shadow-md shadow-primary/20 scale-105' 
                          : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600'
                      } ${!isEffectivelyActive && isSelected ? 'opacity-40 grayscale' : ''}`}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Seção de Soneca e Duração - Agora com segundos */}
          <div className="space-y-4 bg-slate-900/40 p-5 rounded-2xl border border-slate-700/50">
             <div className="flex items-center gap-2 text-primary mb-2">
                <Timer size={20} />
                <span className="text-xs font-black uppercase tracking-widest">Soneca e Duração</span>
             </div>

             <Switch 
                label="Ativar Soneca" 
                checked={snoozeEnabled} 
                onChange={setSnoozeEnabled} 
             />

             {snoozeEnabled && (
               <div className="space-y-2 animate-in slide-in-from-top-2 duration-300 pt-2">
                  <div className="flex justify-between text-[10px] font-black uppercase text-slate-500">
                      <span>Tempo de Soneca</span>
                      <span className="text-primary">{formatSecondsLabel(snoozeSeconds)}</span>
                  </div>
                  <input 
                      type="range" min="10" max="1800" step="10" value={snoozeSeconds} 
                      onChange={(e) => setSnoozeSeconds(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
               </div>
             )}

             <div className="space-y-2 pt-2 border-t border-slate-700/50">
                <div className="flex justify-between text-[10px] font-black uppercase text-slate-500">
                    <div className="flex items-center gap-1"><Clock size={12}/> Duração do Alarme</div>
                    <span className="text-secondary">{formatSecondsLabel(durationSeconds)}</span>
                </div>
                <input 
                    type="range" min="10" max="3600" step="10" value={durationSeconds} 
                    onChange={(e) => setDurationSeconds(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-secondary"
                />
             </div>
          </div>

          {/* Seção de Som */}
          <div className="space-y-4 bg-slate-900/40 p-5 rounded-2xl border border-slate-700/50">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary">
                  <Music size={20} />
                  <span className="text-xs font-black uppercase tracking-widest">Som & Música</span>
                </div>
                <button
                    type="button" onClick={togglePreview}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase transition-all ${
                        isPreviewing ? 'bg-red-500/20 text-red-400' : 'bg-primary/20 text-primary hover:bg-primary/30'
                    }`}
                >
                    {isPreviewing ? <Square size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
                    {isPreviewing ? 'Parar' : 'Testar'}
                </button>
             </div>

             <div className="space-y-3">
                <div className="flex bg-slate-800 p-1 rounded-xl">
                    <button 
                        type="button" onClick={() => setSoundType('preset')}
                        className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${soundType === 'preset' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-500'}`}
                    >
                        Presets
                    </button>
                    <button 
                        type="button" onClick={() => fileInputRef.current?.click()}
                        className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg flex items-center justify-center gap-2 transition-all ${soundType === 'file' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-500'}`}
                    >
                        <Upload size={12} /> Local
                    </button>
                    <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFileChange} />
                </div>

                {soundType === 'preset' ? (
                    <div className="grid grid-cols-3 gap-2">
                        {PRESETS.map(p => (
                            <button
                                key={p.id} type="button" onClick={() => { setSoundUri(p.id); setSoundName(p.name); }}
                                className={`py-3 px-1 rounded-xl border text-[10px] font-bold flex flex-col items-center gap-1 transition-all ${
                                    soundUri === p.id ? 'bg-primary/10 border-primary text-primary' : 'bg-slate-800/50 border-slate-700 text-slate-500 hover:border-slate-600'
                                }`}
                            >
                                <p.icon size={14} />
                                {p.name}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 flex items-center justify-between animate-in fade-in duration-300">
                        <div className="flex items-center gap-2 truncate">
                          <Music size={14} className="text-primary flex-shrink-0" />
                          <span className="text-[10px] text-slate-300 truncate font-medium italic">
                              {soundName}
                          </span>
                        </div>
                        <Check size={14} className="text-emerald-500 flex-shrink-0" />
                    </div>
                )}
             </div>

             <div className="pt-4 border-t border-slate-700/50 space-y-5">
                <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase text-slate-500">
                        <div className="flex items-center gap-1"><Volume2 size={12}/> Volume</div>
                        <span>{Math.round(volume * 100)}%</span>
                    </div>
                    <input 
                        type="range" min="0" max="1" step="0.05" value={volume} 
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase text-slate-500">
                        <div className="flex items-center gap-1"><TrendingUp size={12}/> Crescente (Fade)</div>
                        <span>{fadeDuration}s</span>
                    </div>
                    <input 
                        type="range" min="0" max="60" step="5" value={fadeDuration} 
                        onChange={(e) => setFadeDuration(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-secondary"
                    />
                </div>
             </div>
          </div>

          <div className="space-y-4 bg-slate-900/40 p-5 rounded-2xl border border-slate-700/50">
             <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1"><Bell size={12} /> Rótulo do Alarme</label>
                <input 
                  type="text" 
                  value={label} 
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Ex: Trabalho, Academia..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                />
             </div>
             
             <Switch label="Vibração Tátil" checked={vibrationEnabled} onChange={setVibrationEnabled} />
             {vibrationEnabled && (
               <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] font-black uppercase text-slate-500">Padrão</label>
                  <div className="flex gap-2">
                      {['continuous', 'heartbeat', 'rapid'].map(p => (
                          <button
                              key={p} type="button" onClick={() => setVibrationPattern(p as any)}
                              className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${vibrationPattern === p ? 'bg-secondary/20 text-secondary border border-secondary shadow-sm shadow-secondary/10' : 'bg-slate-800 text-slate-500 hover:bg-slate-750'}`}
                          >
                              {p === 'continuous' ? 'Fixo' : p === 'heartbeat' ? 'Pulso' : 'Alerta'}
                          </button>
                      ))}
                  </div>
               </div>
             )}
          </div>
        </div>

        <div className="p-6 border-t border-slate-700 bg-slate-800/30">
          <button type="submit" className="w-full py-4 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95">
            <Check size={18} /> Salvar Alarme
          </button>
        </div>
      </form>
    </div>
  );
};