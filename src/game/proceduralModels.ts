/**
 * Procedural 3D Models & PBR Materials
 * Assembles multi-part models (3-12 parts) using THREE.Group,
 * varied metalness/roughness, emissive accents, and soft contact shadows.
 */

import * as THREE from 'three';

export function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 60);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
  gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.3)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createGroundGridTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, 512, 512);

  ctx.fillStyle = '#38bdf8';
  ctx.globalAlpha = 0.25;
  ctx.fillRect(0, 0, 12, 12);
  ctx.fillRect(500, 0, 12, 12);
  ctx.fillRect(0, 500, 12, 12);
  ctx.fillRect(500, 500, 12, 12);

  ctx.strokeStyle = '#0284c7';
  ctx.globalAlpha = 0.12;
  ctx.beginPath();
  ctx.arc(256, 256, 120, 0, Math.PI * 2);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(32, 32);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createLargeDesertGroundTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // 1. Rich Desert sand base with subtle dunes
  ctx.fillStyle = '#784e2d';
  ctx.fillRect(0, 0, 1024, 1024);

  // Sand noise layers & ripple dune waves
  for (let y = 0; y < 1024; y += 4) {
    const wave = Math.sin(y * 0.04) * 0.08 + Math.cos(y * 0.015) * 0.04;
    ctx.fillStyle = wave > 0 ? 'rgba(176, 125, 79, 0.18)' : 'rgba(84, 53, 29, 0.15)';
    ctx.fillRect(0, y, 1024, 4);
  }

  // 2. Tactical highway / asphalt military road network cross
  ctx.fillStyle = '#1e2430'; // dark tactical tarmac
  ctx.fillRect(448, 0, 128, 1024); // North-South Main Military Highway
  ctx.fillRect(0, 448, 1024, 128); // East-West Lateral Route

  // Central Outpost Compound Foundation
  ctx.fillStyle = '#171c26';
  ctx.beginPath();
  ctx.arc(512, 512, 175, 0, Math.PI * 2);
  ctx.fill();

  // Perimeter Road Borders
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 3;
  ctx.strokeRect(448, 0, 128, 1024);
  ctx.strokeRect(0, 448, 1024, 128);

  // Yellow and White Tactical Road Markings
  ctx.strokeStyle = '#f59e0b'; // military yellow
  ctx.lineWidth = 4;
  ctx.setLineDash([20, 18]);

  // Center divider lines
  ctx.beginPath();
  ctx.moveTo(512, 0); ctx.lineTo(512, 1024);
  ctx.moveTo(0, 512); ctx.lineTo(1024, 512);
  ctx.stroke();

  // Chevrons & Landing Hub Pad
  ctx.setLineDash([]);
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(512, 512, 140, 0, Math.PI * 2);
  ctx.stroke();

  // Corner hazard stripes on intersection
  const drawStripes = (x: number, y: number, w: number, h: number) => {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.fillStyle = '#111827';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#eab308';
    for (let i = -h; i < w + h; i += 18) {
      ctx.beginPath();
      ctx.moveTo(x + i, y);
      ctx.lineTo(x + i + 8, y);
      ctx.lineTo(x + i - 8 + h, y + h);
      ctx.lineTo(x + i - 16 + h, y + h);
      ctx.fill();
    }
    ctx.restore();
  };

  drawStripes(452, 452, 48, 48);
  drawStripes(524, 452, 48, 48);
  drawStripes(452, 524, 48, 48);
  drawStripes(524, 524, 48, 48);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(12, 12);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

let cachedShadowTexture: THREE.CanvasTexture | null = null;
function getShadowTexture(): THREE.CanvasTexture {
  if (!cachedShadowTexture) {
    cachedShadowTexture = createContactShadowTexture();
  }
  return cachedShadowTexture;
}

export function createContactShadowMesh(radius: number): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(radius * 2, radius * 2);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({
    map: getShadowTexture(),
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = 0.02;
  return mesh;
}

export function createPlayerMech(): {
  group: THREE.Group;
  turretGroup: THREE.Group;
  leftBarrel: THREE.Mesh;
  rightBarrel: THREE.Mesh;
  exhaustGlowLeft: THREE.Mesh;
  exhaustGlowRight: THREE.Mesh;
} {
  const playerGroup = new THREE.Group();

  const hullMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    metalness: 0.85,
    roughness: 0.25,
  });

  const secondaryArmorMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.6,
    roughness: 0.5,
  });

  const barrelMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    metalness: 0.95,
    roughness: 0.15,
  });

  const canopyMat = new THREE.MeshPhysicalMaterial({
    color: 0x38bdf8,
    metalness: 0.1,
    roughness: 0.05,
    transmission: 0.6,
    transparent: true,
    opacity: 0.85,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
  });

  const glowCyanMat = new THREE.MeshBasicMaterial({
    color: 0x00f0ff,
  });

  const hullGeo = new THREE.CylinderGeometry(1.3, 1.6, 0.6, 6);
  hullGeo.rotateY(Math.PI / 6);
  const hull = new THREE.Mesh(hullGeo, hullMat);
  hull.position.y = 0.7;
  hull.castShadow = true;
  playerGroup.add(hull);

  const podGeo = new THREE.BoxGeometry(0.7, 0.45, 2.2);
  const leftPod = new THREE.Mesh(podGeo, secondaryArmorMat);
  leftPod.position.set(-1.45, 0.6, -0.2);
  leftPod.castShadow = true;
  playerGroup.add(leftPod);

  const rightPod = new THREE.Mesh(podGeo, secondaryArmorMat);
  rightPod.position.set(1.45, 0.6, -0.2);
  rightPod.castShadow = true;
  playerGroup.add(rightPod);

  const exhaustGeo = new THREE.CylinderGeometry(0.18, 0.25, 0.4, 8);
  exhaustGeo.rotateX(Math.PI / 2);
  const exhaustGlowLeft = new THREE.Mesh(exhaustGeo, glowCyanMat);
  exhaustGlowLeft.position.set(-1.45, 0.6, -1.35);
  playerGroup.add(exhaustGlowLeft);

  const exhaustGlowRight = new THREE.Mesh(exhaustGeo, glowCyanMat);
  exhaustGlowRight.position.set(1.45, 0.6, -1.35);
  playerGroup.add(exhaustGlowRight);

  const canopyGeo = new THREE.SphereGeometry(0.65, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  canopyGeo.scale(1.0, 0.7, 1.4);
  const canopy = new THREE.Mesh(canopyGeo, canopyMat);
  canopy.position.set(0, 1.0, 0.25);
  canopy.castShadow = true;
  playerGroup.add(canopy);

  const turretGroup = new THREE.Group();
  turretGroup.position.set(0, 1.05, 0);

  const turretMountGeo = new THREE.CylinderGeometry(0.55, 0.65, 0.35, 12);
  const turretMount = new THREE.Mesh(turretMountGeo, secondaryArmorMat);
  turretMount.castShadow = true;
  turretGroup.add(turretMount);

  const barrelGeo = new THREE.CylinderGeometry(0.09, 0.11, 1.9, 8);
  barrelGeo.rotateX(Math.PI / 2);

  const leftBarrel = new THREE.Mesh(barrelGeo, barrelMat);
  leftBarrel.position.set(-0.35, 0.1, 1.0);
  leftBarrel.castShadow = true;
  turretGroup.add(leftBarrel);

  const rightBarrel = new THREE.Mesh(barrelGeo, barrelMat);
  rightBarrel.position.set(0.35, 0.1, 1.0);
  rightBarrel.castShadow = true;
  turretGroup.add(rightBarrel);

  playerGroup.add(turretGroup);

  const shadow = createContactShadowMesh(2.2);
  playerGroup.add(shadow);

  return {
    group: playerGroup,
    turretGroup,
    leftBarrel,
    rightBarrel,
    exhaustGlowLeft,
    exhaustGlowRight,
  };
}

/**
 * Converted Enemy Models: Procedural Human Soldiers ("Men")
 * Three distinct infantry commando variants:
 * - 'commando': Assault rifleman in camo fatigues & tactical vest
 * - 'heavy': Heavy RPG rocket trooper with shoulder launcher & targeting laser
 * - 'warlord': Spec-Ops Commander with armor, energy shield halo, and twin blasters
 */
export function createEnemySoldierModel(variant: 'commando' | 'heavy' | 'warlord' = 'commando'): {
  group: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  turretGroup?: THREE.Group;
  telegraphLine?: THREE.Line;
  shieldRing?: THREE.Mesh;
} {
  const group = new THREE.Group();
  const scale = variant === 'warlord' ? 1.45 : variant === 'heavy' ? 1.15 : 1.0;

  // Materials based on soldier variant
  const suitColor = variant === 'warlord' ? 0x1e1b4b : variant === 'heavy' ? 0x1f2937 : 0x3f4f34;
  const armorColor = variant === 'warlord' ? 0x7f1d1d : variant === 'heavy' ? 0x374151 : 0x24301d;
  const visorColor = variant === 'warlord' ? 0xff0044 : variant === 'heavy' ? 0xf59e0b : 0xff2247;

  const suitMat = new THREE.MeshStandardMaterial({
    color: suitColor,
    metalness: 0.3,
    roughness: 0.7,
  });

  const armorMat = new THREE.MeshStandardMaterial({
    color: armorColor,
    metalness: 0.7,
    roughness: 0.35,
  });

  const darkAlloyMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    metalness: 0.9,
    roughness: 0.2,
  });

  const skinMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.1,
    roughness: 0.8,
  });

  const visorMat = new THREE.MeshBasicMaterial({
    color: visorColor,
  });

  // 1. Torso / Ballistic Plate Carrier Vest
  const torsoGeo = new THREE.BoxGeometry(0.58 * scale, 0.68 * scale, 0.38 * scale);
  const torso = new THREE.Mesh(torsoGeo, armorMat);
  torso.position.y = 1.08 * scale;
  torso.castShadow = true;
  group.add(torso);

  // Tactical Pouches / Webbing on chest
  const pouchGeo = new THREE.BoxGeometry(0.44 * scale, 0.22 * scale, 0.12 * scale);
  const pouch = new THREE.Mesh(pouchGeo, darkAlloyMat);
  pouch.position.set(0, 0.95 * scale, 0.22 * scale);
  group.add(pouch);

  // Field Backpack / Tactical Radio Pack
  const packGeo = new THREE.BoxGeometry(0.42 * scale, 0.5 * scale, 0.22 * scale);
  const pack = new THREE.Mesh(packGeo, suitMat);
  pack.position.set(0, 1.12 * scale, -0.26 * scale);
  pack.castShadow = true;
  group.add(pack);

  // Radio Antenna Whip
  const antGeo = new THREE.CylinderGeometry(0.02 * scale, 0.02 * scale, 0.9 * scale, 6);
  const antenna = new THREE.Mesh(antGeo, darkAlloyMat);
  antenna.position.set(0.16 * scale, 1.65 * scale, -0.32 * scale);
  antenna.rotation.z = -0.15;
  group.add(antenna);

  // 2. Head & Combat Helmet
  const headGeo = new THREE.SphereGeometry(0.25 * scale, 12, 10);
  headGeo.scale(1.0, 1.1, 1.05);
  const helmet = new THREE.Mesh(headGeo, armorMat);
  helmet.position.set(0, 1.6 * scale, 0);
  helmet.castShadow = true;
  group.add(helmet);

  // Night Vision Goggles / Targeting Visor
  const visorGeo = new THREE.BoxGeometry(0.32 * scale, 0.1 * scale, 0.14 * scale);
  const visor = new THREE.Mesh(visorGeo, visorMat);
  visor.position.set(0, 1.58 * scale, 0.2 * scale);
  group.add(visor);

  // 3. Articulated Legs for realistic walking/running
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.18 * scale, 0.74 * scale, 0);
  const legMesh1 = new THREE.Mesh(new THREE.BoxGeometry(0.2 * scale, 0.74 * scale, 0.22 * scale), suitMat);
  legMesh1.position.y = -0.37 * scale;
  legMesh1.castShadow = true;
  leftLeg.add(legMesh1);
  // Combat Boot
  const bootGeo = new THREE.BoxGeometry(0.22 * scale, 0.18 * scale, 0.32 * scale);
  const boot1 = new THREE.Mesh(bootGeo, darkAlloyMat);
  boot1.position.set(0, -0.66 * scale, 0.05 * scale);
  leftLeg.add(boot1);
  group.add(leftLeg);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.18 * scale, 0.74 * scale, 0);
  const legMesh2 = new THREE.Mesh(new THREE.BoxGeometry(0.2 * scale, 0.74 * scale, 0.22 * scale), suitMat);
  legMesh2.position.y = -0.37 * scale;
  legMesh2.castShadow = true;
  rightLeg.add(legMesh2);
  const boot2 = new THREE.Mesh(bootGeo, darkAlloyMat);
  boot2.position.set(0, -0.66 * scale, 0.05 * scale);
  rightLeg.add(boot2);
  group.add(rightLeg);

  // 4. Arms & Weapons Rig
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.4 * scale, 1.34 * scale, 0);
  const armMesh1 = new THREE.Mesh(new THREE.BoxGeometry(0.16 * scale, 0.6 * scale, 0.18 * scale), skinMat);
  armMesh1.position.y = -0.28 * scale;
  armMesh1.castShadow = true;
  leftArm.add(armMesh1);
  group.add(leftArm);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.4 * scale, 1.34 * scale, 0);
  const armMesh2 = new THREE.Mesh(new THREE.BoxGeometry(0.16 * scale, 0.6 * scale, 0.18 * scale), skinMat);
  armMesh2.position.y = -0.28 * scale;
  armMesh2.castShadow = true;
  rightArm.add(armMesh2);

  let telegraphLine: THREE.Line | undefined;
  let shieldRing: THREE.Mesh | undefined;

  // Specific weapon geometry held by arms
  if (variant === 'heavy') {
    // Shoulder-mounted Heavy RPG / Anti-Armor Rocket Tube
    const launcherGeo = new THREE.CylinderGeometry(0.16 * scale, 0.18 * scale, 1.8 * scale, 10);
    launcherGeo.rotateX(Math.PI / 2);
    const launcher = new THREE.Mesh(launcherGeo, darkAlloyMat);
    launcher.position.set(0, 0.1 * scale, 0.6 * scale);
    launcher.castShadow = true;
    rightArm.add(launcher);

    // Muzzle flange
    const flangeGeo = new THREE.CylinderGeometry(0.22 * scale, 0.22 * scale, 0.15 * scale, 10);
    flangeGeo.rotateX(Math.PI / 2);
    const flange = new THREE.Mesh(flangeGeo, armorMat);
    flange.position.set(0, 0.1 * scale, 1.5 * scale);
    rightArm.add(flange);

    // Aiming laser telegraph line
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.1 * scale, 1.5 * scale),
      new THREE.Vector3(0, 0.1 * scale, 35.0),
    ]);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xff0044,
      transparent: true,
      opacity: 0,
      linewidth: 2,
    });
    telegraphLine = new THREE.Line(lineGeo, lineMat);
    rightArm.add(telegraphLine);
  } else if (variant === 'warlord') {
    // Twin Heavy Energy Rifles
    const rifleGeo = new THREE.BoxGeometry(0.16 * scale, 0.22 * scale, 1.2 * scale);
    const rifle1 = new THREE.Mesh(rifleGeo, darkAlloyMat);
    rifle1.position.set(-0.1 * scale, -0.4 * scale, 0.5 * scale);
    rifle1.castShadow = true;
    leftArm.add(rifle1);

    const rifle2 = new THREE.Mesh(rifleGeo, darkAlloyMat);
    rifle2.position.set(0.1 * scale, -0.4 * scale, 0.5 * scale);
    rifle2.castShadow = true;
    rightArm.add(rifle2);

    // Holographic Energy Shield Ring
    const shieldGeo = new THREE.TorusGeometry(1.6 * scale, 0.08 * scale, 8, 32);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.65,
    });
    shieldRing = new THREE.Mesh(shieldGeo, shieldMat);
    shieldRing.position.y = 1.2 * scale;
    shieldRing.rotation.x = Math.PI / 2;
    group.add(shieldRing);
  } else {
    // Standard Commando Assault Rifle
    const rifleGeo = new THREE.BoxGeometry(0.12 * scale, 0.18 * scale, 0.95 * scale);
    const rifle = new THREE.Mesh(rifleGeo, darkAlloyMat);
    rifle.position.set(0, -0.42 * scale, 0.4 * scale);
    rifle.castShadow = true;
    rightArm.add(rifle);

    // Curved Banana Magazine
    const magGeo = new THREE.BoxGeometry(0.08 * scale, 0.24 * scale, 0.12 * scale);
    const mag = new THREE.Mesh(magGeo, armorMat);
    mag.position.set(0, -0.58 * scale, 0.35 * scale);
    rightArm.add(mag);
  }

  group.add(rightArm);

  const shadow = createContactShadowMesh(1.1 * scale);
  group.add(shadow);

  // Store limbs in userData for dynamic stride animation in GameEngine loop
  group.userData = {
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    walkTime: Math.random() * 10,
    isHumanSoldier: true,
    variant,
  };

  return {
    group,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    turretGroup: rightArm,
    telegraphLine,
    shieldRing,
  };
}

// Backwards compatibility wrappers - all converted to procedural human men!
export function createDroneModel(): {
  group: THREE.Group;
  rotorPylons: THREE.Group;
  eyeLens: THREE.Mesh;
} {
  const soldier = createEnemySoldierModel('commando');
  return {
    group: soldier.group,
    rotorPylons: soldier.leftArm,
    eyeLens: soldier.group.children[1] as THREE.Mesh,
  };
}

export function createWalkerModel(): {
  group: THREE.Group;
  turretGroup: THREE.Group;
  cannonBarrel: THREE.Mesh;
  telegraphLine: THREE.Line;
} {
  const soldier = createEnemySoldierModel('heavy');
  return {
    group: soldier.group,
    turretGroup: soldier.turretGroup || soldier.rightArm,
    cannonBarrel: soldier.rightArm.children[0] as THREE.Mesh,
    telegraphLine: soldier.telegraphLine || new THREE.Line(),
  };
}

export function createTitanBossModel(): {
  group: THREE.Group;
  turretGroup: THREE.Group;
  shieldRing: THREE.Mesh;
  reactorGlow: THREE.Mesh;
} {
  const soldier = createEnemySoldierModel('warlord');
  return {
    group: soldier.group,
    turretGroup: soldier.turretGroup || soldier.rightArm,
    shieldRing: soldier.shieldRing || new THREE.Mesh(),
    reactorGlow: soldier.group.children[1] as THREE.Mesh,
  };
}

/**
 * Military Outpost Watchtower with Searchlight for Large Map
 */
export function createWatchtower(): THREE.Group {
  const group = new THREE.Group();

  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.85,
    roughness: 0.3,
  });
  const platformMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.7,
    roughness: 0.5,
  });
  const lightGlowMat = new THREE.MeshBasicMaterial({
    color: 0xfde047,
  });

  // 4 Steel Strut Legs (10m high)
  const legGeo = new THREE.CylinderGeometry(0.14, 0.22, 10.0, 8);
  [-2.2, 2.2].forEach(x => {
    [-2.2, 2.2].forEach(z => {
      const leg = new THREE.Mesh(legGeo, steelMat);
      leg.position.set(x, 5.0, z);
      leg.castShadow = true;
      group.add(leg);
    });
  });

  // Cross Braces
  const braceGeo = new THREE.BoxGeometry(4.8, 0.12, 0.12);
  const b1 = new THREE.Mesh(braceGeo, steelMat);
  b1.position.set(0, 4.5, -2.2);
  group.add(b1);
  const b2 = new THREE.Mesh(braceGeo, steelMat);
  b2.position.set(0, 4.5, 2.2);
  group.add(b2);

  // Lookout Platform & Cabin
  const platGeo = new THREE.BoxGeometry(5.4, 0.4, 5.4);
  const plat = new THREE.Mesh(platGeo, platformMat);
  plat.position.y = 10.2;
  plat.castShadow = true;
  group.add(plat);

  const guardCabinGeo = new THREE.BoxGeometry(3.6, 2.6, 3.6);
  const guardCabin = new THREE.Mesh(guardCabinGeo, steelMat);
  guardCabin.position.y = 11.6;
  guardCabin.castShadow = true;
  group.add(guardCabin);

  // Searchlight Projector Lamp
  const lightGeo = new THREE.CylinderGeometry(0.4, 0.5, 0.6, 12);
  lightGeo.rotateX(Math.PI / 2);
  const searchlight = new THREE.Mesh(lightGeo, lightGlowMat);
  searchlight.position.set(0, 11.8, 2.2);
  searchlight.rotation.x = 0.4;
  group.add(searchlight);

  const shadow = createContactShadowMesh(5.2);
  group.add(shadow);

  return group;
}

/**
 * Welded Steel Anti-Tank Hedgehog Barrier
 */
export function createAntiTankHedgehog(): THREE.Group {
  const group = new THREE.Group();
  const beamMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    metalness: 0.9,
    roughness: 0.35,
  });

  const beamGeo = new THREE.BoxGeometry(0.35, 3.2, 0.35);

  const b1 = new THREE.Mesh(beamGeo, beamMat);
  b1.rotation.set(Math.PI / 4, 0, Math.PI / 4);
  b1.castShadow = true;
  group.add(b1);

  const b2 = new THREE.Mesh(beamGeo, beamMat);
  b2.rotation.set(-Math.PI / 4, 0, -Math.PI / 4);
  b2.castShadow = true;
  group.add(b2);

  const b3 = new THREE.Mesh(beamGeo, beamMat);
  b3.rotation.set(0, Math.PI / 4, Math.PI / 4);
  b3.castShadow = true;
  group.add(b3);

  group.position.y = 1.1;
  const shadow = createContactShadowMesh(2.2);
  group.add(shadow);

  return group;
}

/**
 * Military Logistics Ammo & Tech Supply Crate
 */
export function createSupplyCrate(): THREE.Group {
  const group = new THREE.Group();

  const crateMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.7,
    roughness: 0.4,
  });
  const bandMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    metalness: 0.8,
    roughness: 0.3,
  });

  const crateGeo = new THREE.BoxGeometry(2.2, 1.4, 1.6);
  const crate = new THREE.Mesh(crateGeo, crateMat);
  crate.position.y = 0.7;
  crate.castShadow = true;
  group.add(crate);

  const bandGeo = new THREE.BoxGeometry(2.24, 0.2, 1.64);
  const band = new THREE.Mesh(bandGeo, bandMat);
  band.position.y = 0.7;
  group.add(band);

  const shadow = createContactShadowMesh(2.0);
  group.add(shadow);

  return group;
}

/**
 * Fortified Sandbag Bunker / Revetment Nest
 */
export function createSandbagBunker(): THREE.Group {
  const group = new THREE.Group();

  const bagMat = new THREE.MeshStandardMaterial({
    color: 0x92400e,
    roughness: 0.9,
    metalness: 0.05,
  });

  const bagGeo = new THREE.BoxGeometry(1.6, 0.45, 0.75);

  // Curved 2-tier sandbag perimeter
  for (let tier = 0; tier < 3; tier++) {
    for (let i = -2; i <= 2; i++) {
      const bag = new THREE.Mesh(bagGeo, bagMat);
      const angle = (i / 4) * 0.7;
      bag.position.set(Math.sin(angle) * 3.5, 0.25 + tier * 0.42, Math.cos(angle) * 3.5);
      bag.rotation.y = angle;
      bag.castShadow = true;
      group.add(bag);
    }
  }

  const shadow = createContactShadowMesh(4.0);
  group.add(shadow);

  return group;
}

/**
 * Glowing Combat Scrap Alloy Pickups (Dropped when soldiers are defeated)
 */
export function createScrapCanister(): THREE.Group {
  const group = new THREE.Group();

  const caseMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.85,
    roughness: 0.3,
  });
  const glowAmberMat = new THREE.MeshBasicMaterial({
    color: 0xf59e0b,
  });

  const hexGeo = new THREE.CylinderGeometry(0.38, 0.45, 0.65, 6);
  const canister = new THREE.Mesh(hexGeo, caseMat);
  canister.position.y = 0.4;
  canister.castShadow = true;
  group.add(canister);

  const coreGeo = new THREE.BoxGeometry(0.42, 0.3, 0.42);
  const core = new THREE.Mesh(coreGeo, glowAmberMat);
  core.position.y = 0.4;
  group.add(core);

  const shadow = createContactShadowMesh(0.9);
  group.add(shadow);

  return group;
}

export function createCanyonRock(radius: number): THREE.Mesh {
  const geo = new THREE.DodecahedronGeometry(radius, 1);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i);
    const vy = pos.getY(i);
    const vz = pos.getZ(i);
    const noise = 1 + (Math.sin(vx * 3.5) * Math.cos(vz * 3.5)) * 0.2;
    pos.setXYZ(i, vx * noise, vy * Math.max(0.6, noise), vz * noise);
  }
  geo.computeVertexNormals();

  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.85,
    metalness: 0.1,
  });

  const rock = new THREE.Mesh(geo, rockMat);
  rock.castShadow = true;
  rock.receiveShadow = true;
  return rock;
}

export function createPowerMonolith(): THREE.Group {
  const group = new THREE.Group();

  const columnMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.9,
    roughness: 0.2,
  });

  const pylonGeo = new THREE.BoxGeometry(1.6, 6.0, 1.6);
  const pylon = new THREE.Mesh(pylonGeo, columnMat);
  pylon.position.y = 3.0;
  pylon.castShadow = true;
  pylon.receiveShadow = true;
  group.add(pylon);

  const energySlotGeo = new THREE.BoxGeometry(1.7, 1.2, 0.25);
  const glowMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const energySlot = new THREE.Mesh(energySlotGeo, glowMat);
  energySlot.position.set(0, 3.0, 0.8);
  group.add(energySlot);

  const shadow = createContactShadowMesh(2.5);
  group.add(shadow);

  return group;
}

/**
 * Human Soldier / Pilot on foot
 */
export function createPilotHumanModel(): {
  group: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  visor: THREE.Mesh;
} {
  const group = new THREE.Group();

  const armorMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    metalness: 0.8,
    roughness: 0.3,
  });
  const suitMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.4,
    roughness: 0.6,
  });
  const visorMat = new THREE.MeshBasicMaterial({
    color: 0x00f0ff,
  });
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.2,
    roughness: 0.7,
  });

  // Torso / Chest Armor
  const torsoGeo = new THREE.BoxGeometry(0.55, 0.65, 0.35);
  const torso = new THREE.Mesh(torsoGeo, armorMat);
  torso.position.y = 1.05;
  torso.castShadow = true;
  group.add(torso);

  // Backpack survival pack
  const packGeo = new THREE.BoxGeometry(0.4, 0.45, 0.2);
  const pack = new THREE.Mesh(packGeo, suitMat);
  pack.position.set(0, 1.1, -0.25);
  group.add(pack);

  // Head & Helmet
  const helmetGeo = new THREE.SphereGeometry(0.24, 12, 10);
  helmetGeo.scale(1, 1.1, 1.05);
  const helmet = new THREE.Mesh(helmetGeo, suitMat);
  helmet.position.set(0, 1.55, 0);
  helmet.castShadow = true;
  group.add(helmet);

  // Visor slit
  const visorGeo = new THREE.BoxGeometry(0.3, 0.1, 0.12);
  const visor = new THREE.Mesh(visorGeo, visorMat);
  visor.position.set(0, 1.54, 0.18);
  group.add(visor);

  // Left Leg (hinged at hip)
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.16, 0.72, 0);
  const legMesh1 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.72, 0.2), suitMat);
  legMesh1.position.y = -0.36;
  legMesh1.castShadow = true;
  leftLeg.add(legMesh1);
  group.add(leftLeg);

  // Right Leg (hinged at hip)
  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.16, 0.72, 0);
  const legMesh2 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.72, 0.2), suitMat);
  legMesh2.position.y = -0.36;
  legMesh2.castShadow = true;
  rightLeg.add(legMesh2);
  group.add(rightLeg);

  // Left Arm
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.38, 1.3, 0);
  const armMesh1 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.55, 0.16), skinMat);
  armMesh1.position.y = -0.25;
  armMesh1.castShadow = true;
  leftArm.add(armMesh1);
  group.add(leftArm);

  // Right Arm (holding sidearm pistol)
  const rightArm = new THREE.Group();
  rightArm.position.set(0.38, 1.3, 0);
  const armMesh2 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.55, 0.16), skinMat);
  armMesh2.position.y = -0.25;
  armMesh2.castShadow = true;
  rightArm.add(armMesh2);

  // Tactical Sidearm pistol
  const pistolGeo = new THREE.BoxGeometry(0.08, 0.12, 0.3);
  const pistol = new THREE.Mesh(pistolGeo, armorMat);
  pistol.position.set(0, -0.45, 0.12);
  rightArm.add(pistol);
  group.add(rightArm);

  const shadow = createContactShadowMesh(0.7);
  group.add(shadow);

  return { group, leftLeg, rightLeg, leftArm, rightArm, visor };
}

/**
 * Outpost House / Homestead Cabin
 */
export function createOutpostHouse(): {
  group: THREE.Group;
  antennaBeacon: THREE.Mesh;
} {
  const group = new THREE.Group();

  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.6,
    roughness: 0.5,
  });
  const roofMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.8,
    roughness: 0.3,
  });
  const windowMat = new THREE.MeshBasicMaterial({
    color: 0xfde047, // warm yellow homestead glow
  });
  const doorMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    metalness: 0.85,
    roughness: 0.2,
  });
  const hazardMat = new THREE.MeshStandardMaterial({
    color: 0xeab308,
    roughness: 0.4,
  });

  // Main Cabin Building
  const cabinGeo = new THREE.BoxGeometry(7.0, 3.4, 5.5);
  const cabin = new THREE.Mesh(cabinGeo, wallMat);
  cabin.position.y = 1.7;
  cabin.castShadow = true;
  cabin.receiveShadow = true;
  group.add(cabin);

  // Angled Industrial Roof
  const roofGeo = new THREE.BoxGeometry(7.6, 0.5, 6.2);
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = 3.65;
  roof.castShadow = true;
  group.add(roof);

  // Front Porch Door
  const doorGeo = new THREE.BoxGeometry(1.4, 2.2, 0.2);
  const door = new THREE.Mesh(doorGeo, doorMat);
  door.position.set(0, 1.1, 2.8);
  group.add(door);

  // Glowing Windows on Front
  const winGeo = new THREE.BoxGeometry(1.2, 1.0, 0.15);
  const leftWin = new THREE.Mesh(winGeo, windowMat);
  leftWin.position.set(-2.2, 1.8, 2.78);
  group.add(leftWin);

  const rightWin = new THREE.Mesh(winGeo, windowMat);
  rightWin.position.set(2.2, 1.8, 2.78);
  group.add(rightWin);

  // Communications Antenna Mast with blinking red beacon
  const mastGeo = new THREE.CylinderGeometry(0.08, 0.12, 3.8, 8);
  const mast = new THREE.Mesh(mastGeo, wallMat);
  mast.position.set(-2.5, 5.5, -1.8);
  group.add(mast);

  const beaconGeo = new THREE.SphereGeometry(0.2, 8, 8);
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });
  const antennaBeacon = new THREE.Mesh(beaconGeo, beaconMat);
  antennaBeacon.position.set(-2.5, 7.4, -1.8);
  group.add(antennaBeacon);

  // Radar Dish on Roof
  const dishGeo = new THREE.SphereGeometry(0.8, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  dishGeo.rotateX(-Math.PI / 4);
  const dish = new THREE.Mesh(dishGeo, wallMat);
  dish.position.set(2.2, 4.2, -1.2);
  dish.castShadow = true;
  group.add(dish);

  // Solar Power Cells on Roof
  const solarGeo = new THREE.BoxGeometry(2.4, 0.1, 3.6);
  const solarMat = new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.1, metalness: 0.9 });
  const solar = new THREE.Mesh(solarGeo, solarMat);
  solar.position.set(0, 3.95, -0.6);
  group.add(solar);

  // Perimeter Sandbags / Fortification
  const bagGeo = new THREE.BoxGeometry(3.0, 0.7, 0.8);
  const bag1 = new THREE.Mesh(bagGeo, hazardMat);
  bag1.position.set(-4.5, 0.35, 1.8);
  group.add(bag1);

  const bag2 = new THREE.Mesh(bagGeo, hazardMat);
  bag2.position.set(4.5, 0.35, 1.8);
  group.add(bag2);

  const shadow = createContactShadowMesh(6.0);
  group.add(shadow);

  return { group, antennaBeacon };
}

/**
 * Heavy Battle Tank / Tanker Mech ("her tank")
 */
export function createBattleTankModel(): {
  group: THREE.Group;
  turretGroup: THREE.Group;
  leftBarrel: THREE.Mesh;
  rightBarrel: THREE.Mesh;
  treadsLeft: THREE.Mesh;
  treadsRight: THREE.Mesh;
  hatchGlow: THREE.Mesh;
  dockRing: THREE.Mesh;
  extraArmorGroup?: THREE.Group;
  superBrakeL?: THREE.Mesh;
  superBrakeR?: THREE.Mesh;
  turboAfterburners?: THREE.Group;
} {
  const group = new THREE.Group();

  const tankArmorMat = new THREE.MeshStandardMaterial({
    color: 0x0f766e, // military forest/camo teal-olive
    metalness: 0.85,
    roughness: 0.3,
  });

  const heavyDarkMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.9,
    roughness: 0.2,
  });

  const treadMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.7,
    roughness: 0.6,
  });

  const barrelMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    metalness: 0.95,
    roughness: 0.15,
  });

  const neonCyanMat = new THREE.MeshBasicMaterial({
    color: 0x00f0ff,
  });

  // 1. Lower Tank Chassis / Armored Glacis
  const hullGeo = new THREE.BoxGeometry(3.8, 1.1, 5.4);
  const hull = new THREE.Mesh(hullGeo, tankArmorMat);
  hull.position.y = 1.0;
  hull.castShadow = true;
  group.add(hull);

  // Sloped Front Armor Glacis
  const glacisGeo = new THREE.CylinderGeometry(1.6, 2.2, 3.6, 4);
  glacisGeo.rotateZ(Math.PI / 2);
  const glacis = new THREE.Mesh(glacisGeo, tankArmorMat);
  glacis.position.set(0, 0.9, 2.4);
  glacis.scale.set(1.0, 0.5, 0.9);
  glacis.castShadow = true;
  group.add(glacis);

  // 2. Heavy Caterpillar Treads & Armored Skirts
  const treadGeo = new THREE.BoxGeometry(0.85, 0.95, 5.8);
  const treadsLeft = new THREE.Mesh(treadGeo, treadMat);
  treadsLeft.position.set(-2.0, 0.65, 0);
  treadsLeft.castShadow = true;
  group.add(treadsLeft);

  const treadsRight = new THREE.Mesh(treadGeo, treadMat);
  treadsRight.position.set(2.0, 0.65, 0);
  treadsRight.castShadow = true;
  group.add(treadsRight);

  // Tread armor skirts
  const skirtGeo = new THREE.BoxGeometry(0.12, 0.6, 5.2);
  const skirtLeft = new THREE.Mesh(skirtGeo, heavyDarkMat);
  skirtLeft.position.set(-2.45, 0.85, 0);
  group.add(skirtLeft);

  const skirtRight = new THREE.Mesh(skirtGeo, heavyDarkMat);
  skirtRight.position.set(2.45, 0.85, 0);
  group.add(skirtRight);

  // Dual Rear Exhaust Smokestacks
  const exhaustGeo = new THREE.CylinderGeometry(0.16, 0.22, 1.0, 8);
  [-0.9, 0.9].forEach(x => {
    const pipe = new THREE.Mesh(exhaustGeo, heavyDarkMat);
    pipe.position.set(x, 1.8, -2.4);
    pipe.castShadow = true;
    group.add(pipe);
  });

  // Front Projector Headlights
  const lightGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.2, 8);
  lightGeo.rotateX(Math.PI / 2);
  [-1.2, 1.2].forEach(x => {
    const light = new THREE.Mesh(lightGeo, neonCyanMat);
    light.position.set(x, 1.1, 2.65);
    group.add(light);
  });

  // 3. Rotating Heavy Turret Group
  const turretGroup = new THREE.Group();
  turretGroup.position.set(0, 1.55, 0);

  const turretBaseGeo = new THREE.BoxGeometry(2.6, 0.95, 3.4);
  const turretBase = new THREE.Mesh(turretBaseGeo, tankArmorMat);
  turretBase.position.y = 0.45;
  turretBase.castShadow = true;
  turretGroup.add(turretBase);

  // Commander Cupola & Hatch
  const cupolaGeo = new THREE.CylinderGeometry(0.55, 0.65, 0.4, 10);
  const cupola = new THREE.Mesh(cupolaGeo, heavyDarkMat);
  cupola.position.set(-0.55, 1.05, -0.4);
  cupola.castShadow = true;
  turretGroup.add(cupola);

  // Glowing Entry Hatch Ring
  const hatchGeo = new THREE.RingGeometry(0.3, 0.45, 16);
  hatchGeo.rotateX(-Math.PI / 2);
  const hatchGlow = new THREE.Mesh(hatchGeo, new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide }));
  hatchGlow.position.set(-0.55, 1.26, -0.4);
  turretGroup.add(hatchGlow);

  // 4. Massive Dual Smoothbore Cannon Barrels
  const barrelGeo = new THREE.CylinderGeometry(0.14, 0.17, 3.2, 10);
  barrelGeo.rotateX(Math.PI / 2);

  const leftBarrel = new THREE.Mesh(barrelGeo, barrelMat);
  leftBarrel.position.set(-0.5, 0.45, 2.4);
  leftBarrel.castShadow = true;
  turretGroup.add(leftBarrel);

  const rightBarrel = new THREE.Mesh(barrelGeo, barrelMat);
  rightBarrel.position.set(0.5, 0.45, 2.4);
  rightBarrel.castShadow = true;
  turretGroup.add(rightBarrel);

  // Heavy Muzzle Brakes at tips
  const brakeGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.5, 8);
  brakeGeo.rotateX(Math.PI / 2);
  const brakeL = new THREE.Mesh(brakeGeo, heavyDarkMat);
  brakeL.position.set(0, 0, 1.6);
  leftBarrel.add(brakeL);

  const brakeR = new THREE.Mesh(brakeGeo, heavyDarkMat);
  brakeR.position.set(0, 0, 1.6);
  rightBarrel.add(brakeR);

  // Upgrade Part 1: Heavy Applique Armor Plating & Skirts
  const extraArmorGroup = new THREE.Group();
  const sidePlateGeo = new THREE.BoxGeometry(0.2, 0.75, 4.8);
  const sidePlateL = new THREE.Mesh(sidePlateGeo, heavyDarkMat);
  sidePlateL.position.set(-2.55, 0.85, 0);
  extraArmorGroup.add(sidePlateL);

  const sidePlateR = new THREE.Mesh(sidePlateGeo, heavyDarkMat);
  sidePlateR.position.set(2.55, 0.85, 0);
  extraArmorGroup.add(sidePlateR);

  // Reinforced Front Wedge
  const frontPlateGeo = new THREE.BoxGeometry(3.2, 0.5, 0.25);
  const frontPlate = new THREE.Mesh(frontPlateGeo, heavyDarkMat);
  frontPlate.position.set(0, 0.85, 2.7);
  extraArmorGroup.add(frontPlate);
  extraArmorGroup.visible = false;
  group.add(extraArmorGroup);

  // Upgrade Part 2: Super Heavy Cannon Compensators
  const superBrakeGeo = new THREE.BoxGeometry(0.65, 0.65, 0.7);
  const superBrakeL = new THREE.Mesh(superBrakeGeo, tankArmorMat);
  superBrakeL.position.set(0, 0, 1.65);
  superBrakeL.visible = false;
  leftBarrel.add(superBrakeL);

  const superBrakeR = new THREE.Mesh(superBrakeGeo, tankArmorMat);
  superBrakeR.position.set(0, 0, 1.65);
  superBrakeR.visible = false;
  rightBarrel.add(superBrakeR);

  // Upgrade Part 3: Turbo Turbine Booster Afterburners
  const turboExhaustGeo = new THREE.CylinderGeometry(0.25, 0.35, 0.8, 8);
  turboExhaustGeo.rotateX(Math.PI / 2);
  const turboGlowMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
  const turboAfterburners = new THREE.Group();
  [-0.6, 0.6].forEach(x => {
    const pipe = new THREE.Mesh(turboExhaustGeo, turboGlowMat);
    pipe.position.set(x, 1.3, -2.75);
    turboAfterburners.add(pipe);
  });
  turboAfterburners.visible = false;
  group.add(turboAfterburners);

  group.add(turretGroup);

  // 5. Docking / Mounting Ring Beacon (flashes when waiting for pilot)
  const dockGeo = new THREE.RingGeometry(2.8, 3.4, 32);
  dockGeo.rotateX(-Math.PI / 2);
  const dockMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide,
  });
  const dockRing = new THREE.Mesh(dockGeo, dockMat);
  dockRing.position.y = 0.08;
  group.add(dockRing);

  const shadow = createContactShadowMesh(3.4);
  group.add(shadow);

  return {
    group,
    turretGroup,
    leftBarrel,
    rightBarrel,
    treadsLeft,
    treadsRight,
    hatchGlow,
    dockRing,
    extraArmorGroup,
    superBrakeL,
    superBrakeR,
    turboAfterburners,
  };
}

