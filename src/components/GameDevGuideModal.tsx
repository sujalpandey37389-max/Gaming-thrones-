import React, { useState } from 'react';
import { X, Cpu, Sliders, Volume2, Sparkles, Activity, Layers, Play } from 'lucide-react';
import { GameDevTuning, DEFAULT_DEV_TUNING } from '../game/constants';
import { soundEngine } from '../audio/SoundEngine';

interface GameDevGuideModalProps {
  onClose: () => void;
  tuning: GameDevTuning;
  onUpdateTuning: (newTuning: GameDevTuning) => void;
  onTriggerTestShake: () => void;
}

export const GameDevGuideModal: React.FC<GameDevGuideModalProps> = ({
  onClose,
  tuning,
  onUpdateTuning,
  onTriggerTestShake,
}) => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'tuning'>('architecture');

  const handleTuningChange = (key: keyof GameDevTuning, value: number) => {
    onUpdateTuning({
      ...tuning,
      [key]: value,
    });
  };

  const handleResetDefaults = () => {
    onUpdateTuning({ ...DEFAULT_DEV_TUNING });
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 font-mono select-none overflow-y-auto">
      <div className="w-full max-w-3xl bg-slate-900 border border-cyan-500/40 rounded-sm shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/90">
          <div className="flex items-center space-x-2.5">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-bold text-slate-100 tracking-wider">
                HOW TO CREATE A GAME: ENGINE ARCHITECTURE
              </h2>
              <p className="text-[10px] text-slate-400">
                Core Principles: 60fps Loop, Procedural PBR, Web Audio Synth & Game Feel
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded-sm transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 text-xs">
          <button
            onClick={() => setActiveTab('architecture')}
            className={`flex items-center space-x-2 px-6 py-3 border-b-2 font-semibold transition-colors ${
              activeTab === 'architecture'
                ? 'border-cyan-400 text-cyan-300 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>4 PILLARS OF GAME ARCHITECTURE</span>
          </button>

          <button
            onClick={() => setActiveTab('tuning')}
            className={`flex items-center space-x-2 px-6 py-3 border-b-2 font-semibold transition-colors ${
              activeTab === 'tuning'
                ? 'border-cyan-400 text-cyan-300 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>LIVE GAME ENGINE TUNING</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300 leading-relaxed">
          {activeTab === 'architecture' ? (
            <>
              {/* Pillar 1: The Simulation Loop & Delta Time */}
              <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-sm space-y-2">
                <div className="flex items-center space-x-2 text-cyan-400 font-bold text-sm">
                  <Activity className="w-4 h-4" />
                  <span>1. The 60 FPS Game Loop & Clamped Delta Time</span>
                </div>
                <p>
                  Games must simulate physics independently of the display refresh rate. We calculate <code className="text-cyan-300 bg-slate-800 px-1 py-0.5 rounded">dt = (now - lastTime) / 1000</code> and clamp it with <code className="text-cyan-300 bg-slate-800 px-1 py-0.5 rounded">Math.min(rawDt, 0.05)</code> so tab-switches or lag spikes never send mechs tunneling through arena walls.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                  <div>
                    <strong className="text-slate-200">Continuous vs Edge Input:</strong> We track <code className="text-slate-300">keysHeld</code> for smooth hover drift acceleration and <code className="text-slate-300">keysJustPressed</code> for instant edge-triggered abilities like boosting.
                  </div>
                  <div>
                    <strong className="text-slate-200">React Isolation:</strong> The Three.js canvas runs outside React's render lifecycle via stable <code className="text-slate-300">useRef</code>, preventing UI re-renders from stuttering the 60fps loop.
                  </div>
                </div>
              </div>

              {/* Pillar 2: 3D Procedural Craft & PBR */}
              <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-sm space-y-2">
                <div className="flex items-center space-x-2 text-blue-400 font-bold text-sm">
                  <Layers className="w-4 h-4" />
                  <span>2. Multi-Part Procedural 3D Subjects (Zero 404s)</span>
                </div>
                <p>
                  Never represent characters or vehicles with a single raw primitive like a box or cylinder. Every entity in Steel Horizon is an assembled <code className="text-cyan-300 bg-slate-800 px-1 py-0.5 rounded">THREE.Group</code> of 3 to 12 distinct components:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-400">
                  <li><strong className="text-slate-200">Player Mech (8 parts):</strong> Trapezoidal hull, dual hover pods, glowing exhaust thrusters, swiveling turret ring, recoiling plasma barrels, and transmissive canopy.</li>
                  <li><strong className="text-slate-200">Studio Lighting & Contact Shadows:</strong> Powered by <code className="text-slate-300">ACESFilmicToneMapping</code>, <code className="text-slate-300">RoomEnvironment</code> PMREM reflections, and soft radial contact shadow planes so objects never float in empty space.</li>
                  <li><strong className="text-slate-200">Procedural Textures:</strong> Arena grid and crosshairs are rendered into HTML5 Canvas textures at runtime, ensuring instant loading with zero external asset latency or broken links.</li>
                </ul>
              </div>

              {/* Pillar 3: Procedural Web Audio Synth */}
              <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-sm space-y-2">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
                  <Volume2 className="w-4 h-4" />
                  <span>3. Procedural Web Audio Synthesis</span>
                </div>
                <p>
                  Instead of loading external .mp3 or .wav files, every sound is generated mathematically on the user's audio chip using the Web Audio API:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-slate-400">
                  <div className="bg-slate-900 p-2.5 rounded-sm border border-slate-800">
                    <strong className="text-slate-200">Plasma Repeater:</strong> Sawtooth oscillator sweeping exponentially from 880Hz down to 110Hz in 120ms.
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-sm border border-slate-800">
                    <strong className="text-slate-200">Kinetic Burst Rifle:</strong> Dual-layer square + triangle sub-wave punch with high initial transient punch.
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-sm border border-slate-800">
                    <strong className="text-slate-200">Explosions:</strong> Low-frequency 160Hz sub-bass triangle wave paired with filtered white noise buffer decay.
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-sm border border-slate-800">
                    <strong className="text-slate-200">Weapon Switching:</strong> Instant sine chirp frequency ramp with mechanical latch simulation.
                  </div>
                </div>
              </div>

              {/* Pillar 4: Game Feel & "Juice" */}
              <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-sm space-y-2">
                <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>4. Game Feel & "Juice"</span>
                </div>
                <p>
                  Great games feel physical through micro-feedback:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-400">
                  <li><strong className="text-slate-200">Hitstop (30-80ms Freeze):</strong> When a heavy plasma shell hits, world simulation briefly pauses while particles still emit. This creates immense perceived impact weight.</li>
                  <li><strong className="text-slate-200">Decaying Camera Shake:</strong> Shake offset scales with explosion size and decays exponentially with <code className="text-slate-300">shake *= Math.exp(-10 * dt)</code>.</li>
                  <li><strong className="text-slate-200">Squash & Stretch:</strong> Dashing stretches the mech along the movement axis (<code className="text-slate-300">0.75, 0.75, 1.35</code>) and smoothly springs back.</li>
                  <li><strong className="text-slate-200">Zero-GC Particle Pooling:</strong> 1200 pre-allocated BufferGeometry points reused continuously for trails and sparks.</li>
                </ul>
              </div>
            </>
          ) : (
            <>
              {/* Live Tuning Controls */}
              <div className="space-y-4">
                <p className="text-slate-400">
                  Adjust these core simulation constants in real time to experience how game feel tuning impacts player perception:
                </p>

                {/* Hitstop Slider */}
                <div className="bg-slate-950/80 p-4 border border-slate-800 rounded-sm space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-200">Hitstop Duration (Impact Freeze)</span>
                    <span className="text-cyan-400 font-bold tabular-nums">{tuning.hitstopDurationMs} ms</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={tuning.hitstopDurationMs}
                    onChange={(e) => handleTuningChange('hitstopDurationMs', Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-500">
                    0ms = Float-like hits · 50ms = Sweet spot crunchy impact · 90ms = Heavy anime freeze
                  </span>
                </div>

                {/* Camera Shake Slider */}
                <div className="bg-slate-950/80 p-4 border border-slate-800 rounded-sm space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-200">Camera Shake Multiplier</span>
                    <span className="text-cyan-400 font-bold tabular-nums">{tuning.cameraShakeIntensity.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2.5"
                    step="0.1"
                    value={tuning.cameraShakeIntensity}
                    onChange={(e) => handleTuningChange('cameraShakeIntensity', Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">Decaying exponential trauma factor</span>
                    <button
                      onClick={onTriggerTestShake}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-[10px] font-semibold border border-slate-700"
                    >
                      Test Shake Impact
                    </button>
                  </div>
                </div>

                {/* Camera Damping Slider */}
                <div className="bg-slate-950/80 p-4 border border-slate-800 rounded-sm space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-200">Camera Damping Factor</span>
                    <span className="text-cyan-400 font-bold tabular-nums">{tuning.cameraDampingFactor.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="10.0"
                    step="0.5"
                    value={tuning.cameraDampingFactor}
                    onChange={(e) => handleTuningChange('cameraDampingFactor', Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-500">
                    1.5 = Loose cinematic lag · 4.5 = Balanced responsive follow · 9.0 = Tight rigid lock
                  </span>
                </div>

                {/* Bullet Speed Slider */}
                <div className="bg-slate-950/80 p-4 border border-slate-800 rounded-sm space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-200">Plasma Projectile Velocity</span>
                    <span className="text-cyan-400 font-bold tabular-nums">{tuning.bulletSpeed} units/s</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="80"
                    step="2"
                    value={tuning.bulletSpeed}
                    onChange={(e) => handleTuningChange('bulletSpeed', Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-500">
                    Speed of twin player blaster plasma bolts
                  </span>
                </div>

                {/* Audio Engine Test Sandbox */}
                <div className="bg-slate-950/80 p-4 border border-slate-800 rounded-sm space-y-2">
                  <span className="font-bold text-slate-200 block">Web Audio Synth Sandbox</span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      onClick={() => soundEngine.playLaser()}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-cyan-950 hover:text-cyan-300 text-slate-300 rounded text-xs border border-slate-700"
                    >
                      Laser Blast
                    </button>
                    <button
                      onClick={() => soundEngine.playExplosion(false)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-300 rounded text-xs border border-slate-700"
                    >
                      Plasma Blast
                    </button>
                    <button
                      onClick={() => soundEngine.playExplosion(true)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-rose-900 hover:text-rose-200 text-slate-300 rounded text-xs border border-slate-700 font-bold"
                    >
                      Heavy Titan Boom
                    </button>
                    <button
                      onClick={() => soundEngine.playDash()}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-cyan-900 hover:text-cyan-200 text-slate-300 rounded text-xs border border-slate-700"
                    >
                      Thruster Dash
                    </button>
                    <button
                      onClick={() => soundEngine.playTelegraphCharge()}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-amber-900 hover:text-amber-200 text-slate-300 rounded text-xs border border-slate-700"
                    >
                      Telegraph Alarm
                    </button>
                    <button
                      onClick={() => soundEngine.playPickup()}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-emerald-900 hover:text-emerald-200 text-slate-300 rounded text-xs border border-slate-700"
                    >
                      Core Chime
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleResetDefaults}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-semibold border border-slate-700 transition-colors"
                  >
                    Reset to Default Tuning
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800 bg-slate-950/90 text-xs">
          <span className="text-slate-500">Changes apply instantly to live 3D simulation</span>
          <button
            onClick={onClose}
            className="flex items-center space-x-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold px-5 py-2 rounded-sm transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-slate-950" />
            <span>RETURN TO GAME</span>
          </button>
        </div>
      </div>
    </div>
  );
};
