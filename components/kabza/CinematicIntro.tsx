'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FastForward, Volume2, VolumeX, ChevronRight, Play, MessageSquare } from 'lucide-react';
import { ASSET_PATHS, CharacterSpeaker } from '@/lib/kabza-types';
import { CHARACTER_METADATA, CINEMATIC_SCENES } from '@/lib/kabza-dialogue';
import { kabzaAudio } from '@/lib/kabza-audio';

interface CinematicIntroProps {
  onComplete: () => void;
}

const SPEAKER_PORTRAIT: Record<CharacterSpeaker, string> = {
  bade: ASSET_PATHS.badePortrait,
  chhote: ASSET_PATHS.chhotePortrait,
  dadi: ASSET_PATHS.dadiPortrait,
  mummy: ASSET_PATHS.mummyPortrait,
  sharma: ASSET_PATHS.bungalowHero,
  gupta: ASSET_PATHS.bungalowHero,
};

export default function CinematicIntro({ onComplete }: CinematicIntroProps) {
  const [sceneIdx, setSceneIdx] = useState(0);
  const [muted, setMuted] = useState(kabzaAudio.getSettings().muted);

  const scene = CINEMATIC_SCENES[sceneIdx];

  useEffect(() => {
    kabzaAudio.startMusic('menu');
    const firstDialogue = CINEMATIC_SCENES[sceneIdx]?.dialogues?.[0];
    if (firstDialogue) {
      kabzaAudio.speakDialogue(firstDialogue.speaker, firstDialogue.line, true);
    }
  }, [sceneIdx]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (sceneIdx < CINEMATIC_SCENES.length - 1) {
        setSceneIdx((prev) => prev + 1);
      }
    }, 6200);
    return () => clearTimeout(timer);
  }, [sceneIdx]);

  const handleNext = () => {
    kabzaAudio.playSFX('click');
    if (sceneIdx < CINEMATIC_SCENES.length - 1) {
      setSceneIdx((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  const toggleMute = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    kabzaAudio.updateSettings({ muted: nextMuted });
  };

  return (
    <div className="min-h-screen w-full bg-[#EFE4CE] text-[#1A1512] flex flex-col justify-between relative overflow-hidden">
      {/* Matte Vintage Stamp-Paper Grid Pattern (Zero Gloss) */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, #1A1512 1px, transparent 1px), linear-gradient(to bottom, #1A1512 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Top Comic Header Bar */}
      <header className="relative z-20 flex items-center justify-between px-6 py-4 max-w-6xl mx-auto w-full border-b-3 border-[#1A1512] bg-[#E3D3B6]">
        <div className="flex items-center gap-3">
          <span className="font-display font-extrabold text-xl tracking-tight text-[#1A1512]">
            KABZA · STORY OPENING
          </span>
          <span className="text-xs text-[#5C4D3C]">·</span>
          <span className="text-xs font-mono font-bold text-[#5C4D3C] tracking-wider">
            PANEL {scene.id} OF {CINEMATIC_SCENES.length}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleMute}
            className="p-2.5 rounded-xl bg-[#EFE4CE] border-2 border-[#1A1512] text-[#1A1512] shadow-[2px_2px_0_#1A1512] hover:bg-[#FDE68A] transition-colors cursor-pointer"
            title={muted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={() => {
              kabzaAudio.playSFX('click');
              onComplete();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1A1512] text-[#FDE68A] font-display font-extrabold text-xs sm:text-sm border-2 border-[#1A1512] hover:bg-[#2E241E] transition-colors cursor-pointer whitespace-nowrap"
          >
            <span>Skip Story</span>
            <FastForward className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Matte Graphic-Novel Comic Strip Stage */}
      <main className="relative z-20 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-5 max-w-5xl mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={scene.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="w-full space-y-5"
          >
            {/* Framed Comic Artwork Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch bg-[#E3D3B6] p-4 sm:p-6 rounded-2xl border-4 border-[#1A1512] shadow-[6px_6px_0_#1A1512]">
              {/* Left 6 Cols: Matte Illustrated Frame */}
              <div className="lg:col-span-6 relative rounded-xl overflow-hidden border-3 border-[#1A1512] bg-[#1A1512] min-h-[220px] sm:min-h-[260px] flex items-center justify-center">
                <img
                  src={ASSET_PATHS.bungalowHero}
                  alt="Ancestral Indore Bungalow"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                {/* Crisp Comic Caption Box in Top-Left Corner */}
                <div className="absolute top-3 left-3 bg-[#FDE68A] text-[#1A1512] px-3 py-1 border-2 border-[#1A1512] shadow-[2px_2px_0_#1A1512] font-mono font-extrabold text-[11px] uppercase">
                  {scene.tag}
                </div>
              </div>

              {/* Right 6 Cols: Story Narration & Brothers Standoff */}
              <div className="lg:col-span-6 flex flex-col justify-between space-y-4 text-left">
                <div className="space-y-3">
                  <h1 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight text-[#1A1512]">
                    {scene.id === 5 ? 'KABZA — THE GREAT PROPERTY WAR' : scene.title}
                  </h1>

                  {/* Solid Parchment Narration Box */}
                  <div className="bg-[#EFE4CE] border-3 border-[#1A1512] p-4 rounded-xl space-y-1.5 shadow-[3px_3px_0_#1A1512]">
                    {scene.narrationLines.map((line, i) => (
                      <p
                        key={i}
                        className="text-base sm:text-lg font-extrabold text-[#1A1512] leading-snug"
                      >
                        “{line}”
                      </p>
                    ))}
                  </div>
                </div>

                {/* Brothers Portrait Strip */}
                <div className="flex items-center gap-3 pt-1">
                  <img
                    src={ASSET_PATHS.badePortrait}
                    alt="Bade"
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-xl object-cover border-2 border-[#1A1512]"
                  />
                  <img
                    src={ASSET_PATHS.chhotePortrait}
                    alt="Chhote"
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-xl object-cover border-2 border-[#1A1512]"
                  />
                  <img
                    src={ASSET_PATHS.dadiPortrait}
                    alt="Dadi"
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-xl object-cover border-2 border-[#1A1512]"
                  />
                  <img
                    src={ASSET_PATHS.mummyPortrait}
                    alt="Mummy"
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-xl object-cover border-2 border-[#1A1512]"
                  />
                </div>
              </div>
            </div>

            {/* Running Small Dialogue Boxes (Indori-Jabalpur Banter Strip) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scene.dialogues.map((d, idx) => {
                const meta = CHARACTER_METADATA[d.speaker];
                return (
                  <div
                    key={idx}
                    onClick={() => kabzaAudio.speakDialogue(d.speaker, d.line, true)}
                    className={`flex items-center gap-3.5 p-3.5 rounded-xl border-3 border-[#1A1512] bg-[#EFE4CE] shadow-[4px_4px_0_#1A1512] text-left cursor-pointer hover:bg-[#FDE68A] transition-colors ${
                      scene.dialogues.length === 1 ? 'md:col-span-2' : ''
                    }`}
                  >
                    <img
                      src={SPEAKER_PORTRAIT[d.speaker]}
                      alt={meta.name}
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-lg object-cover border-2 border-[#1A1512] shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-[#B83B2B] shrink-0" />
                        <span className="font-display font-extrabold text-xs tracking-wide text-[#1A1512]">
                          {meta.name}
                        </span>
                        <span className="text-xs text-[#5C4D3C]">·</span>
                        <span className="text-xs font-bold text-[#5C4D3C] truncate">
                          {meta.hindiRole}
                        </span>
                      </div>
                      <p className="text-sm sm:text-base font-extrabold text-[#1A1512] mt-1 leading-snug">
                        “{d.line}”
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Panel Navigation */}
      <footer className="relative z-20 flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 max-w-6xl mx-auto w-full border-t-3 border-[#1A1512] bg-[#E3D3B6]">
        <div className="flex items-center gap-2">
          {CINEMATIC_SCENES.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => {
                kabzaAudio.playSFX('click');
                setSceneIdx(idx);
              }}
              className={`h-3 rounded-sm border border-[#1A1512] transition-all cursor-pointer ${
                idx === sceneIdx ? 'w-10 bg-[#2E6F40]' : 'w-3 bg-[#EFE4CE] hover:bg-[#FDE68A]'
              }`}
              aria-label={`Scene ${s.id}`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#2E6F40] hover:bg-[#3A8850] text-white font-display font-extrabold text-sm sm:text-base border-3 border-[#1A1512] shadow-[4px_4px_0_#1A1512] active:translate-y-0.5 transition-all cursor-pointer whitespace-nowrap"
        >
          {sceneIdx === CINEMATIC_SCENES.length - 1 ? (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Enter Pushtaini Aangan (Main Menu)</span>
            </>
          ) : (
            <>
              <span>Next Comic Panel</span>
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
      </footer>
    </div>
  );
}
