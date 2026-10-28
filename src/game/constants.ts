/**
 * Gameplay Constants & Types for Steel Horizon
 */

export const ARENA_RADIUS = 140;
export const PLAYER_SPEED = 20;
export const PLAYER_BOOST_SPEED = 42;
export const BOOST_DURATION = 0.32;
export const BOOST_COOLDOWN = 1.1;
export const MAX_SHIELD = 100;
export const MAX_HEALTH = 200;
export const SHIELD_REGEN_RATE = 20;
export const SHIELD_REGEN_DELAY = 2.2;

// Enemies converted to men: Commando Infantry, Heavy RPG Trooper, Warlord Commander
export type EnemyType = 'commando' | 'heavy_trooper' | 'warlord' | 'drone' | 'walker' | 'titan';

export interface EnemyStats {
  type: EnemyType;
  name: string;
  maxHp: number;
  speed: number;
  scoreValue: number;
  scrapValue: number;
  attackCooldown: number;
  attackRange: number;
  radius: number;
}

export const ENEMY_CONFIGS: Record<EnemyType, EnemyStats> = {
  commando: {
    type: 'commando',
    name: 'Assault Commando',
    maxHp: 45,
    speed: 7.2,
    scoreValue: 120,
    scrapValue: 35,
    attackCooldown: 1.6,
    attackRange: 24,
    radius: 1.1,
  },
  heavy_trooper: {
    type: 'heavy_trooper',
    name: 'Heavy RPG Trooper',
    maxHp: 135,
    speed: 4.2,
    scoreValue: 320,
    scrapValue: 75,
    attackCooldown: 3.2,
    attackRange: 36,
    radius: 1.8,
  },
  warlord: {
    type: 'warlord',
    name: 'Warlord Commander',
    maxHp: 750,
    speed: 3.4,
    scoreValue: 1500,
    scrapValue: 350,
    attackCooldown: 2.0,
    attackRange: 42,
    radius: 3.4,
  },
  // Backward compatibility aliases mapping to infantry commandos
  drone: {
    type: 'drone',
    name: 'Assault Commando',
    maxHp: 45,
    speed: 7.2,
    scoreValue: 120,
    scrapValue: 35,
    attackCooldown: 1.6,
    attackRange: 24,
    radius: 1.1,
  },
  walker: {
    type: 'walker',
    name: 'Heavy RPG Trooper',
    maxHp: 135,
    speed: 4.2,
    scoreValue: 320,
    scrapValue: 75,
    attackCooldown: 3.2,
    attackRange: 36,
    radius: 1.8,
  },
  titan: {
    type: 'titan',
    name: 'Warlord Commander',
    maxHp: 750,
    speed: 3.4,
    scoreValue: 1500,
    scrapValue: 350,
    attackCooldown: 2.0,
    attackRange: 42,
    radius: 3.4,
  },
};

export interface TankUpgrades {
  hullArmorLevel: number;    // 1-5: Max HP, Shield, & Damage reduction
  cannonsLevel: number;      // 1-5: Heavy Twin Cannon damage multiplier & blast
  autoloaderLevel: number;   // 1-5: Faster cyclic fire rate
  engineLevel: number;       // 1-5: Faster drive speed & turbo stamina regen
}

export const UPGRADE_MAX_LEVEL = 5;

export interface UpgradeTierInfo {
  title: string;
  description: string;
  baseCost: number;
  costStep: number;
  statLabel: string;
  values: string[];
}

export const TANK_UPGRADE_INFOS: Record<keyof TankUpgrades, UpgradeTierInfo> = {
  hullArmorLevel: {
    title: 'Reinforced Chassis & Armor',
    description: 'Upgrades composite reactive armor plates. Increases tank durability and damage deflection.',
    baseCost: 100,
    costStep: 100,
    statLabel: 'Damage Reduction & HP',
    values: ['40% Red. (Base)', '48% Red. (+40 HP)', '56% Red. (+80 HP)', '64% Red. (+120 HP)', '72% Fortress (+180 HP)'],
  },
  cannonsLevel: {
    title: 'Twin High-Caliber Cannons',
    description: 'Increases smoothbore cannon caliber, projectile impact punch, and explosive shockwave radius.',
    baseCost: 120,
    costStep: 110,
    statLabel: 'Cannon Damage',
    values: ['22 Base DMG', '30 DMG (+35%)', '40 DMG (+80%)', '52 DMG (+135%)', '68 DMG (+210%)'],
  },
  autoloaderLevel: {
    title: 'Cyclic Hydraulic Autoloader',
    description: 'Improves mechanized chamber reloading mechanism, dramatically boosting cyclic firing rate.',
    baseCost: 110,
    costStep: 90,
    statLabel: 'Fire Rate (Cooldown)',
    values: ['0.13s Base', '0.11s (-15%)', '0.09s (-30%)', '0.075s (-42%)', '0.058s Rapid (-55%)'],
  },
  engineLevel: {
    title: 'Turbocharged Diesel Engine',
    description: 'Upgrades turbine forced induction and track suspensions for rapid maneuverability across the large map.',
    baseCost: 90,
    costStep: 80,
    statLabel: 'Speed & Thruster Recovery',
    values: ['18.0 m/s (Base)', '21.5 m/s (+20%)', '25.0 m/s (+40%)', '28.5 m/s (+60%)', '33.0 m/s Apex (+85%)'],
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

export const MAX_HOUSE_HP = 500;

export interface RadarBlip {
  x: number;
  z: number;
  type: 'player' | 'tank' | 'house' | 'enemy' | 'boss';
  rot?: number;
}

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
  playerMode: 'pilot' | 'tank';
  canEnterTank: boolean;
  houseHp: number;
  maxHouseHp: number;
  scrap: number;
  tankUpgrades: TankUpgrades;
  radarBlips?: RadarBlip[];
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
