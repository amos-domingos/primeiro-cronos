import { VibrationPattern } from '../types';

class AudioService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private oscillatorInterval: number | null = null;
  private vibrationInterval: number | null = null;
  private isPlaying: boolean = false;

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
    }
  }

  public startAlarm(
    uri: string = 'classic', 
    vibrate: boolean = false,
    pattern: VibrationPattern = 'continuous',
    volume: number = 0.8,
    fadeSeconds: number = 0
  ) {
    if (this.isPlaying) this.stopAlarm();
    this.isPlaying = true;

    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    
    if (fadeSeconds > 0) {
      this.masterGain.gain.setValueAtTime(0, now);
      this.masterGain.gain.linearRampToValueAtTime(volume, now + fadeSeconds);
    } else {
      this.masterGain.gain.setValueAtTime(volume, now);
    }

    this.playPreset(uri);

    if (vibrate) {
      this.startVibration(pattern);
    }
  }

  private startVibration(pattern: VibrationPattern) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      let vibratePattern: number[] = [500, 500];
      let intervalTime = 1000;

      switch (pattern) {
        case 'heartbeat': vibratePattern = [100, 100, 400, 400]; intervalTime = 1000; break;
        case 'rapid': vibratePattern = [100, 100]; intervalTime = 200; break;
        case 'staccato': vibratePattern = [50, 50, 50, 50, 50, 750]; intervalTime = 1000; break;
        case 'continuous': default: vibratePattern = [1000, 0]; intervalTime = 1000; break;
      }

      const runVibration = () => navigator.vibrate(vibratePattern);
      runVibration();
      this.vibrationInterval = window.setInterval(runVibration, intervalTime);
    }
  }

  public hapticFeedback(type: 'light' | 'medium' | 'heavy' = 'light') {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      const ms = type === 'light' ? 10 : type === 'medium' ? 30 : 60;
      navigator.vibrate(ms);
    }
  }

  private stopVibration() {
    if (this.vibrationInterval) {
      clearInterval(this.vibrationInterval);
      this.vibrationInterval = null;
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(0);
    }
  }

  private playPreset(presetId: string) {
    if (!this.ctx || !this.masterGain) return;

    const playTone = () => {
      if (!this.ctx || !this.masterGain || !this.isPlaying) return;
      const now = this.ctx.currentTime;

      if (presetId === 'radar') {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(1000, now);
        g.gain.setValueAtTime(0.5, now);
        g.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        o.connect(g); g.connect(this.masterGain!);
        o.start(now); o.stop(now + 0.2);
      } else if (presetId === 'crystals') {
        [523.25, 659.25, 783.99].forEach((f, i) => {
          const o = this.ctx!.createOscillator();
          const g = this.ctx!.createGain();
          o.type = 'sine';
          o.frequency.setValueAtTime(f, now + i * 0.1);
          g.gain.setValueAtTime(0, now + i * 0.1);
          g.gain.linearRampToValueAtTime(0.3, now + i * 0.1 + 0.05);
          g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.4);
          o.connect(g); g.connect(this.masterGain!);
          o.start(now + i * 0.1); o.stop(now + i * 0.1 + 0.4);
        });
      } else if (presetId === 'alvorada') {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(440, now);
        o.frequency.exponentialRampToValueAtTime(660, now + 0.8);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.3, now + 0.4);
        g.gain.linearRampToValueAtTime(0, now + 0.8);
        o.connect(g); g.connect(this.masterGain!);
        o.start(now); o.stop(now + 0.8);
      } else if (presetId === 'digital') {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'square';
        o.frequency.setValueAtTime(1200, now);
        g.gain.setValueAtTime(0.2, now);
        g.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        o.connect(g); g.connect(this.masterGain!);
        o.start(now); o.stop(now + 0.1);
      } else { // classic
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'square';
        o.frequency.setValueAtTime(880, now);
        g.gain.setValueAtTime(0.4, now);
        g.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        o.connect(g); g.connect(this.masterGain!);
        o.start(now); o.stop(now + 0.3);
      }
    };

    playTone();
    let interval = 1000;
    if (presetId === 'digital') interval = 200;
    if (presetId === 'crystals') interval = 2000;
    if (presetId === 'radar') interval = 800;
    if (presetId === 'alvorada') interval = 1500;
    this.oscillatorInterval = window.setInterval(playTone, interval);
  }

  public stopAlarm() {
    this.isPlaying = false;
    this.stopVibration();
    if (this.masterGain) {
      this.masterGain.gain.cancelScheduledValues(0);
      this.masterGain.gain.value = 0;
    }
    if (this.oscillatorInterval) {
      clearInterval(this.oscillatorInterval);
      this.oscillatorInterval = null;
    }
  }
}

export const audioService = new AudioService();