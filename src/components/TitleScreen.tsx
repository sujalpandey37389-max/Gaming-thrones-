import React from 'react';
import { Volume2, VolumeX, BookOpen, Play, Shield, Zap } from 'lucide-react';
import { soundEngine } from '../audio/SoundEngine';

interface TitleScreenProps {
  onStart: () => void;
  onOpenGuide: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart,
  onOpenGuide,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-6 md:p-10 select-none">
      {/* Top Header / Spec Lockup */}
      <div className="flex items-center justify-between w-full">
        <div className="pointer-events-auto flex items-center space-x-3 bg-slate-900/80 border border-cyan-500/30 px-3.5 py-1.5 rounded-sm">
          <div className="w-2 h-2 rounded-full bg-cyan-400" />
          <span className="text-xs font-mono tracking-widest text-cyan-300 font-semibold uppercase">
            System Online // Three.js PBR v1.0
          </span>
        </div>

        <div className="pointer-events-auto flex items-center space-x-2">
          <button
            onClick={onToggleMute}
            className="flex items-center space-x-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 px-3 py-1.5 rounded-sm text-xs font-mono transition-colors"
            title="Toggle Audio (M)"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            <span>{isMuted ? 'MUTED' : 'AUDIO ON'}</span>
          </button>

          <button
            onClick={onOpenGuide}
            className="flex items-center space-x-2 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 px-3.5 py-1.5 rounded-sm text-xs font-mono tracking-wider font-semibold transition-all hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]"
          >
            <BookOpen className="w-4 h-4" />
            <span>HOW IT'S MADE</span>
          </button>
        </div>
      </div>

      {/* Hero Title Lockup & 35% Negative Space */}
      <div className="my-auto max-w-xl">
        {/* Bespoke Inline SVG Sci-Fi Logo */}
        <div className="mb-4">
          <svg className="w-full max-w-md h-auto" viewBox="0 0 460 76" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#00f0ff" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>
            </defs>
            {/* Tech polygon icon */}
            <polygon points="12,18 36,6 48,22 36,54 12,42" stroke="#38bdf8" strokeWidth="2.5" fill="#0369a1" fillOpacity="0.3" />
            <circle cx="28" cy="30" r="5" fill="#38bdf8" />
            
            {/* Main title text */}
            <text x="64" y="44" fontFamily="monospace, system-ui, sans-serif" fontWeight="900" fontSize="38" letterSpacing="4" fill="url(#titleGrad)">
              STEEL HORIZON
            </text>
            <text x="66" y="68" fontFamily="monospace, system-ui, sans-serif" fontWeight="600" fontSize="13" letterSpacing="6" fill="#94a3b8">
              3D MECH SURVIVAL ARENA
            </text>
          </svg>
        </div>

        <p className="text-slate-400 text-sm font-sans leading-relaxed mb-6 max-w-md">
          Command an experimental hover battle mech in a procedural sci-fi canyon. Repel drone swarms, dodge heavy mortar telegraphs, and eliminate the dreadnought boss.
        </p>

        {/* Feature Badges */}
        <div className="grid grid-cols-2 gap-2 mb-8 max-w-sm text-xs font-mono text-slate-300">
          <div className="flex items-center space-x-2 bg-slate-900/60 border border-slate-800 p-2 rounded-sm">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Procedural 3D & Synth</span>
          </div>
          <div className="flex items-center space-x-2 bg-slate-900/60 border border-slate-800 p-2 rounded-sm">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Hitstop & 60fps Loop</span>
          </div>
        </div>

        {/* Primary CTA & Interactive Button */}
        <div className="pointer-events-auto flex items-center space-x-4">
          <button
            onClick={onStart}
            className="flex items-center justify-center space-x-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 px-8 py-3.5 rounded-sm font-mono font-bold tracking-wider text-sm transition-all shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:shadow-[0_0_35px_rgba(6,182,212,0.7)] hover:scale-105 active:scale-95"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            <span>LAUNCH MISSION</span>
          </button>
        </div>
      </div>

      {/* Flat Control Hints Bar */}
      <div className="w-full flex flex-col md:flex-row items-center justify-between text-xs font-mono text-slate-400 border-t border-slate-800/80 pt-4 bg-slate-950/60 p-2 rounded-sm">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-cyan-400 font-semibold">CONTROLS:</span>
          <span>WASD Move · Mouse Aim · Left Click / F Fire · <strong className="text-amber-400 font-bold">Q / Scroll / 1-2</strong> Switch Weapon · Space / Shift Boost · Esc Pause</span>
        </div>
        <div className="text-slate-500 mt-2 md:mt-0">
          Press <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">Enter</kbd> or <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">Space</kbd> to Launch
        </div>
      </div>
    </div>
  );
};
