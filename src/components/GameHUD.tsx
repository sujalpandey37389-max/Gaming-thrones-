import React from 'react';
import { Shield, Heart, Zap, Volume2, VolumeX, Settings, Crosshair, Target } from 'lucide-react';
import { GameStats, WeaponType, WEAPON_CONFIGS } from '../game/constants';

interface GameHUDProps {
  stats: GameStats;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenGuide: () => void;
  onPause: () => void;
  onSwitchWeapon?: (type?: WeaponType) => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  stats,
  isMuted,
  onToggleMute,
  onOpenGuide,
  onPause,
  onSwitchWeapon,
}) => {
  const shieldPercent = Math.max(0, Math.min(100, (stats.shield / 100) * 100));
  const healthPercent = Math.max(0, Math.min(100, (stats.health / 100) * 100));
  const boostPercent = Math.max(0, Math.min(100, stats.boostStamina));
  const comboMultiplier = Math.min(5, 1 + Math.floor(stats.combo / 4) * 0.5);

  return (
    <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-4 md:p-6 select-none font-mono">
      {/* Top Perimeter Cluster */}
      <div className="flex items-start justify-between w-full">
        {/* Left: Hull & Shield Status */}
        <div className="flex flex-col space-y-2 bg-slate-950/85 border border-slate-800 p-3 rounded-sm shadow-md min-w-[210px]">
          {/* Shield Bar */}
          <div>
            <div className="flex items-center justify-between text-xs text-cyan-400 mb-1">
              <span className="flex items-center space-x-1.5 font-bold">
                <Shield className="w-3.5 h-3.5" />
                <span>ENERGY SHIELD</span>
              </span>
              <span className="tabular-nums font-bold">{Math.round(stats.shield)}</span>
            </div>
            <div className="w-full bg-slate-900 h-2 rounded-none overflow-hidden border border-slate-800">
              <div
                className="bg-cyan-400 h-full transition-all duration-100 ease-out"
                style={{ width: `${shieldPercent}%` }}
              />
            </div>
          </div>

          {/* Hull Integrity Bar */}
          <div>
            <div className="flex items-center justify-between text-xs text-rose-400 mb-1">
              <span className="flex items-center space-x-1.5 font-bold">
                <Heart className="w-3.5 h-3.5" />
                <span>HULL INTEGRITY</span>
              </span>
              <span className="tabular-nums font-bold">{Math.round(stats.health)}</span>
            </div>
            <div className="w-full bg-slate-900 h-2 rounded-none overflow-hidden border border-slate-800">
              <div
                className="bg-rose-500 h-full transition-all duration-100 ease-out"
                style={{ width: `${healthPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Center: Wave & Boss Health Indicator */}
        <div className="flex flex-col items-center">
          {stats.bossHealthPercent !== undefined ? (
            <div className="flex flex-col items-center bg-red-950/90 border border-red-500/50 px-5 py-2 rounded-sm shadow-lg">
              <span className="text-xs font-bold text-red-400 tracking-wider mb-1 flex items-center space-x-1.5">
                <Crosshair className="w-3.5 h-3.5 animate-pulse text-red-400" />
                <span>DREADNOUGHT TITAN CORE</span>
              </span>
              <div className="w-48 bg-slate-900 h-2.5 rounded-none overflow-hidden border border-red-900">
                <div
                  className="bg-red-500 h-full transition-all duration-100"
                  style={{ width: `${stats.bossHealthPercent}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/85 border border-slate-800 px-4 py-1.5 rounded-sm flex items-center space-x-3">
              <span className="text-xs font-bold text-cyan-400 tracking-widest">
                WAVE <span className="text-slate-100">{stats.wave}</span>
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-xs text-slate-400">
                ENEMIES: <span className="tabular-nums font-bold text-slate-200">{stats.enemiesRemaining}</span>
              </span>
            </div>
          )}
        </div>

        {/* Right: Score & Active Combo */}
        <div className="flex flex-col items-end space-y-1.5 bg-slate-950/85 border border-slate-800 p-3 rounded-sm min-w-[160px]">
          <div className="text-[10px] text-slate-400 font-semibold tracking-widest uppercase">SCORE</div>
          <div className="text-lg md:text-xl font-black text-cyan-300 tabular-nums tracking-wide">
            {stats.score.toLocaleString()}
          </div>

          {stats.combo > 1 && (
            <div className="flex items-center space-x-1 bg-amber-950/80 border border-amber-500/50 text-amber-300 text-[11px] font-bold px-2 py-0.5 rounded-sm">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>{comboMultiplier}x COMBO ({stats.combo})</span>
            </div>
          )}
        </div>
      </div>

      {/* Center 85% is completely unobstructed for seamless 60fps gameplay */}

      {/* Bottom Perimeter Cluster */}
      <div className="flex flex-col md:flex-row items-stretch md:items-end justify-between gap-3 w-full">
        {/* Left: Boost Stamina Gauge */}
        <div className="bg-slate-950/85 border border-slate-800 p-3 rounded-sm flex flex-col space-y-1 min-w-[190px]">
          <div className="flex items-center justify-between text-xs text-cyan-400 font-bold">
            <span className="flex items-center space-x-1">
              <Zap className="w-3.5 h-3.5" />
              <span>THRUSTER BOOST</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {stats.canBoost ? '[READY]' : '[RECHARGING]'}
            </span>
          </div>
          <div className="w-full bg-slate-900 h-2 border border-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-75 ${
                stats.canBoost ? 'bg-cyan-400' : 'bg-slate-600'
              }`}
              style={{ width: `${boostPercent}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-500">Space / Shift / Right-Click to Boost</span>
        </div>

        {/* Center: Tactical Armament Selector */}
        <div className="pointer-events-auto flex flex-col items-center bg-slate-950/90 border border-slate-800 px-3 py-2 rounded-sm shadow-xl backdrop-blur-sm self-center">
          <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-semibold tracking-wider uppercase mb-1.5">
            <span className="flex items-center space-x-1">
              <Target className="w-3 h-3 text-cyan-400" />
              <span>ACTIVE ARMAMENT</span>
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-cyan-300 font-bold tracking-normal">[Q] or Scroll to Switch</span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Weapon 1: Twin Plasma Repeater */}
            <button
              onClick={() => onSwitchWeapon?.('plasma_repeater')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-sm border transition-all text-xs cursor-pointer ${
                stats.currentWeapon === 'plasma_repeater'
                  ? 'bg-cyan-950/90 border-cyan-400 text-cyan-100 shadow-[0_0_14px_rgba(56,189,248,0.35)] ring-1 ring-cyan-400/50'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
              title="Select Primary: Twin Plasma Repeater (Press 1 or Q)"
            >
              <div className="flex flex-col items-start text-left">
                <div className="flex items-center space-x-1.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      stats.currentWeapon === 'plasma_repeater' ? 'bg-cyan-400 shadow-[0_0_6px_#38bdf8] animate-pulse' : 'bg-slate-600'
                    }`}
                  />
                  <span className="font-bold tracking-wide">
                    <span className="text-slate-500 mr-1 text-[10px]">[1]</span>REPEATER
                  </span>
                </div>
                <span className="text-[9px] text-cyan-400/90 font-mono tracking-wider">RAPID PULSE</span>
              </div>
              {stats.currentWeapon === 'plasma_repeater' && (
                <span className="text-[9px] font-bold bg-cyan-400/20 text-cyan-300 px-1 py-0.5 rounded border border-cyan-400/50">
                  EQUIPPED
                </span>
              )}
            </button>

            {/* Weapon 2: Valkyrie Burst Rifle */}
            <button
              onClick={() => onSwitchWeapon?.('burst_rifle')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-sm border transition-all text-xs cursor-pointer ${
                stats.currentWeapon === 'burst_rifle'
                  ? 'bg-amber-950/90 border-amber-400 text-amber-100 shadow-[0_0_14px_rgba(245,158,11,0.35)] ring-1 ring-amber-400/50'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
              title="Select Secondary: Valkyrie Burst Rifle (Press 2 or Q)"
            >
              <div className="flex flex-col items-start text-left">
                <div className="flex items-center space-x-1.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      stats.currentWeapon === 'burst_rifle' ? 'bg-amber-400 shadow-[0_0_6px_#f59e0b] animate-pulse' : 'bg-slate-600'
                    }`}
                  />
                  <span className="font-bold tracking-wide">
                    <span className="text-slate-500 mr-1 text-[10px]">[2]</span>BURST RIFLE
                  </span>
                </div>
                <span className="text-[9px] text-amber-400/90 font-mono tracking-wider">3-RD SALVO</span>
              </div>
              {stats.currentWeapon === 'burst_rifle' && (
                <span className="text-[9px] font-bold bg-amber-400/20 text-amber-300 px-1 py-0.5 rounded border border-amber-400/50">
                  EQUIPPED
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Right: Actions & Tools Dock */}
        <div className="pointer-events-auto flex items-center space-x-2 justify-end">
          <button
            onClick={onToggleMute}
            className="flex items-center space-x-1.5 bg-slate-950/85 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-cyan-300 px-3 py-2 rounded-sm text-xs transition-colors cursor-pointer"
            title="Toggle Audio (M)"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          <button
            onClick={onOpenGuide}
            className="flex items-center space-x-1.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 px-3.5 py-2 rounded-sm text-xs font-semibold transition-colors cursor-pointer"
            title="How to create a game: Engine Architecture & Live Tuning"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">DEV GUIDE & TUNING</span>
          </button>

          <button
            onClick={onPause}
            className="flex items-center space-x-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 px-3 py-2 rounded-sm text-xs font-semibold transition-colors cursor-pointer"
          >
            <span>PAUSE (ESC)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
