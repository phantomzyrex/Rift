import React from 'react';
import { Volume2, VolumeX, Headphones, RotateCcw, Undo2, BookOpen, Layers, Music } from 'lucide-react';
import { ChamberLevel } from '../types/game';

interface TopBarProps {
  currentLevel: ChamberLevel;
  moves: number;
  canUndo: boolean;
  audioMuted: boolean;
  stereoSplit: boolean;
  zenMode: boolean;
  isPlayingMusic?: boolean;
  onUndo: () => void;
  onReset: () => void;
  onToggleAudio: () => void;
  onToggleStereoSplit: () => void;
  onToggleZen: () => void;
  onOpenLevelSelect: () => void;
  onOpenLore: () => void;
  onOpenMusicStudio: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentLevel,
  moves,
  canUndo,
  audioMuted,
  stereoSplit,
  zenMode,
  isPlayingMusic = false,
  onUndo,
  onReset,
  onToggleAudio,
  onToggleStereoSplit,
  onToggleZen,
  onOpenLevelSelect,
  onOpenLore,
  onOpenMusicStudio
}) => {
  return (
    <header className="w-full h-14 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 md:px-8 flex items-center justify-between shrink-0 z-30 select-none">
      {/* Zone 1: Single Wordmark */}
      <div className="flex items-center gap-3">
        <span className="font-display text-xl font-bold tracking-widest text-slate-100 uppercase">
          R I F T
        </span>
        <span className="hidden sm:inline text-xs text-slate-600 font-mono tracking-wider">
          DUAL-REALM
        </span>
      </div>

      {/* Zone 2: Navigation & Current Chamber Title */}
      <div className="flex items-center gap-3 text-xs md:text-sm font-medium text-slate-300">
        <button
          onClick={onOpenLevelSelect}
          className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
          title="Select Chamber"
        >
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold text-slate-200">{currentLevel.name}</span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400 hidden sm:inline">{currentLevel.subtitle}</span>
        </button>

        <span className="text-slate-700">|</span>

        {/* Clean unboxed move count */}
        <div className="flex items-center gap-1.5 font-mono text-xs text-slate-400">
          <span>Moves:</span>
          <span className="text-cyan-300 font-semibold tabular-nums">{moves}</span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-500 tabular-nums">{currentLevel.parMoves} Par</span>
        </div>
      </div>

      {/* Zone 3: Functional Actions */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Undo button */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="p-1.5 sm:px-2.5 sm:py-1 rounded text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
          title="Undo Move (U / Z)"
        >
          <Undo2 className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Undo</span>
        </button>

        {/* Reset chamber button */}
        <button
          onClick={onReset}
          className="p-1.5 sm:px-2.5 sm:py-1 rounded text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors flex items-center gap-1 cursor-pointer"
          title="Restart Chamber (R)"
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden md:inline">Restart</span>
        </button>

        <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />

        {/* Music Studio (Lyria) */}
        <button
          onClick={onOpenMusicStudio}
          className={`p-1.5 sm:px-2.5 sm:py-1 rounded text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
            isPlayingMusic
              ? 'text-cyan-300 bg-cyan-950/70 border border-cyan-800/60 shadow-[0_0_12px_rgba(56,189,248,0.25)]'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
          title="Rift Music Studio (Generate Background Music with Lyria)"
        >
          <Music className={`w-3.5 h-3.5 ${isPlayingMusic ? 'text-cyan-400 animate-pulse' : 'text-cyan-300'}`} />
          <span className="hidden sm:inline">Music</span>
        </button>

        {/* Spatial Stereo Split Toggle */}
        <button
          onClick={onToggleStereoSplit}
          className={`p-1.5 rounded transition-colors cursor-pointer ${
            stereoSplit
              ? 'text-cyan-400 bg-cyan-950/40 hover:bg-cyan-900/50'
              : 'text-slate-500 hover:text-slate-300'
          }`}
          title={stereoSplit ? 'Headphone Spatial Split: Active (Left=Pristine, Right=Decayed)' : 'Spatial Split: Centered'}
        >
          <Headphones className="w-4 h-4" />
        </button>

        {/* Audio Mute/Unmute */}
        <button
          onClick={onToggleAudio}
          className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
          title={audioMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {audioMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-slate-300" />}
        </button>

        {/* Lore Chronicle */}
        <button
          onClick={onOpenLore}
          className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
          title="Chronicle of the Severed Soul"
        >
          <BookOpen className="w-4 h-4 text-amber-300" />
        </button>
      </div>
    </header>
  );
};

