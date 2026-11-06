'use client';

import { CharacterSpeaker, GameSettings } from './kabza-types';

const DEFAULT_SETTINGS: GameSettings = {
  menuMusicVolume: 0.55,
  gameplayMusicVolume: 0.5,
  sfxVolume: 0.75,
  voiceVolume: 0.85,
  commentaryVolume: 0.85,
  muted: false,
  voiceEnabled: true,
  matchDuration: 120,
  reducedMotion: false,
  showMinimap: true,
  graphicsQuality: 'high',
};

class KabzaAudioEngine {
  private ctx: AudioContext | null = null;
  private settings: GameSettings = { ...DEFAULT_SETTINGS };
  private musicMode: 'none' | 'menu' | 'gameplay' | 'rush' = 'none';
  private musicInterval: ReturnType<typeof setInterval> | null = null;
  private stepIndex = 0;
  private lastVoiceTime = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('kabza_settings_v1');
        if (saved) {
          this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
        }
      } catch {
        // ignore storage errors
      }
    }
  }

  public getSettings(): GameSettings {
    return { ...this.settings };
  }

  public updateSettings(partial: Partial<GameSettings>) {
    this.settings = { ...this.settings, ...partial };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('kabza_settings_v1', JSON.stringify(this.settings));
      } catch {
        // ignore
      }
    }
    if (this.settings.muted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public startMusic(mode: 'menu' | 'gameplay' | 'rush' | 'none') {
    if (this.musicMode === mode) return;
    this.stopMusic();
    this.musicMode = mode;
    if (mode === 'none') return;

    this.stepIndex = 0;
    const tempoMs = mode === 'menu' ? 240 : mode === 'rush' ? 145 : 185;

    this.musicInterval = setInterval(() => {
      if (this.settings.muted) return;
      const vol =
        mode === 'menu'
          ? this.settings.menuMusicVolume
          : this.settings.gameplayMusicVolume;
      if (vol <= 0.01) return;
      this.playMusicStep(mode, this.stepIndex, vol * 0.22);
      this.stepIndex = (this.stepIndex + 1) % 16;
    }, tempoMs);
  }

  public stopMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    this.musicMode = 'none';
  }

  private playMusicStep(mode: 'menu' | 'gameplay' | 'rush', step: number, gainLevel: number) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Indian folk-arcade scale (Kafi / Bhairavi inspired notes in Hz)
    const menuMelody = [261.6, 293.7, 311.1, 349.2, 392.0, 349.2, 311.1, 293.7, 261.6, 0, 392.0, 349.2, 311.1, 293.7, 261.6, 0];
    const gameMelody = [293.7, 349.2, 392.0, 440.0, 392.0, 349.2, 329.6, 293.7, 293.7, 392.0, 440.0, 523.3, 440.0, 392.0, 349.2, 329.6];
    const rushMelody = [329.6, 392.0, 440.0, 493.9, 523.3, 493.9, 440.0, 392.0, 349.2, 440.0, 523.3, 587.3, 523.3, 493.9, 440.0, 392.0];

    const notes = mode === 'menu' ? menuMelody : mode === 'rush' ? rushMelody : gameMelody;
    const freq = notes[step % notes.length];

    // Dholak / Tabla bass pulse on beats 0, 3, 6, 8, 11, 14
    if (step % 4 === 0 || step === 3 || step === 11) {
      const bassOsc = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bassOsc.type = 'triangle';
      const baseBass = step % 8 === 0 ? 110 : 146.8;
      bassOsc.frequency.setValueAtTime(baseBass, now);
      bassOsc.frequency.exponentialRampToValueAtTime(55, now + 0.11);

      bassGain.gain.setValueAtTime(gainLevel * 0.9, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      bassOsc.connect(bassGain);
      bassGain.connect(ctx.destination);
      bassOsc.start(now);
      bassOsc.stop(now + 0.12);
    }

    // Plucked sitar/synth lead
    if (freq > 0) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = mode === 'menu' ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(gainLevel * 0.65, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    }
  }

  public playSFX(
    type:
      | 'click'
      | 'hover'
      | 'start'
      | 'capture_small'
      | 'capture_large'
      | 'trail_step'
      | 'trail_cut'
      | 'eliminated'
      | 'respawn'
      | 'powerup'
      | 'countdown'
      | 'victory'
      | 'defeat'
      | 'draw'
  ) {
    if (this.settings.muted || this.settings.sfxVolume <= 0.01) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const vol = this.settings.sfxVolume * 0.35;

    switch (type) {
      case 'hover': {
        this.tone(ctx, 520, 580, 0.04, vol * 0.35, 'sine', now);
        break;
      }
      case 'click': {
        this.tone(ctx, 440, 660, 0.07, vol * 0.7, 'triangle', now);
        break;
      }
      case 'trail_step': {
        this.tone(ctx, 260, 310, 0.035, vol * 0.2, 'sine', now);
        break;
      }
      case 'capture_small': {
        this.tone(ctx, 392, 523.25, 0.12, vol * 0.85, 'triangle', now);
        this.tone(ctx, 523.25, 659.25, 0.16, vol * 0.85, 'triangle', now + 0.07);
        break;
      }
      case 'capture_large': {
        // Celebratory Indian dhol + chord fanfare
        const chord = [392, 493.88, 587.33, 783.99];
        chord.forEach((f, idx) => {
          this.tone(ctx, f, f * 1.02, 0.22, vol * 0.9, 'triangle', now + idx * 0.06);
        });
        break;
      }
      case 'trail_cut': {
        this.tone(ctx, 720, 140, 0.18, vol * 1.1, 'sawtooth', now);
        this.tone(ctx, 180, 55, 0.25, vol * 1.1, 'square', now + 0.04);
        break;
      }
      case 'eliminated': {
        this.tone(ctx, 340, 110, 0.28, vol * 0.95, 'sawtooth', now);
        break;
      }
      case 'respawn': {
        this.tone(ctx, 293.66, 440, 0.11, vol * 0.7, 'sine', now);
        this.tone(ctx, 440, 587.33, 0.15, vol * 0.7, 'sine', now + 0.08);
        break;
      }
      case 'powerup': {
        this.tone(ctx, 440, 660, 0.09, vol * 0.85, 'sine', now);
        this.tone(ctx, 660, 880, 0.14, vol * 0.85, 'triangle', now + 0.07);
        break;
      }
      case 'countdown': {
        this.tone(ctx, 660, 650, 0.09, vol * 0.75, 'sine', now);
        break;
      }
      case 'start': {
        this.tone(ctx, 440, 440, 0.1, vol * 0.8, 'triangle', now);
        this.tone(ctx, 554.37, 554.37, 0.1, vol * 0.8, 'triangle', now + 0.1);
        this.tone(ctx, 659.25, 880, 0.25, vol * 1.0, 'triangle', now + 0.2);
        break;
      }
      case 'victory': {
        const notes = [392, 493.88, 587.33, 783.99, 659.25, 783.99];
        notes.forEach((f, idx) => {
          this.tone(ctx, f, f, 0.18, vol * 0.95, 'triangle', now + idx * 0.11);
        });
        break;
      }
      case 'defeat': {
        const notes = [392, 369.99, 349.23, 311.13];
        notes.forEach((f, idx) => {
          this.tone(ctx, f, f * 0.96, 0.22, vol * 0.85, 'sawtooth', now + idx * 0.15);
        });
        break;
      }
      case 'draw': {
        this.tone(ctx, 440, 392, 0.2, vol * 0.8, 'triangle', now);
        this.tone(ctx, 392, 440, 0.2, vol * 0.8, 'triangle', now + 0.18);
        break;
      }
    }
  }

  private tone(
    ctx: AudioContext,
    startFreq: number,
    endFreq: number,
    duration: number,
    gainVal: number,
    type: OscillatorType,
    startTime: number
  ) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, startTime);
    if (startFreq !== endFreq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), startTime + duration);
    }
    gain.gain.setValueAtTime(gainVal, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
  }

  /**
   * Speaks a character dialogue line using Hindi Web Speech API synthesis (hi-IN)
   * with character-specific pitch/rate profiles, plus expressive synth murmur fallback.
   */
  public speakDialogue(speaker: CharacterSpeaker, text: string, force = false) {
    if (this.settings.muted || !this.settings.voiceEnabled) return;

    const isBrother = speaker === 'bade' || speaker === 'chhote';
    const channelVol = isBrother ? this.settings.voiceVolume : this.settings.commentaryVolume;
    if (channelVol <= 0.02) return;

    const now = Date.now();
    if (!force && now - this.lastVoiceTime < 1400) return;
    this.lastVoiceTime = now;

    // Play a short character-specific vocal cue chime
    const ctx = this.ensureContext();
    if (ctx) {
      const basePitch: Record<CharacterSpeaker, number> = {
        bade: 165,
        chhote: 275,
        dadi: 230,
        mummy: 290,
        sharma: 245,
        gupta: 215,
      };
      const f = basePitch[speaker];
      this.tone(ctx, f, f * 1.18, 0.08, channelVol * 0.16, 'triangle', ctx.currentTime);
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        if (force) {
          window.speechSynthesis.cancel();
        } else if (window.speechSynthesis.speaking) {
          return;
        }

        const utter = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        const hindiVoice =
          voices.find((v) => v.lang.toLowerCase().includes('hi-in')) ||
          voices.find((v) => v.lang.toLowerCase().includes('en-in')) ||
          voices[0];

        if (hindiVoice) {
          utter.voice = hindiVoice;
        }
        utter.lang = 'hi-IN';
        utter.volume = Math.min(1, Math.max(0, channelVol));

        // Character-specific pitch & cadence profiles
        switch (speaker) {
          case 'bade':
            utter.pitch = 0.76;
            utter.rate = 0.98;
            break;
          case 'chhote':
            utter.pitch = 1.24;
            utter.rate = 1.12;
            break;
          case 'dadi':
            utter.pitch = 0.88;
            utter.rate = 0.9;
            break;
          case 'mummy':
            utter.pitch = 1.18;
            utter.rate = 1.06;
            break;
          case 'sharma':
            utter.pitch = 1.08;
            utter.rate = 1.08;
            break;
          case 'gupta':
            utter.pitch = 1.0;
            utter.rate = 1.15;
            break;
        }

        window.speechSynthesis.speak(utter);
      } catch {
        // Fallback silently to subtitle-only if browser speech API errors
      }
    }
  }
}

export const kabzaAudio = new KabzaAudioEngine();
