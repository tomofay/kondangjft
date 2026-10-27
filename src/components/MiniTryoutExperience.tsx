'use client';

import React, { useState, useEffect, useRef } from 'react';
import { User, Question, UserAnswer } from '../types';
import { MINI_TRYOUT_QUESTIONS } from '../lib/miniTryoutQuestions';
import {
  Clock,
  Send,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Volume2,
  BookOpen,
  Check,
  CheckCircle2,
  XCircle,
  X,
  Lock,
  ArrowRight,
  Sparkles,
  Zap,
  Flame,
  Award,
  HelpCircle,
  MessageCircle,
  CreditCard,
  ShieldCheck,
  RotateCcw,
  Play,
  Phone
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { WHATSAPP_CONTACT_NUMBER } from '../lib/dataStore';
import { MarketingConsentModal } from './MarketingConsentModal';

interface MiniTryoutExperienceProps {
  currentUser?: User | null;
  onOpenFullPackagePayment: () => void;
  onClose: () => void;
}

export const MiniTryoutExperience: React.FC<MiniTryoutExperienceProps> = ({
  currentUser,
  onOpenFullPackagePayment,
  onClose
}) => {
  const [stage, setStage] = useState<'exam' | 'unlock_result' | 'result' | 'review'>('exam');

  const [leadName, setLeadName] = useState(currentUser?.name || '');
  const [leadWhatsapp, setLeadWhatsapp] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [submittingLead, setSubmittingLead] = useState(false);

  // Exam States: Live synced with database (packageId = 99), fallback to default static questions
  const [questions, setQuestions] = useState<Question[]>(MINI_TRYOUT_QUESTIONS);
  const TOTAL_TIME = 15 * 60; // 15 menit
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<number, UserAnswer>>(() => {
    const map = new Map<number, UserAnswer>();
    MINI_TRYOUT_QUESTIONS.forEach((q) => {
      map.set(q.id, { questionId: q.id, selectedOption: null, isFlagged: false });
    });
    return map;
  });

  useEffect(() => {
    let isMounted = true;
    fetch('/api/questions?packageId=99')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && Array.isArray(data.questions) && data.questions.length > 0) {
          const sorted = [...data.questions].sort((a, b) => (a.number || a.id) - (b.number || b.id));
          setQuestions(sorted);
        }
      })
      .catch((err) => {
        console.warn('Mini tryout questions live fetch notice:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync answers map if live questions update
  useEffect(() => {
    setAnswers((prev) => {
      const next = new Map(prev);
      questions.forEach((q) => {
        if (!next.has(q.id)) {
          next.set(q.id, { questionId: q.id, selectedOption: null, isFlagged: false });
        }
      });
      return next;
    });
  }, [questions]);

  // Audio Play Count per question (Max 2 plays for Chōkai)
  const [audioPlayCounts, setAudioPlayCounts] = useState<Record<number, number>>({});
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Result calculation state
  const [examResult, setExamResult] = useState<{
    totalScore: number;
    isPassed: boolean;
    correctCount: number;
    totalQuestions: number;
    s1Accuracy: number;
    s2Accuracy: number;
    s3Accuracy: number;
    s4Accuracy: number;
    weakestSection: {
      code: string;
      name: string;
      accuracy: number;
      analysis: string;
    };
  } | null>(null);

  // Timer Effect during 'exam' stage
  useEffect(() => {
    if (stage !== 'exam') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          finishMiniExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [stage]);

  // Reset audio state when question changes
  useEffect(() => {
    setAudioPlaying(false);
    setAudioProgress(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [currentIndex]);

  const currentQ = questions[currentIndex] || questions[0];
  const isChoukai = currentQ?.section === 'S3' || Boolean(currentQ?.audioUrl);
  const currentAnswer = answers.get(currentQ.id) || {
    questionId: currentQ.id,
    selectedOption: null,
    isFlagged: false
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Live sanitization for WhatsApp input (strictly numbers only, auto-strips leading 0 or +62)
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    let cleaned = raw;
    if (cleaned.startsWith('62')) {
      cleaned = cleaned.slice(2);
    }
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.slice(1);
    }
    setLeadWhatsapp(cleaned);
    if (phoneError) setPhoneError('');
  };

  // Handle unlock result form submission (Name & WhatsApp + ToS agreement)
  const handleUnlockResult = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = leadName.trim();
    if (!trimmedName || !leadWhatsapp.trim()) return;

    if (trimmedName.length < 2 || /^(test|testing|asdf|12345|qwerty)$/i.test(trimmedName)) {
      setPhoneError('Silakan masukkan nama lengkap yang valid (bukan teks testing).');
      return;
    }

    // Validasi nomor WhatsApp seluler Indonesia (wajib 628...)
    const normalizedPhone = '62' + leadWhatsapp.replace(/[^0-9]/g, '');
    if (!normalizedPhone.startsWith('628') || normalizedPhone.length < 11 || normalizedPhone.length > 15) {
      setPhoneError('Nomor WhatsApp tidak valid. Masukkan nomor HP aktif diawali angka 8 (contoh: 81234567890).');
      return;
    }

    if (!agreeTerms) {
      alert('Silakan centang persetujuan kontak WhatsApp & kebijakan informasi edukasi terlebih dahulu.');
      return;
    }

    setSubmittingLead(true);
    setPhoneError('');
    try {
      if (examResult) {
        const res = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: trimmedName,
            whatsapp: normalizedPhone,
            score: examResult.totalScore,
            weakness: `${examResult.weakestSection.name} (${examResult.weakestSection.accuracy}%)`,
            source: 'mini_tryout'
          })
        });

        const data = await res.json();
        if (!data.success) {
          setPhoneError(data.message || 'Gagal menyimpan data nomor WhatsApp.');
          setSubmittingLead(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Lead capture notice:', err);
    } finally {
      setSubmittingLead(false);
      setStage('result');
      if (examResult?.isPassed) {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      }
    }
  };

  // Option selection
  const handleSelectOption = (key: 'A' | 'B' | 'C' | 'D') => {
    setAnswers((prev) => {
      const next = new Map(prev);
      const curr = next.get(currentQ.id) || { questionId: currentQ.id, selectedOption: null, isFlagged: false };
      const newOpt = curr.selectedOption === key ? null : key;
      next.set(currentQ.id, { ...curr, selectedOption: newOpt });
      return next;
    });
  };

  // Anti-Cheat Audio Play handler
  const handlePlayAudio = () => {
    if (!audioRef.current || audioPlaying) return;

    const playCount = audioPlayCounts[currentQ.id] || 0;
    if (playCount >= 2) return;

    setAudioPlayCounts((prev) => ({
      ...prev,
      [currentQ.id]: playCount + 1
    }));

    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(console.error);
    setAudioPlaying(true);
  };

  // Calculate Diagnostic Score & Weakness
  function finishMiniExam() {
    let s1Correct = 0;
    let s2Correct = 0;
    let s3Correct = 0;
    let s4Correct = 0;

    questions.forEach((q) => {
      const userAns = answers.get(q.id);
      const isCorrect = userAns && userAns.selectedOption === q.correctAnswer;
      if (isCorrect) {
        if (q.section === 'S1') s1Correct++;
        else if (q.section === 'S2') s2Correct++;
        else if (q.section === 'S3') s3Correct++;
        else if (q.section === 'S4') s4Correct++;
      }
    });

    const totalCorrect = s1Correct + s2Correct + s3Correct + s4Correct;
    // JFT score formula: scale from 10 to 250
    const totalScore = Math.min(250, Math.max(10, Math.round(10 + (totalCorrect / questions.length) * 240)));
    const isPassed = totalScore >= 200;

    const s1Accuracy = Math.round((s1Correct / 3) * 100);
    const s2Accuracy = Math.round((s2Correct / 3) * 100);
    const s3Accuracy = Math.round((s3Correct / 3) * 100);
    const s4Accuracy = Math.round((s4Correct / 3) * 100);

    const sectionsStats = [
      {
        code: 'S1',
        name: 'Moji & Goi (Huruf & Kosakata)',
        accuracy: s1Accuracy,
        analysis: 'Kamu masih sering ragu membedakan kanji dan cara baca hiragana dasar. Kuasai kembali kosakata N5-A2.'
      },
      {
        code: 'S2',
        name: 'Kaiwa & Hyougen (Percakapan & Tata Bahasa)',
        accuracy: s2Accuracy,
        analysis: 'Pemahaman pola kalimat dan partikel percakapan sehari-hari masih perlu diasah agar lancar menjawab.'
      },
      {
        code: 'S3',
        name: 'Listening Section (Chōkai / 聴解)',
        accuracy: s3Accuracy,
        analysis: 'Tingkat akurasi audio kamu masih kurang. Di ujian asli JFT, audio Chōkai berbobot besar dan hanya diputar 2 kali tanpa jeda.'
      },
      {
        code: 'S4',
        name: 'Reading Comprehension (Dokkai / 読解)',
        accuracy: s4Accuracy,
        analysis: 'Kecepatan membaca teks pengumuman dan email kehidupan Jepang perlu ditingkatkan agar tidak kehabisan waktu ujian.'
      }
    ];

    // Weakest section is the one with minimum accuracy
    sectionsStats.sort((a, b) => a.accuracy - b.accuracy);
    const weakestSection = sectionsStats[0];

    const resultData = {
      totalScore,
      isPassed,
      correctCount: totalCorrect,
      totalQuestions: questions.length,
      s1Accuracy,
      s2Accuracy,
      s3Accuracy,
      s4Accuracy,
      weakestSection
    };

    setExamResult(resultData);

    if (currentUser) {
      setStage('result');
      if (isPassed) {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      }
    } else {
      setStage('unlock_result');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-900/60 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="bg-white border border-stone-200/90 rounded-3xl max-w-4xl w-full max-h-[94vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 my-auto">
        {/* ========================================================= */}
        {/* MODAL HEADER */}
        {/* ========================================================= */}
        <div className="p-4 sm:p-5 border-b border-stone-200 bg-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white flex items-center justify-center font-black shadow-md shadow-red-500/20 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                  100% GRATIS
                </span>
                <span className="text-xs font-bold text-stone-500">12 Soal Standar JFT-Basic A2</span>
              </div>
              <h2 className="text-sm sm:text-base font-black text-stone-900 truncate">
                Mini Tryout & Tes Diagnostik Kemampuan JFT
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition shrink-0 cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========================================================= */}
        {/* STAGE: UNLOCK RESULT GATE (NAME, WHATSAPP, TOS) */}
        {/* ========================================================= */}
        {stage === 'unlock_result' && examResult && (
          <div className="p-6 sm:p-10 overflow-y-auto max-w-xl mx-auto w-full space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>12 Soal Mini Tryout Selesai Dikerjakan!</span>
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                Masukkan Nama & WhatsApp untuk Melihat Nilai
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Rapor skor Anda, persentase kebenaran 4 seksi (Moji-Goi, Kaiwa, Chōkai, Dokkai), dan kunci pembahasan jawaban benar/salah sudah siap diakses.
              </p>
            </div>

            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 grid grid-cols-3 gap-2 text-center">
              <div className="space-y-0.5">
                <div className="text-xs text-stone-400">Total Soal</div>
                <div className="text-sm sm:text-base font-black text-stone-800">12 Soal</div>
              </div>
              <div className="space-y-0.5 border-x border-stone-200">
                <div className="text-xs text-stone-400">Status</div>
                <div className="text-sm sm:text-base font-black text-emerald-600">Selesai</div>
              </div>
              <div className="space-y-0.5">
                <div className="text-xs text-stone-400">Rapor & Kunci</div>
                <div className="text-sm sm:text-base font-black text-indigo-600">Tersedia</div>
              </div>
            </div>

            <form onSubmit={handleUnlockResult} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700">Nama Lengkap Anda:</label>
                <input
                  type="text"
                  required
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full p-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs sm:text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 flex items-center justify-between">
                  <span>Nomor WhatsApp Aktif:</span>
                  <span className="text-[10px] text-stone-400 font-normal">Hanya digit nomor HP (tanpa huruf/test)</span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 flex items-center gap-1.5 text-xs font-mono font-black text-stone-700 border-r border-stone-200 pr-2.5 py-0.5 select-none pointer-events-none">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>+62</span>
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    required
                    value={leadWhatsapp}
                    onChange={handlePhoneChange}
                    maxLength={13}
                    placeholder="812-3456-7890"
                    className={`w-full pl-20 p-3.5 bg-stone-50 border rounded-2xl text-xs sm:text-sm font-mono font-bold text-stone-900 focus:outline-none focus:bg-white transition ${
                      phoneError
                        ? 'border-red-500 focus:ring-2 focus:ring-red-400 bg-red-50/40'
                        : 'border-stone-200 focus:ring-2 focus:ring-emerald-500'
                    }`}
                  />
                </div>
                {phoneError ? (
                  <p className="text-[11px] text-red-600 font-bold flex items-center gap-1 pt-0.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{phoneError}</span>
                  </p>
                ) : (
                  <p className="text-[10px] text-stone-400">
                    Ketik nomor HP mulai dari angka 8 (contoh: 81234567890). Awalan +62 terpasang otomatis.
                  </p>
                )}
              </div>

              {/* WhatsApp Marketing & Contact Consent Box */}
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer text-[11px] text-stone-700 leading-relaxed font-medium">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                  />
                  <span>
                    Saya bersedia memberikan nama dan nomor WhatsApp untuk membuka rapor nilai, serta menyetujui{' '}
                    <button
                      type="button"
                      onClick={() => setShowConsentModal(true)}
                      className="text-emerald-700 hover:text-emerald-900 underline font-bold cursor-pointer"
                    >
                      Persetujuan Kontak WhatsApp & Informasi Edukasi
                    </button>{' '}
                    KondangSensei (termasuk konsultasi belajar & informasi penawaran program simulasi JFT).
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={submittingLead || !agreeTerms}
                className="w-full py-4 px-6 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 text-white font-black text-sm rounded-2xl shadow-lg shadow-red-500/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transform hover:-translate-y-0.5"
              >
                <span>{submittingLead ? 'Membuka Rapor...' : 'Buka Rapor Hasil & Pembahasan Soal Sekarang'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* STAGE 2: CBT EXAM SIMULATOR (12 QUESTIONS) */}
        {/* ========================================================= */}
        {stage === 'exam' && (
          <div className="flex-1 flex flex-col overflow-y-auto bg-[#f8fafc]">
            {/* Top Bar Status */}
            <div className="px-4 sm:px-6 py-3 bg-white border-b border-stone-200 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono text-xs font-black">
                  {currentQ.section}
                </span>
                <span className="text-xs sm:text-sm font-black text-stone-900">
                  Soal #{currentQ.number} dari {questions.length}
                </span>
                <span className="hidden sm:inline text-xs text-stone-400">• {currentQ.sectionTitle}</span>
              </div>

              {/* Timer */}
              <div className="flex items-center gap-2">
                <div
                  className={`px-3 py-1 rounded-xl border text-xs font-mono font-black flex items-center gap-1.5 ${
                    timeLeft < 180
                      ? 'bg-rose-50 border-rose-300 text-rose-800 animate-pulse'
                      : 'bg-sky-50 border-sky-200 text-sky-800'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatTime(timeLeft)}</span>
                </div>

                <button
                  onClick={finishMiniExam}
                  className="py-1 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer"
                >
                  <Send className="w-3 h-3" />
                  <span>Kirim Jawaban</span>
                </button>
              </div>
            </div>

            {/* Question Workspace */}
            <div className="flex-1 p-4 sm:p-6 space-y-4 max-w-3xl w-full mx-auto overflow-y-auto">
              <div className="bg-white border border-stone-200/90 rounded-2xl p-5 sm:p-7 shadow-xs space-y-5">
                {/* Dokkai Reading Passage */}
                {currentQ.readingPassage && (
                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2 text-xs sm:text-sm text-stone-800 font-japanese leading-relaxed whitespace-pre-line">
                    <div className="text-[11px] font-black text-emerald-700 uppercase tracking-wider border-b border-stone-200 pb-1 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Teks Bacaan (Dokkai / 読解):</span>
                    </div>
                    {currentQ.readingPassage}
                  </div>
                )}

                {/* Choukai Audio Player (Anti-Cheat, Max 2x Plays, No Scrubber) */}
                {isChoukai && currentQ.audioUrl && (
                  <div className="p-4 sm:p-5 bg-gradient-to-r from-sky-50 to-indigo-50/50 rounded-2xl border border-sky-200/90 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-2 text-sky-950">
                        <Volume2 className={`w-4 h-4 ${audioPlaying ? 'text-sky-600 animate-pulse' : 'text-sky-700'}`} />
                        <span>Pemutar Audio Chōkai (聴解 Audio)</span>
                      </span>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                          (audioPlayCounts[currentQ.id] || 0) >= 2 && !audioPlaying
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : (audioPlayCounts[currentQ.id] || 0) === 1
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}
                      >
                        {(audioPlayCounts[currentQ.id] || 0) >= 2 && !audioPlaying
                          ? 'Diputar 2/2x (Habis)'
                          : `Diputar: ${audioPlayCounts[currentQ.id] || 0} / 2 kali`}
                      </span>
                    </div>

                    <audio
                      ref={audioRef}
                      src={currentQ.audioUrl}
                      preload="auto"
                      onTimeUpdate={() => {
                        if (audioRef.current && audioRef.current.duration > 0) {
                          setAudioProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
                        }
                      }}
                      onEnded={() => {
                        setAudioPlaying(false);
                        setAudioProgress(0);
                      }}
                    />

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handlePlayAudio}
                        disabled={audioPlaying || (audioPlayCounts[currentQ.id] || 0) >= 2}
                        className={`py-2.5 px-4 rounded-xl text-xs font-black transition flex items-center gap-2 shadow-xs cursor-pointer disabled:cursor-not-allowed ${
                          audioPlaying
                            ? 'bg-sky-500 text-white animate-pulse'
                            : (audioPlayCounts[currentQ.id] || 0) >= 2
                            ? 'bg-stone-200 text-stone-500 border border-stone-300 opacity-60'
                            : 'bg-sky-600 hover:bg-sky-700 text-white'
                        }`}
                      >
                        {audioPlaying ? (
                          <>
                            <Volume2 className="w-4 h-4 animate-bounce" />
                            <span>Sedang Memutar Audio...</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>
                              {(audioPlayCounts[currentQ.id] || 0) === 0
                                ? 'Putar Audio (1/2)'
                                : (audioPlayCounts[currentQ.id] || 0) === 1
                                ? 'Putar Audio (2/2 - Terakhir)'
                                : 'Batas 2x Tercapai'}
                            </span>
                          </>
                        )}
                      </button>

                      {/* Read-only Progress Track */}
                      <div className="flex-1 space-y-1 select-none pointer-events-none">
                        <div className="w-full bg-sky-200/70 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-sky-600 h-2.5 rounded-full transition-all duration-200"
                            style={{ width: `${audioProgress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-sky-900/80 bg-white/80 p-2 rounded-xl border border-sky-100">
                      Aturan CBT Chōkai: Audio tidak dapat digeser dan hanya dapat diputar maksimal <strong>2 kali</strong>.
                    </div>
                  </div>
                )}

                {/* Question Text */}
                <div className="text-sm sm:text-base font-semibold text-stone-900 leading-relaxed font-japanese whitespace-pre-line">
                  {currentQ.questionText}
                </div>

                {/* Options List */}
                <div className="space-y-3 pt-2">
                  {currentQ.options.map((opt) => {
                    const isSelected = currentAnswer.selectedOption === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => handleSelectOption(opt.key)}
                        className={`w-full p-4 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'border-2 border-red-600 bg-rose-50/70 text-stone-900 shadow-2xs'
                            : 'border border-stone-200 hover:border-red-300 hover:bg-stone-50/70 text-stone-800 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-7 h-7 rounded-lg font-black flex items-center justify-center text-xs transition ${
                              isSelected
                                ? 'bg-red-600 text-white'
                                : 'bg-stone-100 text-stone-700 border border-stone-200'
                            }`}
                          >
                            {opt.key}.
                          </span>
                          <span className="text-sm font-semibold font-japanese leading-snug">{opt.text}</span>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center text-white shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Nav Buttons */}
              <div className="flex items-center justify-between gap-3 pt-2">
                {isChoukai ? (
                  <button
                    type="button"
                    disabled
                    className="py-2.5 px-4 bg-stone-100 text-stone-400 text-xs font-bold rounded-xl border border-stone-200 cursor-not-allowed opacity-60 flex items-center gap-1.5 select-none"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Tidak Bisa Kembali</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentIndex === 0}
                    className="py-2.5 px-4 bg-white hover:bg-stone-100 disabled:opacity-40 text-stone-700 text-xs font-bold rounded-xl border border-stone-200 transition flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Sebelumnya</span>
                  </button>
                )}

                {currentIndex < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                    className="py-2.5 px-5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-xs font-black rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Berikutnya</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={finishMiniExam}
                    className="py-2.5 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Selesai & Lihat Skor</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STAGE 3: REAL-TIME SCORE + LAPORAN KELEMAHAN + DIRECT CTA */}
        {/* ========================================================= */}
        {stage === 'result' && examResult && (
          <div className="p-5 sm:p-8 overflow-y-auto space-y-6">
            {/* Top Score Banner */}
            <div
              className={`p-6 sm:p-8 rounded-3xl border text-center space-y-3 relative overflow-hidden ${
                examResult.isPassed
                  ? 'bg-gradient-to-br from-emerald-50 via-white to-teal-50/50 border-emerald-200'
                  : 'bg-gradient-to-br from-amber-50 via-white to-rose-50/50 border-amber-200'
              }`}
            >
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white shadow-2xs border border-stone-200">
                <Award className={`w-3.5 h-3.5 ${examResult.isPassed ? 'text-emerald-600' : 'text-amber-600'}`} />
                <span>HASIL EVALUASI REAL-TIME JFT-BASIC A2</span>
              </div>

              <div className="space-y-1">
                <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-stone-900">
                  {examResult.totalScore}
                  <span className="text-xl sm:text-2xl text-stone-400 font-normal"> / 250</span>
                </div>
                <div
                  className={`text-sm sm:text-base font-black ${
                    examResult.isPassed ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {examResult.isPassed ? 'LULUS KUALIFIKASI A2 (A2到達)' : 'BELUM MENCAPAI TARGET KELULUSAN (A2未到達)'}
                </div>
                <p className="text-xs text-stone-500 font-medium">
                  {examResult.correctCount} dari {examResult.totalQuestions} soal terjawab dengan benar • Standar Kelulusan Resmi: Minimal 200 Poin
                </p>
              </div>

              {/* Exact Diagnostic Quote */}
              <div className="mt-3 p-3.5 bg-white/90 rounded-2xl border border-stone-200/90 text-stone-900 font-extrabold text-xs sm:text-sm shadow-2xs">
                &ldquo;Skor kamu: <span className="text-red-600 font-black">{examResult.totalScore}/250</span> ({examResult.isPassed ? 'Lulus' : 'Belum Lulus'}). Kelemahan utama: <span className="text-rose-600 font-black">{examResult.weakestSection.name}</span>.&rdquo;
              </div>
            </div>

            {/* Diagnostic Report: Laporan Kelemahan Utama */}
            <div className="p-5 sm:p-6 bg-rose-50/70 border border-rose-200/90 rounded-3xl space-y-3">
              <div className="flex items-center gap-2.5 text-rose-900 font-black text-sm sm:text-base">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>Laporan Kelemahan Utama: {examResult.weakestSection.name}</span>
              </div>
              <p className="text-xs sm:text-sm text-rose-800/90 leading-relaxed font-medium">
                {examResult.weakestSection.analysis}
              </p>

              {/* 4 Sections Breakdown Bars */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-rose-200/70">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-stone-700">
                    <span>S1. Moji & Goi (Kosakata)</span>
                    <span className="font-mono">{examResult.s1Accuracy}%</span>
                  </div>
                  <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-rose-500 h-2 rounded-full" style={{ width: `${examResult.s1Accuracy}%` }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-stone-700">
                    <span>S2. Kaiwa (Percakapan)</span>
                    <span className="font-mono">{examResult.s2Accuracy}%</span>
                  </div>
                  <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${examResult.s2Accuracy}%` }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-stone-700">
                    <span>S3. Chōkai (Audio Listening)</span>
                    <span className="font-mono">{examResult.s3Accuracy}%</span>
                  </div>
                  <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-sky-500 h-2 rounded-full" style={{ width: `${examResult.s3Accuracy}%` }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-stone-700">
                    <span>S4. Dokkai (Pemahaman Bacaan)</span>
                    <span className="font-mono">{examResult.s4Accuracy}%</span>
                  </div>
                  <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${examResult.s4Accuracy}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Direct High-Converting Call-to-Action (CTA) */}
            <div className="p-6 sm:p-7 bg-gradient-to-br from-stone-900 via-stone-900 to-indigo-950 text-white rounded-3xl shadow-xl space-y-4">
              <div className="space-y-1.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-black uppercase tracking-wider">
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  <span>PROMO SPESIAL UJIAN SIMULASI PENUH</span>
                </span>
                <h3 className="text-lg sm:text-2xl font-black tracking-tight leading-snug">
                  &ldquo;Mau latihan soal CBT full-length yang 99% mirip ujian aslinya biar makin siap lulus? Buka akses Paket Simulasi Penuh sekarang!&rdquo;
                </h3>
                <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                  Buka akses <strong>5 Paket Simulasi Full (250 Soal Asli + Audio Chōkai Lengkap + Lembar Hasil Evaluasi &amp; Sertifikat PDF)</strong>. Bebas retake berkali-kali tanpa batas!
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenFullPackagePayment();
                  }}
                  className="flex-1 py-3.5 px-6 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-600 hover:from-amber-500 hover:to-rose-700 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-orange-500/25 transition flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Buka Akses 5 Paket Simulasi Sekarang</span>
                </button>

                {/* WhatsApp Consultation Link with Prefilled Diagnostic Score */}
                <a
                  href={`https://wa.me/${WHATSAPP_CONTACT_NUMBER.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    `Halo Admin KondangSensei, saya baru saja menyelesaikan Mini Tryout JFT Gratis dengan skor ${examResult.totalScore}/250. Kelemahan utama saya di ${examResult.weakestSection.name}. Saya mau tanya paket simulasi full length untuk persiapan kerja ke Jepang.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Konsultasi via WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Review Button */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setStage('review')}
                className="py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>Pelajari Pembahasan 12 Soal Ini</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAnswers(new Map());
                  setStage('exam');
                  setTimeLeft(TOTAL_TIME);
                }}
                className="py-2.5 px-4 text-stone-500 hover:text-stone-800 text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Ulangi Mini Tryout</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STAGE 4: QUESTION REVIEW */}
        {/* ========================================================= */}
        {stage === 'review' && (
          <div className="p-5 sm:p-8 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <h3 className="text-base sm:text-lg font-black text-stone-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <span>Pembahasan Lengkap 12 Soal Mini Tryout</span>
              </h3>
              <button
                onClick={() => setStage('result')}
                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Kembali ke Skor
              </button>
            </div>

            <div className="space-y-4">
              {questions.map((q, idx) => {
                const userAns = answers.get(q.id);
                const isCorrect = userAns && userAns.selectedOption === q.correctAnswer;
                return (
                  <div
                    key={q.id}
                    className={`p-4 sm:p-5 rounded-2xl border space-y-3 ${
                      isCorrect ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="font-mono text-stone-600">
                        Soal #{idx + 1} • {q.sectionTitle}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-black flex items-center gap-1 ${
                          isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {isCorrect ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" /> Benar
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" /> Salah
                          </>
                        )}
                      </span>
                    </div>

                    <div className="text-sm font-semibold text-stone-900 font-japanese leading-relaxed whitespace-pre-line">
                      {q.questionText}
                    </div>

                    {q.readingPassage && (
                      <div className="p-3 bg-white/80 rounded-xl border border-stone-200 text-xs text-stone-700 font-japanese whitespace-pre-line">
                        {q.readingPassage}
                      </div>
                    )}

                    <div className="text-xs space-y-1">
                      <div className="font-bold text-stone-700">
                        Jawaban Kamu:{' '}
                        <span className={isCorrect ? 'text-emerald-700' : 'text-rose-700'}>
                          {userAns?.selectedOption ? `${userAns.selectedOption}. ${q.options.find(o => o.key === userAns.selectedOption)?.text}` : 'Tidak dijawab'}
                        </span>
                      </div>
                      <div className="font-bold text-emerald-700">
                        Kunci Jawaban:{' '}
                        <span>
                          {q.correctAnswer}. {q.options.find(o => o.key === q.correctAnswer)?.text}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-stone-200 text-xs text-stone-700 leading-relaxed">
                      <strong className="text-stone-900">Pembahasan:</strong> {q.explanation}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenFullPackagePayment();
                }}
                className="py-3.5 px-6 bg-gradient-to-r from-red-600 to-rose-600 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg transition cursor-pointer"
              >
                Buka 5 Paket Simulasi Penuh (Mulai Rp 35.000)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* WhatsApp Marketing Consent Modal */}
      <MarketingConsentModal
        isOpen={showConsentModal}
        onClose={() => setShowConsentModal(false)}
      />
    </div>
  );
};
