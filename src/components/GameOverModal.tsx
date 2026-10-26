import React from 'react';
import { RotateCcw, Home, Trophy, Skull, Zap, Clock } from 'lucide-react';
import { GameStats } from '../game/constants';

interface GameOverModalProps {
  stats: GameStats;
  onRestart: () => void;
  onTitle: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  onRestart,
  onTitle,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/80 font-mono select-none">
      <div className="w-full max-w-md bg-slate-900 border border-red-500/50 p-6 md:p-8 rounded-sm shadow-2xl relative overflow-hidden">
        {/* Decorative corner accents */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-red-400" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-red-400" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-red-400" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-red-400" />

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-950/80 border border-red-500 text-red-400 mb-3">
            <Skull className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-red-400 tracking-wider">HULL BREACHED</h2>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">
            Mech Combat Subsystems Terminated
          </p>
        </div>

        {/* Mission Debrief Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6 bg-slate-950/70 p-4 border border-slate-800 rounded-sm text-xs">
          <div className="flex items-center space-x-2.5">
            <Trophy className="w-4 h-4 text-amber-400" />
            <div>
              <div className="text-slate-400 text-[10px]">FINAL SCORE</div>
              <div className="text-base font-bold text-slate-100 tabular-nums">{stats.score.toLocaleString()}</div>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <Zap className="w-4 h-4 text-cyan-400" />
            <div>
              <div className="text-slate-400 text-[10px]">WAVES CLEARED</div>
              <div className="text-base font-bold text-cyan-300 tabular-nums">{stats.wave}</div>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <Skull className="w-4 h-4 text-rose-400" />
            <div>
              <div className="text-slate-400 text-[10px]">ENEMIES DESTROYED</div>
              <div className="text-base font-bold text-slate-100 tabular-nums">{stats.kills}</div>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <Clock className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="text-slate-400 text-[10px]">SURVIVAL TIME</div>
              <div className="text-base font-bold text-slate-100 tabular-nums">{formatTime(stats.timeAlive)}</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center space-y-2.5 sm:space-y-0 sm:space-x-3">
          <button
            onClick={onRestart}
            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold py-3 px-4 rounded-sm transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>REDEPLOY (R)</span>
          </button>

          <button
            onClick={onTitle}
            className="w-full flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-3 px-4 rounded-sm border border-slate-700 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>TITLE MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
