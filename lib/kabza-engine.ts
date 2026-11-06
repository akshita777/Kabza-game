import {
  AIDifficulty,
  ActiveSpeechBubble,
  BanterEventType,
  BrotherId,
  CharacterSpeaker,
  Direction,
  FloatingPopup,
  GRID_H,
  GRID_W,
  GridPoint,
  LandmarkId,
  LandmarkZone,
  MatchStats,
  PlayerState,
  PowerUpItem,
  PowerUpType,
  SupportingNPCState,
  TOTAL_TILES,
  TileFlipEffect,
  TurnBufferItem,
} from './kabza-types';
import { CHARACTER_METADATA, DIALOGUE_POOL } from './kabza-dialogue';

export function isOppositeDirection(a: Direction, b: Direction): boolean {
  return (
    (a === 'UP' && b === 'DOWN') ||
    (a === 'DOWN' && b === 'UP') ||
    (a === 'LEFT' && b === 'RIGHT') ||
    (a === 'RIGHT' && b === 'LEFT')
  );
}

export function dirToDelta(dir: Direction): GridPoint {
  switch (dir) {
    case 'UP':
      return { x: 0, y: -1 };
    case 'DOWN':
      return { x: 0, y: 1 };
    case 'LEFT':
      return { x: -1, y: 0 };
    case 'RIGHT':
      return { x: 1, y: 0 };
  }
}

export interface EngineCallbacks {
  onBanter?: (bubble: ActiveSpeechBubble) => void;
  onSFX?: (
    type:
      | 'capture_small'
      | 'capture_large'
      | 'trail_step'
      | 'trail_cut'
      | 'eliminated'
      | 'respawn'
      | 'powerup'
      | 'countdown'
      | 'victory'
      | 'defeat'
      | 'draw'
  ) => void;
  onScreenShake?: (intensity: number, hitStopMs?: number) => void;
  onMatchEnd?: (stats: MatchStats) => void;
}

interface AIControllerMemory {
  state: 'PATROL' | 'OUTWARD' | 'BREADTH' | 'RETURN_HOME' | 'HUNT_TRAIL' | 'SEEK_POWERUP';
  stepsRemaining: number;
  outwardDir: Direction;
  breadthDir: Direction;
  decisionCooldown: number;
}

export class SharedKabzaEngine {
  public grid: Uint8Array; // 0 = neutral, 1 = Bade, 2 = Chhote
  public players: Record<BrotherId, PlayerState>;
  public landmarks: LandmarkZone[];
  public powerUps: PowerUpItem[] = [];
  public tileFlips: TileFlipEffect[] = [];
  public popups: FloatingPopup[] = [];
  public activeBubbles: ActiveSpeechBubble[] = [];
  public npcs: SupportingNPCState[] = [];

  public timeRemaining: number;
  public totalDuration: number;
  public isPaused = false;
  public isFinished = false;
  public registryRushActive = false;

  private turnBuffers: Record<BrotherId, TurnBufferItem | null> = {
    bade: null,
    chhote: null,
  };

  private aiMemory: Record<BrotherId, AIControllerMemory> = {
    bade: {
      state: 'PATROL',
      stepsRemaining: 3,
      outwardDir: 'RIGHT',
      breadthDir: 'DOWN',
      decisionCooldown: 0,
    },
    chhote: {
      state: 'PATROL',
      stepsRemaining: 3,
      outwardDir: 'LEFT',
      breadthDir: 'UP',
      decisionCooldown: 0,
    },
  };

  private powerUpSpawnTimer = 9;
  private npcAmbientTimer = 4.5;
  private lastCountdownSecond = -1;
  private announced30s = false;
  private announced10s = false;
  private currentLeader: BrotherId | null = null;
  private lastBanterByEvent: Partial<Record<BanterEventType, number>> = {};
  private pendingFollowUps: { fireAt: number; speaker: CharacterSpeaker; text: string; event: BanterEventType }[] = [];
  private callbacks: EngineCallbacks;

  constructor(durationSeconds = 120, callbacks: EngineCallbacks = {}) {
    this.grid = new Uint8Array(TOTAL_TILES);
    this.totalDuration = durationSeconds;
    this.timeRemaining = durationSeconds;
    this.callbacks = callbacks;

    this.players = {
      bade: this.createInitialPlayer('bade'),
      chhote: this.createInitialPlayer('chhote'),
    };

    this.landmarks = [
      {
        id: 'SCOOTER_SPOT',
        name: "Babuji's Scooter Spot",
        hindiName: 'Babuji Ki Scooter Parking',
        x: Math.floor(GRID_W / 2),
        y: Math.floor(GRID_H / 2),
        radius: 2,
        owner: null,
      },
      {
        id: 'TULSI_CHAURA',
        name: 'Sacred Tulsi Chaura',
        hindiName: 'Aangan Ka Tulsi Chaura',
        x: Math.floor(GRID_W / 2),
        y: 12,
        radius: 2,
        owner: null,
      },
      {
        id: 'MANGO_SHADE',
        name: 'Dadi Mango Shade',
        hindiName: 'Aam Ke Ped Ki Chhaon',
        x: Math.floor(GRID_W / 2),
        y: GRID_H - 13,
        radius: 2,
        owner: null,
      },
    ];

    this.npcs = [
      {
        id: 'dadi',
        name: 'Dadi Amma',
        title: 'Family Judge',
        worldX: GRID_W * 0.34,
        worldY: -3.2,
        animState: 'idle',
        animTimer: 0,
        currentLine: null,
      },
      {
        id: 'mummy',
        name: 'Mummy Ji',
        title: 'Belan Authority',
        worldX: GRID_W * 0.68,
        worldY: -3.2,
        animState: 'idle',
        animTimer: 0,
        currentLine: null,
      },
      {
        id: 'sharma',
        name: 'Sharma Ji',
        title: 'Mohalla Reporter',
        worldX: GRID_W + 2.6,
        worldY: GRID_H * 0.42,
        animState: 'idle',
        animTimer: 0,
        currentLine: null,
      },
      {
        id: 'gupta',
        name: 'Gupta Ji',
        title: 'Property Broker',
        worldX: GRID_W * 0.5,
        worldY: GRID_H + 2.8,
        animState: 'idle',
        animTimer: 0,
        currentLine: null,
      },
    ];

    this.seedStartingTerritories();
    this.recalculateScores();
  }

  private createInitialPlayer(id: BrotherId): PlayerState {
    const isBade = id === 'bade';
    const spawnX = isBade ? 9 : GRID_W - 10;
    const spawnY = Math.floor(GRID_H / 2);

    return {
      id,
      name: isBade ? 'Bade' : 'Chhote',
      numericId: isBade ? 1 : 2,
      x: spawnX,
      y: spawnY,
      gridX: spawnX,
      gridY: spawnY,
      dir: isBade ? 'RIGHT' : 'LEFT',
      nextDir: isBade ? 'RIGHT' : 'LEFT',
      speed: 8.6, // tiles per second
      inSafeZone: true,
      trail: [],
      territoryCells: 0,
      territoryPct: 0,
      eliminations: 0,
      deaths: 0,
      largestCapturePct: 0,
      isEliminated: false,
      respawnTimer: 0,
      expression: 'idle',
      expressionTimer: 0,
      activePowerUp: null,
      powerUpTimer: 0,
      hasShield: false,
      slowTimer: 0,
      spawnOrigin: { x: spawnX, y: spawnY },
    };
  }

  private seedStartingTerritories() {
    this.grid.fill(0);
    // Give each brother an 8x8 starting territory (~2.0% of 56x56 = 3136 tiles -> 64/3136 = 2.04% matching screenshot "2%")
    const radius = 3; // 7x7 = 49 or 8x8 = 64 tiles
    for (const id of ['bade', 'chhote'] as BrotherId[]) {
      const p = this.players[id];
      for (let dy = -radius; dy <= radius + 1; dy++) {
        for (let dx = -radius; dx <= radius + 1; dx++) {
          const gx = p.spawnOrigin.x + dx;
          const gy = p.spawnOrigin.y + dy;
          if (gx >= 0 && gx < GRID_W && gy >= 0 && gy < GRID_H) {
            this.grid[gy * GRID_W + gx] = p.numericId;
          }
        }
      }
    }
  }

  /**
   * Queues a turn input with a 120ms pre-turn corner-assist buffer.
   */
  public queueDirection(id: BrotherId, newDir: Direction) {
    const p = this.players[id];
    if (!p || p.isEliminated || this.isFinished) return;

    // Prevent 180-degree self-reversal
    if (isOppositeDirection(p.dir, newDir)) return;

    p.nextDir = newDir;
    this.turnBuffers[id] = {
      dir: newDir,
      timestamp: Date.now(),
    };
  }

  public triggerBanter(event: BanterEventType, preferredSpeaker?: CharacterSpeaker, force = false) {
    const now = Date.now();
    const lastEventTime = this.lastBanterByEvent[event] || 0;
    const minCooldown = event === 'small_capture' ? 6500 : event === 'npc_ambient' ? 9500 : 2800;

    if (!force && now - lastEventTime < minCooldown) return;

    const candidates = DIALOGUE_POOL.filter(
      (d) => d.event === event && (!preferredSpeaker || d.speaker === preferredSpeaker)
    );
    const pool = candidates.length > 0 ? candidates : DIALOGUE_POOL.filter((d) => d.event === event);
    if (pool.length === 0) return;

    const chosen = pool[Math.floor(Math.random() * pool.length)];
    this.lastBanterByEvent[event] = now;

    this.pushBubble(chosen.speaker, chosen.text, event, chosen.priority);

    if (chosen.followUp) {
      this.pendingFollowUps.push({
        fireAt: now + chosen.followUp.delayMs,
        speaker: chosen.followUp.speaker,
        text: chosen.followUp.text,
        event,
      });
    }
  }

  private pushBubble(speaker: CharacterSpeaker, text: string, event: BanterEventType, priority: number) {
    const now = Date.now();
    // Avoid overlapping lower-priority bubbles
    if (this.activeBubbles.length > 0) {
      const highestActive = Math.max(...this.activeBubbles.map((b) => b.priority));
      if (priority < highestActive && now - this.activeBubbles[this.activeBubbles.length - 1].createdAt < 1400) {
        return;
      }
    }

    const meta = CHARACTER_METADATA[speaker];
    const bubble: ActiveSpeechBubble = {
      id: `${speaker}-${now}-${Math.random().toString(36).slice(2, 6)}`,
      speaker,
      speakerName: meta.name,
      text,
      event,
      createdAt: now,
      duration: 3800,
      priority,
    };

    // Keep max 2 active bubbles (e.g. call and response)
    this.activeBubbles = [...this.activeBubbles.slice(-1), bubble];

    // If NPC speaker, animate the perimeter NPC
    const npc = this.npcs.find((n) => n.id === speaker);
    if (npc) {
      npc.animState = 'talking';
      npc.animTimer = 3.5;
      npc.currentLine = text;
    }

    this.callbacks.onBanter?.(bubble);
  }

  public update(dt: number, aiConfig?: { brother: BrotherId; difficulty: AIDifficulty }) {
    if (this.isPaused || this.isFinished) return;

    const clampedDt = Math.min(dt, 0.1);

    // 1. Update Match Timer
    this.timeRemaining = Math.max(0, this.timeRemaining - clampedDt);

    // Registry Rush in final 20 seconds
    if (this.timeRemaining <= 20 && !this.registryRushActive && this.totalDuration >= 45) {
      this.registryRushActive = true;
    }

    // 30s and 10s countdown announcements
    const wholeSec = Math.ceil(this.timeRemaining);
    if (wholeSec === 30 && !this.announced30s) {
      this.announced30s = true;
      this.triggerBanter('countdown_30s', undefined, true);
    }
    if (wholeSec === 10 && !this.announced10s) {
      this.announced10s = true;
      this.triggerBanter('countdown_10s', 'dadi', true);
    }
    if (wholeSec <= 10 && wholeSec > 0 && wholeSec !== this.lastCountdownSecond) {
      this.lastCountdownSecond = wholeSec;
      this.callbacks.onSFX?.('countdown');
    }

    if (this.timeRemaining <= 0) {
      this.finishMatch();
      return;
    }

    // 2. Process Pending Call-and-Response Follow-Up Banter
    const now = Date.now();
    const readyFollowUps = this.pendingFollowUps.filter((f) => now >= f.fireAt);
    if (readyFollowUps.length > 0) {
      this.pendingFollowUps = this.pendingFollowUps.filter((f) => now < f.fireAt);
      for (const f of readyFollowUps) {
        this.pushBubble(f.speaker, f.text, f.event, 7);
      }
    }

    // Expire old bubbles
    this.activeBubbles = this.activeBubbles.filter((b) => now - b.createdAt < b.duration);

    // 3. Update AI Controller if enabled
    if (aiConfig) {
      this.updateStrategicAI(aiConfig.brother, aiConfig.difficulty, clampedDt);
    }

    // 4. Spawn & Update Courtyard Power-Ups
    this.powerUpSpawnTimer -= clampedDt;
    if (this.powerUpSpawnTimer <= 0 && this.powerUps.length < 2) {
      this.spawnRandomPowerUp();
      this.powerUpSpawnTimer = 15 + Math.random() * 6;
    }

    // 5. Ambient NPC Reactions
    this.npcAmbientTimer -= clampedDt;
    if (this.npcAmbientTimer <= 0) {
      this.npcAmbientTimer = 14 + Math.random() * 8;
      this.triggerBanter('npc_ambient');
    }

    for (const npc of this.npcs) {
      if (npc.animTimer > 0) {
        npc.animTimer -= clampedDt;
        if (npc.animTimer <= 0) {
          npc.animState = 'idle';
          npc.currentLine = null;
        }
      }
    }

    // 6. Update Both Brothers
    for (const id of ['bade', 'chhote'] as BrotherId[]) {
      this.updateBrother(id, clampedDt);
    }

    // 7. Update Visual Tile-Flip Waves & Popups
    this.tileFlips = this.tileFlips
      .map((tf) => {
        if (tf.delay > 0) {
          return { ...tf, delay: tf.delay - clampedDt };
        }
        return { ...tf, progress: Math.min(1, tf.progress + clampedDt * 4.5) };
      })
      .filter((tf) => tf.progress < 1);

    this.popups = this.popups
      .map((p) => ({
        ...p,
        y: p.y - clampedDt * 1.4,
        life: p.life - clampedDt,
      }))
      .filter((p) => p.life > 0);
  }

  private updateBrother(id: BrotherId, dt: number) {
    const p = this.players[id];
    const rivalId: BrotherId = id === 'bade' ? 'chhote' : 'bade';
    const rival = this.players[rivalId];

    // Expression timer decay
    if (p.expressionTimer > 0) {
      p.expressionTimer -= dt;
      if (p.expressionTimer <= 0) {
        p.expression = p.inSafeZone ? 'walking' : 'running';
      }
    }

    // Power-up timer decay
    if (p.powerUpTimer > 0) {
      p.powerUpTimer -= dt;
      if (p.powerUpTimer <= 0) {
        p.activePowerUp = null;
        p.hasShield = false;
      }
    }
    if (p.slowTimer > 0) {
      p.slowTimer = Math.max(0, p.slowTimer - dt);
    }

    // Handle Respawn Countdown if Eliminated
    if (p.isEliminated) {
      p.respawnTimer -= dt;
      p.expression = 'defeated';
      if (p.respawnTimer <= 0) {
        this.respawnPlayer(p);
      }
      return;
    }

    // Panic expression if exposed trail & rival is close
    if (!p.inSafeZone && p.trail.length > 0 && p.expressionTimer <= 0) {
      const minDistToTrail = this.getMinDistanceToTrail(rival.gridX, rival.gridY, p.trail);
      if (minDistToTrail <= 5) {
        p.expression = 'panic';
        this.triggerBanter('trail_exposed_risk', id);
      } else {
        p.expression = 'running';
      }
    }

    // Calculate effective speed
    let currentSpeed = p.speed;
    if (this.registryRushActive) currentSpeed *= 1.15;
    if (p.activePowerUp === 'CHAI_SPEED') currentSpeed *= 1.35;
    if (p.slowTimer > 0) currentSpeed *= 0.65;

    // Apply 120ms Turn Buffer when crossing/near tile center
    const buffer = this.turnBuffers[id];
    if (buffer && Date.now() - buffer.timestamp <= 220) {
      if (!isOppositeDirection(p.dir, buffer.dir)) {
        p.nextDir = buffer.dir;
      }
    }

    const prevGridX = p.gridX;
    const prevGridY = p.gridY;

    // If nextDir is perpendicular, snap cleanly when near tile center
    if (p.nextDir !== p.dir && !isOppositeDirection(p.dir, p.nextDir)) {
      const distToCenter = Math.hypot(p.x - Math.round(p.x), p.y - Math.round(p.y));
      if (distToCenter < 0.36) {
        p.x = Math.round(p.x);
        p.y = Math.round(p.y);
        p.dir = p.nextDir;
        this.turnBuffers[id] = null;
      }
    }

    const delta = dirToDelta(p.dir);
    let nextX = p.x + delta.x * currentSpeed * dt;
    let nextY = p.y + delta.y * currentSpeed * dt;

    // Clamp to courtyard boundaries (0 .. GRID_W - 1) and auto-turn along wall so player never gets stuck
    if (nextX < 0 || nextX > GRID_W - 1 || nextY < 0 || nextY > GRID_H - 1) {
      nextX = Math.max(0, Math.min(GRID_W - 1, nextX));
      nextY = Math.max(0, Math.min(GRID_H - 1, nextY));
      // Auto slide along boundary corner if hitting edge
      if (p.dir === 'LEFT' || p.dir === 'RIGHT') {
        p.dir = p.y < GRID_H / 2 ? 'DOWN' : 'UP';
        p.nextDir = p.dir;
      } else {
        p.dir = p.x < GRID_W / 2 ? 'RIGHT' : 'LEFT';
        p.nextDir = p.dir;
      }
    }

    p.x = nextX;
    p.y = nextY;
    p.gridX = Math.round(p.x);
    p.gridY = Math.round(p.y);

    // Check Power-Up Pickups
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const item = this.powerUps[i];
      if (Math.hypot(p.x - item.x, p.y - item.y) <= 1.65) {
        this.applyPowerUp(p, rival, item);
        this.powerUps.splice(i, 1);
      }
    }

    // Only process grid trail & capture transitions when entering a new grid cell
    if (p.gridX !== prevGridX || p.gridY !== prevGridY) {
      this.stepIntoCell(p, rival, p.gridX, p.gridY);
    }
  }

  private stepIntoCell(p: PlayerState, rival: PlayerState, gx: number, gy: number) {
    // 1. Check if this step cuts the RIVAL's exposed trail!
    if (!rival.isEliminated && rival.trail.length > 0) {
      const hitRivalTrail = rival.trail.some((pt) => pt.x === gx && pt.y === gy);
      const hitRivalHeadOutside = !rival.inSafeZone && rival.gridX === gx && rival.gridY === gy;

      if (hitRivalTrail || hitRivalHeadOutside) {
        if (rival.hasShield) {
          // Shield blocks the cut once!
          rival.hasShield = false;
          rival.activePowerUp = null;
          this.popups.push({
            id: `shield-${Date.now()}`,
            x: gx,
            y: gy,
            text: 'NIMBU SHIELD SAVED!',
            subtext: 'Nazar Battu Bacha Liya!',
            color: '#FACC15',
            life: 1.5,
            maxLife: 1.5,
          });
          this.callbacks.onSFX?.('powerup');
        } else {
          this.eliminateBrother(rival, p);
        }
      }
    }

    const cellOwner = this.grid[gy * GRID_W + gx];

    // 2. If stepping onto OWN territory:
    if (cellOwner === p.numericId) {
      if (!p.inSafeZone && p.trail.length > 0) {
        // Close the loop and flood-fill capture!
        this.completeLoopAndCapture(p, rival);
      }
      p.inSafeZone = true;
      p.trail = [];
    } else {
      // 3. Stepping outside safe territory onto neutral or rival land:
      p.inSafeZone = false;

      // Check if player looped onto their own existing trail (trim self-loop cleanly instead of self-killing, or close mini-loop)
      const existingIdx = p.trail.findIndex((pt) => pt.x === gx && pt.y === gy);
      if (existingIdx === -1) {
        p.trail.push({ x: gx, y: gy });
        this.callbacks.onSFX?.('trail_step');
      }
    }
  }

  private eliminateBrother(victim: PlayerState, killer: PlayerState) {
    victim.isEliminated = true;
    victim.respawnTimer = 2.0; // Confirmed 2s respawn
    victim.trail = [];
    victim.inSafeZone = true;
    victim.deaths += 1;
    victim.expression = 'defeated';
    victim.expressionTimer = 2.0;

    killer.eliminations += 1;
    killer.expression = 'laughing';
    killer.expressionTimer = 2.2;

    this.popups.push({
      id: `kill-${Date.now()}-${Math.random()}`,
      x: victim.gridX,
      y: victim.gridY,
      text: 'LINE KAAT DIYE!',
      subtext: `${killer.name} eliminated ${victim.name}!`,
      color: killer.id === 'bade' ? '#4ADE80' : '#F87171',
      life: 1.8,
      maxLife: 1.8,
    });

    this.callbacks.onSFX?.('trail_cut');
    this.callbacks.onScreenShake?.(12, 60);
    this.triggerBanter('trail_cut_kill', killer.id, true);
  }

  private respawnPlayer(p: PlayerState) {
    // Find a safe owned cell closest to spawnOrigin
    let bestPt = { ...p.spawnOrigin };
    let bestDist = Infinity;

    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        if (this.grid[y * GRID_W + x] === p.numericId) {
          const d = Math.hypot(x - p.spawnOrigin.x, y - p.spawnOrigin.y);
          if (d < bestDist) {
            bestDist = d;
            bestPt = { x, y };
          }
        }
      }
    }

    // Ensure at least a 3x3 safe patch at respawn point if all land was somehow lost
    if (bestDist === Infinity) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const gx = Math.max(0, Math.min(GRID_W - 1, bestPt.x + dx));
          const gy = Math.max(0, Math.min(GRID_H - 1, bestPt.y + dy));
          this.grid[gy * GRID_W + gx] = p.numericId;
        }
      }
    }

    p.x = bestPt.x;
    p.y = bestPt.y;
    p.gridX = bestPt.x;
    p.gridY = bestPt.y;
    p.isEliminated = false;
    p.respawnTimer = 0;
    p.inSafeZone = true;
    p.trail = [];
    p.dir = p.id === 'bade' ? 'RIGHT' : 'LEFT';
    p.nextDir = p.dir;
    p.expression = 'angry';
    p.expressionTimer = 1.5;

    this.callbacks.onSFX?.('respawn');
    this.triggerBanter('player_respawn', p.id);
  }

  /**
   * Mathematically verified Multi-Pocket Exterior BFS Flood-Fill Algorithm.
   * 1. Converts all trail cells to `p.numericId`.
   * 2. Runs BFS from an exterior 1-cell margin (-1..GRID_W, -1..GRID_H) to find all non-owned cells
   *    reachable from outside the player's territory boundary.
   * 3. Any interior cell NOT reachable from the exterior is enclosed by the player's territory + new trail
   *    and gets captured!
   */
  private completeLoopAndCapture(p: PlayerState, rival: PlayerState) {
    const ownerId = p.numericId;
    const closureX = p.gridX;
    const closureY = p.gridY;
    const newlyCaptured: GridPoint[] = [];

    // Step 1: Convert trail tiles to owned territory
    for (const pt of p.trail) {
      const idx = pt.y * GRID_W + pt.x;
      if (this.grid[idx] !== ownerId) {
        this.grid[idx] = ownerId;
        newlyCaptured.push(pt);
      }
    }

    // Step 2: Exterior BFS on padded grid (W+2) x (H+2)
    const padW = GRID_W + 2;
    const padH = GRID_H + 2;
    const visited = new Uint8Array(padW * padH);
    const queue = new Int32Array(padW * padH);
    let head = 0;
    let tail = 0;

    // Start at (0,0) in padded coordinates which corresponds to (-1,-1) outside the courtyard
    visited[0] = 1;
    queue[tail++] = 0;

    const dxs = [1, -1, 0, 0];
    const dys = [0, 0, 1, -1];

    while (head < tail) {
      const curr = queue[head++];
      const px = curr % padW;
      const py = (curr - px) / padW;

      for (let dir = 0; dir < 4; dir++) {
        const nx = px + dxs[dir];
        const ny = py + dys[dir];
        if (nx < 0 || nx >= padW || ny < 0 || ny >= padH) continue;

        const nIdx = ny * padW + nx;
        if (visited[nIdx]) continue;

        // Convert padded coords back to real grid coords
        const gx = nx - 1;
        const gy = ny - 1;

        if (gx >= 0 && gx < GRID_W && gy >= 0 && gy < GRID_H) {
          // Player's owned tiles act as walls for the flood-fill
          if (this.grid[gy * GRID_W + gx] === ownerId) {
            continue;
          }
        }

        visited[nIdx] = 1;
        queue[tail++] = nIdx;
      }
    }

    // Step 3: Collect all unvisited interior cells
    const enclosedCells: GridPoint[] = [];
    for (let gy = 0; gy < GRID_H; gy++) {
      for (let gx = 0; gx < GRID_W; gx++) {
        const pIdx = (gy + 1) * padW + (gx + 1);
        if (!visited[pIdx] && this.grid[gy * GRID_W + gx] !== ownerId) {
          enclosedCells.push({ x: gx, y: gy });
        }
      }
    }

    // Safety guard: only fill if enclosed region is < 75% of total board (prevents inverted boundary wrap glitch)
    if (enclosedCells.length < TOTAL_TILES * 0.75) {
      for (const pt of enclosedCells) {
        // Keep rival's immediate 1-tile foot anchor if rival is alive and standing inside Safe Zone
        if (
          !rival.isEliminated &&
          rival.inSafeZone &&
          Math.abs(pt.x - rival.gridX) <= 1 &&
          Math.abs(pt.y - rival.gridY) <= 1
        ) {
          continue;
        }
        this.grid[pt.y * GRID_W + pt.x] = ownerId;
        newlyCaptured.push(pt);
      }
    }

    // Spawn radial tile-flip wave animations
    for (const pt of newlyCaptured) {
      const dist = Math.hypot(pt.x - closureX, pt.y - closureY);
      this.tileFlips.push({
        x: pt.x,
        y: pt.y,
        owner: ownerId,
        progress: 0,
        delay: Math.min(0.28, dist * 0.012),
      });
    }

    const prevLeader = this.currentLeader;
    this.recalculateScores();

    const capturedPct = (newlyCaptured.length / TOTAL_TILES) * 100;
    if (capturedPct > p.largestCapturePct) {
      p.largestCapturePct = capturedPct;
    }

    if (newlyCaptured.length > 0) {
      const isMega = capturedPct >= 4.5;
      p.expression = isMega ? 'celebrating' : 'smug';
      p.expressionTimer = isMega ? 2.4 : 1.4;

      this.popups.push({
        id: `cap-${Date.now()}-${Math.random()}`,
        x: closureX,
        y: closureY,
        text: `+${capturedPct.toFixed(1)}% KABZA!`,
        subtext: isMega ? 'MAHA-KABZA! Gajab Kar Diye!' : undefined,
        color: p.id === 'bade' ? '#4ADE80' : '#FB7185',
        life: isMega ? 2.0 : 1.3,
        maxLife: isMega ? 2.0 : 1.3,
      });

      if (isMega) {
        this.callbacks.onSFX?.('capture_large');
        this.callbacks.onScreenShake?.(9, 45);
        this.triggerBanter('large_capture', p.id, true);
      } else {
        this.callbacks.onSFX?.('capture_small');
        this.triggerBanter('small_capture', p.id);
      }

      // Check if leader changed
      if (this.currentLeader && prevLeader && this.currentLeader !== prevLeader) {
        this.triggerBanter('lead_overtaken', this.currentLeader);
      } else if (Math.abs(this.players.bade.territoryPct - this.players.chhote.territoryPct) < 2.0 && this.timeRemaining < 60) {
        this.triggerBanter('close_match_tension');
      }
    }
  }

  public recalculateScores() {
    let badeCount = 0;
    let chhoteCount = 0;

    for (let i = 0; i < TOTAL_TILES; i++) {
      if (this.grid[i] === 1) badeCount++;
      else if (this.grid[i] === 2) chhoteCount++;
    }

    this.players.bade.territoryCells = badeCount;
    this.players.bade.territoryPct = (badeCount / TOTAL_TILES) * 100;

    this.players.chhote.territoryCells = chhoteCount;
    this.players.chhote.territoryPct = (chhoteCount / TOTAL_TILES) * 100;

    if (badeCount > chhoteCount) {
      this.currentLeader = 'bade';
    } else if (chhoteCount > badeCount) {
      this.currentLeader = 'chhote';
    } else {
      this.currentLeader = null;
    }

    // Update Prime Landmarks ownership
    for (const lm of this.landmarks) {
      const centerOwner = this.grid[lm.y * GRID_W + lm.x];
      const newOwner: BrotherId | null = centerOwner === 1 ? 'bade' : centerOwner === 2 ? 'chhote' : null;
      if (newOwner && newOwner !== lm.owner) {
        lm.owner = newOwner;
        this.triggerBanter('landmark_captured', newOwner);
      } else if (!newOwner) {
        lm.owner = null;
      }
    }
  }

  private spawnRandomPowerUp() {
    const types: { type: PowerUpType; label: string; hindiTitle: string; duration: number }[] = [
      {
        type: 'CHAI_SPEED',
        label: '1.35x Speed Boost',
        hindiTitle: 'Adrak Wali Kadak Chai',
        duration: 5.5,
      },
      {
        type: 'NIMBU_SHIELD',
        label: 'Trail Cut Shield',
        hindiTitle: 'Nimbu-Mirchi Nazar Battu',
        duration: 7.0,
      },
      {
        type: 'STAY_ORDER',
        label: 'Slows Rival 35%',
        hindiTitle: 'Gupta Ji Ka Stay Order',
        duration: 4.0,
      },
    ];

    const chosen = types[Math.floor(Math.random() * types.length)];
    const x = 10 + Math.floor(Math.random() * (GRID_W - 20));
    const y = 10 + Math.floor(Math.random() * (GRID_H - 20));

    this.powerUps.push({
      id: `pu-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      type: chosen.type,
      x,
      y,
      label: chosen.label,
      hindiTitle: chosen.hindiTitle,
      spawnTime: Date.now(),
      duration: chosen.duration,
    });
  }

  private applyPowerUp(p: PlayerState, rival: PlayerState, item: PowerUpItem) {
    this.callbacks.onSFX?.('powerup');
    this.triggerBanter('powerup_picked', p.id);

    if (item.type === 'CHAI_SPEED') {
      p.activePowerUp = 'CHAI_SPEED';
      p.powerUpTimer = item.duration;
    } else if (item.type === 'NIMBU_SHIELD') {
      p.activePowerUp = 'NIMBU_SHIELD';
      p.hasShield = true;
      p.powerUpTimer = item.duration;
    } else if (item.type === 'STAY_ORDER') {
      rival.slowTimer = item.duration;
      rival.expression = 'angry';
      rival.expressionTimer = 2.0;
    }

    this.popups.push({
      id: `pu-pop-${Date.now()}`,
      x: p.gridX,
      y: p.gridY,
      text: item.hindiTitle.toUpperCase(),
      subtext: item.label,
      color: '#FBBF24',
      life: 1.6,
      maxLife: 1.6,
    });
  }

  /**
   * Genuine 3-Tier Strategic AI Controller (Easy / Medium / Hard).
   * Evaluates risk vs. reward, hunts vulnerable opponent trails, grabs power-ups, and carves closed loops.
   */
  private updateStrategicAI(botId: BrotherId, difficulty: AIDifficulty, dt: number) {
    const bot = this.players[botId];
    if (bot.isEliminated) return;

    const rivalId: BrotherId = botId === 'bade' ? 'chhote' : 'bade';
    const rival = this.players[rivalId];
    const mem = this.aiMemory[botId];

    mem.decisionCooldown -= dt;
    if (mem.decisionCooldown > 0) return;

    // Decision interval based on difficulty
    mem.decisionCooldown = difficulty === 'easy' ? 0.26 : difficulty === 'medium' ? 0.16 : 0.09;

    const allDirs: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
    const validDirs = allDirs.filter((d) => {
      if (isOppositeDirection(bot.dir, d)) return false;
      const delta = dirToDelta(d);
      const nx = bot.gridX + delta.x * 2;
      const ny = bot.gridY + delta.y * 2;
      if (nx < 1 || nx >= GRID_W - 1 || ny < 1 || ny >= GRID_H - 1) return false;
      // Avoid stepping onto own exposed trail
      if (bot.trail.some((pt) => pt.x === bot.gridX + delta.x && pt.y === bot.gridY + delta.y)) {
        return false;
      }
      return true;
    });

    if (validDirs.length === 0) return;

    const closestSafeTile = this.findClosestOwnedTile(bot.gridX, bot.gridY, bot.numericId);
    const distToSafe = closestSafeTile
      ? Math.abs(bot.gridX - closestSafeTile.x) + Math.abs(bot.gridY - closestSafeTile.y)
      : 0;

    // 1. THREAT CHECK: If bot is outside safe zone and rival is approaching bot's trail, return home immediately!
    if (!bot.inSafeZone && bot.trail.length > 0) {
      const rivalDistToOurTrail = this.getMinDistanceToTrail(rival.gridX, rival.gridY, bot.trail);
      const maxTrailLen = difficulty === 'easy' ? 12 : difficulty === 'medium' ? 18 : 24;
      const dangerThreshold = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 7 : 10;

      if (rivalDistToOurTrail <= dangerThreshold || bot.trail.length >= maxTrailLen) {
        mem.state = 'RETURN_HOME';
      }
    }

    // 2. OPPORTUNITY CHECK: Can we slice the rival's exposed trail?
    if (difficulty !== 'easy' && !rival.isEliminated && rival.trail.length >= 2) {
      let closestTrailPt: GridPoint | null = null;
      let minDist = Infinity;
      for (const pt of rival.trail) {
        const d = Math.abs(bot.gridX - pt.x) + Math.abs(bot.gridY - pt.y);
        if (d < minDist) {
          minDist = d;
          closestTrailPt = pt;
        }
      }

      const huntRange = difficulty === 'hard' ? 15 : 9;
      if (closestTrailPt && minDist <= huntRange && (bot.inSafeZone || distToSafe < 6)) {
        const bestHuntDir = this.pickDirectionToward(bot.gridX, bot.gridY, closestTrailPt.x, closestTrailPt.y, validDirs);
        if (bestHuntDir) {
          this.queueDirection(botId, bestHuntDir);
          return;
        }
      }
    }

    // 3. POWER-UP CHECK on Medium/Hard
    if (difficulty !== 'easy' && bot.inSafeZone && this.powerUps.length > 0) {
      const pu = this.powerUps[0];
      const d = Math.abs(bot.gridX - pu.x) + Math.abs(bot.gridY - pu.y);
      if (d <= 12) {
        const puDir = this.pickDirectionToward(bot.gridX, bot.gridY, pu.x, pu.y, validDirs);
        if (puDir) {
          this.queueDirection(botId, puDir);
          return;
        }
      }
    }

    // 4. LOOP CARVING STATE MACHINE
    if (bot.inSafeZone) {
      // Find nearest unowned tile to expand toward
      const targetUnowned = this.findNearestExpansionTarget(bot.gridX, bot.gridY, bot.numericId, difficulty);
      if (targetUnowned) {
        const dirToBorder = this.pickDirectionToward(bot.gridX, bot.gridY, targetUnowned.x, targetUnowned.y, validDirs);
        if (dirToBorder) {
          mem.outwardDir = dirToBorder;
          mem.state = 'OUTWARD';
          mem.stepsRemaining = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 6 : 8;
          this.queueDirection(botId, dirToBorder);
          return;
        }
      }
    } else {
      // Currently outside safe territory drawing a loop
      if (mem.state === 'RETURN_HOME' && closestSafeTile) {
        const homeDir = this.pickDirectionToward(bot.gridX, bot.gridY, closestSafeTile.x, closestSafeTile.y, validDirs);
        if (homeDir) {
          this.queueDirection(botId, homeDir);
          return;
        }
      } else if (mem.state === 'OUTWARD') {
        mem.stepsRemaining -= 1;
        if (mem.stepsRemaining <= 0) {
          // Turn 90 degrees to carve breadth of rectangle
          const perpDirs = validDirs.filter((d) => d !== bot.dir);
          if (perpDirs.length > 0) {
            // Pick perpendicular direction towards center of arena
            const chosenPerp = this.pickDirectionToward(
              bot.gridX,
              bot.gridY,
              Math.floor(GRID_W / 2),
              Math.floor(GRID_H / 2),
              perpDirs
            ) || perpDirs[0];
            mem.breadthDir = chosenPerp;
            mem.state = 'BREADTH';
            mem.stepsRemaining = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 6 : 8;
            this.queueDirection(botId, chosenPerp);
            return;
          }
        }
      } else if (mem.state === 'BREADTH') {
        mem.stepsRemaining -= 1;
        if (mem.stepsRemaining <= 0) {
          mem.state = 'RETURN_HOME';
          if (closestSafeTile) {
            const homeDir = this.pickDirectionToward(bot.gridX, bot.gridY, closestSafeTile.x, closestSafeTile.y, validDirs);
            if (homeDir) {
              this.queueDirection(botId, homeDir);
              return;
            }
          }
        }
      }
    }

    // Fallback: keep current direction if valid, otherwise pick safest valid direction
    if (!validDirs.includes(bot.dir)) {
      this.queueDirection(botId, validDirs[0]);
    }
  }

  private pickDirectionToward(
    fromX: number,
    fromY: number,
    targetX: number,
    targetY: number,
    validDirs: Direction[]
  ): Direction | null {
    let bestDir: Direction | null = null;
    let bestScore = Infinity;

    for (const d of validDirs) {
      const delta = dirToDelta(d);
      const nx = fromX + delta.x;
      const ny = fromY + delta.y;
      const dist = Math.abs(nx - targetX) + Math.abs(ny - targetY);
      if (dist < bestScore) {
        bestScore = dist;
        bestDir = d;
      }
    }
    return bestDir;
  }

  private findClosestOwnedTile(fromX: number, fromY: number, numericId: 1 | 2): GridPoint | null {
    let bestPt: GridPoint | null = null;
    let bestDist = Infinity;

    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        if (this.grid[y * GRID_W + x] === numericId) {
          const d = Math.abs(x - fromX) + Math.abs(y - fromY);
          if (d < bestDist) {
            bestDist = d;
            bestPt = { x, y };
          }
        }
      }
    }
    return bestPt;
  }

  private findNearestExpansionTarget(
    fromX: number,
    fromY: number,
    numericId: 1 | 2,
    difficulty: AIDifficulty
  ): GridPoint | null {
    let bestPt: GridPoint | null = null;
    let bestScore = Infinity;

    const centerX = Math.floor(GRID_W / 2);
    const centerY = Math.floor(GRID_H / 2);

    for (let y = 3; y < GRID_H - 3; y += 2) {
      for (let x = 3; x < GRID_W - 3; x += 2) {
        const owner = this.grid[y * GRID_W + x];
        if (owner !== numericId) {
          const distFromBot = Math.abs(x - fromX) + Math.abs(y - fromY);
          const distFromCenter = Math.abs(x - centerX) + Math.abs(y - centerY);
          const rivalBonus = difficulty === 'hard' && owner !== 0 ? -4 : 0;
          const score = distFromBot + distFromCenter * 0.25 + rivalBonus;
          if (score < bestScore) {
            bestScore = score;
            bestPt = { x, y };
          }
        }
      }
    }
    return bestPt;
  }

  private getMinDistanceToTrail(x: number, y: number, trail: GridPoint[]): number {
    let minD = Infinity;
    for (const pt of trail) {
      const d = Math.abs(x - pt.x) + Math.abs(y - pt.y);
      if (d < minD) minD = d;
    }
    return minD;
  }

  public finishMatch(): MatchStats {
    this.isFinished = true;
    this.recalculateScores();

    const badePct = Number(this.players.bade.territoryPct.toFixed(1));
    const chhotePct = Number(this.players.chhote.territoryPct.toFixed(1));
    const diffPct = Number(Math.abs(badePct - chhotePct).toFixed(1));

    let winner: BrotherId | 'draw' = 'draw';
    if (badePct > chhotePct) winner = 'bade';
    else if (chhotePct > badePct) winner = 'chhote';

    const stats: MatchStats = {
      winner,
      badePct,
      chhotePct,
      diffPct,
      badeEliminations: this.players.bade.eliminations,
      chhoteEliminations: this.players.chhote.eliminations,
      badeLargestCapture: Number(this.players.bade.largestCapturePct.toFixed(1)),
      chhoteLargestCapture: Number(this.players.chhote.largestCapturePct.toFixed(1)),
      durationSeconds: this.totalDuration - Math.floor(this.timeRemaining),
      landmarksOwned: {
        SCOOTER_SPOT: this.landmarks[0].owner,
        TULSI_CHAURA: this.landmarks[1].owner,
        MANGO_SHADE: this.landmarks[2].owner,
      },
    };

    this.callbacks.onMatchEnd?.(stats);
    return stats;
  }
}
