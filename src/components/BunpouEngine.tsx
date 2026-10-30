'use client';

import React, { useState } from 'react';
import {
  Volume2,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Sparkles,
  Layers,
  ArrowRight,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { BunpouPattern, FormulaBlock, ExampleSentence } from '@/lib/bunpouStore';

interface BunpouEngineProps {
  patterns: BunpouPattern[];
  chapterId?: number;
  isSensei?: boolean;
}

export const BunpouEngine: React.FC<BunpouEngineProps> = ({
  patterns,
  chapterId = 1,
  isSensei = false
}) => {
  const [activePatternIndex, setActivePatternIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'points' | 'examples'>('points');
  const [accordionOpen, setAccordionOpen] = useState(false);
  const [presentationMode, setPresentationMode] = useState(false);
  const [audioPlayingId, setAudioPlayingId] = useState<string | null>(null);

  const currentPattern = patterns[activePatternIndex] || patterns[0];

  const playAudio = (audioUrl: string, sentenceId: string) => {
    try {
      setAudioPlayingId(sentenceId);
      const audio = new Audio(audioUrl);
      audio.onended = () => setAudioPlayingId(null);
      audio.onerror = () => {
        // Fallback to Web Speech API
        if ('speechSynthesis' in window) {
          const u = new SpeechSynthesisUtterance(currentPattern.example_sentences[0]?.japanese || '');
          u.lang = 'ja-JP';
          u.onend = () => setAudioPlayingId(null);
          window.speechSynthesis.speak(u);
        } else {
          setAudioPlayingId(null);
        }
      };
      audio.play().catch(() => setAudioPlayingId(null));
    } catch {
      setAudioPlayingId(null);
    }
  };

  const renderFormulaBlock = (block: FormulaBlock, idx: number) => {
    let style = 'bg-stone-100 border-stone-300 text-stone-800';
    let badgeText = 'BLOK';
    let badgeStyle = 'bg-stone-200 text-stone-700';

    if (block.type === 'topic') {
      style = 'bg-blue-50 border-blue-400 text-blue-900 shadow-blue-500/10';
      badgeText = 'TOPIK / SUBJEK';
      badgeStyle = 'bg-blue-200 text-blue-800';
    } else if (block.type === 'particle') {
      style = 'bg-amber-50 border-amber-400 text-amber-900 shadow-amber-500/10';
      badgeText = 'PARTIKEL';
      badgeStyle = 'bg-amber-200 text-amber-900';
    } else if (block.type === 'predicate') {
      style = 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow-emerald-500/10';
      badgeText = 'PREDIKAT / KERJA';
      badgeStyle = 'bg-emerald-200 text-emerald-900';
    }

    return (
      <div
        key={idx}
        className={`flex flex-col items-center px-4 py-3 rounded-2xl border-2 transition transform hover:scale-102 shadow-sm ${style}`}
      >
        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mb-1.5 ${badgeStyle}`}>
          {badgeText}
        </span>
        <span className="text-base sm:text-xl font-bold tracking-wide text-center">
          {block.text}
        </span>
        {block.subtext && (
          <span className="text-xs opacity-75 mt-0.5 text-center">
            {block.subtext}
          </span>
        )}
      </div>
    );
  };

  return (
    <div
      className={`transition-all duration-200 ${
        presentationMode
          ? 'fixed inset-0 z-50 bg-white p-6 sm:p-12 overflow-y-auto flex flex-col justify-between'
          : 'space-y-6'
      }`}
    >
      {/* Top Bar / Pattern Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-black text-xs">
            {chapterId}
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-stone-900">
              Materi Bunpou: Bab {chapterId}
            </h2>
            <span className="text-xs text-stone-500">
              Metode Segmentasi Warna (Tanpa Video Pasif)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Pattern Navigation Buttons */}
          {patterns.map((p, idx) => (
            <button
              key={p.pattern_code}
              onClick={() => {
                setActivePatternIndex(idx);
                setAccordionOpen(false);
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                activePatternIndex === idx
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Pola {idx + 1}
            </button>
          ))}

          {/* Presentation Mode Toggle for Sensei / Teacher */}
          {isSensei && (
            <button
              onClick={() => setPresentationMode(!presentationMode)}
              className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition cursor-pointer ml-2"
              title={presentationMode ? 'Keluar Mode Presentasi' : 'Sensei Presentation Mode (Layar Penuh Zoom)'}
            >
              {presentationMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Pattern Header Card */}
      <div className="bg-gradient-to-br from-white to-stone-50 border-2 border-stone-200 rounded-3xl p-5 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-black text-red-600 bg-red-50 px-2.5 py-1 rounded-lg border border-red-200">
            {currentPattern.pattern_code}
          </span>
          <span className="text-xs font-bold text-stone-500">
            Arti: {currentPattern.meaning}
          </span>
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-stone-900 font-japanese">
          {currentPattern.title}
        </h3>

        {/* Visual Segmentation Formula Blocks */}
        <div className="pt-2">
          <div className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Segmentasi Formula Blok Warna:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {currentPattern.formula_blocks.map((b, idx) => (
              <React.Fragment key={idx}>
                {renderFormulaBlock(b, idx)}
                {idx < currentPattern.formula_blocks.length - 1 && (
                  <span className="text-stone-300 font-black text-lg">+</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Tabulation System: Poin Penting vs Contoh Kalimat */}
      <div className="bg-white border-2 border-stone-200 rounded-3xl p-5 sm:p-7 shadow-xs space-y-5">
        <div className="flex border-b border-stone-200">
          <button
            onClick={() => setActiveTab('points')}
            className={`pb-3 px-4 text-xs sm:text-sm font-black transition border-b-2 cursor-pointer ${
              activeTab === 'points'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Poin Penting &amp; Kaidah
          </button>
          <button
            onClick={() => setActiveTab('examples')}
            className={`pb-3 px-4 text-xs sm:text-sm font-black transition border-b-2 cursor-pointer ${
              activeTab === 'examples'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Contoh Kalimat ({currentPattern.example_sentences.length})
          </button>
        </div>

        {/* Tab 1: Poin Penting */}
        {activeTab === 'points' && (
          <div className="space-y-3 animate-in fade-in duration-150">
            <ul className="space-y-2.5">
              {currentPattern.key_points.map((pt, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-stone-700 leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tab 2: Contoh Kalimat with Audio Playback */}
        {activeTab === 'examples' && (
          <div className="space-y-3 animate-in fade-in duration-150">
            {currentPattern.example_sentences.map((ex, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="text-base sm:text-lg font-bold text-stone-900 font-japanese">
                    {ex.japanese}
                  </div>
                  <div className="text-xs font-mono text-stone-500">
                    {ex.romaji}
                  </div>
                  <div className="text-xs text-stone-700 font-medium">
                    &ldquo;{ex.indonesian}&rdquo;
                  </div>
                </div>

                <button
                  onClick={() => playAudio(ex.audio_url, `sent_${i}`)}
                  className={`p-3 rounded-2xl transition cursor-pointer shrink-0 ${
                    audioPlayingId === `sent_${i}`
                      ? 'bg-red-600 text-white animate-pulse'
                      : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100 hover:text-red-600 shadow-2xs'
                  }`}
                  title="Dengarkan Lafal Native"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Accordion: Pendalaman Nuansa / Catatan Kesalahan Umum */}
      {currentPattern.nuance_accordion && (
        <div className="bg-amber-50/60 border border-amber-200 rounded-2xl overflow-hidden">
          <button
            onClick={() => setAccordionOpen(!accordionOpen)}
            className="w-full p-4 flex items-center justify-between text-left font-black text-xs sm:text-sm text-amber-900 hover:bg-amber-100/50 transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-700" />
              <span>{currentPattern.nuance_accordion.title}</span>
            </div>
            {accordionOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {accordionOpen && (
            <div className="p-4 pt-1 text-xs sm:text-sm text-amber-800 leading-relaxed border-t border-amber-200/60 animate-in fade-in duration-150">
              {currentPattern.nuance_accordion.content}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
