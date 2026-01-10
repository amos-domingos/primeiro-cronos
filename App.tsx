import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Settings, CheckCircle2, ShieldAlert, X, Smartphone, Download } from 'lucide-react';
import { Alarm, AppSettings } from './types';
import { checkAlarmCondition, getTimeUntilNextOccurrence } from './utils/alarmUtils';
import { AlarmList } from './components/AlarmList';
import { AlarmForm } from './components/AlarmForm';
import { ActiveAlarmOverlay } from './components/ActiveAlarmOverlay';
import { Switch } from './components/ui/Switch';

const STORAGE_KEY = 'cronos_alarms_v3';
const SETTINGS_KEY = 'cronos_settings';

const DEFAULT_SETTINGS: AppSettings = {
  batterySaver: false,
  disableWakeLock: false,
  lowFiUI: false,
  disableHaptics: false,
  volumeBoost: true
};

function App() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingAlarm, setEditingAlarm] = useState<Alarm | null>(null);
  const [activeAlarm, setActiveAlarm] = useState<Alarm | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lastSavedId, setLastSavedId] = useState<string | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(isPWA);

    const storedAlarms = localStorage.getItem(STORAGE_KEY);
    if (storedAlarms) {
      try { setAlarms(JSON.parse(storedAlarms)); } catch (e) { console.error(e); }
    }
    const storedSettings = localStorage.getItem(SETTINGS_KEY);
    if (storedSettings) {
      try { setSettings(JSON.parse(storedSettings)); } catch (e) { console.error(e); }
    }

    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      
      if (!activeAlarm && now.getSeconds() === 0) {
        const hour = now.getHours();
        const min = now.getMinutes();
        
        alarms.forEach(alarm => {
          if (!alarm.isEnabled) return;
          const [aH, aM] = alarm.time.split(':').map(Number);
          if (aH === hour && aM === min && checkAlarmCondition(alarm, now)) {
            setActiveAlarm(alarm);
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("CRONOS - ALERTA", {
                body: alarm.label || "Hora de acordar!",
                tag: "alarm-trigger",
                requireInteraction: true,
              });
            }
          }
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [alarms, activeAlarm]);

  const handleSaveAlarm = (alarm: Alarm) => {
    setAlarms(prev => {
      const exists = prev.find(a => a.id === alarm.id);
      const next = exists ? prev.map(a => a.id === alarm.id ? alarm : a) : [...prev, alarm];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    
    setLastSavedId(alarm.id);
    setTimeout(() => setLastSavedId(null), 3000);

    if (alarm.isEnabled) {
      setToastMessage(`Próximo em ${getTimeUntilNextOccurrence(alarm)}`);
      setTimeout(() => setToastMessage(null), 4000);
    }
    setIsFormOpen(false);
    setEditingAlarm(null);
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...newSettings };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleToggle = (id: string, val: boolean) => {
    setAlarms(prev => {
      const next = prev.map(a => a.id === id ? { ...a, isEnabled: val } : a);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col relative overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-indigo-900/10 rounded-full blur-[100px]" />
      </div>

      <header className="sticky top-0 z-40 glass safe-top">
        <div className="max-w-2xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[9px] font-black tracking-[0.2em] text-primary uppercase whitespace-nowrap">
              CRONOS <span className="text-slate-500 font-bold ml-1 opacity-70">by Amós Domingos</span>
            </span>
            <span className="text-4xl font-mono font-bold tracking-tighter">
              {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="flex gap-2">
            {!isStandalone && (
              <div className="hidden sm:flex items-center gap-2 px-4 bg-primary/20 text-primary rounded-2xl border border-primary/20 text-[10px] font-black uppercase tracking-widest">
                <Smartphone size={14} /> Modo PWA
              </div>
            )}
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <Settings size={20} className="text-slate-400" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-8 pb-32 z-10">
        {!isStandalone && (
          <div className="mb-8 p-6 bg-primary/10 border border-primary/20 rounded-[32px] flex items-center gap-5 animate-in slide-in-from-top-4">
             <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                <Download size={24} />
             </div>
             <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-primary">Dica de Instalação</h4>
                <p className="text-[10px] font-bold text-slate-400 mt-1 leading-relaxed">
                  Adicione o app à sua tela de início para ativar o despertador em tela cheia e offline.
                </p>
             </div>
          </div>
        )}

        <AlarmList 
          alarms={alarms} 
          lastSavedId={lastSavedId}
          onToggle={handleToggle} 
          onDelete={(id) => {
            const next = alarms.filter(a => a.id !== id);
            setAlarms(next);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          }} 
          onEdit={(a) => { setEditingAlarm(a); setIsFormOpen(true); }} 
        />
      </main>

      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in">
          <div className="bg-[#020617] w-full max-w-sm rounded-[40px] border border-white/10 shadow-2xl overflow-hidden flex flex-col">
             <div className="p-8 border-b border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                   <ShieldAlert className="text-primary" size={24} />
                   <h3 className="text-xl font-bold">Configurações</h3>
                </div>
                <button onClick={() => setIsSettingsOpen(false)} className="p-2 bg-white/5 rounded-full text-slate-400">
                   <X size={20} />
                </button>
             </div>
             <div className="p-8 space-y-8 overflow-y-auto max-h-[60vh] custom-scroll">
                <div className="space-y-6">
                   <Switch 
                     label="Sempre Ligado (Wake Lock)" 
                     checked={!settings.disableWakeLock} 
                     onChange={(val) => updateSettings({ disableWakeLock: !val })} 
                   />
                   <p className="text-[10px] text-slate-500 font-medium -mt-4">Mantém a tela acesa quando o alarme toca.</p>
                   
                   <Switch 
                     label="Volume Extra" 
                     checked={settings.volumeBoost} 
                     onChange={(val) => updateSettings({ volumeBoost: val })} 
                   />
                   
                   <Switch 
                     label="Modo Econômico" 
                     checked={settings.batterySaver} 
                     onChange={(val) => updateSettings({ batterySaver: val })} 
                   />
                   
                   <Switch 
                     label="Desativar Vibração" 
                     checked={settings.disableHaptics} 
                     onChange={(val) => updateSettings({ disableHaptics: val })} 
                   />
                </div>

                <div className="bg-primary/5 p-4 rounded-3xl border border-primary/10">
                   <p className="text-[10px] text-primary font-black uppercase tracking-widest leading-relaxed">
                     Para máxima precisão em testes, instale o app via navegador ou utilize o APK oficial.
                   </p>
                </div>
                
                <div className="text-center pt-2">
                   <p className="text-[9px] font-black uppercase text-slate-600 tracking-widest">
                     Desenvolvido por Amós Domingos
                   </p>
                </div>
             </div>
             <div className="p-8 bg-[#020617] border-t border-white/5">
                <button onClick={() => setIsSettingsOpen(false)} className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-2xl">Fechar</button>
             </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[100] w-full max-w-xs px-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="glass-dark border border-white/10 rounded-2xl p-4 flex items-center gap-3 shadow-2xl">
            <CheckCircle2 size={18} className="text-primary" />
            <p className="text-[11px] font-bold text-white uppercase tracking-tight">{toastMessage}</p>
          </div>
        </div>
      )}

      <div className="fixed bottom-10 left-0 right-0 flex justify-center z-40 pointer-events-none safe-bottom">
        <button 
          onClick={() => { setEditingAlarm(null); setIsFormOpen(true); }} 
          className="pointer-events-auto w-16 h-16 bg-primary hover:bg-indigo-500 text-white rounded-2xl shadow-[0_15px_40px_rgba(99,102,241,0.4)] flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        >
          <Plus size={32} />
        </button>
      </div>

      {isFormOpen && <AlarmForm initialData={editingAlarm} onSave={handleSaveAlarm} onCancel={() => { setIsFormOpen(false); setEditingAlarm(null); }} />}
      {activeAlarm && <ActiveAlarmOverlay alarm={activeAlarm} settings={settings} onDismiss={() => setActiveAlarm(null)} onSnooze={() => setActiveAlarm(null)} />}
    </div>
  );
}

export default App;