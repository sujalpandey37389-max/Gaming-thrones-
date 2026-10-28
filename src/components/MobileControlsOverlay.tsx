import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Zap, Shield, ShieldAlert, Crosshair, Sparkles, Wrench } from 'lucide-react';
import { GameStats, WeaponType, WEAPON_CONFIGS } from '../game/constants';

interface MobileControlsOverlayProps {
  stats: GameStats;
  onMove: (x: number, y: number) => void;
  onFireChange: (isFiring: boolean) => void;
  onBoost: () => void;
  onSwitchWeapon: (type?: WeaponType) => void;
  onEnterExitTank?: () => void;
  onOpenUpgrades?: () => void;
  onAimDirection?: (dx: number, dy: number) => void;
  onScreenAim?: (clientX: number, clientY: number) => void;
}

export const MobileControlsOverlay: React.FC<MobileControlsOverlayProps> = ({
  stats,
  onMove,
  onFireChange,
  onBoost,
  onSwitchWeapon,
  onEnterExitTank,
  onOpenUpgrades,
  onAimDirection,
  onScreenAim,
}) => {
  // Joystick state (Left Side)
  const joystickRef = useRef<HTMLDivElement>(null);
  const joystickTouchIdRef = useRef<number | null>(null);
  const [joystickPos, setJoystickPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isJoystickActive, setIsJoystickActive] = useState<boolean>(false);

  // Aim Touch area state (Right Side Screen Scrolling / 360 Aiming)
  const aimAreaRef = useRef<HTMLDivElement>(null);
  const aimTouchIdRef = useRef<number | null>(null);
  const [isAiming, setIsAiming] = useState<boolean>(false);
  const [aimOffset, setAimOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const aimCenterRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Fire state
  const [isFiringActive, setIsFiringActive] = useState<boolean>(false);
  const fireTouchIdRef = useRef<number | null>(null);

  const JOYSTICK_RADIUS = 52;
  const currentWeaponConfig = WEAPON_CONFIGS[stats.currentWeapon];
  const isPlasma = stats.currentWeapon === 'plasma_repeater';

  // ==========================================
  // 1. LEFT SIDE JOYSTICK HANDLERS
  // ==========================================
  const handleJoystickStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
    if (!joystickRef.current) return;

    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      const touch = e.touches[e.touches.length - 1];
      joystickTouchIdRef.current = touch.identifier;
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clampedDist = Math.min(dist, JOYSTICK_RADIUS);
    const angle = Math.atan2(dy, dx);

    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;

    setJoystickPos({ x: knobX, y: knobY });
    setIsJoystickActive(true);

    const normX = knobX / JOYSTICK_RADIUS;
    const normY = knobY / JOYSTICK_RADIUS;
    onMove(normX, normY);
  }, [onMove]);

  const handleJoystickMove = useCallback((e: TouchEvent | MouseEvent) => {
    if (!isJoystickActive || !joystickRef.current) return;

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      let touch: Touch | null = null;
      for (let i = 0; i < e.touches.length; i++) {
        if (e.touches[i].identifier === joystickTouchIdRef.current) {
          touch = e.touches[i];
          break;
        }
      }
      if (!touch) return;
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clampedDist = Math.min(dist, JOYSTICK_RADIUS);
    const angle = Math.atan2(dy, dx);

    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;

    setJoystickPos({ x: knobX, y: knobY });

    const normX = knobX / JOYSTICK_RADIUS;
    const normY = knobY / JOYSTICK_RADIUS;
    onMove(normX, normY);
  }, [isJoystickActive, onMove]);

  const handleJoystickEnd = useCallback(() => {
    setIsJoystickActive(false);
    joystickTouchIdRef.current = null;
    setJoystickPos({ x: 0, y: 0 });
    onMove(0, 0);
  }, [onMove]);

  // ==========================================
  // 2. RIGHT SIDE SCREEN SCROLLING & 360 AIM HANDLERS
  // ==========================================
  const handleAimAreaTouchStart = useCallback((e: React.TouchEvent) => {
    // Check if touch is on action buttons
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;

    if (e.touches.length > 0) {
      const touch = e.touches[e.touches.length - 1];
      aimTouchIdRef.current = touch.identifier;
      aimCenterRef.current = { x: touch.clientX, y: touch.clientY };
      setIsAiming(true);
      setAimOffset({ x: 0, y: 0 });

      // Direct screen scrolling aim
      if (onScreenAim) {
        onScreenAim(touch.clientX, touch.clientY);
      }
    }
  }, [onScreenAim]);

  const handleAimAreaTouchMove = useCallback((e: TouchEvent) => {
    if (!isAiming) return;
    for (let i = 0; i < e.touches.length; i++) {
      if (e.touches[i].identifier === aimTouchIdRef.current) {
        const touch = e.touches[i];
        const dx = touch.clientX - aimCenterRef.current.x;
        const dy = touch.clientY - aimCenterRef.current.y;
        setAimOffset({ x: dx, y: dy });

        // Update 360 degree aim direction
        if (onAimDirection && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
          onAimDirection(dx, dy);
        }
        if (onScreenAim) {
          onScreenAim(touch.clientX, touch.clientY);
        }
        break;
      }
    }
  }, [isAiming, onAimDirection, onScreenAim]);

  const handleAimAreaTouchEnd = useCallback((e: TouchEvent) => {
    if (!isAiming) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === aimTouchIdRef.current) {
        setIsAiming(false);
        aimTouchIdRef.current = null;
        setAimOffset({ x: 0, y: 0 });
        break;
      }
    }
  }, [isAiming]);

  useEffect(() => {
    window.addEventListener('mousemove', handleJoystickMove);
    window.addEventListener('mouseup', handleJoystickEnd);
    window.addEventListener('touchmove', handleJoystickMove, { passive: false });
    window.addEventListener('touchend', handleJoystickEnd);
    window.addEventListener('touchcancel', handleJoystickEnd);

    window.addEventListener('touchmove', handleAimAreaTouchMove, { passive: false });
    window.addEventListener('touchend', handleAimAreaTouchEnd);
    window.addEventListener('touchcancel', handleAimAreaTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleJoystickMove);
      window.removeEventListener('mouseup', handleJoystickEnd);
      window.removeEventListener('touchmove', handleJoystickMove);
      window.removeEventListener('touchend', handleJoystickEnd);
      window.removeEventListener('touchcancel', handleJoystickEnd);

      window.removeEventListener('touchmove', handleAimAreaTouchMove);
      window.removeEventListener('touchend', handleAimAreaTouchEnd);
      window.removeEventListener('touchcancel', handleAimAreaTouchEnd);
    };
  }, [handleJoystickMove, handleJoystickEnd, handleAimAreaTouchMove, handleAimAreaTouchEnd]);

  // ==========================================
  // 3. FIRE BUTTON HANDLERS (RIGHT SIDE)
  // ==========================================
  const startFiring = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if ('touches' in e && e.touches.length > 0) {
      fireTouchIdRef.current = e.touches[e.touches.length - 1].identifier;
    }
    setIsFiringActive(true);
    onFireChange(true);
  }, [onFireChange]);

  const stopFiring = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsFiringActive(false);
    fireTouchIdRef.current = null;
    onFireChange(false);
  }, [onFireChange]);

  return (
    <div
      className="absolute inset-0 pointer-events-none z-30 select-none overflow-hidden"
      style={{ touchAction: 'none' }}
    >
      {/* ========================================================
          LEFT SIDE UPPER: WEAPONS QUICK-CHANGE BUTTON
          ======================================================== */}
      <div className="absolute top-16 left-6 pointer-events-auto flex flex-col items-start gap-1">
        <button
          onClick={() => onSwitchWeapon()}
          className={`group relative flex items-center gap-3 px-4 py-2.5 rounded-2xl border transition-all duration-150 active:scale-95 shadow-xl ${
            isPlasma
              ? 'bg-slate-900/90 border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.25)] text-cyan-300'
              : 'bg-slate-900/90 border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.25)] text-amber-300'
          }`}
          title="Switch Weapon (Q)"
        >
          {/* Animated Weapon Icon / Bullet Silhouette */}
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
              isPlasma
                ? 'bg-cyan-950/80 border-cyan-400/50 text-cyan-400'
                : 'bg-amber-950/80 border-amber-400/50 text-amber-400'
            }`}
          >
            {isPlasma ? (
              // Twin Plasma repeaters icon
              <div className="flex gap-1 items-center">
                <span className="w-1 h-5 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8] animate-pulse" />
                <span className="w-1 h-5 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8] animate-pulse" />
              </div>
            ) : (
              // Valkyrie 3-burst kinetic rounds icon
              <div className="flex gap-0.5 items-end">
                <span className="w-1 h-3 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b]" />
                <span className="w-1 h-4.5 rounded-full bg-amber-300 shadow-[0_0_6px_#f59e0b]" />
                <span className="w-1 h-6 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b]" />
              </div>
            )}
          </div>

          {/* Text labels */}
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400">
                TAP TO SWITCH WEAPON
              </span>
              <span
                className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                  isPlasma ? 'bg-cyan-500/20 text-cyan-300' : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                {currentWeaponConfig.tag}
              </span>
            </div>
            <span className="text-xs font-bold font-mono tracking-tight text-white drop-shadow">
              {currentWeaponConfig.shortName}
            </span>
          </div>

          {/* Quick cycle badge */}
          <div className="ml-1 px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono font-bold text-slate-400 border border-slate-700">
            [Q]
          </div>
        </button>

        {/* TANKER UPGRADE LAUNCH BUTTON ON MOBILE */}
        {onOpenUpgrades && (
          <button
            onClick={onOpenUpgrades}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all active:scale-95 shadow-lg ${
              (stats.scrap ?? 0) >= 90
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 border-amber-300 text-white shadow-[0_0_15px_rgba(245,158,11,0.5)] animate-pulse'
                : 'bg-slate-900/90 border-slate-700 text-slate-300'
            }`}
            title="Launch Tanker Upgrades"
          >
            <Wrench className="w-3.5 h-3.5 text-amber-300" />
            <span className="text-[10px] font-mono font-black uppercase tracking-wider">
              UPGRADE TANK ({stats.scrap ?? 0} SCRAP)
            </span>
          </button>
        )}
      </div>

      {/* ========================================================
          LEFT SIDE: MOVEMENT VIRTUAL JOYSTICK
          ======================================================== */}
      <div className="absolute bottom-8 left-8 pointer-events-auto flex flex-col items-center">
        {/* Joystick Base Disc */}
        <div
          ref={joystickRef}
          onMouseDown={handleJoystickStart}
          onTouchStart={handleJoystickStart}
          className={`relative w-36 h-36 rounded-full flex items-center justify-center transition-colors duration-200 backdrop-blur-md cursor-grab active:cursor-grabbing ${
            isJoystickActive
              ? 'bg-cyan-950/40 border-2 border-cyan-400 shadow-[0_0_35px_rgba(6,182,212,0.35)]'
              : 'bg-slate-900/60 border-2 border-slate-700/60 shadow-[0_0_20px_rgba(0,0,0,0.5)]'
          }`}
          style={{ touchAction: 'none' }}
        >
          {/* Compass Axis Markings */}
          <div className="absolute w-full h-[1px] bg-slate-700/40 pointer-events-none" />
          <div className="absolute h-full w-[1px] bg-slate-700/40 pointer-events-none" />
          <div className="absolute inset-3 rounded-full border border-dashed border-slate-700/50 pointer-events-none" />

          {/* Direction indicator ticks */}
          <div className="absolute -top-1 w-2 h-1 bg-cyan-400/60 rounded-full" />
          <div className="absolute -bottom-1 w-2 h-1 bg-cyan-400/60 rounded-full" />
          <div className="absolute -left-1 w-1 h-2 bg-cyan-400/60 rounded-full" />
          <div className="absolute -right-1 w-1 h-2 bg-cyan-400/60 rounded-full" />

          {/* Draggable Knob */}
          <div
            className={`absolute w-16 h-16 rounded-full flex items-center justify-center border-2 transition-transform duration-75 shadow-lg ${
              isJoystickActive
                ? 'bg-gradient-to-br from-cyan-400 to-blue-600 border-cyan-200 text-slate-950 shadow-[0_0_25px_rgba(6,182,212,0.6)]'
                : 'bg-gradient-to-br from-slate-700 to-slate-800 border-slate-500 text-slate-300'
            }`}
            style={{
              transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`,
              touchAction: 'none',
            }}
          >
            <div className="w-5 h-5 rounded-full border border-white/40 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white/80" />
            </div>
          </div>
        </div>

        {/* Joystick Label */}
        <span className="mt-2 text-[10px] font-mono tracking-widest text-slate-400 uppercase drop-shadow font-semibold">
          MOVE / DRIVE
        </span>
      </div>

      {/* ========================================================
          RIGHT SIDE: SCREEN SCROLLING / 360° AIM TOUCH AREA
          Enables touch screen scrolling to rotate aim 360 degrees
          ======================================================== */}
      <div
        ref={aimAreaRef}
        onTouchStart={handleAimAreaTouchStart}
        className="absolute inset-y-0 right-0 w-1/2 pointer-events-auto"
        style={{ touchAction: 'none' }}
      >
        {/* Dynamic 360° Aim Reticle indicator when dragging */}
        {isAiming && (
          <div
            className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
            style={{
              left: aimCenterRef.current.x + aimOffset.x,
              top: aimCenterRef.current.y + aimOffset.y,
            }}
          >
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-cyan-400/80 animate-spin" style={{ animationDuration: '4s' }} />
            <Crosshair className="w-6 h-6 text-cyan-400 drop-shadow-[0_0_10px_#00f0ff]" />
          </div>
        )}
      </div>

      {/* ========================================================
          RIGHT SIDE CONTROLS CLUSTER:
          - PROMINENT CIRCULAR FIRE BUTTON WITH BULLET-IN-CIRCLE DESIGN
          - ENTER / EXIT TANK BUTTON
          - BOOST / DASH BUTTON
          ======================================================== */}
      <div className="absolute bottom-6 right-6 pointer-events-auto flex items-end gap-5">
        {/* Column of auxiliary buttons (Tank interaction & Boost) */}
        <div className="flex flex-col items-center gap-4 mb-2">
          {/* TANK BOARDING / DISMOUNT BUTTON (Contextual) */}
          {(stats.canEnterTank || stats.playerMode === 'tank') && (
            <button
              onClick={onEnterExitTank}
              className={`relative flex flex-col items-center justify-center w-16 h-16 rounded-2xl border-2 transition-all duration-150 active:scale-95 shadow-2xl ${
                stats.playerMode === 'pilot'
                  ? 'bg-gradient-to-br from-emerald-600 to-teal-800 border-emerald-300 text-white shadow-[0_0_30px_rgba(16,185,129,0.5)] animate-bounce'
                  : 'bg-gradient-to-br from-amber-600 to-orange-800 border-amber-300 text-white shadow-[0_0_20px_rgba(245,158,11,0.4)]'
              }`}
              title={stats.playerMode === 'pilot' ? 'Board Battle Tank [E]' : 'Dismount Tank [E]'}
            >
              {/* Glowing ring */}
              <span className="absolute inset-0 rounded-2xl border border-white/40 animate-ping" style={{ animationDuration: '2s' }} />
              <Shield className="w-6 h-6 drop-shadow" />
              <span className="text-[9px] font-mono font-black tracking-wider uppercase mt-0.5">
                {stats.playerMode === 'pilot' ? 'ENTER TANK' : 'EXIT TANK'}
              </span>
            </button>
          )}

          {/* BOOST / DASH BUTTON */}
          <button
            onClick={onBoost}
            disabled={!stats.canBoost}
            className={`relative flex flex-col items-center justify-center w-15 h-15 rounded-2xl border transition-all duration-150 active:scale-95 shadow-xl ${
              stats.canBoost
                ? 'bg-slate-900/90 border-cyan-400 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                : 'bg-slate-900/50 border-slate-700 text-slate-500 opacity-60'
            }`}
            title="Thruster Boost [SPACE]"
          >
            <Zap className={`w-6 h-6 ${stats.canBoost ? 'text-cyan-400' : 'text-slate-600'}`} />
            <span className="text-[9px] font-mono font-bold tracking-wider uppercase mt-0.5">
              BOOST
            </span>
            {/* Boost Stamina Ring Arc */}
            <div
              className="absolute -bottom-1 left-2 right-2 h-1 bg-slate-800 rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-cyan-400 transition-all duration-100"
                style={{ width: `${stats.boostStamina}%` }}
              />
            </div>
          </button>
        </div>

        {/* ========================================================
            CIRCULAR FIRE BUTTON DESIGN:
            "fire button design by weapon bullet in circle means weapon button as a bullet in circle"
            Features bullet projectile vector cartridge inside glowing circular ring
            ======================================================== */}
        <div className="flex flex-col items-center">
          <button
            onMouseDown={startFiring}
            onMouseUp={stopFiring}
            onTouchStart={startFiring}
            onTouchEnd={stopFiring}
            onTouchCancel={stopFiring}
            className={`relative w-28 h-28 rounded-full flex items-center justify-center transition-all duration-75 active:scale-95 shadow-2xl cursor-pointer select-none ${
              isFiringActive
                ? isPlasma
                  ? 'bg-gradient-to-br from-cyan-500 to-blue-700 border-4 border-white shadow-[0_0_45px_rgba(6,182,212,0.85)] scale-105'
                  : 'bg-gradient-to-br from-amber-500 to-orange-700 border-4 border-white shadow-[0_0_45px_rgba(245,158,11,0.85)] scale-105'
                : isPlasma
                ? 'bg-gradient-to-br from-cyan-950/90 via-slate-900/95 to-slate-950 border-4 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.4)]'
                : 'bg-gradient-to-br from-amber-950/90 via-slate-900/95 to-slate-950 border-4 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.4)]'
            }`}
            style={{ touchAction: 'none' }}
          >
            {/* Concentric Reticle Outer Rings */}
            <div
              className={`absolute inset-1.5 rounded-full border border-dashed pointer-events-none transition-all ${
                isFiringActive ? 'border-white animate-spin' : isPlasma ? 'border-cyan-400/50' : 'border-amber-400/50'
              }`}
              style={{ animationDuration: '6s' }}
            />
            <div
              className={`absolute inset-3 rounded-full border pointer-events-none ${
                isPlasma ? 'border-cyan-500/30' : 'border-amber-500/30'
              }`}
            />

            {/* Radial 360-degree crosshair calibration ticks */}
            <div className="absolute top-1 w-2 h-1 bg-white/70 rounded-full" />
            <div className="absolute bottom-1 w-2 h-1 bg-white/70 rounded-full" />
            <div className="absolute left-1 w-1 h-2 bg-white/70 rounded-full" />
            <div className="absolute right-1 w-1 h-2 bg-white/70 rounded-full" />

            {/* Central Stylized Bullet Cartridge Vector in Circle */}
            <div className="relative flex flex-col items-center justify-center">
              <svg
                width="44"
                height="56"
                viewBox="0 0 44 56"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={`transition-transform duration-75 ${
                  isFiringActive ? 'scale-110 drop-shadow-[0_0_12px_#ffffff]' : 'drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]'
                }`}
              >
                {/* Bullet Ogive Tip (Pointed aerodynamic bullet head) */}
                <path
                  d="M14 20 C14 8, 22 1, 22 1 C22 1, 30 8, 30 20 Z"
                  fill={isFiringActive ? '#ffffff' : isPlasma ? '#38bdf8' : '#fbbf24'}
                  stroke={isFiringActive ? '#ffffff' : isPlasma ? '#e0f2fe' : '#fef3c7'}
                  strokeWidth="1.5"
                />

                {/* Bullet Crimp groove band */}
                <rect
                  x="14"
                  y="20"
                  width="16"
                  height="2.5"
                  fill={isFiringActive ? '#e2e8f0' : isPlasma ? '#0284c7' : '#d97706'}
                />

                {/* Cartridge Case Main Body */}
                <rect
                  x="13"
                  y="23"
                  width="18"
                  height="22"
                  rx="1"
                  fill={isFiringActive ? '#ffffff' : isPlasma ? '#0ea5e9' : '#f59e0b'}
                  stroke={isFiringActive ? '#cbd5e1' : isPlasma ? '#38bdf8' : '#fbbf24'}
                  strokeWidth="1.2"
                />

                {/* Cartridge Extractor Groove */}
                <rect
                  x="15"
                  y="46"
                  width="14"
                  height="2"
                  fill={isFiringActive ? '#94a3b8' : '#334155'}
                />

                {/* Cartridge Rim Base */}
                <rect
                  x="12"
                  y="48.5"
                  width="20"
                  height="3.5"
                  rx="1"
                  fill={isFiringActive ? '#ffffff' : isPlasma ? '#38bdf8' : '#f59e0b'}
                  stroke={isFiringActive ? '#ffffff' : isPlasma ? '#bae6fd' : '#fde68a'}
                  strokeWidth="1"
                />

                {/* Primer Center Dot */}
                <circle cx="22" cy="50.25" r="1.5" fill="#1e293b" />

                {/* Dynamic Muzzle Flare Sparks when active */}
                {isFiringActive && (
                  <g className="animate-pulse">
                    <line x1="22" y1="0" x2="22" y2="-6" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="16" y1="4" x2="11" y2="-1" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                    <line x1="28" y1="4" x2="33" y2="-1" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                  </g>
                )}
              </svg>

              {/* Firing text badge */}
              <span
                className={`text-[10px] font-mono font-black tracking-widest uppercase mt-0.5 ${
                  isFiringActive ? 'text-white' : isPlasma ? 'text-cyan-300' : 'text-amber-300'
                }`}
              >
                {isFiringActive ? 'FIRING' : 'FIRE'}
              </span>
            </div>
          </button>

          {/* Aim instruction note */}
          <span className="mt-1 text-[9px] font-mono tracking-wider text-slate-400 uppercase">
            360° AIM SCREEN SCROLL
          </span>
        </div>
      </div>
    </div>
  );
};
