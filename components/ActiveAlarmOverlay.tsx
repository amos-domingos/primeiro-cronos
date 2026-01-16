
import React, { useEffect, useState } from 'react';
import { Alarm, AppSettings } from '../types';
import { BellOff, Timer, Volume2, AlertCircle } from 'lucide-react';
import { audioService } from '../services/audioService';

interface ActiveAlarmOverlayProps {
  alarm: Alarm;
  settings: AppSettings;
  onDismiss: () => void;
  onSnooze: () => void;
}

export const ActiveAlarmOverlay: React.FC<ActiveAlarmOverlayProps> = ({ alarm, settings, onDismiss, onSnooze }) => {
  const [time, setTime] = useState(new Date());
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    // Tenta ligar a tela via WakeLock (Web API)
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {}
    };
    requestWakeLock();

    // Inicia o som e vibração
    const uri = alarm.soundUri || 'classic';
    const vibrate = (alarm.vibrationEnabled ?? true) && !settings.disableHaptics;
    audioService.startAlarm(uri, vibrate, alarm.vibrationPattern || 'heartbeat', alarm.volume, alarm.fadeDurationSeconds);
    
    const clockTimer = setInterval(() => setTime(new Date()), 1000);
    const pulseTimer = setInterval(() => setPulse(p => !p), 1000);

    // Auto-desligar após o tempo exato definido (DURAÇÃO)
    const durationMs = (alarm.durationSeconds || 30) * 1000;
    const autoStop = setTimeout(() => handleDismiss(), durationMs);

    return () => {
      audioService.stopAlarm();
      clearInterval(clockTimer);
      clearInterval(pulseTimer);
      clearTimeout(autoStop);
      if (wakeLock) wakeLock.release();
    };
  }, [alarm, settings]);

  const handleDismiss = () => {
    audioService.stopAlarm();
    if ((window as any).AndroidAlarm) {
      (window as any).AndroidAlarm.stopAlarmService();
    }
    onDismiss();
  };

  const handleSnooze = () => {
    // Segurança extra: se a soneca for 0, não faz nada
    if (!alarm.snoozeSeconds || alarm.snoozeSeconds <= 0) return;

    audioService.stopAlarm();
    if ((window as any).AndroidAlarm) {
      (window as any).AndroidAlarm.stopAlarmService();
      const snoozeMs = alarm.snoozeSeconds * 1000;
      const nextTime = Date.now() + snoozeMs;
      (window as any).AndroidAlarm.scheduleAlarm(nextTime, `Soneca: ${alarm.label}`);
    }
    onSnooze();
  };

  return (
    <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between py-16 px-6 transition-colors duration-500 ${pulse ? 'bg-red-950' : 'bg-black'}`}>
      <div className="text-center mt-10">
        <div className="flex items-center justify-center gap-2 mb-4">
          <AlertCircle className="text-red-500 animate-pulse" size={24} />
          <span className="text-red-500 font-black uppercase tracking-[0.3em] text-xs">Alarme Ativo</span>
        </div>
        <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">
          {alarm.label || 'ACORDAR!'}
        </h1>
        <div className="text-[120px] font-mono font-black text-white leading-none tracking-tighter">
          {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className="flex items-center justify-center gap-2 text-slate-500 mt-4">
          <Volume2 size={16} />
          <span className="text-sm font-bold">{alarm.soundName}</span>
        </div>
      </div>

      <div className="w-full max-w-sm space-y-6">
        {/* Só mostra o botão de soneca se o tempo for maior que 0 */}
        {alarm.snoozeSeconds > 0 && (
          <button
            onClick={handleSnooze}
            className="w-full py-8 bg-slate-900 border-2 border-slate-700 rounded-[40px] flex items-center justify-center gap-4 active:scale-95 transition-transform"
          >
            <Timer className="text-slate-400" size={32} />
            <span className="text-2xl font-black text-slate-300 uppercase italic">Soneca</span>
          </button>
        )}

        <button
          onClick={handleDismiss}
          className="w-full py-12 bg-white rounded-[50px] flex items-center justify-center gap-4 shadow-[0_0_50px_rgba(255,255,255,0.3)] active:scale-95 transition-transform"
        >
          <BellOff className="text-black" size={48} />
          <span className="text-4xl font-black text-black uppercase italic tracking-tighter">PARAR</span>
        </button>
      </div>

      <div className="text-slate-600 text-[10px] font-black uppercase tracking-widest animate-pulse">
        Desligamento automático em {alarm.durationSeconds} segundos
      </div>
    </div>
  );
};
