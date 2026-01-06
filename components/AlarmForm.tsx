import React, { useState, useEffect, useRef } from 'react';
import { Alarm, AlarmType } from '../types';
import { generateId } from '../utils/alarmUtils';
import { X, Repeat, Bell, Timer, Calendar, Check, Music, Volume2, Play, Square, Info, Tag, Search } from 'lucide-react';
import { Switch } from './ui/Switch';
import { audioService } from '../services/audioService';

interface AlarmFormProps {
  initialData?: Alarm | null;
  onSave: (alarm: Alarm) => void;
  onCancel: () => void;
}

const WEEK_DAYS = [
  { label: 'D', value: 0 },
  { label: 'S', value: 1 },
  { label: 'T', value: 2 },
  { label: 'Q', value: 3 },
  { label: 'Q', value: 4 },
  { label: 'S', value: 5 },
  { label: 'S', value: 6 },
];

const PRESET_SOUNDS = [
  { id: 'classic', name: 'Beep Clássico' },
  { id: 'radar', name: 'Radar Pulsante' },
  { id: 'emergency', name: 'Emergência' },
  { id: 'digital', name: 'Digital Sci-Fi' },
  { id: 'alvorada', name: 'Alvorada Suave' },
  { id: 'retro_phone', name: 'Telefone Retrô' },
  { id: 'zen', name: 'Meditação Zen' },
  { id: 'sonar', name: 'Sonar Submarino' },
  { id: 'birds', name: 'Pássaros da Manhã' },
];

const LABEL_PRESETS = [
  'Acordar', 'Trabalho', 'Almoço', 'Remédio', 'Escola', 'Treino', 'Reunião', 
  'Estudar', 'Descanso', 'Jantar', 'Café', 'Pagar Conta', 'Mercado', 
  'Ligar p/ Alguém', 'Aniversário', 'Evento Especial', 'Meditação', 'Silêncio'
];

export const AlarmForm: React.FC<AlarmFormProps> = ({ initialData, onSave, onCancel }) => {
  const [time, setTime] = useState(initialData?.time || '07:00');
  const [type, setType] = useState<AlarmType>(initialData?.type || AlarmType.DAILY);
  const [label, setLabel] = useState(initialData?.label || '');
  const [volume, setVolume] = useState(initialData?.volume ?? 0.8);
  const [snoozeEnabled, setSnoozeEnabled] = useState(initialData?.snoozeEnabled ?? true);
  const [snoozeSeconds, setSnoozeSeconds] = useState(initialData?.snoozeSeconds ?? 300);
  const [durationSeconds, setDurationSeconds] = useState(initialData?.durationSeconds ?? 300);
  const [intervalDays, setIntervalDays] = useState(initialData?.intervalDays || 2);
  const [customDays, setCustomDays] = useState<number[]>(initialData?.customDays || [0, 1, 2, 3, 4, 5, 6]);
  const [startDate, setStartDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [soundUri, setSoundUri] = useState(initialData?.soundUri || 'classic');
  const [soundName, setSoundName] = useState(initialData?.soundName || 'Beep Clássico');
  const [isPreviewing, setIsPreviewing] = useState<string | null>(null);
  const [isLabelFocused, setIsLabelFocused] = useState(false);

  useEffect(() => {
    return () => audioService.stopAlarm();
  }, []);

  const formatMin = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins} min`;
  };

  const toggleDay = (day: number) => {
    setCustomDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    );
  };

  const handlePreview = (uri: string, name: string) => {
    if (isPreviewing === uri) {
      audioService.stopAlarm();
      setIsPreviewing(null);
    } else {
      audioService.stopAlarm();
      setIsPreviewing(uri);
      audioService.startAlarm(uri, false, 'continuous', volume, 0);
      setTimeout(() => {
        setIsPreviewing((current) => current === uri ? null : current);
      }, 5000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    audioService.stopAlarm();
    
    let finalType = type;
    if (type === AlarmType.DAILY && customDays.length < 7) {
      finalType = AlarmType.CUSTOM;
    }

    onSave({
      id: initialData?.id || generateId(),
      time, 
      label, 
      isEnabled: true, 
      type: finalType,
      customDays: (type === AlarmType.SHIFT || type === AlarmType.ODD_DAYS || type === AlarmType.EVEN_DAYS) ? [0,1,2,3,4,5,6] : customDays,
      date: type === AlarmType.SHIFT ? startDate : undefined,
      intervalDays,
      durationSeconds, 
      snoozeEnabled, 
      snoozeSeconds,
      soundUri,
      soundName,
      volume, 
      fadeDurationSeconds: 10, 
      vibrationEnabled: true,
      vibrationPattern: 'continuous',
      lastStoppedDate: null
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/95 backdrop-blur-2xl p-0 sm:p-4">
      <form onSubmit={handleSubmit} className="bg-[#020617] w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] shadow-2xl border-t border-white/5 flex flex-col max-h-[95vh] overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
        
        <div className="px-8 py-6 flex justify-between items-center border-b border-white/5 bg-[#020617]/50 backdrop-blur-md z-10">
          <div>
            <span className="text-[10px] font-black text-primary tracking-[0.4em] uppercase">Configuração</span>
            <h2 className="text-xl font-bold tracking-tight">Ajustar Alarme</h2>
          </div>
          <button type="button" onClick={onCancel} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-10 custom-scroll pb-10">
          
          <div className="flex flex-col items-center">
            <input
              type="time" required value={time} onChange={(e) => setTime(e.target.value)}
              className="bg-transparent text-8xl font-mono font-bold text-white focus:outline-none text-center tracking-tighter w-full appearance-none"
            />
            
            {/* Campo de Nome com Lista de Sugestões Suspensa */}
            <div className="mt-6 w-full relative px-4">
              <div className="flex flex-col items-center space-y-2">
                <input 
                  type="text" 
                  value={label} 
                  onChange={(e) => setLabel(e.target.value)} 
                  onFocus={() => setIsLabelFocused(true)}
                  onBlur={() => setTimeout(() => setIsLabelFocused(false), 200)}
                  placeholder="Nome do alarme..." 
                  className="w-full bg-transparent border-none text-center text-xl font-medium text-slate-200 placeholder:text-slate-800 focus:ring-0 p-0" 
                />
                <div className={`h-[2px] transition-all duration-300 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)] ${isLabelFocused ? 'w-24 bg-primary' : 'w-12 bg-primary/40'}`}></div>
              </div>

              {/* Lista de Sugestões (Rolagem Vertical) */}
              {isLabelFocused && (
                <div className="absolute top-full left-4 right-4 z-30 mt-4 bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-[32px] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="flex items-center gap-2 mb-4 px-2">
                    <Tag size={12} className="text-primary" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Sugestões Rápidas</span>
                  </div>
                  <div className="max-h-56 overflow-y-auto custom-scroll space-y-1 pr-1">
                    {LABEL_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setLabel(preset)}
                        className={`w-full text-left px-5 py-3.5 rounded-2xl text-sm font-bold transition-all flex items-center justify-between group ${
                          label === preset 
                          ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                          : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                        }`}
                      >
                        {preset}
                        {label === preset && <Check size={16} />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <section className="bg-white/5 rounded-[32px] p-6 space-y-6 border border-white/5">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-primary tracking-widest">
              <Repeat size={14} /> Frequência
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Diário', value: AlarmType.DAILY },
                { label: 'Plantão', value: AlarmType.SHIFT },
                { label: 'Ímpares', value: AlarmType.ODD_DAYS },
                { label: 'Pares', value: AlarmType.EVEN_DAYS },
              ].map((opt) => (
                <button
                  key={opt.value} type="button" onClick={() => setType(opt.value)}
                  className={`py-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
                    type === opt.value 
                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                    : 'bg-slate-900 text-slate-500 border-white/5 hover:border-white/10'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {(type === AlarmType.DAILY || type === AlarmType.CUSTOM) && (
              <div className="pt-6 border-t border-white/5 animate-in fade-in zoom-in-95">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-5 text-center">Dias da Semana:</p>
                <div className="flex justify-between items-center px-1">
                  {WEEK_DAYS.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      className={`w-10 h-10 rounded-full text-xs font-black transition-all ${
                        customDays.includes(day.value)
                          ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-110'
                          : 'bg-slate-800 text-slate-600 border border-white/5'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {type === AlarmType.SHIFT && (
              <div className="pt-6 border-t border-white/5 space-y-8 animate-in slide-in-from-top-4">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Calendar size={12} className="text-primary" /> Primeiro Dia do Plantão
                  </label>
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>

                <div className="space-y-4 bg-primary/5 p-6 rounded-3xl border border-primary/10">
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-primary uppercase tracking-widest">Ciclo de Repetição</span>
                      <span className="text-xs text-slate-500 font-medium mt-1">
                        {intervalDays === 2 ? 'Modo 12x36' : `A cada ${intervalDays} dias`}
                      </span>
                    </div>
                    <div className="text-2xl font-mono font-black text-primary">
                      {intervalDays}d
                    </div>
                  </div>
                  <input 
                    type="range" min="1" max="15" value={intervalDays} 
                    onChange={(e) => setIntervalDays(parseInt(e.target.value))} 
                    className="w-full accent-primary h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer" 
                  />
                </div>
              </div>
            )}

            {(type === AlarmType.ODD_DAYS || type === AlarmType.EVEN_DAYS) && (
              <div className="pt-4 border-t border-white/5 text-center animate-in fade-in">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
                  <Info size={14} className="text-primary" />
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                    Seguirá o calendário ({type === AlarmType.ODD_DAYS ? 'Dias 1, 3, 5...' : 'Dias 2, 4, 6...'})
                  </span>
                </div>
              </div>
            )}
          </section>

          <section className="bg-white/5 rounded-[32px] p-6 space-y-6 border border-white/5">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-primary tracking-widest">
              <Music size={14} /> Toque do Alarme
            </div>

            <div className="max-h-[220px] overflow-y-auto pr-2 custom-scroll space-y-2 bg-slate-900/30 rounded-2xl p-2 border border-white/5">
              {PRESET_SOUNDS.map((sound) => (
                <div
                  key={sound.id}
                  onClick={() => { setSoundUri(sound.id); setSoundName(sound.name); }}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all ${
                    soundUri === sound.id 
                    ? 'bg-primary/20 border border-primary/40 text-white' 
                    : 'bg-transparent border border-transparent text-slate-500 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full ${soundUri === sound.id ? 'bg-primary shadow-[0_0_8px_rgba(99,102,241,1)]' : 'bg-slate-700'}`} />
                    <span className="text-sm font-bold tracking-tight">{sound.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handlePreview(sound.id, sound.name); }}
                    className={`p-2 rounded-lg transition-all ${
                      isPreviewing === sound.id ? 'bg-primary text-white scale-110' : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    {isPreviewing === sound.id ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-white/5 space-y-5">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-400 flex items-center gap-2 uppercase tracking-widest">
                  <Volume2 size={14} className="text-primary"/> Volume
                </span>
                <span className="text-primary font-mono">{Math.round(volume * 100)}%</span>
              </div>
              <input 
                type="range" min="0" max="1" step="0.05" value={volume} 
                onChange={(e) => setVolume(parseFloat(e.target.value))} 
                className="w-full accent-primary h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer" 
              />
            </div>
          </section>

          <section className="bg-white/5 rounded-[32px] p-6 space-y-8 border border-white/5">
            <div className="space-y-5">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-400 flex items-center gap-2 uppercase tracking-widest">
                  <Bell size={14} className="text-primary"/> Duração do Toque
                </span>
                <span className="text-primary font-mono">{formatMin(durationSeconds)}</span>
              </div>
              <input 
                type="range" min="60" max="1800" step="60" value={durationSeconds} 
                onChange={(e) => setDurationSeconds(parseInt(e.target.value))} 
                className="w-full accent-primary h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer" 
              />
            </div>

            <div className="pt-6 border-t border-white/5 space-y-6">
              <Switch label="Ativar Soneca" checked={snoozeEnabled} onChange={setSnoozeEnabled} />
              {snoozeEnabled && (
                <div className="space-y-5 animate-in fade-in slide-in-from-top-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-400 flex items-center gap-2 uppercase tracking-widest">
                      <Timer size={14} className="text-primary"/> Intervalo Soneca
                    </span>
                    <span className="text-primary font-mono">{formatMin(snoozeSeconds)}</span>
                  </div>
                  <input 
                    type="range" min="60" max="1200" step="60" value={snoozeSeconds} 
                    onChange={(e) => setSnoozeSeconds(parseInt(e.target.value))} 
                    className="w-full accent-primary h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer" 
                  />
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="p-8 bg-[#020617] border-t border-white/5 sticky bottom-0 z-10 safe-bottom">
          <button type="submit" className="w-full py-5 bg-primary hover:bg-indigo-500 text-white font-black uppercase tracking-[0.3em] rounded-2xl shadow-2xl shadow-primary/30 transition-all active:scale-95 flex items-center justify-center gap-3">
            <Check size={20} /> Salvar Alarme
          </button>
        </div>
      </form>
    </div>
  );
};