import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Settings, Info, HardDrive, AlertTriangle, BellRing, Battery, BatteryLow, Zap, ZapOff, Mail } from 'lucide-react';
import { Alarm, SnoozeSession, AppSettings } from './types';
import { checkAlarmCondition, getTimeUntilNextOccurrence } from './utils/alarmUtils';
import { AlarmList } from './components/AlarmList';
import { AlarmForm } from './components/AlarmForm';
import { ActiveAlarmOverlay } from './components/ActiveAlarmOverlay';
import { Switch } from './components/ui/Switch';

const STORAGE_KEY = 'cronos_alarms_v2';
const SNOOZE_KEY = 'cronos_snoozes_v2';
const SETTINGS_KEY = 'cronos_app_settings';

const DEFAULT_SETTINGS: AppSettings = {
  batterySaver: false,
  disableWakeLock: false,
  lowFiUI: false,
  disableHaptics: false,
};

function App() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [snoozeSessions, setSnoozeSessions] = useState<SnoozeSession[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingAlarm, setEditingAlarm] = useState<Alarm | null>(null);
  const [activeAlarm, setActiveAlarm] = useState<Alarm | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [storageError, setStorageError] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  
  const wakeLockRef = useRef<any>(null);

  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        setNotificationsEnabled(true);
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          setNotificationsEnabled(permission === 'granted');
        });
      }
    }
  }, []);

  useEffect(() => {
    const storedAlarms = localStorage.getItem(STORAGE_KEY);
    const storedSnoozes = localStorage.getItem(SNOOZE_KEY);
    const storedSettings = localStorage.getItem(SETTINGS_KEY);
    
    if (storedAlarms) {
      try { setAlarms(JSON.parse(storedAlarms)); } catch (e) {}
    }

    if (storedSettings) {
      try { setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings) }); } catch (e) {}
    }

    if (storedSnoozes) {
      try {
        const parsedSnoozes: SnoozeSession[] = JSON.parse(storedSnoozes);
        const now = Date.now();
        const validSnoozes = parsedSnoozes.filter(s => s.snoozeUntil > now);
        setSnoozeSessions(validSnoozes);
      } catch (e) {}
    }
  }, []);

  // Lógica de Despertar Tela (Wake Up)
  useEffect(() => {
    if (activeAlarm) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      
      // Forçar Fullscreen para acordar a tela no Android APK
      try {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      } catch (e) {}

      // Solicitar Wake Lock para manter a tela ligada
      if (!settings.disableWakeLock && !settings.batterySaver) {
        requestWakeLock();
      }
      
      if (document.hidden && notificationsEnabled) {
        const n = new Notification("CRONOS BY Amós Domingos", {
          body: activeAlarm.label || "ALERTA: Hora de acordar!",
          icon: "/favicon.ico",
          tag: "alarm-active",
          requireInteraction: true,
          silent: false
        });
        n.onclick = () => {
          window.focus();
          n.close();
        };
      }
    } else {
      if (!isFormOpen && !isSettingsOpen) {
        document.body.style.overflow = 'auto';
        document.body.style.touchAction = 'auto';
      }
      releaseWakeLock();
      
      // Sair do fullscreen ao encerrar alarme
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }, [activeAlarm, notificationsEnabled, isFormOpen, isSettingsOpen, settings]);

  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        // Re-solicitar se a visibilidade mudar (proteção contra suspensão do Android)
        const handleVisibilityChange = async () => {
          if (wakeLockRef.current !== null && document.visibilityState === 'visible') {
            wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
          }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
      } catch (err) {
        console.error(`${err.name}, ${err.message}`);
      }
    }
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release().then(() => {
        wakeLockRef.current = null;
      });
    }
  };

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(alarms));
      setStorageError(false);
    } catch (e) { setStorageError(true); }
  }, [alarms]);

  useEffect(() => {
    localStorage.setItem(SNOOZE_KEY, JSON.stringify(snoozeSessions));
  }, [snoozeSessions]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      checkAlarms(now);
    }, 1000);
    return () => clearInterval(interval);
  }, [alarms, snoozeSessions, activeAlarm]);

  const checkAlarms = (now: Date) => {
    if (activeAlarm) return;
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentSecond = now.getSeconds();
    
    const activeSnoozeIndex = snoozeSessions.findIndex(s => s.snoozeUntil <= now.getTime());
    if (activeSnoozeIndex !== -1) {
      const session = snoozeSessions[activeSnoozeIndex];
      const alarm = alarms.find(a => a.id === session.alarmId);
      if (alarm) {
        setActiveAlarm(alarm);
        setSnoozeSessions(snoozeSessions.filter((_, i) => i !== activeSnoozeIndex));
        return;
      }
    }

    if (currentSecond === 0) {
      alarms.forEach(alarm => {
        if (!alarm.isEnabled) return;
        const [aHour, aMinute] = alarm.time.split(':').map(Number);
        if (aHour === currentHour && aMinute === currentMinute) {
          if (checkAlarmCondition(alarm, now)) setActiveAlarm(alarm);
        }
      });
    }
  };

  const handleSaveAlarm = useCallback((alarm: Alarm) => {
    setAlarms(prev => {
      const exists = prev.find(a => a.id === alarm.id);
      if (exists) return prev.map(a => a.id === alarm.id ? alarm : a);
      return [...prev, alarm];
    });
    
    if (alarm.isEnabled) {
      const timeRemaining = getTimeUntilNextOccurrence(alarm);
      setToastMessage(`Alarme salvo! Toca em ${timeRemaining}`);
      setTimeout(() => setToastMessage(null), 4000);
    }

    setIsFormOpen(false);
    setEditingAlarm(null);
  }, []);

  const handleToggleAlarm = useCallback((id: string, enabled: boolean) => {
    setAlarms(prev => {
      const updated = prev.map(a => a.id === id ? { ...a, isEnabled: enabled } : a);
      if (enabled) {
        const alarm = updated.find(a => id === a.id);
        if (alarm) {
          const timeRemaining = getTimeUntilNextOccurrence(alarm);
          setToastMessage(`Reativado! Toca em ${timeRemaining}`);
          setTimeout(() => setToastMessage(null), 4000);
        }
      } else {
        setSnoozeSessions(prevSnoozes => prevSnoozes.filter(s => s.alarmId !== id));
      }
      return updated;
    });
  }, []);

  const handleDismiss = useCallback(() => setActiveAlarm(null), []);

  const handleSnooze = useCallback(() => {
    setActiveAlarm(prevActive => {
      if (prevActive) {
        const snoozeDuration = (prevActive.snoozeSeconds || 300) * 1000;
        setSnoozeSessions(prev => [...prev, { alarmId: prevActive.id, snoozeUntil: Date.now() + snoozeDuration }]);
      }
      return null;
    });
  }, []);

  const handleDeleteAlarm = useCallback((id: string) => {
    setAlarms(prev => prev.filter(a => a.id !== id));
  }, []);

  const handleEditAlarm = useCallback((alarm: Alarm) => {
    setEditingAlarm(alarm);
    setIsFormOpen(true);
  }, []);

  const toggleSetting = (key: keyof AppSettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSendSuggestion = () => {
    const email = "amosdomingos@gmail.com";
    const subject = encodeURIComponent("Sugestão - App Cronos");
    const body = encodeURIComponent("Olá Amós, tenho uma sugestão para o Cronos:\n\n");
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  return (
    <div className={`min-h-screen bg-dark text-slate-100 font-sans pb-20 transition-opacity duration-1000 ${settings.batterySaver ? 'opacity-90' : 'opacity-100'}`}>
      <header className="sticky top-0 z-30 bg-dark/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xs font-black tracking-widest text-primary uppercase">CRONOS BY Amós Domingos</h1>
                {settings.batterySaver && (
                  <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-500 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border border-yellow-500/20">
                    <BatteryLow size={8} /> Modo Eco
                  </div>
                )}
              </div>
              <div className="text-3xl font-mono font-bold text-white leading-none">
                {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                <span className="text-sm text-slate-500 ml-2 font-sans font-normal">
                  {currentTime.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {!notificationsEnabled && 'Notification' in window && (
                <button 
                  onClick={() => Notification.requestPermission().then(p => setNotificationsEnabled(p === 'granted'))}
                  className="p-2 text-secondary hover:bg-secondary/10 rounded-full animate-pulse"
                >
                  <BellRing size={20} />
                </button>
              )}
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className={`p-2 rounded-full transition-colors ${isSettingsOpen ? 'bg-primary text-white' : 'text-slate-400 hover:bg-slate-800'}`}
              >
                <Settings size={22} />
              </button>
            </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {storageError && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-xs font-medium animate-pulse">
            <AlertTriangle size={18} />
            Memória cheia! Tente remover alarmes antigos.
          </div>
        )}

        <AlarmList alarms={alarms} onToggle={handleToggleAlarm} onDelete={handleDeleteAlarm} onEdit={handleEditAlarm} />
      </main>

      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 w-full max-w-xs px-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-surface/90 backdrop-blur-lg border border-primary/30 shadow-xl rounded-2xl p-4 flex items-start gap-3">
            <div className="bg-primary/20 p-2 rounded-lg text-primary"><Info size={18} /></div>
            <p className="text-sm text-slate-100 font-medium leading-tight pt-0.5">{toastMessage}</p>
          </div>
        </div>
      )}

      {/* Botão Flutuante Add */}
      {!isSettingsOpen && (
        <div className="fixed bottom-8 right-8 z-30">
          <button
            onClick={() => { setEditingAlarm(null); setIsFormOpen(true); }}
            className="bg-primary hover:bg-indigo-500 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95"
          >
            <Plus size={32} />
          </button>
        </div>
      )}

      {/* Modal de Configurações de Bateria/Sistema */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface w-full max-w-md rounded-3xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Battery className="text-primary" size={20} />
                <h2 className="text-xl font-bold text-white">Sistema & Energia</h2>
              </div>
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-white p-2">
                <ZapOff size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto custom-scroll">
              <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl">
                <Switch 
                  label="Economia de Bateria" 
                  checked={settings.batterySaver} 
                  onChange={() => toggleSetting('batterySaver')} 
                />
                <p className="text-[10px] text-slate-500 mt-2 leading-tight">
                  Ativa automaticamente todas as opções abaixo para maximizar a duração da bateria.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <Switch 
                  label="Desativar Wake Lock" 
                  checked={settings.disableWakeLock || settings.batterySaver} 
                  onChange={() => !settings.batterySaver && toggleSetting('disableWakeLock')} 
                />
                <p className="text-[10px] text-slate-500 leading-tight">Permite que a tela apague durante o disparo do alarme. Economiza muita energia, mas exige atenção às notificações.</p>
                
                <Switch 
                  label="Interface Simplificada" 
                  checked={settings.lowFiUI || settings.batterySaver} 
                  onChange={() => !settings.batterySaver && toggleSetting('lowFiUI')} 
                />
                <p className="text-[10px] text-slate-500 leading-tight">Remove animações, efeitos de brilho e desfoques pesados para reduzir uso de GPU.</p>

                <Switch 
                  label="Reduzir Vibrações" 
                  checked={settings.disableHaptics || settings.batterySaver} 
                  onChange={() => !settings.batterySaver && toggleSetting('disableHaptics')} 
                />
                <p className="text-[10px] text-slate-500 leading-tight">Desativa efeitos táteis na interface para poupar o motor de vibração.</p>
              </div>

              {/* Seção de Feedback */}
              <div className="pt-6 border-t border-slate-700">
                <h3 className="text-[10px] font-black uppercase text-slate-500 mb-3 tracking-widest">Suporte e Feedback</h3>
                <button 
                  onClick={handleSendSuggestion}
                  className="w-full p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl flex items-center gap-4 transition-all active:scale-95 text-left group"
                >
                  <div className="p-2 bg-primary/10 rounded-xl text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <Mail size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Enviar Sugestão</div>
                    <div className="text-[10px] text-slate-400">amosdomingos@gmail.com</div>
                  </div>
                </button>
              </div>

              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="w-full py-4 bg-primary text-white font-bold rounded-2xl mt-4 flex-shrink-0"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {isFormOpen && (
        <AlarmForm
          initialData={editingAlarm}
          onSave={handleSaveAlarm}
          onCancel={() => { setIsFormOpen(false); setEditingAlarm(null); }}
        />
      )}

      {activeAlarm && (
        <ActiveAlarmOverlay 
          alarm={activeAlarm} 
          settings={settings}
          onDismiss={handleDismiss} 
          onSnooze={handleSnooze} 
        />
      )}
    </div>
  );
}

export default App;