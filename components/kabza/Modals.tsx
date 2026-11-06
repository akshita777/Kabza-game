'use client';

import React from 'react';
import { X, Volume2, VolumeX, Clock, Shield, Zap, ScrollText, Award, Users, BookOpen } from 'lucide-react';
import { GameSettings } from '@/lib/kabza-types';
import { kabzaAudio } from '@/lib/kabza-audio';
import { CHARACTER_METADATA } from '@/lib/kabza-dialogue';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  onUpdateSettings: (partial: Partial<GameSettings>) => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}: SettingsModalProps) {
  if (!isOpen) return null;

  const sliders: {
    key: keyof Pick<
      GameSettings,
      'menuMusicVolume' | 'gameplayMusicVolume' | 'sfxVolume' | 'voiceVolume' | 'commentaryVolume'
    >;
    label: string;
    hindiSub: string;
  }[] = [
    { key: 'menuMusicVolume', label: 'Menu Music Volume', hindiSub: 'Menu ka tabla-sitar sangeet' },
    { key: 'gameplayMusicVolume', label: 'Gameplay Music Volume', hindiSub: 'Maidaan ka dholak taal' },
    { key: 'sfxVolume', label: 'Sound Effects (SFX)', hindiSub: 'Kabza aur trail cut ki awaaz' },
    { key: 'voiceVolume', label: 'Brothers Voice (Bade & Chhote)', hindiSub: 'Dono Badshahon ke taane' },
    { key: 'commentaryVolume', label: 'Family & Mohalla Commentary', hindiSub: 'Dadi, Mummy, Sharma Ji & Gupta Ji' },
  ];

  const toggleFullscreen = () => {
    kabzaAudio.playSFX('click');
    if (typeof document !== 'undefined') {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => {});
      } else {
        document.exitFullscreen?.().catch(() => {});
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative w-full max-w-xl rounded-2xl bg-[#EFE4CE] text-[#1A1512] border-4 border-[#1A1512] shadow-[8px_8px_0_#1A1512] p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b-2 border-[#1A1512]">
          <div>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight">
              SETTINGS & AUDIO MIXER
            </h2>
            <p className="text-xs sm:text-sm font-medium text-[#5C4D3C]">
              Are Badshah, awaaz aur match ka hisaab apne hisaab se set kar lo!
            </p>
          </div>
          <button
            onClick={() => {
              kabzaAudio.playSFX('click');
              onClose();
            }}
            className="p-2 rounded-xl bg-[#DFC9A1] hover:bg-[#D4B886] border-2 border-[#1A1512] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5 mt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => {
                kabzaAudio.playSFX('click');
                onUpdateSettings({ muted: !settings.muted });
              }}
              className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 border-[#1A1512] font-bold text-sm cursor-pointer transition-colors ${
                settings.muted ? 'bg-[#EF4444] text-white' : 'bg-[#4E9F3D] text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                {settings.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                <span>{settings.muted ? 'All Audio Muted' : 'Audio Active'}</span>
              </span>
              <span className="font-mono text-xs">{settings.muted ? 'OFF' : 'ON'}</span>
            </button>

            <button
              onClick={() => {
                kabzaAudio.playSFX('click');
                onUpdateSettings({ voiceEnabled: !settings.voiceEnabled });
              }}
              className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 border-[#1A1512] font-bold text-sm cursor-pointer transition-colors ${
                settings.voiceEnabled ? 'bg-[#2E6F40] text-white' : 'bg-[#C7B08B] text-[#1A1512]'
              }`}
            >
              <span>Hindi Voice Synthesis</span>
              <span className="font-mono text-xs">{settings.voiceEnabled ? 'ON' : 'SUBS ONLY'}</span>
            </button>
          </div>

          <div className="space-y-3 bg-[#E3D3B6] p-4 rounded-xl border-2 border-[#1A1512]">
            {sliders.map((s) => {
              const val = Math.round(settings[s.key] * 100);
              return (
                <div key={s.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
                    <span>
                      {s.label}{' '}
                      <span className="text-xs font-normal text-[#5C4D3C]">· {s.hindiSub}</span>
                    </span>
                    <span className="font-mono tabular-nums">{val}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={val}
                    onChange={(e) =>
                      onUpdateSettings({ [s.key]: Number(e.target.value) / 100 })
                    }
                    className="w-full accent-[#2E6F40] cursor-pointer"
                  />
                </div>
              );
            })}
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-extrabold">
              <Clock className="w-4 h-4" />
              <span>Match Duration (Default 2 Minutes)</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {([60, 120, 180] as const).map((sec) => (
                <button
                  key={sec}
                  onClick={() => {
                    kabzaAudio.playSFX('click');
                    onUpdateSettings({ matchDuration: sec });
                  }}
                  className={`py-2.5 px-3 rounded-xl font-display font-extrabold text-sm border-2 border-[#1A1512] cursor-pointer transition-all ${
                    settings.matchDuration === sec
                      ? 'bg-[#F59E0B] text-[#1A1512] shadow-[3px_3px_0_#1A1512]'
                      : 'bg-[#DFC9A1] text-[#1A1512] hover:bg-[#D4B886]'
                  }`}
                >
                  {sec / 60} MIN ({sec}s)
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => {
                kabzaAudio.playSFX('click');
                onUpdateSettings({ showMinimap: !settings.showMinimap });
              }}
              className="py-2.5 px-3 rounded-xl bg-[#DFC9A1] hover:bg-[#D4B886] border-2 border-[#1A1512] font-bold text-xs cursor-pointer"
            >
              Minimap: {settings.showMinimap ? 'VISIBLE' : 'HIDDEN'}
            </button>
            <button
              onClick={() => {
                kabzaAudio.playSFX('click');
                onUpdateSettings({ reducedMotion: !settings.reducedMotion });
              }}
              className="py-2.5 px-3 rounded-xl bg-[#DFC9A1] hover:bg-[#D4B886] border-2 border-[#1A1512] font-bold text-xs cursor-pointer"
            >
              Screen Shake: {settings.reducedMotion ? 'REDUCED' : 'FULL JUICE'}
            </button>
            <button
              onClick={toggleFullscreen}
              className="py-2.5 px-3 rounded-xl bg-[#1A1512] text-[#FDE68A] hover:bg-[#2D241E] border-2 border-[#1A1512] font-bold text-xs cursor-pointer"
            >
              Toggle Fullscreen
            </button>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => {
              kabzaAudio.playSFX('click');
              onClose();
            }}
            className="px-6 py-3 rounded-xl bg-[#2E6F40] hover:bg-[#3A8850] text-white font-display font-extrabold text-sm border-2 border-[#1A1512] shadow-[4px_4px_0_#1A1512] cursor-pointer"
          >
            Save & Return (Pakka Karo)
          </button>
        </div>
      </div>
    </div>
  );
}

export function HowToPlayModal({
  isOpen,
  onClose,
  onStartTutorial,
}: {
  isOpen: boolean;
  onClose: () => void;
  onStartTutorial: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#EFE4CE] text-[#1A1512] border-4 border-[#1A1512] shadow-[8px_8px_0_#1A1512] p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b-2 border-[#1A1512]">
          <div>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight">
              KABZA KAISE KAREIN? (HOW TO PLAY)
            </h2>
            <p className="text-xs sm:text-sm font-medium text-[#5C4D3C]">
              “Are Badshah, zameen pe kabza karne ke niyam samajh lo!”
            </p>
          </div>
          <button
            onClick={() => {
              kabzaAudio.playSFX('click');
              onClose();
            }}
            className="p-2 rounded-xl bg-[#DFC9A1] hover:bg-[#D4B886] border-2 border-[#1A1512] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 mt-5 text-sm leading-relaxed">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-[#E3D3B6] border-2 border-[#1A1512]">
              <h3 className="font-display font-extrabold text-base text-[#2E6F40]">
                1. Kacchi Line & Ghera (Loop Capture)
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-[#3B3024]">
                Step out of your safe territory (Green Turf for Bade, Red Brick for Chhote) to draw an exposed trail. Return to your territory to close the loop and capture everything inside!
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#E3D3B6] border-2 border-[#1A1512]">
              <h3 className="font-display font-extrabold text-base text-[#B83B2B]">
                2. Trail Kaato (Elimination)
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-[#3B3024]">
                While a brother is outside their safe zone, their trail is vulnerable! Run across your brother’s exposed trail to eliminate them for 2 seconds and erase their unclosed trail.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#DFC9A1] border-2 border-[#1A1512] space-y-2">
            <h3 className="font-display font-extrabold text-base flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#B45309]" />
              <span>Aangan Ke Desi Jugaad (Courtyard Power-Ups)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-[#EFE4CE] border border-[#1A1512] flex items-start gap-2">
                <Zap className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Adrak Wali Chai</div>
                  <div className="text-[#5C4D3C]">1.35x Sprint Speed for 5.5s</div>
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#EFE4CE] border border-[#1A1512] flex items-start gap-2">
                <Shield className="w-4 h-4 text-[#4D7C0F] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Nimbu-Mirchi Shield</div>
                  <div className="text-[#5C4D3C]">Blocks 1 enemy trail cut attempt</div>
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#EFE4CE] border border-[#1A1512] flex items-start gap-2">
                <ScrollText className="w-4 h-4 text-[#7E22CE] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Gupta Ji Stay Order</div>
                  <div className="text-[#5C4D3C]">Slows rival brother by 35%</div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#E3D3B6] border-2 border-[#1A1512] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="font-display font-extrabold text-sm">CONTROLS (DESKTOP & MOBILE)</div>
              <div className="text-xs text-[#3B3024] mt-0.5">
                <strong>Single Player / Online:</strong> WASD or Arrow Keys (Desktop) · Virtual Touch D-Pad (Mobile) · Press <kbd className="px-1.5 py-0.5 bg-white rounded border">Space</kbd> for Taunt!
                <br />
                <strong>2P Couch Mode:</strong> Bade uses <kbd className="px-1.5 py-0.5 bg-white rounded border">WASD</kbd> · Chhote uses <kbd className="px-1.5 py-0.5 bg-white rounded border">Arrow Keys</kbd>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => {
              kabzaAudio.playSFX('click');
              onClose();
              onStartTutorial();
            }}
            className="px-5 py-3 rounded-xl bg-[#F59E0B] hover:bg-[#FBBF24] text-[#1A1512] font-display font-extrabold text-sm border-2 border-[#1A1512] shadow-[4px_4px_0_#1A1512] cursor-pointer"
          >
            Play Interactive 10-Step Tutorial
          </button>
          <button
            onClick={() => {
              kabzaAudio.playSFX('click');
              onClose();
            }}
            className="px-6 py-3 rounded-xl bg-[#1A1512] text-[#FDE68A] font-display font-extrabold text-sm border-2 border-[#1A1512] cursor-pointer"
          >
            Samajh Gaye Badshah!
          </button>
        </div>
      </div>
    </div>
  );
}

export function CreditsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative w-full max-w-xl rounded-2xl bg-[#EFE4CE] text-[#1A1512] border-4 border-[#1A1512] shadow-[8px_8px_0_#1A1512] p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b-2 border-[#1A1512]">
          <div className="flex items-center gap-2">
            <Award className="w-6 h-6 text-[#B45309]" />
            <h2 className="font-display font-extrabold text-2xl tracking-tight">
              KABZA PARIVAAR & CREDITS
            </h2>
          </div>
          <button
            onClick={() => {
              kabzaAudio.playSFX('click');
              onClose();
            }}
            className="p-2 rounded-xl bg-[#DFC9A1] hover:bg-[#D4B886] border-2 border-[#1A1512] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 mt-4">
          <p className="text-sm font-semibold text-[#3B3024]">
            “Two brothers. One ancestral property. An entire neighbourhood watching. And a family full of Badshahs.”
          </p>

          <div className="space-y-2.5">
            <div className="text-xs font-extrabold uppercase tracking-wider text-[#5C4D3C] flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span>Cast of Characters (Indore-Jabalpur Badshah Universe)</span>
            </div>
            {(Object.keys(CHARACTER_METADATA) as Array<keyof typeof CHARACTER_METADATA>).map(
              (key) => {
                const c = CHARACTER_METADATA[key];
                return (
                  <div
                    key={key}
                    className="p-3 rounded-xl bg-[#E3D3B6] border-2 border-[#1A1512] flex flex-col gap-0.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-display font-extrabold text-sm">{c.name}</span>
                      <span className="text-xs font-bold text-[#5C4D3C]">{c.hindiRole}</span>
                    </div>
                    <p className="text-xs italic text-[#2D241E]">“{c.oneLiner}”</p>
                  </div>
                );
              }
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => {
              kabzaAudio.playSFX('click');
              onClose();
            }}
            className="px-6 py-2.5 rounded-xl bg-[#2E6F40] text-white font-display font-extrabold text-sm border-2 border-[#1A1512] shadow-[3px_3px_0_#1A1512] cursor-pointer"
          >
            Close Credits
          </button>
        </div>
      </div>
    </div>
  );
}
