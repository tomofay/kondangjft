'use client';

import React, { useState, useEffect } from 'react';
import { Question, UserAnswer } from '../types';
import { CheckCircle2, XCircle, HelpCircle, ArrowLeft, Filter, BookOpen, ZoomIn, ZoomOut, RotateCcw, X } from 'lucide-react';

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
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToReport}
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-500" />
              Evaluasi & Pembahasan Soal Lengkap
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Total 50 Soal • <span className="text-emerald-500 font-semibold">{correctCount} Benar</span> •{' '}
              <span className="text-red-500 font-semibold">{wrongCount} Salah</span>
            </p>
          </div>
        </div>

        <button
          onClick={onBackToReport}
          className="py-2 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition"
        >
          Kembali ke Rapor
        </button>
      </div>

      {/* Filter Controls */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-semibold">
            <Filter className="w-4 h-4" /> Filter Status:
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('ALL')}
              className={`py-1.5 px-3 rounded-xl font-medium transition ${
                filter === 'ALL'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Semua Soal ({questions.length})
            </button>
            <button
              onClick={() => setFilter('WRONG')}
              className={`py-1.5 px-3 rounded-xl font-medium transition flex items-center gap-1 ${
                filter === 'WRONG'
                  ? 'bg-red-600 text-white shadow'
                  : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 hover:bg-red-100'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              Salah Saja ({wrongCount})
            </button>
            <button
              onClick={() => setFilter('CORRECT')}
              className={`py-1.5 px-3 rounded-xl font-medium transition flex items-center gap-1 ${
                filter === 'CORRECT'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Benar Saja ({correctCount})
            </button>
          </div>
        </div>

        {/* Section Filter Pills */}
        <div className="flex gap-2 pt-1 overflow-x-auto text-xs border-t border-slate-100 dark:border-slate-800">
          {(['ALL', 'S1', 'S2', 'S3', 'S4'] as const).map((sec) => (
            <button
              key={sec}
              onClick={() => setSelectedSection(sec)}
              className={`py-1 px-3 rounded-lg text-[11px] font-medium transition ${
                selectedSection === sec
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {sec === 'ALL' ? 'Semua Seksi' : sec === 'S1' ? 'S1 (Moji Goi)' : sec === 'S2' ? 'S2 (Kaiwa)' : sec === 'S3' ? 'S3 (Chokai)' : 'S4 (Dokkai)'}
            </button>
          ))}
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-slate-500">
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
                className={`bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-md border transition ${
                  isCorrect
                    ? 'border-emerald-200 dark:border-emerald-900/60'
                    : 'border-red-200 dark:border-red-900/60'
                }`}
              >
                {/* Header info */}
                <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                      Soal #{q.number}
                    </span>
                    <span className="text-slate-500 font-medium">{q.sectionTitle}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isCorrect ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Jawaban Anda Benar
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 font-bold flex items-center gap-1 text-[11px]">
                        <XCircle className="w-3.5 h-3.5" /> Jawaban Anda Salah
                      </span>
                    )}
                  </div>
                </div>

                {/* Dokkai Passage if any */}
                {q.readingPassage && (
                  <div className="my-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-line font-japanese">
                    <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      Teks Bacaan (Dokkai):
                    </div>
                    {q.readingPassage}
                  </div>
                )}

                {/* Question Text */}
                <div className="my-3 text-sm font-semibold text-slate-900 dark:text-white leading-relaxed whitespace-pre-line font-japanese">
                  {q.questionText}
                </div>

                {/* Question Image if any (Clickable to zoom) */}
                {q.imageUrl && (
                  <div className="my-3 flex justify-center">
                    <div
                      onClick={() => {
                        setZoomedImageUrl(q.imageUrl!);
                        setZoomScale(1);
                      }}
                      className="relative inline-block group cursor-zoom-in rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-1.5 shadow-sm hover:border-indigo-500 transition"
                      title="Klik untuk memperbesar gambar"
                    >
                      <img
                        src={q.imageUrl}
                        alt={`Gambar Soal #${q.number}`}
                        className="max-h-64 max-w-full rounded-lg object-contain transition transform group-hover:scale-[1.02]"
                      />
                      <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 bg-slate-900/90 text-white rounded-lg text-[11px] font-bold flex items-center gap-1.5 shadow backdrop-blur-md border border-slate-700 pointer-events-none">
                        <ZoomIn className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Perbesar</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Audio button if Chokai */}
                {q.audioUrl && (
                  <div className="my-2">
                    <audio
                      key={q.audioUrl + '_' + q.id}
                      controls
                      preload="none"
                      className="w-full h-9 rounded-lg"
                      src={q.audioUrl}
                    >
                      <source src={q.audioUrl} type={q.audioUrl.endsWith('.ogg') ? 'audio/ogg' : 'audio/mpeg'} />
                    </audio>
                  </div>
                )}

                {/* Options grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-4 text-xs">
                  {q.options.map((opt) => {
                    const isUserChoice = userOpt === opt.key;
                    const isCorrectAnswer = q.correctAnswer === opt.key;

                    let style = 'bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
                    if (isCorrectAnswer) {
                      style = 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border-emerald-500 font-semibold ring-2 ring-emerald-500/20';
                    } else if (isUserChoice && !isCorrectAnswer) {
                      style = 'bg-red-50 dark:bg-red-950/60 text-red-900 dark:text-red-200 border-red-500 font-semibold ring-2 ring-red-500/20';
                    }

                    return (
                      <div
                        key={opt.key}
                        className={`p-3 rounded-xl border flex items-center justify-between ${style}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-white dark:bg-slate-900 border flex items-center justify-center font-bold text-[11px]">
                            {opt.key}
                          </span>
                          <span>{opt.text}</span>
                        </div>

                        {isCorrectAnswer && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-600 text-white">
                            KUNCI BENAR
                          </span>
                        )}
                        {isUserChoice && !isCorrectAnswer && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-600 text-white">
                            PILIHAN ANDA
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Insight & Explanation Box */}
                <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-900/60 space-y-1.5 text-xs text-indigo-950 dark:text-indigo-200">
                  <div className="font-bold flex items-center gap-1 text-indigo-700 dark:text-indigo-400">
                    <HelpCircle className="w-4 h-4" /> Pembahasan Lengkap & Insight:
                  </div>
                  <p className="leading-relaxed opacity-95 pl-5 border-l-2 border-indigo-400 dark:border-indigo-600">
                    {q.explanation}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Image Zoom Lightbox Modal */}
      {zoomedImageUrl && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setZoomedImageUrl(null)}
        >
          {/* Floating Controls Bar */}
          <div
            className="fixed top-4 z-50 flex items-center gap-2 p-1.5 bg-slate-900/90 border border-slate-700 rounded-2xl shadow-2xl backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setZoomScale((s) => Math.min(3, s + 0.25))}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition flex items-center gap-1 text-xs font-bold"
              title="Perbesar"
            >
              <ZoomIn className="w-4 h-4" />
              <span className="hidden sm:inline">Perbesar</span>
            </button>

            <button
              type="button"
              onClick={() => setZoomScale((s) => Math.max(0.5, s - 0.25))}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition flex items-center gap-1 text-xs font-bold"
              title="Perkecil"
            >
              <ZoomOut className="w-4 h-4" />
              <span className="hidden sm:inline">Perkecil</span>
            </button>

            <button
              type="button"
              onClick={() => setZoomScale(1)}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition flex items-center gap-1 text-xs font-bold"
              title="Reset Ukuran (100%)"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">{Math.round(zoomScale * 100)}%</span>
            </button>

            <div className="w-px h-5 bg-slate-700 mx-1"></div>

            <button
              type="button"
              onClick={() => setZoomedImageUrl(null)}
              className="p-2 text-rose-400 hover:text-white hover:bg-rose-600 rounded-xl transition flex items-center gap-1 text-xs font-bold"
              title="Tutup (ESC)"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Tutup</span>
            </button>
          </div>

          {/* Scaled Image Container */}
          <div
            className="max-w-[95vw] max-h-[85vh] overflow-auto flex items-center justify-center p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={zoomedImageUrl}
              alt="Zoomed Review Question"
              style={{ transform: `scale(${zoomScale})`, transformOrigin: 'center center' }}
              className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl object-contain border border-slate-700 transition-transform duration-200"
            />
          </div>

          <p className="fixed bottom-4 text-xs text-slate-400 font-medium text-center">
            Klik di mana saja atau tekan <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono text-[10px]">ESC</kbd> untuk menutup
          </p>
        </div>
      )}
    </div>
  );
};
