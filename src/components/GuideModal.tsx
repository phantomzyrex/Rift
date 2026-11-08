import React from 'react';
import { X, SplitSquareVertical, ArrowRightLeft, ShieldAlert, Headphones, Sparkles } from 'lucide-react';

interface GuideModalProps {
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="w-full max-w-xl bg-slate-900 border border-cyan-900/50 rounded-2xl p-6 shadow-2xl flex flex-col gap-5 text-slate-100 max-h-[88vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <SplitSquareVertical className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="font-display text-base font-bold tracking-wider text-white">
                DIMENSIONAL PROTOCOLS
              </h2>
              <p className="text-xs text-slate-400">
                Core mechanics of the parallel consciousness
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

        {/* Dual Realm Concept Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-800/40">
            <div className="flex items-center gap-2 mb-1.5 text-cyan-300 font-semibold">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>Pristine Realm (Left)</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Sterile white marble architecture frozen in time. Solid bridges, stasis walls, and crystalline resonance shards. Matter here is immutable.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/40">
            <div className="flex items-center gap-2 mb-1.5 text-amber-300 font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Decayed Realm (Right)</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Ruined industrial corridors, chasms, and crumbling floor tiles. Heavy rusted iron blocks can be shifted to press switches and bridge gaps.
            </p>
          </div>
        </div>

        {/* Rules Breakdown */}
        <div className="flex flex-col gap-3 text-xs">
          <div className="flex items-start gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800/70">
            <ArrowRightLeft className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-slate-200">1. Simultaneous Control & Desynchronization</h4>
              <p className="text-slate-400 leading-relaxed mt-0.5">
                Every movement key (<span className="text-slate-200 font-mono">W A S D</span> or <span className="text-slate-200 font-mono">Arrow Keys</span>) moves both avatars at once. If one hits an obstacle or wall while the other has an open path, the blocked avatar halts while the other continues, allowing you to intentionally shift alignment!
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800/70">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-slate-200">2. The Glitch Timer & Sanity</h4>
              <p className="text-slate-400 leading-relaxed mt-0.5">
                Staying in the rift causes visual static and screen tear. If destabilization reaches 100%, the rift collapses. Collect floating diamond shards or activate Zen Mode to pause the countdown.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800/70">
            <Headphones className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-slate-200">3. Dynamic Spatial Binaural Audio & Distortion</h4>
              <p className="text-slate-400 leading-relaxed mt-0.5">
                Put on headphones! Pristine crystal chimes play in your left ear, while decayed industrial groans hum in your right ear.
                As the destabilization timer runs out, the <strong>Audio Effects Manager</strong> dynamically crushes low-pass filters down, expands cavernous convolution reverb, introduces waveshaper distortion, and induces pitch drift. When you solve a chamber, both tracks snap together into harmonic unison.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800/70">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-slate-200">4. Convergence (Win Condition)</h4>
              <p className="text-slate-400 leading-relaxed mt-0.5">
                Guide both characters to step onto their respective central Synchronization Anchors at the exact same moment to mend the severed timelines.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="py-2.5 px-6 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white transition-colors cursor-pointer"
          >
            Enter the Rift
          </button>
        </div>
      </div>
    </div>
  );
};
