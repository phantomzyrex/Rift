import React from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface TouchControlsProps {
  onMove: (dx: number, dy: number) => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({ onMove }) => {
  return (
    <div className="md:hidden fixed bottom-14 right-4 z-40 select-none flex flex-col items-center">
      <div className="grid grid-cols-3 gap-1.5 p-2 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 shadow-2xl">
        <div />
        <button
          onClick={() => onMove(0, -1)}
          className="w-12 h-12 bg-slate-800/80 active:bg-cyan-600 text-slate-200 rounded-xl flex items-center justify-center transition-transform active:scale-95 shadow-md"
          aria-label="Move Up"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
        <div />

        <button
          onClick={() => onMove(-1, 0)}
          className="w-12 h-12 bg-slate-800/80 active:bg-cyan-600 text-slate-200 rounded-xl flex items-center justify-center transition-transform active:scale-95 shadow-md"
          aria-label="Move Left"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <button
          onClick={() => onMove(0, 1)}
          className="w-12 h-12 bg-slate-800/80 active:bg-cyan-600 text-slate-200 rounded-xl flex items-center justify-center transition-transform active:scale-95 shadow-md"
          aria-label="Move Down"
        >
          <ArrowDown className="w-6 h-6" />
        </button>

        <button
          onClick={() => onMove(1, 0)}
          className="w-12 h-12 bg-slate-800/80 active:bg-cyan-600 text-slate-200 rounded-xl flex items-center justify-center transition-transform active:scale-95 shadow-md"
          aria-label="Move Right"
        >
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
