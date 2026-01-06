
import React, { useState, useEffect, useRef } from 'react';
import { Alarm, AlarmType } from '../types';
import { generateId } from '../utils/alarmUtils';
import { X, Repeat, Bell, Timer, Calendar, Check, Music, Volume2, Play, Square, Info, Tag, ShieldAlert, Settings2, BatteryWarning, Edit3, Type, ChevronDown, Music2, Headphones, FileAudio, Loader2 } from 'lucide-react';
import { Switch } from './ui/Switch';
import { audioService } from '../services/audioService';
import { audioStorageService } from '../services/audioStorageService';

interface AlarmFormProps {
  initialData?: Alarm | null;
  onSave: (alarm: Alarm) => void;
  onCancel: () => void;
}

const WEEK_DAYS = [
  { label: 'D', value: 0 }, { label: 'S', value: 1 }, { label: 'T', value: 2 },
  { label: 'Q', value: 3 }, { label: 'Q', value: 4 }, { label: 'S', value: 5 }, { label: 'S', value: 6 },
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
  'Estudar', 'Descanso', 'Jantar', 'Café', 'Pagar Conta', 'Mercado'
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
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  
  const [showLabelSelector, setShowLabelSelector] = useState(false);
  const [isTypingCustomLabel, setIsTypingCustomLabel] = useState(false);
  const [showPresetsList, setShowPresetsList] = useState(false);
  const [showPermissionGuide, setShowPermissionGuide] = useState(false);
  
  const customLabelInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => audioService.stopAlarm();
  }, []);

  useEffect(() => {
    if (isTypingCustomLabel && customLabelInputRef.current) {
      customLabelInputRef.current.focus();
    }
  }, [isTypingCustomLabel]);

  // Added missing toggleDay function
  const toggleDay = (day: number) => {
    setCustomDays(prev => {
      const next = prev.includes(day) 
        ? prev.filter(d => d !== day) 
        : [...prev, day].sort((a, b) => a - b);
      return next;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    try {
      const customId = `custom_${Date.now()}`;
      await audioStorageService.saveSound(customId, file);
      setSoundUri(customId);
      setSoundName(file.name.replace(/\.[^/.]+$/, ""));
      setShowPresetsList(false);
      audioService.hapticFeedback('medium');
    } catch (err) {
      console.error(err);
      alert("Erro ao carregar áudio.");
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handlePreview = (uri: string) => {
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
    if (type === AlarmType.DAILY && customDays.length < 7) finalType = AlarmType.CUSTOM;

    onSave({
      id: initialData?.id || generateId(),
      time, label, isEnabled: true, type: finalType,
      customDays: (type === AlarmType.SHIFT || type === AlarmType.ODD_DAYS || type === AlarmType.EVEN_DAYS) ? [0,1,2,3,4,5,6] : customDays,
      date: type === AlarmType.SHIFT ? startDate : undefined,
      intervalDays, durationSeconds, snoozeEnabled, snoozeSeconds,
      soundUri, soundName, volume, fadeDurationSeconds: 10, vibrationEnabled: true,
      vibrationPattern: 'continuous', lastStoppedDate: null
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/95 backdrop-blur-2xl p-0 sm:p-4">
      <form onSubmit={handleSubmit} className="bg-[#020617] w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] shadow-2xl border-t border-white/5 flex flex-col max-h-[95vh] overflow-hidden animate-in slide-in-from-bottom-10">
        
        <div className="px-8 py-6 flex justify-between items-center border-b border-white/5 bg-[#020617]/50 backdrop-blur-md z-10">
          <div>
            <span className="text-[10px] font-black text-primary tracking-[0.4em] uppercase">Cronos</span>
            <h2 className="text-xl font-bold tracking-tight">Editar Alarme</h2>
          </div>
          <button type="button" onClick={onCancel} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-10 custom-scroll pb-10">
          <div className="flex flex-col items-center">
            <input
              type="time" required value={time} onChange={(e) => setTime(e.target.value)}
              className="bg-transparent text-8xl font-mono font-bold text-white focus:outline-none text-center tracking-tighter w-full appearance-none"
            />
            
            <div className="mt-6 w-full relative px-4 flex flex-col items-center">
              <button type="button" onClick={() => setShowLabelSelector(true)} className="group flex flex-col items-center space-y-1 focus:outline-none">
                <div className="flex items-center gap-2 text-slate-400 group-hover:text-primary transition-colors">
                   <Tag size={12} />
                   <span className="text-[10px] font-black uppercase tracking-[0.2em]">Rótulo</span>
                </div>
                <div className="flex items-center gap-2">
                   <span className={`text-2xl font-bold transition-all duration-300 ${label ? 'text-white' : 'text-slate-700 italic'}`}>
                     {label || 'Sem Nome'}
                   </span>
                   <ChevronDown size={16} className="text-slate-600" />
                </div>
              </button>

              {showLabelSelector && (
                <div className="absolute top-full left-4 right-4 z-30 mt-4 bg-slate-900/95 backdrop-blur-3xl border border-white/10 rounded-[40px] p-6 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 flex flex-col max-h-[400px]">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Escolha um nome</h4>
                    <button type="button" onClick={() => { setShowLabelSelector(false); setIsTypingCustomLabel(false); }} className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-full text-slate-400"><X size={14} /></button>
                  </div>
                  <div className="overflow-y-auto custom-scroll space-y-2 pr-1 pb-2">
                    <div className={`transition-all duration-300 rounded-2xl overflow-hidden border ${isTypingCustomLabel ? 'bg-primary/10 border-primary ring-4 ring-primary/10 mb-4' : 'bg-white/5 border-transparent'}`}>
                       {!isTypingCustomLabel ? (
                          <button type="button" onClick={() => setIsTypingCustomLabel(true)} className="w-full text-left px-5 py-4 text-sm font-bold text-slate-300 flex items-center gap-3"><Edit3 size={16} className="text-primary" /> Digitar nome personalizado...</button>
                       ) : (
                          <div className="flex items-center px-4 py-3 gap-3">
                             <Type size={18} className="text-primary" /><input ref={customLabelInputRef} type="text" value={label} placeholder="Ex: Remédio" onChange={(e) => setLabel(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && setShowLabelSelector(false)} className="bg-transparent border-none focus:ring-0 p-0 text-white w-full font-bold" />
                             <button type="button" onClick={() => setShowLabelSelector(false)} className="p-2 bg-primary text-white rounded-xl"><Check size={16} /></button>
                          </div>
                       )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {LABEL_PRESETS.map((p) => (
                        <button key={p} type="button" onClick={() => { setLabel(p); setShowLabelSelector(false); }} className={`text-center px-2 py-4 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all border ${label === p ? 'bg-primary text-white border-primary shadow-lg' : 'bg-white/5 border-white/5 text-slate-400'}`}>{p}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <section className="bg-white/5 rounded-[32px] p-6 space-y-6 border border-white/5">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-primary tracking-widest"><Repeat size={14} /> Frequência</div>
            <div className="grid grid-cols-2 gap-2">
              {[{ label: 'Diário', value: AlarmType.DAILY }, { label: 'Plantão', value: AlarmType.SHIFT }, { label: 'Ímpares', value: AlarmType.ODD_DAYS }, { label: 'Pares', value: AlarmType.EVEN_DAYS }].map((opt) => (
                <button key={opt.value} type="button" onClick={() => setType(opt.value)} className={`py-4 rounded-2xl text-xs font-bold transition-all border ${type === opt.value ? 'bg-primary text-white border-primary shadow-lg' : 'bg-slate-900 text-slate-500 border-white/5'}`}>{opt.label}</button>
              ))}
            </div>
            
            {(type === AlarmType.DAILY || type === AlarmType.CUSTOM) && (
              <div className="pt-6 border-t border-white/5 flex justify-between px-1">
                {WEEK_DAYS.map((day) => (
                  <button key={day.value} type="button" onClick={() => toggleDay(day.value)} className={`w-10 h-10 rounded-full text-xs font-black transition-all ${customDays.includes(day.value) ? 'bg-primary text-white shadow-lg scale-110' : 'bg-slate-800 text-slate-600'}`}>{day.label}</button>
                ))}
              </div>
            )}
          </section>

          <section className="bg-white/5 rounded-[32px] p-6 space-y-8 border border-white/5">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-primary tracking-widest"><Headphones size={14} /> Toque e Volume</div>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" disabled={isProcessingFile} onClick={() => fileInputRef.current?.click()} className={`flex flex-col items-center justify-center p-6 rounded-[32px] border transition-all gap-3 ${soundUri.startsWith('custom_') ? 'bg-primary/20 border-primary' : 'bg-slate-900 border-white/5'}`}>
                {isProcessingFile ? <Loader2 size={24} className="animate-spin text-primary" /> : <Music2 size={24} className={soundUri.startsWith('custom_') ? 'text-primary' : 'text-slate-500'} />}
                <div className="text-center">
                  <span className={`text-[11px] font-black uppercase tracking-widest block ${soundUri.startsWith('custom_') ? 'text-white' : 'text-slate-400'}`}>Músicas</span>
                  <span className="text-[9px] text-slate-600 font-bold block mt-0.5">Explorar Arquivos</span>
                </div>
                <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFileChange} />
              </button>

              <button type="button" onClick={() => setShowPresetsList(!showPresetsList)} className={`flex flex-col items-center justify-center p-6 rounded-[32px] border transition-all gap-3 ${!soundUri.startsWith('custom_') ? 'bg-primary/20 border-primary' : 'bg-slate-900 border-white/5'}`}>
                <Bell size={24} className={!soundUri.startsWith('custom_') ? 'text-primary' : 'text-slate-500'} />
                <div className="text-center">
                  <span className={`text-[11px] font-black uppercase tracking-widest block ${!soundUri.startsWith('custom_') ? 'text-white' : 'text-slate-400'}`}>Sons</span>
                  <span className="text-[9px] text-slate-600 font-bold block mt-0.5">Sons do App</span>
                </div>
              </button>
            </div>

            <div className="flex items-center justify-between bg-slate-900/50 p-4 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0"><FileAudio size={16} /></div>
                <div className="overflow-hidden"><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Som Atual</span><span className="text-xs font-bold text-white truncate block">{soundName}</span></div>
              </div>
              <button type="button" onClick={() => handlePreview(soundUri)} className={`p-3 rounded-xl ${isPreviewing === soundUri ? 'bg-primary text-white scale-110 shadow-lg' : 'bg-white/5 text-slate-400'}`}>
                {isPreviewing === soundUri ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
              </button>
            </div>

            {showPresetsList && (
              <div className="bg-slate-900/80 backdrop-blur-md rounded-[28px] p-4 border border-white/10 animate-in slide-in-from-top-4">
                <div className="grid grid-cols-1 gap-1 max-h-[200px] overflow-y-auto custom-scroll">
                  {PRESET_SOUNDS.map((sound) => (
                    <button key={sound.id} type="button" onClick={() => { setSoundUri(sound.id); setSoundName(sound.name); }} className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${soundUri === sound.id ? 'bg-primary/20 text-white' : 'hover:bg-white/5 text-slate-500'}`}>
                      <span className="text-sm font-bold">{sound.name}</span>
                      {soundUri === sound.id && <Check size={14} className="text-primary" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 space-y-5">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-400 flex items-center gap-2 uppercase tracking-widest"><Volume2 size={14} className="text-primary"/> Volume</span>
                <span className="text-primary font-mono">{Math.round(volume * 100)}%</span>
              </div>
              <input type="range" min="0" max="1" step="0.05" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-full accent-primary h-1.5 bg-slate-800 rounded-lg appearance-none" />
            </div>
          </section>

          <section className="bg-white/5 rounded-[32px] p-6 space-y-8 border border-white/5">
            <div className="space-y-5">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-400 flex items-center gap-2 uppercase tracking-widest"><Bell size={14} className="text-primary"/> Duração do Toque</span>
                <span className="text-primary font-mono">{Math.floor(durationSeconds/60)}m</span>
              </div>
              <input type="range" min="60" max="1800" step="60" value={durationSeconds} onChange={(e) => setDurationSeconds(parseInt(e.target.value))} className="w-full accent-primary h-1.5 bg-slate-800 rounded-lg appearance-none" />
            </div>

            <div className="pt-6 border-t border-white/5 space-y-6">
              <Switch label="Ativar Soneca" checked={snoozeEnabled} onChange={setSnoozeEnabled} />
              {snoozeEnabled && (
                <div className="space-y-5 animate-in fade-in">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-400 flex items-center gap-2 uppercase tracking-widest"><Timer size={14} className="text-primary"/> Tempo Soneca</span>
                    <span className="text-primary font-mono">{Math.floor(snoozeSeconds/60)}m</span>
                  </div>
                  <input type="range" min="60" max="1200" step="60" value={snoozeSeconds} onChange={(e) => setSnoozeSeconds(parseInt(e.target.value))} className="w-full accent-primary h-1.5 bg-slate-800 rounded-lg appearance-none" />
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="p-8 bg-[#020617] border-t border-white/5 sticky bottom-0 z-10 safe-bottom">
          <button type="submit" className="w-full py-5 bg-primary hover:bg-indigo-500 text-white font-black uppercase tracking-[0.3em] rounded-2xl shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3">
            <Check size={20} /> Salvar Alarme
          </button>
        </div>
      </form>
    </div>
  );
};
