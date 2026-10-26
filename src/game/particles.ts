/**
 * Pooled Particle System
 * Pre-allocated BufferGeometry points for sparks, plasma hits, thruster plumes,
 * and explosion debris with zero per-frame garbage collection.
 */

import * as THREE from 'three';

const MAX_PARTICLES = 1200;

export class ParticleSystem {
  public points: THREE.Points;
  private geometry: THREE.BufferGeometry;
  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;
  private velocities: Float32Array;
  private lifetimes: Float32Array;
  private maxLifetimes: Float32Array;
  private activeCount: number = 0;

  constructor() {
    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(MAX_PARTICLES * 3);
    this.colors = new Float32Array(MAX_PARTICLES * 3);
    this.sizes = new Float32Array(MAX_PARTICLES);
    this.velocities = new Float32Array(MAX_PARTICLES * 3);
    this.lifetimes = new Float32Array(MAX_PARTICLES);
    this.maxLifetimes = new Float32Array(MAX_PARTICLES);

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

    // Create soft particle disc texture
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.3, 'rgba(255,255,255,0.8)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 0.8,
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true,
    });

    this.points = new THREE.Points(this.geometry, material);
    this.points.frustumCulled = false;
  }

  public emit(
    origin: THREE.Vector3,
    count: number,
    colorHex: number,
    baseSpeed: number = 8,
    lifetime: number = 0.5,
    size: number = 0.6
  ) {
    const color = new THREE.Color(colorHex);

    for (let i = 0; i < count; i++) {
      if (this.activeCount >= MAX_PARTICLES) {
        // Recycle oldest particle slot
        this.activeCount = 0;
      }

      const idx = this.activeCount;
      const i3 = idx * 3;

      // Position
      this.positions[i3] = origin.x + (Math.random() - 0.5) * 0.4;
      this.positions[i3 + 1] = Math.max(0.1, origin.y + (Math.random() - 0.5) * 0.3);
      this.positions[i3 + 2] = origin.z + (Math.random() - 0.5) * 0.4;

      // Velocity (Spherical distribution with upward bias)
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = baseSpeed * (0.6 + Math.random() * 0.8);

      this.velocities[i3] = Math.sin(phi) * Math.cos(theta) * speed;
      this.velocities[i3 + 1] = Math.abs(Math.cos(phi)) * speed * 0.8 + 1.5;
      this.velocities[i3 + 2] = Math.sin(phi) * Math.sin(theta) * speed;

      // Color
      this.colors[i3] = color.r;
      this.colors[i3 + 1] = color.g;
      this.colors[i3 + 2] = color.b;

      // Lifetime & size
      this.lifetimes[idx] = lifetime * (0.8 + Math.random() * 0.4);
      this.maxLifetimes[idx] = this.lifetimes[idx];
      this.sizes[idx] = size * (0.7 + Math.random() * 0.6);

      this.activeCount++;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;
  }

  public update(dt: number) {
    let active = 0;

    for (let i = 0; i < MAX_PARTICLES; i++) {
      if (this.lifetimes[i] > 0) {
        this.lifetimes[i] -= dt;
        const i3 = i * 3;

        // Apply drag and gravity
        this.velocities[i3 + 1] -= 9.8 * dt; // gravity
        this.velocities[i3] *= 0.96; // drag
        this.velocities[i3 + 2] *= 0.96;

        this.positions[i3] += this.velocities[i3] * dt;
        this.positions[i3 + 1] = Math.max(0.05, this.positions[i3 + 1] + this.velocities[i3 + 1] * dt);
        this.positions[i3 + 2] += this.velocities[i3 + 2] * dt;

        // Fade size with life
        const progress = 1 - this.lifetimes[i] / this.maxLifetimes[i];
        this.sizes[i] = Math.max(0, (1 - progress) * 0.7);

        active++;
      } else {
        // Move dormant particles out of view
        const i3 = i * 3;
        this.positions[i3 + 1] = -999;
        this.sizes[i] = 0;
      }
    }

    if (active > 0) {
      this.geometry.attributes.position.needsUpdate = true;
      this.geometry.attributes.size.needsUpdate = true;
    }
  }

  public dispose() {
    this.geometry.dispose();
    (this.points.material as THREE.Material).dispose();
  }
}
