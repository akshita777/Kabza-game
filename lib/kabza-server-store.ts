import fs from 'node:fs';
import {
  ActiveSpeechBubble,
  BrotherId,
  Direction,
  LobbyPlayerInfo,
  MatchStats,
  MultiplayerRoomInfo,
} from './kabza-types';
import { SharedKabzaEngine } from './kabza-engine';

const ROOMS_DISK_PATH = '/tmp/kabza-rooms-v2.json';

export function normalizeServerRoomCode(rawInput: string): string | null {
  if (!rawInput) return null;
  const trimmed = decodeURIComponent(rawInput).trim();
  if (!trimmed) return null;

  const explicitMatch = trimmed.match(/KABZA[\-_]([A-Z0-9]{4,6})/i);
  if (explicitMatch && explicitMatch[1]) {
    return `KABZA-${explicitMatch[1].toUpperCase()}`;
  }

  const urlJoinMatch = trimmed.match(/\/join\/([A-Z0-9\-_]{4,14})/i);
  if (urlJoinMatch && urlJoinMatch[1]) {
    const seg = urlJoinMatch[1].toUpperCase().replace(/^KABZA[\s\-_]*/, '');
    if (/^[A-Z0-9]{4,6}$/.test(seg)) {
      return `KABZA-${seg}`;
    }
  }

  const shortSpacedMatch = trimmed.match(/^KABZA[\s\-_]*([A-Z0-9]{4,6})$/i);
  if (shortSpacedMatch && shortSpacedMatch[1]) {
    return `KABZA-${shortSpacedMatch[1].toUpperCase()}`;
  }

  const cleanedAlnum = trimmed.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (trimmed.length <= 8 && /^[A-Z0-9]{4,6}$/.test(cleanedAlnum)) {
    return `KABZA-${cleanedAlnum}`;
  }

  return null;
}

export interface ServerRoomInstance {
  roomCode: string;
  createdAt: number;
  lastActivityAt: number;
  status: 'lobby' | 'countdown' | 'playing' | 'finished';
  matchDuration: 60 | 120 | 180;
  hostSessionId: string;
  players: LobbyPlayerInfo[];
  engine: SharedKabzaEngine | null;
  lastTickTime: number;
  latestBubbles: ActiveSpeechBubble[];
  matchStats: MatchStats | null;
  hasSimulatedBot?: boolean;
}

export interface SerializedGameState {
  roomCode: string;
  status: 'lobby' | 'countdown' | 'playing' | 'finished';
  timeRemaining: number;
  totalDuration: number;
  registryRushActive: boolean;
  gridBase64: string;
  players: {
    bade: {
      x: number;
      y: number;
      gridX: number;
      gridY: number;
      dir: Direction;
      nextDir: Direction;
      inSafeZone: boolean;
      trail: { x: number; y: number }[];
      territoryCells: number;
      territoryPct: number;
      eliminations: number;
      deaths: number;
      largestCapturePct: number;
      isEliminated: boolean;
      respawnTimer: number;
      expression: string;
      activePowerUp: string | null;
      hasShield: boolean;
      slowTimer: number;
    };
    chhote: {
      x: number;
      y: number;
      gridX: number;
      gridY: number;
      dir: Direction;
      nextDir: Direction;
      inSafeZone: boolean;
      trail: { x: number; y: number }[];
      territoryCells: number;
      territoryPct: number;
      eliminations: number;
      deaths: number;
      largestCapturePct: number;
      isEliminated: boolean;
      respawnTimer: number;
      expression: string;
      activePowerUp: string | null;
      hasShield: boolean;
      slowTimer: number;
    };
  };
  powerUps: {
    id: string;
    type: string;
    x: number;
    y: number;
    label: string;
    hindiTitle: string;
    spawnTime: number;
    duration: number;
  }[];
  popups: {
    id: string;
    x: number;
    y: number;
    text: string;
    subtext?: string;
    color: string;
    life: number;
    maxLife: number;
  }[];
  bubbles: ActiveSpeechBubble[];
  matchStats: MatchStats | null;
}

interface DiskRoomSnapshot {
  roomCode: string;
  createdAt: number;
  lastActivityAt: number;
  status: 'lobby' | 'countdown' | 'playing' | 'finished';
  matchDuration: 60 | 120 | 180;
  hostSessionId: string;
  players: LobbyPlayerInfo[];
  hasSimulatedBot?: boolean;
}

class AuthoritativeRoomManager {
  private rooms = new Map<string, ServerRoomInstance>();
  private tickInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.loadFromDisk();
    this.startLoop();
  }

  private saveToDisk() {
    try {
      const snapshots: DiskRoomSnapshot[] = [];
      for (const room of this.rooms.values()) {
        snapshots.push({
          roomCode: room.roomCode,
          createdAt: room.createdAt,
          lastActivityAt: room.lastActivityAt,
          status: room.status,
          matchDuration: room.matchDuration,
          hostSessionId: room.hostSessionId,
          players: room.players,
          hasSimulatedBot: room.hasSimulatedBot,
        });
      }
      fs.writeFileSync(ROOMS_DISK_PATH, JSON.stringify(snapshots), 'utf8');
    } catch {
      // ignore disk write issues
    }
  }

  private loadFromDisk() {
    try {
      if (!fs.existsSync(ROOMS_DISK_PATH)) return;
      const raw = fs.readFileSync(ROOMS_DISK_PATH, 'utf8');
      const snapshots = JSON.parse(raw) as DiskRoomSnapshot[];
      const now = Date.now();
      for (const snap of snapshots) {
        if (now - snap.lastActivityAt > 45 * 60 * 1000) continue;
        if (!this.rooms.has(snap.roomCode)) {
          const inst: ServerRoomInstance = {
            ...snap,
            engine: null,
            lastTickTime: now,
            latestBubbles: [],
            matchStats: null,
          };
          if (snap.status === 'playing') {
            this.initEngineForRoom(inst);
          }
          this.rooms.set(snap.roomCode, inst);
        }
      }
    } catch {
      // ignore disk read issues
    }
  }

  private getOrHydrateRoom(rawCode: string): ServerRoomInstance | null {
    const code = normalizeServerRoomCode(rawCode);
    if (!code) return null;

    let room = this.rooms.get(code);
    if (!room) {
      this.loadFromDisk();
      room = this.rooms.get(code);
    }
    return room || null;
  }

  private initEngineForRoom(room: ServerRoomInstance) {
    room.latestBubbles = [];
    room.matchStats = null;
    room.engine = new SharedKabzaEngine(room.matchDuration, {
      onBanter: (bubble) => {
        room.latestBubbles = [...room.latestBubbles.slice(-3), bubble];
      },
      onMatchEnd: (stats) => {
        room.status = 'finished';
        room.matchStats = stats;
        this.saveToDisk();
      },
    });

    for (const lp of room.players) {
      if (lp.character && room.engine.players[lp.character]) {
        room.engine.players[lp.character].name = lp.name;
      }
    }
  }

  private startLoop() {
    if (this.tickInterval) return;
    this.tickInterval = setInterval(() => {
      const now = Date.now();
      for (const [code, room] of this.rooms.entries()) {
        if (now - room.lastActivityAt > 45 * 60 * 1000) {
          this.rooms.delete(code);
          continue;
        }

        if (room.status === 'playing' && room.engine) {
          const dt = Math.min(0.1, (now - room.lastTickTime) / 1000);
          room.lastTickTime = now;

          // If room has a simulated remote friend bot, let strategic AI drive their brother
          let aiConfig: { brother: BrotherId; difficulty: 'medium' } | undefined;
          const botPlayer = room.players.find((p) => p.sessionId.startsWith('sim_friend_'));
          if (botPlayer && botPlayer.character) {
            aiConfig = { brother: botPlayer.character, difficulty: 'medium' };
          }

          room.engine.update(dt, aiConfig);
          if (room.engine.isFinished) {
            room.status = 'finished';
            room.matchStats = room.engine.finishMatch();
            this.saveToDisk();
          }
        }
      }
    }, 50); // 20Hz authoritative server tick
  }

  public generateRoomCode(): string {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    for (let attempt = 0; attempt < 20; attempt++) {
      let suffix = '';
      for (let i = 0; i < 4; i++) {
        suffix += chars[Math.floor(Math.random() * chars.length)];
      }
      const code = `KABZA-${suffix}`;
      if (!this.rooms.has(code)) return code;
    }
    return `KABZA-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  public createRoom(
    sessionId: string,
    playerName: string,
    matchDuration: 60 | 120 | 180 = 120,
    specificCode?: string
  ): MultiplayerRoomInfo {
    const roomCode =
      (specificCode && normalizeServerRoomCode(specificCode)) || this.generateRoomCode();
    const now = Date.now();

    const hostPlayer: LobbyPlayerInfo = {
      sessionId,
      name: playerName.trim() || 'Indori Badshah',
      character: null,
      ready: false,
      connected: true,
      ping: 18,
      isHost: true,
    };

    const instance: ServerRoomInstance = {
      roomCode,
      createdAt: now,
      lastActivityAt: now,
      status: 'lobby',
      matchDuration,
      hostSessionId: sessionId,
      players: [hostPlayer],
      engine: null,
      lastTickTime: now,
      latestBubbles: [],
      matchStats: null,
    };

    this.rooms.set(roomCode, instance);
    this.saveToDisk();
    return this.toRoomInfo(instance);
  }

  public joinRoom(
    rawCode: string,
    sessionId: string,
    playerName: string
  ): { ok: true; room: MultiplayerRoomInfo } | { ok: false; error: string; hindiError: string } {
    const code = normalizeServerRoomCode(rawCode);
    if (!code) {
      return {
        ok: false,
        error: 'Invalid room code format.',
        hindiError: 'Are Badshah, code sahi nahi hai! KABZA-XXXX jaisa code daalo.',
      };
    }

    let room = this.getOrHydrateRoom(code);

    // Auto-heal: If a friend joins a valid KABZA-XXXX link/code that is not yet in memory
    // (e.g., server worker restarted or link opened across instances), create the room
    // with that exact code so joining NEVER fails with a false "wrong code" error!
    if (!room) {
      this.createRoom(sessionId, playerName || 'Jabalpur Badshah', 120, code);
      room = this.rooms.get(code)!;
      return { ok: true, room: this.toRoomInfo(room) };
    }

    room.lastActivityAt = Date.now();

    // Check if player is reconnecting with existing sessionId
    const existing = room.players.find((p) => p.sessionId === sessionId);
    if (existing) {
      existing.connected = true;
      if (playerName.trim()) existing.name = playerName.trim();
      this.saveToDisk();
      return { ok: true, room: this.toRoomInfo(room) };
    }

    if (room.players.length >= 2) {
      // If one of the slots is a simulated bot or disconnected, replace it with the real human friend!
      const replaceableSlot = room.players.find(
        (p) => !p.connected || p.sessionId.startsWith('sim_friend_')
      );
      if (replaceableSlot) {
        replaceableSlot.sessionId = sessionId;
        replaceableSlot.name = playerName.trim() || 'Jabalpur Badshah';
        replaceableSlot.connected = true;
        room.hasSimulatedBot = false;
        this.saveToDisk();
        return { ok: true, room: this.toRoomInfo(room) };
      }

      return {
        ok: false,
        error: 'Room is already full (2/2 brothers).',
        hindiError: 'Are Badshah, plot pe pehle se do bhai lad rahe hain! Room full hai!',
      };
    }

    // Auto-assign opposite brother if Player 1 already locked one
    const p1 = room.players[0];
    const autoChar: BrotherId | null =
      p1?.character === 'bade' ? 'chhote' : p1?.character === 'chhote' ? 'bade' : null;

    // Ensure distinct display name if both players kept the default name
    let cleanName = playerName.trim() || 'Jabalpur Badshah';
    if (p1 && p1.name.toLowerCase() === cleanName.toLowerCase()) {
      cleanName = cleanName === 'Indori Badshah' ? 'Jabalpur Badshah' : `${cleanName} #2`;
    }

    room.players.push({
      sessionId,
      name: cleanName,
      character: autoChar,
      ready: Boolean(p1?.ready),
      connected: true,
      ping: 24,
      isHost: false,
    });

    if (p1?.ready && room.players.length === 2 && room.status === 'lobby') {
      this.startMatch(room.roomCode);
    } else {
      this.saveToDisk();
    }
    return { ok: true, room: this.toRoomInfo(room) };
  }

  /**
   * Adds a simulated remote friend into the room so a single user can test
   * the full 2-player online lobby and match flow anytime.
   */
  public addSimulatedFriend(
    rawCode: string
  ): { ok: true; room: MultiplayerRoomInfo } | { ok: false; error: string } {
    const room = this.getOrHydrateRoom(rawCode);
    if (!room) return { ok: false, error: 'Room not found' };

    room.hasSimulatedBot = true;
    const botSessionId = `sim_friend_${room.roomCode}`;
    const existingBot = room.players.find((p) => p.sessionId === botSessionId);
    if (existingBot) {
      existingBot.ready = true;
      this.saveToDisk();
      return { ok: true, room: this.toRoomInfo(room) };
    }

    if (room.players.length < 2) {
      const p1 = room.players[0];
      const botChar: BrotherId = p1?.character === 'bade' ? 'chhote' : 'bade';
      if (p1 && !p1.character) {
        p1.character = 'bade';
      }
      room.players.push({
        sessionId: botSessionId,
        name: 'Jabalpuria Bhaiya (Online)',
        character: botChar,
        ready: true,
        connected: true,
        ping: 29,
        isHost: false,
      });
    }

    this.saveToDisk();
    return { ok: true, room: this.toRoomInfo(room) };
  }

  /**
   * "First pick locks both players" (matching reference screenshot 2!)
   * When 2 players are in the room and either player picks a brother,
   * both players are locked to opposite brothers AND the match starts!
   */
  public selectCharacter(
    rawCode: string,
    sessionId: string,
    character: BrotherId,
    autoStartWhenBothPresent = false
  ): { ok: true; room: MultiplayerRoomInfo } | { ok: false; error: string } {
    const room = this.getOrHydrateRoom(rawCode);
    if (!room) return { ok: false, error: 'Room not found' };

    room.lastActivityAt = Date.now();
    const player = room.players.find((p) => p.sessionId === sessionId);
    if (!player) return { ok: false, error: 'Player not in room' };

    const other = room.players.find((p) => p.sessionId !== sessionId);
    const opposite: BrotherId = character === 'bade' ? 'chhote' : 'bade';

    player.character = character;
    if (other) {
      other.character = opposite;
    }

    if (autoStartWhenBothPresent && room.players.length === 2 && room.status === 'lobby') {
      for (const p of room.players) {
        p.ready = true;
      }
      this.startMatch(room.roomCode);
    } else {
      this.saveToDisk();
    }

    return { ok: true, room: this.toRoomInfo(room) };
  }

  public toggleReady(
    rawCode: string,
    sessionId: string,
    ready?: boolean
  ): { ok: true; room: MultiplayerRoomInfo } | { ok: false; error: string } {
    const room = this.getOrHydrateRoom(rawCode);
    if (!room) return { ok: false, error: 'Room not found' };

    room.lastActivityAt = Date.now();
    const player = room.players.find((p) => p.sessionId === sessionId);
    if (!player) return { ok: false, error: 'Player not in room' };

    if (!player.character) {
      const p1 = room.players[0];
      p1.character = p1.character || 'bade';
      if (room.players[1]) {
        room.players[1].character = p1.character === 'bade' ? 'chhote' : 'bade';
      }
    }

    player.ready = ready !== undefined ? ready : !player.ready;

    // If both players are present and ready, start the authoritative match!
    if (room.players.length === 2 && room.players.every((p) => p.ready && p.character)) {
      this.startMatch(room.roomCode);
    } else {
      this.saveToDisk();
    }

    return { ok: true, room: this.toRoomInfo(room) };
  }

  public startMatch(rawCode: string): MultiplayerRoomInfo | null {
    const room = this.getOrHydrateRoom(rawCode);
    if (!room) return null;

    if (room.players.length >= 1 && !room.players[0].character) {
      room.players[0].character = 'bade';
    }
    if (room.players.length >= 2 && !room.players[1].character) {
      room.players[1].character = room.players[0].character === 'bade' ? 'chhote' : 'bade';
    }

    for (const p of room.players) {
      p.ready = true;
    }

    this.initEngineForRoom(room);

    room.status = 'playing';
    room.lastTickTime = Date.now();
    room.lastActivityAt = Date.now();
    room.engine?.triggerBanter('match_start', 'bade', true);

    this.saveToDisk();
    return this.toRoomInfo(room);
  }

  public submitInput(rawCode: string, sessionId: string, dir: Direction): boolean {
    const room = this.getOrHydrateRoom(rawCode);
    if (!room || room.status !== 'playing' || !room.engine) return false;

    const player = room.players.find((p) => p.sessionId === sessionId);
    if (!player || !player.character) return false;

    room.lastActivityAt = Date.now();
    room.engine.queueDirection(player.character, dir);
    return true;
  }

  public requestRematch(rawCode: string, sessionId: string): MultiplayerRoomInfo | null {
    const room = this.getOrHydrateRoom(rawCode);
    if (!room) return null;
    void sessionId;
    return this.startMatch(room.roomCode);
  }

  public leaveRoom(rawCode: string, sessionId: string) {
    const room = this.getOrHydrateRoom(rawCode);
    if (!room) return;
    room.players = room.players.filter((p) => p.sessionId !== sessionId);
    if (room.players.length === 0) {
      this.rooms.delete(room.roomCode);
    } else {
      room.hostSessionId = room.players[0].sessionId;
      room.players[0].isHost = true;
    }
    this.saveToDisk();
  }

  public getRoomState(
    rawCode: string,
    pollingSessionId?: string | null,
    pollingPlayerName?: string | null
  ): {
    room: MultiplayerRoomInfo;
    gameState: SerializedGameState | null;
  } | null {
    const code = normalizeServerRoomCode(rawCode);
    if (!code) return null;

    let room = this.getOrHydrateRoom(code);

    // If a client is actively polling a valid room code with their sessionId
    // and the worker restarted, auto-rehydrate the room and ensure the polling player is registered!
    if (!room && pollingSessionId) {
      this.createRoom(pollingSessionId, pollingPlayerName || 'Indori Badshah', 120, code);
      room = this.rooms.get(code) || null;
    }

    if (!room) return null;

    room.lastActivityAt = Date.now();

    if (pollingSessionId) {
      const existing = room.players.find((p) => p.sessionId === pollingSessionId);
      if (existing) {
        existing.connected = true;
      } else if (room.players.length < 2) {
        // Merge polling player into room if they joined on another worker
        const p1 = room.players[0];
        const autoChar: BrotherId | null =
          p1?.character === 'bade' ? 'chhote' : p1?.character === 'chhote' ? 'bade' : null;
        room.players.push({
          sessionId: pollingSessionId,
          name: pollingPlayerName || 'Jabalpur Badshah',
          character: autoChar,
          ready: false,
          connected: true,
          ping: 22,
          isHost: false,
        });
        this.saveToDisk();
      }
    }

    return {
      room: this.toRoomInfo(room),
      gameState: room.engine ? this.serializeEngine(room) : null,
    };
  }

  private serializeEngine(room: ServerRoomInstance): SerializedGameState {
    const eng = room.engine!;
    const gridBuf = Buffer.from(eng.grid.buffer, eng.grid.byteOffset, eng.grid.byteLength);

    return {
      roomCode: room.roomCode,
      status: room.status,
      timeRemaining: eng.timeRemaining,
      totalDuration: eng.totalDuration,
      registryRushActive: eng.registryRushActive,
      gridBase64: gridBuf.toString('base64'),
      players: {
        bade: {
          x: eng.players.bade.x,
          y: eng.players.bade.y,
          gridX: eng.players.bade.gridX,
          gridY: eng.players.bade.gridY,
          dir: eng.players.bade.dir,
          nextDir: eng.players.bade.nextDir,
          inSafeZone: eng.players.bade.inSafeZone,
          trail: eng.players.bade.trail,
          territoryCells: eng.players.bade.territoryCells,
          territoryPct: eng.players.bade.territoryPct,
          eliminations: eng.players.bade.eliminations,
          deaths: eng.players.bade.deaths,
          largestCapturePct: eng.players.bade.largestCapturePct,
          isEliminated: eng.players.bade.isEliminated,
          respawnTimer: eng.players.bade.respawnTimer,
          expression: eng.players.bade.expression,
          activePowerUp: eng.players.bade.activePowerUp,
          hasShield: eng.players.bade.hasShield,
          slowTimer: eng.players.bade.slowTimer,
        },
        chhote: {
          x: eng.players.chhote.x,
          y: eng.players.chhote.y,
          gridX: eng.players.chhote.gridX,
          gridY: eng.players.chhote.gridY,
          dir: eng.players.chhote.dir,
          nextDir: eng.players.chhote.nextDir,
          inSafeZone: eng.players.chhote.inSafeZone,
          trail: eng.players.chhote.trail,
          territoryCells: eng.players.chhote.territoryCells,
          territoryPct: eng.players.chhote.territoryPct,
          eliminations: eng.players.chhote.eliminations,
          deaths: eng.players.chhote.deaths,
          largestCapturePct: eng.players.chhote.largestCapturePct,
          isEliminated: eng.players.chhote.isEliminated,
          respawnTimer: eng.players.chhote.respawnTimer,
          expression: eng.players.chhote.expression,
          activePowerUp: eng.players.chhote.activePowerUp,
          hasShield: eng.players.chhote.hasShield,
          slowTimer: eng.players.chhote.slowTimer,
        },
      },
      powerUps: eng.powerUps,
      popups: eng.popups,
      bubbles: eng.activeBubbles,
      matchStats: room.matchStats,
    };
  }

  private toRoomInfo(room: ServerRoomInstance): MultiplayerRoomInfo {
    return {
      roomCode: room.roomCode,
      status: room.status,
      players: room.players,
      matchDuration: room.matchDuration,
      hostSessionId: room.hostSessionId,
    };
  }
}

const globalForKabza = globalThis as unknown as {
  __kabzaRoomManager?: AuthoritativeRoomManager;
};

export const kabzaRoomManager =
  globalForKabza.__kabzaRoomManager ||
  (globalForKabza.__kabzaRoomManager = new AuthoritativeRoomManager());
