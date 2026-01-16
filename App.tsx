
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Alarm, AppSettings } from './types';
import { AlarmList } from './components/AlarmList';
import { AlarmForm } from './components/AlarmForm';
import { ActiveAlarmOverlay } from './components/ActiveAlarmOverlay';
import { checkAlarmCondition } from './utils/alarmUtils';

const STORAGE_KEY = 'cronos_v3_data';
const INSTALL_KEY = 'cronos_install_timestamp';

function App() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAlarm, setEditingAlarm] = useState<Alarm | null>(null);
  const [activeAlarm, setActiveAlarm] = useState<Alarm | null>(null);
  const [time, setTime] = useState(new Date());
  const [installDate, setInstallDate] = useState<number>(0);

  useEffect(() => {
    let storedInstall = localStorage.getItem(INSTALL_KEY);
    if (!storedInstall) {
      const now = Date.now();
      localStorage.setItem(INSTALL_KEY, now.toString());
      setInstallDate(now);
    } else {
      setInstallDate(parseInt(storedInstall));
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setAlarms(JSON.parse(saved));

    const timer = setInterval(() => {
      const now = new Date();
      setTime(now);
      
      const h = now.getHours().toString().padStart(2, '0');
      const m = now.getMinutes().toString().padStart(2, '0');
      const s = now.getSeconds();
      
      if (s === 0) {
        const currentAlarms: Alarm[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const toTrigger = currentAlarms.find(a => a.isEnabled && a.time === `${h}:${m}` && checkAlarmCondition(a, now));
        
        if (toTrigger) {
          if ((window as any).AndroidAlarm) {
             (window as any).AndroidAlarm.scheduleAlarm(Date.now(), toTrigger.label);
          }
          setActiveAlarm(toTrigger);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const isPremium = useMemo(() => {
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    return (Date.now() - installDate) < sevenDaysMs;
  }, [installDate]);

  const daysRemaining = useMemo(() => {
    const diff = 7 - Math.floor((Date.now() - installDate) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }, [installDate]);

  const handleSave = (alarm: Alarm) => {
    const next = alarms.find(a => a.id === alarm.id) 
      ? alarms.map(a => a.id === alarm.id ? alarm : a) 
      : [...alarms, alarm];
    setAlarms(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setIsFormOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#020617] text-white overflow-hidden">
      <header className="p-8 pb-4 space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500">Cronos Alarme</p>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase ${isPremium ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
            {isPremium ? <><ShieldCheck size={12}/> Trial: {daysRemaining}d</> : <><ShieldAlert size={12}/> Expirado</>}
          </div>
        </div>
        <h1 className="text-7xl font-mono font-bold tracking-tighter">
          {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </h1>
      </header>

      <main className="flex-1 p-6 pb-32 overflow-y-auto scrollbar-hide">
        <AlarmList 
          alarms={alarms} 
          onToggle={(id, val) => {
            const next = alarms.map(a => a.id === id ? { ...a, isEnabled: val } : a);
            setAlarms(next);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          }}
          onDelete={(id) => {
            const next = alarms.filter(a => a.id !== id);
            setAlarms(next);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          }}
          onEdit={(a) => { setEditingAlarm(a); setIsFormOpen(true); }}
        />
      </main>

      <div className="fixed bottom-10 left-8 z-40">
        <p className="text-[9px] font-black tracking-[0.2em] text-slate-700 uppercase italic">
          by Amós Domingos
        </p>
      </div>

      <button 
        onClick={() => { setEditingAlarm(null); setIsFormOpen(true); }}
        className="fixed bottom-10 right-10 w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl active:scale-95 transition-all z-50"
      >
        <Plus size={40} className="text-white" />
      </button>

      {isFormOpen && <AlarmForm initialData={editingAlarm} isPremium={isPremium} onSave={handleSave} onCancel={() => setIsFormOpen(false)} />}
      {activeAlarm && <ActiveAlarmOverlay alarm={activeAlarm} settings={{ batterySaver: false, disableWakeLock: false, lowFiUI: false, disableHaptics: false, volumeBoost: true }} onDismiss={() => setActiveAlarm(null)} onSnooze={() => setActiveAlarm(null)} />}
    </div>
  );
}

export default App;
