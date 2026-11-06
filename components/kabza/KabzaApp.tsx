'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Bot,
  Globe,
  BookOpen,
  Settings,
  Award,
  Film,
  Volume2,
  VolumeX,
  Users,
  MessageSquare,
} from 'lucide-react';
import {
  AIDifficulty,
  ASSET_PATHS,
  BrotherId,
  CharacterSpeaker,
  GameMode,
  GameSettings,
  MatchStats,
  MultiplayerRoomInfo,
  ScreenState,
} from '@/lib/kabza-types';
import { CHARACTER_METADATA, DIALOGUE_POOL } from '@/lib/kabza-dialogue';
import { kabzaAudio } from '@/lib/kabza-audio';
import {
  KabzaMultiplayerClient,
  isValidRoomCodeFormat,
} from '@/lib/kabza-multiplayer-client';
import { SerializedGameState } from '@/lib/kabza-server-store';
import CinematicIntro from './CinematicIntro';
import {
  CharacterSelectScreen,
  MultiplayerLobbyScreen,
  PreMatchIntroOverlay,
} from './CharacterSelectAndLobby';
import GameHUDAndCanvas from './GameHUDAndCanvas';
import FamilyCourtAndResults from './FamilyCourtAndResults';
import { CreditsModal, HowToPlayModal, SettingsModal } from './Modals';

interface KabzaAppProps {
  initialJoinCode?: string | null;
}

const SPEAKER_IMG: Record<CharacterSpeaker, string> = {
  bade: ASSET_PATHS.badePortrait,
  chhote: ASSET_PATHS.chhotePortrait,
  dadi: ASSET_PATHS.dadiPortrait,
  mummy: ASSET_PATHS.mummyPortrait,
  sharma: ASSET_PATHS.bungalowHero,
  gupta: ASSET_PATHS.bungalowHero,
};

export default function KabzaApp({ initialJoinCode = null }: KabzaAppProps) {
  const [screen, setScreen] = useState<ScreenState>(
    initialJoinCode ? 'MULTIPLAYER_LOBBY' : 'MAIN_MENU'
  );
  const [mode, setMode] = useState<GameMode>(
    initialJoinCode ? 'online_multiplayer' : 'vs_ai'
  );
  const [selectedBrother, setSelectedBrother] = useState<BrotherId>('bade');
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('medium');
  const [settings, setSettings] = useState<GameSettings>(() => kabzaAudio.getSettings());

  // Live auto-cycling dialogue ticker on Main Menu so small boxes of dialogue are always running!
  const [menuBanterIdx, setMenuBanterIdx] = useState(0);

  // Modals
  const [showSettings, setShowSettings] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showCredits, setShowCredits] = useState(false);

  // Match Results
  const [lastMatchStats, setLastMatchStats] = useState<MatchStats | null>(null);

  // Online Multiplayer State
  const [mpClientInstance] = useState<KabzaMultiplayerClient>(() => new KabzaMultiplayerClient());
  const mpClientRef = useRef<KabzaMultiplayerClient | null>(mpClientInstance);
  const localSessionId = mpClientInstance.sessionId;
  const [pingMs, setPingMs] = useState<number>(24);
  const [mpRoom, setMpRoom] = useState<MultiplayerRoomInfo | null>(null);
  const [latestServerState, setLatestServerState] = useState<SerializedGameState | null>(null);
  const [playerName, setPlayerName] = useState('Indori Badshah');
  const [joinCodeInput, setJoinCodeInput] = useState(initialJoinCode || '');
  const [mpError, setMpError] = useState<string | null>(null);
  const [mpLoading, setMpLoading] = useState(false);

  // Cycle the running dialogue boxes on the Main Menu every 3.5 seconds
  useEffect(() => {
    if (screen !== 'MAIN_MENU') return;
    const interval = setInterval(() => {
      setMenuBanterIdx((prev) => (prev + 1) % DIALOGUE_POOL.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [screen]);

  const hasAutoJoinedRef = useRef(false);

  // Attach Multiplayer Client Callbacks
  useEffect(() => {
    mpClientRef.current = mpClientInstance;
    mpClientInstance.setCallbacks({
      onRoomUpdate: (updatedRoom, gameState) => {
        setMpRoom(updatedRoom);
        setPingMs(mpClientInstance.pingMs || 24);
        if (gameState) {
          setLatestServerState(gameState);
        }

        const me = updatedRoom.players.find((p) => p.sessionId === mpClientInstance.sessionId);
        if (me?.character) {
          setSelectedBrother(me.character);
        }

        if (updatedRoom.status === 'playing') {
          setMode('online_multiplayer');
          setScreen((curr) =>
            curr === 'PLAYING' || curr === 'PRE_MATCH_INTRO' ? curr : 'PLAYING'
          );
        }
      },
      onError: (_err, hindiErr) => {
        setMpError(hindiErr);
      },
    });

    const codeFromUrl =
      initialJoinCode ||
      (typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('room')
        : null);

    if (codeFromUrl && !hasAutoJoinedRef.current) {
      hasAutoJoinedRef.current = true;
      const cleanCode = codeFromUrl.trim().toUpperCase();
      Promise.resolve().then(() => {
        setScreen('MULTIPLAYER_LOBBY');
        setMode('online_multiplayer');
        if (!isValidRoomCodeFormat(cleanCode)) {
          setMpError(
            `Are Badshah, "${cleanCode}" code sahi nahi lag raha! Format KABZA-XXXX hona chahiye.`
          );
        } else {
          setMpLoading(true);
          setMpError(null);
          mpClientInstance
            .joinRoom(cleanCode, 'Jabalpur Badshah')
            .then((res) => {
              setMpLoading(false);
              if (res.ok) {
                setMpRoom(res.room);
              } else {
                setMpError(res.hindiError);
              }
            })
            .catch(() => {
              setMpLoading(false);
              setMpError('Are Badshah, network hil gaya! Ek baar retry maaro.');
            });
        }
      });
    }
  }, [initialJoinCode, mpClientInstance]);

  const handleUpdateSettings = useCallback((partial: Partial<GameSettings>) => {
    kabzaAudio.updateSettings(partial);
    setSettings(kabzaAudio.getSettings());
  }, []);

  const handleCreateRoom = async () => {
    if (!mpClientRef.current) return;
    setMpLoading(true);
    setMpError(null);
    const res = await mpClientRef.current.createRoom(playerName, settings.matchDuration);
    setMpLoading(false);
    if (res.ok) {
      setMpRoom(res.room);
    } else {
      setMpError(res.error);
    }
  };

  const handleJoinRoom = async (codeOverride?: string) => {
    if (!mpClientRef.current) return;
    const targetCode = (codeOverride || joinCodeInput).trim();
    setMpLoading(true);
    setMpError(null);
    const res = await mpClientRef.current.joinRoom(targetCode, playerName);
    setMpLoading(false);
    if (res.ok) {
      setMpRoom(res.room);
    } else {
      setMpError(res.hindiError);
    }
  };

  const handleLeaveMultiplayer = async () => {
    if (mpClientRef.current) {
      await mpClientRef.current.disconnect();
    }
    setMpRoom(null);
    setLatestServerState(null);
    setMpError(null);
    setScreen('MAIN_MENU');
    kabzaAudio.startMusic('menu');
  };

  const startLocalMode = (chosenMode: GameMode) => {
    kabzaAudio.playSFX('click');
    setMode(chosenMode);
    if (chosenMode === 'tutorial') {
      setScreen('PLAYING');
    } else {
      setScreen('CHARACTER_SELECT');
    }
  };

  if (screen === 'CINEMATIC_INTRO') {
    return (
      <CinematicIntro
        onComplete={() => {
          setScreen('MAIN_MENU');
          kabzaAudio.startMusic('menu');
        }}
      />
    );
  }

  if (screen === 'CHARACTER_SELECT') {
    return (
      <>
        <CharacterSelectScreen
          mode={mode}
          selectedBrother={selectedBrother}
          onSelectBrother={setSelectedBrother}
          aiDifficulty={aiDifficulty}
          onSelectDifficulty={setAiDifficulty}
          onBack={() => setScreen('MAIN_MENU')}
          onStartMatch={() => setScreen('PRE_MATCH_INTRO')}
        />
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
        />
      </>
    );
  }

  if (screen === 'MULTIPLAYER_LOBBY') {
    return (
      <MultiplayerLobbyScreen
        room={mpRoom}
        localSessionId={localSessionId}
        playerName={playerName}
        onChangePlayerName={setPlayerName}
        joinCodeInput={joinCodeInput}
        onChangeJoinCode={setJoinCodeInput}
        errorMsg={mpError}
        isLoading={mpLoading}
        pingMs={pingMs}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onSelectCharacter={(b, autoStart) => mpClientRef.current?.selectCharacter(b, autoStart)}
        onToggleReady={() => mpClientRef.current?.toggleReady()}
        onStartMatchNow={() => mpClientRef.current?.startMatchNow()}
        onSimulateFriend={() => mpClientRef.current?.simulateFriendAndStart()}
        onBack={handleLeaveMultiplayer}
      />
    );
  }

  if (screen === 'PRE_MATCH_INTRO') {
    return (
      <PreMatchIntroOverlay
        localBrother={selectedBrother}
        onDone={() => setScreen('PLAYING')}
      />
    );
  }

  if (screen === 'PLAYING') {
    return (
      <>
        <GameHUDAndCanvas
          mode={mode}
          localBrother={selectedBrother}
          aiDifficulty={aiDifficulty}
          settings={settings}
          mpClient={mpClientInstance}
          latestServerState={latestServerState}
          onOpenSettings={() => setShowSettings(true)}
          onOpenHelp={() => setShowHowToPlay(true)}
          onLeaveMatch={() => {
            if (mode === 'online_multiplayer') {
              handleLeaveMultiplayer();
            } else {
              kabzaAudio.startMusic('menu');
              setScreen('MAIN_MENU');
            }
          }}
          onMatchFinished={(stats) => {
            setLastMatchStats(stats);
            setScreen('FAMILY_COURT');
          }}
        />
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
        />
        <HowToPlayModal
          isOpen={showHowToPlay}
          onClose={() => setShowHowToPlay(false)}
          onStartTutorial={() => {
            setMode('tutorial');
            setScreen('PLAYING');
          }}
        />
      </>
    );
  }

  if ((screen === 'FAMILY_COURT' || screen === 'RESULTS') && lastMatchStats) {
    return (
      <FamilyCourtAndResults
        stats={lastMatchStats}
        onRematch={() => {
          if (mode === 'online_multiplayer' && mpClientRef.current) {
            mpClientRef.current.requestRematch();
            setScreen('PLAYING');
          } else {
            setScreen('PLAYING');
          }
        }}
        onMainMenu={() => {
          if (mode === 'online_multiplayer') {
            handleLeaveMultiplayer();
          } else {
            kabzaAudio.startMusic('menu');
            setScreen('MAIN_MENU');
          }
        }}
      />
    );
  }

  const banterA = DIALOGUE_POOL[menuBanterIdx % DIALOGUE_POOL.length];
  const banterB = DIALOGUE_POOL[(menuBanterIdx + 1) % DIALOGUE_POOL.length];
  const metaA = CHARACTER_METADATA[banterA.speaker];
  const metaB = CHARACTER_METADATA[banterB.speaker];

  // ===========================================================================
  // DEFAULT: MAIN MENU SCREEN (MATTE VINTAGE PARCHMENT & COMIC INK, ZERO GLOSS)
  // ===========================================================================
  return (
    <div className="min-h-screen w-full bg-[#EFE4CE] text-[#1A1512] flex flex-col justify-between relative overflow-x-hidden">
      {/* Matte Property Blueprint Grid Backdrop */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(#1A1512 1.5px, transparent 1.5px), linear-gradient(to right, #1A1512 1px, transparent 1px), linear-gradient(to bottom, #1A1512 1px, transparent 1px)',
          backgroundSize: '36px 36px, 72px 72px, 72px 72px',
        }}
      />

      {/* 3-Zone Top Navigation Bar */}
      <header className="relative z-20 flex items-center justify-between gap-8 px-6 py-4 max-w-7xl mx-auto w-full border-b-3 border-[#1A1512] bg-[#E3D3B6]">
        <a
          href="/"
          className="font-display font-extrabold text-2xl tracking-tight text-[#1A1512] whitespace-nowrap shrink-0"
        >
          KABZA
        </a>

        <nav className="hidden md:flex items-center gap-6 text-sm font-bold text-[#3B3024]">
          <button
            onClick={() => startLocalMode('vs_ai')}
            className="hover:text-[#1A1512] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Play vs AI
          </button>
          <button
            onClick={() => {
              kabzaAudio.playSFX('click');
              setMode('online_multiplayer');
              setScreen('MULTIPLAYER_LOBBY');
            }}
            className="hover:text-[#1A1512] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Online Multiplayer
          </button>
          <button
            onClick={() => startLocalMode('tutorial')}
            className="hover:text-[#1A1512] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Interactive Tutorial
          </button>
          <button
            onClick={() => {
              kabzaAudio.playSFX('click');
              setShowHowToPlay(true);
            }}
            className="hover:text-[#1A1512] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            How to Play
          </button>
          <button
            onClick={() => {
              kabzaAudio.playSFX('click');
              setShowCredits(true);
            }}
            className="hover:text-[#1A1512] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Credits
          </button>
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => {
              kabzaAudio.playSFX('click');
              setShowSettings(true);
            }}
            className="px-4 py-2 rounded-xl bg-[#1A1512] text-[#FDE68A] font-display font-extrabold text-xs hover:bg-[#2E241E] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Audio & Settings
          </button>
        </div>
      </header>

      {/* Main Hero & Arcade Mode Launcher */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-6 py-6 sm:py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 7 Columns: Title, Running Dialogue Boxes & Game Mode Buttons */}
        <div className="lg:col-span-7 space-y-5">
          <div className="space-y-2">
            <div className="text-xs sm:text-sm font-mono font-extrabold text-[#B83B2B] uppercase tracking-wider">
              INDORE · JABALPUR ANCESTRAL PROPERTY SHOWDOWN
            </div>
            <h1 className="font-display font-extrabold text-5xl sm:text-7xl tracking-tight text-[#1A1512] leading-[0.95]">
              KABZA
              <span className="block text-2xl sm:text-4xl text-[#2E6F40] mt-1">
                THE GREAT PROPERTY WAR
              </span>
            </h1>
            <p className="text-base sm:text-xl font-extrabold text-[#3B3024] pt-1">
              “Baap ki property hai Badshah, par kabza karke dikha!”
            </p>
          </div>

          {/* LIVE RUNNING SMALL DIALOGUE BOXES (INDORI-JABALPUR BANTER TICKER) */}
          <div className="bg-[#E3D3B6] p-3.5 rounded-2xl border-3 border-[#1A1512] shadow-[4px_4px_0_#1A1512] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-mono font-extrabold text-[11px] uppercase tracking-wider text-[#B83B2B]">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>LIVE AANGAN BANTER · CLICK ANY BOX TO HEAR</span>
              </span>
              <button
                onClick={() => {
                  kabzaAudio.playSFX('click');
                  setMenuBanterIdx((prev) => (prev + 1) % DIALOGUE_POOL.length);
                }}
                className="text-[11px] font-extrabold underline cursor-pointer text-[#1A1512] hover:text-[#2E6F40]"
              >
                Next Dialogue
              </button>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={menuBanterIdx}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
              >
                {[
                  { entry: banterA, meta: metaA },
                  { entry: banterB, meta: metaB },
                ].map(({ entry, meta }, idx) => (
                  <button
                    key={idx}
                    onClick={() => kabzaAudio.speakDialogue(entry.speaker, entry.text, true)}
                    className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#EFE4CE] hover:bg-[#FDE68A] border-2 border-[#1A1512] text-left cursor-pointer transition-colors"
                  >
                    <img
                      src={SPEAKER_IMG[entry.speaker]}
                      alt={meta.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-lg object-cover border-2 border-[#1A1512] shrink-0 mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="px-1.5 py-0.5 rounded text-[9px] font-display font-extrabold text-white"
                          style={{ backgroundColor: meta.badgeColor }}
                        >
                          {meta.name}
                        </span>
                        <span className="text-[10px] font-bold text-[#5C4D3C] truncate">
                          {meta.hindiRole}
                        </span>
                      </div>
                      <p className="text-xs font-extrabold text-[#1A1512] leading-snug mt-1">
                        “{entry.text}”
                      </p>
                    </div>
                  </button>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Primary Arcade Mode Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => startLocalMode('vs_ai')}
              className="flex items-center gap-4 p-4 rounded-2xl bg-[#2E6F40] hover:bg-[#36804B] text-white border-3 border-[#1A1512] shadow-[5px_5px_0_#1A1512] text-left cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-[#1B3B2B] border-2 border-[#1A1512] flex items-center justify-center shrink-0">
                <Bot className="w-6 h-6 text-[#86EFAC]" />
              </div>
              <div>
                <div className="font-display font-extrabold text-lg leading-tight">
                  Play vs Computer
                </div>
                <div className="text-xs text-[#D8F3DC] mt-0.5">
                  Easy, Medium & Hard Strategic AI
                </div>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                kabzaAudio.playSFX('click');
                setMode('online_multiplayer');
                setScreen('MULTIPLAYER_LOBBY');
              }}
              className="flex items-center gap-4 p-4 rounded-2xl bg-[#B83B2B] hover:bg-[#C94332] text-white border-3 border-[#1A1512] shadow-[5px_5px_0_#1A1512] text-left cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-[#4A1C17] border-2 border-[#1A1512] flex items-center justify-center shrink-0">
                <Globe className="w-6 h-6 text-[#FDA4AF]" />
              </div>
              <div>
                <div className="font-display font-extrabold text-lg leading-tight">
                  Online Multiplayer
                </div>
                <div className="text-xs text-[#FFDAD6] mt-0.5">
                  Create Room · WhatsApp Invite Link
                </div>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => startLocalMode('tutorial')}
              className="flex items-center gap-4 p-4 rounded-2xl bg-[#F59E0B] hover:bg-[#FBBF24] text-[#1A1512] border-3 border-[#1A1512] shadow-[5px_5px_0_#1A1512] text-left cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-[#EFE4CE] border-2 border-[#1A1512] flex items-center justify-center shrink-0">
                <BookOpen className="w-6 h-6 text-[#1A1512]" />
              </div>
              <div>
                <div className="font-display font-extrabold text-base leading-tight">
                  Interactive Tutorial
                </div>
                <div className="text-xs font-semibold text-[#3B230A] mt-0.5">
                  Learn Kabza with Dadi (10 Steps)
                </div>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => startLocalMode('couch_2p')}
              className="flex items-center gap-4 p-4 rounded-2xl bg-[#E3D3B6] hover:bg-[#DFC9A1] text-[#1A1512] border-3 border-[#1A1512] shadow-[5px_5px_0_#1A1512] text-left cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-[#1A1512] text-[#FDE68A] flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="font-display font-extrabold text-base leading-tight">
                  2P Couch Kabza
                </div>
                <div className="text-xs font-semibold text-[#5C4D3C] mt-0.5">
                  Same Keyboard (WASD vs Arrows)
                </div>
              </div>
            </motion.button>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={() => {
                kabzaAudio.playSFX('click');
                setScreen('CINEMATIC_INTRO');
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E3D3B6] hover:bg-[#DFC9A1] border-2 border-[#1A1512] font-bold text-xs cursor-pointer"
            >
              <Film className="w-4 h-4" />
              <span>Watch Story Intro</span>
            </button>

            <button
              onClick={() => {
                kabzaAudio.playSFX('click');
                setShowHowToPlay(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E3D3B6] hover:bg-[#DFC9A1] border-2 border-[#1A1512] font-bold text-xs cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>Rules & Power-Ups</span>
            </button>

            <button
              onClick={() => {
                kabzaAudio.playSFX('click');
                setShowSettings(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E3D3B6] hover:bg-[#DFC9A1] border-2 border-[#1A1512] font-bold text-xs cursor-pointer"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>

            <button
              onClick={() => {
                kabzaAudio.playSFX('click');
                setShowCredits(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E3D3B6] hover:bg-[#DFC9A1] border-2 border-[#1A1512] font-bold text-xs cursor-pointer"
            >
              <Award className="w-4 h-4" />
              <span>Credits</span>
            </button>

            <button
              onClick={() => handleUpdateSettings({ muted: !settings.muted })}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#1A1512] text-[#FDE68A] font-bold text-xs cursor-pointer"
            >
              {settings.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>{settings.muted ? 'Unmute' : 'Sound On'}</span>
            </button>
          </div>
        </div>

        {/* Right 5 Columns: Matte Framed Ancestral Bungalow & Character Dialogue Cards */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl overflow-hidden border-4 border-[#1A1512] shadow-[6px_6px_0_#1A1512] bg-[#E3D3B6]">
            <div className="relative h-52 sm:h-60 border-b-3 border-[#1A1512]">
              <img
                src={ASSET_PATHS.bungalowHero}
                alt="Ancestral Indore Family Bungalow"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4 flex items-center justify-between gap-3 bg-[#E3D3B6]">
              <div>
                <div className="text-[11px] font-mono font-bold text-[#5C4D3C]">
                  PLOT NO. 420 · INDORE-JABALPUR ROAD
                </div>
                <div className="font-display font-extrabold text-base text-[#1A1512]">
                  Pushtaini Bangla & Courtyard Arena
                </div>
              </div>
              <button
                onClick={() => {
                  kabzaAudio.playSFX('start');
                  setMode('vs_ai');
                  setScreen('PRE_MATCH_INTRO');
                }}
                className="px-4 py-2.5 rounded-xl bg-[#F59E0B] hover:bg-[#FBBF24] text-[#1A1512] font-display font-extrabold text-xs border-2 border-[#1A1512] shadow-[3px_3px_0_#1A1512] flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Quick Match</span>
              </button>
            </div>
          </div>

          {/* Character Dialogue Cards (Each with its own visible quote box) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(
              [
                { id: 'bade', img: ASSET_PATHS.badePortrait },
                { id: 'chhote', img: ASSET_PATHS.chhotePortrait },
                { id: 'dadi', img: ASSET_PATHS.dadiPortrait },
                { id: 'mummy', img: ASSET_PATHS.mummyPortrait },
              ] as const
            ).map((item) => {
              const meta = CHARACTER_METADATA[item.id];
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    kabzaAudio.playSFX('click');
                    kabzaAudio.speakDialogue(item.id, meta.oneLiner, true);
                  }}
                  className="flex flex-col gap-2 p-3 rounded-xl bg-[#E3D3B6] hover:bg-[#DFC9A1] border-2 border-[#1A1512] shadow-[3px_3px_0_#1A1512] text-left cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={item.img}
                      alt={meta.name}
                      referrerPolicy="no-referrer"
                      className="w-11 h-11 rounded-lg object-cover border-2 border-[#1A1512] shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-display font-extrabold text-xs text-[#1A1512] truncate">
                        {meta.name}
                      </div>
                      <div className="text-[10px] font-bold text-[#5C4D3C] truncate">
                        {meta.hindiRole}
                      </div>
                    </div>
                    <Volume2 className="w-3.5 h-3.5 text-[#2E6F40] shrink-0" />
                  </div>
                  <div className="p-2 rounded-lg bg-[#EFE4CE] border border-[#1A1512] text-[11px] font-bold text-[#1A1512] leading-tight">
                    “{meta.oneLiner}”
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </main>

      <footer className="relative z-10 px-6 py-4 border-t-2 border-[#1A1512]/20 text-center text-xs font-medium text-[#5C4D3C] flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto w-full gap-2">
        <span>
          KABZA — The Great Property War · “Are Badshah, zameen pe kabza karna hai… dialogue baad mein maarna!”
        </span>
        <span className="font-mono">Desktop (WASD / Arrows) · Mobile Touch D-Pad</span>
      </footer>

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />
      <HowToPlayModal
        isOpen={showHowToPlay}
        onClose={() => setShowHowToPlay(false)}
        onStartTutorial={() => startLocalMode('tutorial')}
      />
      <CreditsModal isOpen={showCredits} onClose={() => setShowCredits(false)} />
    </div>
  );
}
