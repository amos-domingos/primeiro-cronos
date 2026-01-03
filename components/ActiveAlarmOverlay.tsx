import React, { useEffect, useState } from 'react';
import { Alarm } from '../types';
import { BellOff, Timer, Smartphone } from 'lucide-react';
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
    
    audioService.startAlarm(type, uri, vibrate, pattern);
    const timer = setInterval(() => setTime(new Date()), 1000);
    const autoStopTimer = setTimeout(() => onDismiss(), alarm.durationMinutes * 60 * 1000);

    return () => {
      audioService.stopAlarm();
      clearInterval(timer);
      clearTimeout(autoStopTimer);
    };
  }, [alarm, onDismiss]);

  // Determine pulse speed based on pattern
  const pulseClass = alarm.vibrationEnabled ? (
    alarm.vibrationPattern === 'rapid' ? 'animate-[pulse_0.2s_infinite]' :
    alarm.vibrationPattern === 'heartbeat' ? 'animate-[pulse_1s_infinite]' :
    alarm.vibrationPattern === 'staccato' ? 'animate-[pulse_0.5s_infinite]' :
    'animate-pulse'
  ) : '';

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md">
      {/* Visual Ripple Background */}
      {alarm.vibrationEnabled && (
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
          <div className={`w-96 h-96 bg-primary/20 rounded-full blur-3xl ${pulseClass}`} />
          <div className={`absolute w-[500px] h-[500px] bg-secondary/10 rounded-full blur-3xl delay-75 ${pulseClass}`} />
        </div>
      )}

      <div className="text-center space-y-8 p-6 max-w-md w-full relative z-10">
        <div className="space-y-2">
          <div className="flex justify-center mb-4">
             <div className={`p-4 rounded-full bg-slate-800 border-2 border-primary/50 ${pulseClass}`}>
               <Smartphone className="w-8 h-8 text-primary" />
             </div>
          </div>
          <h2 className="text-xl text-slate-400 uppercase tracking-widest font-semibold">Alarme</h2>
          <h1 className="text-4xl font-bold text-white mb-2">{alarm.label || 'Acordar!'}</h1>
          <div className="text-7xl font-mono font-bold text-white">
            {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        <div className="flex flex-col gap-4 w-full">
          <button
            onClick={() => { audioService.hapticFeedback('heavy'); onDismiss(); }}
            className="flex items-center justify-center gap-3 w-full py-5 bg-red-600 hover:bg-red-500 text-white rounded-2xl transition-all active:scale-95 shadow-lg shadow-red-600/20"
          >
            <BellOff className="w-6 h-6" />
            <span className="text-xl font-black uppercase italic">Desligar</span>
          </button>

          {alarm.snoozeEnabled && (
            <button
              onClick={() => { audioService.hapticFeedback('medium'); onSnooze(); }}
              className="flex items-center justify-center gap-3 w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-2xl transition-all active:scale-95"
            >
              <Timer className="w-6 h-6" />
              <span className="text-lg font-bold">Soneca ({alarm.snoozeMinutes} min)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};