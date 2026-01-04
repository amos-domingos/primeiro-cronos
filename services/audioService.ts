import { SoundType, VibrationPattern } from '../types';

class AudioService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private oscillatorInterval: number | null = null;
  private vibrationInterval: number | null = null;
  private audioScanner: HTMLAudioElement | null = null;
  private isPlaying: boolean = false;

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
    }
  }

  public startAlarm(
    type: SoundType = 'preset', 
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

    // Reset and Configure Gain (Volume)
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    
    if (fadeSeconds > 0) {
      this.masterGain.gain.setValueAtTime(0, now);
      this.masterGain.gain.linearRampToValueAtTime(volume, now + fadeSeconds);
    } else {
      this.masterGain.gain.setValueAtTime(volume, now);
    }

    // Handle Audio Source
    if (type === 'file' && uri) {
      this.playFile(uri);
    } else {
      this.playPreset(uri);
    }

    // Handle Vibration
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

  private playFile(uri: string) {
    try {
      this.audioScanner = new Audio(uri);
      this.audioScanner.loop = true;
      
      if (this.ctx && this.masterGain) {
        try {
          const source = this.ctx.createMediaElementSource(this.audioScanner);
          source.connect(this.masterGain);
        } catch (e) {
          // Fallback if already connected or other WebAudio issues
          console.warn("Could not connect audio element to master gain", e);
        }
      }

      this.audioScanner.play().catch(e => {
        console.error("Error playing audio file", e);
        this.playPreset('classic');
      });
    } catch (e) {
      this.playPreset('classic');
    }
  }

  private playPreset(presetId: string) {
    if (!this.ctx || !this.masterGain) return;

    const playTone = () => {
      if (!this.ctx || !this.masterGain || !this.isPlaying) return;
      const now = this.ctx.currentTime;

      if (presetId === 'birds') {
        const count = 3;
        for (let i = 0; i < count; i++) {
          const o = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          o.type = 'sine';
          const startTime = now + (i * 0.15);
          o.frequency.setValueAtTime(3000 + (Math.random() * 1000), startTime);
          o.frequency.exponentialRampToValueAtTime(4500 + (Math.random() * 500), startTime + 0.1);
          g.gain.setValueAtTime(0, startTime);
          g.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
          g.gain.linearRampToValueAtTime(0, startTime + 0.1);
          o.connect(g); g.connect(this.masterGain!);
          o.start(startTime); o.stop(startTime + 0.1);
        }
      } else if (presetId === 'rain') {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(100 + Math.random() * 50, now);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.3, now + 0.5);
        g.gain.linearRampToValueAtTime(0, now + 2);
        o.connect(g); g.connect(this.masterGain!);
        o.start(now); o.stop(now + 2);
      } else if (presetId === 'zen') {
        [220, 330, 440].forEach((freq, idx) => {
          const o = this.ctx!.createOscillator();
          const g = this.ctx!.createGain();
          o.type = 'sine';
          o.frequency.setValueAtTime(freq, now);
          g.gain.setValueAtTime(0, now);
          g.gain.linearRampToValueAtTime(0.2 / (idx + 1), now + 0.5);
          g.gain.linearRampToValueAtTime(0, now + 3);
          o.connect(g); g.connect(this.masterGain!);
          o.start(now); o.stop(now + 3);
        });
      } else if (presetId === 'lofi') {
        const notes = [261.63, 329.63, 392.00, 523.25];
        const freq = notes[Math.floor(Math.random() * notes.length)];
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(freq, now);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.2, now + 0.2);
        g.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
        o.connect(g); g.connect(this.masterGain!);
        o.start(now); o.stop(now + 1.5);
      } else if (presetId === 'digital') {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(1200, now);
        o.frequency.linearRampToValueAtTime(800, now + 0.1);
        g.gain.setValueAtTime(0.3, now);
        g.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        o.connect(g); g.connect(this.masterGain!);
        o.start(now); o.stop(now + 0.15);
      } else {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'square';
        o.frequency.setValueAtTime(880, now);
        o.frequency.exponentialRampToValueAtTime(440, now + 0.1);
        g.gain.setValueAtTime(0.5, now);
        g.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        o.connect(g); g.connect(this.masterGain!);
        o.start(now); o.stop(now + 0.5);
      }
    };

    playTone();
    let interval = 1000;
    if (presetId === 'digital') interval = 200;
    if (presetId === 'zen' || presetId === 'lofi' || presetId === 'rain') interval = 3000;
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
    if (this.audioScanner) {
      this.audioScanner.pause();
      this.audioScanner.currentTime = 0;
      this.audioScanner = null;
    }
  }
}

export const audioService = new AudioService();