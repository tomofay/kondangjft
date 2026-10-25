'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Question, UserAnswer, User } from '../types';
import {
  Clock,
  Send,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Volume2,
  BookOpen,
  Check,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
  Eye,
  LogOut,
  Lock,
  ArrowRight,
  ShieldAlert,
  Info
} from 'lucide-react';
import { renderFormattedQuestion } from '../lib/formatQuestion';

const ACTIVE_EXAM_STORAGE_KEY = 'kondang_active_exam_session';

interface StoredExamSession {
  userId?: string;
  packageId?: number;
  currentIndex: number;
  activeSectionIndex: number;
  timeLeft: number;
  answers: [number, UserAnswer][];
  lastSavedAt: number;
}

function readStoredExamSession(userId?: string, packageId?: number): StoredExamSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ACTIVE_EXAM_STORAGE_KEY);
    if (!raw) return null;
    const data: StoredExamSession = JSON.parse(raw);
    if (!data || typeof data !== 'object') return null;
    if (userId && data.userId && data.userId !== userId) return null;
    if (packageId && data.packageId && data.packageId !== packageId) return null;
    return data;
  } catch {
    return null;
  }
}

interface CbtExamEngineProps {
  questions: Question[];
  onSubmitExam: (answers: UserAnswer[], timeSpentSeconds: number) => void;
  user?: User;
  onExitExam?: () => void;
  onProgressUpdate?: (progress: {
    currentIndex: number;
    currentNumber: number;
    currentSection: string;
    sectionTitle?: string;
    answeredCount: number;
    totalQuestions: number;
    timeLeftSeconds: number;
  }) => void;
}

export const CbtExamEngine: React.FC<CbtExamEngineProps> = ({
  questions,
  onSubmitExam,
  user,
  onExitExam,
  onProgressUpdate
}) => {
  const TOTAL_TIME = 60 * 60; // 60 minutes in seconds

  const currentPkgId = questions[0]?.packageId || 1;
  const initialSaved = readStoredExamSession(user?.id, currentPkgId);

  const initialTimeLeft = (() => {
    if (initialSaved && typeof initialSaved.timeLeft === 'number' && initialSaved.lastSavedAt) {
      const elapsed = Math.floor((Date.now() - initialSaved.lastSavedAt) / 1000);
      return Math.max(1, initialSaved.timeLeft - Math.max(0, elapsed));
    }
    return TOTAL_TIME;
  })();

  const [timeLeft, setTimeLeft] = useState(initialTimeLeft);
  const [currentIndex, setCurrentIndex] = useState(() => {
    if (initialSaved && typeof initialSaved.currentIndex === 'number') {
      return Math.max(0, Math.min(Math.max(0, questions.length - 1), initialSaved.currentIndex));
    }
    return 0;
  });

  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return false;
    }
    return true;
  });

  // Group questions by Section (S1, S2, S3, S4)
  const sections = [
    { key: 'S1', title: 'S1 - Moji to Goi (文字と語彙)', label: 'S1 - Moji to Goi', ja: '文字と語彙', en: 'Script and Vocabulary' },
    { key: 'S2', title: 'S2 - Kaiwa (会話と表現)', label: 'S2 - Kaiwa', ja: '会話と表現', en: 'Conversation and Expression' },
    { key: 'S3', title: 'S3 - Chōkai (聴解 / audio)', label: 'S3 - Chōkai (Audio)', ja: '聴解', en: 'Listening Comprehension' },
    { key: 'S4', title: 'S4 - Dokkai (読解 / bacaan)', label: 'S4 - Dokkai', ja: '読解', en: 'Reading Comprehension' }
  ];

  // Active section index (0 = S1, 1 = S2, 2 = S3, 3 = S4) Prometric Section Locking
  const [activeSectionIndex, setActiveSectionIndex] = useState(() => {
    if (initialSaved && typeof initialSaved.activeSectionIndex === 'number') {
      return Math.max(0, Math.min(3, initialSaved.activeSectionIndex));
    }
    return 0;
  });
  const activeSection = sections[activeSectionIndex] || sections[0];

  // Store user answers map: questionId -> UserAnswer
  const [answers, setAnswers] = useState<Map<number, UserAnswer>>(() => {
    const map = new Map<number, UserAnswer>();
    questions.forEach((q) => {
      map.set(q.id, { questionId: q.id, selectedOption: null, isFlagged: false });
    });
    if (initialSaved && Array.isArray(initialSaved.answers)) {
      initialSaved.answers.forEach(([qId, ans]) => {
        if (map.has(qId)) {
          map.set(qId, ans);
        }
      });
    }
    return map;
  });

  // Restore saved state when questions arrive after initial render
  useEffect(() => {
    if (questions.length === 0) return;
    const pkg = questions[0]?.packageId || 1;
    const saved = readStoredExamSession(user?.id, pkg);
    if (!saved) return;

    setAnswers((prev) => {
      const map = new Map<number, UserAnswer>();
      questions.forEach((q) => {
        map.set(q.id, { questionId: q.id, selectedOption: null, isFlagged: false });
      });
      if (Array.isArray(saved.answers)) {
        saved.answers.forEach(([qId, ans]) => {
          if (map.has(qId)) {
            map.set(qId, ans);
          }
        });
      }
      return map;
    });

    if (typeof saved.currentIndex === 'number') {
      setCurrentIndex(Math.max(0, Math.min(questions.length - 1, saved.currentIndex)));
    }
    if (typeof saved.activeSectionIndex === 'number') {
      setActiveSectionIndex(Math.max(0, Math.min(3, saved.activeSectionIndex)));
    }
    if (typeof saved.timeLeft === 'number' && saved.lastSavedAt) {
      const elapsed = Math.floor((Date.now() - saved.lastSavedAt) / 1000);
      setTimeLeft(Math.max(1, saved.timeLeft - Math.max(0, elapsed)));
    }
  }, [questions, user?.id]);

  // Persist live session state to localStorage
  const saveLiveState = useCallback(() => {
    if (!user?.id || questions.length === 0) return;
    try {
      const pkg = questions[0]?.packageId || 1;
      const data: StoredExamSession = {
        userId: user.id,
        packageId: pkg,
        currentIndex,
        activeSectionIndex,
        timeLeft,
        answers: Array.from(answers.entries()),
        lastSavedAt: Date.now()
      };
      localStorage.setItem(ACTIVE_EXAM_STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.warn('Failed to save exam state to localStorage:', err);
    }
  }, [user?.id, questions, currentIndex, activeSectionIndex, timeLeft, answers]);

  useEffect(() => {
    saveLiveState();
  }, [saveLiveState]);

  // Beforeunload protection: warn candidate before reload/navigation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      saveLiveState();
      e.preventDefault();
      e.returnValue = 'Ujian CBT sedang berlangsung. Jika Anda memuat ulang, progres jawaban Anda tetap tersimpan.';
      return 'Ujian CBT sedang berlangsung. Jika Anda memuat ulang, progres jawaban Anda tetap tersimpan.';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveLiveState]);

  // Modals state
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [sectionTransitionModalOpen, setSectionTransitionModalOpen] = useState(false);
  const [exitModalOpen, setExitModalOpen] = useState(false);
  const [lockedToastMessage, setLockedToastMessage] = useState<string | null>(null);

  // Image zoom lightbox
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState(1);

  // Keyboard shortcut for escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setZoomedImageUrl(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleFinishExam = useCallback(() => {
    try {
      localStorage.removeItem(ACTIVE_EXAM_STORAGE_KEY);
    } catch {}
    const timeSpent = TOTAL_TIME - timeLeft;
    const answerList = Array.from(answers.values());
    onSubmitExam(answerList, timeSpent);
  }, [TOTAL_TIME, timeLeft, answers, onSubmitExam]);

  const handleFinishExamRef = useRef(handleFinishExam);
  useEffect(() => {
    handleFinishExamRef.current = handleFinishExam;
  }, [handleFinishExam]);

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinishExamRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const onProgressUpdateRef = useRef(onProgressUpdate);
  useEffect(() => {
    onProgressUpdateRef.current = onProgressUpdate;
  });

  const lastProgressKeyRef = useRef<string>('');

  // Real-time progress update for live supervisor monitoring
  useEffect(() => {
    if (!onProgressUpdateRef.current) return;
    const q = questions[currentIndex];
    const answeredCount = Array.from(answers.values()).filter((a) => a.selectedOption !== null).length;
    const key = `${currentIndex}_${answeredCount}_${timeLeft}_${questions.length}`;
    if (lastProgressKeyRef.current === key) return;
    lastProgressKeyRef.current = key;

    onProgressUpdateRef.current({
      currentIndex,
      currentNumber: q?.number || currentIndex + 1,
      currentSection: q?.section || 'S1',
      sectionTitle: q?.sectionTitle,
      answeredCount,
      totalQuestions: questions.length,
      timeLeftSeconds: timeLeft
    });
  }, [currentIndex, answers, timeLeft, questions]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentQ = questions[currentIndex] || questions[0];
  const currentAnswer = (currentQ && answers.get(currentQ.id)) || {
    questionId: currentQ?.id || 1,
    selectedOption: null,
    isFlagged: false
  };

  const handleSelectOption = (key: 'A' | 'B' | 'C' | 'D') => {
    if (!currentQ) return;
    setAnswers((prev) => {
      const next = new Map(prev);
      const curr = next.get(currentQ.id) || { questionId: currentQ.id, selectedOption: null, isFlagged: false };
      const newOpt = curr.selectedOption === key ? null : key;
      next.set(currentQ.id, { ...curr, selectedOption: newOpt });
      return next;
    });
  };

  const handleToggleFlag = () => {
    if (!currentQ) return;
    setAnswers((prev) => {
      const next = new Map(prev);
      const curr = next.get(currentQ.id) || { questionId: currentQ.id, selectedOption: null, isFlagged: false };
      next.set(currentQ.id, { ...curr, isFlagged: !curr.isFlagged });
      return next;
    });
  };

  const handleClearAnswer = () => {
    if (!currentQ) return;
    setAnswers((prev) => {
      const next = new Map(prev);
      const curr = next.get(currentQ.id) || { questionId: currentQ.id, selectedOption: null, isFlagged: false };
      next.set(currentQ.id, { ...curr, selectedOption: null });
      return next;
    });
  };

  // Section specific questions & indices
  const activeSectionQuestions = questions
    .map((q, idx) => ({ ...q, globalIdx: idx }))
    .filter((q) => q.section === activeSection.key);

  const activeSectionFirstIdx = activeSectionQuestions[0]?.globalIdx ?? 0;
  const activeSectionLastIdx = activeSectionQuestions[activeSectionQuestions.length - 1]?.globalIdx ?? 0;

  // Stats for the active section
  const activeSecAnsweredCount = activeSectionQuestions.filter((q) => {
    const a = answers.get(q.id);
    return a && a.selectedOption !== null;
  }).length;
  const activeSecFlaggedCount = activeSectionQuestions.filter((q) => {
    const a = answers.get(q.id);
    return a && a.isFlagged;
  }).length;
  const activeSecUnansweredCount = activeSectionQuestions.length - activeSecAnsweredCount;

  // Overall statistics
  const totalAnsweredCount = Array.from(answers.values()).filter((a) => a.selectedOption !== null).length;
  const totalFlaggedCount = Array.from(answers.values()).filter((a) => a.isFlagged).length;
  const totalUnansweredCount = questions.length - totalAnsweredCount;

  // Handle question click from palette (Section Locking Enforcement)
  const handleSelectQuestion = (globalIdx: number, sectionKey: string) => {
    if (sectionKey === activeSection.key) {
      setCurrentIndex(globalIdx);
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    } else {
      const targetSecIdx = sections.findIndex((s) => s.key === sectionKey);
      if (targetSecIdx < activeSectionIndex) {
        showLockedToast(
          `🔒 Seksi ${sectionKey} telah diselesaikan dan dikunci permanen. Anda tidak dapat kembali mengubah jawaban pada seksi yang telah lewat.`
        );
      } else {
        showLockedToast(
          `🔒 Seksi ${sectionKey} masih terkunci. Anda harus menyelesaikan Seksi ${activeSection.key} (${activeSection.ja}) terlebih dahulu.`
        );
      }
    }
  };

  const showLockedToast = (msg: string) => {
    setLockedToastMessage(msg);
    setTimeout(() => {
      setLockedToastMessage(null);
    }, 3500);
  };

  // Navigation handlers
  const isFirstOfActiveSection = currentIndex === activeSectionFirstIdx;
  const isLastOfActiveSection = currentIndex === activeSectionLastIdx;

  const handlePrevQuestion = () => {
    if (!isFirstOfActiveSection) {
      setCurrentIndex((prev) => Math.max(activeSectionFirstIdx, prev - 1));
    }
  };

  const handleNextQuestion = () => {
    if (!isLastOfActiveSection) {
      setCurrentIndex((prev) => Math.min(activeSectionLastIdx, prev + 1));
    } else {
      // Reached the end of the current section
      if (activeSectionIndex < sections.length - 1) {
        setSectionTransitionModalOpen(true);
      } else {
        setConfirmModalOpen(true);
      }
    }
  };

  // Advance to next section from confirmation modal
  const handleProceedToNextSection = () => {
    const nextSecIdx = activeSectionIndex + 1;
    if (nextSecIdx < sections.length) {
      setActiveSectionIndex(nextSecIdx);
      const nextKey = sections[nextSecIdx].key;
      const nextFirst = questions.findIndex((q) => q.section === nextKey);
      if (nextFirst !== -1) {
        setCurrentIndex(nextFirst);
      }
    }
    setSectionTransitionModalOpen(false);
  };

  if (!questions || questions.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center max-w-md mx-auto my-12 shadow-sm">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h3 className="font-bold text-stone-900 text-sm">Menyiapkan Lembar Ujian CBT...</h3>
        <p className="text-xs text-stone-500 mt-1">Mengambil butir soal dan memulihkan sesi ujian Anda.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#f8fafc] text-stone-900 rounded-3xl border border-stone-200/90 shadow-sm flex flex-col md:flex-row overflow-hidden min-h-[84vh] relative">
      {/* Toast Alert for Section Lock Notification */}
      {lockedToastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-60 bg-stone-900/95 text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2 border border-amber-400/40 animate-in fade-in slide-in-from-top-4 max-w-md text-center">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{lockedToastMessage}</span>
        </div>
      )}

      {/* Mobile Backdrop when Sidebar Drawer is open */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-stone-900/40 backdrop-blur-xs md:hidden animate-in fade-in"
        />
      )}

      {/* Left Sidebar / Off-canvas Drawer: Prometric Navigation with Section Lock */}
      <aside
        className={`${
          sidebarOpen
            ? 'fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] md:static md:w-72 lg:w-80 shadow-2xl md:shadow-none'
            : 'hidden'
        } bg-white border-r border-stone-200 p-4 sm:p-5 flex flex-col space-y-4 overflow-y-auto shrink-0 transition-all duration-200 h-full max-h-screen`}
      >
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">
                PROMETRIC CBT ENGINE
              </span>
            </div>
            <h2 className="text-base font-black text-stone-900 leading-tight">
              Navigasi Soal
            </h2>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-xs px-2.5 py-1 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold transition md:hidden cursor-pointer"
          >
            Tutup
          </button>
        </div>

        {/* Prometric Active Section Indicator Pill */}
        <div className="p-3 rounded-2xl bg-gradient-to-r from-indigo-50/80 to-sky-50/80 border border-indigo-200/80 space-y-1">
          <div className="text-[10px] font-black uppercase text-indigo-700 tracking-wide flex items-center justify-between">
            <span>Seksi Aktif ({activeSectionIndex + 1}/4):</span>
            <span className="font-mono text-emerald-700 font-bold">Terbuka</span>
          </div>
          <div className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
            <span className="font-japanese text-sm">{activeSection.ja}</span>
            <span className="text-stone-500 text-[11px]">({activeSection.en})</span>
          </div>
          <div className="text-[10px] text-stone-500 leading-tight pt-0.5">
            Soal terjawab: <strong className="text-indigo-900">{activeSecAnsweredCount}</strong> / {activeSectionQuestions.length}
          </div>
        </div>

        {/* Legend Indicator */}
        <div className="grid grid-cols-2 gap-2 text-[11px] bg-stone-50 p-2.5 rounded-xl border border-stone-200">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
            <span className="text-stone-700 font-medium">Aktif</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-stone-700 font-medium">Dijawab</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span className="text-stone-700 font-medium">Ragu-ragu</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-stone-300"></span>
            <span className="text-stone-700 font-medium">Belum / Terkunci</span>
          </div>
        </div>

        {/* Section Groups (S1, S2, S3, S4) with Locked State Visualization */}
        <div className="space-y-4 flex-1">
          {sections.map((sec, secIdx) => {
            const secQuestions = questions
              .map((q, idx) => ({ ...q, globalIdx: idx }))
              .filter((q) => q.section === sec.key);

            if (secQuestions.length === 0) return null;

            const isCurrentSection = secIdx === activeSectionIndex;
            const isCompletedSection = secIdx < activeSectionIndex;
            const isFutureSection = secIdx > activeSectionIndex;

            return (
              <div
                key={sec.key}
                className={`space-y-2 p-2.5 rounded-2xl border transition ${
                  isCurrentSection
                    ? 'bg-white border-indigo-200 shadow-xs ring-1 ring-indigo-500/10'
                    : isCompletedSection
                    ? 'bg-stone-50/70 border-stone-200 opacity-60'
                    : 'bg-stone-100/50 border-stone-200/80 opacity-50'
                }`}
              >
                {/* Section Header */}
                <div className="text-xs font-black text-stone-700 flex items-center justify-between border-b border-stone-100 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    {isCurrentSection ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    ) : (
                      <Lock className="w-3 h-3 text-stone-400" />
                    )}
                    <span>{sec.label}</span>
                  </div>

                  <span className="text-[10px] font-mono font-bold">
                    {isCurrentSection ? (
                      <span className="text-indigo-600 font-black">SEDANG AKTIF</span>
                    ) : isCompletedSection ? (
                      <span className="text-stone-500">DIKUNCI (SELESAI)</span>
                    ) : (
                      <span className="text-stone-400">TERKUNCI</span>
                    )}
                  </span>
                </div>

                {/* 4-Column Number Grid */}
                <div className="grid grid-cols-4 gap-2 pt-0.5">
                  {secQuestions.map((sq) => {
                    const ans = answers.get(sq.id);
                    const isAnswered = ans?.selectedOption !== null;
                    const isFlagged = ans?.isFlagged;
                    const isCurrent = sq.globalIdx === currentIndex;

                    let btnClasses = '';

                    if (!isCurrentSection) {
                      // Disabled/locked question
                      btnClasses = 'bg-stone-100 border-stone-200 text-stone-400 cursor-not-allowed';
                    } else if (isCurrent) {
                      btnClasses = 'bg-indigo-600 border-indigo-600 text-white font-black shadow-sm ring-2 ring-indigo-400/40 cursor-pointer';
                    } else if (isFlagged) {
                      btnClasses = 'bg-amber-50 border-amber-400 text-amber-800 font-bold hover:bg-amber-100 cursor-pointer';
                    } else if (isAnswered) {
                      btnClasses = 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold hover:bg-emerald-100 cursor-pointer';
                    } else {
                      btnClasses = 'bg-white border-stone-200 text-stone-700 hover:border-indigo-300 hover:bg-indigo-50/40 cursor-pointer';
                    }

                    return (
                      <button
                        key={sq.id}
                        type="button"
                        onClick={() => handleSelectQuestion(sq.globalIdx, sec.key)}
                        className={`h-9 rounded-xl border text-xs font-mono transition flex items-center justify-center relative ${btnClasses}`}
                        title={
                          !isCurrentSection
                            ? isCompletedSection
                              ? 'Seksi ini telah selesai dan dikunci'
                              : 'Seksi ini belum terbuka'
                            : `Soal #${sq.number}`
                        }
                      >
                        {!isCurrentSection && (
                          <Lock className="w-2.5 h-2.5 absolute top-1 right-1 text-stone-400 opacity-60" />
                        )}
                        <span>{sq.number}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sidebar Action Button */}
        <div className="pt-2 border-t border-stone-100">
          {activeSectionIndex < sections.length - 1 ? (
            <button
              onClick={() => setSectionTransitionModalOpen(true)}
              className="w-full py-2.5 px-3 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Selesai Seksi {activeSection.key} ➔</span>
            </button>
          ) : (
            <button
              onClick={() => setConfirmModalOpen(true)}
              className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Selesai Seluruh Ujian</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main CBT Exam Area */}
      <div className="flex-1 flex flex-col bg-[#f8fafc] overflow-y-auto">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-stone-200 px-3 sm:px-6 py-2.5 sm:py-3.5 flex flex-wrap items-center justify-between gap-2 sm:gap-3 shadow-2xs">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`py-1.5 px-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                sidebarOpen
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200'
              }`}
              title="Buka Navigasi Palet Soal"
            >
              <Eye className="w-3.5 h-3.5 text-indigo-600" />
              <span>Navigasi</span>
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <span className="px-2 py-0.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono text-xs font-black shrink-0">
                {activeSection.key}
              </span>
              <h1 className="text-xs sm:text-base font-black text-stone-900 tracking-tight truncate">
                Soal #{currentQ?.number}
                <span className="hidden sm:inline font-normal text-stone-400"> — {currentQ?.sectionTitle || activeSection.title}</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Timer Badge (Sky Blue Normal, Amber Urgent) */}
            <div
              className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl border text-[11px] sm:text-xs font-mono font-black shadow-2xs flex items-center gap-1 sm:gap-1.5 ${
                timeLeft < 300
                  ? 'bg-amber-50 border-amber-300 text-amber-800 animate-pulse'
                  : 'bg-sky-50 border-sky-200 text-sky-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span>{formatTime(timeLeft)}</span>
            </div>

            {/* Keluar Button */}
            <button
              onClick={() => setExitModalOpen(true)}
              className="py-1 sm:py-1.5 px-2.5 sm:px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] sm:text-xs font-bold rounded-xl border border-stone-200 transition cursor-pointer"
            >
              Keluar
            </button>

            {/* Selesai Seksi / Ujian Button */}
            {activeSectionIndex < sections.length - 1 ? (
              <button
                onClick={() => setSectionTransitionModalOpen(true)}
                className="py-1 sm:py-1.5 px-2.5 sm:px-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-[11px] sm:text-xs font-black rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer"
              >
                <span>Selesai {activeSection.key} ➔</span>
              </button>
            ) : (
              <button
                onClick={() => setConfirmModalOpen(true)}
                className="py-1 sm:py-1.5 px-3 sm:px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-[11px] sm:text-xs font-black rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer"
              >
                <span>Selesai</span>
              </button>
            )}
          </div>
        </header>

        {/* Question Workspace Content */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 space-y-5 max-w-4xl w-full mx-auto">
          {/* Section Rule Reminder Banner */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-900 font-medium flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Aturan Prometric:</strong> Anda saat ini sedang mengerjakan{' '}
                <strong className="underline">{activeSection.ja} ({activeSection.en})</strong>. Selesaikan seluruh soal pada seksi ini sebelum melanjutkan ke seksi berikutnya.
              </span>
            </div>
            <span className="font-mono text-amber-800 font-bold shrink-0">
              {activeSecAnsweredCount}/{activeSectionQuestions.length} Terjawab
            </span>
          </div>

          {/* Question Box Container */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-5 sm:p-7 shadow-xs space-y-5">
            {/* Reading Passage (Dokkai S4) */}
            {currentQ?.readingPassage && (
              <div className="p-4 sm:p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2 text-xs sm:text-sm text-stone-800 font-japanese leading-relaxed">
                <div className="text-[11px] font-black text-emerald-700 uppercase tracking-wider border-b border-stone-200 pb-1 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Teks Bacaan (Dokkai / 読解):</span>
                </div>
                <div className="whitespace-pre-line leading-relaxed">
                  {currentQ.readingPassage}
                </div>
              </div>
            )}

            {/* Audio Player for Chōkai (Listening) */}
            {currentQ?.audioUrl && (
              <div className="p-4 bg-sky-50/60 rounded-2xl border border-sky-200 space-y-2">
                <div className="flex items-center justify-between text-xs text-sky-900 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-sky-600 animate-pulse" />
                    Pemutar Audio Chōkai (聴解 Audio)
                  </span>
                  <span className="text-[11px] text-stone-500 font-normal">
                    Putar rekaman audio soal JFT
                  </span>
                </div>
                <audio
                  key={currentQ.audioUrl + '_' + currentQ.id}
                  controls
                  preload="auto"
                  className="w-full h-10 rounded-xl"
                  src={currentQ.audioUrl}
                >
                  <source
                    src={currentQ.audioUrl}
                    type={currentQ.audioUrl.endsWith('.ogg') ? 'audio/ogg' : 'audio/mpeg'}
                  />
                  Browser Anda tidak mendukung pemutar audio.
                </audio>
              </div>
            )}

            {/* Image attachment if any (Clickable to zoom) */}
            {currentQ?.imageUrl && (
              <div className="text-center py-2">
                <div
                  onClick={() => {
                    setZoomedImageUrl(currentQ.imageUrl!);
                    setZoomScale(1);
                  }}
                  className="relative inline-block group cursor-zoom-in rounded-2xl overflow-hidden border border-stone-200 bg-stone-50 p-1.5 shadow-xs hover:border-indigo-400 transition"
                  title="Klik untuk memperbesar gambar"
                >
                  <img
                    src={currentQ.imageUrl}
                    alt="Lampiran Soal"
                    className="max-h-60 sm:max-h-72 rounded-xl object-contain mx-auto transition transform group-hover:scale-[1.01]"
                  />
                  <div className="absolute bottom-3 right-3 px-3 py-1 bg-white/95 text-stone-800 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md border border-stone-200 pointer-events-none group-hover:text-indigo-600">
                    <ZoomIn className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Perbesar</span>
                  </div>
                </div>
              </div>
            )}

            {/* Question Text Main */}
            <div className="text-sm sm:text-base font-semibold text-stone-900 leading-relaxed font-japanese whitespace-pre-line">
              {renderFormattedQuestion(currentQ?.questionText || '')}
            </div>

            {/* Options Choice List */}
            <div className="space-y-3 pt-2">
              {currentQ?.options?.map((opt) => {
                const isSelected = currentAnswer.selectedOption === opt.key;

                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => handleSelectOption(opt.key)}
                    className={`w-full p-4 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'border-2 border-indigo-600 bg-indigo-50/70 text-stone-900 shadow-2xs ring-1 ring-indigo-500/30'
                        : 'border border-stone-200 hover:border-indigo-300 hover:bg-stone-50/70 text-stone-800 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-7 h-7 rounded-lg font-black flex items-center justify-center text-xs transition ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-stone-100 text-stone-700 border border-stone-200'
                        }`}
                      >
                        {opt.key}.
                      </span>
                      <span className="text-sm font-semibold font-japanese leading-snug">
                        {opt.text}
                      </span>
                    </div>

                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-stone-200/80">
            {/* Primary Navigation Buttons */}
            <div className="flex items-center gap-2 order-2 sm:order-1 justify-between sm:justify-start w-full sm:w-auto">
              <button
                onClick={handlePrevQuestion}
                disabled={isFirstOfActiveSection}
                className="flex-1 sm:flex-initial py-2.5 px-4 sm:px-5 bg-white hover:bg-stone-100 disabled:opacity-40 text-stone-700 text-xs font-bold rounded-xl border border-stone-200 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Sebelumnya</span>
              </button>

              {isLastOfActiveSection ? (
                activeSectionIndex < sections.length - 1 ? (
                  <button
                    onClick={() => setSectionTransitionModalOpen(true)}
                    className="flex-1 sm:flex-initial py-2.5 px-4 sm:px-5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white text-xs font-black rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Selesai Seksi {activeSection.key} ➔</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setConfirmModalOpen(true)}
                    className="flex-1 sm:flex-initial py-2.5 px-4 sm:px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Selesai & Nilai</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                )
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="flex-1 sm:flex-initial py-2.5 px-4 sm:px-5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-black rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Berikutnya</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Secondary Option Actions (Tandai Ragu & Hapus) */}
            <div className="flex items-center gap-2 order-1 sm:order-2 justify-end w-full sm:w-auto">
              <button
                onClick={handleToggleFlag}
                className={`flex-1 sm:flex-initial py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  currentAnswer.isFlagged
                    ? 'bg-amber-50 border-amber-300 text-amber-800 font-bold'
                    : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5 text-amber-500" />
                <span>{currentAnswer.isFlagged ? 'Ditandai Ragu' : 'Tandai Ragu'}</span>
              </button>

              <button
                onClick={handleClearAnswer}
                className="py-2 px-3 text-xs text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition cursor-pointer"
              >
                Hapus Jawaban
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Prometric Section Transition Confirmation Modal (Lock Enforcement) */}
      {sectionTransitionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="max-w-md w-full bg-white border border-stone-200 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 mx-auto flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <span className="text-[10px] font-black uppercase text-amber-700 tracking-wider">
                PROMETRIC CBT SECTION CONFIRMATION
              </span>
              <h3 className="text-lg font-black text-stone-900 font-japanese">
                セクション終了の確認
              </h3>
              <p className="text-xs text-stone-600 font-medium">
                Konfirmasi Penyelesaian Seksi {activeSection.key}: {activeSection.ja}
              </p>
            </div>

            {/* Status Statistics for current section */}
            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-700 space-y-2">
              <div className="flex justify-between font-medium">
                <span>Soal Terjawab pada Seksi Ini:</span>
                <span className="font-black text-emerald-700">
                  {activeSecAnsweredCount} / {activeSectionQuestions.length}
                </span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Belum Terjawab:</span>
                <span className={`font-bold ${activeSecUnansweredCount > 0 ? 'text-rose-600' : 'text-stone-600'}`}>
                  {activeSecUnansweredCount} Soal
                </span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Ditandai Ragu-ragu:</span>
                <span className="font-bold text-amber-700">{activeSecFlaggedCount} Soal</span>
              </div>
            </div>

            {/* Prometric Official Warning Callout */}
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl space-y-1 text-xs text-amber-950">
              <div className="font-bold flex items-center gap-1.5 font-japanese">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>このセクションを終了して次のセクションに進みますか？</span>
              </div>
              <p className="text-[11px] text-amber-900 leading-relaxed pl-5">
                次のセクションに進むと、前のセクションに戻って回答を確認・変更することはできません。
              </p>
              <p className="text-[11px] text-stone-600 leading-relaxed pl-5 font-semibold pt-1">
                (Setelah melanjutkan ke seksi berikutnya, Anda <strong>TIDAK DAPAT KEMBALI</strong> ke seksi ini untuk mengubah jawaban).
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setSectionTransitionModalOpen(false)}
                className="flex-1 py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Kembali Periksa
              </button>
              <button
                type="button"
                onClick={handleProceedToNextSection}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-black text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1"
              >
                <span>Lanjut Seksi Berikutnya</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prometric Final Exam Submission Modal */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="max-w-md w-full bg-white border border-stone-200 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 mx-auto flex items-center justify-center">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>

            <div className="text-center space-y-1">
              <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">
                PROMETRIC FINAL SUBMISSION
              </span>
              <h3 className="text-lg font-black text-stone-900 font-japanese">
                試験終了の確認
              </h3>
              <p className="text-xs text-stone-600 font-medium">
                Konfirmasi Pengakhiran Seluruh Ujian CBT
              </p>
            </div>

            {/* Total 4 Section Summary */}
            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-700 space-y-2">
              <div className="flex justify-between font-medium">
                <span>Total Soal Dijawab:</span>
                <span className="font-black text-emerald-700">
                  {totalAnsweredCount} / {questions.length}
                </span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Total Belum Dijawab:</span>
                <span className="font-bold text-stone-600">{totalUnansweredCount} Soal</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Total Ragu-ragu:</span>
                <span className="font-bold text-amber-700">{totalFlaggedCount} Soal</span>
              </div>
            </div>

            {/* Prometric Official Warning */}
            <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-2xl space-y-1 text-xs text-rose-950">
              <div className="font-bold flex items-center gap-1.5 font-japanese">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>すべてのセクションが終了しました。試験を終了しますか？</span>
              </div>
              <p className="text-[11px] text-rose-900 leading-relaxed pl-5">
                試験を終了すると、回答の確認や変更は一切行えなくなります。
              </p>
              <p className="text-[11px] text-stone-600 leading-relaxed pl-5 font-semibold pt-1">
                (Setelah mengonfirmasi, hasil evaluasi dan Lembar Penilaian Resmi akan langsung diterbitkan).
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                className="flex-1 py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Periksa Seksi 4
              </button>
              <button
                type="button"
                onClick={handleFinishExam}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                Ya, Akhiri Ujian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Confirmation Modal */}
      {exitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="max-w-md w-full bg-white border border-stone-200 rounded-3xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-600 mx-auto flex items-center justify-center">
              <LogOut className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-stone-900">Keluar dari Sesi Ujian?</h3>
              <p className="text-xs text-stone-500">
                Pengerjaan saat ini tidak akan disimpan ke rapor bila Anda keluar sebelum menyelesaikan ujian.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setExitModalOpen(false)}
                className="flex-1 py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Lanjutkan Ujian
              </button>
              <button
                onClick={() => {
                  try {
                    localStorage.removeItem(ACTIVE_EXAM_STORAGE_KEY);
                  } catch {}
                  setExitModalOpen(false);
                  if (onExitExam) {
                    onExitExam();
                  } else {
                    window.location.reload();
                  }
                }}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl transition cursor-pointer"
              >
                Keluar ke Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Zoom Lightbox Modal */}
      {zoomedImageUrl && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-stone-950/80 backdrop-blur-md p-4 animate-in fade-in duration-150"
          onClick={() => setZoomedImageUrl(null)}
        >
          {/* Floating Controls Bar */}
          <div
            className="fixed top-4 z-50 flex items-center gap-2 p-1.5 bg-white border border-stone-200 rounded-2xl shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setZoomScale((s) => Math.min(3, s + 0.25))}
              className="p-2 text-stone-700 hover:bg-stone-100 rounded-xl transition flex items-center gap-1 text-xs font-bold cursor-pointer"
              title="Perbesar"
            >
              <ZoomIn className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline">Perbesar</span>
            </button>

            <button
              type="button"
              onClick={() => setZoomScale((s) => Math.max(0.5, s - 0.25))}
              className="p-2 text-stone-700 hover:bg-stone-100 rounded-xl transition flex items-center gap-1 text-xs font-bold cursor-pointer"
              title="Perkecil"
            >
              <ZoomOut className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline">Perkecil</span>
            </button>

            <button
              type="button"
              onClick={() => setZoomScale(1)}
              className="p-2 text-stone-700 hover:bg-stone-100 rounded-xl transition flex items-center gap-1 text-xs font-bold cursor-pointer"
              title="Reset Ukuran (100%)"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">{Math.round(zoomScale * 100)}%</span>
            </button>

            <div className="w-px h-5 bg-stone-200 mx-1"></div>

            <button
              type="button"
              onClick={() => setZoomedImageUrl(null)}
              className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition flex items-center gap-1 text-xs font-bold cursor-pointer"
              title="Tutup (ESC)"
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
              alt="Lampiran Soal Diperbesar"
              style={{ transform: `scale(${zoomScale})`, transformOrigin: 'center center' }}
              className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl object-contain border border-stone-200 bg-white transition-transform duration-150"
            />
          </div>
        </div>
      )}
    </div>
  );
};
