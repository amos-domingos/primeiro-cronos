import React, { useState, useEffect } from 'react';
import { Plus, Settings, CheckCircle2 } from 'lucide-react';
import { Alarm, AppSettings } from './types';
import { checkAlarmCondition, getTimeUntilNextOccurrence } from './utils/alarmUtils';
import { AlarmList } from './components/AlarmList';
import { AlarmForm } from './components/AlarmForm';
import { ActiveAlarmOverlay } from './components/ActiveAlarmOverlay';

const STORAGE_KEY = 'cronos_alarms_v2';

const DEFAULT_SETTINGS: AppSettings = {
  batterySaver: false,
  disableWakeLock: false,
  lowFiUI: false,
  disableHaptics: false,
};

function App() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [settings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAlarm, setEditingAlarm] = useState<Alarm | null>(null);
  const [activeAlarm, setActiveAlarm] = useState<Alarm | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const storedAlarms = localStorage.getItem(STORAGE_KEY);
    if (storedAlarms) {
      try { setAlarms(JSON.parse(storedAlarms)); } catch (e) { console.error(e); }
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
    
    if (alarm.isEnabled) {
      setToastMessage(`Próximo em ${getTimeUntilNextOccurrence(alarm)}`);
      setTimeout(() => setToastMessage(null), 4000);
    }
    setIsFormOpen(false);
    setEditingAlarm(null);
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
      {/* Background Decorativo */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-indigo-900/10 rounded-full blur-[100px]" />
      </div>

      <header className="sticky top-0 z-40 glass safe-top">
        <div className="max-w-2xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-black tracking-[0.3em] text-primary uppercase">Cronos</span>
            <span className="text-4xl font-mono font-bold tracking-tighter">
              {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <button className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
            <Settings size={20} className="text-slate-400" />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-8 pb-32 z-10">
        <AlarmList 
          alarms={alarms} 
          onToggle={handleToggle} 
          onDelete={(id) => {
            const next = alarms.filter(a => a.id !== id);
            setAlarms(next);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          }} 
          onEdit={(a) => { setEditingAlarm(a); setIsFormOpen(true); }} 
        />
      </main>

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