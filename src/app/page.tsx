'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { User, Question, ExamResult, TryoutPackage, Transaction, UserAnswer, PDFQuestionDraft } from '../types';
import { getStore, isSubscriptionActive, getRemainingDays, EXAM_SETS } from '../lib/dataStore';
import { Navbar } from '../components/Navbar';
import { SingleSessionLockModal } from '../components/SingleSessionLockModal';
import { CbtExamEngine } from '../components/CbtExamEngine';
import { JftResultReport } from '../components/JftResultReport';
import { QuestionReview } from '../components/QuestionReview';
import { PackagePaymentModal } from '../components/PackagePaymentModal';
import { AdminPortal } from '../components/AdminPortal';
import { Play, Award, Zap, History, Lock, ShieldAlert, Sparkles, BookOpen, Layers } from 'lucide-react';

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => getStore().users[0] || null);
  const [sessionId, setSessionId] = useState<string | null>(() => getStore().users[0]?.activeSessionId || 'sess-demo-user');
  const [isSessionLocked, setIsSessionLocked] = useState(false);
  const [sessionLockMessage, setSessionLockMessage] = useState('');

  // Active view: 'dashboard' | 'exam' | 'report' | 'review' | 'admin'
  const [view, setView] = useState<'dashboard' | 'exam' | 'report' | 'review' | 'admin'>('dashboard');

  // App Data & Selected Question Package (1, 2, 3, 4)
  const [questions, setQuestions] = useState<Question[]>(() => getStore().questions);
  const [selectedPackageId, setSelectedPackageId] = useState<number>(1);
  const [examResults, setExamResults] = useState<ExamResult[]>(() => getStore().examResults);
  const [packages] = useState<TryoutPackage[]>(() => getStore().packages);
  const [transactions, setTransactions] = useState<Transaction[]>(() => getStore().transactions);
  const [pdfDrafts, setPdfDrafts] = useState<PDFQuestionDraft[]>(() => getStore().pdfDrafts);

  // Selected result for report / review
  const [currentResult, setCurrentResult] = useState<ExamResult | null>(null);

  // Payment Modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  // Login handler
  const handleLogin = useCallback(async (email: string, role: 'user' | 'admin') => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role })
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.user);
        setSessionId(data.sessionId);
        setIsSessionLocked(false);
        if (data.user.role === 'admin') {
          setView('dashboard');
        }
      }
    } catch (err) {
      console.error('Login error', err);
    }
  }, []);

  // Single Session Lock Polling Heartbeat (Checks every 3 seconds)
  useEffect(() => {
    if (!currentUser || !sessionId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/auth/session-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser.id, sessionId })
        });
        const data = await res.json();
        if (data.valid === false) {
          setIsSessionLocked(true);
          setSessionLockMessage(data.message || 'Sesi ini telah diakhiri karena akun Anda login di perangkat lain.');
        }
      } catch {
        // Ignore network errors during heartbeat
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [currentUser, sessionId]);

  // Logout handler
  const handleLogout = async () => {
    if (currentUser) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
    }
    setCurrentUser(null);
    setSessionId(null);
  };

  // Start CBT Exam for a specific Question Package (1, 2, 3, 4)
  const handleStartExam = (pkgId?: number) => {
    if (!currentUser) return;
    if (!isSubscriptionActive(currentUser)) {
      setPaymentModalOpen(true);
      return;
    }
    if (pkgId) {
      setSelectedPackageId(pkgId);
    }
    setView('exam');
  };

  // Admin Question Edit / Save Handler
  const handleSaveQuestion = (updatedQ: Question) => {
    const store = getStore();
    const idx = store.questions.findIndex((q) => q.id === updatedQ.id);
    if (idx !== -1) {
      store.questions[idx] = updatedQ;
    } else {
      store.questions.push(updatedQ);
    }
    setQuestions([...store.questions]);
  };

  // Admin Question Delete Handler
  const handleDeleteQuestion = (questionId: number) => {
    const store = getStore();
    store.questions = store.questions.filter((q) => q.id !== questionId);
    setQuestions([...store.questions]);
  };

  // Submit Exam
  const handleSubmitExam = async (answers: UserAnswer[], timeSpentSeconds: number) => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/exam/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          answers,
          timeSpentSeconds
        })
      });
      const data = await res.json();
      if (data.success) {
        const store = getStore();
        setExamResults([...store.examResults]);
        if (data.user) {
          setCurrentUser(data.user);
        }
        setCurrentResult(data.result);
        setView('report');
      }
    } catch (err) {
      console.error('Submit exam error', err);
    }
  };

  // Payment checkout completion
  const handlePaymentSuccess = async (packageId: string, paymentMethod: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          packageId,
          paymentMethod
        })
      });
      const data = await res.json();
      if (data.success) {
        const store = getStore();
        setTransactions([...store.transactions]);
        setCurrentUser((prev) => prev ? { ...prev, subscriptionExpiresAt: data.subscriptionExpiresAt } : prev);
      }
    } catch (err) {
      console.error('Payment error', err);
    }
  };

  // PDF import text handler
  const handleImportPdfText = async (pdfText: string) => {
    const res = await fetch('/api/admin/parse-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pdfText })
    });
    const data = await res.json();
    if (data.success) {
      const store = getStore();
      setPdfDrafts([...store.pdfDrafts]);
    }
  };

  // Admin Kick session
  const handleKickSession = (userId: string) => {
    const store = getStore();
    const target = store.users.find((u: User) => u.id === userId);
    if (target) {
      target.activeSessionId = undefined;
      setCurrentUser((prev) => (prev?.id === userId ? { ...prev, activeSessionId: undefined } : prev));
    }
  };

  // Admin Add Subscription Days
  const handleAddCredit = (userId: string, count: number) => {
    const store = getStore();
    const target = store.users.find((u: User) => u.id === userId);
    if (target) {
      const baseTime = target.subscriptionExpiresAt && new Date(target.subscriptionExpiresAt).getTime() > Date.now()
        ? new Date(target.subscriptionExpiresAt).getTime()
        : Date.now();
      target.subscriptionExpiresAt = new Date(baseTime + count * 86400000).toISOString();
      if (currentUser?.id === userId) {
        setCurrentUser({ ...target });
      }
    }
  };

  // Test Dual Session Conflict (Simulates logging in on another tab)
  const handleTestDualSessionConflict = () => {
    if (!currentUser) return;
    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: currentUser.email, role: currentUser.role })
    });
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center mx-auto text-2xl font-black shadow-lg">
            JFT
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">KondangSensei</h1>
            <p className="text-xs text-slate-400">Platform Simulasi Ujian JFT-Basic 1 Sesi Terkunci</p>
          </div>
          <div className="space-y-3 pt-2">
            <button
              onClick={() => handleLogin('peserta@kondang.com', 'user')}
              className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold text-xs rounded-xl shadow-lg transition"
            >
              Masuk sebagai Peserta Demo
            </button>
            <button
              onClick={() => handleLogin('admin@kondang.com', 'admin')}
              className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition"
            >
              Masuk sebagai Superadmin
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Navbar */}
      <Navbar
        user={currentUser}
        onOpenBuyCredits={() => setPaymentModalOpen(true)}
        onSwitchRole={(role) => handleLogin(role === 'admin' ? 'admin@kondang.com' : 'peserta@kondang.com', role)}
        onLogout={handleLogout}
        activeView={view}
        onChangeView={(v) => setView(v)}
      />

      {/* Main Container */}
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        {/* VIEW: CBT EXAM SIMULATOR */}
        {view === 'exam' && (
          <CbtExamEngine
            questions={questions.filter((q) => (q.packageId || 1) === selectedPackageId)}
            onSubmitExam={handleSubmitExam}
            user={currentUser}
          />
        )}

        {/* VIEW: JFT CERTIFICATE REPORT */}
        {view === 'report' && currentResult && (
          <JftResultReport
            result={currentResult}
            onOpenReview={() => setView('review')}
            onRetake={() => handleStartExam(selectedPackageId)}
          />
        )}

        {/* VIEW: QUESTION REVIEW & EVALUATION */}
        {view === 'review' && currentResult && (
          <QuestionReview
            questions={questions.filter((q) => (q.packageId || 1) === selectedPackageId)}
            userAnswers={currentResult.answers}
            onBackToReport={() => setView('report')}
          />
        )}

        {/* VIEW: ADMIN PORTAL */}
        {view === 'admin' && (
          <AdminPortal
            users={getStore().users}
            questions={questions}
            transactions={transactions}
            pdfDrafts={pdfDrafts}
            onKickSession={handleKickSession}
            onAddCredit={handleAddCredit}
            onImportPdfText={handleImportPdfText}
            onSaveQuestion={handleSaveQuestion}
            onDeleteQuestion={handleDeleteQuestion}
          />
        )}

        {/* VIEW: STUDENT DASHBOARD */}
        {view === 'dashboard' && (
          <div className="max-w-7xl mx-auto space-y-8 pb-12">
            {/* Hero Section Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-8 shadow-2xl">
              <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent pointer-events-none"></div>

              <div className="relative z-10 max-w-2xl space-y-4">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-red-950/80 border border-red-800 text-red-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> JFT-Basic CBT Engine 2026
                  </span>
                  <span className="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-xs font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3" /> 1 Sesi Terkunci
                  </span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                  Simulasi Ujian JFT-Basic Realistis & Evaluasi Pembahasan Detail
                </h1>

                <p className="text-sm text-slate-300 leading-relaxed">
                  Latihan 50 soal CBT Japan Foundation Test (Moji Goi, Kaiwa, Chōkai Listening, & Dokkai Reading). Dapatkan Rapor Resmi JFT & analisis jawaban salah.
                </p>

                <div className="pt-3 flex flex-wrap items-center gap-4">
                  <button
                    onClick={handleStartExam}
                    className="py-3.5 px-6 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-red-600/30 transition flex items-center gap-2 transform hover:-translate-y-0.5"
                  >
                    <Play className="w-5 h-5 fill-white" />
                    Mulai Ujian Simulasi JFT Sekarang
                  </button>

                  <button
                    onClick={() => setPaymentModalOpen(true)}
                    className="py-3.5 px-5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-2xl border border-slate-700 transition flex items-center gap-2"
                  >
                    <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                    Beli Paket Tryout
                  </button>
                </div>
              </div>
            </div>

            {/* Test Single Session Conflict Feature Banner */}
            <div className="p-5 bg-slate-900 rounded-2xl border border-indigo-900/60 flex flex-wrap items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500 text-amber-400 flex items-center justify-center font-bold">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Uji Fitur Proteksi Sesi Tunggal (1 Device per Akun)</h3>
                  <p className="text-xs text-slate-400">
                    Klik tombol di sebelah kanan untuk menyimulasikan login di tab/perangkat ke-2. Sistem akan mendeteksi dan mengunci sesi di tab ini.
                  </p>
                </div>
              </div>

              <button
                onClick={handleTestDualSessionConflict}
                className="py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-slate-950 font-bold text-xs rounded-xl shadow transition"
              >
                Simulasikan Login 2nd Device (Tes Kunci Sesi)
              </button>
            </div>

            {/* User Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
                <div className="text-xs text-slate-400 font-semibold">Masa Aktif Akses Tryout</div>
                <div className="text-xl font-black text-amber-400 flex items-center gap-2">
                  <Zap className="w-6 h-6 fill-amber-400" />
                  {isSubscriptionActive(currentUser)
                    ? `Unlimited (${getRemainingDays(currentUser)} Hari)`
                    : 'Masa Aktif Habis'}
                </div>
              </div>

              <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
                <div className="text-xs text-slate-400 font-semibold">Simulasi Dikerjakan</div>
                <div className="text-2xl font-black text-indigo-400 flex items-center gap-2">
                  <History className="w-6 h-6" />
                  {examResults.length} Kali
                </div>
              </div>

              <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
                <div className="text-xs text-slate-400 font-semibold">Nilai Tertinggi</div>
                <div className="text-2xl font-black text-emerald-400 flex items-center gap-2">
                  <Award className="w-6 h-6" />
                  {examResults.length > 0
                    ? Math.max(...examResults.map((r: ExamResult) => r.totalScore))
                    : '-'}{' '}
                  / 250
                </div>
              </div>

              <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
                <div className="text-xs text-slate-400 font-semibold">Passing Grade Standard JFT</div>
                <div className="text-xs font-mono bg-slate-950 p-2 rounded-lg border border-slate-800 text-slate-300">
                  A1: 145 • A2.1: 175 • A2.2: 200
                </div>
              </div>
            </div>

            {/* Question Packages Selection Grid (Pilihan Paket 1 - 4) */}
            <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex flex-wrap items-center justify-between border-b pb-4 border-slate-800 gap-2">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-400" />
                    Pilihan Paket Bank Soal Ujian JFT-Basic ({EXAM_SETS.length} Paket Soal Tersedia)
                  </h2>
                  <p className="text-xs text-slate-400">Pilih salah satu dari 4 paket simulasi 50 soal yang ingin Anda kerjakan hari ini</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {EXAM_SETS.map((set) => {
                  const setQuestionCount = questions.filter((q) => (q.packageId || 1) === set.id).length;
                  const isSelected = selectedPackageId === set.id;
                  return (
                    <div
                      key={set.id}
                      className={`p-5 rounded-2xl border transition flex flex-col justify-between gap-4 ${
                        isSelected
                          ? 'bg-slate-950 border-indigo-500/80 shadow-lg shadow-indigo-500/10'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-950 border border-indigo-700 text-indigo-400 font-mono text-[11px] font-bold">
                            {set.code}
                          </span>
                          <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                            {setQuestionCount} Soal Aktif
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-white">{set.name}</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">{set.description}</p>
                      </div>

                      <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
                        <span className="text-[11px] text-slate-500">Seksi S1, S2, S3, S4</span>
                        <button
                          onClick={() => handleStartExam(set.id)}
                          className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow transition flex items-center gap-1.5"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          Kerjakan Paket #{set.id}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Exam History */}
            <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b pb-4 border-slate-800">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-indigo-400" />
                  Riwayat Simulasi Tryout JFT
                </h2>
              </div>

              {examResults.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs">
                  Belum ada simulasi yang dikerjakan. Klik &quot;Mulai Ujian Simulasi JFT Sekarang&quot; untuk memulai!
                </div>
              ) : (
                <div className="space-y-3">
                  {examResults.map((res: ExamResult) => (
                    <div
                      key={res.id}
                      className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="font-bold text-white text-sm flex items-center gap-2">
                          <span>Nilai Total: {res.totalScore} / 250</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] uppercase font-extrabold ${
                              res.isPassed ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-red-950 text-red-400 border border-red-800'
                            }`}
                          >
                            {res.assessmentResult}
                          </span>
                        </div>
                        <div className="text-slate-400 text-[11px]">Tanggal: {res.testDate}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setCurrentResult(res);
                            setView('report');
                          }}
                          className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl transition"
                        >
                          Lihat Rapor Resmi
                        </button>
                        <button
                          onClick={() => {
                            setCurrentResult(res);
                            setView('review');
                          }}
                          className="py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow transition flex items-center gap-1"
                        >
                          <BookOpen className="w-3.5 h-3.5" /> Pembahasan
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Payment Modal */}
      <PackagePaymentModal
        isOpen={paymentModalOpen}
        packages={packages}
        onClose={() => setPaymentModalOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Single Session Lock Modal */}
      <SingleSessionLockModal
        isOpen={isSessionLocked}
        message={sessionLockMessage}
        onRelogin={() => handleLogin(currentUser.email, currentUser.role)}
      />
    </div>
  );
}
