import React, { useState, useEffect } from 'react';
import { Question, UserAnswer } from '../types';
import { Clock, Bookmark, ChevronLeft, ChevronRight, Send, Volume2, AlertTriangle } from 'lucide-react';






interface CbtExamEngineProps {
  questions: Question[];
  onSubmitExam: (answers: UserAnswer[], timeSpentSeconds: number) => void;
}

export const CbtExamEngine: React.FC<CbtExamEngineProps> = ({
  questions,
  onSubmitExam
}) => {
  const TOTAL_TIME = 60 * 60; // 60 minutes in seconds
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Store user answers map: questionId -> UserAnswer
  const [answers, setAnswers] = useState<Map<number, UserAnswer>>(() => {
    const map = new Map<number, UserAnswer>();
    questions.forEach((q) => {
      map.set(q.id, { questionId: q.id, selectedOption: null, isFlagged: false });
    });
    return map;
  });

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

const handleFinishExam = () => {
  const timeSpent = TOTAL_TIME - timeLeft;
  const answerList = Array.from(answers.values());
  onSubmitExam(answerList, timeSpent);
};
  // Countdown timer effect
  useEffect(() => {
  const timer = setInterval(() => {
    setTimeLeft((prev) => {
      if (prev <= 1) {
        clearInterval(timer);
        handleFinishExam();
        return 0;
      }
      return prev - 1;
    });
  }, 1000);

  return () => clearInterval(timer);
}, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentQ = questions[currentIndex];
  const currentAnswer = answers.get(currentQ.id) || {
    questionId: currentQ.id,
    selectedOption: null,
    isFlagged: false
  };

  const handleSelectOption = (key: 'A' | 'B' | 'C' | 'D') => {
    setAnswers((prev) => {
      const next = new Map(prev);
      const curr = next.get(currentQ.id) || { questionId: currentQ.id, selectedOption: null, isFlagged: false };
      // Toggle if already selected
      const newOpt = curr.selectedOption === key ? null : key;
      next.set(currentQ.id, { ...curr, selectedOption: newOpt });
      return next;
    });
  };

  const handleToggleFlag = () => {
    setAnswers((prev) => {
      const next = new Map(prev);
      const curr = next.get(currentQ.id) || { questionId: currentQ.id, selectedOption: null, isFlagged: false };
      next.set(currentQ.id, { ...curr, isFlagged: !curr.isFlagged });
      return next;
    });
  };
  // Derived statistics for palette
  const answeredCount = Array.from(answers.values()).filter(a => a.selectedOption !== null).length;
  const flaggedCount = Array.from(answers.values()).filter(a => a.isFlagged).length;
  const unansweredCount = questions.length - answeredCount;

  const handleClearAnswer = () => {
    setAnswers((prev) => {
      const next = new Map(prev);
      const curr = next.get(currentQ.id) || { questionId: currentQ.id, selectedOption: null, isFlagged: false };
      next.set(currentQ.id, { ...curr, selectedOption: null });
      return next;
    });
  };



  // Stats for palette
  // (Removed redundant lock state; lock handling is managed at the page level)



  // Jump to section
  const jumpToSection = (sectionKey: 'S1' | 'S2' | 'S3' | 'S4') => {
    const idx = questions.findIndex((q) => q.section === sectionKey);
    if (idx !== -1) {
      setCurrentIndex(idx);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col select-none font-sans">
      {/* Top CBT Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-4">
          <div className="px-3 py-1 bg-red-600 font-extrabold text-lg text-white rounded tracking-wider shadow">
            JFT-Basic CBT
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">Simulasi Ujian Japan Foundation Test</h1>
            <p className="text-xs text-slate-400">Standard 50 Soal • Sesi Aktif CBT</p>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="hidden md:flex items-center gap-1 bg-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => jumpToSection('S1')}
            className={`px-3 py-1.5 rounded-lg transition ${
              currentQ.section === 'S1' ? 'bg-indigo-600 text-white shadow font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            S1: Moji Goi (12)
          </button>
          <button
            onClick={() => jumpToSection('S2')}
            className={`px-3 py-1.5 rounded-lg transition ${
              currentQ.section === 'S2' ? 'bg-indigo-600 text-white shadow font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            S2: Kaiwa (12)
          </button>
          <button
            onClick={() => jumpToSection('S3')}
            className={`px-3 py-1.5 rounded-lg transition ${
              currentQ.section === 'S3' ? 'bg-indigo-600 text-white shadow font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            S3: Chōkai (13)
          </button>
          <button
            onClick={() => jumpToSection('S4')}
            className={`px-3 py-1.5 rounded-lg transition ${
              currentQ.section === 'S4' ? 'bg-indigo-600 text-white shadow font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            S4: Dokkai (13)
          </button>
        </div>

        {/* Timer & Submit */}
        <div className="flex items-center gap-4">
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-mono font-bold shadow ${
              timeLeft < 300
                ? 'bg-red-950/80 border-red-600 text-red-400 animate-pulse'
                : 'bg-slate-800 border-slate-700 text-amber-400'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{formatTime(timeLeft)}</span>
          </div>

          <button
            onClick={() => setConfirmModalOpen(true)}
            className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-lg transition flex items-center gap-1.5"
          >
            <Send className="w-4 h-4" />
            Selesai Ujian
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left / Middle: Question Workspace */}
        <main className="flex-1 flex flex-col p-6 overflow-y-auto space-y-6">
          {/* Question Header Card */}
          <div className="flex items-center justify-between bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-extrabold flex items-center justify-center text-sm">
                #{currentQ.number}
              </span>
              <div>
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  {currentQ.sectionTitle}
                </span>
                <p className="text-xs text-slate-400">Soal {currentIndex + 1} dari 50</p>
              </div>
            </div>

            <button
              onClick={handleToggleFlag}
              className={`py-1.5 px-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
                currentAnswer.isFlagged
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              {currentAnswer.isFlagged ? 'Ragu-ragu (Ditandai)' : 'Tandai Ragu-ragu'}
            </button>
          </div>

          {/* Reading Passage (Dokkai S4 Split View) */}
          {currentQ.readingPassage && (
            <div className="p-4 bg-slate-900/90 rounded-2xl border border-indigo-900/50 space-y-2 text-xs text-slate-200 font-japanese leading-relaxed">
              <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider border-b border-slate-800 pb-1">
                📖 Teks Bacaan (Dokkai):
              </div>
              <div className="whitespace-pre-line leading-relaxed">{currentQ.readingPassage}</div>
            </div>
          )}

          {/* Question Main Text */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-md space-y-4">
            <div className="text-base font-semibold text-white leading-relaxed font-japanese whitespace-pre-line">
              {currentQ.questionText}
            </div>

            {/* Audio Player for Chōkai (Listening) */}
            {currentQ.audioUrl && (
              <div className="p-4 bg-slate-950 rounded-xl border border-indigo-800/60 space-y-2">
                <div className="flex items-center justify-between text-xs text-indigo-300 font-semibold">
                  <span className="flex items-center gap-1">
                    <Volume2 className="w-4 h-4 text-indigo-400 animate-pulse" />
                    Pemutar Audio Chōkai (Audio Player)
                  </span>
                  <span className="text-[11px] text-slate-400">Putar ulang audio per soal</span>
                </div>
                <audio controls className="w-full h-10 rounded-lg">
                  <source src={currentQ.audioUrl} type="audio/ogg" />
                  Browser Anda tidak mendukung pemutar audio.
                </audio>
              </div>
            )}

            {/* Image attachment if any */}
            {currentQ.imageUrl && (
              <div className="my-3">
                <img
                  src={currentQ.imageUrl}
                  alt="Attachment"
                  className="max-h-60 rounded-xl border border-slate-700 object-contain mx-auto"
                />
              </div>
            )}
          </div>

          {/* Options Choice Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentQ.options.map((opt) => {
              const isSelected = currentAnswer.selectedOption === opt.key;

              return (
                <button
                  key={opt.key}
                  onClick={() => handleSelectOption(opt.key)}
                  className={`p-4 rounded-2xl border text-left transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg ring-2 ring-indigo-500/50'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl font-bold flex items-center justify-center text-xs transition ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {opt.key}
                    </div>
                    <span className="text-sm font-medium font-japanese">{opt.text}</span>
                  </div>

                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                      ✓
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom Action Control Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800 mt-auto">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-200 text-xs font-semibold rounded-xl border border-slate-800 transition flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              Sebelumnya
            </button>

            <button
              onClick={handleClearAnswer}
              className="py-2 px-3 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-lg transition"
            >
              Hapus Jawaban
            </button>

            <button
              onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
              disabled={currentIndex === questions.length - 1}
              className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-semibold rounded-xl shadow transition flex items-center gap-1.5"
            >
              Berikutnya
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </main>

        {/* Right Sidebar: Question Palette & Navigation */}
        <aside className="w-full md:w-80 bg-slate-900 border-l border-slate-800 p-5 flex flex-col space-y-5 overflow-y-auto">
          <div>
            <h2 className="text-sm font-bold text-white mb-1">Lembar Nomor Soal</h2>
            <p className="text-xs text-slate-400">Klik nomor untuk melompat ke soal</p>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="text-slate-300">Dijawab ({answeredCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <span className="text-slate-300">Ragu ({flaggedCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-700"></span>
              <span className="text-slate-300">Belum ({unansweredCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-indigo-500 ring-2 ring-white"></span>
              <span className="text-slate-300">Posisi Saat Ini</span>
            </div>
          </div>

          {/* 1 - 50 Grid */}
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, idx) => {
              const ans = answers.get(q.id);
              const isAnswered = ans?.selectedOption !== null;
              const isFlagged = ans?.isFlagged;
              const isCurrent = idx === currentIndex;

              let btnStyle = 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700';

              if (isCurrent) {
                btnStyle = 'bg-indigo-600 text-white ring-2 ring-white font-extrabold shadow';
              } else if (isFlagged) {
                btnStyle = 'bg-amber-500/30 border-amber-500 text-amber-300 font-bold';
              } else if (isAnswered) {
                btnStyle = 'bg-emerald-600/30 border-emerald-500 text-emerald-300 font-semibold';
              }

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-10 rounded-xl text-xs flex flex-col items-center justify-center border transition relative ${btnStyle}`}
                >
                  <span>{q.number}</span>
                  {isFlagged && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Submit Button in Sidebar */}
          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={() => setConfirmModalOpen(true)}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Selesaikan Ujian Sekarang
            </button>
          </div>
        </aside>
      </div>

      {/* Confirmation Modal */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500 text-amber-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Konfirmasi Penyelesaian Ujian</h3>
              <p className="text-xs text-slate-400">
                Apakah Anda yakin ingin mengakhiri sesi simulasi ini?
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
              <div className="flex justify-between">
                <span>Soal Dijawab:</span>
                <span className="font-bold text-emerald-400">{answeredCount} / 50</span>
              </div>
              <div className="flex justify-between">
                <span>Belum Dijawab:</span>
                <span className="font-bold text-slate-400">{unansweredCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Ragu-ragu (Ditandai):</span>
                <span className="font-bold text-amber-400">{flaggedCount}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setConfirmModalOpen(false)}
                className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition"
              >
                Kembali ke Soal
              </button>
              <button
                onClick={handleFinishExam}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition"
              >
                Ya, Selesaikan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
