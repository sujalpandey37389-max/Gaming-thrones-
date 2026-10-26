/**
 * Gameplay Constants & Types for Steel Horizon
 */

export const ARENA_RADIUS = 52;
export const PLAYER_SPEED = 18;
export const PLAYER_BOOST_SPEED = 38;
export const BOOST_DURATION = 0.28;
export const BOOST_COOLDOWN = 1.2;
export const MAX_SHIELD = 100;
export const MAX_HEALTH = 100;
export const SHIELD_REGEN_RATE = 15;
export const SHIELD_REGEN_DELAY = 3.0;

export type EnemyType = 'drone' | 'walker' | 'turret' | 'titan';

export interface EnemyStats {
  type: EnemyType;
  maxHp: number;
  speed: number;
  scoreValue: number;
  attackCooldown: number;
  attackRange: number;
  radius: number;
}

export const ENEMY_CONFIGS: Record<EnemyType, EnemyStats> = {
  drone: {
    type: 'drone',
    maxHp: 35,
    speed: 13,
    scoreValue: 100,
    attackCooldown: 1.5,
    attackRange: 22,
    radius: 1.2,
  },
  walker: {
    type: 'walker',
    maxHp: 110,
    speed: 6.5,
    scoreValue: 250,
    attackCooldown: 3.2,
    attackRange: 34,
    radius: 2.2,
  },
  turret: {
    type: 'turret',
    maxHp: 80,
    speed: 0,
    scoreValue: 200,
    attackCooldown: 2.4,
    attackRange: 40,
    radius: 1.6,
  },
  titan: {
    type: 'titan',
    maxHp: 650,
    speed: 4.5,
    scoreValue: 1200,
    attackCooldown: 2.0,
    attackRange: 36,
    radius: 4.2,
  },
};

export type WeaponType = 'plasma_repeater' | 'burst_rifle';

export interface WeaponConfig {
  id: WeaponType;
  name: string;
  shortName: string;
  subtitle: string;
  description: string;
  fireCooldown: number;
  burstCount: number;
  burstInterval: number;
  damage: number;
  speed: number;
  lifetime: number;
  spread: number;
  bulletColor: number;
  particleColor: number;
  bulletLength: number;
  bulletRadius: number;
  recoilImpulse: number;
  screenShake: number;
  tag: string;
}

export const WEAPON_CONFIGS: Record<WeaponType, WeaponConfig> = {
  plasma_repeater: {
    id: 'plasma_repeater',
    name: 'Twin Plasma Repeater',
    shortName: 'Plasma Repeater',
    subtitle: 'Rapid Alternating Emitter',
    description: 'High cyclic rate plasma bolts. Excellent for suppression and swarms.',
    fireCooldown: 0.13,
    burstCount: 1,
    burstInterval: 0,
    damage: 22,
    speed: 54,
    lifetime: 1.5,
    spread: 0.015,
    bulletColor: 0x38bdf8,
    particleColor: 0x00f0ff,
    bulletLength: 1.35,
    bulletRadius: 0.12,
    recoilImpulse: 0.55,
    screenShake: 0.03,
    tag: 'RAPID AUTO',
  },
  burst_rifle: {
    id: 'burst_rifle',
    name: 'Valkyrie Burst Rifle',
    shortName: 'Burst Rifle',
    subtitle: '3-Round Kinetic Salvo',
    description: 'Concentrated 3-shot kinetic armor-piercing burst with devastating single-target punch.',
    fireCooldown: 0.38,
    burstCount: 3,
    burstInterval: 0.065,
    damage: 26,
    speed: 70,
    lifetime: 1.4,
    spread: 0.02,
    bulletColor: 0xf59e0b,
    particleColor: 0xfbbf24,
    bulletLength: 1.75,
    bulletRadius: 0.15,
    recoilImpulse: 0.35,
    screenShake: 0.11,
    tag: '3-RD SALVO',
  },
};

export interface GameStats {
  score: number;
  wave: number;
  kills: number;
  combo: number;
  maxCombo: number;
  health: number;
  shield: number;
  boostStamina: number;
  canBoost: boolean;
  timeAlive: number;
  enemiesRemaining: number;
  bossHealthPercent?: number;
  currentWeapon: WeaponType;
}

export type GameState = 'title' | 'playing' | 'paused' | 'gameover' | 'victory';

export interface GameDevTuning {
  hitstopDurationMs: number;
  cameraShakeIntensity: number;
  cameraDampingFactor: number;
  particleDensity: number;
  bulletSpeed: number;
}

export const DEFAULT_DEV_TUNING: GameDevTuning = {
  hitstopDurationMs: 50,
  cameraShakeIntensity: 1.0,
  cameraDampingFactor: 4.5,
  particleDensity: 1.0,
  bulletSpeed: 52,
};
