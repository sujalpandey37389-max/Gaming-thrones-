import React, { useEffect, useState } from 'react';
import { Smartphone, RotateCw } from 'lucide-react';

/**
 * LandscapeEnforcer
 * Enforces horizontal landscape mode for mobile & tablet gameplay.
 * Detects portrait orientation and presents a high-tech sci-fi rotation guide overlay.
 */
export const LandscapeEnforcer: React.FC = () => {
  const [isPortrait, setIsPortrait] = useState<boolean>(false);
  const [isMobileDevice, setIsMobileDevice] = useState<boolean>(false);

  useEffect(() => {
    const checkOrientation = () => {
      // Check if it's a touch / mobile device
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isNarrow = window.innerWidth <= 1024;
      const mobile = hasTouch || isNarrow;
      setIsMobileDevice(mobile);

      // Portrait check: height > width
      const portrait = window.innerHeight > window.innerWidth && mobile;
      setIsPortrait(portrait);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (!isPortrait) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-slate-950/98 backdrop-blur-xl select-none"
      style={{ touchAction: 'none' }}
    >
      <div className="relative max-w-sm w-full flex flex-col items-center text-center p-8 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.15)]">
        {/* Animated Rotating Phone Graphic */}
        <div className="relative w-28 h-28 mb-6 flex items-center justify-center">
          {/* Glowing orbital ring */}
          <div className="absolute inset-0 rounded-full border border-cyan-500/20 border-t-cyan-400 animate-spin" style={{ animationDuration: '3s' }} />

          {/* Rotating smartphone icon container */}
          <div className="relative animate-bounce" style={{ animationDuration: '2s' }}>
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.3)] transform rotate-90 transition-transform">
              <Smartphone className="w-10 h-10 text-cyan-400" />
            </div>
          </div>

          {/* Rotation arrow badge */}
          <div className="absolute -top-1 -right-1 p-1.5 rounded-full bg-cyan-500 text-slate-950 shadow-lg animate-pulse">
            <RotateCw className="w-4 h-4" />
          </div>
        </div>

        {/* Warning Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-cyan-400 text-xs font-mono tracking-wider uppercase mb-3">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          Landscape Mode Required
        </div>

        {/* Headline */}
        <h2 className="text-xl font-bold tracking-tight text-white mb-2 font-mono">
          ROTATE DEVICE HORIZONTALLY
        </h2>

        {/* Description */}
        <p className="text-xs text-slate-400 leading-relaxed max-w-xs mb-6">
          Steel Horizon tactical defense arena is optimized exclusively for horizontal landscape display.
          Please turn your phone sideways to engage mobile pilot controls.
        </p>

        {/* Tactical status readout */}
        <div className="w-full py-2 px-3 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-cyan-400/80 flex items-center justify-between">
          <span>ORIENTATION SENSOR:</span>
          <span className="text-amber-400 animate-pulse">AWAITING ROTATION [90°]</span>
        </div>
      </div>
    </div>
  );
};
