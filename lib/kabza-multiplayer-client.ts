'use client';

import {
  BrotherId,
  CharacterExpression,
  Direction,
  MultiplayerRoomInfo,
  PowerUpType,
  TOTAL_TILES,
} from './kabza-types';
import { SerializedGameState } from './kabza-server-store';
import { SharedKabzaEngine } from './kabza-engine';

/**
 * Generates a unique session ID per browser tab/instance.
 * Does NOT rely on sessionStorage (which browsers clone when duplicating a tab,
 * causing Player 1 and Player 2 to collide with the same sessionId).
 */
export function getOrCreateSessionId(): string {
  const rand = Math.random().toString(36).slice(2, 9);
  const time = Date.now().toString(36).slice(-5);
  return `badshah_${time}_${rand}`;
}

/**
 * Smart extractor & normalizer for KABZA room codes.
 * Accepts:
 *  - Standard code: "KABZA-7X9P", "kabza-7x9p"
 *  - Code without hyphen or with spaces: "KABZA 7X9P", "KABZA7X9P"
 *  - Bare 4-6 char code: "7X9P" -> "KABZA-7X9P"
 *  - Full invite URL: "https://.../join/KABZA-7X9P" or "https://.../?room=KABZA-7X9P"
 *  - Full WhatsApp message containing "KABZA-XXXX"
 */
export function normalizeRoomCode(rawInput: string): string | null {
  if (!rawInput) return null;
  const trimmed = decodeURIComponent(rawInput).trim();
  if (!trimmed) return null;

  // 1. Look for explicit hyphenated/underscored KABZA-XXXX pattern anywhere in string (handles URLs & WhatsApp messages)
  const explicitMatch = trimmed.match(/KABZA[\-_]([A-Z0-9]{4,6})/i);
  if (explicitMatch && explicitMatch[1]) {
    return `KABZA-${explicitMatch[1].toUpperCase()}`;
  }

  // 2. Look for /join/XXXX in a URL
  const urlJoinMatch = trimmed.match(/\/join\/([A-Z0-9\-_]{4,14})/i);
  if (urlJoinMatch && urlJoinMatch[1]) {
    const seg = urlJoinMatch[1].toUpperCase().replace(/^KABZA[\s\-_]*/, '');
    if (/^[A-Z0-9]{4,6}$/.test(seg)) {
      return `KABZA-${seg}`;
    }
  }

  // 3. Look for ?room=XXXX query parameter
  const queryMatch = trimmed.match(/[?&]room=([A-Z0-9\-_]{4,14})/i);
  if (queryMatch && queryMatch[1]) {
    const seg = queryMatch[1].toUpperCase().replace(/^KABZA[\s\-_]*/, '');
    if (/^[A-Z0-9]{4,6}$/.test(seg)) {
      return `KABZA-${seg}`;
    }
  }

  // 4. Short input: "KABZA 7X9P" or "KABZA7X9P"
  const shortSpacedMatch = trimmed.match(/^KABZA[\s\-_]*([A-Z0-9]{4,6})$/i);
  if (shortSpacedMatch && shortSpacedMatch[1]) {
    return `KABZA-${shortSpacedMatch[1].toUpperCase()}`;
  }

  // 5. Bare 4-6 alphanumeric characters (e.g. user typed "7X9P" instead of "KABZA-7X9P")
  const cleanedAlnum = trimmed.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (trimmed.length <= 8 && /^[A-Z0-9]{4,6}$/.test(cleanedAlnum)) {
    return `KABZA-${cleanedAlnum}`;
  }

  return null;
}

export function isValidRoomCodeFormat(code: string): boolean {
  return normalizeRoomCode(code) !== null;
}

export function validateRoomCodeInput(rawInput: string): {
  valid: boolean;
  normalized: string;
} {
  const norm = normalizeRoomCode(rawInput);
  return {
    valid: norm !== null,
    normalized: norm || '',
  };
}

export function buildRoomInviteUrl(roomCode: string, customOrigin?: string): string {
  const norm = normalizeRoomCode(roomCode) || roomCode.trim().toUpperCase();
  let origin =
    customOrigin ||
    (typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');

  // In AI Studio, "ais-dev-..." requires creator authentication and cannot be opened
  // by external friends on WhatsApp. Rewrite "ais-dev-" to the public "ais-pre-" shared URL.
  if (origin.includes('://ais-dev-')) {
    origin = origin.replace('://ais-dev-', '://ais-pre-');
  }

  return `${origin.replace(/\/$/, '')}/join/${norm}`;
}

export function buildBadshahInviteMessage(roomCode: string, customOrigin?: string): string {
  const code = normalizeRoomCode(roomCode) || roomCode.trim().toUpperCase();
  const joinUrl = buildRoomInviteUrl(code, customOrigin);
  return `Are Badshah! Pushtaini property ka faisla karna hai. KABZA mein aa jao. Room mein join karo aur dekhte hain asli malik kaun hai!\n\nRoom Code: ${code}\n\nJoin here: ${joinUrl}`;
}

export function buildWhatsAppInviteUrl(roomCode: string, customOrigin?: string): string {
  const msg = buildBadshahInviteMessage(roomCode, customOrigin);
  return `https://wa.me/?text=${encodeURIComponent(msg)}`;
}

export function applySerializedStateToEngine(
  engine: SharedKabzaEngine,
  state: SerializedGameState,
  onNewBubble?: (b: SerializedGameState['bubbles'][number]) => void,
  seenBubbleIds?: Set<string>
) {
  engine.timeRemaining = state.timeRemaining;
  engine.totalDuration = state.totalDuration;
  engine.registryRushActive = state.registryRushActive;
  engine.isFinished = state.status === 'finished';

  // Decode base64 grid into Uint8Array
  if (state.gridBase64) {
    try {
      const bin =
        typeof atob === 'function'
          ? atob(state.gridBase64)
          : Buffer.from(state.gridBase64, 'base64').toString('binary');
      const len = Math.min(bin.length, TOTAL_TILES);
      for (let i = 0; i < len; i++) {
        engine.grid[i] = bin.charCodeAt(i);
      }
    } catch {
      // ignore malformed frame
    }
  }

  for (const id of ['bade', 'chhote'] as BrotherId[]) {
    const sp = state.players[id];
    const lp = engine.players[id];
    if (!sp || !lp) continue;

    // Smooth positional interpolation for remote rendering
    if (Math.hypot(sp.x - lp.x, sp.y - lp.y) > 2.5) {
      lp.x = sp.x;
      lp.y = sp.y;
    } else {
      lp.x = lp.x + (sp.x - lp.x) * 0.65;
      lp.y = lp.y + (sp.y - lp.y) * 0.65;
    }

    lp.gridX = sp.gridX;
    lp.gridY = sp.gridY;
    lp.dir = sp.dir;
    lp.nextDir = sp.nextDir;
    lp.inSafeZone = sp.inSafeZone;
    lp.trail = sp.trail;
    lp.territoryCells = sp.territoryCells;
    lp.territoryPct = sp.territoryPct;
    lp.eliminations = sp.eliminations;
    lp.deaths = sp.deaths;
    lp.largestCapturePct = sp.largestCapturePct;
    lp.isEliminated = sp.isEliminated;
    lp.respawnTimer = sp.respawnTimer;
    lp.expression = sp.expression as CharacterExpression;
    lp.activePowerUp = sp.activePowerUp as PowerUpType | null;
    lp.hasShield = sp.hasShield;
    lp.slowTimer = sp.slowTimer;
  }

  engine.powerUps = state.powerUps.map((pu) => ({
    ...pu,
    type: pu.type as PowerUpType,
  }));
  engine.popups = state.popups;
  engine.activeBubbles = state.bubbles;

  if (onNewBubble && seenBubbleIds) {
    for (const b of state.bubbles) {
      if (!seenBubbleIds.has(b.id)) {
        seenBubbleIds.add(b.id);
        onNewBubble(b);
      }
    }
  }
}

export class KabzaMultiplayerClient {
  public sessionId: string;
  public playerName = 'Indori Badshah';
  public roomCode: string | null = null;
  public pingMs = 24;

  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private onRoomUpdate?: (room: MultiplayerRoomInfo, gameState: SerializedGameState | null) => void;
  private onError?: (err: string, hindiErr: string) => void;

  constructor(callbacks?: {
    onRoomUpdate?: (room: MultiplayerRoomInfo, gameState: SerializedGameState | null) => void;
    onError?: (err: string, hindiErr: string) => void;
  }) {
    this.sessionId = getOrCreateSessionId();
    this.onRoomUpdate = callbacks?.onRoomUpdate;
    this.onError = callbacks?.onError;
  }

  public setCallbacks(callbacks: {
    onRoomUpdate?: (room: MultiplayerRoomInfo, gameState: SerializedGameState | null) => void;
    onError?: (err: string, hindiErr: string) => void;
  }) {
    this.onRoomUpdate = callbacks.onRoomUpdate;
    this.onError = callbacks.onError;
  }

  public async createRoom(
    playerName: string,
    matchDuration: 60 | 120 | 180
  ): Promise<{ ok: true; room: MultiplayerRoomInfo } | { ok: false; error: string }> {
    try {
      this.playerName = playerName.trim() || 'Indori Badshah';
      const t0 = performance.now();
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          sessionId: this.sessionId,
          playerName: this.playerName,
          matchDuration,
        }),
      });
      const data = await res.json();
      this.pingMs = Math.max(8, Math.round(performance.now() - t0));

      if (!data.ok) {
        return { ok: false, error: data.hindiError || data.error || 'Failed to create room' };
      }

      this.roomCode = data.room.roomCode;
      this.startSyncLoop();
      this.onRoomUpdate?.(data.room, data.gameState || null);
      return { ok: true, room: data.room };
    } catch {
      return {
        ok: false,
        error: 'Are Badshah, server se sampark nahi ho paya! Connection check kar lo.',
      };
    }
  }

  public async joinRoom(
    rawCode: string,
    playerName: string
  ): Promise<{ ok: true; room: MultiplayerRoomInfo } | { ok: false; error: string; hindiError: string }> {
    const normalized = normalizeRoomCode(rawCode);
    if (!normalized) {
      return {
        ok: false,
        error: 'Invalid room code format (Expected KABZA-XXXX).',
        hindiError: 'Are Badshah, code ka format galat hai! KABZA-XXXX ya 4-ank ka code daalo.',
      };
    }

    try {
      this.playerName = playerName.trim() || 'Jabalpur Badshah';
      const t0 = performance.now();
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'join',
          roomCode: normalized,
          sessionId: this.sessionId,
          playerName: this.playerName,
        }),
      });
      const data = await res.json();
      this.pingMs = Math.max(8, Math.round(performance.now() - t0));

      if (!data.ok) {
        return {
          ok: false,
          error: data.error || 'Could not join room',
          hindiError:
            data.hindiError || 'Are Badshah, room mein jagah nahi hai! Naya room bana lo.',
        };
      }

      this.roomCode = data.room.roomCode;
      this.startSyncLoop();
      this.onRoomUpdate?.(data.room, data.gameState || null);
      return { ok: true, room: data.room };
    } catch {
      return {
        ok: false,
        error: 'Network error while joining room.',
        hindiError: 'Are Badshah, network hil gaya! Ek baar retry maaro.',
      };
    }
  }

  public async selectCharacter(character: BrotherId, autoStart = false) {
    if (!this.roomCode) return;
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'select_character',
          roomCode: this.roomCode,
          sessionId: this.sessionId,
          character,
          autoStart,
        }),
      });
      const data = await res.json();
      if (data.ok && data.room) {
        this.onRoomUpdate?.(data.room, data.gameState || null);
      }
    } catch {
      // ignore
    }
  }

  public async simulateFriendAndStart() {
    if (!this.roomCode) return;
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'simulate_friend',
          roomCode: this.roomCode,
          sessionId: this.sessionId,
        }),
      });
      const data = await res.json();
      if (data.ok && data.room) {
        this.onRoomUpdate?.(data.room, data.gameState || null);
        await this.startMatchNow();
      }
    } catch {
      // ignore
    }
  }

  public async toggleReady(ready?: boolean) {
    if (!this.roomCode) return;
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_ready',
          roomCode: this.roomCode,
          sessionId: this.sessionId,
          ready,
        }),
      });
      const data = await res.json();
      if (data.ok && data.room) {
        this.onRoomUpdate?.(data.room, data.gameState || null);
      }
    } catch {
      // ignore
    }
  }

  public async startMatchNow() {
    if (!this.roomCode) return;
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start_match',
          roomCode: this.roomCode,
          sessionId: this.sessionId,
        }),
      });
      const data = await res.json();
      if (data.ok && data.room) {
        this.onRoomUpdate?.(data.room, data.gameState || null);
      }
    } catch {
      // ignore
    }
  }

  public async sendDirection(dir: Direction) {
    if (!this.roomCode) return;
    try {
      const t0 = performance.now();
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'input',
          roomCode: this.roomCode,
          sessionId: this.sessionId,
          dir,
        }),
      });
      const data = await res.json();
      this.pingMs = Math.max(8, Math.round(performance.now() - t0));
      if (data.ok && data.room) {
        this.onRoomUpdate?.(data.room, data.gameState || null);
      }
    } catch {
      // ignore transient error
    }
  }

  public async requestRematch() {
    if (!this.roomCode) return;
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rematch',
          roomCode: this.roomCode,
          sessionId: this.sessionId,
        }),
      });
      const data = await res.json();
      if (data.ok && data.room) {
        this.onRoomUpdate?.(data.room, data.gameState || null);
      }
    } catch {
      // ignore
    }
  }

  public startSyncLoop() {
    this.stopSyncLoop();
    this.pollTimer = setInterval(async () => {
      if (!this.roomCode) return;
      try {
        const t0 = performance.now();
        const url = `/api/rooms?code=${encodeURIComponent(this.roomCode)}&sessionId=${encodeURIComponent(
          this.sessionId
        )}&playerName=${encodeURIComponent(this.playerName)}`;
        const res = await fetch(url, {
          cache: 'no-store',
        });
        const data = await res.json();
        this.pingMs = Math.max(8, Math.round(performance.now() - t0));

        if (data.ok && data.room) {
          this.onRoomUpdate?.(data.room, data.gameState || null);
        }
      } catch {
        // ignore transient poll hiccup
      }
    }, 90);
  }

  public stopSyncLoop() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  public async disconnect() {
    const code = this.roomCode;
    this.stopSyncLoop();
    this.roomCode = null;
    if (code) {
      try {
        await fetch('/api/rooms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'leave',
            roomCode: code,
            sessionId: this.sessionId,
          }),
        });
      } catch {
        // ignore
      }
    }
  }
}
