import { NextRequest, NextResponse } from 'next/server';
import { kabzaRoomManager } from '@/lib/kabza-server-store';
import { BrotherId, Direction } from '@/lib/kabza-types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const sessionId = searchParams.get('sessionId');
  const playerName = searchParams.get('playerName');

  if (!code) {
    return NextResponse.json(
      { ok: false, error: 'Missing room code', hindiError: 'Are Badshah, room code toh daalo!' },
      { status: 400 }
    );
  }

  const state = kabzaRoomManager.getRoomState(code, sessionId, playerName);
  if (!state) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Room not found or expired.',
        hindiError: 'Are Badshah, room mila hi nahi! Code ek baar check kar lo.',
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ok: true,
    room: state.room,
    gameState: state.gameState,
    serverTime: Date.now(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      action,
      roomCode,
      code,
      sessionId,
      playerName,
      name,
      character,
      role,
      ready,
      dir,
      matchDuration,
      autoStart,
    } = body;

    const targetCode = roomCode || code;
    const targetName = playerName || name;
    const targetCharacter = (character || role) as BrotherId;

    if (!sessionId && action !== 'simulate_friend') {
      return NextResponse.json({ ok: false, error: 'Missing sessionId' }, { status: 400 });
    }

    switch (action) {
      case 'create': {
        const room = kabzaRoomManager.createRoom(
          sessionId,
          targetName || 'Indori Badshah',
          matchDuration || 120
        );
        const fullState = kabzaRoomManager.getRoomState(room.roomCode);
        return NextResponse.json({
          ok: true,
          room,
          gameState: fullState?.gameState || null,
          serverTime: Date.now(),
        });
      }

      case 'join': {
        if (!targetCode) {
          return NextResponse.json(
            {
              ok: false,
              error: 'Room code required',
              hindiError: 'Are Badshah, bina room code ke kahan ghusoge?',
            },
            { status: 400 }
          );
        }
        const res = kabzaRoomManager.joinRoom(
          targetCode,
          sessionId,
          targetName || 'Jabalpur Badshah'
        );
        if (!res.ok) {
          return NextResponse.json(res, { status: 400 });
        }
        const fullState = kabzaRoomManager.getRoomState(res.room.roomCode);
        return NextResponse.json({
          ok: true,
          room: res.room,
          gameState: fullState?.gameState || null,
          serverTime: Date.now(),
        });
      }

      case 'simulate_friend': {
        if (!targetCode) {
          return NextResponse.json({ ok: false, error: 'Room code required' }, { status: 400 });
        }
        const res = kabzaRoomManager.addSimulatedFriend(targetCode);
        if (!res.ok) {
          return NextResponse.json(res, { status: 400 });
        }
        const fullState = kabzaRoomManager.getRoomState(res.room.roomCode);
        return NextResponse.json({
          ok: true,
          room: res.room,
          gameState: fullState?.gameState || null,
          serverTime: Date.now(),
        });
      }

      case 'select_character':
      case 'select_brother': {
        const res = kabzaRoomManager.selectCharacter(
          targetCode,
          sessionId,
          targetCharacter,
          Boolean(autoStart)
        );
        if (!res.ok) return NextResponse.json(res, { status: 400 });
        const fullState = kabzaRoomManager.getRoomState(res.room.roomCode);
        return NextResponse.json({
          ok: true,
          room: res.room,
          gameState: fullState?.gameState || null,
        });
      }

      case 'toggle_ready':
      case 'ready': {
        const res = kabzaRoomManager.toggleReady(targetCode, sessionId, ready);
        if (!res.ok) return NextResponse.json(res, { status: 400 });
        const fullState = kabzaRoomManager.getRoomState(res.room.roomCode);
        return NextResponse.json({
          ok: true,
          room: res.room,
          gameState: fullState?.gameState || null,
        });
      }

      case 'start_match': {
        const room = kabzaRoomManager.startMatch(targetCode);
        if (!room) return NextResponse.json({ ok: false, error: 'Room not found' }, { status: 404 });
        const fullState = kabzaRoomManager.getRoomState(room.roomCode);
        return NextResponse.json({
          ok: true,
          room,
          gameState: fullState?.gameState || null,
        });
      }

      case 'input': {
        kabzaRoomManager.submitInput(targetCode, sessionId, dir as Direction);
        const fullState = kabzaRoomManager.getRoomState(targetCode);
        return NextResponse.json({
          ok: true,
          room: fullState?.room || null,
          gameState: fullState?.gameState || null,
          serverTime: Date.now(),
        });
      }

      case 'rematch': {
        const room = kabzaRoomManager.requestRematch(targetCode, sessionId);
        if (!room) return NextResponse.json({ ok: false, error: 'Room not found' }, { status: 404 });
        const fullState = kabzaRoomManager.getRoomState(room.roomCode);
        return NextResponse.json({
          ok: true,
          room,
          gameState: fullState?.gameState || null,
        });
      }

      case 'leave': {
        if (targetCode) {
          kabzaRoomManager.leaveRoom(targetCode, sessionId);
        }
        return NextResponse.json({ ok: true });
      }

      default:
        return NextResponse.json({ ok: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message || 'Server error' },
      { status: 500 }
    );
  }
}
