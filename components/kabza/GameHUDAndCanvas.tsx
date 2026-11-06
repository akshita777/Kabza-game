'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  LogOut,
  HelpCircle,
  Pause,
  Play,
  Settings,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  FastForward,
  Flame,
  Skull,
  Wifi,
  MessageSquare,
  Volume2,
} from 'lucide-react';
import {
  AIDifficulty,
  ActiveSpeechBubble,
  ASSET_PATHS,
  BrotherId,
  CharacterSpeaker,
  Direction,
  GRID_H,
  GRID_W,
  GameMode,
  GameSettings,
  MatchStats,
} from '@/lib/kabza-types';
import { SharedKabzaEngine } from '@/lib/kabza-engine';
import { KabzaCourtyardRenderer } from '@/lib/kabza-renderer';
import { CHARACTER_METADATA, TUTORIAL_STEPS } from '@/lib/kabza-dialogue';
import { kabzaAudio } from '@/lib/kabza-audio';
import {
  KabzaMultiplayerClient,
  applySerializedStateToEngine,
} from '@/lib/kabza-multiplayer-client';
import { SerializedGameState } from '@/lib/kabza-server-store';

interface GameHUDAndCanvasProps {
  mode: GameMode;
  localBrother: BrotherId;
  aiDifficulty: AIDifficulty;
  settings: GameSettings;
  mpClient?: KabzaMultiplayerClient | null;
  latestServerState?: SerializedGameState | null;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  onLeaveMatch: () => void;
  onMatchFinished: (stats: MatchStats) => void;
}

const PORTRAIT_BY_SPEAKER: Record<CharacterSpeaker, string> = {
  bade: ASSET_PATHS.badePortrait,
  chhote: ASSET_PATHS.chhotePortrait,
  dadi: ASSET_PATHS.dadiPortrait,
  mummy: ASSET_PATHS.mummyPortrait,
  sharma: ASSET_PATHS.bungalowHero,
  gupta: ASSET_PATHS.bungalowHero,
};

export default function GameHUDAndCanvas({
  mode,
  localBrother,
  aiDifficulty,
  settings,
  mpClient,
  latestServerState,
  onOpenSettings,
  onOpenHelp,
  onLeaveMatch,
  onMatchFinished,
}: GameHUDAndCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const minimapRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<SharedKabzaEngine | null>(null);
  const rendererRef = useRef<KabzaCourtyardRenderer | null>(null);
  const seenBubbleIdsRef = useRef<Set<string>>(new Set());

  const [hudState, setHudState] = useState({
    badePct: 2.0,
    chhotePct: 2.0,
    badeKills: 0,
    chhoteKills: 0,
    timeRemaining: settings.matchDuration as number,
    isPaused: false,
    registryRush: false,
    localEliminated: false,
    localRespawnSec: 0,
    activePowerUpLabel: null as string | null,
  });

  // Keep a live running history of the last 3 small dialogue boxes so banter is always visible on screen!
  const [dialogueFeed, setDialogueFeed] = useState<ActiveSpeechBubble[]>([]);
  const [tutorialIdx, setTutorialIdx] = useState(0);
  const tutorialProgressRef = useRef({
    stepsMoved: 0,
    leftSafe: false,
    maxTrailLen: 0,
    loopsClosed: 0,
    killsMade: 0,
  });

  const shakeRef = useRef({ intensity: 0, hitStopUntil: 0 });
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const pushToDialogueFeed = useCallback((bubble: ActiveSpeechBubble) => {
    setDialogueFeed((prev) => {
      if (prev.some((item) => item.id === bubble.id)) return prev;
      return [...prev.slice(-2), bubble];
    });
  }, []);

  const initEngine = useCallback(() => {
    const duration = mode === 'tutorial' ? 180 : settings.matchDuration;
    const eng = new SharedKabzaEngine(duration, {
      onBanter: (bubble) => {
        pushToDialogueFeed(bubble);
        kabzaAudio.speakDialogue(bubble.speaker, bubble.text);
      },
      onSFX: (sfxType) => {
        kabzaAudio.playSFX(sfxType);
        if (sfxType === 'trail_cut') {
          tutorialProgressRef.current.killsMade += 1;
        }
        if (sfxType === 'capture_small' || sfxType === 'capture_large') {
          tutorialProgressRef.current.loopsClosed += 1;
        }
      },
      onScreenShake: (intensity, hitStopMs = 0) => {
        if (!kabzaAudio.getSettings().reducedMotion) {
          shakeRef.current.intensity = intensity;
          if (hitStopMs > 0) {
            shakeRef.current.hitStopUntil = performance.now() + hitStopMs;
          }
        }
      },
      onMatchEnd: (stats) => {
        kabzaAudio.stopMusic();
        onMatchFinished(stats);
      },
    });

    engineRef.current = eng;
    if (!rendererRef.current) {
      rendererRef.current = new KabzaCourtyardRenderer();
    }

    kabzaAudio.startMusic('gameplay');
    eng.triggerBanter('match_start', localBrother, true);
  }, [mode, settings.matchDuration, localBrother, onMatchFinished, pushToDialogueFeed]);

  useEffect(() => {
    initEngine();
    return () => {
      kabzaAudio.stopMusic();
    };
  }, [initEngine]);

  useEffect(() => {
    if (mode !== 'online_multiplayer' || !latestServerState || !engineRef.current) return;

    applySerializedStateToEngine(
      engineRef.current,
      latestServerState,
      (newBubble) => {
        pushToDialogueFeed(newBubble);
        kabzaAudio.speakDialogue(newBubble.speaker, newBubble.text);
      },
      seenBubbleIdsRef.current
    );

    if (latestServerState.status === 'finished' && latestServerState.matchStats) {
      kabzaAudio.stopMusic();
      onMatchFinished(latestServerState.matchStats);
    }
  }, [mode, latestServerState, onMatchFinished, pushToDialogueFeed]);

  const handleDirectionInput = useCallback(
    (brother: BrotherId, dir: Direction) => {
      const eng = engineRef.current;
      if (!eng) return;

      tutorialProgressRef.current.stepsMoved += 1;

      if (mode === 'online_multiplayer' && mpClient) {
        eng.queueDirection(brother, dir);
        mpClient.sendDirection(dir);
      } else {
        eng.queueDirection(brother, dir);
      }
    },
    [mode, mpClient]
  );

  // Trigger an instant manual taunt / banter box when clicking "Taana Maaro" or pressing Space/T
  const handleManualTaunt = useCallback(() => {
    if (!engineRef.current) return;
    kabzaAudio.playSFX('click');
    engineRef.current.triggerBanter('small_capture', localBrother, true);
  }, [localBrother]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space'].includes(
          e.code
        )
      ) {
        e.preventDefault();
      }

      if (e.code === 'Escape') {
        if (mode !== 'online_multiplayer' && engineRef.current) {
          engineRef.current.isPaused = !engineRef.current.isPaused;
          setHudState((prev) => ({ ...prev, isPaused: engineRef.current!.isPaused }));
        }
        return;
      }

      if (e.code === 'Space' || e.code === 'KeyT') {
        handleManualTaunt();
        return;
      }

      if (mode === 'couch_2p') {
        switch (e.code) {
          case 'KeyW':
            handleDirectionInput('bade', 'UP');
            break;
          case 'KeyS':
            handleDirectionInput('bade', 'DOWN');
            break;
          case 'KeyA':
            handleDirectionInput('bade', 'LEFT');
            break;
          case 'KeyD':
            handleDirectionInput('bade', 'RIGHT');
            break;
          case 'ArrowUp':
            handleDirectionInput('chhote', 'UP');
            break;
          case 'ArrowDown':
            handleDirectionInput('chhote', 'DOWN');
            break;
          case 'ArrowLeft':
            handleDirectionInput('chhote', 'LEFT');
            break;
          case 'ArrowRight':
            handleDirectionInput('chhote', 'RIGHT');
            break;
        }
      } else {
        switch (e.code) {
          case 'KeyW':
          case 'ArrowUp':
            handleDirectionInput(localBrother, 'UP');
            break;
          case 'KeyS':
          case 'ArrowDown':
            handleDirectionInput(localBrother, 'DOWN');
            break;
          case 'KeyA':
          case 'ArrowLeft':
            handleDirectionInput(localBrother, 'LEFT');
            break;
          case 'KeyD':
          case 'ArrowRight':
            handleDirectionInput(localBrother, 'RIGHT');
            break;
        }
      }
    };

    window.addEventListener('keydown', onKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mode, localBrother, handleDirectionInput, handleManualTaunt]);

  useEffect(() => {
    let animId = 0;
    let lastTime = performance.now();
    let hudSyncAccum = 0;

    const loop = (now: number) => {
      animId = requestAnimationFrame(loop);

      const rawDt = (now - lastTime) / 1000;
      lastTime = now;

      const eng = engineRef.current;
      const renderer = rendererRef.current;
      const canvas = canvasRef.current;
      if (!eng || !renderer || !canvas) return;

      if (now < shakeRef.current.hitStopUntil) {
        return;
      }

      const rivalId: BrotherId = localBrother === 'bade' ? 'chhote' : 'bade';

      if (mode !== 'online_multiplayer') {
        const aiConfig =
          mode === 'vs_ai'
            ? { brother: rivalId, difficulty: aiDifficulty }
            : mode === 'tutorial'
              ? { brother: rivalId, difficulty: 'easy' as AIDifficulty }
              : undefined;
        eng.update(rawDt, aiConfig);
      }

      if (eng.registryRushActive) {
        kabzaAudio.startMusic('rush');
      }

      if (mode === 'tutorial') {
        const lp = eng.players[localBrother];
        if (!lp.inSafeZone) tutorialProgressRef.current.leftSafe = true;
        if (lp.trail.length > tutorialProgressRef.current.maxTrailLen) {
          tutorialProgressRef.current.maxTrailLen = lp.trail.length;
        }

        setTutorialIdx((currIdx) => {
          const prog = tutorialProgressRef.current;
          if (currIdx === 0 && prog.stepsMoved >= 3) return 1;
          if (currIdx === 1 && prog.stepsMoved >= 6) return 2;
          if (currIdx === 2 && prog.leftSafe) return 3;
          if (currIdx === 3 && prog.maxTrailLen >= 5) return 4;
          if (currIdx === 4 && prog.loopsClosed >= 1) return 5;
          if (currIdx === 5 && lp.territoryPct >= 6.5) return 6;
          if (currIdx === 6 && prog.loopsClosed >= 2) return 7;
          if (currIdx === 7 && (prog.killsMade >= 1 || lp.territoryPct >= 12)) return 8;
          if (currIdx === 8 && lp.territoryPct >= 15.5) return 9;
          if (currIdx === 9 && lp.territoryPct >= 20.0) {
            eng.finishMatch();
          }
          return currIdx;
        });
      }

      let shakeX = 0;
      let shakeY = 0;
      if (shakeRef.current.intensity > 0.2) {
        shakeX = (Math.random() - 0.5) * shakeRef.current.intensity * 2;
        shakeY = (Math.random() - 0.5) * shakeRef.current.intensity * 2;
        shakeRef.current.intensity *= 0.86;
      } else {
        shakeRef.current.intensity = 0;
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== Math.floor(rect.width * dpr) || canvas.height !== Math.floor(rect.height * dpr)) {
        canvas.width = Math.floor(rect.width * dpr);
        canvas.height = Math.floor(rect.height * dpr);
      }

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.save();
        ctx.scale(dpr, dpr);
        renderer.render(
          ctx,
          rect.width,
          rect.height,
          eng,
          localBrother,
          mode === 'couch_2p',
          rawDt,
          { x: shakeX, y: shakeY }
        );
        ctx.restore();
      }

      if (minimapRef.current && settings.showMinimap) {
        const mCtx = minimapRef.current.getContext('2d');
        if (mCtx) {
          renderMinimap(mCtx, minimapRef.current.width, minimapRef.current.height, eng);
        }
      }

      hudSyncAccum += rawDt;
      if (hudSyncAccum >= 0.08) {
        hudSyncAccum = 0;
        const lp = eng.players[localBrother];
        setHudState({
          badePct: Number(eng.players.bade.territoryPct.toFixed(1)),
          chhotePct: Number(eng.players.chhote.territoryPct.toFixed(1)),
          badeKills: eng.players.bade.eliminations,
          chhoteKills: eng.players.chhote.eliminations,
          timeRemaining: eng.timeRemaining,
          isPaused: eng.isPaused,
          registryRush: eng.registryRushActive,
          localEliminated: lp.isEliminated,
          localRespawnSec: Number(lp.respawnTimer.toFixed(1)),
          activePowerUpLabel: lp.activePowerUp
            ? lp.activePowerUp === 'CHAI_SPEED'
              ? `Kadak Chai (${lp.powerUpTimer.toFixed(0)}s)`
              : `Nimbu Shield (${lp.powerUpTimer.toFixed(0)}s)`
            : lp.slowTimer > 0
              ? `Stay Order Slow (${lp.slowTimer.toFixed(0)}s)`
              : null,
        });

        for (const b of eng.activeBubbles) {
          pushToDialogueFeed(b);
        }
      }
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [mode, localBrother, aiDifficulty, settings.showMinimap, pushToDialogueFeed]);

  const formatTimer = (sec: number) => {
    const s = Math.max(0, Math.ceil(sec));
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${rem < 10 ? '0' : ''}${rem}`;
  };

  const togglePause = () => {
    kabzaAudio.playSFX('click');
    if (mode === 'online_multiplayer') return;
    if (engineRef.current) {
      engineRef.current.isPaused = !engineRef.current.isPaused;
      setHudState((prev) => ({ ...prev, isPaused: engineRef.current!.isPaused }));
    }
  };

  const handleRestartMatch = () => {
    kabzaAudio.playSFX('start');
    tutorialProgressRef.current = {
      stepsMoved: 0,
      leftSafe: false,
      maxTrailLen: 0,
      loopsClosed: 0,
      killsMade: 0,
    };
    setTutorialIdx(0);
    initEngine();
  };

  const activeTutorialStep = TUTORIAL_STEPS[Math.min(tutorialIdx, TUTORIAL_STEPS.length - 1)];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#1A1512] select-none touch-none">
      {/* Main 2.5D Courtyard Canvas */}
      <canvas
        ref={canvasRef}
        onTouchStart={(e) => {
          const t = e.touches[0];
          if (t) touchStartRef.current = { x: t.clientX, y: t.clientY };
        }}
        onTouchMove={(e) => {
          const t = e.touches[0];
          const start = touchStartRef.current;
          if (!t || !start) return;
          const dx = t.clientX - start.x;
          const dy = t.clientY - start.y;
          if (Math.hypot(dx, dy) > 22) {
            if (Math.abs(dx) > Math.abs(dy)) {
              handleDirectionInput(localBrother, dx > 0 ? 'RIGHT' : 'LEFT');
            } else {
              handleDirectionInput(localBrother, dy > 0 ? 'DOWN' : 'UP');
            }
            touchStartRef.current = { x: t.clientX, y: t.clientY };
          }
        }}
        className="w-full h-full block cursor-crosshair"
      />

      {/* TOP BAR & SCOREBOARD HUD (MATTE COMIC STYLE, ZERO EMOJIS) */}
      <div className="fixed top-0 inset-x-0 z-30 pointer-events-none flex flex-col">
        <div className="flex items-center justify-between px-3 sm:px-5 pt-2.5 pb-1.5 bg-[#1A1512]/90 border-b-2 border-[#1A1512]">
          <button
            onClick={() => {
              kabzaAudio.playSFX('click');
              onLeaveMatch();
            }}
            className="pointer-events-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1A1512] hover:bg-[#2E221D] text-[#F87171] font-display font-extrabold text-xs sm:text-sm border-2 border-[#F87171]/60 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 rotate-180" />
            <span>LEAVE</span>
          </button>

          <div className="pointer-events-auto flex items-center gap-2">
            <button
              onClick={handleManualTaunt}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EFE4CE] hover:bg-[#FDE68A] text-[#1A1512] font-display font-extrabold text-xs border-2 border-[#1A1512] cursor-pointer"
              title="Trigger Indori-Jabalpur Taunt (Space / T)"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#B83B2B]" />
              <span>TAANA MAARO</span>
            </button>

            <button
              onClick={() => {
                kabzaAudio.playSFX('click');
                onOpenHelp();
              }}
              className="w-9 h-9 rounded-full bg-[#1A1512] hover:bg-[#2E221D] text-white border-2 border-white/40 flex items-center justify-center font-extrabold cursor-pointer"
              title="How to Play"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {mode !== 'online_multiplayer' && (
              <button
                onClick={togglePause}
                className="w-9 h-9 rounded-full bg-[#1A1512] hover:bg-[#2E221D] text-white border-2 border-white/40 flex items-center justify-center cursor-pointer"
                title={hudState.isPaused ? 'Resume' : 'Pause'}
              >
                {hudState.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </button>
            )}

            <button
              onClick={() => {
                kabzaAudio.playSFX('click');
                onOpenSettings();
              }}
              className="w-9 h-9 rounded-full bg-[#1A1512] hover:bg-[#2E221D] text-white border-2 border-white/40 flex items-center justify-center cursor-pointer"
              title="Settings & Audio"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Brother vs Brother Scoreboard Row */}
        <div className="flex items-start justify-between px-2 sm:px-5 pt-2">
          {/* LEFT: BADE PORTRAIT + GREEN BANNER + ELIMINATIONS */}
          <div className="flex flex-col items-start">
            <div className="flex items-center">
              <div className="relative z-10 w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-3 border-[#4E9F3D] bg-[#D8F3DC]">
                <img
                  src={ASSET_PATHS.badePortrait}
                  alt="Bade"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="-ml-3 flex flex-col">
                <div className="pl-5 pr-5 py-1 bg-[#4B833B] border-2 border-[#1A1512] rounded-r-2xl">
                  <span className="font-display font-extrabold text-xl sm:text-2xl text-white drop-shadow-[0_2px_0_#1A1512] tabular-nums">
                    {Math.round(hudState.badePct)}%
                  </span>
                </div>
                <div className="pl-5 pr-3 py-0.5 bg-[#1A1512] text-white rounded-br-xl w-fit flex items-center gap-1 text-xs font-mono font-extrabold">
                  <span>{hudState.badeKills}</span>
                  <Skull className="w-3.5 h-3.5 text-[#D1D5DB]" />
                </div>
              </div>
            </div>

            <div className="mt-1.5 ml-1 px-2 py-0.5 rounded bg-[#1A1512] text-[#FACC15] border border-[#1A1512] font-mono font-bold text-[11px] flex items-center gap-1.5">
              <Wifi className="w-3 h-3" />
              <span>
                {mode === 'online_multiplayer'
                  ? `${mpClient?.pingMs || 24}ms`
                  : mode === 'vs_ai'
                    ? `AI: ${aiDifficulty.toUpperCase()}`
                    : mode === 'couch_2p'
                      ? '2P COUCH'
                      : 'TUTORIAL'}
              </span>
            </div>
          </div>

          {/* CENTER: DIGITAL COUNTDOWN TIMER + LIVE TUG-OF-WAR BAR */}
          <div className="flex flex-col items-center">
            <div
              className={`px-5 py-1.5 rounded-xl border-3 font-mono font-extrabold text-xl sm:text-2xl tracking-wider tabular-nums transition-colors ${
                hudState.timeRemaining <= 10
                  ? 'bg-[#7F1D1D] border-[#EF4444] text-white animate-pulse'
                  : 'bg-[#1E293B] border-[#EAB308] text-[#A7F3D0]'
              }`}
            >
              {formatTimer(hudState.timeRemaining)}
            </div>

            <div className="w-32 sm:w-44 h-3 rounded-sm bg-[#E3CFA8] border-2 border-[#1A1512] overflow-hidden flex mt-1.5">
              <div
                className="h-full bg-[#4E9F3D] transition-all duration-150"
                style={{ width: `${Math.min(100, hudState.badePct)}%` }}
              />
              <div className="flex-1 bg-[#E3CFA8]" />
              <div
                className="h-full bg-[#B83B2B] transition-all duration-150"
                style={{ width: `${Math.min(100, hudState.chhotePct)}%` }}
              />
            </div>

            {hudState.registryRush && (
              <div className="mt-1 px-2.5 py-0.5 rounded bg-[#EF4444] text-white font-display font-extrabold text-[10px] tracking-wider flex items-center gap-1 border border-[#1A1512]">
                <Flame className="w-3 h-3 fill-current" />
                <span>REGISTRY RUSH 1.15x</span>
              </div>
            )}

            {hudState.activePowerUpLabel && (
              <div className="mt-1 px-2.5 py-0.5 rounded bg-[#F59E0B] text-[#1A1512] font-bold text-[11px] border-2 border-[#1A1512]">
                {hudState.activePowerUpLabel}
              </div>
            )}
          </div>

          {/* RIGHT: CHHOTE PORTRAIT + RED BANNER + ELIMINATIONS */}
          <div className="flex flex-col items-end">
            <div className="flex items-center">
              <div className="-mr-3 flex flex-col items-end">
                <div className="pl-5 pr-5 py-1 bg-[#A94438] border-2 border-[#1A1512] rounded-l-2xl">
                  <span className="font-display font-extrabold text-xl sm:text-2xl text-white drop-shadow-[0_2px_0_#1A1512] tabular-nums">
                    {Math.round(hudState.chhotePct)}%
                  </span>
                </div>
                <div className="pl-3 pr-5 py-0.5 bg-[#1A1512] text-white rounded-bl-xl w-fit flex items-center gap-1 text-xs font-mono font-extrabold">
                  <span>{hudState.chhoteKills}</span>
                  <Skull className="w-3.5 h-3.5 text-[#D1D5DB]" />
                </div>
              </div>
              <div className="relative z-10 w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-3 border-[#E05A47] bg-[#FFDAD6]">
                <img
                  src={ASSET_PATHS.chhotePortrait}
                  alt="Chhote"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* INTERACTIVE 10-STEP TUTORIAL BANNER                                   */}
      {/* ===================================================================== */}
      {mode === 'tutorial' && activeTutorialStep && (
        <div className="fixed top-28 inset-x-0 z-30 flex justify-center px-4 pointer-events-none">
          <div className="pointer-events-auto max-w-xl w-full bg-[#EFE4CE] text-[#1A1512] border-3 border-[#1A1512] rounded-xl shadow-[4px_4px_0_#1A1512] p-3.5 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-[#2E6F40] text-white font-mono font-extrabold text-[11px]">
                  STEP {activeTutorialStep.step}/10
                </span>
                <span className="font-display font-extrabold text-sm">
                  {activeTutorialStep.title}
                </span>
              </div>
              <p className="text-xs font-bold text-[#B45309] italic">
                “{activeTutorialStep.dialogue}”
              </p>
              <p className="text-xs text-[#2D241E]">{activeTutorialStep.instruction}</p>
            </div>

            <div className="flex flex-col gap-1.5 shrink-0">
              <button
                onClick={() => {
                  kabzaAudio.playSFX('click');
                  if (tutorialIdx < TUTORIAL_STEPS.length - 1) {
                    setTutorialIdx((prev) => prev + 1);
                  } else if (engineRef.current) {
                    engineRef.current.finishMatch();
                  }
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#F59E0B] text-[#1A1512] font-extrabold text-xs border-2 border-[#1A1512] cursor-pointer whitespace-nowrap"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{tutorialIdx < 9 ? 'Next Step' : 'Finish'}</span>
              </button>
              <button
                onClick={() => {
                  kabzaAudio.playSFX('click');
                  onLeaveMatch();
                }}
                className="flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg bg-[#1A1512] text-[#FDE68A] font-bold text-[10px] cursor-pointer"
              >
                <FastForward className="w-3 h-3" />
                <span>Exit Tutorial</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* RUNNING SMALL DIALOGUE BOXES FEED (BOTTOM-CENTER COMIC STRIP)         */}
      {/* ===================================================================== */}
      <div className="fixed bottom-4 inset-x-0 z-20 flex flex-col items-center pointer-events-none px-4 gap-1.5">
        {dialogueFeed.slice(-2).map((b, idx, arr) => {
          const meta = CHARACTER_METADATA[b.speaker];
          const isLatest = idx === arr.length - 1;
          return (
            <div
              key={b.id}
              onClick={() => kabzaAudio.speakDialogue(b.speaker, b.text, true)}
              className={`pointer-events-auto max-w-md w-full rounded-xl border-3 border-[#1A1512] bg-[#EFE4CE] text-[#1A1512] px-3 py-2 shadow-[4px_4px_0_#1A1512] flex items-center gap-2.5 transition-all cursor-pointer ${
                isLatest ? 'opacity-100 scale-100' : 'opacity-85 scale-95 hidden sm:flex'
              }`}
            >
              <img
                src={PORTRAIT_BY_SPEAKER[b.speaker]}
                alt={meta.name}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-lg object-cover border-2 border-[#1A1512] shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-display font-extrabold text-white"
                      style={{ backgroundColor: meta.badgeColor }}
                    >
                      {meta.name}
                    </span>
                    <span className="text-[10px] font-bold text-[#5C4D3C] truncate">
                      {meta.hindiRole}
                    </span>
                  </div>
                  <Volume2 className="w-3 h-3 text-[#5C4D3C] shrink-0" />
                </div>
                <p className="text-xs sm:text-sm font-extrabold text-[#1A1512] leading-tight mt-0.5">
                  “{b.text}”
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* REAL-TIME MINIMAP OVERLAY (BOTTOM-LEFT) */}
      {settings.showMinimap && (
        <div className="fixed bottom-4 left-4 z-20 pointer-events-none flex flex-col items-center">
          <div className="relative rounded-full overflow-hidden border-3 border-[#1A1512] shadow-[4px_4px_0_#1A1512] bg-[#E3CFA8]">
            <canvas ref={minimapRef} width={112} height={112} className="block" />
            <div className="absolute bottom-1 inset-x-0 text-center font-display font-extrabold text-[11px] text-white drop-shadow-[0_2px_0_#1A1512] tracking-wider">
              MAP
            </div>
          </div>
        </div>
      )}

      {/* MOBILE / TOUCH VIRTUAL DIRECTIONAL PAD (BOTTOM-RIGHT) */}
      {mode !== 'couch_2p' && (
        <div className="fixed bottom-4 right-4 z-30 grid grid-cols-3 gap-1.5 w-32 h-32">
          <div />
          <button
            onPointerDown={() => handleDirectionInput(localBrother, 'UP')}
            className="rounded-xl bg-[#EFE4CE] active:bg-[#F59E0B] text-[#1A1512] border-2 border-[#1A1512] shadow-[2px_2px_0_#1A1512] flex items-center justify-center cursor-pointer"
            aria-label="Move Up"
          >
            <ChevronUp className="w-6 h-6" />
          </button>
          <div />
          <button
            onPointerDown={() => handleDirectionInput(localBrother, 'LEFT')}
            className="rounded-xl bg-[#EFE4CE] active:bg-[#F59E0B] text-[#1A1512] border-2 border-[#1A1512] shadow-[2px_2px_0_#1A1512] flex items-center justify-center cursor-pointer"
            aria-label="Move Left"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="rounded-lg bg-[#1A1512] border border-[#1A1512] flex items-center justify-center text-[8px] font-mono font-bold text-[#FDE68A]">
            MOVE
          </div>
          <button
            onPointerDown={() => handleDirectionInput(localBrother, 'RIGHT')}
            className="rounded-xl bg-[#EFE4CE] active:bg-[#F59E0B] text-[#1A1512] border-2 border-[#1A1512] shadow-[2px_2px_0_#1A1512] flex items-center justify-center cursor-pointer"
            aria-label="Move Right"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
          <div />
          <button
            onPointerDown={() => handleDirectionInput(localBrother, 'DOWN')}
            className="rounded-xl bg-[#EFE4CE] active:bg-[#F59E0B] text-[#1A1512] border-2 border-[#1A1512] shadow-[2px_2px_0_#1A1512] flex items-center justify-center cursor-pointer"
            aria-label="Move Down"
          >
            <ChevronDown className="w-6 h-6" />
          </button>
          <div />
        </div>
      )}

      {/* RESPAWN BANNER OVERLAY WHEN ELIMINATED */}
      {hudState.localEliminated && (
        <div className="fixed inset-x-0 top-1/3 z-30 flex justify-center pointer-events-none px-4">
          <div className="px-6 py-4 rounded-2xl bg-[#EFE4CE] border-4 border-[#1A1512] text-center shadow-[6px_6px_0_#1A1512]">
            <div className="font-display font-extrabold text-2xl text-[#B83B2B] flex items-center justify-center gap-2">
              <Skull className="w-6 h-6" />
              <span>LINE KAT GAYI BADSHAH!</span>
            </div>
            <div className="text-sm font-bold text-[#1A1512] mt-1">
              Respawning in safe territory in{' '}
              <span className="font-mono font-extrabold text-[#B83B2B]">
                {hudState.localRespawnSec}s
              </span>
              ...
            </div>
          </div>
        </div>
      )}

      {/* PAUSE OVERLAY MODAL */}
      {hudState.isPaused && (
        <div className="fixed inset-0 z-40 bg-black/80 flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-2xl bg-[#EFE4CE] text-[#1A1512] border-4 border-[#1A1512] shadow-[8px_8px_0_#1A1512] p-6 text-center space-y-5">
            <h2 className="font-display font-extrabold text-3xl">CHAI BREAK (PAUSED)</h2>
            <p className="text-sm font-semibold text-[#5C4D3C]">
              “Are Badshah, saans le lo... par zameen pe nazar rakhna!”
            </p>
            <div className="space-y-3">
              <button
                onClick={togglePause}
                className="w-full py-3.5 rounded-xl bg-[#2E6F40] text-white font-display font-extrabold text-base border-2 border-[#1A1512] shadow-[4px_4px_0_#1A1512] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-5 h-5" />
                <span>Resume Match</span>
              </button>
              <button
                onClick={handleRestartMatch}
                className="w-full py-3.5 rounded-xl bg-[#F59E0B] text-[#1A1512] font-display font-extrabold text-base border-2 border-[#1A1512] shadow-[4px_4px_0_#1A1512] flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-5 h-5" />
                <span>Restart Match</span>
              </button>
              <button
                onClick={onLeaveMatch}
                className="w-full py-3 rounded-xl bg-[#B83B2B] text-white font-display font-extrabold text-sm border-2 border-[#1A1512] cursor-pointer"
              >
                Exit to Main Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function renderMinimap(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  eng: SharedKabzaEngine
) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#E3CFA8';
  ctx.fillRect(0, 0, w, h);

  const cellW = w / GRID_W;
  const cellH = h / GRID_H;

  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      const owner = eng.grid[y * GRID_W + x];
      if (owner === 1) {
        ctx.fillStyle = '#4E9F3D';
        ctx.fillRect(x * cellW, y * cellH, Math.ceil(cellW), Math.ceil(cellH));
      } else if (owner === 2) {
        ctx.fillStyle = '#B83B2B';
        ctx.fillRect(x * cellW, y * cellH, Math.ceil(cellW), Math.ceil(cellH));
      }
    }
  }

  ctx.fillStyle = '#A3E635';
  for (const pt of eng.players.bade.trail) {
    ctx.fillRect(pt.x * cellW, pt.y * cellH, Math.max(2, cellW), Math.max(2, cellH));
  }
  ctx.fillStyle = '#FB7185';
  for (const pt of eng.players.chhote.trail) {
    ctx.fillRect(pt.x * cellW, pt.y * cellH, Math.max(2, cellW), Math.max(2, cellH));
  }

  for (const id of ['bade', 'chhote'] as BrotherId[]) {
    const p = eng.players[id];
    if (p.isEliminated) continue;
    ctx.beginPath();
    ctx.arc(p.x * cellW, p.y * cellH, 4.2, 0, Math.PI * 2);
    ctx.fillStyle = id === 'bade' ? '#166534' : '#991B1B';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();
  }
}
