import React, { useState } from 'react';
import { ShieldAlert, Sparkles, Moon, Activity, ChevronUp, ChevronDown } from 'lucide-react';
import { audioEngine } from '../audio/audioEngine';

interface StabilityGaugeProps {
  destabilization: number; // 0 to 100
  zenMode: boolean;
  onToggleZen: () => void;
  hint?: string;
}

export const StabilityGauge: React.FC<StabilityGaugeProps> = ({
  destabilization,
  zenMode,
  onToggleZen,
  hint
}) => {
  const [showAcousticTelemetry, setShowAcousticTelemetry] = useState(false);
  const stability = Math.max(0, Math.min(100, Math.round(100 - destabilization)));
  const isCritical = stability <= 25;
  const isWarning = stability <= 50 && !isCritical;

  const effectParams = audioEngine.getEffectParameters();
  const d = zenMode ? 0 : destabilization;

  // Determine acoustic state description
  let acousticStatus = 'Pristine & Clear (14kHz LPF · Minimal Wet)';
  let distortionLabel = 'Zero Distortion';
  if (d > 75) {
    acousticStatus = 'Critical Distortion (Clamped 220Hz / 1.2kHz · Cavernous Reverb)';
    distortionLabel = 'Heavy Overdrive';
  } else if (d > 45) {
    acousticStatus = 'Resonant Sweep (Low-Pass Filter Closing · Reverb Swelling)';
    distortionLabel = 'Harmonic Saturation';
  } else if (d > 20) {
    acousticStatus = 'Filter Drift (Gentle Attenuation · Diffusion Active)';
    distortionLabel = 'Soft Tape Warmth';
  }

  return (
    <div className="w-full bg-slate-950/85 border-t border-slate-800/80 backdrop-blur-md z-20 select-none">
      {/* Expandable Acoustic DSP Telemetry Drawer */}
      {showAcousticTelemetry && effectParams && (
        <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-[11px] font-mono grid grid-cols-1 md:grid-cols-3 gap-3 animate-in slide-in-from-bottom-2 duration-150">
          {/* Pristine Channel DSP */}
          <div className="flex flex-col gap-1 p-2 rounded-lg bg-slate-950/60 border border-cyan-900/30">
            <div className="flex items-center justify-between text-cyan-300 font-semibold">
              <span>Pristine Channel (Left)</span>
              <span className="text-[10px] text-cyan-400">Spatial Pan: -0.88</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Low-Pass Filter:</span>
              <span className="text-slate-200 tabular-nums">{effectParams.pristineCutoff} Hz (Q: {effectParams.pristineQ})</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Convolution Reverb:</span>
              <span className="text-cyan-300 tabular-nums">{Math.round(effectParams.pristineReverbWet * 100)}% Wet</span>
            </div>
          </div>

          {/* Decayed Channel DSP */}
          <div className="flex flex-col gap-1 p-2 rounded-lg bg-slate-950/60 border border-amber-900/30">
            <div className="flex items-center justify-between text-amber-300 font-semibold">
              <span>Decayed Channel (Right)</span>
              <span className="text-[10px] text-amber-400">Spatial Pan: +0.88</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Low-Pass Filter:</span>
              <span className="text-slate-200 tabular-nums">{effectParams.decayedCutoff} Hz (Q: {effectParams.decayedQ})</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Industrial Reverb:</span>
              <span className="text-amber-300 tabular-nums">{Math.round(effectParams.decayedReverbWet * 100)}% Wet</span>
            </div>
          </div>

          {/* Non-linear Distortion & Detune */}
          <div className="flex flex-col gap-1 p-2 rounded-lg bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between text-slate-200 font-semibold">
              <span>Waveshaper Distortion</span>
              <span className={d > 60 ? 'text-red-400' : d > 25 ? 'text-amber-400' : 'text-emerald-400'}>
                {distortionLabel}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Distortion Drive:</span>
              <span className="text-slate-200 tabular-nums">{Math.round(effectParams.distortionDrive * 100)}%</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Pitch Drift / Detune:</span>
              <span className="text-purple-300 tabular-nums">{d > 0 ? `±${(d * 0.45).toFixed(1)} cents` : 'Stable 0.0'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Bottom Bar */}
      <div className="px-4 py-2 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        {/* Realm Labels & Seam Indicator */}
        <div className="flex items-center gap-6 text-xs w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
            <span className="font-semibold text-cyan-200 tracking-wide">Pristine World</span>
            <span className="text-slate-500 hidden sm:inline">· Sterile Stasis</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-amber-300 tracking-wide">Decayed World</span>
            <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
            <span className="text-slate-500 hidden sm:inline">· Rusted Matter</span>
          </div>
        </div>

        {/* Stability Bar (The Glitch Timer) */}
        <div className="flex items-center gap-3 w-full md:w-96">
          <div className="flex items-center gap-1.5 shrink-0 text-slate-400 font-mono text-xs">
            {isCritical ? (
              <ShieldAlert className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <span>Rift Coherence:</span>
            <span
              className={`font-semibold tabular-nums ${
                isCritical
                  ? 'text-red-400'
                  : isWarning
                  ? 'text-amber-400'
                  : 'text-cyan-300'
              }`}
            >
              {zenMode ? 'Infinite' : `${stability}%`}
            </span>
          </div>

          {/* Progress track */}
          <div className="relative flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-150 rounded-full ${
                zenMode
                  ? 'w-full bg-cyan-500/50'
                  : isCritical
                  ? 'bg-gradient-to-r from-red-600 to-amber-500 animate-pulse'
                  : isWarning
                  ? 'bg-gradient-to-r from-amber-500 to-cyan-400'
                  : 'bg-gradient-to-r from-cyan-400 to-sky-300'
              }`}
              style={{ width: zenMode ? '100%' : `${stability}%` }}
            />
          </div>

          {/* Zen Mode Switch */}
          <button
            onClick={onToggleZen}
            className={`shrink-0 flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              zenMode
                ? 'bg-sky-950 text-cyan-300 border border-cyan-800/60'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Zen Mode: Pauses the Rift Glitch Timer for pure contemplation"
          >
            <Moon className="w-3 h-3" />
            <span>Zen</span>
          </button>
        </div>

        {/* Acoustic Distortion Status & Telemetry Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAcousticTelemetry(!showAcousticTelemetry)}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-mono text-slate-400 hover:text-slate-200 hover:bg-slate-800/70 transition-colors cursor-pointer"
            title="Toggle Dynamic Audio Effects DSP Telemetry"
          >
            <Activity className={`w-3.5 h-3.5 ${d > 60 ? 'text-red-400 animate-pulse' : d > 25 ? 'text-amber-400' : 'text-cyan-400'}`} />
            <span className="hidden xl:inline text-slate-500">Audio DSP:</span>
            <span className="truncate max-w-[170px] sm:max-w-none text-slate-300">
              {acousticStatus}
            </span>
            {showAcousticTelemetry ? <ChevronDown className="w-3 h-3 text-slate-500" /> : <ChevronUp className="w-3 h-3 text-slate-500" />}
          </button>
        </div>
      </div>
    </div>
  );
};
