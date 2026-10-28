import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/GameEngine';
import {
  GameState,
  GameStats,
  GameDevTuning,
  DEFAULT_DEV_TUNING,
  WeaponType,
  TankUpgrades,
  MAX_HEALTH,
  MAX_SHIELD,
  MAX_HOUSE_HP,
} from './game/constants';
import { TitleScreen } from './components/TitleScreen';
import { GameHUD } from './components/GameHUD';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import { GameDevGuideModal } from './components/GameDevGuideModal';
import { MobileControlsOverlay } from './components/MobileControlsOverlay';
import { TankUpgradeModal } from './components/TankUpgradeModal';
import { LandscapeEnforcer } from './components/LandscapeEnforcer';
import { soundEngine } from './audio/SoundEngine';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [gameState, setGameState] = useState<GameState>('title');
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    wave: 1,
    kills: 0,
    combo: 0,
    maxCombo: 0,
    health: MAX_HEALTH,
    shield: MAX_SHIELD,
    boostStamina: 100,
    canBoost: true,
    timeAlive: 0,
    enemiesRemaining: 0,
    currentWeapon: 'plasma_repeater',
    playerMode: 'pilot',
    canEnterTank: false,
    houseHp: MAX_HOUSE_HP,
    maxHouseHp: MAX_HOUSE_HP,
    scrap: 150,
    tankUpgrades: {
      hullArmorLevel: 1,
      cannonsLevel: 1,
      autoloaderLevel: 1,
      engineLevel: 1,
    },
  });
  const [isMuted, setIsMuted] = useState<boolean>(soundEngine.getMuted());
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);
  const [tuning, setTuning] = useState<GameDevTuning>({ ...DEFAULT_DEV_TUNING });

  // Mobile / Touch controls state (auto-enabled on touch screens or mobile viewports)
  const [showMobileControls, setShowMobileControls] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth <= 1024;
  });

  useEffect(() => {
    if (!canvasMountRef.current) return;

    // Initialize GameEngine once
    const engine = new GameEngine(canvasMountRef.current);
    engineRef.current = engine;

    engine.onStateChange = (state) => {
      setGameState(state);
    };

    engine.onStatsUpdate = (newStats) => {
      setStats(newStats);
    };

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  const handleStartGame = () => {
    engineRef.current?.startGame();
  };

  const handlePauseGame = () => {
    engineRef.current?.pauseGame();
  };

  const handleResumeGame = () => {
    engineRef.current?.resumeGame();
  };

  const handleRestartGame = () => {
    engineRef.current?.restartGame();
  };

  const handleTitleMenu = () => {
    engineRef.current?.returnToTitle();
  };

  const handleToggleMute = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  const handleUpdateTuning = (newTuning: GameDevTuning) => {
    setTuning(newTuning);
    if (engineRef.current) {
      engineRef.current.devTuning = newTuning;
    }
  };

  const handleTriggerTestShake = () => {
    engineRef.current?.addCameraShake(0.8);
    engineRef.current?.applyHitstop(50);
    soundEngine.playExplosion(false);
  };

  const handleSwitchWeapon = (type?: WeaponType) => {
    engineRef.current?.switchWeapon(type);
  };

  const handleVirtualMove = (x: number, y: number) => {
    engineRef.current?.setVirtualMove(x, y);
  };

  const handleFireChange = (isFiring: boolean) => {
    engineRef.current?.setFiring(isFiring);
  };

  const handleBoost = () => {
    engineRef.current?.triggerBoost();
  };

  const handleEnterExitTank = () => {
    engineRef.current?.enterOrExitTank();
  };

  const handleAimDirection = (dx: number, dy: number) => {
    engineRef.current?.setAimFromVector(dx, dy);
  };

  const handleScreenAim = (clientX: number, clientY: number) => {
    engineRef.current?.setAimFromScreen(clientX, clientY);
  };

  const handleUpgradeTank = (type: keyof TankUpgrades) => {
    engineRef.current?.upgradeTank(type);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'u' || e.key === 'U') {
        if (gameState === 'playing' || gameState === 'paused') {
          setShowUpgradeModal((prev) => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none touch-none">
      {/* Strict Landscape Orientation Enforcer */}
      <LandscapeEnforcer />

      {/* Isolated WebGL Canvas Mount Container */}
      <div ref={canvasMountRef} className="absolute inset-0 z-0" />

      {/* Title Screen Overlay */}
      {gameState === 'title' && (
        <TitleScreen
          onStart={handleStartGame}
          onOpenGuide={() => setShowGuideModal(true)}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* In-Game Low-Occlusion HUD */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <GameHUD
          stats={stats}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onOpenGuide={() => setShowGuideModal(true)}
          onPause={handlePauseGame}
          onSwitchWeapon={handleSwitchWeapon}
          onEnterExitTank={handleEnterExitTank}
          onOpenUpgrades={() => setShowUpgradeModal(true)}
          isMobileControlsVisible={showMobileControls}
          onToggleMobileControls={() => setShowMobileControls((prev) => !prev)}
        />
      )}

      {/* Mobile Touch Controls Overlay */}
      {gameState === 'playing' && showMobileControls && (
        <MobileControlsOverlay
          stats={stats}
          onMove={handleVirtualMove}
          onFireChange={handleFireChange}
          onBoost={handleBoost}
          onSwitchWeapon={handleSwitchWeapon}
          onEnterExitTank={handleEnterExitTank}
          onOpenUpgrades={() => setShowUpgradeModal(true)}
          onAimDirection={handleAimDirection}
          onScreenAim={handleScreenAim}
        />
      )}

      {/* Tanker Upgrade Modification Bay Modal */}
      {showUpgradeModal && (
        <TankUpgradeModal
          stats={stats}
          onClose={() => setShowUpgradeModal(false)}
          onUpgrade={handleUpgradeTank}
        />
      )}

      {/* Pause Menu Modal */}
      {gameState === 'paused' && (
        <PauseModal
          onResume={handleResumeGame}
          onRestart={handleRestartGame}
          onTitle={handleTitleMenu}
          onOpenGuide={() => setShowGuideModal(true)}
        />
      )}

      {/* Game Over Modal */}
      {gameState === 'gameover' && (
        <GameOverModal
          stats={stats}
          onRestart={handleRestartGame}
          onTitle={handleTitleMenu}
        />
      )}

      {/* Interactive Game Dev Architecture Guide & Tuning Modal */}
      {showGuideModal && (
        <GameDevGuideModal
          onClose={() => setShowGuideModal(false)}
          tuning={tuning}
          onUpdateTuning={handleUpdateTuning}
          onTriggerTestShake={handleTriggerTestShake}
        />
      )}
    </div>
  );
}
