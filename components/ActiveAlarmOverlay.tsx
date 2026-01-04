import React, { useEffect, useState } from 'react';
import { Alarm, AppSettings } from '../types';
import { BellOff, Timer, Volume2, Music, BatteryLow } from 'lucide-react';
import { audioService } from '../services/audioService';

interface ActiveAlarmOverlayProps {
  alarm: Alarm;
  settings: AppSettings;
  onDismiss: () => void;
  onSnooze: () => void;
}

export const ActiveAlarmOverlay: React.FC<ActiveAlarmOverlayProps> = ({ alarm, settings, onDismiss, onSnooze }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const uri = alarm.soundUri || 'classic';
    const vibrate = (alarm.vibrationEnabled ?? true) && !settings.disableHaptics;
    const pattern = alarm.vibrationPattern || 'continuous';
    const vol = alarm.volume ?? 0.8;
    const fade = alarm.fadeDurationSeconds ?? 0;
    
    audioService.startAlarm(uri, vibrate, pattern, vol, fade);
    
    const timer = setInterval(() => {
      setTime(new Date());
      if (document.hidden) {
        document.title = document.title === "CRONOS: ALARME!" ? "⏰ TOCANDO..." : "CRONOS: ALARME!";
      } else {
        document.title = "Cronos - Despertador Inteligente";
      }
    }, 1000);

    const duration = (alarm.durationSeconds || 300) * 1000;
    const autoStopTimer = setTimeout(() => onDismiss(), duration);

    return () => {
      audioService.stopAlarm();
      clearInterval(timer);
      clearTimeout(autoStopTimer);
      document.title = "Cronos - Despertador Inteligente";
    };
  }, [alarm, onDismiss, settings.disableHaptics]);

  const formatSecondsLabel = (s: number) => {
    if (s < 60) return `${s} seg`;
    const m = Math.floor(s / 60);
    const rs = s % 60;
    return rs > 0 ? `${m}m ${rs}s` : `${m} min`;
  };

  const pulseIntensity = alarm.volume || 0.8;
  const isEcoMode = settings.lowFiUI || settings.batterySaver;

  return (
    <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black overflow-hidden ${isEcoMode ? '' : 'backdrop-blur-xl'}`}>
      
      {/* Dynamic Reactive Blur Layer - Disabled in Eco Mode */}
      {!isEcoMode && (
        <div 
          className="absolute inset-0 pointer-events-none flex items-center justify-center"
          style={{
            filter: `blur(${100 * pulseIntensity}px)`,
            opacity: 0.3 + (pulseIntensity * 0.2)
          }}
        >
          <div 
            className="w-[80vw] h-[80vw] bg-primary rounded-full animate-ping"
            style={{ 
              animationDuration: `${2 - (pulseIntensity * 1.5)}s`,
              transform: `scale(${1 + pulseIntensity})` 
            }} 
          />
          <div 
            className="absolute w-[60vw] h-[60vw] bg-secondary rounded-full animate-pulse opacity-50"
            style={{ animationDuration: '3s' }}
          />
        </div>
      )}

      {/* Eco Mode Indicator */}
      {isEcoMode && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-yellow-500/50 text-[10px] font-black uppercase tracking-widest">
          <BatteryLow size={12} /> Economia de Bateria Ativa
        </div>
      )}

      <div className="text-center space-y-12 p-8 max-w-md w-full relative z-10">
        <div className="space-y-4">
          <div className="flex justify-center">
             <div className={`p-6 rounded-full bg-slate-800 border-4 border-primary/20 ${!isEcoMode && alarm.vibrationEnabled ? 'animate-pulse' : ''}`}>
               <Music className="w-12 h-12 text-primary" />
             </div>
          </div>
          <div className={`flex items-center justify-center gap-2 text-primary ${!isEcoMode ? 'animate-bounce' : ''}`}>
            <Volume2 size={16} />
            <span className="text-xs font-black uppercase tracking-tighter">Tocando: {alarm.soundName}</span>
          </div>
          <h1 className="text-5xl font-black text-white drop-shadow-lg">{alarm.label || 'Bom dia!'}</h1>
          
          <div className="text-[106px] font-mono font-black text-white tracking-tighter leading-none drop-shadow-2xl">
            {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        <div className="flex flex-col gap-6 w-full mt-8">
          <button
            onClick={onDismiss}
            className="group relative flex items-center justify-center gap-4 w-full py-6 bg-white text-black rounded-3xl transition-all active:scale-95 shadow-2xl overflow-hidden"
          >
            {!isEcoMode && <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-10 transition-opacity" />}
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