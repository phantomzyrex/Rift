import React, { useState, useEffect } from 'react';
import {
  X,
  Music,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  Download,
  Repeat,
  Radio,
  Check
} from 'lucide-react';
import { musicManager, MusicTrack } from '../audio/musicManager';

interface MusicStudioModalProps {
  onClose: () => void;
}

interface Preset {
  id: string;
  name: string;
  badge: string;
  description: string;
  prompt: string;
  model: 'lyria-3-clip-preview' | 'lyria-3-pro-preview';
}

const PRESETS: Preset[] = [
  {
    id: 'split_consciousness',
    name: 'The Split Consciousness',
    badge: 'Recommended · Best Ambience',
    description: 'Bespoke dual-dimensional ambient drone: crystalline chimes intertwined with deep industrial sub-bass.',
    prompt:
      'A haunting, atmospheric ambient video game score for a parallel dimension puzzle game. Sterile crystalline chimes and soft high-frequency glass pads, intertwined with deep industrial sub-bass drone, warm analog synthesizer pulses, and subtle rusty metallic reverberations. Contemplative, hypnotic, loopable background music.',
    model: 'lyria-3-clip-preview'
  },
  {
    id: 'pristine_sanctuary',
    name: 'Pristine Sanctuary',
    badge: 'Left Realm · Light & Stasis',
    description: 'Ethereal celestial bells, serene sine pads, and frozen minimalist tranquility.',
    prompt:
      'Ethereal neoclassical ambient music with gentle celestial shimmer, glassy celeste bell arpeggios, infinite reverb, frozen crystal marble architecture, peaceful and solemn video game soundtrack.',
    model: 'lyria-3-clip-preview'
  },
  {
    id: 'decayed_abyss',
    name: 'The Decayed Abyss',
    badge: 'Right Realm · Ruin & Matter',
    description: 'Dark industrial drone, decaying analog bass, and metallic reverberations.',
    prompt:
      'Dark atmospheric industrial drone, distorted analog sub-bass rumble, decaying machine hums, distant metallic clangs, subterranean tension, slow brooding tempo, cinematic game music.',
    model: 'lyria-3-clip-preview'
  },
  {
    id: 'singularity_convergence',
    name: 'Singularity Convergence',
    badge: 'Full Track · Harmonization',
    description: 'An expansive full-length track resolving two fractured worlds into harmonic unity.',
    prompt:
      'A cinematic, expansive ambient electronic track. Two fragmented soundscapes merging into a luminous harmonic unison with rich warm synth pads, rhythmic pulse, and uplifting sparkling arpeggios, full length soundtrack.',
    model: 'lyria-3-pro-preview'
  }
];

export const MusicStudioModal: React.FC<MusicStudioModalProps> = ({ onClose }) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('split_consciousness');
  const [customPrompt, setCustomPrompt] = useState<string>(PRESETS[0].prompt);
  const [selectedModel, setSelectedModel] = useState<'lyria-3-clip-preview' | 'lyria-3-pro-preview'>('lyria-3-clip-preview');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Player state from manager
  const [, setTick] = useState(0);
  useEffect(() => {
    return musicManager.subscribe(() => setTick(t => t + 1));
  }, []);

  const tracks = musicManager.getTracks();
  const currentTrack = musicManager.getCurrentTrack();
  const isPlaying = musicManager.getIsPlaying();
  const volume = musicManager.getVolume();
  const isLooping = musicManager.getIsLooping();
  const currentTime = musicManager.getCurrentTime();
  const duration = musicManager.getDuration();

  const handleSelectPreset = (preset: Preset) => {
    setSelectedPreset(preset.id);
    setCustomPrompt(preset.prompt);
    setSelectedModel(preset.model);
    setError(null);
  };

  const handleGenerate = async () => {
    if (!customPrompt.trim()) return;
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/generate-music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: customPrompt,
          model: selectedModel
        })
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to generate music');
      }

      const preset = PRESETS.find(p => p.id === selectedPreset);
      const title = preset && customPrompt === preset.prompt ? preset.name : 'Custom Rift Score';

      musicManager.addTrackFromBase64(
        data.audioBase64,
        data.mimeType || 'audio/wav',
        title,
        customPrompt,
        selectedModel
      );
    } catch (err: any) {
      console.error('Music generation error:', err);
      setError(err?.message || 'Failed to generate music. Please verify your GEMINI_API_KEY.');
    } finally {
      setIsGenerating(false);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-slate-900 border border-cyan-900/50 rounded-2xl p-6 shadow-2xl flex flex-col gap-5 text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Music className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold tracking-wider text-white">
                RIFT MUSIC STUDIO
              </h2>
              <p className="text-xs text-slate-400">
                Generate tailored atmospheric background music using Google Lyria
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Player Bar */}
        {currentTrack && (
          <div className="p-4 bg-slate-950/80 border border-cyan-800/40 rounded-xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => musicManager.togglePlayPause()}
                  className="w-10 h-10 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-100">{currentTrack.title}</span>
                    <span className="text-[10px] text-cyan-400 font-mono">
                      {currentTrack.model === 'lyria-3-pro-preview' ? 'Lyria Pro' : 'Lyria Clip'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => musicManager.toggleLoop()}
                  className={`p-1.5 rounded transition-colors cursor-pointer ${
                    isLooping ? 'text-cyan-400 bg-cyan-950/60' : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title={isLooping ? 'Looping enabled' : 'Looping disabled'}
                >
                  <Repeat className="w-4 h-4" />
                </button>

                <a
                  href={currentTrack.audioUrl}
                  download={`${currentTrack.title.replace(/\s+/g, '_').toLowerCase()}.wav`}
                  className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Download WAV track"
                >
                  <Download className="w-4 h-4" />
                </a>

                {/* Volume Slider */}
                <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
                  <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={e => musicManager.setVolume(parseFloat(e.target.value))}
                    className="w-16 accent-cyan-400 h-1 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Scrubber track */}
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-cyan-400 h-full transition-all duration-100"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}

        {/* Curated Presets Selection */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Atmospheric Themes
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {PRESETS.map(preset => {
              const isSelected = selectedPreset === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-500/80 shadow-md shadow-cyan-950'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-200">{preset.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  </div>
                  <span className="text-[10px] text-cyan-400 font-mono mt-0.5">{preset.badge}</span>
                  <p className="text-[11px] text-slate-400 leading-snug mt-1.5">{preset.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Model Selection */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Generation Model
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setSelectedModel('lyria-3-clip-preview')}
              className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                selectedModel === 'lyria-3-clip-preview'
                  ? 'bg-cyan-950/50 border-cyan-500 text-white'
                  : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="font-semibold text-xs">Lyria Clip</div>
              <div className="text-[11px] text-slate-400">30s Seamless Loop (Recommended)</div>
            </button>

            <button
              onClick={() => setSelectedModel('lyria-3-pro-preview')}
              className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                selectedModel === 'lyria-3-pro-preview'
                  ? 'bg-cyan-950/50 border-cyan-500 text-white'
                  : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="font-semibold text-xs">Lyria Pro</div>
              <div className="text-[11px] text-slate-400">Full-Length Deep Ambient Track</div>
            </button>
          </div>
        </div>

        {/* Prompt Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Soundtrack Prompt
          </label>
          <textarea
            value={customPrompt}
            onChange={e => setCustomPrompt(e.target.value)}
            rows={3}
            className="w-full p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-sans leading-relaxed resize-none"
            placeholder="Describe the sonic atmosphere..."
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-950/50 border border-red-800/60 rounded-xl text-xs text-red-300">
            {error}
          </div>
        )}

        {/* Action button */}
        <div className="flex items-center justify-between pt-1">
          <div className="text-[11px] text-slate-500 font-mono">
            Model: {selectedModel}
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !customPrompt.trim()}
            className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-500 hover:from-cyan-500 hover:to-sky-400 disabled:opacity-50 text-xs font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all flex items-center gap-2 cursor-pointer"
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-cyan-200" />
                <span>Composing Score with Lyria...</span>
              </>
            ) : (
              <>
                <Radio className="w-4 h-4" />
                <span>Generate Background Music</span>
              </>
            )}
          </button>
        </div>

        {/* Previously Generated Tracks */}
        {tracks.length > 1 && (
          <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Generated Sound Library
            </span>
            <div className="flex flex-col gap-1.5">
              {tracks.map(t => (
                <div
                  key={t.id}
                  className={`p-2.5 rounded-lg border flex items-center justify-between transition-colors ${
                    currentTrack?.id === t.id
                      ? 'bg-cyan-950/40 border-cyan-600/60 text-white'
                      : 'bg-slate-950/40 border-slate-800/80 text-slate-300 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => {
                        if (currentTrack?.id === t.id) {
                          musicManager.togglePlayPause();
                        } else {
                          musicManager.playTrack(t.id);
                        }
                      }}
                      className="p-1 rounded text-cyan-400 hover:text-white cursor-pointer"
                    >
                      {currentTrack?.id === t.id && isPlaying ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </button>
                    <div>
                      <span className="text-xs font-medium text-slate-200">{t.title}</span>
                      <span className="text-[10px] text-slate-500 font-mono ml-2">
                        {t.model === 'lyria-3-pro-preview' ? 'Pro' : 'Clip'}
                      </span>
                    </div>
                  </div>

                  <a
                    href={t.audioUrl}
                    download={`${t.title.replace(/\s+/g, '_').toLowerCase()}.wav`}
                    className="p-1 text-slate-500 hover:text-slate-300"
                    title="Download"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
