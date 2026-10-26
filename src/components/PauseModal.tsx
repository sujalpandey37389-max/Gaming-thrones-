import React from 'react';
import { Play, RotateCcw, Home, BookOpen } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onTitle: () => void;
  onOpenGuide: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onTitle,
  onOpenGuide,
}) => {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/80 font-mono select-none">
      <div className="w-full max-w-sm bg-slate-900 border border-cyan-500/40 p-6 rounded-sm shadow-2xl">
        <h2 className="text-xl font-bold text-cyan-400 tracking-wider text-center mb-1">
          MISSION PAUSED
        </h2>
        <p className="text-[11px] text-slate-400 text-center uppercase tracking-widest mb-6">
          Simulation Suspended
        </p>

        <div className="flex flex-col space-y-2.5 mb-6">
          <button
            onClick={onResume}
            className="w-full flex items-center justify-center space-x-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold py-2.5 px-4 rounded-sm transition-colors"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>RESUME (ESC)</span>
          </button>

          <button
            onClick={onOpenGuide}
            className="w-full flex items-center justify-center space-x-2 bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-600/50 text-cyan-300 font-medium py-2.5 px-4 rounded-sm transition-colors text-xs"
          >
            <BookOpen className="w-4 h-4" />
            <span>GAME ARCHITECTURE & TUNING</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium py-2.5 px-4 rounded-sm transition-colors text-xs"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESTART MISSION</span>
          </button>

          <button
            onClick={onTitle}
            className="w-full flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 font-medium py-2.5 px-4 rounded-sm transition-colors text-xs"
          >
            <Home className="w-4 h-4" />
            <span>EXIT TO TITLE</span>
          </button>
        </div>

        {/* Controls quick summary */}
        <div className="border-t border-slate-800 pt-3 text-[11px] text-slate-400 space-y-1">
          <div className="flex justify-between">
            <span>Movement</span>
            <span className="text-slate-200">WASD / Arrows</span>
          </div>
          <div className="flex justify-between">
            <span>Target & Fire</span>
            <span className="text-slate-200">Mouse + Left Click / F</span>
          </div>
          <div className="flex justify-between">
            <span>Switch Weapon</span>
            <span className="text-amber-400 font-semibold">Q / Scroll / 1-2</span>
          </div>
          <div className="flex justify-between">
            <span>Thruster Boost</span>
            <span className="text-slate-200">Space / Shift / Right Click</span>
          </div>
          <div className="flex justify-between">
            <span>Toggle Mute</span>
            <span className="text-slate-200">M</span>
          </div>
        </div>
      </div>
    </div>
  );
};
