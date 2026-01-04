import React, { useEffect, useState } from 'react';
import { Alarm } from '../types';
import { BellOff, Timer, Volume2, Music } from 'lucide-react';
import { audioService } from '../services/audioService';

interface ActiveAlarmOverlayProps {
  alarm: Alarm;
  onDismiss: () => void;
  onSnooze: () => void;
}

export const ActiveAlarmOverlay: React.FC<ActiveAlarmOverlayProps> = ({ alarm, onDismiss, onSnooze }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const type = alarm.soundType || 'preset';
    const uri = alarm.soundUri || 'classic';
    const vibrate = alarm.vibrationEnabled ?? true;
    const pattern = alarm.vibrationPattern || 'continuous';
    const vol = alarm.volume ?? 0.8;
    const fade = alarm.fadeDurationSeconds ?? 0;
    
    audioService.startAlarm(type, uri, vibrate, pattern, vol, fade);
    
    const timer = setInterval(() => setTime(new Date()), 1000);
    const duration = (alarm.durationSeconds || 300) * 1000;
    const autoStopTimer = setTimeout(() => onDismiss(), duration);

    return () => {
      audioService.stopAlarm();
      clearInterval(timer);
      clearTimeout(autoStopTimer);
    };
  }, [alarm, onDismiss]);

  const formatSecondsLabel = (s: number) => {
    if (s < 60) return `${s} seg`;
    const m = Math.floor(s / 60);
    const rs = s % 60;
    return rs > 0 ? `${m}m ${rs}s` : `${m} min`;
  };

  const pulseClass = alarm.vibrationEnabled ? 'animate-pulse' : '';

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl">
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none opacity-30">
        <div className={`w-[500px] h-[500px] bg-primary/40 rounded-full blur-[120px] animate-pulse`} />
      </div>

      <div className="text-center space-y-12 p-8 max-w-md w-full relative z-10">
        <div className="space-y-4">
          <div className="flex justify-center">
             <div className={`p-6 rounded-full bg-slate-800 border-4 border-primary/20 ${pulseClass}`}>
               <Music className="w-12 h-12 text-primary" />
             </div>
          </div>
          <div className="flex items-center justify-center gap-2 text-primary animate-bounce">
            <Volume2 size={16} />
            <span className="text-xs font-black uppercase tracking-tighter">Tocando: {alarm.soundName}</span>
          </div>
          <h1 className="text-5xl font-black text-white">{alarm.label || 'Bom dia!'}</h1>
          <div className="text-8xl font-mono font-black text-white tracking-tighter">
            {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        <div className="flex flex-col gap-6 w-full">
          <button
            onClick={onDismiss}
            className="group relative flex items-center justify-center gap-4 w-full py-6 bg-white text-black rounded-3xl transition-all active:scale-95 shadow-2xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-10 transition-opacity" />
            <BellOff className="w-8 h-8" />
            <span className="text-2xl font-black uppercase italic tracking-tight">Desligar Alarme</span>
          </button>

          {alarm.snoozeEnabled && (
            <button
              onClick={onSnooze}
              className="flex items-center justify-center gap-3 w-full py-5 bg-slate-900 text-slate-400 border border-slate-800 rounded-3xl transition-all hover:text-white hover:border-slate-600 active:scale-95"
            >
              <Timer className="w-6 h-6" />
              <span className="text-xl font-bold">Soneca ({formatSecondsLabel(alarm.snoozeSeconds)})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};