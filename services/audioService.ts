import { SoundType, VibrationPattern } from '../types';

class AudioService {
  private ctx: AudioContext | null = null;
  private oscillatorInterval: number | null = null;
  private vibrationInterval: number | null = null;
  private audioScanner: HTMLAudioElement | null = null;
  private isPlaying: boolean = false;

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  public startAlarm(
    type: SoundType = 'preset', 
    uri: string = 'classic', 
    vibrate: boolean = false,
    pattern: VibrationPattern = 'continuous'
  ) {
    if (this.isPlaying) this.stopAlarm();
    this.isPlaying = true;

    // Handle Audio
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
        case 'heartbeat':
          vibratePattern = [100, 100, 400, 400];
          intervalTime = 1000;
          break;
        case 'rapid':
          vibratePattern = [100, 100];
          intervalTime = 200;
          break;
        case 'staccato':
          vibratePattern = [50, 50, 50, 50, 50, 750];
          intervalTime = 1000;
          break;
        case 'continuous':
        default:
          vibratePattern = [1000, 0];
          intervalTime = 1000;
          break;
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
      this.audioScanner.play().catch(e => {
        console.error("Error playing audio file, falling back to preset", e);
        this.playPreset('classic');
      });
    } catch (e) {
      this.playPreset('classic');
    }
  }

  private playPreset(presetId: string) {
    this.initCtx();
    if (!this.ctx) return;
    
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const playTone = () => {
      if (!this.ctx || !this.isPlaying) return;
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      const now = this.ctx.currentTime;

      if (presetId === 'digital') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.linearRampToValueAtTime(800, now + 0.1);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (presetId === 'gentle') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.5, now + 0.5);
        gain.gain.linearRampToValueAtTime(0, now + 2);
        osc.start(now);
        osc.stop(now + 2);
      } else {
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.1);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
      }
    };

    playTone();
    let interval = 1000;
    if (presetId === 'digital') interval = 200;
    if (presetId === 'gentle') interval = 2500;
    this.oscillatorInterval = window.setInterval(playTone, interval);
  }

  public stopAlarm() {
    this.isPlaying = false;
    this.stopVibration();
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