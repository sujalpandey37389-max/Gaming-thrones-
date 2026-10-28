import React from 'react';
import { Shield, Crosshair, Zap, Gauge, Wrench, X, Sparkles, CheckCircle, ArrowRight } from 'lucide-react';
import { GameStats, TankUpgrades, TANK_UPGRADE_INFOS, UPGRADE_MAX_LEVEL } from '../game/constants';

interface TankUpgradeModalProps {
  stats: GameStats;
  onClose: () => void;
  onUpgrade: (type: keyof TankUpgrades) => void;
}

export const TankUpgradeModal: React.FC<TankUpgradeModalProps> = ({
  stats,
  onClose,
  onUpgrade,
}) => {
  const currentScrap = stats.scrap ?? 0;
  const upgrades = stats.tankUpgrades ?? {
    hullArmorLevel: 1,
    cannonsLevel: 1,
    autoloaderLevel: 1,
    engineLevel: 1,
  };

  const getUpgradeCost = (key: keyof TankUpgrades, currentLvl: number) => {
    const info = TANK_UPGRADE_INFOS[key];
    return info.baseCost + (currentLvl - 1) * info.costStep;
  };

  const upgradeKeys: (keyof TankUpgrades)[] = [
    'hullArmorLevel',
    'cannonsLevel',
    'autoloaderLevel',
    'engineLevel',
  ];

  const getModuleIcon = (key: keyof TankUpgrades) => {
    switch (key) {
      case 'hullArmorLevel':
        return <Shield className="w-5 h-5 text-cyan-400" />;
      case 'cannonsLevel':
        return <Crosshair className="w-5 h-5 text-amber-400" />;
      case 'autoloaderLevel':
        return <Zap className="w-5 h-5 text-emerald-400" />;
      case 'engineLevel':
        return <Gauge className="w-5 h-5 text-purple-400" />;
    }
  };

  const getAccentColor = (key: keyof TankUpgrades) => {
    switch (key) {
      case 'hullArmorLevel':
        return 'border-cyan-500/50 bg-cyan-950/30 text-cyan-400';
      case 'cannonsLevel':
        return 'border-amber-500/50 bg-amber-950/30 text-amber-400';
      case 'autoloaderLevel':
        return 'border-emerald-500/50 bg-emerald-950/30 text-emerald-400';
      case 'engineLevel':
        return 'border-purple-500/50 bg-purple-950/30 text-purple-400';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-sm select-none font-mono">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-slate-950/95 border-2 border-cyan-500/60 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.3)] overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-400/60 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <Wrench className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-white tracking-wider">
                  TANKER MODIFICATION & UPGRADE BAY
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                  TECH TIER 1
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Spend collected combat scrap to upgrade armor, heavy cannons, autoloader, and engines.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Scrap Counter Display */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-950/70 border border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <div className="flex flex-col text-right">
                <span className="text-[9px] uppercase tracking-wider text-amber-300 font-bold">
                  AVAILABLE SCRAP
                </span>
                <span className="text-base font-black text-amber-300 tabular-nums leading-none">
                  {currentScrap.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Close (ESC / U)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Upgrade Cards Grid */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {upgradeKeys.map((key) => {
              const currentLvl = upgrades[key] || 1;
              const isMax = currentLvl >= UPGRADE_MAX_LEVEL;
              const cost = isMax ? 0 : getUpgradeCost(key, currentLvl);
              const canAfford = !isMax && currentScrap >= cost;
              const info = TANK_UPGRADE_INFOS[key];
              const currentVal = info.values[currentLvl - 1];
              const nextVal = isMax ? null : info.values[currentLvl];

              return (
                <div
                  key={key}
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-all duration-200 ${
                    isMax
                      ? 'bg-slate-900/50 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                      : canAfford
                      ? 'bg-slate-900/90 border-slate-700 hover:border-cyan-400 shadow-md'
                      : 'bg-slate-900/40 border-slate-800/80 opacity-80'
                  }`}
                >
                  {/* Title & Level Indicator */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-lg border ${getAccentColor(key)}`}>
                          {getModuleIcon(key)}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white tracking-wide">
                            {info.title}
                          </h4>
                          <span className="text-[10px] text-slate-400">
                            LEVEL {currentLvl} OF {UPGRADE_MAX_LEVEL}
                          </span>
                        </div>
                      </div>

                      {/* Level Pips */}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: UPGRADE_MAX_LEVEL }).map((_, idx) => (
                          <div
                            key={idx}
                            className={`w-2.5 h-3.5 rounded-sm transition-all ${
                              idx < currentLvl
                                ? isMax
                                  ? 'bg-emerald-400 shadow-[0_0_6px_#10b981]'
                                  : 'bg-cyan-400 shadow-[0_0_6px_#06b6d4]'
                                : 'bg-slate-800 border border-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
                      {info.description}
                    </p>

                    {/* Stat Transition Card */}
                    <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs mb-3">
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">
                          CURRENT
                        </span>
                        <span className="font-bold text-slate-200">{currentVal}</span>
                      </div>

                      {!isMax && nextVal && (
                        <>
                          <ArrowRight className="w-3.5 h-3.5 text-cyan-400 mx-1 flex-shrink-0 animate-pulse" />
                          <div className="flex flex-col text-right">
                            <span className="text-[9px] uppercase tracking-wider text-cyan-400 font-bold">
                              UPGRADED
                            </span>
                            <span className="font-bold text-cyan-300 drop-shadow">{nextVal}</span>
                          </div>
                        </>
                      )}

                      {isMax && (
                        <div className="flex items-center gap-1 text-emerald-400 font-bold text-xs">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          <span>MAX TIER</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Purchase Button */}
                  <div>
                    {isMax ? (
                      <div className="w-full py-2 px-3 rounded-lg bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5">
                        <CheckCircle className="w-4 h-4" />
                        <span>SYSTEM AT PEAK PERFORMANCE</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => onUpgrade(key)}
                        disabled={!canAfford}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-between transition-all duration-150 active:scale-98 ${
                          canAfford
                            ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)] cursor-pointer'
                            : 'bg-slate-800/60 border border-slate-700/60 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <span className="tracking-wider">INSTALL UPGRADE</span>
                        <div className="flex items-center gap-1.5 font-black tabular-nums">
                          <Sparkles className={`w-3.5 h-3.5 ${canAfford ? 'text-amber-300' : 'text-slate-600'}`} />
                          <span className={canAfford ? 'text-amber-200' : 'text-slate-500'}>
                            {cost} SCRAP
                          </span>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Launch Action */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between gap-3">
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Tip: Press <span className="text-cyan-400 font-bold">[U]</span> at any time during battle to launch upgrades.
          </span>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black tracking-wider uppercase border border-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-all active:scale-98"
          >
            LAUNCH TANK WITH UPGRADES
          </button>
        </div>
      </div>
    </div>
  );
};
