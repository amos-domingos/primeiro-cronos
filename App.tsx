import React, { useState, useEffect, useCallback } from 'react';
import { Plus, ArrowLeft, Info, HardDrive, AlertTriangle } from 'lucide-react';
import { Alarm, SnoozeSession } from './types';
import { checkAlarmCondition, getTimeUntilNextOccurrence } from './utils/alarmUtils';
import { AlarmList } from './components/AlarmList';
import { AlarmForm } from './components/AlarmForm';
import { ActiveAlarmOverlay } from './components/ActiveAlarmOverlay';

const STORAGE_KEY = 'cronos_alarms_v2';
const SNOOZE_KEY = 'cronos_snoozes_v2';

function App() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [snoozeSessions, setSnoozeSessions] = useState<SnoozeSession[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAlarm, setEditingAlarm] = useState<Alarm | null>(null);
  const [activeAlarm, setActiveAlarm] = useState<Alarm | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    const storedAlarms = localStorage.getItem(STORAGE_KEY);
    const storedSnoozes = localStorage.getItem(SNOOZE_KEY);
    
    if (storedAlarms) {
      try { setAlarms(JSON.parse(storedAlarms)); } catch (e) {}
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

  useEffect(() => {
    if (isFormOpen || activeAlarm) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = 'auto';
      document.body.style.touchAction = 'auto';
    }
  }, [isFormOpen, activeAlarm]);

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

  return (
    <div className="min-h-screen bg-dark text-slate-100 font-sans pb-20">
      <header className="sticky top-0 z-30 bg-dark/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xs font-black tracking-widest text-primary uppercase">Cronos</h1>
                <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border border-emerald-500/20">
                  <HardDrive size={8} /> Salvo Localmente
                </div>
              </div>
              <div className="text-3xl font-mono font-bold text-white leading-none">
                {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                <span className="text-sm text-slate-500 ml-2 font-sans font-normal">
                  {currentTime.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>
            
            <button className="p-2 rounded-full hover:bg-slate-800 text-slate-400 relative active:scale-90">
              <ArrowLeft size={24} />
              {storageError && <div className="absolute top-0 right-0 bg-red-500 rounded-full w-2 h-2 animate-ping" />}
            </button>
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
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-xs px-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-surface/90 backdrop-blur-lg border border-primary/30 shadow-xl rounded-2xl p-4 flex items-start gap-3">
            <div className="bg-primary/20 p-2 rounded-lg text-primary"><Info size={18} /></div>
            <p className="text-sm text-slate-100 font-medium leading-tight pt-0.5">{toastMessage}</p>
          </div>
        </div>
      )}

      <div className="fixed bottom-8 right-8 z-30">
        <button
          onClick={() => { setEditingAlarm(null); setIsFormOpen(true); }}
          className="bg-primary hover:bg-indigo-500 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95"
        >
          <Plus size={32} />
        </button>
      </div>

      {isFormOpen && (
        <AlarmForm
          initialData={editingAlarm}
          onSave={handleSaveAlarm}
          onCancel={() => { setIsFormOpen(false); setEditingAlarm(null); }}
        />
      )}

      {activeAlarm && (
        <ActiveAlarmOverlay alarm={activeAlarm} onDismiss={handleDismiss} onSnooze={handleSnooze} />
      )}
    </div>
  );
}

export default App;