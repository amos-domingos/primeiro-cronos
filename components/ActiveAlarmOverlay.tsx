import React, { useEffect, useState } from 'react';
import { Alarm, AppSettings } from '../types';
import { BellOff, Timer, Volume2, Music, AlertCircle, Smartphone } from 'lucide-react';
import { audioService } from '../services/audioService';

interface ActiveAlarmOverlayProps {
  alarm: Alarm;
  settings: AppSettings;
  onDismiss: () => void;
  onSnooze: () => void;
}

export const ActiveAlarmOverlay: React.FC<ActiveAlarmOverlayProps> = ({ alarm, settings, onDismiss, onSnooze }) => {
  const [time, setTime] = useState(new Date());
  const [showVolumeHint, setShowVolumeHint] = useState(true);

  useEffect(() => {
    // Wake Lock: Tenta manter a tela ligada se habilitado nas configurações
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      if (settings.disableWakeLock) return;
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err: any) {
        console.error(`${err.name}, ${err.message}`);
      }
    };

    requestWakeLock();

    const uri = alarm.soundUri || 'classic';
    const vibrate = (alarm.vibrationEnabled ?? true) && !settings.disableHaptics;
    const pattern = alarm.vibrationPattern || 'heartbeat';
    const vol = alarm.volume ?? 1.0;
    const fade = alarm.fadeDurationSeconds ?? 0;
    
    // Inicia áudio com prioridade
    audioService.startAlarm(uri, vibrate, pattern, vol, fade);
    
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    // Auto-dismiss após a duração definida
    const duration = (alarm.durationSeconds || 300) * 1000;
    const autoStopTimer = setTimeout(() => onDismiss(), duration);

    // Esconde aviso de volume após 10s
    const hintTimer = setTimeout(() => setShowVolumeHint(false), 10000);

    return () => {
      audioService.stopAlarm();
      clearInterval(timer);
      clearTimeout(autoStopTimer);
      clearTimeout(hintTimer);
      if (wakeLock) {
        wakeLock.release().then(() => {
          wakeLock = null;
        });
      }
    };
  }, [alarm, onDismiss, settings.disableHaptics, settings.disableWakeLock]);

  const formatSecondsLabel = (s: number) => {
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const rs = s % 60;
    return rs > 0 ? `${m}m ${rs}s` : `${m}m`;
  };

  const isEcoMode = settings.lowFiUI || settings.batterySaver;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black overflow-hidden select-none">
      
      {/* Background Dinâmico de Alerta */}
      {!isEcoMode && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-primary/20 animate-pulse" />
          <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(99,102,241,0.2)_0%,transparent_70%)] animate-[spin_10s_linear_infinite]" />
        </div>
      )}

      {showVolumeHint && (
        <div className="absolute top-12 left-4 right-4 z-50 animate-in slide-in-from-top-4 duration-500">
           <div className="bg-yellow-500/90 backdrop-blur-md text-black px-6 py-4 rounded-3xl flex items-center gap-4 shadow-2xl">
              <AlertCircle size={28} className="shrink-0" />
              <div className="flex flex-col">
                <span className="font-black text-[10px] uppercase tracking-wider">Atenção</span>
                <p className="text-[11px] font-bold leading-tight opacity-90">Verifique se o volume de mídia do sistema está alto.</p>
              </div>
           </div>
        </div>
      )}

      <div className="text-center space-y-12 p-8 max-w-md w-full relative z-10">
        <div className="space-y-4">
          <div className="flex justify-center">
             <div className={`p-8 rounded-full bg-slate-800/80 border-4 border-primary/40 shadow-[0_0_50px_rgba(99,102,241,0.3)] ${!isEcoMode ? 'animate-bounce' : ''}`}>
               <Music className="w-16 h-16 text-primary" />
             </div>
          </div>
          
          <div className="flex flex-col gap-1">
             <h1 className="text-4xl font-black text-white uppercase tracking-tighter drop-shadow-lg">{alarm.label || 'HORA DE ACORDAR!'}</h1>
             <div className="flex items-center justify-center gap-2 text-slate-400 font-bold text-[10px] uppercase">
                <Volume2 size={12} /> Som: {alarm.soundName}
             </div>
          </div>
          
          <div className="text-[120px] font-mono font-black text-white tracking-tighter leading-none drop-shadow-2xl">
            {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        <div className="flex flex-col gap-6 w-full mt-8">
          <button
            onClick={onDismiss}
            className="group relative flex items-center justify-center gap-4 w-full py-8 bg-white text-black rounded-[40px] transition-all active:scale-95 shadow-[0_20px_60px_rgba(255,255,255,0.2)]"
          >
            <BellOff className="w-10 h-10" />
            <span className="text-3xl font-black uppercase italic tracking-tighter">DESLIGAR</span>
          </button>

          {alarm.snoozeEnabled && (
            <button
              onClick={onSnooze}
              className="flex items-center justify-center gap-3 w-full py-6 bg-slate-900/50 backdrop-blur-md text-slate-300 border border-slate-700/50 rounded-[40px] transition-all active:scale-95"
            >
              <Timer className="w-7 h-7" />
              <span className="text-xl font-black uppercase tracking-widest">Soneca ({formatSecondsLabel(alarm.snoozeSeconds)})</span>
            </button>
          )}
        </div>

        {(alarm.vibrationEnabled ?? true) && (
          <div className="flex items-center justify-center gap-2 text-primary/50 text-[10px] font-black uppercase animate-pulse">
            <Smartphone size={12} /> Vibração Ativa
          </div>
        )}
      </div>
    </div>
  );
};