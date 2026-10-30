'use client';

import React, { useState, useEffect } from 'react';

interface MondaiOption {
  id: string;
  text: string;
}

interface MondaiQuestion {
  id: string;
  test_id: string;
  question_number: number;
  question_text: string;
  options: MondaiOption[];
}

interface ExamResult {
  scorePercent: number;
  isPassed: boolean;
  nextChapterUnlocked: number | null;
  omakeUnlocked?: boolean;
  remedialGuidance?: {
    title: string;
    recommendations: string[];
    retryAllowed: boolean;
  };
  correctCount: number;
  totalQuestions: number;
}

interface MondaiExamEngineProps {
  chapterId?: number;
  onChapterUnlocked?: (nextChapterId: number) => void;
}

export default function MondaiExamEngine({
  chapterId = 1,
  onChapterUnlocked
}: MondaiExamEngineProps) {
  const [examState, setExamState] = useState<'idle' | 'taking' | 'submitting' | 'result'>('idle');
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [questions, setQuestions] = useState<MondaiQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(20 * 60);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Server-enforced Countdown Timer
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (examState === 'taking' && timeLeftSeconds > 0) {
      timer = setInterval(() => {
        setTimeLeftSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timer!);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [examState, timeLeftSeconds]);

  const handleStartExam = async () => {
    setErrorMsg(null);
    try {
      const res = await fetch('/api/n5/mondai/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterId })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Gagal memulai ujian');
      }

      const examData = json.data;
      setAttemptId(examData.attemptId);
      setStartedAt(examData.startedAt);
      setQuestions(examData.questions);
      setTimeLeftSeconds(examData.durationMinutes * 60);
      setAnswers({});
      setCurrentIdx(0);
      setExamState('taking');
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem.');
    }
  };

  const handleSelectOption = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const handleAutoSubmit = async () => {
    await submitAnswers();
  };

  const submitAnswers = async () => {
    setExamState('submitting');
    setErrorMsg(null);

    const answersPayload = Object.entries(answers).map(([qId, optId]) => ({
      questionId: qId,
      selectedOptionId: optId
    }));

    try {
      const res = await fetch('/api/n5/mondai/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId,
          answers: answersPayload,
          startedAt
        })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Gagal mengirimkan lembar ujian');
      }

      setResult(json.data);
      setExamState('result');

      if (json.data.isPassed && json.data.nextChapterUnlocked && onChapterUnlocked) {
        onChapterUnlocked(json.data.nextChapterUnlocked);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Kesalahan saat auto-grading.');
      setExamState('taking');
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // 1. Idle View: Rules & Start Button
  if (examState === 'idle') {
    return (
      <div className="w-full max-w-3xl mx-auto rounded-3xl bg-slate-900/90 border border-slate-800 p-8 md:p-10 backdrop-blur-xl shadow-2xl text-slate-100">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
            Evaluasi Akhir Bab (問題)
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            Ujian Evaluasi Mondai Bab {chapterId}
          </h2>
          <p className="text-slate-400 text-sm max-w-lg mx-auto">
            Ujian berbatas waktu untuk menguji pemahaman Bunpou, Kotoba, dan pola kalimat sebelum membuka bab selanjutnya.
          </p>
        </div>

        {errorMsg && (
          <div className="mt-6 p-4 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-sm">
            {errorMsg}
          </div>
        )}

        {/* Exam Parameters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-8">
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
            <span className="text-2xl font-black text-indigo-400">10</span>
            <p className="text-xs text-slate-400 mt-1">Soal Pilihan Ganda</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
            <span className="text-2xl font-black text-amber-400">20 Menit</span>
            <p className="text-xs text-slate-400 mt-1">Hitung Mundur Server</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
            <span className="text-2xl font-black text-emerald-400">75%</span>
            <p className="text-xs text-slate-400 mt-1">Passing Grade Kelulusan</p>
          </div>
        </div>

        {/* System Gating Warning */}
        <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-200 flex items-start gap-3 mb-8">
          <svg className="w-5 h-5 shrink-0 text-indigo-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <div>
            <strong>Mekanisme System Gating:</strong> Bab {chapterId + 1} saat ini terkunci rapat. Nilai minimal 75% wajib dicapai untuk membuka silabus materi bab berikutnya secara otomatis.
          </div>
        </div>

        <button
          type="button"
          onClick={handleStartExam}
          className="w-full py-4 rounded-2xl font-extrabold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-xl shadow-indigo-600/30 transition-all text-base tracking-wide flex items-center justify-center gap-2"
        >
          <span>Mulai Ujian Sekarang</span>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    );
  }

  // 2. Result View (Pass / Remedial)
  if (examState === 'result' && result) {
    return (
      <div className="w-full max-w-3xl mx-auto rounded-3xl bg-slate-900/90 border border-slate-800 p-8 md:p-10 backdrop-blur-xl shadow-2xl text-slate-100">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mx-auto border-2 border-slate-700 bg-slate-950">
            {result.isPassed ? (
              <span className="text-4xl">🎉</span>
            ) : (
              <span className="text-4xl">📖</span>
            )}
          </div>

          <div className="space-y-1">
            <h2 className="text-3xl font-black text-white">
              {result.isPassed ? 'Selamat, Anda LULUS!' : 'Belum Mencapai Nilai Kelulusan'}
            </h2>
            <p className="text-sm text-slate-400">
              Hasil Ujian Evaluasi Mondai Bab {chapterId}
            </p>
          </div>

          {/* Score Badge */}
          <div className="py-4">
            <div className={`text-6xl font-black ${result.isPassed ? 'text-emerald-400' : 'text-amber-400'}`}>
              {result.scorePercent}%
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Menjawab benar {result.correctCount} dari {result.totalQuestions} soal (Batas lulus: 75%)
            </p>
          </div>
        </div>

        {/* Gating Status Card */}
        {result.isPassed ? (
          <div className="my-6 p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-sm space-y-2">
            <div className="flex items-center gap-2 font-bold text-emerald-300">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
              <span>KUNCI BAB {result.nextChapterUnlocked} BERHASIL TERBUKA!</span>
            </div>
            <p className="text-xs text-slate-300">
              Seluruh materi Bunpou, Kotoba, Renshu, dan Kaiwa untuk Bab {result.nextChapterUnlocked} kini sudah dapat diakses. Reward Omake juga telah dibuka.
            </p>
          </div>
        ) : (
          <div className="my-6 p-5 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-sm space-y-3">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>BAB {chapterId + 1} MASIH TERKUNCI (MODE REMEDIAL)</span>
            </div>
            <p className="text-xs text-slate-300">
              Anda membutuhkan nilai minimal 75% untuk melanjutkan kurikulum. Mohon pelajari rekomendasi di bawah ini:
            </p>
            {result.remedialGuidance && (
              <ul className="text-xs space-y-1.5 list-disc list-inside text-slate-300 pl-1">
                {result.remedialGuidance.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          {!result.isPassed ? (
            <button
              type="button"
              onClick={handleStartExam}
              className="flex-1 py-3.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/30"
            >
              Ulangi Ujian Evaluasi (Remedial)
            </button>
          ) : (
            <a
              href={`/materi/bab-${result.nextChapterUnlocked}`}
              className="flex-1 py-3.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-500 text-center transition-colors shadow-lg shadow-emerald-600/30"
            >
              Lanjut ke Bab {result.nextChapterUnlocked} ➔
            </a>
          )}
          <button
            type="button"
            onClick={() => setExamState('idle')}
            className="px-6 py-3.5 rounded-xl font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    );
  }

  // 3. Active Exam View
  const currentQ = questions[currentIdx];
  const isTimeCritical = timeLeftSeconds < 180; // < 3 min

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 p-4 md:p-6 text-slate-100">
      {/* Top Header: Title & Countdown Timer */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 md:p-6 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div>
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
            Evaluasi Bab {chapterId}
          </span>
          <h2 className="text-xl font-extrabold text-white">
            Soal {currentIdx + 1} dari {questions.length}
          </h2>
        </div>

        {/* Timer Badge */}
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-black transition-colors ${
            isTimeCritical
              ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
              : 'bg-slate-800/80 text-amber-300 border-amber-500/30'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{formatTimer(timeLeftSeconds)}</span>
        </div>
      </div>

      {/* Main Question Body */}
      {currentQ && (
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 md:p-8 backdrop-blur-md shadow-xl space-y-6">
          <div className="text-lg md:text-xl font-semibold text-slate-100 leading-relaxed">
            {currentQ.question_text}
          </div>

          {/* Options */}
          <div className="space-y-3">
            {currentQ.options.map((opt) => {
              const isSelected = answers[currentQ.id] === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectOption(currentQ.id, opt.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-4 ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-500/10'
                      : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {opt.id}
                  </span>
                  <span className="text-sm md:text-base font-medium">{opt.text}</span>
                </button>
              );
            })}
          </div>

          {/* Navigation Controls */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
              disabled={currentIdx === 0}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition-colors"
            >
              Sebelumnya
            </button>

            {currentIdx < questions.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentIdx((prev) => Math.min(questions.length - 1, prev + 1))}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors"
              >
                Selanjutnya
              </button>
            ) : (
              <button
                type="button"
                onClick={submitAnswers}
                disabled={examState === 'submitting'}
                className="px-6 py-2.5 rounded-xl text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-md shadow-emerald-600/30"
              >
                {examState === 'submitting' ? 'Menilai...' : 'Kumpulkan Ujian'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Question Index Grid */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 md:p-6 backdrop-blur-md">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Status Lembar Jawaban
        </h4>
        <div className="flex flex-wrap gap-2">
          {questions.map((q, idx) => {
            const isAnswered = !!answers[q.id];
            const isCurrent = idx === currentIdx;
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => setCurrentIdx(idx)}
                className={`w-9 h-9 rounded-xl font-bold text-xs transition-all flex items-center justify-center border ${
                  isCurrent
                    ? 'border-indigo-400 bg-indigo-600 text-white ring-2 ring-indigo-400/30'
                    : isAnswered
                    ? 'border-indigo-500/50 bg-indigo-950/60 text-indigo-300'
                    : 'border-slate-800 bg-slate-950/40 text-slate-500 hover:border-slate-700'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
