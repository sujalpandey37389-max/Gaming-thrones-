import { Shield, Heart, Zap, Volume2, VolumeX, Settings, Crosshair, Target, Smartphone, Home, UserCheck, ShieldCheck, Wrench, Sparkles, Navigation, MapPin } from 'lucide-react';
import { GameStats, WeaponType, WEAPON_CONFIGS, MAX_HEALTH, MAX_SHIELD, MAX_HOUSE_HP, ARENA_RADIUS } from '../game/constants';

interface GameHUDProps {
  stats: GameStats;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenGuide: () => void;
  onPause: () => void;
  onSwitchWeapon?: (type?: WeaponType) => void;
  onEnterExitTank?: () => void;
  onOpenUpgrades?: () => void;
  isMobileControlsVisible?: boolean;
  onToggleMobileControls?: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  stats,
  isMuted,
  onToggleMute,
  onOpenGuide,
  onPause,
  onSwitchWeapon,
  onEnterExitTank,
  onOpenUpgrades,
  isMobileControlsVisible = false,
  onToggleMobileControls,
}) => {
  const shieldPercent = Math.max(0, Math.min(100, (stats.shield / MAX_SHIELD) * 100));
  const healthPercent = Math.max(0, Math.min(100, (stats.health / MAX_HEALTH) * 100));
  const housePercent = Math.max(0, Math.min(100, ((stats.houseHp ?? MAX_HOUSE_HP) / MAX_HOUSE_HP) * 100));
  const boostPercent = Math.max(0, Math.min(100, stats.boostStamina));
  const comboMultiplier = Math.min(5, 1 + Math.floor(stats.combo / 4) * 0.5);

  const isTank = stats.playerMode === 'tank';

  return (
    <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-3 md:p-5 select-none font-mono">
      {/* ========================================================
          TOP PERIMETER CLUSTER
          ======================================================== */}
      <div className="flex items-start justify-between w-full gap-2">
        {/* Left: Player Vitality & Homestead Defense Status */}
        <div className="flex flex-col space-y-1.5 bg-slate-950/90 border border-slate-800 p-2.5 rounded-xl shadow-lg min-w-[210px] backdrop-blur-md">
          {/* Active Unit Badge (Pilot vs Tank) */}
          <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              ACTIVE UNIT:
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                isTank
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
              }`}
            >
              {isTank ? <ShieldCheck className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
              {isTank ? 'HEAVY BATTLE TANK' : 'PILOT (ON FOOT)'}
            </span>
          </div>

          {/* Homestead Outpost Integrity */}
          <div>
            <div className="flex items-center justify-between text-[11px] mb-0.5 font-bold">
              <span className="flex items-center space-x-1.5 text-emerald-400">
                <Home className="w-3.5 h-3.5" />
                <span>HOMESTEAD BASE</span>
              </span>
              <span className={`tabular-nums ${housePercent < 30 ? 'text-rose-400 animate-pulse' : 'text-emerald-300'}`}>
                {Math.round(stats.houseHp ?? MAX_HOUSE_HP)}{' '}
                <span className="text-slate-500 font-normal">/ {MAX_HOUSE_HP}</span>
              </span>
            </div>
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-150 ${
                  housePercent < 30 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-400'
                }`}
                style={{ width: `${housePercent}%` }}
              />
            </div>
          </div>

          {/* Energy Shield Bar */}
          <div>
            <div className="flex items-center justify-between text-[11px] text-cyan-400 mb-0.5">
              <span className="flex items-center space-x-1.5 font-bold">
                <Shield className="w-3.5 h-3.5" />
                <span>ENERGY SHIELD</span>
              </span>
              <span className="tabular-nums font-bold">{Math.round(stats.shield)}</span>
            </div>
            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
              <div
                className="bg-cyan-400 h-full transition-all duration-100 ease-out"
                style={{ width: `${shieldPercent}%` }}
              />
            </div>
          </div>

          {/* Player Health Bar (200 HP) */}
          <div>
            <div className="flex items-center justify-between text-[11px] text-rose-400 mb-0.5">
              <span className="flex items-center space-x-1.5 font-bold">
                <Heart className="w-3.5 h-3.5" />
                <span>HEALTH INTEGRITY</span>
              </span>
              <span className="tabular-nums font-bold">
                {Math.round(stats.health)}{' '}
                <span className="text-slate-500 font-normal">/ {MAX_HEALTH}</span>
              </span>
            </div>
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
              <div
                className="bg-rose-500 h-full transition-all duration-100 ease-out"
                style={{ width: `${healthPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Center: Wave & Boss Indicator */}
        <div className="flex flex-col items-center">
          {stats.bossHealthPercent !== undefined ? (
            <div className="flex flex-col items-center bg-red-950/90 border border-red-500/50 px-5 py-2 rounded-xl shadow-lg backdrop-blur-md">
              <span className="text-xs font-bold text-red-400 tracking-wider mb-1 flex items-center space-x-1.5">
                <Crosshair className="w-3.5 h-3.5 animate-pulse text-red-400" />
                <span>TITAN DREADNOUGHT CORE</span>
              </span>
              <div className="w-48 bg-slate-900 h-2.5 rounded-full overflow-hidden border border-red-900">
                <div
                  className="bg-red-500 h-full transition-all duration-100"
                  style={{ width: `${stats.bossHealthPercent}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/85 border border-slate-800 px-4 py-1.5 rounded-xl flex items-center space-x-3 backdrop-blur-md shadow-md">
              <span className="text-xs font-bold text-cyan-400 tracking-widest">
                WAVE <span className="text-white text-sm">{stats.wave}</span>
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-xs text-slate-400">
                HOSTILES: <span className="tabular-nums font-bold text-slate-200">{stats.enemiesRemaining}</span>
              </span>
            </div>
          )}

          {/* Contextual Boarding Alert when Pilot is near Tank */}
          {stats.canEnterTank && stats.playerMode === 'pilot' && (
            <div
              onClick={onEnterExitTank}
              className="mt-2 pointer-events-auto cursor-pointer flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/90 border-2 border-cyan-400 text-cyan-300 text-xs font-bold shadow-[0_0_25px_rgba(6,182,212,0.6)] animate-pulse"
            >
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>BATTLE TANK READY — PRESS [E] OR TAP ENTER TANK</span>
            </div>
          )}
        </div>

        {/* Right: Score, Controls & Settings */}
        <div className="flex flex-col items-end space-y-2">
          {/* Quick Settings icons */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            {/* TANKER UPGRADE LAUNCH BUTTON */}
            <button
              onClick={onOpenUpgrades}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all active:scale-95 shadow-lg ${
                (stats.scrap ?? 0) >= 90
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 border-amber-300 text-white shadow-[0_0_20px_rgba(245,158,11,0.5)] animate-pulse'
                  : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title="Launch Tanker Modification Bay (U)"
            >
              <Wrench className="w-4 h-4 text-amber-300" />
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-black uppercase tracking-wider">
                  TANK UPGRADES
                </span>
                <span className="text-[9px] font-bold text-amber-200">
                  {stats.scrap ?? 0} SCRAP [U]
                </span>
              </div>
            </button>

            <button
              onClick={onToggleMobileControls}
              className={`p-2 rounded-lg border transition-all ${
                isMobileControlsVisible
                  ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-400'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle On-Screen Touch Controls"
            >
              <Smartphone className="w-4 h-4" />
            </button>
            <button
              onClick={onToggleMute}
              className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title="Toggle Audio (M)"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            </button>
            <button
              onClick={onOpenGuide}
              className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title="Open Architecture & Tuning Guide"
            >
              <Settings className="w-4 h-4 text-slate-400" />
            </button>
            <button
              onClick={onPause}
              className="px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300 hover:text-white transition-colors"
              title="Pause Game (ESC / P)"
            >
              PAUSE
            </button>
          </div>

          <div className="flex items-start gap-2">
            {/* Tactical Radar / Minimap for Large Map */}
            <div className="relative w-28 h-28 rounded-2xl bg-slate-950/95 border border-cyan-500/40 p-1 shadow-lg backdrop-blur-md overflow-hidden flex items-center justify-center">
              {/* Radar Grid Circles */}
              <div className="absolute inset-2 rounded-full border border-cyan-500/20" />
              <div className="absolute inset-6 rounded-full border border-dashed border-cyan-500/30" />
              <div className="absolute inset-10 rounded-full border border-cyan-500/20" />
              <div className="absolute w-full h-[1px] bg-cyan-500/15" />
              <div className="absolute h-full w-[1px] bg-cyan-500/15" />

              {/* Sweeping Radar beam */}
              <div
                className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-cyan-500/10 to-transparent pointer-events-none animate-spin"
                style={{ animationDuration: '4s' }}
              />

              {/* Compass North label */}
              <span className="absolute top-1 text-[8px] font-bold text-cyan-400/80">N</span>

              {/* Blips relative to ARENA_RADIUS (140) */}
              {stats.radarBlips?.map((blip, idx) => {
                const normX = Math.max(-1, Math.min(1, blip.x / ARENA_RADIUS));
                const normZ = Math.max(-1, Math.min(1, blip.z / ARENA_RADIUS));
                const px = 50 + normX * 42;
                const py = 50 + normZ * 42;

                if (blip.type === 'player') {
                  return (
                    <div
                      key={idx}
                      className="absolute w-2.5 h-2.5 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-10"
                      style={{ left: `${px}%`, top: `${py}%` }}
                    >
                      <Navigation
                        className="w-3 h-3 text-emerald-400 drop-shadow-[0_0_6px_#10b981]"
                        style={{ transform: `rotate(${(blip.rot || 0) * (180 / Math.PI)}deg)` }}
                      />
                    </div>
                  );
                }

                if (blip.type === 'tank') {
                  return (
                    <div
                      key={idx}
                      className="absolute w-2 h-2 rounded-sm bg-cyan-400 border border-white transform -translate-x-1/2 -translate-y-1/2 shadow-[0_0_6px_#06b6d4]"
                      style={{ left: `${px}%`, top: `${py}%` }}
                      title="Parked Tank"
                    />
                  );
                }

                if (blip.type === 'house') {
                  return (
                    <div
                      key={idx}
                      className="absolute w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-200 transform -translate-x-1/2 -translate-y-1/2 shadow-[0_0_8px_#10b981]"
                      style={{ left: `${px}%`, top: `${py}%` }}
                      title="Homestead Outpost"
                    />
                  );
                }

                if (blip.type === 'boss') {
                  return (
                    <div
                      key={idx}
                      className="absolute w-3 h-3 rounded-full bg-rose-500 border-2 border-white transform -translate-x-1/2 -translate-y-1/2 animate-ping shadow-[0_0_10px_#f43f5e]"
                      style={{ left: `${px}%`, top: `${py}%` }}
                      title="Warlord Commander Boss"
                    />
                  );
                }

                // Normal infantry soldier enemy blip
                return (
                  <div
                    key={idx}
                    className="absolute w-1.5 h-1.5 rounded-full bg-rose-500 transform -translate-x-1/2 -translate-y-1/2 shadow-[0_0_4px_#ef4444]"
                    style={{ left: `${px}%`, top: `${py}%` }}
                  />
                );
              })}
            </div>

            {/* Score & Combo */}
            <div className="flex flex-col items-end space-y-1 bg-slate-950/85 border border-slate-800 p-2.5 rounded-xl min-w-[130px] backdrop-blur-md shadow-md">
              <div className="text-[10px] text-slate-400 font-semibold tracking-widest uppercase">DEFENSE SCORE</div>
              <div className="text-lg font-black text-cyan-300 tabular-nums tracking-wide">
                {stats.score.toLocaleString()}
              </div>
              {stats.combo > 1 && (
                <div className="flex items-center space-x-1 bg-amber-950/80 border border-amber-500/50 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-md">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>{comboMultiplier}x COMBO ({stats.combo})</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          BOTTOM PERIMETER CLUSTER
          ======================================================== */}
      <div className="flex items-end justify-between gap-3 w-full">
        {/* Left: Thruster Boost Gauge (hidden on mobile if mobile controls overlay is active to prevent overlap) */}
        {!isMobileControlsVisible && (
          <div className="flex bg-slate-950/85 border border-slate-800 p-2.5 rounded-xl flex-col space-y-1 min-w-[180px] backdrop-blur-md shadow-md">
            <div className="flex items-center justify-between text-xs text-cyan-400 font-bold">
              <span className="flex items-center space-x-1">
                <Zap className="w-3.5 h-3.5" />
                <span>THRUSTER BOOST</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {stats.canBoost ? '[READY]' : '[CHARGING]'}
              </span>
            </div>
            <div className="w-full bg-slate-900 h-2 rounded-full border border-slate-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-75 ${
                  stats.canBoost ? 'bg-cyan-400' : 'bg-slate-600'
                }`}
                style={{ width: `${boostPercent}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500">Space / Shift to Boost</span>
          </div>
        )}

        {/* Center: Tactical Armament Selector (desktop) */}
        {!isMobileControlsVisible && (
          <div className="pointer-events-auto flex flex-col items-center bg-slate-950/90 border border-slate-800 px-3 py-2 rounded-xl shadow-xl backdrop-blur-md self-center">
            <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-semibold tracking-wider uppercase mb-1.5">
              <span className="flex items-center space-x-1">
                <Target className="w-3 h-3 text-cyan-400" />
                <span>ACTIVE ARMAMENT</span>
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-cyan-300 font-bold tracking-normal">[Q] to Switch</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => onSwitchWeapon && onSwitchWeapon('plasma_repeater')}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                  stats.currentWeapon === 'plasma_repeater'
                    ? 'bg-cyan-950/90 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)] font-bold'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                1. Twin Plasma
              </button>
              <button
                onClick={() => onSwitchWeapon && onSwitchWeapon('burst_rifle')}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                  stats.currentWeapon === 'burst_rifle'
                    ? 'bg-amber-950/90 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.4)] font-bold'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                2. Valkyrie Burst
              </button>
            </div>
          </div>
        )}

        {/* Spacer */}
        <div className="w-2" />
      </div>
    </div>
  );
};
