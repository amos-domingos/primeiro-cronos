import { VibrationPattern } from '../types';
import { audioStorageService } from './audioStorageService';

class AudioService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private oscillatorInterval: number | null = null;
  private vibrationInterval: number | null = null;
  private customSource: AudioBufferSourceNode | null = null;
  private isPlaying: boolean = false;

  public initCtx() {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)({
          latencyHint: 'playback',
          sampleRate: 44100,
        });
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
      } catch (e) {
        console.error("Falha ao iniciar AudioContext", e);
      }
    }
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public async startAlarm(
    uri: string = 'classic', 
    vibrate: boolean = false,
    pattern: VibrationPattern = 'heartbeat',
    volume: number = 1.0,
    fadeSeconds: number = 0
  ) {
    if (this.isPlaying) this.stopAlarm();
    this.isPlaying = true;

    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    
    if (fadeSeconds > 0) {
      this.masterGain.gain.setValueAtTime(0, now);
      this.masterGain.gain.linearRampToValueAtTime(volume, now + fadeSeconds);
    } else {
      this.masterGain.gain.setValueAtTime(volume, now);
    }

    // Verifica se é um som nativo ou personalizado (IDs personalizados começam com 'custom_')
    if (uri.startsWith('custom_')) {
      await this.playCustomSound(uri);
    } else {
      this.playPreset(uri);
    }

    if (vibrate) {
      this.startVibration(pattern);
    }
  }

  private async playCustomSound(id: string) {
    if (!this.ctx || !this.masterGain) return;
    
    try {
      const blob = await audioStorageService.getSound(id);
      if (!blob) throw new Error("Áudio não encontrado no banco de dados.");

      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);

      this.customSource = this.ctx.createBufferSource();
      this.customSource.buffer = audioBuffer;
      this.customSource.loop = true;
      this.customSource.connect(this.masterGain);
      this.customSource.start(0);
    } catch (e) {
      console.error("Erro ao reproduzir som personalizado, voltando ao clássico:", e);
      this.playPreset('classic');
    }
  }

  private startVibration(pattern: VibrationPattern) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      let vibratePattern: number[] = [500, 500];
      let intervalTime = 1000;

      switch (pattern) {
        case 'heartbeat': vibratePattern = [100, 100, 400, 400]; intervalTime = 1000; break;
        case 'rapid': vibratePattern = [200, 100]; intervalTime = 300; break;
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
      const ms = type === 'light' ? 15 : type === 'medium' ? 40 : 80;
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
      if (this.ctx.state === 'suspended') this.ctx.resume();

      if (presetId === 'radar') {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(800, now);
        o.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
        g.gain.setValueAtTime(0.6, now);
        g.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        o.connect(g); g.connect(this.masterGain!);
        o.start(now); o.stop(now + 0.3);
      } else if (presetId === 'emergency') {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(400, now);
        o.frequency.linearRampToValueAtTime(1200, now + 0.2);
        o.frequency.linearRampToValueAtTime(400, now + 0.4);
        g.gain.setValueAtTime(0.4, now);
        o.connect(g); g.connect(this.masterGain!);
        o.start(now); o.stop(now + 0.4);
      } else if (presetId === 'digital') {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'square';
        o.frequency.setValueAtTime(1500, now);
        g.gain.setValueAtTime(0.3, now);
        g.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        o.connect(g); g.connect(this.masterGain!);
        o.start(now); o.stop(now + 0.1);
      } else if (presetId === 'alvorada') {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(440, now);
        o.frequency.exponentialRampToValueAtTime(880, now + 0.5);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.5, now + 0.25);
        g.gain.linearRampToValueAtTime(0, now + 0.5);
        o.connect(g); g.connect(this.masterGain!);
        o.start(now); o.stop(now + 0.5);
      } else if (presetId === 'retro_phone') {
        [440, 480].forEach(f => {
          const o = this.ctx!.createOscillator();
          const g = this.ctx!.createGain();
          o.type = 'sine';
          o.frequency.setValueAtTime(f, now);
          g.gain.setValueAtTime(0.2, now);
          g.gain.linearRampToValueAtTime(0.2, now + 0.4);
          g.gain.linearRampToValueAtTime(0, now + 0.45);
          o.connect(g); g.connect(this.masterGain!);
          o.start(now); o.stop(now + 0.5);
        });
      } else if (presetId === 'zen') {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(196, now); // G3
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.6, now + 2);
        g.gain.exponentialRampToValueAtTime(0.01, now + 5);
        o.connect(g); g.connect(this.masterGain!);
        o.start(now); o.stop(now + 5);
      } else { // classic beep
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'square';
        o.frequency.setValueAtTime(980, now);
        g.gain.setValueAtTime(0.5, now);
        g.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        o.connect(g); g.connect(this.masterGain!);
        o.start(now); o.stop(now + 0.2);
      }
    };

    playTone();
    let interval = 1000;
    switch (presetId) {
      case 'digital': interval = 250; break;
      case 'radar': interval = 600; break;
      case 'emergency': interval = 450; break;
      case 'zen': interval = 6000; break;
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
    if (this.customSource) {
      try { this.customSource.stop(); } catch(e) {}
      this.customSource = null;
    }
  }
}

export const audioService = new AudioService();