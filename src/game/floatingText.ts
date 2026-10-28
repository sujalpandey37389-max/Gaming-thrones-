/**
 * Floating Combat Text (FCT) Particle System
 * Spawns 3D billboarded numbers above enemies taking damage and player health increases.
 * - Enemy Damage: Vivid Red (#ff2247)
 * - Critical Hits: Blazing Neon Gold (#ffd700) with "CRIT! [damage]"
 * - Health Increases: Brilliant Emerald Green (#22c55e) with "+[amount] HP"
 * - Shield Increases: Luminous Cyan (#00f0ff) with "+[amount] SHIELD"
 */

import * as THREE from 'three';

export type FloatingTextType = 'damage' | 'crit' | 'heal' | 'shield' | 'scrap';

export interface FloatingTextItem {
  sprite: THREE.Sprite;
  material: THREE.SpriteMaterial;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  lifetime: number;
  maxLifetime: number;
  baseScale: number;
  type: FloatingTextType;
  active: boolean;
}

const POOL_SIZE = 50;

export class FloatingTextSystem {
  private scene: THREE.Scene;
  private pool: FloatingTextItem[] = [];
  private textureCache: Map<string, THREE.CanvasTexture> = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.initPool();
  }

  private getOrCreateTexture(text: string, type: FloatingTextType): THREE.CanvasTexture {
    const key = `${text}_${type}`;
    const cached = this.textureCache.get(key);
    if (cached) return cached;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const isCrit = type === 'crit';
    const isHeal = type === 'heal';
    const isShield = type === 'shield';
    const isScrap = type === 'scrap';

    const fontSize = isCrit ? 64 : (isHeal || isShield ? 50 : isScrap ? 48 : 54);
    ctx.font = `900 ${fontSize}px "Courier New", monospace, system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;

    if (isCrit) {
      // Critical hit: Blazing Neon Gold / Solar Amber with thick border
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 18;
      ctx.strokeStyle = '#2b1a00';
      ctx.lineWidth = 10;
      ctx.strokeText(text, cx, cy);

      const grad = ctx.createLinearGradient(0, cy - 25, 0, cy + 25);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, '#ffea00');
      grad.addColorStop(0.7, '#f59e0b');
      grad.addColorStop(1, '#d97706');

      ctx.fillStyle = grad;
      ctx.fillText(text, cx, cy);

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(text, cx, cy - 1);
    } else if (isScrap) {
      // Scrap Metal Picked Up: Cyberpunk Warm Amber / Orange Tech
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 15;
      ctx.strokeStyle = '#291400';
      ctx.lineWidth = 9;
      ctx.strokeText(text, cx, cy);

      const grad = ctx.createLinearGradient(0, cy - 20, 0, cy + 20);
      grad.addColorStop(0, '#fef3c7');
      grad.addColorStop(0.4, '#fbbf24');
      grad.addColorStop(1, '#d97706');

      ctx.fillStyle = grad;
      ctx.fillText(text, cx, cy);

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(text, cx, cy - 1);
    } else if (isHeal) {
      // Health increase: Glowing Emerald Green
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 14;
      ctx.strokeStyle = '#022c1b';
      ctx.lineWidth = 9;
      ctx.strokeText(text, cx, cy);

      const grad = ctx.createLinearGradient(0, cy - 20, 0, cy + 20);
      grad.addColorStop(0, '#ecfdf5');
      grad.addColorStop(0.4, '#34d399');
      grad.addColorStop(1, '#059669');

      ctx.fillStyle = grad;
      ctx.fillText(text, cx, cy);

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(text, cx, cy - 1);
    } else if (isShield) {
      // Shield increase: Luminous Cyan
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 14;
      ctx.strokeStyle = '#032030';
      ctx.lineWidth = 9;
      ctx.strokeText(text, cx, cy);

      const grad = ctx.createLinearGradient(0, cy - 20, 0, cy + 20);
      grad.addColorStop(0, '#e0f2fe');
      grad.addColorStop(0.4, '#38bdf8');
      grad.addColorStop(1, '#0284c7');

      ctx.fillStyle = grad;
      ctx.fillText(text, cx, cy);

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(text, cx, cy - 1);
    } else {
      // Standard Damage: Vivid Red (#ff2247)
      ctx.shadowColor = '#ff0033';
      ctx.shadowBlur = 14;
      ctx.strokeStyle = '#29000a';
      ctx.lineWidth = 9;
      ctx.strokeText(text, cx, cy);

      const grad = ctx.createLinearGradient(0, cy - 20, 0, cy + 20);
      grad.addColorStop(0, '#fee2e2');
      grad.addColorStop(0.3, '#f87171');
      grad.addColorStop(0.8, '#ef4444');
      grad.addColorStop(1, '#b91c1c');

      ctx.fillStyle = grad;
      ctx.fillText(text, cx, cy);

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(text, cx, cy - 1);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    // Limit cache size to avoid unbounded memory growth
    if (this.textureCache.size > 90) {
      const firstKey = this.textureCache.keys().next().value;
      if (firstKey) {
        const oldTex = this.textureCache.get(firstKey);
        oldTex?.dispose();
        this.textureCache.delete(firstKey);
      }
    }

    this.textureCache.set(key, texture);
    return texture;
  }

  private initPool() {
    for (let i = 0; i < POOL_SIZE; i++) {
      const material = new THREE.SpriteMaterial({
        transparent: true,
        opacity: 0,
        depthWrite: false,
        depthTest: false,
      });

      const sprite = new THREE.Sprite(material);
      sprite.visible = false;
      sprite.frustumCulled = false;
      this.scene.add(sprite);

      this.pool.push({
        sprite,
        material,
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        lifetime: 0,
        maxLifetime: 0.85,
        baseScale: 1.0,
        type: 'damage',
        active: false,
      });
    }
  }

  private getAvailableItem(): FloatingTextItem {
    let item = this.pool.find(p => !p.active);
    if (!item) {
      item = this.pool[0];
      let minLife = item.lifetime;
      for (let i = 1; i < this.pool.length; i++) {
        if (this.pool[i].lifetime < minLife) {
          minLife = this.pool[i].lifetime;
          item = this.pool[i];
        }
      }
    }
    return item;
  }

  public spawnDamage(enemyPos: THREE.Vector3, damage: number, isCrit: boolean = false) {
    const item = this.getAvailableItem();
    const type: FloatingTextType = isCrit ? 'crit' : 'damage';
    const displayText = isCrit ? `CRIT! ${Math.round(damage)}` : `${Math.round(damage)}`;
    const texture = this.getOrCreateTexture(displayText, type);

    item.material.map = texture;
    item.material.opacity = 1.0;
    item.material.needsUpdate = true;

    // Spawn above enemy head with minor random scatter
    const offsetX = (Math.random() - 0.5) * 0.8;
    const offsetZ = (Math.random() - 0.5) * 0.8;
    const offsetY = isCrit ? 2.6 + Math.random() * 0.4 : 1.9 + Math.random() * 0.35;

    item.position.set(enemyPos.x + offsetX, enemyPos.y + offsetY, enemyPos.z + offsetZ);
    item.sprite.position.copy(item.position);

    const driftX = (Math.random() - 0.5) * 1.6;
    const driftY = isCrit ? 4.2 : 3.3;
    const driftZ = (Math.random() - 0.5) * 1.6;
    item.velocity.set(driftX, driftY, driftZ);

    item.maxLifetime = isCrit ? 1.05 : 0.82;
    item.lifetime = item.maxLifetime;
    item.type = type;
    item.baseScale = isCrit ? 3.4 : 2.4;
    item.active = true;

    // Elastic pop on spawn
    const initScale = item.baseScale * (isCrit ? 1.55 : 1.35);
    item.sprite.scale.set(initScale, initScale * 0.5, 1);
    item.sprite.visible = true;
  }

  public spawnCrit(enemyPos: THREE.Vector3, damage: number) {
    this.spawnDamage(enemyPos, damage, true);
  }

  public spawnHeal(playerPos: THREE.Vector3, amount: number) {
    const item = this.getAvailableItem();
    const displayText = `+${Math.round(amount)} HP`;
    const texture = this.getOrCreateTexture(displayText, 'heal');

    item.material.map = texture;
    item.material.opacity = 1.0;
    item.material.needsUpdate = true;

    const offsetX = (Math.random() - 0.5) * 0.6;
    const offsetZ = (Math.random() - 0.5) * 0.6;
    const offsetY = 2.2 + Math.random() * 0.3;

    item.position.set(playerPos.x + offsetX, playerPos.y + offsetY, playerPos.z + offsetZ);
    item.sprite.position.copy(item.position);

    item.velocity.set((Math.random() - 0.5) * 0.8, 3.6, (Math.random() - 0.5) * 0.8);
    item.maxLifetime = 0.95;
    item.lifetime = item.maxLifetime;
    item.type = 'heal';
    item.baseScale = 2.6;
    item.active = true;

    const initScale = item.baseScale * 1.4;
    item.sprite.scale.set(initScale, initScale * 0.5, 1);
    item.sprite.visible = true;
  }

  public spawnShield(playerPos: THREE.Vector3, amount: number) {
    const item = this.getAvailableItem();
    const displayText = `+${Math.round(amount)} SHIELD`;
    const texture = this.getOrCreateTexture(displayText, 'shield');

    item.material.map = texture;
    item.material.opacity = 1.0;
    item.material.needsUpdate = true;

    const offsetX = (Math.random() - 0.5) * 0.6;
    const offsetZ = (Math.random() - 0.5) * 0.6;
    const offsetY = 2.6 + Math.random() * 0.3;

    item.position.set(playerPos.x + offsetX, playerPos.y + offsetY, playerPos.z + offsetZ);
    item.sprite.position.copy(item.position);

    item.velocity.set((Math.random() - 0.5) * 0.8, 3.4, (Math.random() - 0.5) * 0.8);
    item.maxLifetime = 0.95;
    item.lifetime = item.maxLifetime;
    item.type = 'shield';
    item.baseScale = 2.5;
    item.active = true;

    const initScale = item.baseScale * 1.35;
    item.sprite.scale.set(initScale, initScale * 0.5, 1);
    item.sprite.visible = true;
  }

  public spawnScrap(pos: THREE.Vector3, amount: number) {
    const item = this.getAvailableItem();
    const displayText = `+${Math.round(amount)} SCRAP`;
    const texture = this.getOrCreateTexture(displayText, 'scrap');

    item.material.map = texture;
    item.material.opacity = 1.0;
    item.material.needsUpdate = true;

    const offsetX = (Math.random() - 0.5) * 0.6;
    const offsetZ = (Math.random() - 0.5) * 0.6;
    const offsetY = 2.2 + Math.random() * 0.3;

    item.position.set(pos.x + offsetX, pos.y + offsetY, pos.z + offsetZ);
    item.sprite.position.copy(item.position);

    item.velocity.set((Math.random() - 0.5) * 0.8, 3.8, (Math.random() - 0.5) * 0.8);
    item.maxLifetime = 1.0;
    item.lifetime = item.maxLifetime;
    item.type = 'scrap';
    item.baseScale = 2.7;
    item.active = true;

    const initScale = item.baseScale * 1.4;
    item.sprite.scale.set(initScale, initScale * 0.5, 1);
    item.sprite.visible = true;
  }

  public update(dt: number) {
    for (let i = 0; i < this.pool.length; i++) {
      const item = this.pool[i];
      if (!item.active) continue;

      item.lifetime -= dt;

      if (item.lifetime <= 0) {
        item.active = false;
        item.sprite.visible = false;
        continue;
      }

      // Physics: smooth upward float with deceleration
      item.velocity.y *= Math.exp(-2.2 * dt);
      item.velocity.x *= Math.exp(-1.5 * dt);
      item.velocity.z *= Math.exp(-1.5 * dt);

      item.position.addScaledVector(item.velocity, dt);
      item.sprite.position.copy(item.position);

      const progress = 1 - item.lifetime / item.maxLifetime;

      // Elastic pop animation
      let scaleMult = 1.0;
      if (progress < 0.15) {
        scaleMult = 1.0 + (1 - progress / 0.15) * 0.45;
      } else {
        scaleMult = 1.0 - (progress - 0.15) * 0.15;
      }

      const currentScale = item.baseScale * scaleMult;
      item.sprite.scale.set(currentScale, currentScale * 0.5, 1);

      // Fade out smoothly over last 40% of duration
      if (progress > 0.6) {
        const fadeProgress = (progress - 0.6) / 0.4;
        item.material.opacity = Math.max(0, 1 - fadeProgress);
      } else {
        item.material.opacity = 1.0;
      }
    }
  }

  public clear() {
    for (let i = 0; i < this.pool.length; i++) {
      this.pool[i].active = false;
      this.pool[i].sprite.visible = false;
    }
  }

  public dispose() {
    this.clear();
    for (let i = 0; i < this.pool.length; i++) {
      this.scene.remove(this.pool[i].sprite);
      this.pool[i].material.dispose();
    }
    this.pool = [];

    this.textureCache.forEach(tex => tex.dispose());
    this.textureCache.clear();
  }
}
