import React, { useState, useEffect } from 'react';
import { Alarm, AlarmType } from '../types';
import { generateId } from '../utils/alarmUtils';
import { X, Repeat, Bell, Timer, Calendar, Check, Music, Volume2, Play, Square, Hash } from 'lucide-react';
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
        if (isPreviewing === uri) {
          audioService.stopAlarm();
          setIsPreviewing(null);
        }
      }, 5000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    audioService.stopAlarm();
    
    // Se for diário mas não todos os dias, vira CUSTOM
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
        
        {/* Header */}
        <div className="px-8 py-6 flex justify-between items-center border-b border-white/5 bg-[#020617]/50 backdrop-blur-xl sticky top-0 z-10">
          <div>
            <span className="text-[10px] font-black text-primary tracking-[0.4em] uppercase">Configuração</span>
            <h2 className="text-xl font-bold tracking-tight">Ajustar Despertador</h2>
          </div>
          <button type="button" onClick={onCancel} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-10 custom-scroll pb-20">
          
          {/* Time & Label */}
          <div className="flex flex-col items-center">
            <input
              type="time" required value={time} onChange={(e) => setTime(e.target.value)}
              className="bg-transparent text-8xl font-mono font-bold text-white focus:outline-none text-center tracking-tighter w-full appearance-none"
            />
            <div className="mt-6 w-full px-8">
              <input 
                type="text" value={label} onChange={(e) => setLabel(e.target.value)} 
                placeholder="Título do alarme" 
                className="w-full bg-transparent border-none text-center text-xl font-medium text-slate-300 placeholder:text-slate-800 focus:ring-0 p-0" 
              />
              <div className="h-[2px] w-12 bg-primary/40 mx-auto mt-2 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
            </div>
          </div>

          {/* Frequência & Dias */}
          <section className="bg-white/5 rounded-[32px] p-6 space-y-6 border border-white/5">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-primary tracking-widest">
              <Repeat size={14} /> Ciclo de Repetição
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

            {/* Dias da semana (Somente Diário/Personalizado) */}
            {(type === AlarmType.DAILY || type === AlarmType.CUSTOM) && (
              <div className="pt-6 border-t border-white/5 animate-in fade-in zoom-in-95">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-5 text-center">Ativar nestes dias:</p>
                <div className="flex justify-between items-center">
                  {WEEK_DAYS.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      className={`w-10 h-10 rounded-full text-xs font-black transition-all ${
                        customDays.includes(day.value)
                          ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-110'
                          : 'bg-slate-800 text-slate-600 border border-white/5 hover:bg-slate-700'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Lógica de Plantão (Intervalo + Data Inicial) */}
            {type === AlarmType.SHIFT && (
              <div className="pt-6 border-t border-white/5 space-y-8 animate-in slide-in-from-top-4">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Calendar size={12} className="text-primary" /> Data de Início do Plantão
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
                      <span className="text-[10px] font-black text-primary uppercase tracking-widest">Intervalo de Dias</span>
                      <span className="text-xs text-slate-500 font-medium mt-1">
                        {intervalDays === 2 ? 'Modo 12x36 (Dia sim, dia não)' : `A cada ${intervalDays} dias`}
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

            {/* Dias Ímpares / Pares (Info) */}
            {(type === AlarmType.ODD_DAYS || type === AlarmType.EVEN_DAYS) && (
              <div className="pt-4 border-t border-white/5 text-center animate-in fade-in">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
                  <Hash size={14} className="text-primary" />
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                    Baseado no dia do mês ({type === AlarmType.ODD_DAYS ? 'Ímpares' : 'Pares'})
                  </span>
                </div>
              </div>
            )}
          </section>

          {/* Sons (Lista de Rolagem) */}
          <section className="bg-white/5 rounded-[32px] p-6 space-y-6 border border-white/5">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-primary tracking-widest">
              <Music size={14} /> Seleção de Toque
            </div>

            {/* Lista com Rolagem */}
            <div className="max-h-[260px] overflow-y-auto pr-2 custom-scroll space-y-2">
              {PRESET_SOUNDS.map((sound) => (
                <button
                  key={sound.id}
                  type="button"
                  onClick={() => { setSoundUri(sound.id); setSoundName(sound.name); }}
                  className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl border transition-all ${
                    soundUri === sound.id 
                    ? 'bg-primary/15 border-primary/40 text-white shadow-inner' 
                    : 'bg-slate-900/50 border-white/5 text-slate-500 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full transition-all ${soundUri === sound.id ? 'bg-primary shadow-[0_0_8px_rgba(99,102,241,1)] scale-125' : 'bg-slate-700'}`} />
                    <span className={`text-sm font-bold tracking-tight ${soundUri === sound.id ? 'text-white' : 'text-slate-500'}`}>
                      {sound.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handlePreview(sound.id, sound.name); }}
                    className={`p-2.5 rounded-xl transition-all ${
                      isPreviewing === sound.id ? 'bg-primary text-white scale-110 shadow-lg' : 'bg-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    {isPreviewing === sound.id ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                  </button>
                </button>
              ))}
            </div>

            <div className="pt-6 border-t border-white/5 space-y-5">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-400 flex items-center gap-2 uppercase tracking-widest">
                  <Volume2 size={14} className="text-primary"/> Intensidade
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

          {/* Duração & Soneca */}
          <section className="bg-white/5 rounded-[32px] p-6 space-y-8 border border-white/5">
            <div className="space-y-5">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-400 flex items-center gap-2 uppercase tracking-widest">
                  <Bell size={14} className="text-primary"/> Tempo de Toque
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
              <Switch label="Permitir Soneca" checked={snoozeEnabled} onChange={setSnoozeEnabled} />
              {snoozeEnabled && (
                <div className="space-y-5 animate-in fade-in slide-in-from-top-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-400 flex items-center gap-2 uppercase tracking-widest">
                      <Timer size={14} className="text-primary"/> Repouso (Soneca)
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

        {/* Footer */}
        <div className="p-8 bg-[#020617] border-t border-white/5 sticky bottom-0 z-10 safe-bottom">
          <button type="submit" className="w-full py-5 bg-primary hover:bg-indigo-500 text-white font-black uppercase tracking-[0.3em] rounded-2xl shadow-2xl shadow-primary/30 transition-all active:scale-95 flex items-center justify-center gap-3">
            <Check size={20} /> Confirmar Alarme
          </button>
        </div>
      </form>
    </div>
  );
};