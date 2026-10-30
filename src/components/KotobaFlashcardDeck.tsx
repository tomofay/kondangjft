'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Volume2,
  RotateCw,
  Sparkles,
  CheckCircle2,
  Flame,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Keyboard
} from 'lucide-react';
import { VocabCard } from '@/lib/srsAlgorithm';

interface KotobaFlashcardDeckProps {
  initialCards: VocabCard[];
  chapterId?: number;
  onDeckCompleted?: () => void;
}

export const KotobaFlashcardDeck: React.FC<KotobaFlashcardDeckProps> = ({
  initialCards,
  chapterId = 1,
  onDeckCompleted
}) => {
  const [cards, setCards] = useState<VocabCard[]>(initialCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const currentCard = cards[currentIndex] || cards[0];

  // Count mastery queues
  const unmasteredCount = cards.filter((c) => c.repetition_count === 0).length;
  const learningCount = cards.filter((c) => c.repetition_count > 0 && c.repetition_count < 3).length;
  const masteredCount = cards.filter((c) => c.repetition_count >= 3).length;

  const playAudio = useCallback((audioUrl: string, word: string) => {
    try {
      const audio = new Audio(audioUrl);
      audio.onerror = () => {
        if ('speechSynthesis' in window) {
          const u = new SpeechSynthesisUtterance(word);
          u.lang = 'ja-JP';
          window.speechSynthesis.speak(u);
        }
      };
      audio.play().catch(() => {
        if ('speechSynthesis' in window) {
          const u = new SpeechSynthesisUtterance(word);
          u.lang = 'ja-JP';
          window.speechSynthesis.speak(u);
        }
      });
    } catch {
      // Fallback
    }
  }, []);

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleRate = async (rating: number) => {
    if (!currentCard || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/srs/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vocabId: currentCard.id,
          qualityRating: rating
        })
      });
      const data = await res.json();

      if (data.success && data.data) {
        // Update local card progress
        setCards((prev) =>
          prev.map((c) =>
            c.id === currentCard.id
              ? {
                  ...c,
                  repetition_count: data.data.repetitionCount,
                  interval_days: data.data.intervalDays,
                  easiness_factor: data.data.easinessFactor,
                  next_review_at: data.data.nextReviewAt
                }
              : c
          )
        );

        let notice = 'Kartu dijadwalkan ulang besok';
        if (rating === 4) notice = `Bagus sekali! Diulang ${data.data.intervalDays} hari lagi`;
        else if (rating === 3) notice = `Mantap! Diulang ${data.data.intervalDays} hari lagi`;
        else if (rating === 2) notice = 'Perlu latihan lebih sering (Diulang 1 hari lagi)';
        else notice = 'Diulang hari ini untuk memperkuat memori';

        setFeedbackNotice(notice);
        setTimeout(() => setFeedbackNotice(null), 1500);

        // Advance to next card or finish
        if (currentIndex < cards.length - 1) {
          setCurrentIndex((prev) => prev + 1);
          setIsFlipped(false);
        } else {
          setIsFlipped(false);
          if (onDeckCompleted) onDeckCompleted();
        }
      }
    } catch (err) {
      console.warn('SRS review submission failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (isFlipped) {
        if (e.key === '1') handleRate(1);
        else if (e.key === '2') handleRate(2);
        else if (e.key === '3') handleRate(3);
        else if (e.key === '4') handleRate(4);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, handleFlip]);

  if (!currentCard) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-stone-200 space-y-3">
        <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
        <h3 className="text-lg font-black text-stone-900">Deck Kosakata Selesai!</h3>
        <p className="text-xs text-stone-500">
          Seluruh kartu kosakata pada Bab {chapterId} telah selesai dipelajari untuk sesi ini.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Queue Counter Badges */}
      <div className="flex items-center justify-between gap-2 text-xs font-bold px-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-2 h-2 rounded-full bg-rose-600" />
          <span>Belum Hafal: {unmasteredCount}</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span>Sedang Belajar: {learningCount}</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-600" />
          <span>Dikuasai: {masteredCount}</span>
        </div>
      </div>

      {/* Progress & Card Counter */}
      <div className="flex items-center justify-between text-xs text-stone-500 px-2 font-mono">
        <span>Bab {chapterId}</span>
        <span>
          Kartu {currentIndex + 1} dari {cards.length}
        </span>
      </div>

      {/* 3D Flip Card Container */}
      <div
        onClick={handleFlip}
        className="w-full h-80 sm:h-96 cursor-pointer select-none"
        style={{ perspective: '1000px' }}
      >
        <div
          className="relative w-full h-full transition-transform duration-500 rounded-3xl shadow-lg border-2 border-stone-200 bg-white"
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
          }}
        >
          {/* Card Front: Kanji & Kana */}
          <div
            className="absolute inset-0 w-full h-full p-8 flex flex-col justify-between items-center text-center bg-gradient-to-b from-white via-rose-50/20 to-white rounded-3xl"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="flex items-center justify-between w-full text-xs font-bold text-stone-400">
              <span className="uppercase tracking-wider">KOSAKATA</span>
              <span className="text-[11px] bg-stone-100 px-2 py-0.5 rounded-full text-stone-600">
                Klik kartu untuk balik
              </span>
            </div>

            <div className="space-y-3 my-auto">
              <div className="text-4xl sm:text-6xl font-black text-stone-900 font-japanese">
                {currentCard.kanji || currentCard.kana}
              </div>
              {currentCard.kanji && (
                <div className="text-xl sm:text-2xl font-bold text-red-600 font-japanese">
                  {currentCard.kana}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between w-full pt-4">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  playAudio(currentCard.audio_url, currentCard.kana);
                }}
                className="p-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl border border-red-200 transition cursor-pointer"
                title="Dengarkan Suara"
              >
                <Volume2 className="w-5 h-5" />
              </button>
              <span className="text-xs text-stone-400 flex items-center gap-1 font-sans">
                <RotateCw className="w-3.5 h-3.5" />
                <span>Tekan Spasi untuk membalik</span>
              </span>
            </div>
          </div>

          {/* Card Back: Romaji, Meaning, Word Type */}
          <div
            className="absolute inset-0 w-full h-full p-8 flex flex-col justify-between items-center text-center bg-gradient-to-b from-stone-50 via-white to-amber-50/30 rounded-3xl"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)'
            }}
          >
            <div className="flex items-center justify-between w-full text-xs font-bold text-stone-400">
              <span className="uppercase tracking-wider">ARTI &amp; TERJEMAHAN</span>
              {currentCard.word_type && (
                <span className="text-[10px] uppercase font-mono bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                  {currentCard.word_type}
                </span>
              )}
            </div>

            <div className="space-y-3 my-auto">
              <div className="text-lg font-mono font-bold text-stone-500">
                {currentCard.romaji}
              </div>
              <div className="text-2xl sm:text-3xl font-black text-stone-900">
                &ldquo;{currentCard.indonesian_meaning}&rdquo;
              </div>
            </div>

            <div className="flex items-center justify-between w-full pt-4">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  playAudio(currentCard.audio_url, currentCard.kana);
                }}
                className="p-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-2xl transition cursor-pointer"
                title="Dengarkan Suara"
              >
                <Volume2 className="w-5 h-5" />
              </button>
              <span className="text-xs text-stone-400">Pilih tingkat ingatan di bawah</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedbackNotice && (
        <div className="p-3 bg-stone-900 text-white text-xs font-bold text-center rounded-xl animate-in zoom-in-95 duration-150">
          {feedbackNotice}
        </div>
      )}

      {/* Self-Assessment Buttons (Active after flipped) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] font-bold text-stone-500 px-1">
          <span>Evaluasi Diri (Algoritma SM-2):</span>
          <span className="flex items-center gap-1 text-stone-400">
            <Keyboard className="w-3.5 h-3.5" />
            <span>Shortcut: 1 - 4</span>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            type="button"
            disabled={!isFlipped || isSubmitting}
            onClick={() => handleRate(1)}
            className="py-3 px-3 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 disabled:opacity-40 transition text-left cursor-pointer"
          >
            <div className="text-xs font-black">1. Lupa Total</div>
            <div className="text-[10px] text-rose-600 mt-0.5">Ulangi Hari Ini</div>
          </button>

          <button
            type="button"
            disabled={!isFlipped || isSubmitting}
            onClick={() => handleRate(2)}
            className="py-3 px-3 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 disabled:opacity-40 transition text-left cursor-pointer"
          >
            <div className="text-xs font-black">2. Sulit</div>
            <div className="text-[10px] text-amber-600 mt-0.5">Ulangi 1 Hari</div>
          </button>

          <button
            type="button"
            disabled={!isFlipped || isSubmitting}
            onClick={() => handleRate(3)}
            className="py-3 px-3 rounded-2xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 disabled:opacity-40 transition text-left cursor-pointer"
          >
            <div className="text-xs font-black">3. Bagus</div>
            <div className="text-[10px] text-blue-600 mt-0.5">Interval Standar</div>
          </button>

          <button
            type="button"
            disabled={!isFlipped || isSubmitting}
            onClick={() => handleRate(4)}
            className="py-3 px-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 disabled:opacity-40 transition text-left cursor-pointer"
          >
            <div className="text-xs font-black">4. Sangat Mudah</div>
            <div className="text-[10px] text-emerald-600 mt-0.5">Bonus Multiplier</div>
          </button>
        </div>
      </div>
    </div>
  );
};
