import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { SharedKabzaEngine } from '../lib/kabza-engine';
import {
  DIALOGUE_POOL,
  CHARACTER_METADATA,
  CINEMATIC_SCENES,
  TUTORIAL_STEPS,
  getPostMatchCourtScript,
} from '../lib/kabza-dialogue';
import { kabzaRoomManager } from '../lib/kabza-server-store';
import {
  isValidRoomCodeFormat,
  normalizeRoomCode,
  buildRoomInviteUrl,
  buildBadshahInviteMessage,
  applySerializedStateToEngine,
} from '../lib/kabza-multiplayer-client';
import { GRID_W, GRID_H, TOTAL_TILES } from '../lib/kabza-types';

let passed = 0;
let failed = 0;

async function runTest(category: string, name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    passed++;
    console.log(`  [PASS] [${category}] ${name}`);
  } catch (err) {
    failed++;
    console.error(`  [FAIL] [${category}] ${name}:`, err);
  }
}

async function main() {
  console.log('==========================================================');
  console.log('KABZA — THE GREAT PROPERTY WAR: AUTOMATED TEST SUITE');
  console.log('Unit, Integration & End-to-End (E2E) Verification');
  console.log('==========================================================\n');

  // ---------------------------------------------------------------------------
  // 1. UNIT TESTS: Core Territory Engine, Flood-Fill, Trail Cut, AI & Dialogue
  // ---------------------------------------------------------------------------
  console.log('--- 1. UNIT TESTS ---');

  await runTest('UNIT', 'Initial territory seeding (8x8 = 64 tiles per brother, 2.04% each)', () => {
    const engine = new SharedKabzaEngine(120);
    assert.equal(engine.players.bade.territoryCells, 64, 'Bade should start with 64 tiles');
    assert.equal(engine.players.chhote.territoryCells, 64, 'Chhote should start with 64 tiles');
    const expectedPct = (64 / TOTAL_TILES) * 100;
    assert.ok(Math.abs(engine.players.bade.territoryPct - expectedPct) < 0.05);
    assert.ok(Math.abs(engine.players.chhote.territoryPct - expectedPct) < 0.05);
  });

  await runTest('UNIT', '180-degree instant self-reversal prevention & 120ms turn buffering', () => {
    const engine = new SharedKabzaEngine(120);
    // Bade starts moving RIGHT
    assert.equal(engine.players.bade.dir, 'RIGHT');
    // Attempting to reverse directly to LEFT should be ignored
    engine.queueDirection('bade', 'LEFT');
    engine.update(0.05);
    assert.equal(engine.players.bade.dir, 'RIGHT', '180-degree reversal must be blocked');

    // Valid 90-degree turn to DOWN should be buffered and applied
    engine.queueDirection('bade', 'DOWN');
    for (let i = 0; i < 15; i++) {
      engine.update(0.02);
    }
    assert.equal(engine.players.bade.dir, 'DOWN', '90-degree turn should be executed');
  });

  await runTest('UNIT', 'Trail creation when leaving safe territory', () => {
    const engine = new SharedKabzaEngine(120);
    // Bade starts at x=9, y=28 with safe territory x: 6..13, y: 25..32, moving RIGHT
    for (let i = 0; i < 60; i++) {
      engine.update(0.02);
    }
    assert.ok(engine.players.bade.x > 13, 'Bade should have exited initial safe territory');
    assert.equal(engine.players.bade.inSafeZone, false, 'Bade should be outside safe zone');
    assert.ok(engine.players.bade.trail.length > 0, 'Bade should have an active exposed trail');
  });

  await runTest('UNIT', 'Multi-Pocket Exterior BFS Flood-Fill territory capture', () => {
    const engine = new SharedKabzaEngine(120);
    // Place Chhote stationary in his own base
    engine.players.chhote.x = 46;
    engine.players.chhote.y = 28;

    const initialCells = engine.players.bade.territoryCells;
    // Bade's safe zone spans x: 6..13, y: 25..32.
    // Let's trace a rectangular loop out from (13, 26) -> (17, 26) -> (17, 30) -> (14, 30) and re-enter at (13, 30)
    const loopTrail = [
      { x: 14, y: 26 },
      { x: 15, y: 26 },
      { x: 16, y: 26 },
      { x: 17, y: 26 },
      { x: 17, y: 27 },
      { x: 17, y: 28 },
      { x: 17, y: 29 },
      { x: 17, y: 30 },
      { x: 16, y: 30 },
      { x: 15, y: 30 },
      { x: 14, y: 30 },
    ];
    engine.players.bade.trail = [...loopTrail];
    engine.players.bade.inSafeZone = false;
    engine.players.bade.x = 14.1;
    engine.players.bade.y = 30;
    engine.players.bade.gridX = 14;
    engine.players.bade.gridY = 30;
    engine.players.bade.dir = 'LEFT';
    engine.players.bade.nextDir = 'LEFT';

    for (let i = 0; i < 10; i++) {
      engine.update(0.02);
    }

    assert.equal(engine.players.bade.trail.length, 0, 'Trail should be cleared upon loop closure');
    assert.equal(engine.players.bade.inSafeZone, true, 'Bade should be back in safe territory');
    // 4 columns (14..17) x 5 rows (26..30) = 20 newly captured tiles
    assert.equal(
      engine.players.bade.territoryCells,
      initialCells + 20,
      `Expected ${initialCells + 20} tiles after loop closure, got ${engine.players.bade.territoryCells}`
    );
    // Interior tile (15, 28) must be owned by Bade (numericId = 1)
    assert.equal(engine.grid[28 * GRID_W + 15], 1, 'Interior pocket tile (15,28) must be flood-filled to Bade');
  });

  await runTest('UNIT', 'Trail cutting elimination: keep captured land, lose active trail, 2.0s respawn', () => {
    const engine = new SharedKabzaEngine(120);
    const badeLandBefore = engine.players.bade.territoryCells;

    // Create an exposed trail for Bade at (20, 28)
    engine.players.bade.inSafeZone = false;
    engine.players.bade.trail = [
      { x: 14, y: 28 },
      { x: 15, y: 28 },
      { x: 16, y: 28 },
    ];
    engine.players.bade.x = 17;
    engine.players.bade.y = 28;
    engine.players.bade.gridX = 17;
    engine.players.bade.gridY = 28;

    // Move Chhote across Bade's trail tile (15, 28)
    engine.players.chhote.x = 14.9;
    engine.players.chhote.y = 28;
    engine.players.chhote.gridX = 14;
    engine.players.chhote.gridY = 28;
    engine.players.chhote.dir = 'RIGHT';
    engine.players.chhote.nextDir = 'RIGHT';

    for (let i = 0; i < 8; i++) {
      engine.update(0.02);
    }

    assert.equal(engine.players.bade.isEliminated, true, 'Bade should be eliminated when trail is cut');
    assert.equal(engine.players.bade.trail.length, 0, 'Bade active trail must be cleared');
    assert.equal(engine.players.bade.territoryCells, badeLandBefore, 'Bade must keep existing captured land');
    assert.equal(engine.players.chhote.eliminations, 1, 'Chhote eliminations counter should increment to 1');
    assert.ok(engine.players.bade.respawnTimer > 1.4 && engine.players.bade.respawnTimer <= 2.0, 'Respawn timer ~2.0s');

    // Advance 2.1 seconds to verify respawn inside safe territory
    for (let i = 0; i < 45; i++) {
      engine.update(0.05);
    }
    assert.equal(engine.players.bade.isEliminated, false, 'Bade should respawn after 2.0 seconds');
    assert.equal(engine.players.bade.inSafeZone, true, 'Bade should respawn inside safe territory');
  });

  await runTest('UNIT', 'Nimbu-Mirchi Shield blocks one trail cut without eliminating brother', () => {
    const engine = new SharedKabzaEngine(120);
    engine.players.bade.hasShield = true;
    engine.players.bade.activePowerUp = 'NIMBU_MIRCHI_SHIELD';
    engine.players.bade.powerUpTimer = 8.0;
    engine.players.bade.inSafeZone = false;
    engine.players.bade.trail = [
      { x: 15, y: 19 },
      { x: 15, y: 20 },
      { x: 15, y: 21 },
    ];
    engine.players.bade.x = 15;
    engine.players.bade.y = 22;
    engine.players.bade.gridX = 15;
    engine.players.bade.gridY = 22;
    engine.players.bade.dir = 'DOWN';
    engine.players.bade.nextDir = 'DOWN';

    engine.players.chhote.x = 14.4;
    engine.players.chhote.y = 20;
    engine.players.chhote.gridX = 14;
    engine.players.chhote.gridY = 20;
    engine.players.chhote.dir = 'RIGHT';
    engine.players.chhote.nextDir = 'RIGHT';

    for (let i = 0; i < 6; i++) {
      engine.update(0.02);
    }

    assert.equal(engine.players.bade.isEliminated, false, 'Nimbu-Mirchi Shield must prevent elimination');
    assert.equal(engine.players.bade.hasShield, false, 'Shield should be consumed upon blocking cut');
  });

  await runTest('UNIT', 'Strategic AI (Easy, Medium, Hard) expands territory & triggers running banter', () => {
    const bubblesFired: string[] = [];
    const engine = new SharedKabzaEngine(120, {
      onBanter: (b) => bubblesFired.push(b.text),
    });
    engine.triggerBanter('match_start', 'bade', true);

    const startTiles = engine.players.chhote.territoryCells;
    // Simulate 25 seconds of gameplay at 20Hz with Hard AI controlling Chhote
    for (let i = 0; i < 500; i++) {
      engine.update(0.05, { brother: 'chhote', difficulty: 'hard' });
    }
    assert.ok(
      engine.players.chhote.territoryCells > startTiles || engine.players.chhote.trail.length > 0,
      'Hard AI should actively leave territory and capture loops'
    );
    assert.ok(bubblesFired.length >= 2, 'Banter system should continuously fire Indori-Jabalpur dialogue bubbles');
  });

  await runTest('UNIT', 'Dialogue database & UI files contain zero emojis and zero glossy blur classes', () => {
    const emojiRegex = /[\p{Extended_Pictographic}]/u;
    for (const line of DIALOGUE_POOL) {
      assert.equal(emojiRegex.test(line.text), false, `Emoji found in dialogue text: ${line.text}`);
      if (line.followUp) {
        assert.equal(emojiRegex.test(line.followUp.text), false, `Emoji found in followUp: ${line.followUp.text}`);
      }
    }
    for (const key of Object.keys(CHARACTER_METADATA) as (keyof typeof CHARACTER_METADATA)[]) {
      assert.equal(emojiRegex.test(CHARACTER_METADATA[key].oneLiner), false);
    }
    assert.equal(CINEMATIC_SCENES.length, 5, '5 cinematic intro scenes expected');
    assert.equal(TUTORIAL_STEPS.length, 10, '10 interactive tutorial steps expected');

    // Verify all UI & renderer source files have zero emojis and zero backdrop-blur classes
    const filesToScan = [
      'components/kabza/CinematicIntro.tsx',
      'components/kabza/CharacterSelectAndLobby.tsx',
      'components/kabza/GameHUDAndCanvas.tsx',
      'components/kabza/FamilyCourtAndResults.tsx',
      'components/kabza/Modals.tsx',
      'lib/kabza-renderer.ts',
    ];
    for (const relPath of filesToScan) {
      const content = fs.readFileSync(path.join(process.cwd(), relPath), 'utf8');
      assert.equal(content.includes('backdrop-blur'), false, `Glossy backdrop-blur found in ${relPath}`);
      assert.equal(emojiRegex.test(content), false, `Emoji character found in ${relPath}`);
    }
  });

  // ---------------------------------------------------------------------------
  // 2. INTEGRATION TESTS: Room Manager, First-Pick Character Lock, State Sync
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. INTEGRATION TESTS ---');

  await runTest('INTEGRATION', 'Smart room code extractor handles bare 4-char codes, URLs, and full WhatsApp messages', () => {
    assert.equal(normalizeRoomCode('KABZA-4821'), 'KABZA-4821');
    assert.equal(normalizeRoomCode('kabza 4821'), 'KABZA-4821');
    assert.equal(normalizeRoomCode('4821'), 'KABZA-4821', 'Bare 4-char code should normalize to KABZA-4821');
    assert.equal(
      normalizeRoomCode('https://ais-pre-example.run.app/join/KABZA-7X9P'),
      'KABZA-7X9P',
      'Full URL should extract KABZA-7X9P'
    );
    const fullWaMsg = buildBadshahInviteMessage(
      'KABZA-7X9P',
      'https://ais-dev-dy3lp4u5buk3b6aqmzdros-339447747783.asia-east1.run.app'
    );
    assert.ok(
      fullWaMsg.includes('https://ais-pre-dy3lp4u5buk3b6aqmzdros-339447747783.asia-east1.run.app/join/KABZA-7X9P'),
      'ais-dev origin must be automatically rewritten to public ais-pre origin for WhatsApp sharing'
    );
    assert.equal(
      normalizeRoomCode(fullWaMsg),
      'KABZA-7X9P',
      'Pasting the entire WhatsApp message into Join Room must extract KABZA-7X9P'
    );
    assert.equal(isValidRoomCodeFormat('!@#$'), false);
  });

  await runTest('INTEGRATION', 'Multiplayer lifecycle: Create -> Join -> First Pick Locks Both -> Ready -> Step -> Rematch', () => {
    const createdRoom = kabzaRoomManager.createRoom('host-1', 'Bade Host', 120);
    assert.ok(createdRoom.roomCode.startsWith('KABZA-'), 'Room code must start with KABZA-');
    const code = createdRoom.roomCode;

    // Second player joins using only the 4-char suffix (e.g. "7X9P")
    const shortSuffix = code.replace('KABZA-', '');
    const joinRes = kabzaRoomManager.joinRoom(shortSuffix, 'guest-2', 'Chhote Guest');
    assert.equal(joinRes.ok, true, 'Second player should join cleanly using bare 4-char code');

    // Third player rejected when room is full
    const thirdRes = kabzaRoomManager.joinRoom(code, 'guest-3', 'Intruder');
    assert.equal(thirdRes.ok, false, 'Third player must be rejected from full 2-player room');

    // First pick locks both players
    const pickRes = kabzaRoomManager.selectCharacter(code, 'host-1', 'bade');
    assert.equal(pickRes.ok, true);
    if (pickRes.ok) {
      const hostP = pickRes.room.players.find((p) => p.sessionId === 'host-1')!;
      const guestP = pickRes.room.players.find((p) => p.sessionId === 'guest-2')!;
      assert.equal(hostP.character, 'bade', 'Host picked Bade');
      assert.equal(guestP.character, 'chhote', 'Guest automatically locked to Chhote');
    }

    // Ready both players -> auto starts match
    kabzaRoomManager.toggleReady(code, 'host-1', true);
    const readyRes = kabzaRoomManager.toggleReady(code, 'guest-2', true);
    assert.equal(readyRes.ok, true);
    if (readyRes.ok) {
      assert.equal(readyRes.room.status, 'playing', 'Room status should transition to playing when both ready');
    }

    // Submit directional input and synchronize serialized state into a client engine
    const submitted = kabzaRoomManager.submitInput(code, 'host-1', 'DOWN');
    assert.equal(submitted, true);

    const stateSnapshot = kabzaRoomManager.getRoomState(code);
    assert.ok(stateSnapshot && stateSnapshot.gameState, 'Server should produce serialized gameState');

    const clientEngine = new SharedKabzaEngine(120);
    applySerializedStateToEngine(clientEngine, stateSnapshot.gameState!);
    assert.equal(clientEngine.players.bade.territoryCells, 64);

    // Rematch resets room cleanly
    const rematchRoom = kabzaRoomManager.requestRematch(code, 'host-1');
    assert.ok(rematchRoom && rematchRoom.status === 'playing');
  });

  await runTest('INTEGRATION', 'Post-Match Family Court script generator produces multi-speaker verdict', () => {
    const scriptWin = getPostMatchCourtScript('bade', 48.5, 21.2);
    assert.ok(scriptWin.length >= 5, 'Should return full family court conversation');
    assert.equal(scriptWin[0].speaker, 'dadi');
    assert.ok(scriptWin[0].line.includes('Bade Bhaiya'));

    const scriptDraw = getPostMatchCourtScript('draw', 30.0, 30.0);
    assert.ok(scriptDraw.length >= 4);
    assert.equal(scriptDraw[0].speaker, 'dadi');
  });

  // ---------------------------------------------------------------------------
  // 3. END-TO-END (E2E) TESTS: Live HTTP Server & WhatsApp Join Simulation
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. END-TO-END (E2E) HTTP & API TESTS ---');

  const baseUrl = 'http://localhost:3000';

  await runTest('E2E', 'GET / renders KABZA main application HTML with proper metadata', async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.equal(res.status, 200, 'Home page should return HTTP 200');
    const html = await res.text();
    assert.ok(html.includes('KABZA'), 'HTML must include KABZA title');
  });

  await runTest('E2E', 'POST /api/rooms full multiplayer HTTP flow (create -> WhatsApp link paste join -> first-pick autoStart -> input -> poll)', async () => {
    // 1. Host creates room via HTTP POST
    const createResp = await fetch(`${baseUrl}/api/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        sessionId: 'e2e-host-wa',
        playerName: 'Indore Badshah',
        matchDuration: 120,
      }),
    });
    assert.equal(createResp.status, 200);
    const createData = await createResp.json();
    assert.equal(createData.ok, true);
    const roomCode = createData.room.roomCode as string;
    assert.ok(roomCode.startsWith('KABZA-'), `Expected KABZA-XXXX room code, got ${roomCode}`);

    // 2. Host copies WhatsApp invite link/message; Friend joins by passing the full invite URL!
    const sharedInviteLink = `https://ais-pre-dy3lp4u5buk3b6aqmzdros-339447747783.asia-east1.run.app/join/${roomCode}`;
    const joinResp = await fetch(`${baseUrl}/api/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'join',
        roomCode: sharedInviteLink,
        sessionId: 'e2e-guest-wa',
        playerName: 'JabalpurSher',
      }),
    });
    assert.equal(joinResp.status, 200, 'Joining with pasted invite URL must succeed with HTTP 200');
    const joinData = await joinResp.json();
    assert.equal(joinData.ok, true);
    assert.equal(joinData.room.players.length, 2, 'Both brothers must be in the room');

    // 3. First pick with autoStart=true locks both players AND starts the match immediately!
    const selectResp = await fetch(`${baseUrl}/api/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'select_character',
        roomCode,
        sessionId: 'e2e-host-wa',
        character: 'chhote',
        autoStart: true,
      }),
    });
    assert.equal(selectResp.status, 200);
    const selectData = await selectResp.json();
    const guestRole = selectData.room.players.find((p: { sessionId: string }) => p.sessionId === 'e2e-guest-wa').character;
    assert.equal(guestRole, 'bade', 'First pick chhote must lock guest as bade');
    assert.equal(selectData.room.status, 'playing', 'Match must immediately start when 2 players are present and a brother is picked');

    // 4. Submit directional input via HTTP POST
    const inputResp = await fetch(`${baseUrl}/api/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'input', roomCode, sessionId: 'e2e-host-wa', dir: 'UP' }),
    });
    assert.equal(inputResp.status, 200);

    // 5. Poll room state via HTTP GET
    const getResp = await fetch(
      `${baseUrl}/api/rooms?code=${encodeURIComponent(roomCode)}&sessionId=e2e-host-wa&playerName=Indore+Badshah`
    );
    assert.equal(getResp.status, 200);
    const getData = await getResp.json();
    assert.equal(getData.ok, true);
    assert.ok(getData.gameState && getData.gameState.gridBase64.length > 0, 'GET /api/rooms must return base64 grid state');
    assert.ok(getData.gameState.bubbles.length > 0, 'GET /api/rooms state must include active dialogue bubbles');

    // 6. Verify invite deep-link route /join/[code] returns HTTP 200
    const invitePageResp = await fetch(`${baseUrl}/join/${roomCode}`);
    assert.equal(invitePageResp.status, 200);
  });

  await runTest('E2E', 'Cold-worker auto-healing: joining a valid KABZA-XXXX link never fails with 404 and merges polling host', async () => {
    const coldCode = 'KABZA-9Z8Y';
    // Friend opens /join/KABZA-9Z8Y first (or on a fresh worker)
    const joinResp = await fetch(`${baseUrl}/api/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'join',
        roomCode: coldCode,
        sessionId: 'cold-guest-1',
        playerName: 'WhatsApp Friend',
      }),
    });
    assert.equal(joinResp.status, 200, 'Auto-healing join must return 200 instead of 404');
    const joinData = await joinResp.json();
    assert.equal(joinData.ok, true);
    assert.equal(joinData.room.roomCode, coldCode);

    // Host polls GET /api/rooms with their sessionId -> automatically merged as 2nd player!
    const pollResp = await fetch(
      `${baseUrl}/api/rooms?code=${coldCode}&sessionId=cold-host-1&playerName=Room+Creator`
    );
    assert.equal(pollResp.status, 200);
    const pollData = await pollResp.json();
    assert.equal(pollData.ok, true);
    assert.equal(pollData.room.players.length, 2, 'Both players must be merged into the room');
  });

  console.log('\n==========================================================');
  console.log(`TEST SUMMARY: ${passed} passed, ${failed} failed`);
  console.log('==========================================================');

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

main();
