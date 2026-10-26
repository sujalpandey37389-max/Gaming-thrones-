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

export function createDroneModel(): {
  group: THREE.Group;
  rotorPylons: THREE.Group;
  eyeLens: THREE.Mesh;
} {
  const group = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.8,
    roughness: 0.3,
  });

  const wingMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    metalness: 0.7,
    roughness: 0.4,
  });

  const eyeMat = new THREE.MeshBasicMaterial({
    color: 0xff0055,
  });

  const coreGeo = new THREE.DodecahedronGeometry(0.7);
  const core = new THREE.Mesh(coreGeo, bodyMat);
  core.position.y = 1.3;
  core.castShadow = true;
  group.add(core);

  const eyeGeo = new THREE.SphereGeometry(0.32, 12, 12);
  const eyeLens = new THREE.Mesh(eyeGeo, eyeMat);
  eyeLens.position.set(0, 1.3, 0.55);
  group.add(eyeLens);

  const rotorPylons = new THREE.Group();
  rotorPylons.position.y = 1.3;

  const armGeo = new THREE.BoxGeometry(2.4, 0.12, 0.25);
  const arm1 = new THREE.Mesh(armGeo, wingMat);
  const arm2 = new THREE.Mesh(armGeo, wingMat);
  arm2.rotation.y = Math.PI / 2;
  rotorPylons.add(arm1);
  rotorPylons.add(arm2);

  const thrusterGeo = new THREE.CylinderGeometry(0.2, 0.24, 0.3, 8);
  [-1.1, 1.1].forEach(x => {
    [-1.1, 1.1].forEach(z => {
      const ring = new THREE.Mesh(thrusterGeo, bodyMat);
      ring.position.set(x, 0, z);
      ring.castShadow = true;
      rotorPylons.add(ring);
    });
  });

  group.add(rotorPylons);

  const shadow = createContactShadowMesh(1.4);
  group.add(shadow);

  return { group, rotorPylons, eyeLens };
}

export function createWalkerModel(): {
  group: THREE.Group;
  turretGroup: THREE.Group;
  cannonBarrel: THREE.Mesh;
  telegraphLine: THREE.Line;
} {
  const group = new THREE.Group();

  const heavyArmorMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    metalness: 0.7,
    roughness: 0.4,
  });

  const legMat = new THREE.MeshStandardMaterial({
    color: 0x1f2937,
    metalness: 0.9,
    roughness: 0.2,
  });

  const cannonMat = new THREE.MeshStandardMaterial({
    color: 0x374151,
    metalness: 0.95,
    roughness: 0.15,
  });

  const baseGeo = new THREE.CylinderGeometry(1.4, 1.8, 0.8, 6);
  const base = new THREE.Mesh(baseGeo, heavyArmorMat);
  base.position.y = 1.6;
  base.castShadow = true;
  group.add(base);

  const legGeo = new THREE.CylinderGeometry(0.18, 0.25, 2.0, 6);
  legGeo.rotateZ(Math.PI / 6);
  const legPositions = [
    { x: -1.3, z: -1.3, rotY: Math.PI / 4 },
    { x: 1.3, z: -1.3, rotY: -Math.PI / 4 },
    { x: -1.3, z: 1.3, rotY: (3 * Math.PI) / 4 },
    { x: 1.3, z: 1.3, rotY: -(3 * Math.PI) / 4 },
  ];

  legPositions.forEach(p => {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(p.x, 0.9, p.z);
    leg.rotation.y = p.rotY;
    leg.castShadow = true;
    group.add(leg);
  });

  const turretGroup = new THREE.Group();
  turretGroup.position.set(0, 2.1, 0);

  const turretCabinGeo = new THREE.BoxGeometry(1.6, 1.0, 2.2);
  const turretCabin = new THREE.Mesh(turretCabinGeo, heavyArmorMat);
  turretCabin.castShadow = true;
  turretGroup.add(turretCabin);

  const barrelGeo = new THREE.CylinderGeometry(0.3, 0.38, 3.2, 12);
  barrelGeo.rotateX(Math.PI / 2);
  const cannonBarrel = new THREE.Mesh(barrelGeo, cannonMat);
  cannonBarrel.position.set(0, 0.2, 1.8);
  cannonBarrel.castShadow = true;
  turretGroup.add(cannonBarrel);

  const lineGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0.2, 3.2),
    new THREE.Vector3(0, 0.2, 35.0),
  ]);
  const lineMat = new THREE.LineBasicMaterial({
    color: 0xff0044,
    transparent: true,
    opacity: 0,
    linewidth: 2,
  });
  const telegraphLine = new THREE.Line(lineGeo, lineMat);
  turretGroup.add(telegraphLine);

  group.add(turretGroup);

  const shadow = createContactShadowMesh(2.8);
  group.add(shadow);

  return { group, turretGroup, cannonBarrel, telegraphLine };
}

export function createTitanBossModel(): {
  group: THREE.Group;
  turretGroup: THREE.Group;
  shieldRing: THREE.Mesh;
  reactorGlow: THREE.Mesh;
} {
  const group = new THREE.Group();

  const titanArmorMat = new THREE.MeshStandardMaterial({
    color: 0x7f1d1d,
    metalness: 0.85,
    roughness: 0.3,
  });

  const darkAlloyMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    metalness: 0.9,
    roughness: 0.2,
  });

  const reactorMat = new THREE.MeshBasicMaterial({
    color: 0xff4400,
  });

  const shieldMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    wireframe: true,
    transparent: true,
    opacity: 0.65,
  });

  const baseGeo = new THREE.CylinderGeometry(3.2, 3.8, 1.8, 8);
  const base = new THREE.Mesh(baseGeo, darkAlloyMat);
  base.position.y = 2.2;
  base.castShadow = true;
  group.add(base);

  const turretGroup = new THREE.Group();
  turretGroup.position.set(0, 3.4, 0);

  const turretHullGeo = new THREE.BoxGeometry(4.2, 2.0, 5.0);
  const turretHull = new THREE.Mesh(turretHullGeo, titanArmorMat);
  turretHull.castShadow = true;
  turretGroup.add(turretHull);

  const reactorGeo = new THREE.SphereGeometry(1.1, 16, 16);
  const reactorGlow = new THREE.Mesh(reactorGeo, reactorMat);
  reactorGlow.position.set(0, 0.4, 0);
  turretGroup.add(reactorGlow);

  const railgunGeo = new THREE.BoxGeometry(0.65, 0.65, 4.8);
  const leftRailgun = new THREE.Mesh(railgunGeo, darkAlloyMat);
  leftRailgun.position.set(-1.8, 0.2, 2.8);
  leftRailgun.castShadow = true;
  turretGroup.add(leftRailgun);

  const rightRailgun = new THREE.Mesh(railgunGeo, darkAlloyMat);
  rightRailgun.position.set(1.8, 0.2, 2.8);
  rightRailgun.castShadow = true;
  turretGroup.add(rightRailgun);

  group.add(turretGroup);

  const ringGeo = new THREE.TorusGeometry(4.8, 0.15, 8, 32);
  const shieldRing = new THREE.Mesh(ringGeo, shieldMat);
  shieldRing.position.y = 3.6;
  shieldRing.rotation.x = Math.PI / 2;
  group.add(shieldRing);

  const shadow = createContactShadowMesh(5.5);
  group.add(shadow);

  return { group, turretGroup, shieldRing, reactorGlow };
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
