'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  RotateCcw,
  Home,
  FastForward,
  Skull,
  Percent,
  Clock,
  Award,
  Volume2,
  Crown,
  ChevronRight,
} from 'lucide-react';
import { ASSET_PATHS, CharacterSpeaker, MatchStats } from '@/lib/kabza-types';
import { CHARACTER_METADATA, getPostMatchCourtScript } from '@/lib/kabza-dialogue';
import { kabzaAudio } from '@/lib/kabza-audio';

interface FamilyCourtAndResultsProps {
  stats: MatchStats;
  onRematch: () => void;
  onMainMenu: () => void;
}

const PORTRAIT_MAP: Record<CharacterSpeaker, string> = {
  bade: ASSET_PATHS.badePortrait,
  chhote: ASSET_PATHS.chhotePortrait,
  dadi: ASSET_PATHS.dadiPortrait,
  mummy: ASSET_PATHS.mummyPortrait,
  sharma: ASSET_PATHS.bungalowHero,
  gupta: ASSET_PATHS.bungalowHero,
};

export default function FamilyCourtAndResults({
  stats,
  onRematch,
  onMainMenu,
}: FamilyCourtAndResultsProps) {
  const [phase, setPhase] = useState<'court' | 'results'>('court');
  const [lineIdx, setLineIdx] = useState(0);

  const script = getPostMatchCourtScript(stats.winner, stats.badePct, stats.chhotePct);

  useEffect(() => {
    if (stats.winner === 'draw') {
      kabzaAudio.playSFX('draw');
    } else {
      kabzaAudio.playSFX('victory');
      try {
        confetti({
          particleCount: 70,
          spread: 65,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore confetti error
      }
    }
  }, [stats.winner]);

  useEffect(() => {
    if (phase !== 'court') return;
    const current = script[lineIdx];
    if (current) {
      kabzaAudio.speakDialogue(current.speaker, current.line, true);
    }

    const timer = setTimeout(() => {
      if (lineIdx < script.length - 1) {
        setLineIdx((prev) => prev + 1);
      } else {
        setPhase('results');
      }
    }, 3900);

    return () => clearTimeout(timer);
  }, [phase, lineIdx, script]);

  if (phase === 'court') {
    const activeLine = script[lineIdx] || script[0];
    const meta = CHARACTER_METADATA[activeLine.speaker];

    return (
      <div className="min-h-screen w-full bg-[#EFE4CE] text-[#1A1512] flex flex-col justify-between p-6 relative overflow-hidden">
        <header className="relative z-10 max-w-4xl mx-auto w-full flex items-center justify-between border-b-3 border-[#1A1512] pb-4">
          <div className="font-mono text-xs font-extrabold tracking-widest text-[#B45309] uppercase">
            POST-MATCH FAMILY COURT · DADI KI ADALAT
          </div>
          <button
            onClick={() => {
              kabzaAudio.playSFX('click');
              setPhase('results');
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1A1512] text-[#FDE68A] font-bold text-xs border-2 border-[#1A1512] cursor-pointer"
          >
            <span>Skip to Final Registry Card</span>
            <FastForward className="w-4 h-4" />
          </button>
        </header>

        <main className="relative z-10 max-w-3xl mx-auto w-full my-auto space-y-6 text-center py-6">
          <div className="inline-flex items-center gap-3 px-5 py-2 rounded-xl bg-[#E3D3B6] border-3 border-[#1A1512] shadow-[4px_4px_0_#1A1512]">
            <img
              src={ASSET_PATHS.dadiPortrait}
              alt="Dadi Judge"
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-lg object-cover border-2 border-[#1A1512]"
            />
            <span className="font-display font-extrabold text-base text-[#1A1512]">
              DADI AMMA KA FAISLA
            </span>
          </div>

          <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-[#1A1512]">
            {stats.winner === 'bade'
              ? 'BADE BHAIYA JEET GAYE!'
              : stats.winner === 'chhote'
                ? 'CHHOTE BADSHAH BAAZI MAAR GAYE!'
                : 'BARABAR BANTWARA (MATCH DRAW!)'}
          </h1>

          {/* Active Speaking Character Card */}
          <motion.div
            key={lineIdx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 sm:p-8 rounded-2xl border-4 border-[#1A1512] shadow-[8px_8px_0_#1A1512] text-left flex flex-col sm:flex-row items-center gap-6"
            style={{
              backgroundColor: meta.bgColor,
            }}
          >
            <img
              src={PORTRAIT_MAP[activeLine.speaker]}
              alt={meta.name}
              referrerPolicy="no-referrer"
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover border-3 border-[#1A1512] shrink-0"
            />
            <div className="space-y-2 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="font-display font-extrabold text-lg text-[#FDE68A]">
                  {meta.name}
                </span>
                <span className="text-xs text-white/80">· {meta.hindiRole}</span>
                <Volume2 className="w-4 h-4 text-[#FDE68A] ml-1" />
              </div>
              <p className="text-lg sm:text-2xl font-bold text-white leading-snug">
                “{activeLine.line}”
              </p>
            </div>
          </motion.div>

          {/* All Court Script Dialogue Boxes Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            {script.map((item, i) => {
              const m = CHARACTER_METADATA[item.speaker];
              return (
                <button
                  key={i}
                  onClick={() => setLineIdx(i)}
                  className={`p-3 rounded-xl border-2 border-[#1A1512] transition-all cursor-pointer text-left ${
                    i === lineIdx
                      ? 'bg-[#FDE68A] shadow-[3px_3px_0_#1A1512]'
                      : 'bg-[#E3D3B6] opacity-75 hover:opacity-100'
                  }`}
                >
                  <div className="font-display font-extrabold text-xs text-[#1A1512]">
                    {m.name}
                  </div>
                  <div className="text-xs font-bold text-[#3B3024] line-clamp-1 mt-0.5">
                    “{item.line}”
                  </div>
                </button>
              );
            })}
          </div>
        </main>

        <footer className="relative z-10 text-center">
          <button
            onClick={() => {
              kabzaAudio.playSFX('click');
              if (lineIdx < script.length - 1) {
                setLineIdx((prev) => prev + 1);
              } else {
                setPhase('results');
              }
            }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#2E6F40] text-white font-display font-extrabold text-sm border-3 border-[#1A1512] shadow-[4px_4px_0_#1A1512] cursor-pointer"
          >
            <span>{lineIdx < script.length - 1 ? 'Agla Bayaan Suno' : 'View Final Property Registry'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#EFE4CE] text-[#1A1512] flex flex-col justify-between p-4 sm:p-8">
      <main className="max-w-4xl mx-auto w-full my-auto bg-[#E3D3B6] rounded-2xl border-4 border-[#1A1512] shadow-[8px_8px_0_#1A1512] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b-2 border-[#1A1512] pb-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#F59E0B] border-3 border-[#1A1512] flex items-center justify-center shadow-[3px_3px_0_#1A1512]">
              <Trophy className="w-8 h-8 text-[#1A1512]" />
            </div>
            <div>
              <div className="text-xs font-mono font-extrabold text-[#5C4D3C] uppercase">
                INDORE TEHSIL · OFFICIAL KABZA REGISTRY VERDICT
              </div>
              <h1 className="font-display font-extrabold text-2xl sm:text-4xl tracking-tight">
                {stats.winner === 'bade'
                  ? 'WINNER: BADE BHAIYA!'
                  : stats.winner === 'chhote'
                    ? 'WINNER: CHHOTE BADSHAH!'
                    : 'MATCH DRAW (50-50 BANTWARA)!'}
              </h1>
            </div>
          </div>

          <button
            onClick={() => {
              kabzaAudio.playSFX('click');
              setLineIdx(0);
              setPhase('court');
            }}
            className="px-3.5 py-2 rounded-xl bg-[#EFE4CE] hover:bg-[#FDE68A] border-2 border-[#1A1512] font-bold text-xs cursor-pointer whitespace-nowrap"
          >
            Replay Dadi’s Court
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div
            className={`p-5 rounded-2xl border-3 border-[#1A1512] relative ${
              stats.winner === 'bade'
                ? 'bg-[#D8F3DC] shadow-[6px_6px_0_#2E6F40]'
                : 'bg-[#EFE4CE]'
            }`}
          >
            {stats.winner === 'bade' && (
              <span className="absolute -top-3 right-4 px-3 py-1 rounded bg-[#2E6F40] text-white font-display font-extrabold text-xs border-2 border-[#1A1512] flex items-center gap-1">
                <Crown className="w-3.5 h-3.5" />
                <span>ASLI MALIK</span>
              </span>
            )}
            <div className="flex items-center gap-4">
              <img
                src={ASSET_PATHS.badePortrait}
                alt="Bade"
                referrerPolicy="no-referrer"
                className="w-20 h-20 rounded-xl object-cover border-2 border-[#1A1512]"
              />
              <div>
                <h2 className="font-display font-extrabold text-2xl text-[#1B3B2B]">BADE BHAIYA</h2>
                <div className="font-mono font-extrabold text-3xl sm:text-4xl text-[#2E6F40] tabular-nums">
                  {stats.badePct.toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-[#1A1512]/20 text-xs font-bold">
              <div className="flex items-center gap-1.5">
                <Skull className="w-4 h-4 text-[#2E6F40]" />
                <span>Eliminations: {stats.badeEliminations}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#2E6F40]" />
                <span>Best Loop: +{stats.badeLargestCapture.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div
            className={`p-5 rounded-2xl border-3 border-[#1A1512] relative ${
              stats.winner === 'chhote'
                ? 'bg-[#FFDAD6] shadow-[6px_6px_0_#B83B2B]'
                : 'bg-[#EFE4CE]'
            }`}
          >
            {stats.winner === 'chhote' && (
              <span className="absolute -top-3 right-4 px-3 py-1 rounded bg-[#B83B2B] text-white font-display font-extrabold text-xs border-2 border-[#1A1512] flex items-center gap-1">
                <Crown className="w-3.5 h-3.5" />
                <span>ASLI MALIK</span>
              </span>
            )}
            <div className="flex items-center gap-4">
              <img
                src={ASSET_PATHS.chhotePortrait}
                alt="Chhote"
                referrerPolicy="no-referrer"
                className="w-20 h-20 rounded-xl object-cover border-2 border-[#1A1512]"
              />
              <div>
                <h2 className="font-display font-extrabold text-2xl text-[#4A1C17]">
                  CHHOTE BADSHAH
                </h2>
                <div className="font-mono font-extrabold text-3xl sm:text-4xl text-[#B83B2B] tabular-nums">
                  {stats.chhotePct.toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-[#1A1512]/20 text-xs font-bold">
              <div className="flex items-center gap-1.5">
                <Skull className="w-4 h-4 text-[#B83B2B]" />
                <span>Eliminations: {stats.chhoteEliminations}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#B83B2B]" />
                <span>Best Loop: +{stats.chhoteLargestCapture.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 bg-[#EFE4CE] p-4 rounded-xl border-2 border-[#1A1512] text-center">
          <div>
            <div className="text-xs font-bold text-[#5C4D3C] flex items-center justify-center gap-1">
              <Percent className="w-3.5 h-3.5" />
              <span>Victory Margin</span>
            </div>
            <div className="font-mono font-extrabold text-lg sm:text-xl tabular-nums mt-0.5">
              {stats.diffPct.toFixed(1)}% Land
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-[#5C4D3C] flex items-center justify-center gap-1">
              <Skull className="w-3.5 h-3.5" />
              <span>Total Trail Cuts</span>
            </div>
            <div className="font-mono font-extrabold text-lg sm:text-xl tabular-nums mt-0.5">
              {stats.badeEliminations + stats.chhoteEliminations}
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-[#5C4D3C] flex items-center justify-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Match Duration</span>
            </div>
            <div className="font-mono font-extrabold text-lg sm:text-xl tabular-nums mt-0.5">
              {stats.durationSeconds}s
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-2">
          <button
            onClick={() => {
              kabzaAudio.playSFX('click');
              onMainMenu();
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-[#EFE4CE] hover:bg-[#DFC9A1] text-[#1A1512] font-display font-extrabold text-base border-3 border-[#1A1512] shadow-[4px_4px_0_#1A1512] cursor-pointer"
          >
            <Home className="w-5 h-5" />
            <span>Main Menu</span>
          </button>

          <button
            onClick={() => {
              kabzaAudio.playSFX('start');
              onRematch();
            }}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-[#2E6F40] hover:bg-[#3A8850] text-white font-display font-extrabold text-lg border-3 border-[#1A1512] shadow-[5px_5px_0_#1A1512] cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            <span>REMATCH (DOBARA DANGAL!)</span>
          </button>
        </div>
      </main>
    </div>
  );
}
