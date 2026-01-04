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
      } else if (presetId === 'zen') {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(220, now);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.4, now + 1.5);
        g.gain.exponentialRampToValueAtTime(0.01, now + 4);
        o.connect(g); g.connect(this.masterGain!);
        o.start(now); o.stop(now + 4);
      } else if (presetId === 'ocean') {
        // Simulação de ondas com ruído rosa/branco modulado
        const bufferSize = this.ctx!.sampleRate * 2;
        const buffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        
        const noise = this.ctx!.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;
        
        const filter = this.ctx!.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, now);
        filter.frequency.exponentialRampToValueAtTime(1500, now + 2);
        filter.frequency.exponentialRampToValueAtTime(400, now + 4);
        
        const g = this.ctx!.createGain();
        g.gain.setValueAtTime(0.1, now);
        g.gain.linearRampToValueAtTime(0.5, now + 2);
        g.gain.linearRampToValueAtTime(0.1, now + 4);
        
        noise.connect(filter);
        filter.connect(g);
        g.connect(this.masterGain!);
        noise.start(now);
        noise.stop(now + 4.1);
      } else if (presetId === 'birds') {
        for (let i = 0; i < 3; i++) {
          const t = now + i * 0.3;
          const o = this.ctx!.createOscillator();
          const g = this.ctx!.createGain();
          o.type = 'sine';
          o.frequency.setValueAtTime(3000 + Math.random() * 1000, t);
          o.frequency.exponentialRampToValueAtTime(5000, t + 0.1);
          g.gain.setValueAtTime(0.2, t);
          g.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
          o.connect(g); g.connect(this.masterGain!);
          o.start(t); o.stop(t + 0.2);
        }
      } else if (presetId === 'emergency') {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(400, now);
        o.frequency.linearRampToValueAtTime(1000, now + 0.25);
        o.frequency.linearRampToValueAtTime(400, now + 0.5);
        g.gain.setValueAtTime(0.3, now);
        o.connect(g); g.connect(this.masterGain!);
        o.start(now); o.stop(now + 0.5);
      } else if (presetId === 'piano') {
        const freqs = [329.63, 392.00, 440.00, 523.25]; // E4, G4, A4, C5
        freqs.forEach((f, i) => {
          const t = now + i * 0.4;
          const o = this.ctx!.createOscillator();
          const g = this.ctx!.createGain();
          o.type = 'sine';
          o.frequency.setValueAtTime(f, t);
          g.gain.setValueAtTime(0.4, t);
          g.gain.exponentialRampToValueAtTime(0.01, t + 1);
          o.connect(g); g.connect(this.masterGain!);
          o.start(t); o.stop(t + 1);
        });
      } else if (presetId === 'retro_phone') {
        const playRing = (t: number) => {
          const o1 = this.ctx!.createOscillator();
          const o2 = this.ctx!.createOscillator();
          const g = this.ctx!.createGain();
          o1.type = 'square'; o2.type = 'square';
          o1.frequency.setValueAtTime(400, t);
          o2.frequency.setValueAtTime(450, t);
          g.gain.setValueAtTime(0.1, t);
          g.gain.setValueAtTime(0.1, t + 0.4);
          g.gain.setValueAtTime(0, t + 0.41);
          o1.connect(g); o2.connect(g); g.connect(this.masterGain!);
          o1.start(t); o1.stop(t + 0.5);
          o2.start(t); o2.stop(t + 0.5);
        };
        playRing(now);
        playRing(now + 0.6);
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
    switch (presetId) {
      case 'digital': interval = 200; break;
      case 'crystals': interval = 2000; break;
      case 'radar': interval = 800; break;
      case 'alvorada': interval = 1500; break;
      case 'zen': interval = 5000; break;
      case 'ocean': interval = 4000; break;
      case 'birds': interval = 3000; break;
      case 'emergency': interval = 500; break;
      case 'piano': interval = 3000; break;
      case 'retro_phone': interval = 2500; break;
      default: interval = 1000;
    }
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