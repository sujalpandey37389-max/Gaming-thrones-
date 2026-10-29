import React from 'react';
import { GameStats } from '../types';
import { soundManager } from '../audio/soundManager';
import { RotateCcw, Trophy, Home, Compass, Coins, Zap, Gauge } from 'lucide-react';

interface GameOverModalProps {
  stats: GameStats;
  highScore: number;
  onRestart: () => void;
  onMenu: () => void;
  onDesignRoom?: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  highScore,
  onRestart,
  onMenu,
  onDesignRoom,
}) => {
  const isNewHighScore = stats.score >= highScore && stats.score > 0;

  return (
    <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-4 sm:p-6 select-none pointer-events-auto">
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
        {/* Crash alert */}
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-black tracking-widest uppercase mb-2">
          HIGHWAY WRECKED
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase mb-0.5">
          GAME OVER
        </h2>

        {isNewHighScore ? (
          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold my-1.5 animate-bounce">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>NEW HIGH SCORE RECORD!</span>
          </div>
        ) : (
          <p className="text-zinc-400 text-xs mb-2">You clipped a vehicle on the highway.</p>
        )}

        {/* Score Readout */}
        <div className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3 my-2">
          <div className="text-2xs font-bold text-zinc-400 uppercase tracking-widest">Final Score</div>
          <div className="text-3xl sm:text-4xl font-black text-white font-mono tabular-nums my-0.5">
            {stats.score.toLocaleString()}
          </div>
          <div className="text-2xs text-amber-400 font-semibold">
            All-Time High: {highScore.toLocaleString()} PTS
          </div>
        </div>

        {/* Breakdown Stats Grid */}
        <div className="grid grid-cols-2 gap-2 w-full text-left my-2">
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-2 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Compass className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-3xs text-zinc-400 font-medium uppercase">Distance</div>
              <div className="text-xs sm:text-sm font-bold text-zinc-100 font-mono">
                {Math.round(stats.distance).toLocaleString()} m
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-2 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-400">
              <Coins className="w-3.5 h-3.5 text-yellow-400" />
            </div>
            <div>
              <div className="text-3xs text-zinc-400 font-medium uppercase">Coins Earned</div>
              <div className="text-xs sm:text-sm font-bold text-zinc-100 font-mono">+{stats.coins}</div>
            </div>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-2 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
              <Zap className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div>
              <div className="text-3xs text-zinc-400 font-medium uppercase">Near Misses</div>
              <div className="text-xs sm:text-sm font-bold text-zinc-100 font-mono">{stats.nearMisses}</div>
            </div>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-2 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Gauge className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div>
              <div className="text-3xs text-zinc-400 font-medium uppercase">Top Speed</div>
              <div className="text-xs sm:text-sm font-bold text-zinc-100 font-mono">{stats.maxSpeedReached} km/h</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 w-full mt-3">
          <button
            onClick={() => {
              soundManager.playButton();
              onRestart();
            }}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-black text-xs sm:text-sm tracking-wider uppercase shadow-[0_0_20px_rgba(16,185,129,0.4)] active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-white/20"
          >
            <RotateCcw className="w-4 h-4" />
            <span>PLAY AGAIN</span>
          </button>

          {onDesignRoom && (
            <button
              onClick={() => {
                soundManager.playButton();
                onDesignRoom();
              }}
              className="py-3 px-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-cyan-400 font-bold text-xs uppercase tracking-wide transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer border border-zinc-800"
            >
              <span>GARAGE</span>
            </button>
          )}

          <button
            onClick={() => {
              soundManager.playButton();
              onMenu();
            }}
            className="py-3 px-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold text-xs uppercase tracking-wide transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer border border-zinc-800"
          >
            <Home className="w-4 h-4" />
            <span>LOBBY</span>
          </button>
        </div>
      </div>
    </div>
