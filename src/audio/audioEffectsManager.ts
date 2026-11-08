/**
 * Audio Effects Manager for Rift
 * Dynamically modulates Reverb, Low-Pass Filters, WaveShaper Distortion,
 * and Pitch Drift in real-time as the dimensional destabilization level rises.
 */

export interface EffectParameters {
  destabilization: number; // 0 to 100
  pristineCutoff: number; // Hz
  pristineQ: number;
  pristineReverbWet: number; // 0 to 1
  decayedCutoff: number; // Hz
  decayedQ: number;
  decayedReverbWet: number; // 0 to 1
  distortionDrive: number; // 0 to 1
}

export class AudioEffectsManager {
  private ctx: AudioContext;

  // Pristine realm effect nodes
  private pristineFilter: BiquadFilterNode;
  private pristineWaveshaper: WaveShaperNode;
  private pristineDryGain: GainNode;
  private pristineWetGain: GainNode;
  private pristineConvolver: ConvolverNode;
  private pristineOutGain: GainNode;

  // Decayed realm effect nodes
  private decayedFilter: BiquadFilterNode;
  private decayedWaveshaper: WaveShaperNode;
  private decayedDryGain: GainNode;
  private decayedWetGain: GainNode;
  private decayedConvolver: ConvolverNode;
  private decayedOutGain: GainNode;

  // Master bus filter & distortion
  private masterFilter: BiquadFilterNode;
  private masterWaveshaper: WaveShaperNode;

  // Current values
  private currentDestabilization = 0;

  // Distortion curve cache
  private cleanCurve: Float32Array<ArrayBuffer>;
  private distortedCurve: Float32Array<ArrayBuffer>;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;

    // 1. Pristine Channel Effects
    this.pristineFilter = ctx.createBiquadFilter();
    this.pristineFilter.type = 'lowpass';
    this.pristineFilter.frequency.setValueAtTime(14000, ctx.currentTime);
    this.pristineFilter.Q.setValueAtTime(0.7, ctx.currentTime);

    this.pristineWaveshaper = ctx.createWaveShaper();
    this.cleanCurve = this.generateDistortionCurve(0);
    this.distortedCurve = this.generateDistortionCurve(35);
    this.pristineWaveshaper.curve = this.cleanCurve;
    this.pristineWaveshaper.oversample = '4x';

    this.pristineConvolver = ctx.createConvolver();
    this.pristineConvolver.buffer = this.generateImpulseResponse(2.2, 1.8);

    this.pristineDryGain = ctx.createGain();
    this.pristineDryGain.gain.setValueAtTime(1.0, ctx.currentTime);

    this.pristineWetGain = ctx.createGain();
    this.pristineWetGain.gain.setValueAtTime(0.12, ctx.currentTime);

    this.pristineOutGain = ctx.createGain();
    this.pristineOutGain.gain.setValueAtTime(1.0, ctx.currentTime);

    // Pristine routing: Filter -> Waveshaper -> Dry/Wet -> Out
    this.pristineFilter.connect(this.pristineWaveshaper);
    this.pristineWaveshaper.connect(this.pristineDryGain);
    this.pristineWaveshaper.connect(this.pristineConvolver);
    this.pristineConvolver.connect(this.pristineWetGain);

    this.pristineDryGain.connect(this.pristineOutGain);
    this.pristineWetGain.connect(this.pristineOutGain);

    // 2. Decayed Channel Effects
    this.decayedFilter = ctx.createBiquadFilter();
    this.decayedFilter.type = 'lowpass';
    this.decayedFilter.frequency.setValueAtTime(3600, ctx.currentTime);
    this.decayedFilter.Q.setValueAtTime(1.2, ctx.currentTime);

    this.decayedWaveshaper = ctx.createWaveShaper();
    this.decayedWaveshaper.curve = this.cleanCurve;
    this.decayedWaveshaper.oversample = '4x';

    this.decayedConvolver = ctx.createConvolver();
    this.decayedConvolver.buffer = this.generateImpulseResponse(1.8, 2.5);

    this.decayedDryGain = ctx.createGain();
    this.decayedDryGain.gain.setValueAtTime(1.0, ctx.currentTime);

    this.decayedWetGain = ctx.createGain();
    this.decayedWetGain.gain.setValueAtTime(0.08, ctx.currentTime);

    this.decayedOutGain = ctx.createGain();
    this.decayedOutGain.gain.setValueAtTime(1.0, ctx.currentTime);

    // Decayed routing: Filter -> Waveshaper -> Dry/Wet -> Out
    this.decayedFilter.connect(this.decayedWaveshaper);
    this.decayedWaveshaper.connect(this.decayedDryGain);
    this.decayedWaveshaper.connect(this.decayedConvolver);
    this.decayedConvolver.connect(this.decayedWetGain);

    this.decayedDryGain.connect(this.decayedOutGain);
    this.decayedWetGain.connect(this.decayedOutGain);

    // 3. Master Bus Filter & Distortion
    this.masterFilter = ctx.createBiquadFilter();
    this.masterFilter.type = 'lowpass';
    this.masterFilter.frequency.setValueAtTime(18000, ctx.currentTime);
    this.masterFilter.Q.setValueAtTime(0.7, ctx.currentTime);

    this.masterWaveshaper = ctx.createWaveShaper();
    this.masterWaveshaper.curve = this.cleanCurve;
  }

  /**
   * Connect outputs to destination panners
   */
  public connectPristineTo(destination: AudioNode) {
    this.pristineOutGain.connect(destination);
  }

  public connectDecayedTo(destination: AudioNode) {
    this.decayedOutGain.connect(destination);
  }

  /**
   * Get input nodes for sound generation routing
   */
  public getPristineInput(): AudioNode {
    return this.pristineFilter;
  }

  public getDecayedInput(): AudioNode {
    return this.decayedFilter;
  }

  /**
   * Dynamically adjust filters, reverb, and distortion based on destabilization (0 - 100)
   */
  public setDestabilization(destabilization: number) {
    this.currentDestabilization = Math.max(0, Math.min(100, destabilization));
    const d = this.currentDestabilization / 100; // 0.0 to 1.0
    const now = this.ctx.currentTime;
    const timeConstant = 0.08; // smooth interpolation

    // 1. Pristine Low-pass Filter:
    // Starts at bright 14kHz, drops down to 1.2kHz at 100% destabilization with high ringing resonance
    const pristineCutoff = 14000 * Math.pow(1200 / 14000, d);
    const pristineQ = 0.7 + d * 5.0; // resonant ringing when unstable

    this.pristineFilter.frequency.setTargetAtTime(pristineCutoff, now, timeConstant);
    this.pristineFilter.Q.setTargetAtTime(pristineQ, now, timeConstant);

    // 2. Pristine Reverb:
    // Wet increases from 0.12 to 0.75, dry decreases from 1.0 to 0.45 (cavernous stasis haze)
    const pristineWet = 0.12 + d * 0.63;
    const pristineDry = 1.0 - d * 0.55;

    this.pristineWetGain.gain.setTargetAtTime(pristineWet, now, timeConstant);
    this.pristineDryGain.gain.setTargetAtTime(pristineDry, now, timeConstant);

    // 3. Decayed Low-pass Filter:
    // Starts at 3600Hz, crushes down to 220Hz (muffled, heavy, suffocating industrial void)
    const decayedCutoff = 3600 * Math.pow(220 / 3600, d);
    const decayedQ = 1.2 + d * 6.5;

    this.decayedFilter.frequency.setTargetAtTime(decayedCutoff, now, timeConstant);
    this.decayedFilter.Q.setTargetAtTime(decayedQ, now, timeConstant);

    // 4. Decayed Reverb:
    // Wet increases from 0.08 to 0.65, dry decreases from 1.0 to 0.40
    const decayedWet = 0.08 + d * 0.57;
    const decayedDry = 1.0 - d * 0.60;

    this.decayedWetGain.gain.setTargetAtTime(decayedWet, now, timeConstant);
    this.decayedDryGain.gain.setTargetAtTime(decayedDry, now, timeConstant);

    // 5. Dynamic Distortion / Waveshaping:
    // As destabilization passes 25%, overdrive kicks in; at >75%, heavy crushing distortion
    if (d < 0.2) {
      this.pristineWaveshaper.curve = this.cleanCurve;
      this.decayedWaveshaper.curve = this.cleanCurve;
    } else {
      const drive = Math.min(80, (d - 0.2) * 85);
      const dynamicCurve = this.generateDistortionCurve(drive);
      this.pristineWaveshaper.curve = dynamicCurve;
      this.decayedWaveshaper.curve = dynamicCurve;
    }
  }

  /**
   * Retrieve current computed DSP parameters for HUD/diagnostic inspection
   */
  public getCurrentParameters(): EffectParameters {
    const d = this.currentDestabilization / 100;
    return {
      destabilization: this.currentDestabilization,
      pristineCutoff: Math.round(14000 * Math.pow(1200 / 14000, d)),
      pristineQ: Number((0.7 + d * 5.0).toFixed(2)),
      pristineReverbWet: Number((0.12 + d * 0.63).toFixed(2)),
      decayedCutoff: Math.round(3600 * Math.pow(220 / 3600, d)),
      decayedQ: Number((1.2 + d * 6.5).toFixed(2)),
      decayedReverbWet: Number((0.08 + d * 0.57).toFixed(2)),
      distortionDrive: d < 0.2 ? 0 : Number(Math.min(1, (d - 0.2) / 0.8).toFixed(2))
    };
  }

  /**
   * Synthesize an algorithmic stereo impulse response for convolution reverb
   */
  private generateImpulseResponse(duration: number, decay: number): AudioBuffer {
    const sampleRate = this.ctx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const impulse = this.ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const t = i / length;
      const envelope = Math.pow(1 - t, decay);
      // Diffuse pseudo-random reflections
      left[i] = (Math.random() * 2 - 1) * envelope;
      right[i] = (Math.random() * 2 - 1) * envelope;
    }

    return impulse;
  }

  /**
   * Generate a smooth soft-clipping sigmoid wave-shaping curve
   */
  private generateDistortionCurve(amount: number): Float32Array<ArrayBuffer> {
    const k = amount;
    const n_samples = 44100;
    const buffer = new ArrayBuffer(n_samples * 4);
    const curve = new Float32Array(buffer);
    const deg = Math.PI / 180;

    for (let i = 0; i < n_samples; i++) {
      const x = (i * 2) / n_samples - 1;
      if (k === 0) {
        curve[i] = x;
      } else {
        // Sigmoid transfer function
        curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
      }
    }
    return curve;
  }
}
