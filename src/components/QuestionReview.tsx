'use client';

import React, { useState, useEffect } from 'react';
import { Question, UserAnswer } from '../types';
import {
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Filter,
  BookOpen,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
  Volume2
} from 'lucide-react';
import { renderFormattedQuestion } from '../lib/formatQuestion';

interface QuestionReviewProps {
  questions: Question[];
  userAnswers: UserAnswer[];
  onBackToReport: () => void;
}

export const QuestionReview: React.FC<QuestionReviewProps> = ({
  questions,
  userAnswers,
  onBackToReport
}) => {
  const [filter, setFilter] = useState<'ALL' | 'WRONG' | 'CORRECT' | 'FLAGGED'>('ALL');
  const [selectedSection, setSelectedSection] = useState<'ALL' | 'S1' | 'S2' | 'S3' | 'S4'>('ALL');
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState(1);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setZoomedImageUrl(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Helper map for answers
  const answerMap = new Map<number, UserAnswer>();
  userAnswers.forEach((a) => answerMap.set(a.questionId, a));

  const filteredQuestions = questions.filter((q) => {
    const ua = answerMap.get(q.id);
    const selectedOpt = ua?.selectedOption;
    const isCorrect = selectedOpt === q.correctAnswer;
    const isFlagged = ua?.isFlagged;

    if (selectedSection !== 'ALL' && q.section !== selectedSection) return false;

    if (filter === 'WRONG') return !isCorrect;
    if (filter === 'CORRECT') return isCorrect;
    if (filter === 'FLAGGED') return !!isFlagged;

    return true;
  });

  const wrongCount = questions.filter((q) => answerMap.get(q.id)?.selectedOption !== q.correctAnswer).length;
  const correctCount = questions.length - wrongCount;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-150">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl shadow-sm border border-stone-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToReport}
            className="p-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition cursor-pointer shrink-0"
            title="Kembali ke Rapor Ujian"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base sm:text-xl font-black text-stone-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 shrink-0" />
              <span>Evaluasi & Pembahasan Soal JFT</span>
            </h1>
            <p className="text-xs text-stone-500 font-medium">
              Total {questions.length} Butir Soal •{' '}
              <span className="text-emerald-700 font-bold">{correctCount} Benar</span> •{' '}
              <span className="text-red-600 font-bold">{wrongCount} Salah</span>
            </p>
          </div>
        </div>

        <button
          onClick={onBackToReport}
          className="w-full sm:w-auto text-center py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-black rounded-xl transition cursor-pointer"
        >
          Kembali ke Rapor
        </button>
      </div>

      {/* Filter Controls */}
      {/* Filter and Section Selector */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-xs border border-stone-200 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-stone-600 font-bold">
            <Filter className="w-4 h-4 text-indigo-600" /> Filter Status:
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('ALL')}
              className={`py-1.5 px-3 rounded-xl font-bold transition cursor-pointer ${
                filter === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              Semua Soal ({questions.length})
            </button>
            <button
              onClick={() => setFilter('WRONG')}
              className={`py-1.5 px-3 rounded-xl font-bold transition flex items-center gap-1 cursor-pointer ${
                filter === 'WRONG'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-red-700 border border-rose-200 hover:bg-rose-100'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              Salah Saja ({wrongCount})
            </button>
            <button
              onClick={() => setFilter('CORRECT')}
              className={`py-1.5 px-3 rounded-xl font-bold transition flex items-center gap-1 cursor-pointer ${
                filter === 'CORRECT'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Benar Saja ({correctCount})
            </button>
          </div>
        </div>

        {/* Section Filter Pills (KondangSensei Signature Colors) */}
        <div className="flex gap-2 pt-2 overflow-x-auto text-xs border-t border-stone-100">
          {(['ALL', 'S1', 'S2', 'S3', 'S4'] as const).map((sec) => {
            const activeStyles: Record<string, string> = {
              ALL: 'bg-indigo-600 text-white shadow-xs',
              S1: 'bg-rose-500 text-white shadow-xs',
              S2: 'bg-amber-500 text-white shadow-xs',
              S3: 'bg-sky-500 text-white shadow-xs',
              S4: 'bg-emerald-600 text-white shadow-xs'
            };
            const inactiveStyles: Record<string, string> = {
              ALL: 'text-stone-600 hover:bg-stone-100',
              S1: 'text-rose-700 hover:bg-rose-50',
              S2: 'text-amber-800 hover:bg-amber-50',
              S3: 'text-sky-800 hover:bg-sky-50',
              S4: 'text-emerald-800 hover:bg-emerald-50'
            };

            return (
              <button
                key={sec}
                onClick={() => setSelectedSection(sec)}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap border ${
                  selectedSection === sec
                    ? activeStyles[sec]
                    : `bg-stone-50 border-stone-200 ${inactiveStyles[sec]}`
                }`}
              >
                {sec === 'ALL'
                  ? 'Semua Seksi'
                  : sec === 'S1'
                  ? '🌸 S1 (Moji Goi)'
                  : sec === 'S2'
                  ? '🍊 S2 (Kaiwa)'
                  : sec === 'S3'
                  ? '🌊 S3 (Chokai)'
                  : '🍵 S4 (Dokkai)'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-stone-200 text-stone-400 text-xs font-medium">
            Tidak ada soal yang sesuai dengan filter ini.
          </div>
        ) : (
          filteredQuestions.map((q) => {
            const ua = answerMap.get(q.id);
            const userOpt = ua?.selectedOption;
            const isCorrect = userOpt === q.correctAnswer;

            return (
              <div
                key={q.id}
                className={`bg-white rounded-3xl p-5 sm:p-6 shadow-xs border transition ${
                  isCorrect ? 'border-emerald-200' : 'border-rose-200'
                }`}
              >
                {/* Header info */}
                <div className="flex items-center justify-between border-b pb-3 border-stone-100 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-stone-900 bg-stone-100 px-2.5 py-1 rounded-lg">
                      Soal #{q.number}
                    </span>
                    <span className="text-stone-500 font-bold">{q.sectionTitle}</span>
                  </div>

                  <div>
                    {isCorrect ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold flex items-center gap-1 text-[11px] border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Jawaban Anda Benar
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-rose-50 text-red-700 font-bold flex items-center gap-1 text-[11px] border border-rose-200">
                        <XCircle className="w-3.5 h-3.5 text-red-600" />
                        Jawaban Anda Salah
                      </span>
                    )}
                  </div>
                </div>

                {/* Dokkai Passage if any */}
                {q.readingPassage && (
                  <div className="my-3 p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs leading-relaxed text-stone-800 whitespace-pre-line font-japanese">
                    <div className="text-[10px] font-black text-red-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      Teks Bacaan (Dokkai / 読解):
                    </div>
                    {q.readingPassage}
                  </div>
                )}

                {/* Question Text */}
                <div className="my-3 text-sm sm:text-base font-semibold text-stone-900 leading-relaxed whitespace-pre-line font-japanese">
                  {renderFormattedQuestion(q.questionText)}
                </div>

                {/* Question Image if any */}
                {q.imageUrl && (
                  <div className="my-3 flex justify-center">
                    <div
                      onClick={() => {
                        setZoomedImageUrl(q.imageUrl!);
                        setZoomScale(1);
                      }}
                      className="relative inline-block group cursor-zoom-in rounded-2xl overflow-hidden border border-stone-200 bg-stone-50 p-1.5 shadow-xs hover:border-red-400 transition"
                      title="Klik untuk memperbesar gambar"
                    >
                      <img
                        src={q.imageUrl}
                        alt={`Gambar Soal #${q.number}`}
                        className="max-h-64 max-w-full rounded-xl object-contain transition transform group-hover:scale-[1.01]"
                      />
                      <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 bg-white/95 text-stone-800 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow border border-stone-200 pointer-events-none group-hover:text-red-600">
                        <ZoomIn className="w-3.5 h-3.5 text-red-600" />
                        <span>Perbesar</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Audio if Chōkai */}
                {q.audioUrl && (
                  <div className="my-3 p-3 bg-stone-50 rounded-2xl border border-rose-200">
                    <div className="flex items-center gap-1.5 text-xs text-red-700 font-bold mb-2">
                      <Volume2 className="w-4 h-4 text-red-600" />
                      Putar Ulang Audio Chōkai:
                    </div>
                    <audio
                      key={q.audioUrl + '_' + q.id}
                      controls
                      preload="none"
                      className="w-full h-9 rounded-xl"
                      src={q.audioUrl}
                    >
                      <source
                        src={q.audioUrl}
                        type={q.audioUrl.endsWith('.ogg') ? 'audio/ogg' : 'audio/mpeg'}
                      />
                    </audio>
                  </div>
                )}

                {/* Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-4 text-xs font-japanese">
                  {q.options.map((opt) => {
                    const isUserChoice = userOpt === opt.key;
                    const isCorrectAnswer = q.correctAnswer === opt.key;

                    let style = 'bg-stone-50 text-stone-700 border-stone-200';
                    if (isCorrectAnswer) {
                      style =
                        'bg-emerald-50 text-emerald-900 border-emerald-400 font-bold ring-2 ring-emerald-500/20';
                    } else if (isUserChoice && !isCorrectAnswer) {
                      style =
                        'bg-rose-50 text-red-900 border-red-400 font-bold ring-2 ring-red-500/20';
                    }

                    return (
                      <div
                        key={opt.key}
                        className={`p-3 rounded-xl border flex items-center justify-between ${style}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-white border border-stone-200 flex items-center justify-center font-black text-[11px]">
                            {opt.key}
                          </span>
                          <span className="font-semibold">{opt.text}</span>
                        </div>

                        {isCorrectAnswer && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-600 text-white shrink-0">
                            KUNCI BENAR
                          </span>
                        )}
                        {isUserChoice && !isCorrectAnswer && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-600 text-white shrink-0">
                            PILIHAN ANDA
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Detailed Explanation / Pembahasan */}
                <div className="mt-3 p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-700 space-y-1.5">
                  <div className="font-black text-red-600 uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
                    <BookOpen className="w-3.5 h-3.5" />
                    Penjelasan & Pembahasan Jawaban (解説):
                  </div>
                  <div className="leading-relaxed font-medium">
                    {q.explanation || 'Tidak ada catatan pembahasan tambahan untuk butir soal ini.'}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Image Lightbox */}
      {zoomedImageUrl && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-stone-950/80 backdrop-blur-md p-4 animate-in fade-in duration-150"
          onClick={() => setZoomedImageUrl(null)}
        >
          <div
            className="fixed top-4 z-50 flex items-center gap-2 p-1.5 bg-white border border-stone-200 rounded-2xl shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setZoomScale((s) => Math.min(3, s + 0.25))}
              className="p-2 text-stone-700 hover:bg-stone-100 rounded-xl transition flex items-center gap-1 text-xs font-bold"
              title="Perbesar"
            >
              <ZoomIn className="w-4 h-4 text-red-600" />
              <span className="hidden sm:inline">Perbesar</span>
            </button>
            <button
              type="button"
              onClick={() => setZoomScale((s) => Math.max(0.5, s - 0.25))}
              className="p-2 text-stone-700 hover:bg-stone-100 rounded-xl transition flex items-center gap-1 text-xs font-bold"
              title="Perkecil"
            >
              <ZoomOut className="w-4 h-4 text-red-600" />
              <span className="hidden sm:inline">Perkecil</span>
            </button>
            <button
              type="button"
              onClick={() => setZoomScale(1)}
              className="p-2 text-stone-700 hover:bg-stone-100 rounded-xl transition flex items-center gap-1 text-xs font-bold"
              title="Reset"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">{Math.round(zoomScale * 100)}%</span>
            </button>
            <button
              type="button"
              onClick={() => setZoomedImageUrl(null)}
              className="p-2 text-red-600 hover:bg-rose-50 rounded-xl transition flex items-center gap-1 text-xs font-bold"
              title="Tutup"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Tutup</span>
            </button>
          </div>

          <div
            className="max-w-[95vw] max-h-[85vh] overflow-auto flex items-center justify-center p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={zoomedImageUrl}
              alt="Lampiran Soal"
              style={{ transform: `scale(${zoomScale})`, transformOrigin: 'center center' }}
              className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl object-contain border border-stone-200 bg-white"
            />
          </div>
        </div>
      )}
    </div>
  );
};
