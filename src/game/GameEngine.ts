/**
 * Steel Horizon - Core 3D Game Simulation Engine
 * Encapsulates Three.js scene, PBR renderer, input buffering,
 * 60fps physics simulation, hitstop, screenshake, combat logic,
 * Homestead House Defense, Pilot-to-Tank Boarding Lifecycle, and 360° Aiming.
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
  MAX_HOUSE_HP,
  MAX_SHIELD,
  PLAYER_BOOST_SPEED,
  PLAYER_SPEED,
  SHIELD_REGEN_DELAY,
  SHIELD_REGEN_RATE,
  WEAPON_CONFIGS,
  WeaponConfig,
  WeaponType,
  TankUpgrades,
  TANK_UPGRADE_INFOS,
  UPGRADE_MAX_LEVEL,
  RadarBlip,
} from './constants';
import { ParticleSystem } from './particles';
import { FloatingTextSystem } from './floatingText';
import {
  createBattleTankModel,
  createCanyonRock,
  createContactShadowMesh,
  createEnemySoldierModel,
  createLargeDesertGroundTexture,
  createOutpostHouse,
  createPilotHumanModel,
  createPowerMonolith,
  createWatchtower,
  createAntiTankHedgehog,
  createSupplyCrate,
  createSandbagBunker,
  createScrapCanister,
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
  targetsHouse?: boolean;
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
  targetTarget: 'house' | 'player';
}

interface PowerCore {
  mesh: THREE.Group;
  position: THREE.Vector3;
  lifetime: number;
}

interface ScrapCore {
  mesh: THREE.Group;
  position: THREE.Vector3;
  lifetime: number;
  amount: number;
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

  // Mobile touch controls & 360° aim support
  public touchMoveVec: THREE.Vector2 = new THREE.Vector2(0, 0);
  private isTouchAiming: boolean = false;

  public setVirtualMove(x: number, y: number) {
    this.touchMoveVec.set(x, y);
  }

  public setAimFromVector(dx: number, dy: number) {
    if (Math.hypot(dx, dy) > 0.04) {
      const angle = Math.atan2(dx, dy);
      const activeGroup = this.getActivePlayerGroup();
      const dist = 22;
      this.mouseWorldAim.set(
        activeGroup.position.x + Math.sin(angle) * dist,
        0,
        activeGroup.position.z + Math.cos(angle) * dist
      );
      this.isTouchAiming = true;
    }
  }

  public setAimFromScreen(clientX: number, clientY: number) {
    this.mouseScreen.x = (clientX / window.innerWidth) * 2 - 1;
    this.mouseScreen.y = -(clientY / window.innerHeight) * 2 + 1;
    this.isTouchAiming = false;
  }

  public setFiring(firing: boolean) {
    this.isMouseDown = firing;
  }

  // Homestead House
  private houseGroup!: THREE.Group;
  private housePosition: THREE.Vector3 = new THREE.Vector3(0, 0, -8);
  private houseBeaconMesh!: THREE.Mesh;

  // Pilot ("Man") Entity
  private pilotGroup!: THREE.Group;
  private pilotLeftLeg!: THREE.Group;
  private pilotRightLeg!: THREE.Group;
  private pilotLeftArm!: THREE.Group;
  private pilotRightArm!: THREE.Group;
  private pilotLegWalkTime: number = 0;

  // Heavy Battle Tank Entity
  private tankGroup!: THREE.Group;
  private tankTurretGroup!: THREE.Group;
  private tankLeftBarrel!: THREE.Mesh;
  private tankRightBarrel!: THREE.Mesh;
  private tankDockRing!: THREE.Mesh;
  private tankHatchGlow!: THREE.Mesh;
  private tankExtraArmor?: THREE.Group;
  private tankSuperBrakeL?: THREE.Mesh;
  private tankSuperBrakeR?: THREE.Mesh;
  private tankTurboAfterburners?: THREE.Group;
  private tankVelocity: THREE.Vector3 = new THREE.Vector3();
  private tankBarrelAlternate: boolean = false;

  // Movement & Physical state of active player
  private playerVelocity: THREE.Vector3 = new THREE.Vector3();
  private isBoosting: boolean = false;
  private boostTimer: number = 0;
  private boostCooldownTimer: number = 0;
  private timeSinceLastHit: number = 10;
  private fireTimer: number = 0;
  private crosshairMesh!: THREE.Mesh;

  // Entities
  private projectiles: Projectile[] = [];
  private enemies: EnemyInstance[] = [];
  private powerCores: PowerCore[] = [];
  private scrapCores: ScrapCore[] = [];
  private enemyIdCounter: number = 1;
  private waveSpawnTimer: number = 0;
  private isWaveClearing: boolean = false;

  // Particles & Floating Combat Text
  private particles!: ParticleSystem;
  private floatingTexts!: FloatingTextSystem;

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
    this.camera.position.set(0, 26, 28);
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

    // Setup Arena, Lighting, Outpost, Pilot, Tank, Crosshair, Input
    this.initLighting();
    this.initArena();
    this.initHomesteadHouse();
    this.initPilotAndTank();
    this.initCrosshair();
    this.initParticles();
    this.initEventListeners();

    // Start 60fps Game Loop
    this.lastTime = performance.now();
    this.tick = this.tick.bind(this);
    this.animFrameId = requestAnimationFrame(this.tick);
  }

  private getActivePlayerGroup(): THREE.Group {
    return this.stats.playerMode === 'pilot' ? this.pilotGroup : this.tankGroup;
  }

  private initLighting() {
    const ambient = new THREE.AmbientLight(0x0d1527, 2.4);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xe0f2fe, 3.4);
    sun.position.set(65, 95, 45);
    sun.castShadow = !this.isSoftwareGl;
    if (sun.castShadow) {
      sun.shadow.mapSize.width = 1024;
      sun.shadow.mapSize.height = 1024;
      sun.shadow.camera.near = 10;
      sun.shadow.camera.far = 320;
      const d = ARENA_RADIUS + 10;
      sun.shadow.camera.left = -d;
      sun.shadow.camera.right = d;
      sun.shadow.camera.top = d;
      sun.shadow.camera.bottom = -d;
      sun.shadow.bias = -0.0005;
    }
    this.scene.add(sun);

    const fillBlue = new THREE.DirectionalLight(0x0284c7, 1.6);
    fillBlue.position.set(-60, 45, -60);
    this.scene.add(fillBlue);

    const warmLight = new THREE.PointLight(0xf59e0b, 2.0, 60);
    warmLight.position.set(0, 7, -8);
    this.scene.add(warmLight);
  }

  private initArena() {
    // 1. Expansive Large Desert Ground Terrain
    const groundGeo = new THREE.PlaneGeometry(ARENA_RADIUS * 2.4, ARENA_RADIUS * 2.4);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshStandardMaterial({
      map: createLargeDesertGroundTexture(),
      roughness: 0.85,
      metalness: 0.15,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.receiveShadow = !this.isSoftwareGl;
    this.scene.add(ground);

    // 2. Large Perimeter Energy Boundary
    const barrierGeo = new THREE.TorusGeometry(ARENA_RADIUS, 0.85, 16, 96);
    barrierGeo.rotateX(Math.PI / 2);
    const barrierMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.4,
      roughness: 0.2,
      metalness: 0.9,
    });
    const barrier = new THREE.Mesh(barrierGeo, barrierMat);
    barrier.position.y = 0.35;
    this.scene.add(barrier);

    // 3. Perimeter Canyon Mountain Rocks around outer border (140m radius)
    for (let i = 0; i < 44; i++) {
      const angle = (i / 44) * Math.PI * 2;
      const r = ARENA_RADIUS + 6 + (i % 4) * 4;
      const rock = createCanyonRock(4.5 + (i % 4) * 1.5);
      rock.position.set(Math.cos(angle) * r, 0, Math.sin(angle) * r);
      rock.rotation.y = i * 1.35;
      const scaleVariation = 0.9 + (i % 5) * 0.35;
      rock.scale.set(scaleVariation * 1.2, scaleVariation * 1.6, scaleVariation * 1.2);
      this.scene.add(rock);
    }

    // 4. Strategic Military Outpost Watchtowers with Searchlights
    const watchtowerPositions = [
      { x: 0, z: -50 },
      { x: 0, z: 50 },
      { x: -55, z: 0 },
      { x: 55, z: 0 },
    ];
    watchtowerPositions.forEach(p => {
      const tower = createWatchtower();
      tower.position.set(p.x, 0, p.z);
      tower.lookAt(0, 0, 0);
      this.scene.add(tower);
    });

    // 5. Anti-Tank Hedgehog Defensive Barricades
    const hedgehogPositions = [
      { x: -14, z: 12 }, { x: -18, z: 12 }, { x: -22, z: 12 },
      { x: 14, z: 12 }, { x: 18, z: 12 }, { x: 22, z: 12 },
      { x: -35, z: -25 }, { x: 35, z: -25 },
      { x: -28, z: 38 }, { x: 28, z: 38 },
    ];
    hedgehogPositions.forEach(p => {
      const hh = createAntiTankHedgehog();
      hh.position.set(p.x, 0, p.z);
      this.scene.add(hh);
    });

    // 6. Fortified Sandbag Bunkers
    const bunkerPositions = [
      { x: -12, z: -4 },
      { x: 12, z: -4 },
      { x: 0, z: 24 },
    ];
    bunkerPositions.forEach(p => {
      const bunker = createSandbagBunker();
      bunker.position.set(p.x, 0, p.z);
      this.scene.add(bunker);
    });

    // 7. Tactical Supply Crates & Ammo Depots
    const cratePositions = [
      { x: -8, z: -14 },
      { x: 8, z: -14 },
      { x: -26, z: 14 },
      { x: 26, z: 14 },
      { x: -40, z: -35 },
      { x: 40, z: -35 },
    ];
    cratePositions.forEach(p => {
      const crate = createSupplyCrate();
      crate.position.set(p.x, 0, p.z);
      this.scene.add(crate);
    });

    // 8. Power Monolith Pylons across large map
    const monolithPositions = [
      { x: -45, z: -45 },
      { x: 45, z: -45 },
      { x: -45, z: 45 },
      { x: 45, z: 45 },
      { x: -75, z: 0 },
      { x: 75, z: 0 },
    ];
    monolithPositions.forEach((p) => {
      const monolith = createPowerMonolith();
      monolith.position.set(p.x, 0, p.z);
      this.scene.add(monolith);
    });
  }

  private initHomesteadHouse() {
    const outpost = createOutpostHouse();
    this.houseGroup = outpost.group;
    this.houseBeaconMesh = outpost.antennaBeacon;
    this.houseGroup.position.copy(this.housePosition);
    this.scene.add(this.houseGroup);
  }

  private initPilotAndTank() {
    // 1. Create Pilot Human Model
    const pilot = createPilotHumanModel();
    this.pilotGroup = pilot.group;
    this.pilotLeftLeg = pilot.leftLeg;
    this.pilotRightLeg = pilot.rightLeg;
    this.pilotLeftArm = pilot.leftArm;
    this.pilotRightArm = pilot.rightArm;

    // Pilot starts right outside the homestead house door
    this.pilotGroup.position.set(0, 0, -2);
    this.scene.add(this.pilotGroup);

    // 2. Create Heavy Battle Tank Model
    const tank = createBattleTankModel();
    this.tankGroup = tank.group;
    this.tankTurretGroup = tank.turretGroup;
    this.tankLeftBarrel = tank.leftBarrel;
    this.tankRightBarrel = tank.rightBarrel;
    this.tankDockRing = tank.dockRing;
    this.tankHatchGlow = tank.hatchGlow;
    this.tankExtraArmor = tank.extraArmorGroup;
    this.tankSuperBrakeL = tank.superBrakeL;
    this.tankSuperBrakeR = tank.superBrakeR;
    this.tankTurboAfterburners = tank.turboAfterburners;

    // Tank is parked at the tactical docking pad
    this.tankGroup.position.set(8, 0, 1);
    this.scene.add(this.tankGroup);

    // Initial state: Pilot is active on foot
    this.stats.playerMode = 'pilot';
    this.stats.canEnterTank = false;
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
    ctx.moveTo(64, 8);
    ctx.lineTo(64, 24);
    ctx.moveTo(64, 104);
    ctx.lineTo(64, 120);
    ctx.moveTo(8, 64);
    ctx.lineTo(24, 64);
    ctx.moveTo(104, 64);
    ctx.lineTo(120, 64);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;

    const geo = new THREE.PlaneGeometry(3.2, 3.2);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    this.crosshairMesh = new THREE.Mesh(geo, mat);
    this.crosshairMesh.position.y = 0.05;
    this.scene.add(this.crosshairMesh);
  }

  private initParticles() {
    this.particles = new ParticleSystem();
    this.scene.add(this.particles.points);
    this.floatingTexts = new FloatingTextSystem(this.scene);
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
      // 'E': Enter / Exit Tank
      if (key === 'e') {
        if (this.state === 'playing') {
          this.enterOrExitTank();
        }
      }
      // 'Q': Cycle Armament Weapon
      if (key === 'q') {
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

    window.addEventListener(
      'wheel',
      (e) => {
        if (this.state !== 'playing') return;
        const now = performance.now();
        if (now - this.lastWheelTime > 150 && (Math.abs(e.deltaY) > 5 || Math.abs(e.deltaX) > 5)) {
          this.lastWheelTime = now;
          this.switchWeapon();
        }
      },
      { passive: true }
    );

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      let clientX = 0;
      let clientY = 0;
      if ('touches' in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ('clientX' in e) {
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
      }
      this.setAimFromScreen(clientX, clientY);
    };

    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.isMouseDown = true;
      } else if (e.button === 2) {
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
      if (this.isDisposed) return;
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  // ==========================================
  // TANK BOARDING & DISMOUNTING LIFECYCLE
  // ==========================================
  public enterOrExitTank() {
    if (this.state !== 'playing') return;

    if (this.stats.playerMode === 'pilot') {
      // Check if close enough to tank
      const dist = this.pilotGroup.position.distanceTo(this.tankGroup.position);
      if (dist <= 5.0) {
        soundEngine.playTankMount();
        this.stats.playerMode = 'tank';
        this.stats.canEnterTank = false;

        // Hide pilot mesh (pilot enters the tank hatch)
        this.pilotGroup.visible = false;

        // Sparkle activation burst around tank
        this.particles.emit(this.tankGroup.position, 40, 0x00f0ff, 10, 0.4, 0.8);
        this.addCameraShake(0.5);

        if (this.onStatsUpdate) this.onStatsUpdate({ ...this.stats });
      }
    } else {
      // Dismount from tank back to pilot
      soundEngine.playTankMount();
      this.stats.playerMode = 'pilot';
      this.stats.canEnterTank = false;

      // Pilot appears right next to the tank exit ladder
      this.pilotGroup.position.set(
        this.tankGroup.position.x - 2.8,
        0,
        this.tankGroup.position.z
      );
      this.pilotGroup.visible = true;
      this.playerVelocity.set(0, 0, 0);

      if (this.onStatsUpdate) this.onStatsUpdate({ ...this.stats });
    }
  }

  // ==========================================
  // WEAPON SYSTEM
  // ==========================================
  public switchWeapon(type?: WeaponType) {
    if (type) {
      if (this.currentWeapon !== type) {
        this.currentWeapon = type;
        this.stats.currentWeapon = type;
        soundEngine.playWeaponSwitch();
        this.burstRemaining = 0;
        if (this.onStatsUpdate) this.onStatsUpdate({ ...this.stats });
      }
      return;
    }

    const next: WeaponType =
      this.currentWeapon === 'plasma_repeater' ? 'burst_rifle' : 'plasma_repeater';
    this.currentWeapon = next;
    this.stats.currentWeapon = next;
    soundEngine.playWeaponSwitch();
    this.burstRemaining = 0;
    if (this.onStatsUpdate) this.onStatsUpdate({ ...this.stats });
  }

  // ==========================================
  // GAME LIFECYCLE CONTROLS
  // ==========================================
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
    };

    // Reset entities
    this.pilotGroup.position.set(0, 0, -2);
    this.pilotGroup.visible = true;
    this.tankGroup.position.set(8, 0, 1);
    this.playerVelocity.set(0, 0, 0);
    this.tankVelocity.set(0, 0, 0);

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

  public triggerBoost() {
    if (this.stats.boostStamina >= 30 && !this.isBoosting && this.boostCooldownTimer <= 0) {
      this.isBoosting = true;
      this.boostTimer = 0.28;
      this.boostCooldownTimer = 1.2;
      this.stats.boostStamina = Math.max(0, this.stats.boostStamina - 30);
      soundEngine.playDash();

      const activeGroup = this.getActivePlayerGroup();
      this.particles.emit(activeGroup.position, 28, 0x00f0ff, 12, 0.4, 0.6);
      this.addCameraShake(0.35);
    }
  }

  public addCameraShake(amount: number) {
    this.cameraShakeAmount = Math.min(2.0, this.cameraShakeAmount + amount * this.devTuning.cameraShakeIntensity);
  }

  public applyHitstop(durationMs: number) {
    this.hitstopRemaining = Math.max(this.hitstopRemaining, (durationMs / 1000) * (this.devTuning.hitstopDurationMs / 50));
  }

  private clearProjectiles() {
    for (const p of this.projectiles) {
      this.scene.remove(p.mesh);
    }
    this.projectiles = [];
  }

  private clearEnemies() {
    for (const e of this.enemies) {
      this.scene.remove(e.meshGroup);
    }
    this.enemies = [];
  }

  // ==========================================
  // HOMESTEAD DAMAGE & DEFENSE
  // ==========================================
  public damageHouse(damage: number, hitPos?: THREE.Vector3) {
    if (this.state !== 'playing') return;

    this.stats.houseHp = Math.max(0, this.stats.houseHp - damage);

    const pos = hitPos || this.housePosition;
    // Vivid Red floating damage text on house
    this.floatingTexts.spawnDamage(new THREE.Vector3(pos.x, 3.5, pos.z), damage, false);

    // Sparks and smoke emitted from house
    this.particles.emit(new THREE.Vector3(pos.x, 2.5, pos.z), 25, 0xff2247, 8, 0.6, 0.8);
    this.particles.emit(new THREE.Vector3(pos.x, 3.0, pos.z), 15, 0x475569, 5, 1.2, 1.2);
    soundEngine.playExplosion(false);
    this.addCameraShake(0.5);

    if (this.onStatsUpdate) this.onStatsUpdate({ ...this.stats });

    if (this.stats.houseHp <= 0) {
      this.gameOver('HOMESTEAD FALLEN - DEFENSE FAILED');
    }
  }

  // ==========================================
  // WAVE & ENEMY SPAWNING (CONVERTED TO MEN)
  // "Slowly slowly come to enemy and survive"
  // ==========================================
  private spawnWave(waveNumber: number) {
    this.stats.wave = waveNumber;
    this.isWaveClearing = false;
    const isBossWave = waveNumber % 4 === 0;

    // Gradual, calibrated human soldier counts across large map
    let commandoCount = 4 + waveNumber * 2;
    let heavyCount = Math.max(1, Math.floor(waveNumber / 2));

    if (isBossWave) {
      commandoCount = 3;
      heavyCount = 2;
      this.spawnBossTitan();
    }

    for (let i = 0; i < commandoCount; i++) {
      this.spawnEnemy('commando');
    }
    for (let i = 0; i < heavyCount; i++) {
      this.spawnEnemy('heavy_trooper');
    }

    this.stats.enemiesRemaining = this.enemies.length;
    if (this.onStatsUpdate) this.onStatsUpdate({ ...this.stats });
  }

  private spawnEnemy(type: EnemyType) {
    const angle = Math.random() * Math.PI * 2;
    const distance = 45 + Math.random() * (ARENA_RADIUS - 55);
    const spawnPos = new THREE.Vector3(Math.cos(angle) * distance, 0, Math.sin(angle) * distance);

    const variant = (type === 'warlord' || type === 'titan') ? 'warlord'
      : (type === 'heavy_trooper' || type === 'walker') ? 'heavy'
      : 'commando';

    // Procedural human infantry soldier ("man")
    const soldier = createEnemySoldierModel(variant);
    soldier.group.position.copy(spawnPos);
    this.scene.add(soldier.group);

    const stats = { ...(ENEMY_CONFIGS[type] || ENEMY_CONFIGS.commando) };

    this.enemies.push({
      id: this.enemyIdCounter++,
      type,
      stats,
      hp: stats.maxHp,
      meshGroup: soldier.group,
      turretGroup: soldier.turretGroup,
      telegraphLine: soldier.telegraphLine,
      attackTimer: 2.0 + Math.random() * stats.attackCooldown,
      telegraphTimer: 0,
      isTelegraphing: false,
      aimTarget: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      radius: stats.radius,
      hitFlashTimer: 0,
      targetTarget: Math.random() < 0.6 ? 'house' : 'player',
    });
  }

  private spawnBossTitan() {
    const spawnPos = new THREE.Vector3(0, 0, -60);
    const warlord = createEnemySoldierModel('warlord');
    warlord.group.position.copy(spawnPos);
    this.scene.add(warlord.group);

    const stats = { ...ENEMY_CONFIGS.warlord };
    this.enemies.push({
      id: this.enemyIdCounter++,
      type: 'warlord',
      stats,
      hp: stats.maxHp,
      meshGroup: warlord.group,
      turretGroup: warlord.turretGroup,
      attackTimer: 2.8,
      telegraphTimer: 0,
      isTelegraphing: false,
      aimTarget: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      radius: stats.radius,
      hitFlashTimer: 0,
      targetTarget: 'house',
    });
  }

  // ==========================================
  // PROJECTILE SYSTEM
  // ==========================================
  private firePlayerBolt(config: WeaponConfig, targetPos: THREE.Vector3) {
    const isTank = this.stats.playerMode === 'tank';
    const activeGroup = this.getActivePlayerGroup();

    let spawnPos = new THREE.Vector3();
    if (isTank) {
      // Alternating dual cannons
      this.tankBarrelAlternate = !this.tankBarrelAlternate;
      const barrel = this.tankBarrelAlternate ? this.tankLeftBarrel : this.tankRightBarrel;
      barrel.position.z = 1.6; // heavy recoil
      barrel.getWorldPosition(spawnPos);
      spawnPos.y = 1.9;
    } else {
      // Pilot sidearm pistol
      activeGroup.getWorldPosition(spawnPos);
      spawnPos.y = 1.35;
      spawnPos.x += 0.35;
    }

    _v1.subVectors(targetPos, spawnPos);
    _v1.y = 0;
    _v1.normalize();

    // Spread
    _v1.x += (Math.random() - 0.5) * config.spread;
    _v1.z += (Math.random() - 0.5) * config.spread;
    _v1.normalize();

    const cannonLvl = this.stats.tankUpgrades?.cannonsLevel || 1;
    const cannonMult = isTank ? 1 + (cannonLvl - 1) * 0.35 : 1;
    const bulletDamage = Math.round(config.damage * cannonMult);

    const bulletLength = isTank ? config.bulletLength * (1.3 + (cannonLvl - 1) * 0.12) : config.bulletLength * 0.9;
    const bulletRadius = isTank ? config.bulletRadius * (1.3 + (cannonLvl - 1) * 0.08) : config.bulletRadius * 0.9;
    const geo = new THREE.CylinderGeometry(bulletRadius, bulletRadius, bulletLength, 8);
    geo.rotateX(Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({ color: config.bulletColor });
    const mesh = new THREE.Mesh(geo, mat);

    mesh.position.copy(spawnPos);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), _v1);
    this.scene.add(mesh);

    const speed = this.devTuning.bulletSpeed || config.speed;
    const velocity = _v1.clone().multiplyScalar(speed);

    this.projectiles.push({
      mesh,
      velocity,
      lifetime: config.lifetime,
      isPlayer: true,
      damage: bulletDamage,
    });

    if (config.id === 'plasma_repeater') {
      soundEngine.playLaser(isTank ? 0.9 : 1.15);
    } else {
      soundEngine.playBurstLaser(isTank ? 0.95 : 1.2);
    }

    this.addCameraShake(config.screenShake * (isTank ? 1.3 : 0.8));
    this.particles.emit(spawnPos, isTank ? 10 : 5, config.particleColor, 6, 0.2, 0.3);
  }

  private fireEnemyShot(from: THREE.Vector3, target: THREE.Vector3, isHeavy: boolean = false, targetsHouse: boolean = false) {
    _v1.subVectors(target, from);
    _v1.y = 0;
    _v1.normalize();

    const geo = new THREE.SphereGeometry(isHeavy ? 0.45 : 0.26, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color: isHeavy ? 0xf43f5e : 0xf97316 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(from);
    this.scene.add(mesh);

    const speed = isHeavy ? 28 : 34;
    const velocity = _v1.clone().multiplyScalar(speed);

    this.projectiles.push({
      mesh,
      velocity,
      lifetime: 2.8,
      isPlayer: false,
      damage: isHeavy ? 35 : 18,
      targetsHouse,
    });
  }

  // ==========================================
  // POWER CORES (HEALTH & SHIELD PICKUPS)
  // ==========================================
  private dropPowerCore(pos: THREE.Vector3) {
    const group = new THREE.Group();
    const geo = new THREE.OctahedronGeometry(0.75, 0);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      emissive: 0x10b981,
      emissiveIntensity: 0.9,
      roughness: 0.2,
      metalness: 0.8,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = 0.9;
    group.add(mesh);
    group.position.copy(pos);
    group.position.y = 0;
    this.scene.add(group);

    this.powerCores.push({
      mesh: group,
      position: group.position,
      lifetime: 24,
    });
  }

  // ==========================================
  // COMBAT SCRAP PICKUPS (FOR TANKER UPGRADES)
  // ==========================================
  private dropScrapCanister(pos: THREE.Vector3, amount: number) {
    const canister = createScrapCanister();
    canister.position.copy(pos);
    canister.position.y = 0.05;
    this.scene.add(canister);

    this.scrapCores.push({
      mesh: canister,
      position: canister.position,
      lifetime: 30,
      amount,
    });
  }

  // ==========================================
  // MAIN GAME TICK (60 FPS)
  // ==========================================
  private tick(now: number) {
    if (this.isDisposed) return;
    this.animFrameId = requestAnimationFrame(this.tick);

    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    // Handle Title orbit camera
    if (this.state === 'title') {
      this.titleOrbitAngle += dt * 0.4;
      const camDist = 32;
      this.camera.position.x = Math.sin(this.titleOrbitAngle) * camDist;
      this.camera.position.z = Math.cos(this.titleOrbitAngle) * camDist;
      this.camera.position.y = 18;
      this.camera.lookAt(0, 2, 0);
      this.pilotGroup.rotation.y += dt * 0.8;
      this.tankTurretGroup.rotation.y += dt * 0.5;
      this.particles.update(dt);
      this.floatingTexts.update(dt);
      this.renderFrame(dt);
      return;
    }

    if (this.state === 'paused') {
      this.renderFrame(dt);
      return;
    }

    // Hitstop freeze
    if (this.hitstopRemaining > 0) {
      this.hitstopRemaining -= dt;
      this.renderFrame(dt);
      return;
    }

    // Camera Shake Decay
    if (this.cameraShakeAmount > 0) {
      this.cameraShakeAmount = Math.max(0, this.cameraShakeAmount - dt * 4.5);
      this.cameraShakeOffset.set(
        (Math.random() - 0.5) * this.cameraShakeAmount,
        (Math.random() - 0.5) * this.cameraShakeAmount * 0.6,
        (Math.random() - 0.5) * this.cameraShakeAmount
      );
    } else {
      this.cameraShakeOffset.set(0, 0, 0);
    }

    // Simulation updates
    this.updateAimReticle();
    this.updateActivePlayerMovement(dt);
    this.updateCombatFiring(dt);
    this.updateProjectiles(dt);
    this.updatePowerCores(dt);
    this.updateEnemies(dt);
    this.updateCamera(dt);

    // Particle & Floating text tick
    this.particles.update(dt);
    this.floatingTexts.update(dt);

    // Blink outpost comms beacon
    if (this.houseBeaconMesh) {
      const beaconMat = this.houseBeaconMesh.material as THREE.MeshBasicMaterial;
      beaconMat.opacity = Math.sin(now * 0.005) > 0 ? 1.0 : 0.2;
    }

    // Reset single-frame keys
    this.keysJustPressed = {};

    this.renderFrame(dt);
  }

  // ==========================================
  // AIM RETICLE UPDATE (360° MOUSE & TOUCH)
  // ==========================================
  private updateAimReticle() {
    if (!this.isTouchAiming) {
      this.raycaster.setFromCamera(this.mouseScreen, this.camera);
      this.raycaster.ray.intersectPlane(_plane, this.mouseWorldAim);
    }

    if (this.mouseWorldAim) {
      this.crosshairMesh.position.x = this.mouseWorldAim.x;
      this.crosshairMesh.position.z = this.mouseWorldAim.z;
    }
  }

  // ==========================================
  // ACTIVE PLAYER MOVEMENT & ANIMATION
  // ==========================================
  private updateActivePlayerMovement(dt: number) {
    this.stats.timeAlive += dt;

    // Shield Regen
    this.timeSinceLastHit += dt;
    if (this.timeSinceLastHit > SHIELD_REGEN_DELAY && this.stats.shield < MAX_SHIELD) {
      this.stats.shield = Math.min(MAX_SHIELD, this.stats.shield + SHIELD_REGEN_RATE * dt);
    }

    // Gather movement input
    const inputDir = new THREE.Vector3(0, 0, 0);
    if (this.keysHeld['w'] || this.keysHeld['arrowup']) inputDir.z -= 1;
    if (this.keysHeld['s'] || this.keysHeld['arrowdown']) inputDir.z += 1;
    if (this.keysHeld['a'] || this.keysHeld['arrowleft']) inputDir.x -= 1;
    if (this.keysHeld['d'] || this.keysHeld['arrowright']) inputDir.x += 1;

    // Apply mobile virtual joystick
    inputDir.x += this.touchMoveVec.x;
    inputDir.z += this.touchMoveVec.y;

    if (inputDir.lengthSq() > 0) {
      if (inputDir.lengthSq() > 1) {
        inputDir.normalize();
      }
    }

    // Boost stamina
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

    if (this.keysJustPressed['shift'] || (this.keysJustPressed[' '] && !this.isBoosting)) {
      this.triggerBoost();
    }

    const isTank = this.stats.playerMode === 'tank';
    const activeGroup = this.getActivePlayerGroup();

    // Speed configuration with engine level upgrades
    const engineLvl = this.stats.tankUpgrades?.engineLevel || 1;
    const engineMult = isTank ? 1 + (engineLvl - 1) * 0.2 : 1;
    const baseSpeed = isTank ? PLAYER_SPEED * 0.95 * engineMult : PLAYER_SPEED * 1.05;
    const currentSpeed = this.isBoosting ? (isTank ? PLAYER_BOOST_SPEED * engineMult : PLAYER_BOOST_SPEED) : baseSpeed;

    const targetVelX = inputDir.x * currentSpeed;
    const targetVelZ = inputDir.z * currentSpeed;
    const accelRate = this.isBoosting ? 26 : 14;

    this.playerVelocity.x += (targetVelX - this.playerVelocity.x) * Math.min(1, accelRate * dt);
    this.playerVelocity.z += (targetVelZ - this.playerVelocity.z) * Math.min(1, accelRate * dt);

    activeGroup.position.x += this.playerVelocity.x * dt;
    activeGroup.position.z += this.playerVelocity.z * dt;

    // Arena boundary clamp
    const distFromCenter = Math.sqrt(
      activeGroup.position.x * activeGroup.position.x +
      activeGroup.position.z * activeGroup.position.z
    );
    if (distFromCenter > ARENA_RADIUS - 3.5) {
      const clampRatio = (ARENA_RADIUS - 3.5) / distFromCenter;
      activeGroup.position.x *= clampRatio;
      activeGroup.position.z *= clampRatio;
      this.playerVelocity.multiplyScalar(0.7);
    }

    const speed = this.playerVelocity.length();

    // 360° AIM ROTATION
    _v1.copy(this.mouseWorldAim).sub(activeGroup.position);
    const targetAimAngle = Math.atan2(_v1.x, _v1.z);

    if (isTank) {
      // Tank Chassis turns towards movement vector when driving
      if (speed > 0.5) {
        const moveAngle = Math.atan2(this.playerVelocity.x, this.playerVelocity.z);
        this.tankGroup.rotation.y += (moveAngle - this.tankGroup.rotation.y) * 8 * dt;
      }
      // Tank Turret aims 360° independently at crosshair
      this.tankTurretGroup.rotation.y = targetAimAngle - this.tankGroup.rotation.y;

      // Cannon barrel recoil return
      this.tankLeftBarrel.position.z += (2.4 - this.tankLeftBarrel.position.z) * 14 * dt;
      this.tankRightBarrel.position.z += (2.4 - this.tankRightBarrel.position.z) * 14 * dt;

      // Exhaust smoke from tank when driving
      if (speed > 1.0 || this.isBoosting) {
        this.particles.emit(
          new THREE.Vector3(this.tankGroup.position.x, 1.8, this.tankGroup.position.z - 2.2),
          this.isBoosting ? 4 : 1,
          0x475569,
          3,
          0.3,
          0.5
        );
      }
    } else {
      // Pilot Mode ("Man" on foot)
      // Pilot whole body aims 360° towards mouse/touch crosshair
      this.pilotGroup.rotation.y = targetAimAngle;

      // Legs swing dynamically while walking
      if (speed > 0.6) {
        this.pilotLegWalkTime += dt * (speed * 0.9);
        const legSwing = Math.sin(this.pilotLegWalkTime) * 0.65;
        this.pilotLeftLeg.rotation.x = legSwing;
        this.pilotRightLeg.rotation.x = -legSwing;
        this.pilotLeftArm.rotation.x = -legSwing * 0.5;
        this.pilotRightArm.rotation.x = legSwing * 0.5;
      } else {
        // Return legs to neutral stance
        this.pilotLeftLeg.rotation.x += (0 - this.pilotLeftLeg.rotation.x) * 12 * dt;
        this.pilotRightLeg.rotation.x += (0 - this.pilotRightLeg.rotation.x) * 12 * dt;
        this.pilotLeftArm.rotation.x += (0 - this.pilotLeftArm.rotation.x) * 12 * dt;
        this.pilotRightArm.rotation.x += (0 - this.pilotRightArm.rotation.x) * 12 * dt;
      }

      // Check proximity to parked tank dock
      const distToTank = this.pilotGroup.position.distanceTo(this.tankGroup.position);
      const canMount = distToTank <= 4.5;
      if (this.stats.canEnterTank !== canMount) {
        this.stats.canEnterTank = canMount;
        if (this.onStatsUpdate) this.onStatsUpdate({ ...this.stats });
      }

      // Pulse tank docking ring to guide pilot
      if (this.tankDockRing) {
        const ringMat = this.tankDockRing.material as THREE.MeshBasicMaterial;
        ringMat.opacity = 0.5 + Math.sin(this.stats.timeAlive * 5) * 0.35;
      }
    }
  }

  // ==========================================
  // COMBAT FIRING & SALVO BURST
  // ==========================================
  private updateCombatFiring(dt: number) {
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

    // Trigger new firing sequence
    if (this.isMouseDown && this.fireTimer <= 0 && this.burstRemaining === 0) {
      const config = WEAPON_CONFIGS[this.currentWeapon];
      const isTank = this.stats.playerMode === 'tank';
      const autoloaderLvl = this.stats.tankUpgrades?.autoloaderLevel || 1;
      const autoloaderMult = isTank ? Math.pow(0.85, autoloaderLvl - 1) : 1;
      this.fireTimer = config.fireCooldown * autoloaderMult;

      if (config.burstCount > 1) {
        this.burstRemaining = config.burstCount - 1;
        this.burstTimer = config.burstInterval;
        this.burstAimTarget.copy(this.mouseWorldAim);
        this.firePlayerBolt(config, this.mouseWorldAim);
      } else {
        this.firePlayerBolt(config, this.mouseWorldAim);
      }
    }
  }

  // ==========================================
  // PROJECTILES SIMULATION & COLLISION
  // ==========================================
  private updateProjectiles(dt: number) {
    const activeGroup = this.getActivePlayerGroup();

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.lifetime -= dt;
      p.mesh.position.addScaledVector(p.velocity, dt);

      // Out of bounds or expired
      if (p.lifetime <= 0 || p.mesh.position.length() > ARENA_RADIUS + 5) {
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
        continue;
      }

      if (p.isPlayer) {
        // Player shot checking enemy collision
        let hitEnemy = false;
        for (const enemy of this.enemies) {
          const dist = p.mesh.position.distanceTo(enemy.meshGroup.position);
          if (dist < enemy.radius + 0.3) {
            hitEnemy = true;
            this.handleEnemyHit(enemy, p.damage, p.mesh.position);
            break;
          }
        }
        if (hitEnemy) {
          this.scene.remove(p.mesh);
          this.projectiles.splice(i, 1);
        }
      } else {
        // Enemy shot checking Player or Homestead House collision
        const distToPlayer = p.mesh.position.distanceTo(activeGroup.position);
        const distToHouse = p.mesh.position.distanceTo(this.housePosition);

        if (distToPlayer < (this.stats.playerMode === 'tank' ? 2.6 : 1.3)) {
          this.damagePlayer(p.damage, p.mesh.position);
          this.scene.remove(p.mesh);
          this.projectiles.splice(i, 1);
        } else if (distToHouse < 4.2) {
          this.damageHouse(p.damage, p.mesh.position);
          this.scene.remove(p.mesh);
          this.projectiles.splice(i, 1);
        }
      }
    }
  }

  // ==========================================
  // POWER CORE PICKUPS (+25 HP / +SHIELD)
  // ==========================================
  private updatePowerCores(dt: number) {
    const activeGroup = this.getActivePlayerGroup();

    for (let i = this.powerCores.length - 1; i >= 0; i--) {
      const core = this.powerCores[i];
      core.lifetime -= dt;
      core.mesh.rotation.y += dt * 2.5;

      const dist = core.position.distanceTo(activeGroup.position);
      if (dist < 3.2) {
        soundEngine.playPickup();
        const hpGain = 25;
        const shieldGain = 35;
        this.stats.health = Math.min(MAX_HEALTH, this.stats.health + hpGain);
        this.stats.shield = Math.min(MAX_SHIELD, this.stats.shield + shieldGain);

        // Emerald Green Floating Combat Text for Heal!
        this.floatingTexts.spawnHeal(activeGroup.position, hpGain);
        this.floatingTexts.spawnShield(activeGroup.position, shieldGain);

        this.particles.emit(core.position, 28, 0x22c55e, 10, 0.4, 0.6);
        this.scene.remove(core.mesh);
        this.powerCores.splice(i, 1);
        if (this.onStatsUpdate) this.onStatsUpdate({ ...this.stats });
        continue;
      }

      if (core.lifetime <= 0) {
        this.scene.remove(core.mesh);
        this.powerCores.splice(i, 1);
      }
    }
  }

  // ==========================================
  // SCRAP PICKUP LOGIC (COMBAT ALLOY TECH)
  // ==========================================
  private updateScrapCores(dt: number) {
    const activeGroup = this.getActivePlayerGroup();

    for (let i = this.scrapCores.length - 1; i >= 0; i--) {
      const core = this.scrapCores[i];
      core.lifetime -= dt;
      core.mesh.rotation.y += dt * 2.8;

      const dist = core.position.distanceTo(activeGroup.position);
      if (dist < 3.8) {
        soundEngine.playPickup();
        this.stats.scrap += core.amount;

        // Floating scrap text
        this.floatingTexts.spawnScrap(activeGroup.position, core.amount);

        // Radiant amber scrap tech particles
        this.particles.emit(core.position, 24, 0xf59e0b, 8, 0.4, 0.6);
        this.scene.remove(core.mesh);
        this.scrapCores.splice(i, 1);
        if (this.onStatsUpdate) this.onStatsUpdate({ ...this.stats });
        continue;
      }

      if (core.lifetime <= 0) {
        this.scene.remove(core.mesh);
        this.scrapCores.splice(i, 1);
      }
    }
  }

  // ==========================================
  // CAMERA FOLLOW & DAMPING
  // ==========================================
  private updateCamera(dt: number) {
    const activeGroup = this.getActivePlayerGroup();
    const targetCamX = activeGroup.position.x * 0.7;
    const targetCamZ = activeGroup.position.z * 0.7 + 25;
    const damping = this.devTuning.cameraDampingFactor || 4.5;

    this.camera.position.x += (targetCamX - this.camera.position.x) * damping * dt;
    this.camera.position.z += (targetCamZ - this.camera.position.z) * damping * dt;
    this.camera.position.y = 26;

    // Apply screenshake
    this.camera.position.add(this.cameraShakeOffset);

    this.camera.lookAt(
      activeGroup.position.x * 0.35,
      1.0,
      activeGroup.position.z * 0.35 - 2.5
    );
  }

  // ==========================================
  // ENEMY AI BEHAVIOR & HOUSE ASSAULT
  // "Slowly slowly come to enemy and survive"
  // ==========================================
  private updateEnemies(dt: number) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      this.updateEnemyAI(enemy, dt);
    }

    // Check wave clearance
    if (this.enemies.length === 0 && !this.isWaveClearing) {
      this.isWaveClearing = true;
      this.waveSpawnTimer = 3.0;
    }

    if (this.isWaveClearing) {
      this.waveSpawnTimer -= dt;
      if (this.waveSpawnTimer <= 0) {
        this.spawnWave(this.stats.wave + 1);
      }
    }

    this.stats.enemiesRemaining = this.enemies.length;
    const boss = this.enemies.find((e) => e.type === 'titan');
    this.stats.bossHealthPercent = boss ? (boss.hp / boss.stats.maxHp) * 100 : undefined;
    if (this.onStatsUpdate) {
      this.onStatsUpdate({ ...this.stats });
    }
  }

  private updateEnemyAI(enemy: EnemyInstance, dt: number) {
    const activeGroup = this.getActivePlayerGroup();
    const distToPlayer = enemy.meshGroup.position.distanceTo(activeGroup.position);
    const distToHouse = enemy.meshGroup.position.distanceTo(this.housePosition);

    // Dynamic target selection: If player is near or enemy took damage, target player; else march on homestead house!
    let targetPos = activeGroup.position;
    if (enemy.targetTarget === 'house' && distToPlayer > 20) {
      targetPos = this.housePosition;
    }

    _v1.subVectors(targetPos, enemy.meshGroup.position);
    _v1.y = 0;
    _v1.normalize();

    // Procedural human infantry stride animation ("men walking/running")
    const u = enemy.meshGroup.userData;
    if (u && u.isHumanSoldier) {
      u.walkTime = (u.walkTime || 0) + dt * (enemy.stats.speed * 1.5);
      const legSwing = Math.sin(u.walkTime) * 0.72;
      if (u.leftLeg) u.leftLeg.rotation.x = legSwing;
      if (u.rightLeg) u.rightLeg.rotation.x = -legSwing;
      if (u.leftArm) u.leftArm.rotation.x = -legSwing * 0.35;
      if (u.rightArm && !enemy.isTelegraphing) u.rightArm.rotation.x = legSwing * 0.35;
    }

    const isCommando = enemy.type === 'commando' || enemy.type === 'drone';
    const isHeavy = enemy.type === 'heavy_trooper' || enemy.type === 'walker';
    const isWarlord = enemy.type === 'warlord' || enemy.type === 'titan';

    if (isCommando) {
      const desiredDist = enemy.targetTarget === 'house' ? 6 : 14;
      const currentDist = enemy.targetTarget === 'house' ? distToHouse : distToPlayer;

      if (currentDist > desiredDist) {
        enemy.velocity.addScaledVector(_v1, enemy.stats.speed * 0.9 * dt);
      } else {
        _v2.set(-_v1.z, 0, _v1.x);
        enemy.velocity.addScaledVector(_v2, enemy.stats.speed * 0.7 * dt);
      }
      enemy.velocity.multiplyScalar(0.92);
      enemy.meshGroup.position.addScaledVector(enemy.velocity, dt);
      enemy.meshGroup.lookAt(targetPos.x, 0, targetPos.z);

      enemy.attackTimer -= dt;
      if (enemy.attackTimer <= 0) {
        enemy.attackTimer = enemy.stats.attackCooldown;
        _v3.copy(enemy.meshGroup.position);
        _v3.y = 1.35;
        this.fireEnemyShot(_v3, targetPos, false, enemy.targetTarget === 'house');
      }
    } else if (isHeavy) {
      const currentDist = enemy.targetTarget === 'house' ? distToHouse : distToPlayer;
      if (currentDist > 14) {
        enemy.meshGroup.position.addScaledVector(_v1, enemy.stats.speed * 0.85 * dt);
      }
      enemy.meshGroup.lookAt(targetPos.x, 0, targetPos.z);

      if (enemy.turretGroup) {
        _v2.subVectors(targetPos, enemy.meshGroup.position);
        enemy.turretGroup.rotation.y = Math.atan2(_v2.x, _v2.z) - enemy.meshGroup.rotation.y;
      }

      enemy.attackTimer -= dt;
      if (enemy.attackTimer <= 0.8 && !enemy.isTelegraphing) {
        enemy.isTelegraphing = true;
        soundEngine.playTelegraphCharge();
        if (enemy.telegraphLine) {
          (enemy.telegraphLine.material as THREE.LineBasicMaterial).opacity = 0.95;
        }
      }
      if (enemy.attackTimer <= 0) {
        enemy.attackTimer = enemy.stats.attackCooldown;
        enemy.isTelegraphing = false;
        if (enemy.telegraphLine) {
          (enemy.telegraphLine.material as THREE.LineBasicMaterial).opacity = 0;
        }
        _v3.copy(enemy.meshGroup.position);
        _v3.y = 1.6;
        this.fireEnemyShot(_v3, targetPos, true, enemy.targetTarget === 'house');
        soundEngine.playExplosion(false);
      }
    } else if (isWarlord) {
      const currentDist = enemy.targetTarget === 'house' ? distToHouse : distToPlayer;
      if (currentDist > 18) {
        enemy.meshGroup.position.addScaledVector(_v1, enemy.stats.speed * 0.8 * dt);
      }
      enemy.meshGroup.lookAt(targetPos.x, 0, targetPos.z);

      enemy.attackTimer -= dt;
      if (enemy.attackTimer <= 0) {
        enemy.attackTimer = 1.8;
        _v3.copy(enemy.meshGroup.position);
        _v3.y = 2.2;
        this.fireEnemyShot(_v3, targetPos, true, enemy.targetTarget === 'house');
        soundEngine.playExplosion(true);
      }
    }

    // Direct melee damage to house if enemy reaches close perimeter
    if (distToHouse < 4.5 && enemy.targetTarget === 'house') {
      this.damageHouse(15 * dt);
    }
  }

  // ==========================================
  // ENEMY HIT & DAMAGE NUMBERS
  // ==========================================
  private handleEnemyHit(enemy: EnemyInstance, baseDamage: number, hitPos: THREE.Vector3) {
    // Retarget to player upon receiving fire
    enemy.targetTarget = 'player';

    // 25% Critical Hit Chance
    const isCrit = Math.random() < 0.25;
    const finalDamage = isCrit ? Math.round(baseDamage * 1.85) : baseDamage;

    enemy.hp -= finalDamage;

    // Floating text: Vivid Red for standard, Gold for Critical!
    if (isCrit) {
      this.floatingTexts.spawnCrit(hitPos, finalDamage);
      soundEngine.playCriticalHit();
      this.addCameraShake(0.45);
      this.applyHitstop(45);
    } else {
      this.floatingTexts.spawnDamage(hitPos, finalDamage, false);
      this.particles.emit(hitPos, 10, 0xff2247, 7, 0.25, 0.4);
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

    const isHeavy = enemy.type === 'heavy_trooper' || enemy.type === 'walker' || enemy.type === 'warlord' || enemy.type === 'titan';
    soundEngine.playExplosion(isHeavy);
    this.addCameraShake(isHeavy ? 0.8 : 0.4);
    this.applyHitstop(isHeavy ? 70 : 40);

    const pos = enemy.meshGroup.position;
    this.particles.emit(pos, isHeavy ? 55 : 30, isHeavy ? 0xff4400 : 0x00f0ff, 14, 0.7, 0.9);

    this.stats.kills++;
    this.stats.combo++;
    if (this.stats.combo > this.stats.maxCombo) {
      this.stats.maxCombo = this.stats.combo;
    }

    const comboMultiplier = Math.min(5, 1 + Math.floor(this.stats.combo / 4) * 0.5);
    this.stats.score += Math.round(enemy.stats.scoreValue * comboMultiplier);

    // Guaranteed Combat Scrap Drop for Tanker Upgrades!
    const scrapVal = enemy.stats.scrapValue || 40;
    this.dropScrapCanister(pos, scrapVal);

    if (Math.random() < 0.45 || enemy.type === 'warlord' || enemy.type === 'titan') {
      this.dropPowerCore(pos);
    }

    this.scene.remove(enemy.meshGroup);
  }

  // ==========================================
  // PLAYER DAMAGE & GAME OVER
  // ==========================================
  private damagePlayer(damage: number, hitPos: THREE.Vector3) {
    this.timeSinceLastHit = 0;
    this.stats.combo = 0;

    // Tank reduces incoming damage based on Hull Armor Upgrade Level (40% up to 72% damage reduction)
    if (this.stats.playerMode === 'tank') {
      const armorLvl = this.stats.tankUpgrades?.hullArmorLevel || 1;
      const reduction = Math.min(0.72, 0.4 + (armorLvl - 1) * 0.08);
      damage = Math.round(damage * (1 - reduction));
    }

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
      this.gameOver('OPERATIVE KIA');
    }
  }

  private gameOver(reason: string = 'MISSION FAILED') {
    this.state = 'gameover';
    soundEngine.stopAmbientMusic();
    soundEngine.playExplosion(true);
    this.addCameraShake(1.2);

    const activeGroup = this.getActivePlayerGroup();
    this.particles.emit(activeGroup.position, 80, 0xff0044, 16, 1.2, 1.2);

    if (this.onStateChange) this.onStateChange('gameover');
  }

  // ==========================================
  // TANKER UPGRADE SYSTEM API
  // "tanker upgrade button launch"
  // ==========================================
  public upgradeTank(type: keyof TankUpgrades): boolean {
    const currentLvl = this.stats.tankUpgrades[type];
    if (currentLvl >= UPGRADE_MAX_LEVEL) return false;

    const info = TANK_UPGRADE_INFOS[type];
    const cost = info.baseCost + (currentLvl - 1) * info.costStep;
    if (this.stats.scrap < cost) return false;

    this.stats.scrap -= cost;
    this.stats.tankUpgrades[type] = currentLvl + 1;

    // Apply immediate visual and vitality enhancements to the Tank
    if (type === 'hullArmorLevel') {
      const extraHp = 40;
      this.stats.health = Math.min(MAX_HEALTH + (this.stats.tankUpgrades.hullArmorLevel - 1) * 40, this.stats.health + 50);
      if (this.tankExtraArmor) this.tankExtraArmor.visible = true;
      this.floatingTexts.spawnHeal(this.tankGroup.position, 50);
    } else if (type === 'cannonsLevel') {
      if (this.tankSuperBrakeL) this.tankSuperBrakeL.visible = true;
      if (this.tankSuperBrakeR) this.tankSuperBrakeR.visible = true;
    } else if (type === 'engineLevel') {
      if (this.tankTurboAfterburners) this.tankTurboAfterburners.visible = true;
    }

    soundEngine.playUpgrade();
    this.particles.emit(this.tankGroup.position, 40, 0x00f0ff, 12, 0.45, 0.75);

    if (this.onStatsUpdate) this.onStatsUpdate({ ...this.stats });
    return true;
  }

  private renderFrame(_dt: number) {
    // Populate mini-map tactical radar blips
    if (this.state === 'playing') {
      const activeGroup = this.getActivePlayerGroup();
      const blips: RadarBlip[] = [
        { x: activeGroup.position.x, z: activeGroup.position.z, type: 'player', rot: activeGroup.rotation.y },
        { x: this.housePosition.x, z: this.housePosition.z, type: 'house' },
      ];
      if (this.stats.playerMode === 'pilot') {
        blips.push({ x: this.tankGroup.position.x, z: this.tankGroup.position.z, type: 'tank' });
      }
      for (const e of this.enemies) {
        blips.push({
          x: e.meshGroup.position.x,
          z: e.meshGroup.position.z,
          type: e.type === 'warlord' || e.type === 'titan' ? 'boss' : 'enemy',
        });
      }
      this.stats.radarBlips = blips;
    }

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
