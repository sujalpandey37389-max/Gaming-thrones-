/**
 * Steel Horizon - Core 3D Game Simulation Engine
 * Encapsulates Three.js scene, PBR renderer, input buffering,
 * 60fps physics simulation, hitstop, screenshake, and combat logic.
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { soundEngine } from '../audio/SoundEngine';
import {
  ARENA_RADIUS,
  DEFAULT_DEV_TUNING,
  EnemyStats,
  ENEMY_CONFIGS,
  EnemyType,
  GameDevTuning,
  GameState,
  GameStats,
  MAX_HEALTH,
  MAX_SHIELD,
  PLAYER_BOOST_SPEED,
  PLAYER_SPEED,
  SHIELD_REGEN_DELAY,
  SHIELD_REGEN_RATE,
  WEAPON_CONFIGS,
  WeaponConfig,
  WeaponType,
} from './constants';
import { ParticleSystem } from './particles';
import {
  createCanyonRock,
  createContactShadowMesh,
  createDroneModel,
  createGroundGridTexture,
  createPlayerMech,
  createPowerMonolith,
  createTitanBossModel,
  createWalkerModel,
} from './proceduralModels';

// Scratch vectors for zero GC in the render loop
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _v3 = new THREE.Vector3();
const _plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const _ray = new THREE.Ray();

interface Projectile {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  lifetime: number;
  isPlayer: boolean;
  damage: number;
}

interface EnemyInstance {
  id: number;
  type: EnemyType;
  stats: EnemyStats;
  hp: number;
  meshGroup: THREE.Group;
  turretGroup?: THREE.Group;
  telegraphLine?: THREE.Line;
  attackTimer: number;
  telegraphTimer: number;
  isTelegraphing: boolean;
  aimTarget: THREE.Vector3;
  velocity: THREE.Vector3;
  radius: number;
  hitFlashTimer: number;
}

interface PowerCore {
  mesh: THREE.Group;
  position: THREE.Vector3;
  lifetime: number;
}

export class GameEngine {
  // Container & Renderer
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private pmremGenerator: THREE.PMREMGenerator;
  private isSoftwareGl: boolean = false;
  private animFrameId: number = 0;
  private isDisposed: boolean = false;

  // Game Loop timing
  private lastTime: number = 0;
  private hitstopRemaining: number = 0;
  private cameraShakeAmount: number = 0;
  private cameraShakeOffset: THREE.Vector3 = new THREE.Vector3();

  // State
  public state: GameState = 'title';
  public devTuning: GameDevTuning = { ...DEFAULT_DEV_TUNING };
  public stats: GameStats = {
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
  };

  // Callbacks for UI updates
  public onStateChange?: (state: GameState) => void;
  public onStatsUpdate?: (stats: GameStats) => void;

  // Input management
  private keysHeld: Record<string, boolean> = {};
  private keysJustPressed: Record<string, boolean> = {};
  private mouseScreen: THREE.Vector2 = new THREE.Vector2();
  private mouseWorldAim: THREE.Vector3 = new THREE.Vector3();
  private isMouseDown: boolean = false;
  private raycaster: THREE.Raycaster = new THREE.Raycaster();

  // Weapon & Armament system
  public currentWeapon: WeaponType = 'plasma_repeater';
  private burstRemaining: number = 0;
  private burstTimer: number = 0;
  private burstAimTarget: THREE.Vector3 = new THREE.Vector3();
  private lastWheelTime: number = 0;

  // Player entities & components
  private playerGroup!: THREE.Group;
  private playerTurretGroup!: THREE.Group;
  private leftBarrel!: THREE.Mesh;
  private rightBarrel!: THREE.Mesh;
  private exhaustLeft!: THREE.Mesh;
  private exhaustRight!: THREE.Mesh;
  private playerVelocity: THREE.Vector3 = new THREE.Vector3();
  private isBoosting: boolean = false;
  private boostTimer: number = 0;
  private boostCooldownTimer: number = 0;
  private timeSinceLastHit: number = 10;
  private fireTimer: number = 0;
  private barrelAlternate: boolean = false;
  private crosshairMesh!: THREE.Mesh;

  // Entities
  private projectiles: Projectile[] = [];
  private enemies: EnemyInstance[] = [];
  private powerCores: PowerCore[] = [];
  private enemyIdCounter: number = 1;
  private waveSpawnTimer: number = 0;
  private isWaveClearing: boolean = false;

  // Particles
  private particles!: ParticleSystem;

  // Title orbit angle
  private titleOrbitAngle: number = 0;

  constructor(container: HTMLElement) {
    this.container = container;

    // Detect software WebGL
    this.isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    // Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x090d16);
    this.scene.fog = new THREE.FogExp2(0x090d16, 0.015);

    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(52, aspect, 0.5, 300);
    this.camera.position.set(0, 24, 26);
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // Procedural Studio Environment Reflection
    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.pmremGenerator.compileEquirectangularShader();
    const envTexture = this.pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = envTexture;

    // Setup Arena, Lighting, Player, Input
    this.initLighting();
    this.initArena();
    this.initPlayer();
    this.initCrosshair();
    this.initParticles();
    this.initEventListeners();

    // Start 60fps Game Loop
    this.lastTime = performance.now();
    this.tick = this.tick.bind(this);
    this.animFrameId = requestAnimationFrame(this.tick);
  }

  private initLighting() {
    // Cool Hemisphere fill light
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.7);
    hemiLight.position.set(0, 50, 0);
    this.scene.add(hemiLight);

    // Warm directional key light with soft shadows
    const dirLight = new THREE.DirectionalLight(0xffedd5, 1.8);
    dirLight.position.set(30, 45, 25);
    dirLight.castShadow = !this.isSoftwareGl;
    if (dirLight.castShadow) {
      dirLight.shadow.mapSize.width = 2048;
      dirLight.shadow.mapSize.height = 2048;
      dirLight.shadow.camera.near = 10;
      dirLight.shadow.camera.far = 120;
      const d = 42;
      dirLight.shadow.camera.left = -d;
      dirLight.shadow.camera.right = d;
      dirLight.shadow.camera.top = d;
      dirLight.shadow.camera.bottom = -d;
      dirLight.shadow.bias = -0.0004;
      dirLight.shadow.normalBias = 0.02;
    }
    this.scene.add(dirLight);

    // Rim light
    const rimLight = new THREE.DirectionalLight(0x0284c7, 0.9);
    rimLight.position.set(-30, 20, -35);
    this.scene.add(rimLight);
  }

  private initArena() {
    const groundGeo = new THREE.PlaneGeometry(ARENA_RADIUS * 3, ARENA_RADIUS * 3);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshStandardMaterial({
      map: createGroundGridTexture(),
      roughness: 0.65,
      metalness: 0.25,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.receiveShadow = true;
    ground.position.y = 0;
    this.scene.add(ground);

    const rockCount = 28;
    for (let i = 0; i < rockCount; i++) {
      const angle = (i / rockCount) * Math.PI * 2;
      const dist = ARENA_RADIUS + (Math.sin(i * 1.7) * 4);
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const radius = 3.5 + Math.random() * 3.0;

      const rock = createCanyonRock(radius);
      rock.position.set(x, radius * 0.5, z);
      rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      const scaleVariation = 0.85 + Math.random() * 0.3;
      rock.scale.set(scaleVariation, scaleVariation * 1.3, scaleVariation);
      this.scene.add(rock);
    }

    const monolithPositions = [
      { x: -18, z: -16 },
      { x: 18, z: -16 },
      { x: -18, z: 16 },
      { x: 18, z: 16 },
    ];
    monolithPositions.forEach(p => {
      const monolith = createPowerMonolith();
      monolith.position.set(p.x, 0, p.z);
      this.scene.add(monolith);
    });
  }

  private initPlayer() {
    const mech = createPlayerMech();
    this.playerGroup = mech.group;
    this.playerTurretGroup = mech.turretGroup;
    this.leftBarrel = mech.leftBarrel;
    this.rightBarrel = mech.rightBarrel;
    this.exhaustLeft = mech.exhaustGlowLeft;
    this.exhaustRight = mech.exhaustGlowRight;

    this.playerGroup.position.set(0, 0, 0);
    this.scene.add(this.playerGroup);
  }

  private initCrosshair() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(64, 64, 46, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.arc(64, 64, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(64, 8); ctx.lineTo(64, 24);
    ctx.moveTo(64, 104); ctx.lineTo(64, 120);
    ctx.moveTo(8, 64); ctx.lineTo(24, 64);
    ctx.moveTo(104, 64); ctx.lineTo(120, 64);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;

    const geo = new THREE.PlaneGeometry(3.2, 3.2);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    });
    this.crosshairMesh = new THREE.Mesh(geo, mat);
    this.crosshairMesh.position.y = 0.05;
    this.scene.add(this.crosshairMesh);
  }

  private initParticles() {
    this.particles = new ParticleSystem();
    this.scene.add(this.particles.points);
  }

  private initEventListeners() {
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      if (!this.keysHeld[key]) {
        this.keysJustPressed[key] = true;
      }
      this.keysHeld[key] = true;

      if (key === 'escape' || key === 'p') {
        if (this.state === 'playing') {
          this.pauseGame();
        } else if (this.state === 'paused') {
          this.resumeGame();
        }
      }
      if ((key === 'enter' || key === ' ') && this.state === 'title') {
        this.startGame();
      }
      if (key === 'm') {
        soundEngine.toggleMute();
      }
      if (key === 'q' || key === 'e') {
        if (this.state === 'playing') {
          this.switchWeapon();
        }
      }
      if (key === '1') {
        if (this.state === 'playing') {
          this.switchWeapon('plasma_repeater');
        }
      }
      if (key === '2') {
        if (this.state === 'playing') {
          this.switchWeapon('burst_rifle');
        }
      }
      if (key === 'r' && (this.state === 'gameover' || this.state === 'victory')) {
        this.restartGame();
      }
    });

    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      this.keysHeld[key] = false;
    });

    window.addEventListener('blur', () => {
      this.keysHeld = {};
      this.isMouseDown = false;
    });

    window.addEventListener('wheel', (e) => {
      if (this.state !== 'playing') return;
      const now = performance.now();
      if (now - this.lastWheelTime > 150 && (Math.abs(e.deltaY) > 5 || Math.abs(e.deltaX) > 5)) {
        this.lastWheelTime = now;
        this.switchWeapon();
      }
    }, { passive: true });

    window.addEventListener('mousemove', (e) => {
      this.mouseScreen.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouseScreen.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.isMouseDown = true;
      }
      if (e.button === 2) {
        e.preventDefault();
        this.triggerBoost();
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.isMouseDown = false;
      }
    });

    window.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  public switchWeapon(type?: WeaponType) {
    const nextType: WeaponType = type || (this.currentWeapon === 'plasma_repeater' ? 'burst_rifle' : 'plasma_repeater');
    if (nextType === this.currentWeapon && type !== undefined) return;

    this.currentWeapon = nextType;
    this.burstRemaining = 0;
    this.stats.currentWeapon = nextType;
    soundEngine.playWeaponSwitch();

    // Visual weapon swap flare at barrels
    const config = WEAPON_CONFIGS[this.currentWeapon];
    if (this.leftBarrel && this.rightBarrel) {
      _v1.setFromMatrixPosition(this.leftBarrel.matrixWorld);
      _v2.setFromMatrixPosition(this.rightBarrel.matrixWorld);
      this.particles.emit(_v1, 10, config.particleColor, 6, 0.2, 0.45);
      this.particles.emit(_v2, 10, config.particleColor, 6, 0.2, 0.45);
    }

    if (this.onStatsUpdate) {
      this.onStatsUpdate({ ...this.stats });
    }
  }

  public startGame() {
    this.state = 'playing';
    this.stats = {
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
      currentWeapon: this.currentWeapon,
    };
    this.playerGroup.position.set(0, 0, 0);
    this.playerVelocity.set(0, 0, 0);
    this.clearProjectiles();
    this.clearEnemies();
    this.spawnWave(1);
    soundEngine.startAmbientMusic();
    if (this.onStateChange) this.onStateChange('playing');
  }

  public pauseGame() {
    if (this.state === 'playing') {
      this.state = 'paused';
      if (this.onStateChange) this.onStateChange('paused');
    }
  }

  public resumeGame() {
    if (this.state === 'paused') {
      this.state = 'playing';
      if (this.onStateChange) this.onStateChange('playing');
    }
  }

  public restartGame() {
    this.startGame();
  }

  public returnToTitle() {
    this.state = 'title';
    soundEngine.stopAmbientMusic();
    this.clearProjectiles();
    this.clearEnemies();
    if (this.onStateChange) this.onStateChange('title');
  }

  private triggerBoost() {
    if (this.stats.boostStamina >= 30 && !this.isBoosting && this.boostCooldownTimer <= 0) {
      this.isBoosting = true;
      this.boostTimer = 0.28;
      this.boostCooldownTimer = 0.8;
      this.stats.boostStamina = Math.max(0, this.stats.boostStamina - 35);
      soundEngine.playDash();

      this.playerGroup.scale.set(0.75, 0.75, 1.35);

      _v1.copy(this.playerGroup.position);
      this.particles.emit(_v1, 24, 0x00f0ff, 12, 0.4, 0.8);
      this.addCameraShake(0.3);
    }
  }

  public addCameraShake(intensity: number) {
    this.cameraShakeAmount = Math.min(1.5, this.cameraShakeAmount + intensity * this.devTuning.cameraShakeIntensity);
  }

  public applyHitstop(ms: number) {
    this.hitstopRemaining = Math.max(this.hitstopRemaining, (ms || this.devTuning.hitstopDurationMs) / 1000);
  }

  private clearProjectiles() {
    this.projectiles.forEach(p => {
      this.scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      (p.mesh.material as THREE.Material).dispose();
    });
    this.projectiles = [];
  }

  private clearEnemies() {
    this.enemies.forEach(e => {
      this.scene.remove(e.meshGroup);
    });
    this.enemies = [];
  }

  private spawnWave(waveNumber: number) {
    this.stats.wave = waveNumber;
    this.isWaveClearing = false;

    const isBossWave = waveNumber % 4 === 0;
    let droneCount = 4 + waveNumber * 2;
    let walkerCount = Math.floor(waveNumber / 2);

    if (isBossWave) {
      droneCount = 4;
      walkerCount = 1;
      this.spawnBossTitan();
    }

    for (let i = 0; i < droneCount; i++) {
      this.spawnEnemy('drone');
    }
    for (let i = 0; i < walkerCount; i++) {
      this.spawnEnemy('walker');
    }

    this.stats.enemiesRemaining = this.enemies.length;
    if (this.onStatsUpdate) this.onStatsUpdate({ ...this.stats });
  }

  private spawnEnemy(type: EnemyType) {
    const angle = Math.random() * Math.PI * 2;
    const distance = 26 + Math.random() * (ARENA_RADIUS - 30);
    const spawnPos = new THREE.Vector3(Math.cos(angle) * distance, 0, Math.sin(angle) * distance);

    let meshGroup: THREE.Group;
    let turretGroup: THREE.Group | undefined;
    let telegraphLine: THREE.Line | undefined;

    if (type === 'drone') {
      const drone = createDroneModel();
      meshGroup = drone.group;
    } else if (type === 'walker') {
      const walker = createWalkerModel();
      meshGroup = walker.group;
      turretGroup = walker.turretGroup;
      telegraphLine = walker.telegraphLine;
    } else {
      const drone = createDroneModel();
      meshGroup = drone.group;
    }

    meshGroup.position.copy(spawnPos);
    this.scene.add(meshGroup);

    const stats = { ...ENEMY_CONFIGS[type] };

    this.enemies.push({
      id: this.enemyIdCounter++,
      type,
      stats,
      hp: stats.maxHp,
      meshGroup,
      turretGroup,
      telegraphLine,
      attackTimer: 1.0 + Math.random() * stats.attackCooldown,
      telegraphTimer: 0,
      isTelegraphing: false,
      aimTarget: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      radius: stats.radius,
      hitFlashTimer: 0,
    });
  }

  private spawnBossTitan() {
    const spawnPos = new THREE.Vector3(0, 0, -32);
    const titan = createTitanBossModel();

    titan.group.position.copy(spawnPos);
    this.scene.add(titan.group);

    const stats = { ...ENEMY_CONFIGS.titan };

    this.enemies.push({
      id: this.enemyIdCounter++,
      type: 'titan',
      stats,
      hp: stats.maxHp,
      meshGroup: titan.group,
      turretGroup: titan.turretGroup,
      attackTimer: 2.0,
      telegraphTimer: 0,
      isTelegraphing: false,
      aimTarget: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      radius: stats.radius,
      hitFlashTimer: 0,
    });
  }

  private firePlayerBolt(config: WeaponConfig, aimTarget: THREE.Vector3) {
    this.barrelAlternate = !this.barrelAlternate;
    const activeBarrel = this.barrelAlternate ? this.leftBarrel : this.rightBarrel;

    _v1.setFromMatrixPosition(activeBarrel.matrixWorld);

    _v2.subVectors(aimTarget, _v1);
    _v2.y = 0;
    _v2.normalize();

    // Minor spread jitter
    if (config.spread > 0) {
      const angleJitter = (Math.random() - 0.5) * config.spread * 2;
      _v2.applyAxisAngle(new THREE.Vector3(0, 1, 0), angleJitter);
    }

    const geo = new THREE.CylinderGeometry(config.bulletRadius, config.bulletRadius, config.bulletLength, 8);
    geo.rotateX(Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({ color: config.bulletColor });
    const bolt = new THREE.Mesh(geo, mat);
    bolt.position.copy(_v1);
    bolt.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), _v2);

    this.scene.add(bolt);

    const speed = (this.devTuning.bulletSpeed / 52) * config.speed;
    this.projectiles.push({
      mesh: bolt,
      velocity: _v2.clone().multiplyScalar(speed),
      lifetime: config.lifetime,
      isPlayer: true,
      damage: config.damage,
    });

    const sparkCount = config.burstCount > 1 ? 8 : 6;
    this.particles.emit(_v1, sparkCount, config.particleColor, 5, 0.16, 0.42);
    activeBarrel.position.z = config.recoilImpulse;

    if (config.id === 'burst_rifle') {
      soundEngine.playBurstLaser(0.95 + Math.random() * 0.1);
      this.addCameraShake(config.screenShake);
    } else {
      soundEngine.playLaser(1.0 + (this.barrelAlternate ? 0.08 : 0));
      this.addCameraShake(config.screenShake);
    }
  }

  private fireEnemyShot(origin: THREE.Vector3, target: THREE.Vector3, isHeavy: boolean = false) {
    _v1.subVectors(target, origin);
    _v1.y = 0;
    _v1.normalize();

    const geo = isHeavy
      ? new THREE.SphereGeometry(0.55, 12, 12)
      : new THREE.CylinderGeometry(0.15, 0.15, 1.2, 8);
    if (!isHeavy) geo.rotateX(Math.PI / 2);

    const mat = new THREE.MeshBasicMaterial({
      color: isHeavy ? 0xff4400 : 0xff0055,
    });
    const bolt = new THREE.Mesh(geo, mat);
    bolt.position.copy(origin);
    if (!isHeavy) {
      bolt.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), _v1);
    }

    this.scene.add(bolt);

    const speed = isHeavy ? 20 : 28;
    this.projectiles.push({
      mesh: bolt,
      velocity: _v1.clone().multiplyScalar(speed),
      lifetime: 2.2,
      isPlayer: false,
      damage: isHeavy ? 35 : 14,
    });

    soundEngine.playLaser(0.65);
  }

  private dropPowerCore(pos: THREE.Vector3) {
    const group = new THREE.Group();

    const coreGeo = new THREE.OctahedronGeometry(0.45);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    const shadow = createContactShadowMesh(0.8);
    group.add(shadow);

    group.position.copy(pos);
    group.position.y = 0.6;
    this.scene.add(group);

    this.powerCores.push({
      mesh: group,
      position: group.position,
      lifetime: 14.0,
    });
  }

  private tick() {
    if (this.isDisposed) return;

    const now = performance.now();
    const rawDt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    const dt = Math.min(rawDt, 0.05);

    if (this.hitstopRemaining > 0) {
      this.hitstopRemaining -= dt;
      this.renderFrame(0);
      this.animFrameId = requestAnimationFrame(this.tick);
      return;
    }

    if (this.state === 'title') {
      this.updateTitleScreen(dt);
    } else if (this.state === 'playing') {
      this.updateGameSimulation(dt);
    }

    this.renderFrame(dt);
    this.keysJustPressed = {};
    this.animFrameId = requestAnimationFrame(this.tick);
  }

  private updateTitleScreen(dt: number) {
    this.titleOrbitAngle += dt * 0.35;
    const radius = 18;
    this.camera.position.x = Math.sin(this.titleOrbitAngle) * radius;
    this.camera.position.z = Math.cos(this.titleOrbitAngle) * radius;
    this.camera.position.y = 10;
    this.camera.lookAt(0, 1.2, 0);

    this.playerGroup.position.y = Math.sin(this.titleOrbitAngle * 2.5) * 0.2;
    this.playerTurretGroup.rotation.y = Math.sin(this.titleOrbitAngle * 1.5) * 0.5;

    const pulse = 0.8 + Math.sin(this.titleOrbitAngle * 10) * 0.2;
    this.exhaustLeft.scale.set(1, 1, pulse);
    this.exhaustRight.scale.set(1, 1, pulse);

    this.particles.update(dt);
  }

  private updateGameSimulation(dt: number) {
    this.stats.timeAlive += dt;

    this.raycaster.setFromCamera(this.mouseScreen, this.camera);
    _ray.origin.copy(this.raycaster.ray.origin);
    _ray.direction.copy(this.raycaster.ray.direction);
    _ray.intersectPlane(_plane, this.mouseWorldAim);

    if (this.mouseWorldAim) {
      this.crosshairMesh.position.x = this.mouseWorldAim.x;
      this.crosshairMesh.position.z = this.mouseWorldAim.z;
    }

    const inputDir = _v1.set(0, 0, 0);
    if (this.keysHeld['w'] || this.keysHeld['arrowup']) inputDir.z -= 1;
    if (this.keysHeld['s'] || this.keysHeld['arrowdown']) inputDir.z += 1;
    if (this.keysHeld['a'] || this.keysHeld['arrowleft']) inputDir.x -= 1;
    if (this.keysHeld['d'] || this.keysHeld['arrowright']) inputDir.x += 1;

    if (inputDir.lengthSq() > 0) {
      inputDir.normalize();
    }

    if (this.isBoosting) {
      this.boostTimer -= dt;
      if (this.boostTimer <= 0) {
        this.isBoosting = false;
      }
    } else {
      this.stats.boostStamina = Math.min(100, this.stats.boostStamina + dt * 25);
    }
    if (this.boostCooldownTimer > 0) {
      this.boostCooldownTimer -= dt;
    }
    this.stats.canBoost = this.stats.boostStamina >= 30 && this.boostCooldownTimer <= 0;

    if (this.keysJustPressed['shift'] || (this.keysJustPressed[' '] && this.isBoosting === false)) {
      this.triggerBoost();
    }

    const currentSpeed = this.isBoosting ? PLAYER_BOOST_SPEED : PLAYER_SPEED;
    const targetVelX = inputDir.x * currentSpeed;
    const targetVelZ = inputDir.z * currentSpeed;

    const accelRate = this.isBoosting ? 25 : 12;
    this.playerVelocity.x += (targetVelX - this.playerVelocity.x) * Math.min(1, accelRate * dt);
    this.playerVelocity.z += (targetVelZ - this.playerVelocity.z) * Math.min(1, accelRate * dt);

    this.playerGroup.position.x += this.playerVelocity.x * dt;
    this.playerGroup.position.z += this.playerVelocity.z * dt;

    const distFromCenter = Math.sqrt(
      this.playerGroup.position.x * this.playerGroup.position.x +
      this.playerGroup.position.z * this.playerGroup.position.z
    );
    if (distFromCenter > ARENA_RADIUS - 3.5) {
      const clampRatio = (ARENA_RADIUS - 3.5) / distFromCenter;
      this.playerGroup.position.x *= clampRatio;
      this.playerGroup.position.z *= clampRatio;
      this.playerVelocity.multiplyScalar(0.7);
    }

    const speed = this.playerVelocity.length();
    this.playerGroup.position.y = 0.15 + Math.sin(this.stats.timeAlive * 6) * 0.12;

    const bankTarget = -this.playerVelocity.x * 0.025;
    this.playerGroup.rotation.z += (bankTarget - this.playerGroup.rotation.z) * 10 * dt;

    const pitchTarget = this.playerVelocity.z * 0.02;
    this.playerGroup.rotation.x += (pitchTarget - this.playerGroup.rotation.x) * 10 * dt;

    this.playerGroup.scale.x += (1.0 - this.playerGroup.scale.x) * 12 * dt;
    this.playerGroup.scale.y += (1.0 - this.playerGroup.scale.y) * 12 * dt;
    this.playerGroup.scale.z += (1.0 - this.playerGroup.scale.z) * 12 * dt;

    if (speed > 1.0 || this.isBoosting) {
      _v1.setFromMatrixPosition(this.exhaustLeft.matrixWorld);
      _v2.setFromMatrixPosition(this.exhaustRight.matrixWorld);
      const count = this.isBoosting ? 4 : 1;
      this.particles.emit(_v1, count, 0x00f0ff, 3, 0.25, 0.35);
      this.particles.emit(_v2, count, 0x00f0ff, 3, 0.25, 0.35);
    }

    this.leftBarrel.position.z += (1.0 - this.leftBarrel.position.z) * 14 * dt;
    this.rightBarrel.position.z += (1.0 - this.rightBarrel.position.z) * 14 * dt;

    _v1.copy(this.mouseWorldAim).sub(this.playerGroup.position);
    const targetTurretAngle = Math.atan2(_v1.x, _v1.z);
    this.playerTurretGroup.rotation.y = targetTurretAngle;

    this.fireTimer -= dt;

    // Handle active burst sequence
    if (this.burstRemaining > 0) {
      this.burstTimer -= dt;
      if (this.burstTimer <= 0) {
        this.burstRemaining--;
        const config = WEAPON_CONFIGS[this.currentWeapon];
        this.firePlayerBolt(config, this.burstAimTarget);
        this.burstTimer = config.burstInterval;
      }
    }

    // Trigger next shot or burst
    if (this.burstRemaining === 0 && (this.isMouseDown || this.keysHeld['f']) && this.fireTimer <= 0) {
      const config = WEAPON_CONFIGS[this.currentWeapon];
      if (config.burstCount > 1) {
        this.burstAimTarget.copy(this.mouseWorldAim);
        this.firePlayerBolt(config, this.burstAimTarget);
        this.burstRemaining = config.burstCount - 1;
        this.burstTimer = config.burstInterval;
        this.fireTimer = config.fireCooldown;
      } else {
        this.firePlayerBolt(config, this.mouseWorldAim);
        this.fireTimer = config.fireCooldown;
      }
    }

    this.timeSinceLastHit += dt;
    if (this.timeSinceLastHit >= SHIELD_REGEN_DELAY && this.stats.shield < MAX_SHIELD) {
      this.stats.shield = Math.min(MAX_SHIELD, this.stats.shield + SHIELD_REGEN_RATE * dt);
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.mesh.position.addScaledVector(p.velocity, dt);
      p.lifetime -= dt;

      let hit = false;

      if (p.isPlayer) {
        for (let j = this.enemies.length - 1; j >= 0; j--) {
          const enemy = this.enemies[j];
          const dist = p.mesh.position.distanceTo(enemy.meshGroup.position);
          if (dist < enemy.radius + 0.6) {
            hit = true;
            this.damageEnemy(enemy, p.damage, p.mesh.position);
            break;
          }
        }
      } else {
        const distToPlayer = p.mesh.position.distanceTo(this.playerGroup.position);
        if (distToPlayer < 2.0) {
          hit = true;
          this.damagePlayer(p.damage, p.mesh.position);
        }
      }

      if (hit || p.lifetime <= 0 || p.mesh.position.length() > ARENA_RADIUS + 10) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        (p.mesh.material as THREE.Material).dispose();
        this.projectiles.splice(i, 1);
      }
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      this.updateEnemyAI(enemy, dt);

      if (enemy.hitFlashTimer > 0) {
        enemy.hitFlashTimer -= dt;
        if (enemy.hitFlashTimer <= 0) {
          enemy.meshGroup.traverse(child => {
            if ((child as THREE.Mesh).isMesh) {
              const m = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
              if (m && m.emissive) m.emissive.setHex(0x000000);
            }
          });
        }
      }
    }

    for (let i = this.powerCores.length - 1; i >= 0; i--) {
      const core = this.powerCores[i];
      core.lifetime -= dt;
      core.mesh.rotation.y += dt * 3.0;
      core.mesh.position.y = 0.7 + Math.sin(this.stats.timeAlive * 4 + i) * 0.25;

      const dist = core.position.distanceTo(this.playerGroup.position);
      if (dist < 2.6) {
        soundEngine.playPickup();
        this.stats.shield = Math.min(MAX_SHIELD, this.stats.shield + 30);
        this.stats.health = Math.min(MAX_HEALTH, this.stats.health + 15);
        this.stats.score += 150;
        this.particles.emit(core.position, 20, 0x38bdf8, 8, 0.5, 0.7);

        this.scene.remove(core.mesh);
        this.powerCores.splice(i, 1);
      } else if (core.lifetime <= 0) {
        this.scene.remove(core.mesh);
        this.powerCores.splice(i, 1);
      }
    }

    if (this.enemies.length === 0 && !this.isWaveClearing) {
      this.isWaveClearing = true;
      this.waveSpawnTimer = 2.0;
    }

    if (this.isWaveClearing) {
      this.waveSpawnTimer -= dt;
      if (this.waveSpawnTimer <= 0) {
        this.spawnWave(this.stats.wave + 1);
      }
    }

    this.particles.update(dt);

    const targetCamX = this.playerGroup.position.x * 0.7;
    const targetCamZ = this.playerGroup.position.z * 0.7 + 24;
    const damping = this.devTuning.cameraDampingFactor;

    this.camera.position.x += (targetCamX - this.camera.position.x) * Math.min(1, damping * dt);
    this.camera.position.z += (targetCamZ - this.camera.position.z) * Math.min(1, damping * dt);
    this.camera.position.y = 25;

    if (this.cameraShakeAmount > 0.001) {
      this.cameraShakeOffset.set(
        (Math.random() - 0.5) * this.cameraShakeAmount * 1.5,
        (Math.random() - 0.5) * this.cameraShakeAmount * 0.8,
        (Math.random() - 0.5) * this.cameraShakeAmount * 1.5
      );
      this.camera.position.add(this.cameraShakeOffset);
      this.cameraShakeAmount *= Math.exp(-10 * dt);
    }

    this.camera.lookAt(
      this.playerGroup.position.x,
      0.8,
      this.playerGroup.position.z - 2.0
    );

    this.stats.enemiesRemaining = this.enemies.length;
    const boss = this.enemies.find(e => e.type === 'titan');
    this.stats.bossHealthPercent = boss ? (boss.hp / boss.stats.maxHp) * 100 : undefined;

    if (this.onStatsUpdate) {
      this.onStatsUpdate({ ...this.stats });
    }
  }

  private updateEnemyAI(enemy: EnemyInstance, dt: number) {
    _v1.subVectors(this.playerGroup.position, enemy.meshGroup.position);
    const distToPlayer = _v1.length();
    _v1.y = 0;
    _v1.normalize();

    if (enemy.type === 'drone') {
      const desiredDist = 14;
      if (distToPlayer > desiredDist) {
        enemy.velocity.addScaledVector(_v1, enemy.stats.speed * 2.5 * dt);
      } else {
        _v2.set(-_v1.z, 0, _v1.x);
        enemy.velocity.addScaledVector(_v2, enemy.stats.speed * 1.5 * dt);
      }
      enemy.velocity.multiplyScalar(0.92);
      enemy.meshGroup.position.addScaledVector(enemy.velocity, dt);

      enemy.meshGroup.lookAt(this.playerGroup.position.x, 1.3, this.playerGroup.position.z);

      enemy.attackTimer -= dt;
      if (enemy.attackTimer <= 0) {
        enemy.attackTimer = enemy.stats.attackCooldown;
        _v3.copy(enemy.meshGroup.position);
        _v3.y = 1.3;
        this.fireEnemyShot(_v3, this.playerGroup.position, false);
      }
    } else if (enemy.type === 'walker') {
      if (distToPlayer > enemy.stats.attackRange * 0.7) {
        enemy.meshGroup.position.addScaledVector(_v1, enemy.stats.speed * dt);
      }

      if (enemy.turretGroup) {
        _v2.subVectors(this.playerGroup.position, enemy.meshGroup.position);
        enemy.turretGroup.rotation.y = Math.atan2(_v2.x, _v2.z);
      }

      enemy.attackTimer -= dt;
      if (enemy.attackTimer <= 0.8 && !enemy.isTelegraphing) {
        enemy.isTelegraphing = true;
        soundEngine.playTelegraphCharge();
        if (enemy.telegraphLine) {
          (enemy.telegraphLine.material as THREE.LineBasicMaterial).opacity = 0.9;
        }
      }

      if (enemy.attackTimer <= 0) {
        enemy.attackTimer = enemy.stats.attackCooldown;
        enemy.isTelegraphing = false;
        if (enemy.telegraphLine) {
          (enemy.telegraphLine.material as THREE.LineBasicMaterial).opacity = 0;
        }

        _v3.copy(enemy.meshGroup.position);
        _v3.y = 2.4;
        this.fireEnemyShot(_v3, this.playerGroup.position, true);
        soundEngine.playExplosion(false);
      }
    } else if (enemy.type === 'titan') {
      if (distToPlayer > 18) {
        enemy.meshGroup.position.addScaledVector(_v1, enemy.stats.speed * dt);
      }

      if (enemy.turretGroup) {
        _v2.subVectors(this.playerGroup.position, enemy.meshGroup.position);
        enemy.turretGroup.rotation.y = Math.atan2(_v2.x, _v2.z);
      }

      enemy.attackTimer -= dt;
      if (enemy.attackTimer <= 0) {
        enemy.attackTimer = 1.6;
        _v3.copy(enemy.meshGroup.position);
        _v3.y = 3.6;
        this.fireEnemyShot(_v3, this.playerGroup.position, true);
        soundEngine.playExplosion(true);
        this.addCameraShake(0.5);
      }
    }
  }

  private damageEnemy(enemy: EnemyInstance, damage: number, hitPos: THREE.Vector3) {
    enemy.hp -= damage;
    enemy.hitFlashTimer = 0.08;

    enemy.meshGroup.traverse(child => {
      if ((child as THREE.Mesh).isMesh) {
        const m = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (m && m.emissive) m.emissive.setHex(0xffffff);
      }
    });

    this.particles.emit(hitPos, 12, 0xffaa00, 7, 0.35, 0.5);
    soundEngine.playShieldDeflect();

    if (damage >= 25) {
      this.applyHitstop(this.devTuning.hitstopDurationMs);
    }

    if (enemy.hp <= 0) {
      this.destroyEnemy(enemy);
    }
  }

  private destroyEnemy(enemy: EnemyInstance) {
    const idx = this.enemies.indexOf(enemy);
    if (idx !== -1) {
      this.enemies.splice(idx, 1);
    }

    const isHeavy = enemy.type === 'walker' || enemy.type === 'titan';
    soundEngine.playExplosion(isHeavy);
    this.addCameraShake(isHeavy ? 0.8 : 0.4);
    this.applyHitstop(isHeavy ? 70 : 40);

    const pos = enemy.meshGroup.position;
    this.particles.emit(pos, isHeavy ? 60 : 30, isHeavy ? 0xff4400 : 0x00f0ff, 14, 0.7, 0.9);

    this.stats.kills++;
    this.stats.combo++;
    if (this.stats.combo > this.stats.maxCombo) {
      this.stats.maxCombo = this.stats.combo;
    }
    const comboMultiplier = Math.min(5, 1 + Math.floor(this.stats.combo / 4) * 0.5);
    this.stats.score += Math.round(enemy.stats.scoreValue * comboMultiplier);

    if (Math.random() < 0.45 || enemy.type === 'titan') {
      this.dropPowerCore(pos);
    }

    this.scene.remove(enemy.meshGroup);
  }

  private damagePlayer(damage: number, hitPos: THREE.Vector3) {
    this.timeSinceLastHit = 0;
    this.stats.combo = 0;

    if (this.stats.shield > 0) {
      const absorbed = Math.min(this.stats.shield, damage);
      this.stats.shield -= absorbed;
      damage -= absorbed;
      soundEngine.playShieldDeflect();
      this.particles.emit(hitPos, 14, 0x38bdf8, 6, 0.3, 0.5);
    }

    if (damage > 0) {
      this.stats.health = Math.max(0, this.stats.health - damage);
      soundEngine.playExplosion(false);
      this.particles.emit(hitPos, 18, 0xff0044, 9, 0.4, 0.6);
      this.addCameraShake(0.65);
      this.applyHitstop(60);
    }

    if (this.stats.health <= 0) {
      this.gameOver();
    }
  }

  private gameOver() {
    this.state = 'gameover';
    soundEngine.stopAmbientMusic();
    soundEngine.playExplosion(true);
    this.addCameraShake(1.2);
    this.particles.emit(this.playerGroup.position, 80, 0xff0044, 16, 1.2, 1.2);
    if (this.onStateChange) this.onStateChange('gameover');
  }

  private renderFrame(_dt: number) {
    this.renderer.render(this.scene, this.camera);
  }

  public dispose() {
    this.isDisposed = true;
    cancelAnimationFrame(this.animFrameId);
    this.clearProjectiles();
    this.clearEnemies();
    this.particles.dispose();
    this.pmremGenerator.dispose();
    this.renderer.dispose();
    soundEngine.stopAmbientMusic();
  }
}
