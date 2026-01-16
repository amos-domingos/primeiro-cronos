import React, { useState, useEffect } from 'react';
import { Plus, Settings, CheckCircle2, X } from 'lucide-react';
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

  useEffect(() => {
    const storedAlarms = localStorage.getItem(STORAGE_KEY);
    if (storedAlarms) {
      try { setAlarms(JSON.parse(storedAlarms)); } catch (e) { console.error(e); }
    }
    const storedSettings = localStorage.getItem(SETTINGS_KEY);
    if (storedSettings) {
      try { setSettings(JSON.parse(storedSettings)); } catch (e) { console.error(e); }
    }

    // Listener para quando o alarme disparar via nativo
    window.addEventListener('alarmTriggered', () => {
      // O Android já abriu a MainActivity, agora o React precisa identificar qual alarme é
      const now = new Date();
      const hour = now.getHours();
      const min = now.getMinutes();
      
      // Busca um alarme habilitado para este minuto
      const triggered = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]').find((a: Alarm) => {
        const [aH, aM] = a.time.split(':').map(Number);
        return a.isEnabled && aH === hour && aM === min;
      });

      if (triggered) setActiveAlarm(triggered);
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveAlarm = (alarm: Alarm) => {
    const updatedAlarms = alarms.find(a => a.id === alarm.id) 
      ? alarms.map(a => a.id === alarm.id ? alarm : a) 
      : [...alarms, alarm];
    
    setAlarms(updatedAlarms);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAlarms));
    
    // AGENDA NO ANDROID NATIVO
    if (alarm.isEnabled && (window as any).AndroidAlarm) {
      const [h, m] = alarm.time.split(':').map(Number);
      const nextDate = new Date();
      nextDate.setHours(h, m, 0, 0);
      
      // Se já passou o horário hoje, agenda para amanhã
      if (nextDate.getTime() <= Date.now()) {
        nextDate.setDate(nextDate.getDate() + 1);
      }
      
      // Chamada para o Kotlin
      (window as any).AndroidAlarm.scheduleAlarm(nextDate.getTime(), alarm.label || "Alarme Cronos");
    }

    setLastSavedId(alarm.id);
    setTimeout(() => setLastSavedId(null), 3000);

    if (alarm.isEnabled) {
      setToastMessage(`Próximo em ${getTimeUntilNextOccurrence(alarm)}`);
      setTimeout(() => setToastMessage(null), 4000);
    }
    setIsFormOpen(false);
    setEditingAlarm(null);
  };

  const handleToggle = (id: string, val: boolean) => {
    const next = alarms.map(a => a.id === id ? { ...a, isEnabled: val } : a);
    setAlarms(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    
    // Se ligou, reagenda o alarme no sistema
    if (val) {
      const alarm = next.find(a => a.id === id);
      if (alarm) handleSaveAlarm(alarm);
    }
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    const next = { ...settings, ...newSettings };
    setSettings(next);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  };

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col relative overflow-x-hidden selection:bg-primary/30">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <header className="sticky top-0 z-40 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5 safe-top">
        <div className="max-w-2xl mx-auto px-6 py-8 flex items-end justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black tracking-[0.3em] text-primary uppercase">
              CRONOS <span className="text-slate-500 font-bold opacity-60">by Amós Domingos</span>
            </span>
            <span className="text-5xl font-mono font-bold tracking-tighter text-white">
              {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <button onClick={() => setIsSettingsOpen(true)} className="w-14 h-14 flex items-center justify-center rounded-[24px] bg-white/5 border border-white/10 active:scale-90 transition-transform">
            <Settings size={24} className="text-slate-300" />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-8 pb-40 z-10">
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
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in">
          <div className="bg-[#0b1024] w-full max-w-md rounded-t-[40px] sm:rounded-[40px] border-t sm:border border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-bottom-10">
             <div className="p-8 flex justify-between items-center border-b border-white/5">
                <h3 className="text-2xl font-bold">Configurações</h3>
                <button onClick={() => setIsSettingsOpen(false)} className="p-3 bg-white/5 rounded-full text-slate-400"><X size={24} /></button>
             </div>
             <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh] custom-scroll">
                <Switch label="Sempre Ligado (Wake Lock)" checked={!settings.disableWakeLock} onChange={(val) => updateSettings({ disableWakeLock: !val })} />
                <Switch label="Volume Extra" checked={settings.volumeBoost} onChange={(val) => updateSettings({ volumeBoost: val })} />
                <Switch label="Vibração Tátil" checked={!settings.disableHaptics} onChange={(val) => updateSettings({ disableHaptics: !val })} />
                <div className="pt-6 border-t border-white/5 text-center">
                   <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.4em]">Versão de Testes 3.5</p>
                   <p className="text-[9px] font-bold text-primary mt-2 uppercase tracking-widest">Amós Domingos • Dev Sênior</p>
                </div>
             </div>
             <div className="p-8"><button onClick={() => setIsSettingsOpen(false)} className="w-full py-5 bg-primary text-white font-black uppercase tracking-widest rounded-[24px]">Concluído</button></div>
          </div>
        </div>
      )}

      <div className="fixed bottom-12 left-0 right-0 flex justify-center z-40 pointer-events-none safe-bottom">
        <button onClick={() => { setEditingAlarm(null); setIsFormOpen(true); }} className="pointer-events-auto w-20 h-20 bg-primary hover:bg-indigo-500 text-white rounded-[28px] shadow-[0_20px_50px_rgba(99,102,241,0.4)] flex items-center justify-center transition-all hover:scale-110 active:scale-90">
          <Plus size={40} strokeWidth={2.5} />
        </button>
      </div>

      {isFormOpen && <AlarmForm initialData={editingAlarm} onSave={handleSaveAlarm} onCancel={() => { setIsFormOpen(false); setEditingAlarm(null); }} />}
      {activeAlarm && <ActiveAlarmOverlay alarm={activeAlarm} settings={settings} onDismiss={() => setActiveAlarm(null)} onSnooze={() => setActiveAlarm(null)} />}
      
      {toastMessage && (
        <div className="fixed bottom-36 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-2">
          <div className="bg-slate-800 border border-white/10 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
             <CheckCircle2 size={18} className="text-primary" />
             <span className="text-xs font-bold text-white uppercase tracking-wider">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;