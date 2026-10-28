import React from 'react';
import { Volume2, VolumeX, BookOpen, Play, Shield, Zap, Home } from 'lucide-react';
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
    <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-4 md:p-8 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between w-full">
        <div className="pointer-events-auto flex items-center space-x-2.5 bg-slate-900/85 border border-cyan-500/30 px-3.5 py-1.5 rounded-xl shadow-md backdrop-blur-md">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-mono tracking-widest text-cyan-300 font-semibold uppercase">
            HOMESTEAD DEFENSE // 3D ARENA
          </span>
        </div>

        <div className="pointer-events-auto flex items-center space-x-2">
          <button
            onClick={onToggleMute}
            className="flex items-center space-x-1.5 bg-slate-900/85 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 px-3 py-1.5 rounded-xl text-xs font-mono transition-colors shadow-md backdrop-blur-md"
            title="Toggle Audio (M)"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            <span>{isMuted ? 'MUTED' : 'AUDIO ON'}</span>
          </button>

          <button
            onClick={onOpenGuide}
            className="flex items-center space-x-1.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 px-3.5 py-1.5 rounded-xl text-xs font-mono tracking-wider font-semibold transition-all hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] backdrop-blur-md shadow-md"
          >
            <BookOpen className="w-4 h-4" />
            <span>ARCHITECTURE</span>
          </button>
        </div>
      </div>

      {/* Hero Title Lockup */}
      <div className="my-auto max-w-xl">
        {/* SVG Title Logo */}
        <div className="mb-3">
          <svg className="w-full max-w-md h-auto" viewBox="0 0 460 76" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#00f0ff" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>
            </defs>
            <polygon points="12,18 36,6 48,22 36,54 12,42" stroke="#38bdf8" strokeWidth="2.5" fill="#0369a1" fillOpacity="0.3" />
            <circle cx="28" cy="30" r="5" fill="#38bdf8" />
            
            <text x="64" y="44" fontFamily="monospace, system-ui, sans-serif" fontWeight="900" fontSize="38" letterSpacing="4" fill="url(#titleGrad)">
              STEEL HORIZON
            </text>
            <text x="66" y="68" fontFamily="monospace, system-ui, sans-serif" fontWeight="600" fontSize="13" letterSpacing="6" fill="#94a3b8">
              PILOT & BATTLE TANK DEFENSE
            </text>
          </svg>
        </div>

        <p className="text-slate-300 text-sm font-sans leading-relaxed mb-4 max-w-md">
          Invading hostile forces are advancing upon your frontier homestead outpost.
          Emerge on foot, sprint to the docked <strong>Heavy Battle Tank</strong>, board the armored turret, and unleash twin-cannon devastation to defend your home.
        </p>

        {/* Feature Badges */}
        <div className="grid grid-cols-2 gap-2 mb-6 max-w-sm text-xs font-mono text-slate-300">
          <div className="flex items-center space-x-2 bg-slate-900/70 border border-slate-800 p-2 rounded-lg">
            <Home className="w-3.5 h-3.5 text-emerald-400" />
            <span>Homestead Outpost Defense</span>
          </div>
          <div className="flex items-center space-x-2 bg-slate-900/70 border border-slate-800 p-2 rounded-lg">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>Pilot & Tank Mounting</span>
          </div>
        </div>

        {/* Primary CTA Launch Button */}
        <div className="pointer-events-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={onStart}
            onTouchStart={(e) => {
              e.preventDefault();
              onStart();
            }}
            className="flex items-center justify-center space-x-3 bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 hover:from-cyan-300 hover:to-blue-400 text-slate-950 px-8 py-3.5 rounded-xl font-mono font-black tracking-wider text-base transition-all shadow-[0_0_25px_rgba(6,182,212,0.5)] hover:shadow-[0_0_35px_rgba(6,182,212,0.8)] hover:scale-105 active:scale-95 cursor-pointer touch-manipulation"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            <span>START GAME // LAUNCH MISSION</span>
          </button>
        </div>
      </div>

      {/* Control Hints Bar */}
      <div className="w-full flex flex-col md:flex-row items-start md:items-center justify-between text-xs font-mono text-slate-400 border-t border-slate-800/80 pt-3 bg-slate-950/80 p-3 rounded-xl gap-2 backdrop-blur-md">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-cyan-400 font-bold">MOBILE / TOUCH:</span>
            <span className="text-slate-300">Left Joystick Move · Left Upper Weapon Swap · Right Bullet-In-Circle Fire · 360° Drag Aim · Enter Tank Button</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-400">
            <span className="text-slate-500 font-semibold">DESKTOP:</span>
            <span>WASD Move · Mouse 360° Aim · Left Click Fire · <strong className="text-emerald-400 font-bold">[E] Enter/Exit Tank</strong> · <strong className="text-amber-400 font-bold">[Q] Weapon Swap</strong></span>
          </div>
        </div>
        <div className="text-slate-500 self-end md:self-center text-[11px]">
          Press <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">Enter</kbd> or Tap Launch
        </div>
      </div>
    </div>
  );
};
