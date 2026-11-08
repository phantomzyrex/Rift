/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useRiftGame } from './hooks/useRiftGame';
import { RiftCanvas } from './components/RiftCanvas';
import { TopBar } from './components/TopBar';
import { StabilityGauge } from './components/StabilityGauge';
import { TouchControls } from './components/TouchControls';
import { VictoryModal, DefeatModal, LevelSelectModal, LoreModal } from './components/ChamberModals';
import { GuideModal } from './components/GuideModal';
import { MusicStudioModal } from './components/MusicStudioModal';
import { PostProcessingOverlay } from './components/PostProcessingOverlay';
import { musicManager } from './audio/musicManager';
import { HelpCircle, Keyboard, Music } from 'lucide-react';
import { LEVELS } from './data/levels';

export default function App() {
  const {
    levelIndex,
    currentLevel,
    pristinePos,
    decayedPos,
    blocks,
    switches,
    shards,
    crumblingBroken,
    moves,
    destabilization,
    isSolved,
    isDefeated,
    defeatReason,
    canUndo,
    zenMode,
    audioMuted,
    stereoSplit,
    seamOffset,
    maxUnlockedLevel,
    move,
    undo,
    resetLevel,
    nextLevel,
    goToLevel,
    setZenMode,
    setSeamOffset,
    toggleAudio,
    toggleStereoSplit
  } = useRiftGame();

  // Modals state
  const [showLevelSelect, setShowLevelSelect] = useState<boolean>(false);
  const [showLore, setShowLore] = useState<boolean>(false);
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [showMusicStudio, setShowMusicStudio] = useState<boolean>(false);

  // Sync music state
  const [, setMusicTick] = useState(0);
  useEffect(() => {
    return musicManager.subscribe(() => setMusicTick(t => t + 1));
  }, []);

  const isPlayingMusic = musicManager.getIsPlaying();
  const currentMusicTrack = musicManager.getCurrentTrack();

  return (
    <div className="relative w-screen h-screen bg-slate-950 flex flex-col overflow-hidden font-sans select-none">
      {/* 1. Universal Top Navigation Bar */}
      <TopBar
        currentLevel={currentLevel}
        moves={moves}
        canUndo={canUndo}
        audioMuted={audioMuted}
        stereoSplit={stereoSplit}
        zenMode={zenMode}
        isPlayingMusic={isPlayingMusic}
        onUndo={undo}
        onReset={resetLevel}
        onToggleAudio={toggleAudio}
        onToggleStereoSplit={toggleStereoSplit}
        onToggleZen={() => setZenMode(!zenMode)}
        onOpenLevelSelect={() => setShowLevelSelect(true)}
        onOpenLore={() => setShowLore(true)}
        onOpenMusicStudio={() => setShowMusicStudio(true)}
      />

      {/* 2. Main Game Viewport with Dual-World Canvas */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        <RiftCanvas
          level={currentLevel}
          pristinePos={pristinePos}
          decayedPos={decayedPos}
          blocks={blocks}
          switches={switches}
          shards={shards}
          crumblingBroken={crumblingBroken}
          destabilization={destabilization}
          isSolved={isSolved}
          seamOffset={seamOffset}
          onSeamChange={setSeamOffset}
        />

        {/* Global Post-Processing Layer (CRT scanlines, chromatic aberration, vignette) */}
        <PostProcessingOverlay destabilization={destabilization} />

        {/* Floating Quick Controls Badge on Desktop */}
        <div className="hidden lg:flex items-center gap-3 absolute bottom-3 left-4 px-3 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800/80 backdrop-blur-sm text-[11px] text-slate-400 font-mono pointer-events-none">
          <div className="flex items-center gap-1 text-slate-300">
            <Keyboard className="w-3.5 h-3.5 text-cyan-400" />
            <span>WASD / Arrows to Move</span>
          </div>
          <span className="text-slate-700">·</span>
          <span>U: Undo</span>
          <span className="text-slate-700">·</span>
          <span>R: Restart</span>
        </div>

        {/* Floating Controls (Guide & Music Studio shortcut) */}
        <div className="absolute top-3 right-4 z-20 flex items-center gap-2">
          {currentMusicTrack && (
            <button
              onClick={() => setShowMusicStudio(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-cyan-800/60 text-xs text-cyan-300 hover:text-white backdrop-blur-md shadow-md transition-colors cursor-pointer"
              title="Current Track"
            >
              <Music className={`w-3.5 h-3.5 ${isPlayingMusic ? 'text-cyan-400 animate-pulse' : 'text-slate-400'}`} />
              <span className="max-w-[120px] truncate">{currentMusicTrack.title}</span>
            </button>
          )}

          <button
            onClick={() => setShowGuide(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-white backdrop-blur-md shadow-md transition-colors cursor-pointer"
            title="Game Rules & Mechanics"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Guide</span>
          </button>
        </div>

        {/* On-screen Touch Controls (Mobile / Tablet) */}
        <TouchControls onMove={move} />
      </main>

      {/* 3. Bottom Stability Gauge (The Glitch Timer) */}
      <StabilityGauge
        destabilization={destabilization}
        zenMode={zenMode}
        onToggleZen={() => setZenMode(!zenMode)}
        hint={currentLevel.hint}
      />

      {/* 4. Modals & Dialogs */}
      {isSolved && (
        <VictoryModal
          level={currentLevel}
          moves={moves}
          destabilization={destabilization}
          hasNextLevel={levelIndex < LEVELS.length - 1}
          onNext={() => {
            nextLevel();
          }}
          onReplay={() => {
            resetLevel();
          }}
        />
      )}

      {isDefeated && !isSolved && (
        <DefeatModal
          reason={defeatReason}
          canUndo={canUndo}
          onUndo={undo}
          onReset={resetLevel}
        />
      )}

      {showLevelSelect && (
        <LevelSelectModal
          currentLevelIndex={levelIndex}
          maxUnlocked={maxUnlockedLevel}
          onSelect={goToLevel}
          onClose={() => setShowLevelSelect(false)}
        />
      )}

      {showLore && (
        <LoreModal
          maxUnlocked={maxUnlockedLevel}
          onClose={() => setShowLore(false)}
        />
      )}

      {showGuide && (
        <GuideModal onClose={() => setShowGuide(false)} />
      )}

      {showMusicStudio && (
        <MusicStudioModal onClose={() => setShowMusicStudio(false)} />
      )}
    </div>
  );
}

