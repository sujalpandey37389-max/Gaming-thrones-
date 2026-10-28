# Implementation Plan: Pilot Homestead Defense, Tank Boarding, 360° Aim & Landscape Mode

Implement the requested features: the pilot-to-tank homestead survival storyline ("man is living in a house, enemy attacks house, man drives tank to kill enemy"), 200 HP health with red damage numbering & green heal effects, 360-degree aiming rotation, Android mobile touch controls, and strict horizontal landscape mode enforcement.

---

## 1. Homestead House & Tank Docking Architecture
- **Homestead Base House**:
  - Spawn the procedural outpost house (`createOutpostHouse()`) at arena coordinate `(0, 0, -8)` with solar roof, blast door, fortified foundation, and flashing comms antenna.
  - Give the house an independent integrity pool of 500 HP (`maxHouseHp: 500, houseHp: 500`).
  - Add smoke, sparks, and damage warning states to the house when attacked.
- **Pilot ("Man") vs. Tank Lifecycle**:
  - Player starts in `pilot` mode at `(0, 0, 0)` just outside the homestead entrance.
  - Pilot model (`createPilotHumanModel()`) features running leg animations, swinging arms, cyan visor helmet, and kinetic sidearm pistol.
  - Parked at the adjacent docking ring `(8, 0, 2)` is the Heavy Battle Tank (`createBattleTankModel()`) with animated pulsing boarding ring and glowing hatch.
  - When the pilot steps into the boarding ring (radius ~3.5m), the HUD and Mobile UI display the **"ENTER TANK"** action prompt.
  - Pressing `[E]` or tapping **"ENTER TANK"** triggers:
    1. Mechanical hatch sound (`soundEngine.playTankMount()`).
    2. Seamless switch from `pilot` mode to `tank` mode.
    3. Pilot meshes disappear into the tank cupola; tank twin cannon turret activates with full 360° aiming.
    4. Enhanced armor and dual weapon systems (Plasma Repeater & Burst Rifle).
    5. Pressing `[E]` or tapping **"EXIT TANK"** allows tactical dismount back to pilot mode if desired.
- **Enemy AI ("Slowly Slowly Come to Enemy & Survive")**:
  - Enemies spawn progressively at arena perimeter and advance steadily towards the homestead house and player.
  - If player is far from house, nearby enemies focus on the player; if player retreats or enemies reach the base, they bombard the homestead house.
  - If homestead house reaches 0 HP, game over occurs ("HOMESTEAD DESTROYED - DEFENSE FAILED").

---

## 2. 200 HP Health & Floating Damage Text System
- **Player Stats**:
  - Base health: 200 HP (`MAX_HEALTH = 200`).
  - Base shield: 100 Shield (`MAX_SHIELD = 100`).
- **Floating Combat Text**:
  - **Enemy Damage**: Vivid Red (`#ff2247`) numbers floating and drifting upward with physical gravity and pop scale.
  - **Critical Hits**: Blazing Gold (`#ffd700`) with `"CRIT! [damage]"`.
  - **Health Pickups & Regeneration**: Emerald Green (`#22c55e`) with `"+25 HP"` or `"+50 HP"`.
  - **Shield Absorption**: Radiant Cyan (`#00f0ff`) with `"+SHIELD"`.
  - Billboards rotate to always face the camera with crisp Canvas 2D mipmapped textures.

---

## 3. 360-Degree Aiming & Rotation
- **Desktop (Mouse)**:
  - Raycasts from mouse onto ground plane (`y = 0`) to compute 360° angle `Math.atan2(dx, dz)`.
  - In `pilot` mode: pilot body and arms rotate 360° to aim pistol toward crosshair.
  - In `tank` mode: tank chassis rotates towards movement vector, while the heavy turret independently rotates 360° towards mouse crosshair.
- **Mobile (Touch Screen Aim & Aim Stick)**:
  - **Dual-Stick Mode**: Dedicated right-hand 360° Virtual Aim Stick. Dragging the stick in any direction aims the turret/pilot 360° in real-time.
  - **Screen Scrolling / Drag-to-Aim**: Dragging anywhere on the right half of the screen dynamically rotates aim 360° across the arena.
  - Turret lerps smoothly towards target aim angle without clamping.

---

## 4. Android Mobile Controls & Landscape-Only Mode
- **Horizontal Landscape Mode Enforcer (`LandscapeEnforcer.tsx`)**:
  - Detects orientation using `window.matchMedia('(orientation: portrait)')` and aspect ratio checks.
  - When in portrait orientation on mobile or tablet:
    - Displays a backdrop with an animated rotating smartphone graphic and instruction: *"PLEASE ROTATE YOUR DEVICE — STEEL HORIZON IS DESIGNED FOR HORIZONTAL LANDSCAPE PLAY"*.
    - Prevents portrait gameplay interaction until device is rotated sideways.
    - Also requests fullscreen/landscape orientation when supported.
- **Mobile Controls Overlay (`MobileControlsOverlay.tsx`)**:
  - **Left Side**: Dynamic Movement Joystick (360° omnidirectional walking/driving).
  - **Right Side**:
    - 360° Aim Joystick with live reticle pointer.
    - **FIRE Button**: Prominent firing trigger with pulsating feedback.
    - **WEAPONS QUICK CHANGE Button**: Instant cycle between Twin Plasma Repeater and Valkyrie Burst Rifle with weapon icons.
    - **BOOST / DASH Button**: Thruster overdrive burst.
    - **ENTER TANK / EXIT TANK Action Button**: High-visibility glowing button that activates when pilot is near the tank or driving it.
  - **Top Bar**: Pause button, Audio mute toggle, and Homestead/Player vitals.

---

## 5. User Interface & HUD Integration
- **GameHUD (`GameHUD.tsx`)**:
  - Add Homestead Outpost Integrity bar (500 HP) with alert flashing under 30%.
  - Add Pilot/Tank status indicator (`PILOT ON FOOT` vs `HEAVY BATTLE TANK ONLINE`).
  - Add prominent contextual interaction prompt: `"PRESS [E] OR TAP ENTER TANK"`.
- **TitleScreen (`TitleScreen.tsx`)**:
  - Mobile-friendly "LAUNCH MISSION" start button and scenario intro: *"Defend your homestead outpost. Reach the Heavy Battle Tank and repel the invader swarms."*

---

## Verification Plan
1. **Compilation Check**: Run `compile_applet` and verify 0 TypeScript/build errors.
2. **Homestead & Tank Gameplay Test**:
   - Verify pilot spawns at house.
   - Verify walking to tank triggers "ENTER TANK" prompt.
   - Verify pressing [E] or touch button mounts the tank with audio and visual change.
   - Verify tank 360° turret aiming and dual cannon firing.
3. **Damage & Health Numbering Test**:
   - Verify red floating numbers on enemy hits.
   - Verify gold floating numbers on critical hits.
   - Verify green `+HP` floating numbers on health pickups.
4. **Landscape Mode Test**:
   - Verify portrait prompt appears when viewport width < height, and disappears in landscape orientation.
5. **Mobile Touch Controls Test**:
   - Verify both joysticks (movement and 360° aim) and action buttons operate smoothly without blocking canvas render.
