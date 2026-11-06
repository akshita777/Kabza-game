import {
  ActiveSpeechBubble,
  ASSET_PATHS,
  BrotherId,
  Direction,
  GRID_H,
  GRID_W,
  LandmarkZone,
  PlayerState,
  PowerUpItem,
  SupportingNPCState,
  TILE_SIZE,
} from './kabza-types';
import { SharedKabzaEngine } from './kabza-engine';

interface LeafParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vRot: number;
  size: number;
  color: string;
}

export class KabzaCourtyardRenderer {
  private sandstoneTile: HTMLCanvasElement | null = null;
  private badeGrassTile: HTMLCanvasElement | null = null;
  private chhoteBrickTile: HTMLCanvasElement | null = null;
  private outerGroundPattern: CanvasPattern | null = null;

  private images: Record<string, HTMLImageElement> = {};
  private leaves: LeafParticle[] = [];
  private cameraX = 0;
  private cameraY = 0;
  private cameraInitialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.bakeProceduralTextures();
      this.preloadPortraits();
      this.initAmbientParticles();
    }
  }

  private preloadPortraits() {
    const entries = Object.entries(ASSET_PATHS);
    for (const [key, src] of entries) {
      const img = new Image();
      img.referrerPolicy = 'no-referrer';
      img.src = src;
      this.images[key] = img;
    }
  }

  private initAmbientParticles() {
    const worldW = GRID_W * TILE_SIZE;
    const worldH = GRID_H * TILE_SIZE;
    this.leaves = Array.from({ length: 24 }, () => ({
      x: Math.random() * (worldW + 600) - 300,
      y: Math.random() * (worldH + 600) - 300,
      vx: 14 + Math.random() * 18,
      vy: 8 + Math.random() * 14,
      rot: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 2.2,
      size: 4 + Math.random() * 4,
      color: Math.random() > 0.35 ? '#689F38' : '#D4A359',
    }));
  }

  private bakeProceduralTextures() {
    const S = TILE_SIZE;

    // 1. Weathered Courtyard Sandstone Tile
    const sand = document.createElement('canvas');
    sand.width = S * 2;
    sand.height = S * 2;
    const sCtx = sand.getContext('2d')!;

    for (let ty = 0; ty < 2; ty++) {
      for (let tx = 0; tx < 2; tx++) {
        const ox = tx * S;
        const oy = ty * S;

        const baseColors = ['#E5D2B0', '#E1CEAB', '#DFCBA7', '#E6D4B4'];
        sCtx.fillStyle = baseColors[(tx + ty * 2) % 4];
        sCtx.fillRect(ox, oy, S, S);

        sCtx.fillStyle = 'rgba(255, 250, 240, 0.35)';
        sCtx.fillRect(ox + 2, oy + 2, S - 4, 2);
        sCtx.fillRect(ox + 2, oy + 2, 2, S - 4);

        sCtx.fillStyle = 'rgba(138, 112, 80, 0.25)';
        sCtx.fillRect(ox + 2, oy + S - 3, S - 4, 2);
        sCtx.fillRect(ox + S - 3, oy + 2, 2, S - 4);

        sCtx.strokeStyle = '#BAA37E';
        sCtx.lineWidth = 2;
        sCtx.strokeRect(ox + 0.5, oy + 0.5, S - 1, S - 1);

        sCtx.fillStyle = 'rgba(145, 118, 84, 0.45)';
        sCtx.beginPath();
        sCtx.arc(ox + S * 0.28, oy + S * 0.34, 1.8, 0, Math.PI * 2);
        sCtx.arc(ox + S * 0.72, oy + S * 0.65, 1.4, 0, Math.PI * 2);
        sCtx.fill();
      }
    }
    sCtx.strokeStyle = '#6E8B4B';
    sCtx.lineWidth = 1.5;
    const cx = S;
    const cy = S;
    for (let a = 0; a < 5; a++) {
      const ang = -Math.PI * 0.85 + a * 0.42;
      sCtx.beginPath();
      sCtx.moveTo(cx, cy);
      sCtx.lineTo(cx + Math.cos(ang) * 5, cy + Math.sin(ang) * 5);
      sCtx.stroke();
    }
    this.sandstoneTile = sand;

    // 2. Bade's Captured Lush Green Lawn Tile
    const grass = document.createElement('canvas');
    grass.width = S;
    grass.height = S;
    const gCtx = grass.getContext('2d')!;
    gCtx.fillStyle = '#5E9A43';
    gCtx.fillRect(0, 0, S, S);

    gCtx.fillStyle = '#558E3C';
    gCtx.fillRect(2, 2, S - 4, S - 4);

    gCtx.strokeStyle = '#41712B';
    gCtx.lineWidth = 1.5;
    gCtx.strokeRect(0.75, 0.75, S - 1.5, S - 1.5);

    gCtx.strokeStyle = '#82C362';
    gCtx.lineWidth = 1.3;
    const tufts = [
      [10, 14],
      [28, 12],
      [18, 28],
      [33, 32],
    ];
    for (const [tx, ty] of tufts) {
      gCtx.beginPath();
      gCtx.moveTo(tx, ty);
      gCtx.lineTo(tx - 2, ty - 4);
      gCtx.moveTo(tx, ty);
      gCtx.lineTo(tx + 2, ty - 4);
      gCtx.stroke();
    }
    this.badeGrassTile = grass;

    // 3. Chhote's Captured Red Terracotta Brick Tile
    const brick = document.createElement('canvas');
    brick.width = S;
    brick.height = S;
    const bCtx = brick.getContext('2d')!;
    bCtx.fillStyle = '#753028';
    bCtx.fillRect(0, 0, S, S);

    const rows = 3;
    const rowH = S / rows;
    for (let r = 0; r < rows; r++) {
      const y = r * rowH;
      const offset = r % 2 === 1 ? S * 0.25 : 0;
      for (let c = -1; c < 2; c++) {
        const x = c * (S * 0.5) + offset;
        bCtx.fillStyle = (r + c) % 2 === 0 ? '#A94438' : '#9B3B30';
        bCtx.fillRect(x + 1.5, y + 1.5, S * 0.5 - 3, rowH - 3);
        bCtx.fillStyle = 'rgba(235, 130, 115, 0.3)';
        bCtx.fillRect(x + 2, y + 2, S * 0.5 - 4, 1.5);
      }
    }
    bCtx.strokeStyle = '#63241D';
    bCtx.lineWidth = 1.2;
    bCtx.strokeRect(0.5, 0.5, S - 1, S - 1);
    this.chhoteBrickTile = brick;

    // 4. Outer Ancestral Compound Earth & Pebble Texture
    const earth = document.createElement('canvas');
    earth.width = 160;
    earth.height = 160;
    const eCtx = earth.getContext('2d')!;
    eCtx.fillStyle = '#BBA585';
    eCtx.fillRect(0, 0, 160, 160);

    for (let i = 0; i < 32; i++) {
      eCtx.fillStyle = i % 2 === 0 ? 'rgba(156, 132, 98, 0.38)' : 'rgba(214, 195, 165, 0.32)';
      eCtx.beginPath();
      eCtx.arc((i * 47) % 160, (i * 73) % 160, 10 + (i % 14), 0, Math.PI * 2);
      eCtx.fill();
    }
    for (let i = 0; i < 45; i++) {
      eCtx.fillStyle = i % 5 === 0 ? '#9E4B3B' : i % 2 === 0 ? '#7E6B52' : '#D5C3A6';
      const px = (i * 89 + 13) % 156;
      const py = (i * 53 + 29) % 156;
      eCtx.fillRect(px, py, 3 + (i % 4), 2 + (i % 3));
    }
    this.outerGroundPattern = eCtx.createPattern(earth, 'repeat');
  }

  public render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    engine: SharedKabzaEngine,
    localBrotherId: BrotherId,
    isSplitKeyboardMode: boolean,
    dt: number,
    shakeOffset: { x: number; y: number }
  ) {
    const S = TILE_SIZE;
    const worldW = GRID_W * S;
    const worldH = GRID_H * S;

    const localPlayer = engine.players[localBrotherId];
    const rivalBrotherId: BrotherId = localBrotherId === 'bade' ? 'chhote' : 'bade';
    const rivalPlayer = engine.players[rivalBrotherId];

    let targetCamX = localPlayer.x * S + S * 0.5 - width * 0.5;
    let targetCamY = localPlayer.y * S + S * 0.5 - height * 0.5;

    if (isSplitKeyboardMode) {
      const midX = (engine.players.bade.x + engine.players.chhote.x) * 0.5 * S;
      const midY = (engine.players.bade.y + engine.players.chhote.y) * 0.5 * S;
      targetCamX = midX - width * 0.5;
      targetCamY = midY - height * 0.5;
    }

    const marginX = 320;
    const marginY = 300;
    targetCamX = Math.max(-marginX, Math.min(worldW - width + marginX, targetCamX));
    targetCamY = Math.max(-marginY, Math.min(worldH - height + marginY, targetCamY));

    if (!this.cameraInitialized) {
      this.cameraX = targetCamX;
      this.cameraY = targetCamY;
      this.cameraInitialized = true;
    } else {
      const lerp = Math.min(1, dt * 8.5);
      this.cameraX += (targetCamX - this.cameraX) * lerp;
      this.cameraY += (targetCamY - this.cameraY) * lerp;
    }

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    const camX = Math.round(this.cameraX - shakeOffset.x);
    const camY = Math.round(this.cameraY - shakeOffset.y);
    ctx.translate(-camX, -camY);

    // LAYER 1: OUTER ANCESTRAL COMPOUND SOIL
    ctx.fillStyle = this.outerGroundPattern || '#BBA585';
    ctx.fillRect(camX - 40, camY - 40, width + 80, height + 80);

    // LAYER 2: COURTYARD SANDSTONE & CAPTURED TERRITORY TILES
    const startCol = Math.max(0, Math.floor(camX / S) - 1);
    const endCol = Math.min(GRID_W - 1, Math.ceil((camX + width) / S) + 1);
    const startRow = Math.max(0, Math.floor(camY / S) - 1);
    const endRow = Math.min(GRID_H - 1, Math.ceil((camY + height) / S) + 1);

    ctx.fillStyle = 'rgba(28, 20, 12, 0.25)';
    ctx.fillRect(-10, -10, worldW + 28, worldH + 28);

    for (let gy = startRow; gy <= endRow; gy++) {
      const py = gy * S;
      for (let gx = startCol; gx <= endCol; gx++) {
        const px = gx * S;
        const owner = engine.grid[gy * GRID_W + gx];

        if (owner === 0) {
          if (this.sandstoneTile) {
            const sx = (gx % 2) * S;
            const sy = (gy % 2) * S;
            ctx.drawImage(this.sandstoneTile, sx, sy, S, S, px, py, S, S);
          } else {
            ctx.fillStyle = '#E3CFA8';
            ctx.fillRect(px, py, S, S);
          }
        } else if (owner === 1) {
          if (this.badeGrassTile) {
            ctx.drawImage(this.badeGrassTile, px, py);
          } else {
            ctx.fillStyle = '#5E9A43';
            ctx.fillRect(px, py, S, S);
          }
        } else if (owner === 2) {
          if (this.chhoteBrickTile) {
            ctx.drawImage(this.chhoteBrickTile, px, py);
          } else {
            ctx.fillStyle = '#A94438';
            ctx.fillRect(px, py, S, S);
          }
        }

        if (owner !== 0) {
          ctx.fillStyle = owner === 1 ? '#8BC34A' : '#E57373';
          if (gy === 0 || engine.grid[(gy - 1) * GRID_W + gx] !== owner) {
            ctx.fillRect(px, py, S, 3);
          }
          if (gy === GRID_H - 1 || engine.grid[(gy + 1) * GRID_W + gx] !== owner) {
            ctx.fillRect(px, py + S - 3, S, 3);
          }
          if (gx === 0 || engine.grid[gy * GRID_W + (gx - 1)] !== owner) {
            ctx.fillRect(px, py, 3, S);
          }
          if (gx === GRID_W - 1 || engine.grid[gy * GRID_W + (gx + 1)] !== owner) {
            ctx.fillRect(px + S - 3, py, 3, S);
          }
        }
      }
    }

    // LAYER 3: RADIAL TILE-FLIP WAVE EFFECTS
    for (const tf of engine.tileFlips) {
      if (tf.delay > 0) continue;
      const px = tf.x * S;
      const py = tf.y * S;
      const scale = Math.sin(tf.progress * Math.PI);
      ctx.save();
      ctx.translate(px + S * 0.5, py + S * 0.5);
      ctx.scale(1 + scale * 0.16, 1 + scale * 0.16);
      ctx.fillStyle =
        tf.owner === 1
          ? `rgba(163, 230, 53, ${0.65 * (1 - tf.progress)})`
          : `rgba(251, 113, 133, ${0.65 * (1 - tf.progress)})`;
      ctx.fillRect(-S * 0.5, -S * 0.5, S, S);
      ctx.restore();
    }

    // LAYER 4: PRIME PROPERTY LANDMARKS
    this.renderLandmarks(ctx, engine.landmarks, S);

    // LAYER 5: ACTIVE EXPOSED TRAILS
    this.renderPlayerTrail(ctx, engine.players.bade, S);
    this.renderPlayerTrail(ctx, engine.players.chhote, S);

    // LAYER 6: COURTYARD POWER-UP PICKUPS (DRAWN WITH CUSTOM VECTOR ART, NO EMOJIS)
    this.renderPowerUps(ctx, engine.powerUps, S);

    // LAYER 7: 2.5D COMPOUND BOUNDARY WALLS & ALL 24 ANCESTRAL PROPS
    this.renderBoundaryWallsAndCompoundProps(ctx, worldW, worldH, S);

    // LAYER 8: SUPPORTING FAMILY NPCs + IN-WORLD SPEECH BUBBLES
    this.renderSupportingNPCs(ctx, engine.npcs, S);

    // LAYER 9: ARTICULATED TOP-DOWN BROTHERS + IN-WORLD SPEECH BUBBLES
    const leaderId: BrotherId | null =
      engine.players.bade.territoryCells > engine.players.chhote.territoryCells
        ? 'bade'
        : engine.players.chhote.territoryCells > engine.players.bade.territoryCells
          ? 'chhote'
          : null;

    const latestBadeBubble = [...engine.activeBubbles]
      .reverse()
      .find((b) => b.speaker === 'bade');
    const latestChhoteBubble = [...engine.activeBubbles]
      .reverse()
      .find((b) => b.speaker === 'chhote');

    this.renderBrotherCharacter(
      ctx,
      engine.players.bade,
      localBrotherId === 'bade' && !isSplitKeyboardMode,
      leaderId === 'bade',
      latestBadeBubble || null,
      S
    );
    this.renderBrotherCharacter(
      ctx,
      engine.players.chhote,
      localBrotherId === 'chhote' && !isSplitKeyboardMode,
      leaderId === 'chhote',
      latestChhoteBubble || null,
      S
    );

    // LAYER 10: FLOATING "+X.X% KABZA!" POPUPS & DRIFTING MANGO LEAVES
    for (const pop of engine.popups) {
      const alpha = Math.max(0, Math.min(1, pop.life / (pop.maxLife * 0.4)));
      const px = pop.x * S + S * 0.5;
      const py = pop.y * S;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = '800 19px var(--font-display), sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#1A1512';
      ctx.strokeText(pop.text, px, py);
      ctx.fillStyle = pop.color;
      ctx.fillText(pop.text, px, py);

      if (pop.subtext) {
        ctx.font = '700 11px var(--font-sans), sans-serif';
        ctx.strokeText(pop.subtext, px, py + 17);
        ctx.fillStyle = '#FFFBEB';
        ctx.fillText(pop.subtext, px, py + 17);
      }
      ctx.restore();
    }

    this.updateAndRenderLeaves(ctx, dt, worldW, worldH);

    ctx.restore();

    // LAYER 11: SCREEN-SPACE OFF-SCREEN RIVAL INDICATOR
    if (!isSplitKeyboardMode && !rivalPlayer.isEliminated) {
      this.renderOffscreenRivalIndicator(ctx, width, height, camX, camY, localPlayer, rivalPlayer, S);
    }
  }

  private renderPlayerTrail(ctx: CanvasRenderingContext2D, p: PlayerState, S: number) {
    if (p.isEliminated || p.trail.length === 0) return;

    const isBade = p.id === 'bade';
    const outerColor = isBade ? '#DCE775' : '#FFCCBC';
    const innerColor = isBade ? '#7CB342' : '#E5534B';

    for (let i = 0; i < p.trail.length; i++) {
      const pt = p.trail[i];
      const px = pt.x * S;
      const py = pt.y * S;

      ctx.fillStyle = outerColor;
      ctx.fillRect(px + 2, py + 2, S - 4, S - 4);

      ctx.fillStyle = innerColor;
      ctx.fillRect(px + 6, py + 6, S - 12, S - 12);
    }

    const lastPt = p.trail[p.trail.length - 1];
    const headX = p.x * S;
    const headY = p.y * S;
    const minX = Math.min(lastPt.x * S, headX);
    const minY = Math.min(lastPt.y * S, headY);
    const w = Math.abs(headX - lastPt.x * S) + S;
    const h = Math.abs(headY - lastPt.y * S) + S;

    ctx.fillStyle = outerColor;
    ctx.fillRect(minX + 2, minY + 2, w - 4, h - 4);
    ctx.fillStyle = innerColor;
    ctx.fillRect(minX + 6, minY + 6, w - 12, h - 12);
  }

  private renderLandmarks(ctx: CanvasRenderingContext2D, landmarks: LandmarkZone[], S: number) {
    for (const lm of landmarks) {
      const cx = lm.x * S + S * 0.5;
      const cy = lm.y * S + S * 0.5;
      const r = (lm.radius + 0.4) * S;

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle =
        lm.owner === 'bade'
          ? 'rgba(74, 222, 128, 0.16)'
          : lm.owner === 'chhote'
            ? 'rgba(248, 113, 113, 0.16)'
            : 'rgba(234, 179, 8, 0.14)';
      ctx.fill();
      ctx.setLineDash([6, 4]);
      ctx.lineWidth = 2.5;
      ctx.strokeStyle =
        lm.owner === 'bade' ? '#22C55E' : lm.owner === 'chhote' ? '#EF4444' : '#D97706';
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#1A1512';
      ctx.font = '800 10px var(--font-sans), sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(lm.hindiName.toUpperCase(), cx, cy + r - 8);
      ctx.restore();
    }
  }

  private renderPowerUps(ctx: CanvasRenderingContext2D, powerUps: PowerUpItem[], S: number) {
    const t = Date.now() * 0.005;
    for (const item of powerUps) {
      const cx = item.x * S + S * 0.5;
      const cy = item.y * S + S * 0.5 + Math.sin(t) * 3;

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, 20, 0, Math.PI * 2);
      ctx.fillStyle =
        item.type === 'CHAI_SPEED'
          ? '#D97706'
          : item.type === 'NIMBU_SHIELD'
            ? '#65A30D'
            : '#7E22CE';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#1A1512';
      ctx.stroke();

      // Custom hand-drawn vector icon instead of emoji
      ctx.translate(cx, cy);
      if (item.type === 'CHAI_SPEED') {
        // Clay Kulhad Chai Cup
        ctx.fillStyle = '#FDE68A';
        ctx.beginPath();
        ctx.moveTo(-7, -6);
        ctx.lineTo(7, -6);
        ctx.lineTo(5, 8);
        ctx.lineTo(-5, 8);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#1A1512';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (item.type === 'NIMBU_SHIELD') {
        // Shield Emblem
        ctx.fillStyle = '#FEF08A';
        ctx.beginPath();
        ctx.moveTo(0, -9);
        ctx.lineTo(8, -5);
        ctx.lineTo(6, 5);
        ctx.lineTo(0, 10);
        ctx.lineTo(-6, 5);
        ctx.lineTo(-8, -5);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#1A1512';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        // Stay Order Legal Stamp Scroll
        ctx.fillStyle = '#FEF3C7';
        ctx.fillRect(-7, -8, 14, 16);
        ctx.strokeStyle = '#1A1512';
        ctx.lineWidth = 2;
        ctx.strokeRect(-7, -8, 14, 16);
        ctx.fillStyle = '#DC2626';
        ctx.fillRect(-4, -3, 8, 3);
      }
      ctx.translate(-cx, -cy);

      ctx.font = '800 10px var(--font-sans), sans-serif';
      ctx.fillStyle = '#FFFBEB';
      ctx.strokeStyle = '#1A1512';
      ctx.lineWidth = 3;
      ctx.textAlign = 'center';
      ctx.strokeText(item.hindiTitle, cx, cy - 26);
      ctx.fillText(item.hindiTitle, cx, cy - 26);
      ctx.restore();
    }
  }

  private renderBoundaryWallsAndCompoundProps(
    ctx: CanvasRenderingContext2D,
    worldW: number,
    worldH: number,
    S: number
  ) {
    const wallT = 22;

    ctx.fillStyle = 'rgba(28, 20, 14, 0.22)';
    ctx.fillRect(0, 0, worldW, 14);
    ctx.fillRect(0, 0, 14, worldH);

    const drawWallBar = (x: number, y: number, w: number, h: number) => {
      ctx.fillStyle = '#E5AA7A';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#9E4731';
      ctx.fillRect(x, y + h * 0.55, w, h * 0.45);
      ctx.strokeStyle = '#3E1F14';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x, y, w, h);
    };

    drawWallBar(-wallT, -wallT, worldW + wallT * 2, wallT);
    drawWallBar(-wallT, worldH, worldW + wallT * 2, wallT);
    drawWallBar(-wallT, 0, wallT, worldH);
    drawWallBar(worldW, 0, wallT, worldH);

    const drawPillar = (px: number, py: number) => {
      const pw = 30;
      const ph = 34;
      ctx.fillStyle = 'rgba(25, 18, 12, 0.32)';
      ctx.fillRect(px - pw * 0.5 + 6, py - ph * 0.5 + 8, pw, ph);
      ctx.fillStyle = '#F0BE90';
      ctx.fillRect(px - pw * 0.5, py - ph * 0.5, pw, ph * 0.58);
      ctx.fillStyle = '#8D3B28';
      ctx.fillRect(px - pw * 0.5, py - ph * 0.5 + ph * 0.58, pw, ph * 0.42);
      ctx.strokeStyle = '#2D160E';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(px - pw * 0.5, py - ph * 0.5, pw, ph);
    };

    for (let gx = 0; gx <= GRID_W; gx += 5) {
      drawPillar(gx * S, -wallT * 0.5);
      drawPillar(gx * S, worldH + wallT * 0.5);
    }
    for (let gy = 5; gy < GRID_H; gy += 5) {
      drawPillar(-wallT * 0.5, gy * S);
      drawPillar(worldW + wallT * 0.5, gy * S);
    }

    const bushLocations = [
      { x: S * 6, y: -34, r: 34 },
      { x: S * 7.6, y: -26, r: 20 },
      { x: S * 18, y: -42, r: 44 },
      { x: S * 38, y: -38, r: 38 },
      { x: -36, y: S * 10, r: 34 },
      { x: -32, y: S * 28, r: 38 },
      { x: -34, y: S * 44, r: 32 },
      { x: worldW + 38, y: S * 12, r: 36 },
      { x: worldW + 38, y: S * 36, r: 40 },
      { x: S * 12, y: worldH + 38, r: 36 },
      { x: S * 42, y: worldH + 38, r: 38 },
    ];
    for (const b of bushLocations) {
      this.drawLushBush(ctx, b.x, b.y, b.r);
    }

    // NORTH: Ancestral Bungalow Veranda, Terracotta Roof, Water Tank, Charpai & Family Photos
    const verandaW = S * 34;
    const verandaH = 140;
    const verandaX = (worldW - verandaW) * 0.5;
    const verandaY = -verandaH - 28;

    ctx.fillStyle = '#C89D70';
    ctx.fillRect(verandaX, verandaY, verandaW, verandaH);
    ctx.strokeStyle = '#3E1F14';
    ctx.lineWidth = 3;
    ctx.strokeRect(verandaX, verandaY, verandaW, verandaH);

    ctx.fillStyle = '#9C3D2B';
    ctx.fillRect(verandaX - 20, verandaY - 60, verandaW + 40, 65);
    ctx.strokeStyle = '#3E1F14';
    ctx.strokeRect(verandaX - 20, verandaY - 60, verandaW + 40, 65);
    ctx.strokeStyle = 'rgba(62, 31, 20, 0.45)';
    for (let rx = verandaX - 10; rx < verandaX + verandaW + 30; rx += 18) {
      ctx.beginPath();
      ctx.moveTo(rx, verandaY - 60);
      ctx.lineTo(rx, verandaY + 5);
      ctx.stroke();
    }

    ctx.fillStyle = '#2C3E50';
    ctx.fillRect(verandaX + 55, verandaY - 52, 64, 46);
    ctx.strokeStyle = '#1A1512';
    ctx.strokeRect(verandaX + 55, verandaY - 52, 64, 46);
    ctx.fillStyle = '#95A5A6';
    ctx.font = '700 9px var(--font-mono), monospace';
    ctx.textAlign = 'center';
    ctx.fillText('WATER TANK', verandaX + 87, verandaY - 25);

    for (let i = 0; i < 3; i++) {
      const fx = verandaX + verandaW * 0.45 + i * 44;
      const fy = verandaY + 14;
      ctx.fillStyle = '#5D4037';
      ctx.fillRect(fx, fy, 32, 26);
      ctx.fillStyle = '#EFEBE9';
      ctx.fillRect(fx + 4, fy + 4, 24, 18);
    }

    const charpaiX = GRID_W * 0.34 * S - 52;
    const charpaiY = -145;
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(charpaiX + 6, charpaiY + 8, 104, 62);
    ctx.fillStyle = '#8D5B34';
    ctx.fillRect(charpaiX, charpaiY, 104, 62);
    ctx.fillStyle = '#D7B98E';
    ctx.fillRect(charpaiX + 8, charpaiY + 8, 88, 46);
    ctx.strokeStyle = 'rgba(141, 91, 52, 0.45)';
    ctx.lineWidth = 1.5;
    for (let cx = charpaiX + 14; cx < charpaiX + 92; cx += 10) {
      ctx.beginPath();
      ctx.moveTo(cx, charpaiY + 8);
      ctx.lineTo(cx, charpaiY + 54);
      ctx.stroke();
    }
    ctx.fillStyle = '#C0392B';
    ctx.fillRect(charpaiX + 12, charpaiY + 14, 18, 34);

    // WEST: Vintage Scooter, Hand Pump, Clothesline
    const scX = -115;
    const scY = S * 40;
    ctx.save();
    ctx.translate(scX, scY);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(4, 6, 26, 44, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2980B9';
    ctx.fillRect(-16, -34, 32, 68);
    ctx.strokeStyle = '#1A1512';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(-16, -34, 32, 68);
    ctx.fillStyle = '#2C3E50';
    ctx.fillRect(-12, -8, 24, 30);
    ctx.strokeStyle = '#ECF0F1';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-22, -22);
    ctx.lineTo(22, -22);
    ctx.stroke();
    ctx.fillStyle = '#F1C40F';
    ctx.beginPath();
    ctx.arc(0, -30, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const hpX = -110;
    const hpY = S * 18;
    ctx.fillStyle = '#95A5A6';
    ctx.beginPath();
    ctx.arc(hpX, hpY, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2C3E50';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = '#5DADE2';
    ctx.beginPath();
    ctx.arc(hpX + 8, hpY + 6, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1F618D';
    ctx.fillRect(hpX - 6, hpY - 6, 12, 12);
    ctx.fillRect(hpX - 24, hpY - 3, 24, 6);

    ctx.strokeStyle = '#34495E';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-140, S * 24);
    ctx.lineTo(-75, S * 32);
    ctx.stroke();
    ctx.fillStyle = '#E74C3C';
    ctx.fillRect(-125, S * 25.5, 16, 10);
    ctx.fillStyle = '#F1C40F';
    ctx.fillRect(-102, S * 28.5, 16, 10);

    // EAST: Mango Tree
    const treeX = worldW + 135;
    const treeY = S * 18;
    this.drawLushBush(ctx, treeX, treeY, 88);
    this.drawLushBush(ctx, treeX - 28, treeY + 26, 62);
    this.drawLushBush(ctx, treeX + 24, treeY - 22, 58);

    // SOUTH: Iron Gate
    const gateW = S * 10;
    const gateX = (worldW - gateW) * 0.5;
    const gateY = worldH + wallT;
    ctx.fillStyle = '#2C3E50';
    ctx.fillRect(gateX, gateY, gateW, 18);
    ctx.strokeStyle = '#F39C12';
    ctx.lineWidth = 2;
    ctx.strokeRect(gateX, gateY, gateW, 18);
    ctx.fillStyle = '#FDEBD0';
    ctx.font = '800 12px var(--font-display), sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PUSHTAINI NIVAS · EST. 1968', worldW * 0.5, gateY + 13);
  }

  private drawLushBush(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number) {
    ctx.save();
    ctx.fillStyle = 'rgba(20, 15, 10, 0.32)';
    ctx.beginPath();
    ctx.arc(cx + 8, cy + 10, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#2E5A27';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#1B3816';
    ctx.stroke();

    const lobes = 7;
    ctx.fillStyle = '#4B833B';
    for (let i = 0; i < lobes; i++) {
      const a = (i / lobes) * Math.PI * 2;
      const lx = cx + Math.cos(a) * (radius * 0.45);
      const ly = cy + Math.sin(a) * (radius * 0.45);
      ctx.beginPath();
      ctx.arc(lx, ly, radius * 0.48, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#7CB342';
    ctx.beginPath();
    ctx.arc(cx - radius * 0.22, cy - radius * 0.22, radius * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private renderSupportingNPCs(ctx: CanvasRenderingContext2D, npcs: SupportingNPCState[], S: number) {
    const t = Date.now() * 0.006;

    for (const npc of npcs) {
      const x = npc.worldX * S;
      const y = npc.worldY * S;
      const bounce = npc.animState === 'talking' ? Math.sin(t * 3) * 4 : Math.sin(t) * 1.5;

      ctx.save();
      ctx.translate(x, y + bounce);

      ctx.fillStyle = 'rgba(0,0,0,0.32)';
      ctx.beginPath();
      ctx.ellipse(3, 8, 24, 18, 0, 0, Math.PI * 2);
      ctx.fill();

      if (npc.id === 'dadi') {
        ctx.fillStyle = '#F5EFE6';
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#D97706';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.fillStyle = '#D1D5DB';
        ctx.beginPath();
        ctx.arc(0, -4, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#78350F';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(18, -6);
        ctx.lineTo(28, 18);
        ctx.stroke();
      } else if (npc.id === 'mummy') {
        ctx.fillStyle = '#9D174D';
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FBBF24';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = '#1F2937';
        ctx.beginPath();
        ctx.arc(0, -3, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.save();
        ctx.translate(22, 2);
        ctx.rotate(npc.animState === 'talking' ? Math.sin(t * 5) * 0.45 : -0.3);
        ctx.fillStyle = '#B45309';
        ctx.fillRect(-4, -18, 8, 32);
        ctx.restore();
      } else if (npc.id === 'sharma') {
        ctx.fillStyle = '#1D4ED8';
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#1E293B';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = '#F8FAFC';
        ctx.fillRect(-26, -12, 14, 22);
        ctx.fillStyle = '#D97706';
        ctx.beginPath();
        ctx.arc(-18, 16, 6, 0, Math.PI * 2);
        ctx.fill();
      } else if (npc.id === 'gupta') {
        ctx.fillStyle = '#6D28D9';
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#1E293B';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = '#92400E';
        ctx.fillRect(16, -14, 16, 22);
        ctx.fillStyle = '#FEF3C7';
        ctx.fillRect(18, -11, 12, 16);
      }

      ctx.font = '800 11px var(--font-sans), sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#1A1512';
      ctx.fillRect(-42, 24, 84, 18);
      ctx.fillStyle = '#FDE68A';
      ctx.fillText(npc.name.toUpperCase(), 0, 37);

      // Render in-world comic dialogue bubble above the NPC when talking!
      if (npc.currentLine) {
        this.drawWorldComicSpeechBubble(ctx, 0, -34, npc.name.toUpperCase(), npc.currentLine, '#FEF3C7', '#B45309');
      }

      ctx.restore();
    }
  }

  private renderBrotherCharacter(
    ctx: CanvasRenderingContext2D,
    p: PlayerState,
    isLocal: boolean,
    isLeader: boolean,
    activeBubble: ActiveSpeechBubble | null,
    S: number
  ) {
    const cx = p.x * S + S * 0.5;
    const cy = p.y * S + S * 0.5;

    if (p.isEliminated) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.fillStyle = '#1A1512';
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#EF4444';
      ctx.stroke();
      ctx.font = '800 11px var(--font-mono), monospace';
      ctx.fillStyle = '#F87171';
      ctx.textAlign = 'center';
      ctx.fillText(`OUT ${p.respawnTimer.toFixed(1)}s`, 0, 4);
      ctx.restore();
      return;
    }

    const angleMap: Record<Direction, number> = {
      DOWN: 0,
      LEFT: Math.PI * 0.5,
      UP: Math.PI,
      RIGHT: -Math.PI * 0.5,
    };
    const rot = angleMap[p.dir];
    const walkPhase = Date.now() * 0.015;
    const armSwing = Math.sin(walkPhase) * 7;

    ctx.save();
    ctx.translate(cx, cy);

    if (p.activePowerUp || p.hasShield) {
      ctx.beginPath();
      ctx.arc(0, 0, 32 + Math.sin(walkPhase) * 3, 0, Math.PI * 2);
      ctx.strokeStyle = p.hasShield ? '#FACC15' : '#38BDF8';
      ctx.lineWidth = 3.5;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(0, 2, 24, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.24)';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.stroke();

    ctx.save();
    ctx.rotate(rot);

    const isBade = p.id === 'bade';

    ctx.fillStyle = '#5D4037';
    ctx.beginPath();
    ctx.ellipse(-9, 12 + armSwing * 0.6, 5, 7, 0, 0, Math.PI * 2);
    ctx.ellipse(9, 12 - armSwing * 0.6, 5, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = isBade ? '#0E8A74' : '#D94336';
    ctx.beginPath();
    ctx.ellipse(0, 0, 22, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#1A1512';
    ctx.stroke();

    if (isBade) {
      ctx.fillStyle = '#F4D03F';
      ctx.fillRect(-11, -10, 4, 20);
      ctx.fillRect(7, -10, 4, 20);
    } else {
      ctx.fillStyle = '#FDEBD0';
      ctx.beginPath();
      ctx.arc(-12, -3, 2.5, 0, Math.PI * 2);
      ctx.arc(12, 3, 2.5, 0, Math.PI * 2);
      ctx.arc(-10, 5, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#E59866';
    ctx.strokeStyle = '#1A1512';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.arc(-20, 4 - armSwing, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(20, 4 + armSwing, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#E59866';
    ctx.beginPath();
    ctx.arc(0, 3, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#18181B';
    ctx.beginPath();
    ctx.arc(0, -1, 13.5, Math.PI * 0.85, Math.PI * 2.15);
    ctx.fill();

    if (isBade) {
      ctx.strokeStyle = '#18181B';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(-9, 13);
      ctx.quadraticCurveTo(0, 10, 9, 13);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(-9, -6, 7, 4);
      ctx.fillRect(2, -6, 7, 4);
      ctx.strokeStyle = '#1A1512';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-9, -6, 7, 4);
      ctx.strokeRect(2, -6, 7, 4);
    }

    ctx.restore();

    // Floating Name Label ("you" or "Bade" / "Chhote")
    const labelText = isLocal ? 'you' : p.name;
    ctx.font = '800 13px var(--font-sans), sans-serif';
    const textW = ctx.measureText(labelText).width;
    const pillW = Math.max(42, textW + 18);
    const pillH = 22;
    const pillY = -44;

    ctx.fillStyle = isBade ? '#2E6F40' : '#A94438';
    ctx.beginPath();
    ctx.roundRect(-pillW * 0.5, pillY, pillW, pillH, 6);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#1A1512';
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labelText, 0, pillY + pillH * 0.5);

    // Custom Hand-Drawn Vector Crown for Current Property Leader (Zero Emojis)
    if (isLeader) {
      const crownX = pillW * 0.5 + 12;
      const crownY = pillY + pillH * 0.5;
      ctx.save();
      ctx.translate(crownX, crownY);
      ctx.fillStyle = '#FACC15';
      ctx.strokeStyle = '#1A1512';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-8, 6);
      ctx.lineTo(-9, -5);
      ctx.lineTo(-3, 0);
      ctx.lineTo(0, -7);
      ctx.lineTo(3, 0);
      ctx.lineTo(9, -5);
      ctx.lineTo(8, 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Comic Reaction Word Tag when reacting (Zero Emojis)
    if (
      p.expression === 'panic' ||
      p.expression === 'laughing' ||
      p.expression === 'angry' ||
      p.expression === 'celebrating'
    ) {
      const reactionTag =
        p.expression === 'panic'
          ? 'BACHAO!'
          : p.expression === 'laughing'
            ? 'HAHA!'
            : p.expression === 'angry'
              ? 'RUK RE!'
              : 'KABZA!';
      ctx.font = '800 10px var(--font-display), sans-serif';
      ctx.fillStyle = '#FACC15';
      ctx.strokeStyle = '#1A1512';
      ctx.lineWidth = 3;
      ctx.strokeText(reactionTag, -pillW * 0.5 - 24, pillY + pillH * 0.5);
      ctx.fillText(reactionTag, -pillW * 0.5 - 24, pillY + pillH * 0.5);
    }

    // In-World Floating Comic Dialogue Box directly above the brother when speaking!
    if (activeBubble && Date.now() - activeBubble.createdAt < 3400) {
      this.drawWorldComicSpeechBubble(
        ctx,
        0,
        pillY - 12,
        isBade ? 'BADE' : 'CHHOTE',
        activeBubble.text,
        '#EFE4CE',
        isBade ? '#2E6F40' : '#B83B2B'
      );
    }

    ctx.restore();
  }

  /**
   * Draws a crisp, matte comic speech bubble with a pointer tail directly in world space above a character.
   */
  private drawWorldComicSpeechBubble(
    ctx: CanvasRenderingContext2D,
    x: number,
    bottomY: number,
    speakerLabel: string,
    text: string,
    bgColor: string,
    borderColor: string
  ) {
    ctx.save();
    ctx.font = '700 11px var(--font-sans), sans-serif';

    const maxCharsPerLine = 34;
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const w of words) {
      if ((currentLine + ' ' + w).trim().length > maxCharsPerLine && currentLine.length > 0) {
        lines.push(currentLine.trim());
        currentLine = w;
      } else {
        currentLine = (currentLine + ' ' + w).trim();
      }
    }
    if (currentLine) lines.push(currentLine);
    const displayLines = lines.slice(0, 2);

    let maxLineW = 90;
    for (const l of displayLines) {
      const m = ctx.measureText(l).width;
      if (m > maxLineW) maxLineW = m;
    }

    const boxW = maxLineW + 24;
    const boxH = displayLines.length * 15 + 24;
    const boxX = x - boxW * 0.5;
    const boxY = bottomY - boxH - 8;

    // Solid comic drop shadow
    ctx.fillStyle = '#1A1512';
    ctx.beginPath();
    ctx.roundRect(boxX + 3, boxY + 3, boxW, boxH, 8);
    ctx.fill();

    // Matte paper bubble body
    ctx.fillStyle = bgColor;
    ctx.strokeStyle = '#1A1512';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 8);
    ctx.fill();
    ctx.stroke();

    // Pointer tail
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.moveTo(x - 6, boxY + boxH - 1);
    ctx.lineTo(x, bottomY);
    ctx.lineTo(x + 6, boxY + boxH - 1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Speaker header strip
    ctx.fillStyle = borderColor;
    ctx.font = '800 9px var(--font-display), sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(speakerLabel, boxX + 10, boxY + 11);

    // Dialogue text lines
    ctx.fillStyle = '#1A1512';
    ctx.font = '700 11px var(--font-sans), sans-serif';
    displayLines.forEach((line, idx) => {
      ctx.fillText(line, boxX + 10, boxY + 25 + idx * 14);
    });

    ctx.restore();
  }

  private renderOffscreenRivalIndicator(
    ctx: CanvasRenderingContext2D,
    viewW: number,
    viewH: number,
    camX: number,
    camY: number,
    local: PlayerState,
    rival: PlayerState,
    S: number
  ) {
    const rivalScreenX = rival.x * S + S * 0.5 - camX;
    const rivalScreenY = rival.y * S + S * 0.5 - camY;

    if (
      rivalScreenX >= 45 &&
      rivalScreenX <= viewW - 45 &&
      rivalScreenY >= 80 &&
      rivalScreenY <= viewH - 45
    ) {
      return;
    }

    const pad = 36;
    const clampedX = Math.max(pad, Math.min(viewW - pad, rivalScreenX));
    const clampedY = Math.max(96, Math.min(viewH - pad, rivalScreenY));

    const tileDist = Math.max(
      1,
      Math.round(Math.hypot(rival.x - local.x, rival.y - local.y) / 6)
    );

    ctx.save();
    ctx.translate(clampedX, clampedY);

    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.roundRect(14, -11, 24, 22, 4);
    ctx.fill();
    ctx.strokeStyle = '#1A1512';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#1A1512';
    ctx.font = '800 13px var(--font-mono), monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${tileDist}`, 26, 0);

    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fillStyle = rival.id === 'bade' ? '#2E6F40' : '#B83B2B';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#1A1512';
    ctx.stroke();

    const imgKey = rival.id === 'bade' ? 'badePortrait' : 'chhotePortrait';
    const img = this.images[imgKey];
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, -20, -20, 40, 40);
      ctx.restore();
    } else {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 14px var(--font-display), sans-serif';
      ctx.fillText(rival.name[0], 0, 1);
    }

    ctx.restore();
  }

  private updateAndRenderLeaves(
    ctx: CanvasRenderingContext2D,
    dt: number,
    worldW: number,
    worldH: number
  ) {
    for (const leaf of this.leaves) {
      leaf.x += leaf.vx * dt;
      leaf.y += leaf.vy * dt;
      leaf.rot += leaf.vRot * dt;

      if (leaf.x > worldW + 250) leaf.x = -250;
      if (leaf.y > worldH + 250) leaf.y = -250;

      ctx.save();
      ctx.translate(leaf.x, leaf.y);
      ctx.rotate(leaf.rot);
      ctx.fillStyle = leaf.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, leaf.size, leaf.size * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
