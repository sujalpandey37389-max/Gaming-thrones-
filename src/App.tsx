import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/GameEngine';
import { GameState, GameStats, GameDevTuning, DEFAULT_DEV_TUNING, WeaponType } from './game/constants';
import { TitleScreen } from './components/TitleScreen';
import { GameHUD } from './components/GameHUD';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import { GameDevGuideModal } from './components/GameDevGuideModal';
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
    health: 100,
    shield: 100,
    boostStamina: 100,
    canBoost: true,
    timeAlive: 0,
    enemiesRemaining: 0,
    currentWeapon: 'plasma_repeater',
  });
  const [isMuted, setIsMuted] = useState<boolean>(soundEngine.getMuted());
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [tuning, setTuning] = useState<GameDevTuning>({ ...DEFAULT_DEV_TUNING });

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

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
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
