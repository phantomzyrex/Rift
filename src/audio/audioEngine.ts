/**
 * Rift Web Audio Synthesis Engine
 * Implements real-time dual-channel spatialized ambient soundscapes
 * (Left channel = Pristine World, Right channel = Decayed World)
 * and snaps into harmonic convergence upon puzzle realignment.
 *
 * Integrated with AudioEffectsManager for dynamic low-pass filters,
 * convolution reverb, waveshaper distortion, and pitch flutter
 * driven by the dimensional destabilization level.
 */

import { AudioEffectsManager, EffectParameters } from './audioEffectsManager';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private isInitialized = false;
  private isMuted = false;
  private isSplitEnabled = true;

  // Master Gain
  private masterGain: GainNode | null = null;

  // Spatial Panners
  private pristinePanner: StereoPannerNode | null = null;
  private decayedPanner: StereoPannerNode | null = null;
  private centerPanner: StereoPannerNode | null = null;

  // Audio Effects Manager
  private effectsManager: AudioEffectsManager | null = null;

  // Ambient Nodes
  private pristineAmbienceGain: GainNode | null = null;
  private decayedAmbienceGain: GainNode | null = null;
  private pristineOscs: OscillatorNode[] = [];
  private decayedOscs: OscillatorNode[] = [];
  private ambientInterval: number | null = null;

  // Cache current destabilization
  private currentDestabilization = 0;

  public init() {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master output
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.55, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Stereo panners for the dual realms
      this.pristinePanner = this.ctx.createStereoPanner();
      this.pristinePanner.pan.setValueAtTime(-0.88, this.ctx.currentTime);
      this.pristinePanner.connect(this.masterGain);

      this.decayedPanner = this.ctx.createStereoPanner();
      this.decayedPanner.pan.setValueAtTime(0.88, this.ctx.currentTime);
      this.decayedPanner.connect(this.masterGain);

      this.centerPanner = this.ctx.createStereoPanner();
      this.centerPanner.pan.setValueAtTime(0, this.ctx.currentTime);
      this.centerPanner.connect(this.masterGain);

      // Initialize the Audio Effects Manager
      this.effectsManager = new AudioEffectsManager(this.ctx);
      this.effectsManager.connectPristineTo(this.pristinePanner);
      this.effectsManager.connectDecayedTo(this.decayedPanner);

      // Apply any pending destabilization
      this.effectsManager.setDestabilization(this.currentDestabilization);

      // Start the dual ambient soundscapes
      this.startAmbientSoundscapes();

      this.isInitialized = true;
    } catch (e) {
      console.warn('Web Audio API initialization failed:', e);
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.55, this.ctx.currentTime, 0.05);
    }
  }

  public setStereoSplit(enabled: boolean) {
    this.isSplitEnabled = enabled;
    if (this.pristinePanner && this.decayedPanner && this.ctx) {
      const targetPristine = enabled ? -0.88 : 0;
      const targetDecayed = enabled ? 0.88 : 0;
      this.pristinePanner.pan.setTargetAtTime(targetPristine, this.ctx.currentTime, 0.1);
      this.decayedPanner.pan.setTargetAtTime(targetDecayed, this.ctx.currentTime, 0.1);
    }
  }

  public toggleMute(): boolean {
    this.init();
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getIsSplit(): boolean {
    return this.isSplitEnabled;
  }

  /**
   * Dynamically update audio effects based on destabilization (0 to 100)
   */
  public updateDestabilization(destabilization: number) {
    this.currentDestabilization = destabilization;
    if (this.effectsManager) {
      this.effectsManager.setDestabilization(destabilization);
    }

    // Dynamic detuning & flutter of ambient oscillators as timer runs out
    if (this.ctx && this.pristineOscs.length > 0) {
      const now = this.ctx.currentTime;
      const d = destabilization / 100;
      const detuneFactor = Math.pow(d, 1.8) * 45; // up to 45 cents detune

      this.pristineOscs.forEach((osc, idx) => {
        const baseDetune = (idx - 1) * 3;
        const drift = (Math.sin(now * 3 + idx) * detuneFactor);
        osc.detune.setTargetAtTime(baseDetune + drift, now, 0.1);
      });

      this.decayedOscs.forEach((osc, idx) => {
        const subDetune = -(d * 12); // frequency sinks lower as void collapses
        osc.detune.setTargetAtTime(subDetune, now, 0.1);
      });
    }
  }

  /**
   * Get telemetry of current audio effects
   */
  public getEffectParameters(): EffectParameters | null {
    if (this.effectsManager) {
      return this.effectsManager.getCurrentParameters();
    }
    return null;
  }

  private startAmbientSoundscapes() {
    if (!this.ctx || !this.effectsManager) return;

    // --- 1. Pristine Left Channel Ambience (Crystalline, ethereal, high sine hum) ---
    this.pristineAmbienceGain = this.ctx.createGain();
    this.pristineAmbienceGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    // Route through Pristine Effects Chain (Filter -> Distortion -> Reverb -> Panner)
    this.pristineAmbienceGain.connect(this.effectsManager.getPristineInput());

    // Pristine drone frequencies (E4, B4, E5 pure harmonic intervals)
    const pristineFreqs = [329.63, 493.88, 659.25];
    pristineFreqs.forEach((freq, idx) => {
      if (!this.ctx || !this.pristineAmbienceGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      // Subtle detune for shimmer
      osc.detune.setValueAtTime((idx - 1) * 3, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.3 / (idx + 1), this.ctx.currentTime);
      osc.connect(gain);
      gain.connect(this.pristineAmbienceGain);
      osc.start();
      this.pristineOscs.push(osc);
    });

    // --- 2. Decayed Right Channel Ambience (Industrial rumble, dark saw, filtered hum) ---
    this.decayedAmbienceGain = this.ctx.createGain();
    this.decayedAmbienceGain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    // Route through Decayed Effects Chain (Filter -> Distortion -> Reverb -> Panner)
    this.decayedAmbienceGain.connect(this.effectsManager.getDecayedInput());

    // Decayed sub frequencies (E1: 41.2Hz, B1: 61.74Hz, E2: 82.4Hz)
    const decayedFreqs = [41.2, 61.74, 82.4];
    decayedFreqs.forEach((freq, idx) => {
      if (!this.ctx || !this.decayedAmbienceGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = idx === 0 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.4 / (idx + 1), this.ctx.currentTime);
      osc.connect(gain);
      gain.connect(this.decayedAmbienceGain);
      osc.start();
      this.decayedOscs.push(osc);
    });

    // Periodic ambient generative events (pristine crystal wind & decayed iron groan)
    this.ambientInterval = window.setInterval(() => {
      if (this.isMuted || !this.ctx) return;
      const r = Math.random();
      if (r < 0.45) {
        this.triggerPristineChime();
      } else if (r < 0.9) {
        this.triggerDecayedGroan();
      }
    }, 4500);
  }

  /**
   * Delicate crystalline bell chime in left channel routed through effects manager
   */
  private triggerPristineChime() {
    if (!this.ctx || !this.effectsManager || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const pentatonicNotes = [659.25, 783.99, 987.77, 1046.5, 1318.51]; // E5, G5, B5, C6, E6
    const freq = pentatonicNotes[Math.floor(Math.random() * pentatonicNotes.length)];

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.09, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

    osc.connect(gain);
    gain.connect(this.effectsManager.getPristineInput());

    osc.start(now);
    osc.stop(now + 1.8);
  }

  /**
   * Deep structural iron groan / creak in right channel routed through effects manager
   */
  private triggerDecayedGroan() {
    if (!this.ctx || !this.effectsManager || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(55, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 2.2);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(180, now);
    filter.frequency.linearRampToValueAtTime(110, now + 2.2);
    filter.Q.setValueAtTime(5, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.07, now + 0.6);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.effectsManager.getDecayedInput());

    osc.start(now);
    osc.stop(now + 2.4);
  }

  /**
   * SFX: Footstep movement routed through effects manager
   */
  public playFootstep(world: 'pristine' | 'decayed') {
    if (!this.ctx || this.isMuted) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (world === 'pristine') {
      // Glassy, crisp marble step
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.08);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      const dest = this.effectsManager ? this.effectsManager.getPristineInput() : (this.pristinePanner || this.ctx.destination);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.09);
    } else {
      // Rusty metallic clunk step
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.11);

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

      osc.connect(gain);
      const dest = this.effectsManager ? this.effectsManager.getDecayedInput() : (this.decayedPanner || this.ctx.destination);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.12);
    }
  }

  /**
   * SFX: Block Pushed
   */
  public playPush(world: 'pristine' | 'decayed') {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (world === 'pristine') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.linearRampToValueAtTime(480, now + 0.18);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      const dest = this.effectsManager ? this.effectsManager.getPristineInput() : (this.pristinePanner || this.ctx.destination);
      gain.connect(dest);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.linearRampToValueAtTime(70, now + 0.24);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      const dest = this.effectsManager ? this.effectsManager.getDecayedInput() : (this.decayedPanner || this.ctx.destination);
      gain.connect(dest);
    }

    osc.start(now);
    osc.stop(now + 0.25);
  }

  /**
   * SFX: Switch toggled or pressure plate pressed
   */
  public playSwitch(active: boolean, world: 'pristine' | 'decayed') {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (world === 'pristine') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(active ? 587.33 : 440, now); // D5 or A4
      osc.frequency.exponentialRampToValueAtTime(active ? 880 : 330, now + 0.15);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      const dest = this.effectsManager ? this.effectsManager.getPristineInput() : (this.pristinePanner || this.ctx.destination);
      gain.connect(dest);
    } else {
      osc.type = 'square';
      osc.frequency.setValueAtTime(active ? 220 : 150, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      const dest = this.effectsManager ? this.effectsManager.getDecayedInput() : (this.decayedPanner || this.ctx.destination);
      gain.connect(dest);
    }

    osc.start(now);
    osc.stop(now + 0.25);
  }

  /**
   * SFX: Wall bump / obstruction
   */
  public playBump() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.08);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.centerPanner || this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  /**
   * SFX: Resonance Shard collection (restores stability)
   */
  public playShardCollect() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + i * 0.06;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

      osc.connect(gain);
      gain.connect(this.centerPanner || this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.22);
    });
  }

  /**
   * SFX: Glitch / Destabilization warning tick
   */
  public playGlitchPulse() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.setValueAtTime(80, now + 0.03);
    osc.frequency.setValueAtTime(160, now + 0.06);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.centerPanner || this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.11);
  }

  /**
   * SFX: Desynchronization / Death (falling into abyss or crushed)
   */
  public playDesync() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.5);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    osc.connect(gain);
    gain.connect(this.centerPanner || this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.55);
  }

  /**
   * VICTORY / HARMONIZATION CHORD:
   * When both characters align at the epicenter, the split audio channels
   * snap together into a magnificent, consonant, resonant full-stereo chord!
   */
  public playVictoryHarmony() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // E Major 9 chord: E2, B2, G#3, B3, D#4, F#4, G#4
    const chord = [82.41, 123.47, 207.65, 246.94, 311.13, 369.99, 415.3];

    chord.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = idx < 2 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now);

      // Pan sweeps from split to full wide stereo center
      const panner = this.ctx.createStereoPanner();
      const initialPan = idx % 2 === 0 ? -0.7 : 0.7;
      panner.pan.setValueAtTime(initialPan, now);
      panner.pan.linearRampToValueAtTime(0, now + 1.2);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12 / Math.sqrt(chord.length), now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

      osc.connect(gain);
      gain.connect(panner);
      panner.connect(this.masterGain || this.ctx.destination);

      osc.start(now);
      osc.stop(now + 3.3);
    });
  }
}

export const audioEngine = new AudioEngine();
