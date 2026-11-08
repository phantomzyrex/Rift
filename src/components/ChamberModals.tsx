import React from 'react';
import { ChamberLevel } from '../types/game';
import { CheckCircle2, AlertTriangle, ArrowRight, RotateCcw, X, Lock, Sparkles, BookOpen } from 'lucide-react';
import { LEVELS } from '../data/levels';

// --- VICTORY MODAL ---
interface VictoryModalProps {
  level: ChamberLevel;
  moves: number;
  destabilization: number;
  hasNextLevel: boolean;
  onNext: () => void;
  onReplay: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  level,
  moves,
  destabilization,
  hasNextLevel,
  onNext,
  onReplay
}) => {
  const coherence = Math.max(0, Math.round(100 - destabilization));
  const isParMet = moves <= level.parMoves;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-cyan-800/60 rounded-2xl p-6 shadow-[0_0_50px_rgba(56,189,248,0.25)] flex flex-col gap-5 text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Sparkles className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold tracking-wider text-white">
              CHAMBER REALIGNED
            </h2>
            <p className="text-xs text-cyan-400 font-mono">
              {level.name} · Harmonic Convergence
            </p>
          </div>
        </div>

        {/* Narrative fragment */}
        <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-300 italic leading-relaxed">
          {level.loreFragment}
        </div>

        {/* Performance metrics */}
        <div className="grid grid-cols-2 gap-3 py-2 border-y border-slate-800/80">
          <div>
            <span className="text-[11px] text-slate-500 uppercase tracking-wider block">
              Movement Efficiency
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="font-mono text-xl font-bold text-slate-100 tabular-nums">
                {moves}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                / {level.parMoves} Par
              </span>
            </div>
            <span className="text-[11px] text-cyan-400">
              {isParMet ? 'Optimal Path Mastery' : 'Completed'}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-slate-500 uppercase tracking-wider block">
              Rift Coherence Retained
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="font-mono text-xl font-bold text-cyan-300 tabular-nums">
                {coherence}%
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              Dimensional Stability
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={onReplay}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Replay</span>
          </button>

          {hasNextLevel ? (
            <button
              onClick={onNext}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-500 hover:from-cyan-500 hover:to-sky-400 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Next Chamber</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={onReplay}
              className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Singularity Mended</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// --- DEFEAT MODAL ---
interface DefeatModalProps {
  reason: string | null;
  canUndo: boolean;
  onUndo: () => void;
  onReset: () => void;
}

export const DefeatModal: React.FC<DefeatModalProps> = ({
  reason,
  canUndo,
  onUndo,
  onReset
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-red-900/60 rounded-2xl p-6 shadow-[0_0_50px_rgba(239,68,68,0.2)] flex flex-col gap-5 text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-950 border border-red-500/40 flex items-center justify-center text-red-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold tracking-wider text-white">
              SOUL DESYNCHRONIZED
            </h2>
            <p className="text-xs text-red-400 font-mono">
              Temporal Continuity Severed
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
          {reason || 'A fatal environmental trauma erased the bridge between dimensions.'}
        </p>

        <div className="flex items-center gap-3 pt-1">
          {canUndo && (
            <button
              onClick={onUndo}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Rewind Move (U)</span>
            </button>
          )}

          <button
            onClick={onReset}
            className="flex-1 py-2.5 px-4 rounded-xl bg-red-700 hover:bg-red-600 text-xs font-semibold text-white shadow-lg shadow-red-700/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Re-Anchor Soul</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// --- LEVEL SELECT MODAL ---
interface LevelSelectModalProps {
  currentLevelIndex: number;
  maxUnlocked: number;
  onSelect: (index: number) => void;
  onClose: () => void;
}

export const LevelSelectModal: React.FC<LevelSelectModalProps> = ({
  currentLevelIndex,
  maxUnlocked,
  onSelect,
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-slate-100 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="font-display text-base font-bold tracking-wider text-white">
              CHAMBER ARCHIVE
            </h2>
            <p className="text-xs text-slate-400">
              Select a dimensional sector to calibrate (13 Sectors Available)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {LEVELS.map((lvl, idx) => {
            const isUnlocked = idx <= maxUnlocked;
            const isCurrent = idx === currentLevelIndex;

            return (
              <button
                key={lvl.id}
                onClick={() => {
                  if (isUnlocked) {
                    onSelect(idx);
                    onClose();
                  }
                }}
                disabled={!isUnlocked}
                className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-cyan-950/50 border-cyan-500/80 text-white shadow-md shadow-cyan-950'
                    : isUnlocked
                    ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 text-slate-300'
                    : 'bg-slate-950/30 border-slate-900 text-slate-600 cursor-not-allowed opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-cyan-400">
                    {lvl.name}
                  </span>
                  {!isUnlocked ? (
                    <Lock className="w-3.5 h-3.5 text-slate-600" />
                  ) : isCurrent ? (
                    <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#38bdf8]" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-600" />
                  )}
                </div>

                <div className="mt-2">
                  <h4 className="text-xs font-bold text-slate-200 truncate">
                    {lvl.subtitle}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Par: {lvl.parMoves} moves
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// --- LORE CHRONICLE MODAL ---
interface LoreModalProps {
  maxUnlocked: number;
  onClose: () => void;
}

export const LoreModal: React.FC<LoreModalProps> = ({ maxUnlocked, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-slate-900 border border-amber-900/40 rounded-2xl p-6 shadow-2xl flex flex-col gap-5 text-slate-100 max-h-[88vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="font-display text-base font-bold tracking-wider text-amber-200">
                CHRONICLE OF THE SEVERED SOUL
              </h2>
              <p className="text-xs text-slate-400">
                Discovered fragments of the ruptured universe
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

        {/* Visual Realm Header */}
        <div className="relative w-full h-44 rounded-xl overflow-hidden border border-slate-800">
          <img
            src="/src/assets/images/rift_split_monolith_1790270804063.jpg"
            alt="The Rift Monolith"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-4 flex flex-col justify-end">
            <p className="text-xs text-slate-300 font-display italic">
              "Two worlds torn from a single origin: an eternal sterile ghost on the left, an entropic decay of matter on the right."
            </p>
          </div>
        </div>

        {/* List of Fragments */}
        <div className="flex flex-col gap-3">
          {LEVELS.map((lvl, idx) => {
            const isUnlocked = idx <= maxUnlocked;
            return (
              <div
                key={lvl.id}
                className={`p-4 rounded-xl border transition-colors ${
                  isUnlocked
                    ? 'bg-slate-950/70 border-slate-800 text-slate-200'
                    : 'bg-slate-950/30 border-slate-900 text-slate-600 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-xs text-amber-400 font-semibold">
                    {lvl.name} · {lvl.subtitle}
                  </span>
                  {!isUnlocked && (
                    <span className="text-[11px] font-mono text-slate-600 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Locked
                    </span>
                  )}
                </div>

                <p className="text-xs leading-relaxed italic text-slate-300">
                  {isUnlocked
                    ? lvl.loreFragment
                    : 'Fragment enciphered in dimensional static. Realign this chamber to decipher.'}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
