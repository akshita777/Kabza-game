'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Check,
  Copy,
  Share2,
  MessageCircle,
  Wifi,
  Play,
  Bot,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import {
  AIDifficulty,
  ASSET_PATHS,
  BrotherId,
  GameMode,
  MultiplayerRoomInfo,
} from '@/lib/kabza-types';
import { CHARACTER_METADATA } from '@/lib/kabza-dialogue';
import { kabzaAudio } from '@/lib/kabza-audio';
import {
  buildBadshahInviteMessage,
  buildRoomInviteUrl,
  buildWhatsAppInviteUrl,
  normalizeRoomCode,
} from '@/lib/kabza-multiplayer-client';

interface CharacterSelectProps {
  mode: GameMode;
  selectedBrother: BrotherId;
  onSelectBrother: (b: BrotherId) => void;
  aiDifficulty: AIDifficulty;
  onSelectDifficulty: (d: AIDifficulty) => void;
  onBack: () => void;
  onStartMatch: () => void;
}

export function CharacterSelectScreen({
  mode,
  selectedBrother,
  onSelectBrother,
  aiDifficulty,
  onSelectDifficulty,
  onBack,
  onStartMatch,
}: CharacterSelectProps) {
  const handlePick = (brother: BrotherId) => {
    kabzaAudio.playSFX('click');
    onSelectBrother(brother);
    const meta = CHARACTER_METADATA[brother];
    kabzaAudio.speakDialogue(brother, meta.oneLiner, true);
  };

  return (
    <div className="min-h-screen w-full bg-[#EFE4CE] text-[#1A1512] flex flex-col justify-between relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(#1A1512 1.5px, transparent 1.5px), linear-gradient(to right, #1A1512 1px, transparent 1px), linear-gradient(to bottom, #1A1512 1px, transparent 1px)',
          backgroundSize: '36px 36px, 72px 72px, 72px 72px',
        }}
      />

      <header className="relative z-10 flex items-center justify-between px-6 py-5 max-w-5xl mx-auto w-full">
        <button
          onClick={() => {
            kabzaAudio.playSFX('click');
            onBack();
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1A1512] text-[#F87171] font-display font-extrabold text-sm border-2 border-[#1A1512] hover:bg-[#2B221D] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>LEAVE</span>
        </button>

        <div className="text-xs sm:text-sm font-mono font-bold text-[#5C4D3C] uppercase tracking-wider">
          {mode === 'vs_ai'
            ? 'Play Against Computer'
            : mode === 'couch_2p'
              ? '2-Player Same Keyboard'
              : '10-Step Interactive Tutorial'}
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-4 max-w-4xl mx-auto w-full text-center">
        <h1 className="font-display font-extrabold text-3xl sm:text-5xl tracking-tight text-[#1A1512]">
          WHO ARE YOU?
        </h1>
        <p className="text-base sm:text-xl font-bold text-[#3B3024] mt-1">
          pick a brother. start a property dispute.
        </p>

        <div className="grid grid-cols-2 gap-4 sm:gap-8 w-full max-w-2xl mt-6">
          {(['bade', 'chhote'] as BrotherId[]).map((brother) => {
            const isSelected = selectedBrother === brother;
            const meta = CHARACTER_METADATA[brother];
            const portrait =
              brother === 'bade' ? ASSET_PATHS.badePortrait : ASSET_PATHS.chhotePortrait;

            return (
              <motion.button
                key={brother}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handlePick(brother)}
                className={`group relative flex flex-col items-center p-4 sm:p-6 rounded-2xl transition-all cursor-pointer text-center border-4 ${
                  isSelected
                    ? brother === 'bade'
                      ? 'bg-[#E5D7B8] border-[#2E6F40] shadow-[6px_6px_0_#2E6F40]'
                      : 'bg-[#E5D7B8] border-[#B83B2B] shadow-[6px_6px_0_#B83B2B]'
                    : 'bg-[#E6DBC4] border-[#A89B84] hover:border-[#1A1512]'
                }`}
              >
                {isSelected && (
                  <div
                    className={`absolute -top-3.5 right-4 px-3 py-1 rounded text-xs font-extrabold text-white border-2 border-[#1A1512] ${
                      brother === 'bade' ? 'bg-[#2E6F40]' : 'bg-[#B83B2B]'
                    }`}
                  >
                    SELECTED BADSHAH
                  </div>
                )}

                <div className="relative w-32 h-32 sm:w-44 sm:h-44 rounded-xl overflow-hidden border-3 border-[#1A1512] bg-[#DFC9A1]">
                  <img
                    src={portrait}
                    alt={brother.toUpperCase()}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight text-[#1A1512] mt-4">
                  {brother.toUpperCase()}
                </h2>
                <span className="text-xs font-bold text-[#5C4D3C] mt-0.5">{meta.hindiRole}</span>

                {/* Small Dialogue Box inside Brother Card */}
                <div className="mt-2.5 w-full p-2.5 rounded-lg bg-[#EFE4CE] border-2 border-[#1A1512] text-left">
                  <p className="text-xs font-extrabold text-[#1A1512] leading-snug">
                    “{meta.oneLiner}”
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>

        <p className="text-xs sm:text-sm font-bold text-[#4A3E30] mt-5">
          first pick locks both players ·{' '}
          {selectedBrother === 'bade'
            ? 'You play BADE (Green Lawn) vs CHHOTE (Red Brick)'
            : 'You play CHHOTE (Red Brick) vs BADE (Green Lawn)'}
        </p>

        {mode === 'vs_ai' && (
          <div className="mt-5 w-full max-w-xl bg-[#E3D3B6] p-4 rounded-2xl border-3 border-[#1A1512] shadow-[4px_4px_0_#1A1512]">
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#3B3024] mb-3">
              <Bot className="w-4 h-4 text-[#2E6F40]" />
              <span>Select Rival Brother AI Difficulty</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {(
                [
                  {
                    id: 'easy',
                    label: 'EASY (Lappu)',
                    desc: 'Small safe loops, beginner friendly',
                  },
                  {
                    id: 'medium',
                    label: 'MEDIUM (Chalu)',
                    desc: 'Balanced expansion & trail cuts',
                  },
                  {
                    id: 'hard',
                    label: 'HARD (Asli Badshah)',
                    desc: 'Aggressive trail hunter & tactician',
                  },
                ] as const
              ).map((diff) => (
                <button
                  key={diff.id}
                  onClick={() => {
                    kabzaAudio.playSFX('click');
                    onSelectDifficulty(diff.id);
                  }}
                  className={`p-3 rounded-xl border-2 border-[#1A1512] text-left cursor-pointer transition-all ${
                    aiDifficulty === diff.id
                      ? 'bg-[#F59E0B] text-[#1A1512] shadow-[3px_3px_0_#1A1512]'
                      : 'bg-[#EFE4CE] text-[#1A1512] hover:bg-[#DFC9A1]'
                  }`}
                >
                  <div className="font-display font-extrabold text-xs sm:text-sm">{diff.label}</div>
                  <div className="text-[11px] text-[#3B3024] mt-0.5 leading-tight">{diff.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="relative z-10 flex items-center justify-center px-6 py-5 max-w-4xl mx-auto w-full">
        <button
          onClick={() => {
            kabzaAudio.playSFX('start');
            onStartMatch();
          }}
          className="w-full max-w-md flex items-center justify-center gap-3 py-4 px-8 rounded-xl bg-[#2E6F40] hover:bg-[#37834C] text-white font-display font-extrabold text-lg sm:text-xl border-3 border-[#1A1512] shadow-[6px_6px_0_#1A1512] active:translate-y-1 transition-all cursor-pointer"
        >
          <Play className="w-6 h-6 fill-current" />
          <span>MAIDAAN MEIN UTARO (START KABZA!)</span>
        </button>
      </footer>
    </div>
  );
}

interface MultiplayerLobbyProps {
  room: MultiplayerRoomInfo | null;
  localSessionId: string;
  playerName: string;
  onChangePlayerName: (name: string) => void;
  joinCodeInput: string;
  onChangeJoinCode: (code: string) => void;
  errorMsg: string | null;
  isLoading: boolean;
  pingMs: number;
  onCreateRoom: () => void;
  onJoinRoom: (code?: string) => void;
  onSelectCharacter: (b: BrotherId, autoStart?: boolean) => void;
  onToggleReady: () => void;
  onStartMatchNow: () => void;
  onSimulateFriend?: () => void;
  onBack: () => void;
}

export function MultiplayerLobbyScreen({
  room,
  localSessionId,
  playerName,
  onChangePlayerName,
  joinCodeInput,
  onChangeJoinCode,
  errorMsg,
  isLoading,
  pingMs,
  onCreateRoom,
  onJoinRoom,
  onSelectCharacter,
  onToggleReady,
  onStartMatchNow,
  onSimulateFriend,
  onBack,
}: MultiplayerLobbyProps) {
  const [copiedType, setCopiedType] = useState<'code' | 'link' | 'whatsapp' | null>(null);

  const copyText = async (text: string, type: 'code' | 'link' | 'whatsapp') => {
    kabzaAudio.playSFX('click');
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2400);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2400);
    }
  };

  const handleNativeShare = async () => {
    if (!room) return;
    const msg = buildBadshahInviteMessage(room.roomCode);
    const url = buildRoomInviteUrl(room.roomCode);
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'KABZA — The Great Property War',
          text: msg,
          url,
        });
        return;
      } catch {
        // Fallback to copy
      }
    }
    await copyText(msg, 'link');
  };

  const handleCodeInputChange = (rawVal: string) => {
    // If user pasted a full URL or WhatsApp invite message, automatically extract the KABZA-XXXX code
    if (rawVal.length > 10 || rawVal.includes('/') || rawVal.includes(' ')) {
      const extracted = normalizeRoomCode(rawVal);
      if (extracted) {
        onChangeJoinCode(extracted);
        return;
      }
    }
    onChangeJoinCode(rawVal.toUpperCase());
  };

  if (!room) {
    return (
      <div className="min-h-screen w-full bg-[#EFE4CE] text-[#1A1512] flex flex-col justify-between p-6">
        <header className="max-w-4xl mx-auto w-full flex items-center justify-between">
          <button
            onClick={() => {
              kabzaAudio.playSFX('click');
              onBack();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1A1512] text-[#F87171] font-display font-extrabold text-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>BACK TO MENU</span>
          </button>
          <span className="font-mono text-xs font-bold text-[#5C4D3C]">
            ONLINE MULTIPLAYER · AUTHORITATIVE ROOMS
          </span>
        </header>

        <main className="max-w-3xl mx-auto w-full my-auto py-8 space-y-6">
          <div className="text-center space-y-1">
            <h1 className="font-display font-extrabold text-3xl sm:text-5xl tracking-tight">
              ONLINE AANGAN PANCHAYAT
            </h1>
            <p className="text-sm sm:text-base font-semibold text-[#5C4D3C]">
              “Are Badshah! Room banao aur bhai ko WhatsApp pe link ya code bhejke maidaan mein bulao!”
            </p>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[#FEE2E2] border-2 border-[#DC2626] text-[#991B1B] font-bold text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="bg-[#E3D3B6] p-5 rounded-2xl border-3 border-[#1A1512] space-y-2">
            <label className="text-xs font-extrabold uppercase tracking-wider text-[#4A3E30]">
              Aapka Naam (Your Badshah Name)
            </label>
            <input
              type="text"
              maxLength={18}
              value={playerName}
              onChange={(e) => onChangePlayerName(e.target.value)}
              placeholder="e.g. Indori Badshah"
              className="w-full px-4 py-3 rounded-xl bg-[#EFE4CE] border-2 border-[#1A1512] font-bold text-base focus:outline-none focus:ring-2 focus:ring-[#2E6F40]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#E3D3B6] p-6 rounded-2xl border-3 border-[#1A1512] shadow-[6px_6px_0_#1A1512] flex flex-col justify-between space-y-4">
              <div>
                <span className="text-xs font-mono font-bold text-[#2E6F40] uppercase">
                  NEW PROPERTY DISPUTE
                </span>
                <h2 className="font-display font-extrabold text-2xl mt-1">
                  Naya Room Banao (Create Room)
                </h2>
                <p className="text-xs sm:text-sm text-[#4A3E30] mt-1">
                  Generates a unique <code className="font-mono font-bold">KABZA-XXXX</code> code and shareable WhatsApp invite link.
                </p>
              </div>
              <button
                disabled={isLoading}
                onClick={() => {
                  kabzaAudio.playSFX('click');
                  onCreateRoom();
                }}
                className="w-full py-3.5 px-5 rounded-xl bg-[#2E6F40] hover:bg-[#3A8850] disabled:opacity-50 text-white font-display font-extrabold text-base border-2 border-[#1A1512] shadow-[4px_4px_0_#1A1512] cursor-pointer"
              >
                {isLoading ? 'Room Ban Raha Hai...' : 'Create Room & Get Link'}
              </button>
            </div>

            <div className="bg-[#E3D3B6] p-6 rounded-2xl border-3 border-[#1A1512] shadow-[6px_6px_0_#1A1512] flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold text-[#B83B2B] uppercase">
                  PASTE CODE OR INVITE LINK
                </span>
                <h2 className="font-display font-extrabold text-2xl">
                  Room Mein Ghuso (Join Room)
                </h2>
                <input
                  type="text"
                  value={joinCodeInput}
                  onChange={(e) => handleCodeInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && joinCodeInput.trim()) {
                      kabzaAudio.playSFX('click');
                      onJoinRoom(joinCodeInput);
                    }
                  }}
                  placeholder="KABZA-7X9P or 7X9P or Paste Link"
                  className="w-full px-4 py-3 rounded-xl bg-[#EFE4CE] border-2 border-[#1A1512] font-mono font-extrabold text-base uppercase tracking-wider focus:outline-none"
                />
                <p className="text-[11px] font-semibold text-[#5C4D3C]">
                  Accepts <code className="font-mono">KABZA-XXXX</code>, 4-digit code (<code className="font-mono">7X9P</code>), or full WhatsApp link!
                </p>
              </div>
              <button
                disabled={isLoading || !joinCodeInput.trim()}
                onClick={() => {
                  kabzaAudio.playSFX('click');
                  onJoinRoom(joinCodeInput);
                }}
                className="w-full py-3.5 px-5 rounded-xl bg-[#B83B2B] hover:bg-[#C94534] disabled:opacity-50 text-white font-display font-extrabold text-base border-2 border-[#1A1512] shadow-[4px_4px_0_#1A1512] cursor-pointer"
              >
                {isLoading ? 'Joining Room...' : 'Join Room Now'}
              </button>
            </div>
          </div>
        </main>

        <footer className="text-center text-xs font-medium text-[#5C4D3C]">
          Tip: Paste the <code className="font-mono">KABZA-XXXX</code> code or share the WhatsApp invite link to battle live!
        </footer>
      </div>
    );
  }

  const localPlayer = room.players.find((p) => p.sessionId === localSessionId);
  const inviteUrl = buildRoomInviteUrl(room.roomCode);
  const whatsappHref = buildWhatsAppInviteUrl(room.roomCode);
  const bothConnected = room.players.length >= 2;

  return (
    <div className="min-h-screen w-full bg-[#EFE4CE] text-[#1A1512] flex flex-col justify-between p-4 sm:p-6">
      <header className="max-w-5xl mx-auto w-full flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => {
            kabzaAudio.playSFX('click');
            onBack();
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1A1512] text-[#F87171] font-display font-extrabold text-sm cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>LEAVE ROOM</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#2E6F40] bg-[#D8F3DC] px-3 py-1.5 rounded-lg border-2 border-[#1A1512]">
            <Wifi className="w-3.5 h-3.5" />
            <span>{pingMs}ms · {room.players.length}/2 CONNECTED</span>
          </span>
          <span className="font-mono font-extrabold text-sm bg-[#1A1512] text-[#FDE68A] px-3.5 py-1.5 rounded-lg">
            {room.roomCode}
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto w-full my-auto py-4 space-y-5">
        {bothConnected ? (
          <div className="bg-[#D8F3DC] border-3 border-[#2E6F40] shadow-[4px_4px_0_#1A1512] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <div className="text-xs font-mono font-extrabold uppercase text-[#2E6F40]">
                2/2 BROTHERS IN AANGAN · READY FOR DANGAL
              </div>
              <div className="font-display font-extrabold text-lg text-[#1A1512]">
                Dono Bhai Maidaan Mein Aa Gaye! Click BADE, CHHOTE, or START MATCH NOW!
              </div>
            </div>
            <button
              onClick={() => {
                kabzaAudio.playSFX('start');
                onStartMatchNow();
              }}
              className="px-5 py-2.5 rounded-xl bg-[#2E6F40] hover:bg-[#3A8850] text-white font-display font-extrabold text-sm border-2 border-[#1A1512] shadow-[3px_3px_0_#1A1512] cursor-pointer shrink-0"
            >
              START DANGAL NOW!
            </button>
          </div>
        ) : (
          <section className="bg-[#E3D3B6] p-5 rounded-2xl border-3 border-[#1A1512] shadow-[6px_6px_0_#1A1512] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-mono font-bold text-[#5C4D3C] uppercase">
                STEP 1: INVITE YOUR BROTHER TO THIS ROOM (1/2 CONNECTED)
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight text-[#1A1512]">
                  {room.roomCode}
                </span>
                <span className="text-xs font-mono bg-[#EFE4CE] px-2.5 py-1 rounded border border-[#1A1512] truncate max-w-xs sm:max-w-md">
                  {inviteUrl}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
              <button
                onClick={() => copyText(room.roomCode, 'code')}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#EFE4CE] hover:bg-[#FDE68A] border-2 border-[#1A1512] font-bold text-xs cursor-pointer"
              >
                {copiedType === 'code' ? <Check className="w-4 h-4 text-[#2E6F40]" /> : <Copy className="w-4 h-4" />}
                <span>{copiedType === 'code' ? 'Code Copied!' : 'Copy Code'}</span>
              </button>

              <button
                onClick={() => copyText(inviteUrl, 'link')}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#EFE4CE] hover:bg-[#FDE68A] border-2 border-[#1A1512] font-bold text-xs cursor-pointer"
              >
                {copiedType === 'link' ? <Check className="w-4 h-4 text-[#2E6F40]" /> : <Copy className="w-4 h-4" />}
                <span>{copiedType === 'link' ? 'Invite Link Copied!' : 'Copy Invite Link'}</span>
              </button>

              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  const msg = buildBadshahInviteMessage(room.roomCode);
                  copyText(msg, 'whatsapp');
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#22BF5B] text-[#1A1512] border-2 border-[#1A1512] font-extrabold text-xs cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{copiedType === 'whatsapp' ? 'Copied & Opening WhatsApp!' : 'Share on WhatsApp'}</span>
              </a>

              <button
                onClick={handleNativeShare}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#1A1512] text-[#FDE68A] border-2 border-[#1A1512] font-bold text-xs cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
            </div>
          </section>
        )}

        <section className="text-center space-y-3">
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl">
            pick a brother. start a property dispute.
          </h2>
          <p className="text-xs sm:text-sm font-bold text-[#5C4D3C]">
            first pick locks both players · {bothConnected ? 'Click a Brother below to lock & start immediately!' : 'Pick your Brother below while waiting for Player 2:'}
          </p>

          <div className="grid grid-cols-2 gap-4 sm:gap-6 max-w-2xl mx-auto">
            {(['bade', 'chhote'] as BrotherId[]).map((brother) => {
              const assignedPlayer = room.players.find((p) => p.character === brother);
              const isMine = localPlayer?.character === brother;
              const portrait =
                brother === 'bade' ? ASSET_PATHS.badePortrait : ASSET_PATHS.chhotePortrait;

              return (
                <button
                  key={brother}
                  onClick={() => {
                    kabzaAudio.playSFX('click');
                    onSelectCharacter(brother, bothConnected);
                    kabzaAudio.speakDialogue(
                      brother,
                      CHARACTER_METADATA[brother].oneLiner,
                      true
                    );
                  }}
                  className={`flex flex-col items-center p-4 sm:p-5 rounded-2xl border-4 transition-all cursor-pointer ${
                    isMine
                      ? brother === 'bade'
                        ? 'bg-[#D8F3DC] border-[#2E6F40] shadow-[6px_6px_0_#2E6F40]'
                        : 'bg-[#FFDAD6] border-[#B83B2B] shadow-[6px_6px_0_#B83B2B]'
                      : 'bg-[#E6DBC4] border-[#8D7F68] hover:border-[#1A1512]'
                  }`}
                >
                  <img
                    src={portrait}
                    alt={brother}
                    referrerPolicy="no-referrer"
                    className="w-28 h-28 sm:w-36 sm:h-36 rounded-xl object-cover border-2 border-[#1A1512]"
                  />
                  <span className="font-display font-extrabold text-xl sm:text-2xl mt-3">
                    {brother.toUpperCase()}
                  </span>
                  <span className="text-xs font-bold text-[#4A3E30] mt-1">
                    {assignedPlayer
                      ? `${assignedPlayer.name} ${assignedPlayer.sessionId === localSessionId ? '(You)' : ''}`
                      : bothConnected
                      ? 'Click to Lock & Start!'
                      : 'Click to Claim'}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {[0, 1].map((slotIdx) => {
            const p = room.players[slotIdx];
            return (
              <div
                key={slotIdx}
                className="flex items-center justify-between p-4 rounded-xl bg-[#E3D3B6] border-2 border-[#1A1512]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#1A1512] text-[#FDE68A] flex items-center justify-center font-display font-extrabold">
                    P{slotIdx + 1}
                  </div>
                  <div>
                    <div className="font-display font-extrabold text-sm">
                      {p ? `${p.name} ${p.sessionId === localSessionId ? '(You)' : ''}` : 'Waiting for Brother...'}
                    </div>
                    <div className="text-xs font-medium text-[#5C4D3C]">
                      {p
                        ? `Playing as: ${p.character ? p.character.toUpperCase() : 'Choosing...'}`
                        : 'Share code/link or click Simulate Brother below'}
                    </div>
                  </div>
                </div>

                {p ? (
                  <span
                    className={`px-3 py-1 rounded font-mono font-extrabold text-xs border border-[#1A1512] ${
                      p.ready ? 'bg-[#4ADE80] text-[#1A1512]' : 'bg-[#FDE68A] text-[#1A1512]'
                    }`}
                  >
                    {p.ready ? 'READY' : 'CONNECTED'}
                  </span>
                ) : (
                  <span className="text-xs font-mono text-[#786852]">WAITING...</span>
                )}
              </div>
            );
          })}
        </section>
      </main>

      <footer className="max-w-3xl mx-auto w-full flex flex-col sm:flex-row items-center justify-center gap-4 py-3">
        {bothConnected ? (
          <button
            onClick={() => {
              kabzaAudio.playSFX('start');
              onStartMatchNow();
            }}
            className="w-full py-4 px-6 rounded-xl bg-[#2E6F40] hover:bg-[#3A8850] text-white font-display font-extrabold text-lg border-3 border-[#1A1512] shadow-[5px_5px_0_#1A1512] cursor-pointer flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            <span>SHURU KARO DANGAL! (START 2P MATCH NOW)</span>
          </button>
        ) : (
          <>
            <button
              onClick={() => {
                kabzaAudio.playSFX('click');
                onToggleReady();
              }}
              className={`w-full sm:w-auto flex-1 py-4 px-6 rounded-xl font-display font-extrabold text-sm sm:text-base border-3 border-[#1A1512] shadow-[5px_5px_0_#1A1512] cursor-pointer transition-all flex items-center justify-center gap-2 ${
                localPlayer?.ready
                  ? 'bg-[#F59E0B] text-[#1A1512]'
                  : 'bg-[#2E6F40] text-white hover:bg-[#3A8850]'
              }`}
            >
              {localPlayer?.ready && <Check className="w-5 h-5" />}
              <span>
                {localPlayer?.ready
                  ? 'READY! WAITING FOR FRIEND TO JOIN...'
                  : 'MARK READY (AUTO-START ON JOIN)'}
              </span>
            </button>

            {onSimulateFriend && (
              <button
                onClick={() => {
                  kabzaAudio.playSFX('start');
                  onSimulateFriend();
                }}
                className="w-full sm:w-auto py-4 px-5 rounded-xl bg-[#B83B2B] hover:bg-[#C94534] text-white font-display font-extrabold text-sm sm:text-base border-3 border-[#1A1512] shadow-[5px_5px_0_#1A1512] cursor-pointer flex items-center justify-center gap-2"
              >
                <Bot className="w-5 h-5" />
                <span>SIMULATE FRIEND JOIN & START NOW</span>
              </button>
            )}
          </>
        )}
      </footer>
    </div>
  );
}

export function PreMatchIntroOverlay({
  localBrother,
  onDone,
}: {
  localBrother: BrotherId;
  onDone: () => void;
}) {
  React.useEffect(() => {
    kabzaAudio.speakDialogue(
      localBrother,
      CHARACTER_METADATA[localBrother].oneLiner,
      true
    );
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [localBrother, onDone]);

  return (
    <div className="fixed inset-0 z-50 bg-[#EFE4CE] text-[#1A1512] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-3xl w-full space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded bg-[#F59E0B] text-[#1A1512] border-2 border-[#1A1512] shadow-[3px_3px_0_#1A1512] font-mono font-extrabold text-xs">
          <MessageSquare className="w-4 h-4" />
          <span>PUSHTAINI PROPERTY DANGAL STARTING</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-stretch">
          <motion.div
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="p-5 rounded-2xl bg-[#1B3B2B] border-4 border-[#1A1512] shadow-[6px_6px_0_#1A1512] text-white flex flex-col items-center space-y-3"
          >
            <img
              src={ASSET_PATHS.badePortrait}
              alt="Bade"
              referrerPolicy="no-referrer"
              className="w-28 h-28 rounded-xl object-cover border-3 border-[#4E9F3D]"
            />
            <div className="font-display font-extrabold text-2xl text-[#86EFAC]">BADE BHAIYA</div>
            <div className="p-3 rounded-xl bg-[#EFE4CE] text-[#1A1512] border-2 border-[#1A1512] text-xs font-extrabold">
              “Are Badshah, ee poora plot apan ka hai!”
            </div>
          </motion.div>

          <motion.div
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="p-5 rounded-2xl bg-[#4A1C17] border-4 border-[#1A1512] shadow-[6px_6px_0_#1A1512] text-white flex flex-col items-center space-y-3"
          >
            <img
              src={ASSET_PATHS.chhotePortrait}
              alt="Chhote"
              referrerPolicy="no-referrer"
              className="w-28 h-28 rounded-xl object-cover border-3 border-[#E05A47]"
            />
            <div className="font-display font-extrabold text-2xl text-[#FDA4AF]">
              CHHOTE BADSHAH
            </div>
            <div className="p-3 rounded-xl bg-[#EFE4CE] text-[#1A1512] border-2 border-[#1A1512] text-xs font-extrabold">
              “Tum bas mooch sambhalo, property apan sambhalte hain!”
            </div>
          </motion.div>
        </div>

        <button
          onClick={onDone}
          className="px-6 py-3 rounded-xl bg-[#1A1512] text-[#FDE68A] font-display font-extrabold text-xs border-2 border-[#1A1512] cursor-pointer"
        >
          Skip Intro & Fight Now
        </button>
      </div>
    </div>
  );
}
