
import React, { useState, useRef, useEffect } from 'react';
import { Alarm, AlarmType } from '../types';
import { generateId } from '../utils/alarmUtils';
import { X, Music, Smartphone, Lock, Upload, Check, Tag, Calendar, Bell, ChevronDown, ChevronUp } from 'lucide-react';
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
    { label: 'D', value: 0 },
    { label: 'S', value: 1 },
    { label: 'T', value: 2 },
    { label: 'Q', value: 3 },
    { label: 'Q', value: 4 },
    { label: 'S', value: 5 },
    { label: 'S', value: 6 },
  ];

  useEffect(() => {
    if ((window as any).AndroidAlarm?.getSystemRingtones) {
      (window as any).AndroidAlarm.getSystemRingtones();
    }

    const handleRingtonesLoaded = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) setSystemSounds(e.detail);
    };

    const handleSystemSound = (e: any) => {
      if (e.detail) setSound({ uri: e.detail.uri, name: e.detail.name });
    };

    window.addEventListener('systemRingtonesLoaded', handleRingtonesLoaded);
    window.addEventListener('systemSoundSelected', handleSystemSound);
    
    return () => {
      window.removeEventListener('systemRingtonesLoaded', handleRingtonesLoaded);
      window.removeEventListener('systemSoundSelected', handleSystemSound);
    };
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
      <form onSubmit={handleSubmit} className="bg-[#0b0f1a] w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] border-t sm:border border-white/10 p-8 space-y-6 shadow-2xl overflow-y-auto max-h-[95vh] scrollbar-hide">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <h2 className="text-xl font-black uppercase italic tracking-tighter text-white">Configurar Alarme</h2>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Ajuste personalizado CRONOS</span>
          </div>
          <button type="button" onClick={onCancel} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 active:scale-90 transition-all">
            <X size={20}/>
          </button>
        </div>

        {/* Nome do Alarme */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
            <Tag size={12}/> Nome do Alarme
          </label>
          <input 
            type="text"
            placeholder="Digite o nome deste alarme..."
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white placeholder:text-slate-700 focus:outline-none focus:border-indigo-500/50 transition-colors"
          />
        </div>

        {/* Hora */}
        <div className="flex justify-center py-2">
          <input 
            type="time" 
            required
            value={time} 
            onChange={(e) => setTime(e.target.value)}
            className="bg-transparent text-8xl font-mono font-bold text-indigo-500 focus:outline-none tracking-tighter"
          />
        </div>

        {/* Seção ALARMES (Dias e Escalas) */}
        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
            <Bell size={12}/> Alarmes
          </label>

          {/* Dias da Semana */}
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

          {/* Escalas (Atalhos) */}
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
                  !isPremium ? 'opacity-40 border-slate-800' : 'bg-white/5 border-indigo-500/20 active:bg-indigo-600'
                } ${type === AlarmType.SHIFT && interval === item.val ? 'bg-indigo-600 border-transparent shadow-lg shadow-indigo-600/20' : ''}`}
              >
                {item.label} {!isPremium && <Lock size={8} className="inline ml-0.5 text-amber-500"/>}
              </button>
            ))}
          </div>
        </div>

        {/* Sons (Lista Suspensa) */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
            Escolha o Som
          </label>
          
          <div className="bg-white/5 rounded-[32px] border border-white/10 overflow-hidden transition-all duration-300">
            {/* Botão Sons */}
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
                  <div className="text-sm font-bold text-white uppercase tracking-widest">Sons</div>
                  <div className="text-[10px] text-indigo-400 font-bold italic">{sound.name}</div>
                </div>
              </div>
              {showSoundList ? <ChevronUp className="text-slate-500"/> : <ChevronDown className="text-slate-500"/>}
            </button>

            {/* Lista suspensa de rolagem interna */}
            {showSoundList && (
              <div className="max-h-64 overflow-y-auto divide-y divide-white/5 scrollbar-hide border-t border-white/5 animate-in slide-in-from-top-4 duration-300">
                {/* Meus Sons */}
                <div 
                  onClick={() => fileInputRef.current?.click()} 
                  className="flex items-center gap-4 p-4 hover:bg-white/10 active:bg-indigo-600/20 cursor-pointer transition-colors"
                >
                  <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center text-indigo-400">
                    <Upload size={14} />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-black text-white uppercase tracking-tighter italic">Meus Sons</div>
                    <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest italic">Buscar no dispositivo</div>
                  </div>
                  {sound.uri.startsWith('custom_') && <Check size={16} className="text-indigo-500" />}
                </div>

                {/* Sons do Android */}
                {systemSounds.map((s, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => {
                      setSound({ uri: s.uri, name: s.name });
                      setShowSoundList(false);
                    }} 
                    className={`flex items-center gap-4 p-4 hover:bg-white/5 cursor-pointer transition-colors ${sound.uri === s.uri ? 'bg-indigo-600/10' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${sound.uri === s.uri ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-600'}`}>
                      <Smartphone size={14} />
                    </div>
                    <div className={`flex-1 text-xs ${sound.uri === s.uri ? 'text-white font-bold' : 'text-slate-400'}`}>
                      {s.name}
                    </div>
                    {sound.uri === s.uri && <Check size={16} className="text-indigo-500" />}
                  </div>
                ))}
              </div>
            )}
            <input type="file" ref={fileInputRef} hidden accept="audio/*" onChange={handleFileUpload} />
          </div>
        </div>

        {/* Duração e Soneca */}
        <div className={`grid grid-cols-2 gap-4 ${!isPremium ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="bg-white/5 rounded-[32px] p-5 border border-white/5 space-y-4">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Duração: <b className="text-indigo-400 font-mono text-sm">{duration}s</b></span>
            <input type="range" min="5" max="60" step="5" value={duration} onChange={(e) => setDuration(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
          </div>
          <div className="bg-white/5 rounded-[32px] p-5 border border-white/5 space-y-4">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Soneca: <b className="text-indigo-400 font-mono text-sm">{snooze === 0 ? 'OFF' : `${snooze}m`}</b></span>
            <input type="range" min="0" max="15" step="1" value={snooze} onChange={(e) => setSnooze(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
          </div>
        </div>

        <button type="submit" className="w-full py-6 bg-indigo-600 rounded-[32px] font-black uppercase italic tracking-[0.2em] text-lg shadow-2xl shadow-indigo-600/30 active:scale-95 transition-all text-white">
          SALVAR ALARME
        </button>
      </form>

      {/* Popup de Data */}
      {showDatePicker && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur-xl p-6">
          <div className="bg-[#0b0f1a] w-full max-w-sm rounded-[40px] p-8 border border-white/10 space-y-6 text-center animate-in zoom-in duration-300 shadow-3xl">
            <div className="w-20 h-20 bg-indigo-600/10 rounded-[30px] flex items-center justify-center text-indigo-500 mx-auto mb-4">
              <Calendar size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-white uppercase italic">Início do Plantão</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Selecione o primeiro dia da escala</p>
            </div>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-white/5 border border-indigo-500/30 rounded-2xl py-5 px-4 text-center text-indigo-400 font-mono font-bold focus:outline-none"
            />
            <button 
              onClick={() => setShowDatePicker(false)}
              className="w-full py-5 bg-indigo-600 rounded-3xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all"
            >
              DEFINIR INÍCIO
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
