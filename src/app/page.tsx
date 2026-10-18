'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { User, Question, ExamResult, TryoutPackage, Transaction, UserAnswer, PDFQuestionDraft } from '../types';
import { getStore, isSubscriptionActive, getRemainingDays, getRemainingSubscriptionText, EXAM_SETS } from '../lib/dataStore';
import { Navbar } from '../components/Navbar';
import { SingleSessionLockModal } from '../components/SingleSessionLockModal';
import { CbtExamEngine } from '../components/CbtExamEngine';
import { JftResultReport } from '../components/JftResultReport';
import { QuestionReview } from '../components/QuestionReview';
import { PackagePaymentModal } from '../components/PackagePaymentModal';
import { PendingPaymentsModal } from '../components/PendingPaymentsModal';
import { AdminPortal } from '../components/AdminPortal';
import { ProfileModal } from '../components/ProfileModal';
import {
  Play,
  Award,
  Zap,
  History,
  Lock,
  Sparkles,
  BookOpen,
  Layers,
  UserCheck,
  User as UserIcon,
  GraduationCap,
  Clock,
  Mail,
  Key,
  LogIn,
  UserPlus,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSessionLocked, setIsSessionLocked] = useState(false);
  const [sessionLockMessage, setSessionLockMessage] = useState('');
  const [isRestoringAuth, setIsRestoringAuth] = useState(true);

  // Auth mode: 'login' | 'signup'
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Active view: 'dashboard' | 'exam' | 'report' | 'review' | 'admin'
  const [view, setView] = useState<'dashboard' | 'exam' | 'report' | 'review' | 'admin'>('dashboard');

  // App Data & Selected Question Package (1, 2, 3, 4)
  const [questions, setQuestions] = useState<Question[]>(() => getStore().questions);
  const [selectedPackageId, setSelectedPackageId] = useState<number>(1);
  const [examResults, setExamResults] = useState<ExamResult[]>(() => getStore().examResults);
  const [packages] = useState<TryoutPackage[]>(() => getStore().packages);
  const [transactions, setTransactions] = useState<Transaction[]>(() => getStore().transactions);
  const [pdfDrafts, setPdfDrafts] = useState<PDFQuestionDraft[]>(() => getStore().pdfDrafts);
  const [adminUsers, setAdminUsers] = useState<User[]>(() => getStore().users);

  // Selected result for report / review
  const [currentResult, setCurrentResult] = useState<ExamResult | null>(null);

  // Payment Modals
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [pendingPaymentsModalOpen, setPendingPaymentsModalOpen] = useState(false);
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);

  // Load pending payments for currentUser
  const loadPendingPayments = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`/api/payments/pending?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.pendingTransactions)) {
        setPendingTransactions(data.pendingTransactions);
      }
    } catch (err) {
      console.warn('Failed to load pending payments:', err);
    }
  }, []);

  // Login handler
  const handleLogin = useCallback(async (email: string, password?: string) => {
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: password || 'password123' })
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.user);
        setSessionId(data.sessionId);
        setIsSessionLocked(false);
        try {
          localStorage.setItem('kondang_user_id', data.user.id);
          localStorage.setItem('kondang_session_id', data.sessionId);
        } catch {}
        // If admin, open admin portal, if regular user default to dashboard
        if (data.user.role === 'admin') {
          setView('admin');
        } else {
          setView('dashboard');
        }
      } else {
        setLoginError(data.message || 'Login gagal.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setLoginError('Koneksi gagal: ' + msg);
    } finally {
      setLoginLoading(false);
    }
  }, []);

  // Signup handler
  const handleSignup = useCallback(async (name: string, email: string, password?: string) => {
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password: password || 'password123' })
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.user);
        setSessionId(data.sessionId);
        setIsSessionLocked(false);
        try {
          localStorage.setItem('kondang_user_id', data.user.id);
          localStorage.setItem('kondang_session_id', data.sessionId);
        } catch {}
        setView('dashboard');
        // Akun baru memiliki 0 hari masa aktif, otomatis tawarkan modal paket
        setPaymentModalOpen(true);
      } else {
        setLoginError(data.message || 'Pendaftaran gagal.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setLoginError('Koneksi gagal: ' + msg);
    } finally {
      setLoginLoading(false);
    }
  }, []);

  // Logout handler
  const handleLogout = useCallback(async () => {
    try {
      localStorage.removeItem('kondang_user_id');
      localStorage.removeItem('kondang_session_id');
    } catch {}

    if (currentUser?.id) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser.id })
        });
      } catch {
        // silent catch
      }
    }
    setCurrentUser(null);
    setSessionId(null);
    setIsSessionLocked(false);
    setView('dashboard');
    setLoginEmail('');
    setLoginPassword('');
    setLoginError('');
  }, [currentUser]);

  // Restore authenticated session from localStorage on initial page load (prevents logout on refresh)
  useEffect(() => {
    async function restoreSession() {
      try {
        const savedUserId = localStorage.getItem('kondang_user_id');
        const savedSessionId = localStorage.getItem('kondang_session_id');

        if (savedUserId && savedSessionId) {
          const res = await fetch('/api/auth/restore', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: savedUserId, sessionId: savedSessionId })
          });
          const data = await res.json();
          if (data.success && data.user) {
            setCurrentUser(data.user);
            setSessionId(data.sessionId);
            setIsSessionLocked(false);
            if (data.user.role === 'admin') {
              setView('admin');
            }
          } else {
            // Invalid or locked elsewhere, clean up
            localStorage.removeItem('kondang_user_id');
            localStorage.removeItem('kondang_session_id');
            if (data.locked) {
              setIsSessionLocked(true);
              setSessionLockMessage(data.message || 'Akun Anda telah diakses di perangkat lain.');
            }
          }
        }
      } catch (err) {
        console.warn('Failed to restore session from localStorage:', err);
      } finally {
        setIsRestoringAuth(false);
      }
    }

    restoreSession();
  }, []);

  // Load user exam history from database
  const loadExamHistory = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`/api/exam/history?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.results)) {
        setExamResults(data.results);
      }
    } catch (err) {
      console.warn('Failed to fetch exam history:', err);
    }
  }, []);

  // Fetch history & pending payments whenever currentUser changes
  useEffect(() => {
    if (currentUser?.id) {
      loadExamHistory(currentUser.id);
      loadPendingPayments(currentUser.id);
    } else {
      setExamResults([]);
      setPendingTransactions([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  // Load questions from MySQL database on initial mount
  useEffect(() => {
    async function loadQuestionsFromDb() {
      try {
        const res = await fetch('/api/questions');
        const data = await res.json();
        if (data.success && Array.isArray(data.questions) && data.questions.length > 0) {
          setQuestions(data.questions);
        }
      } catch (err) {
        console.warn('Failed to load questions from API:', err);
      }
    }
    loadQuestionsFromDb();
  }, []);

  // Load Admin Data (Users & Transactions from MySQL)
  const loadAdminData = useCallback(async () => {
    try {
      const [usersRes, txRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/transactions')
      ]);
      const [usersData, txData] = await Promise.all([
        usersRes.json(),
        txRes.json()
      ]);
      if (usersData.success && Array.isArray(usersData.users)) {
        setAdminUsers(usersData.users);
      }
      if (txData.success && Array.isArray(txData.transactions)) {
        setTransactions(txData.transactions);
      }
    } catch (err) {
      console.warn('Failed to fetch admin users/transactions:', err);
    }
  }, []);

  // When admin portal view opens, refresh users and transactions dynamically from DB
  useEffect(() => {
    if (view === 'admin' || currentUser?.role === 'admin') {
      loadAdminData();
    }
  }, [view, currentUser?.role, loadAdminData]);

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

  // Admin Question Edit / Save Handler (Synced with MySQL)
  const handleSaveQuestion = async (updatedQ: Question) => {
    // Optimistic UI update
    setQuestions((prev) => {
      const idx = prev.findIndex((q) => q.id === updatedQ.id);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = updatedQ;
        return next;
      }
      return [...prev, updatedQ];
    });

    const store = getStore();
    const idx = store.questions.findIndex((q) => q.id === updatedQ.id);
    if (idx !== -1) {
      store.questions[idx] = updatedQ;
    } else {
      store.questions.push(updatedQ);
    }

    try {
      await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedQ)
      });
    } catch (err) {
      console.warn('Error saving question to MySQL API:', err);
    }
  };

  // Admin Question Delete Handler (Synced with MySQL)
  const handleDeleteQuestion = async (questionId: number) => {
    // Optimistic UI update
    setQuestions((prev) => prev.filter((q) => q.id !== questionId));

    const store = getStore();
    store.questions = store.questions.filter((q) => q.id !== questionId);

    try {
      await fetch(`/api/questions?id=${questionId}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.warn('Error deleting question from MySQL API:', err);
    }
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
        if (data.result) {
          setExamResults((prev) => [data.result, ...prev.filter((r) => r.id !== data.result.id)]);
        }
        if (currentUser?.id) {
          loadExamHistory(currentUser.id);
        }
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
    if (data.success && Array.isArray(data.drafts)) {
      setPdfDrafts(data.drafts);
    }
  };

  // PDF import file handler (Cara 2: Unggah Berkas PDF dengan Ekstraksi Gambar Otomatis)
  const handleImportPdfFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/admin/parse-pdf', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.drafts)) {
      setPdfDrafts(data.drafts);
      return data;
    }
    throw new Error(data.message || 'Gagal mengekstrak berkas PDF');
  };

  // Simpan Batch Draf Soal ke Paket Soal (MySQL)
  const handleSaveBatchQuestions = async (newQuestions: Question[]) => {
    const res = await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questions: newQuestions })
    });
    const data = await res.json();
    if (data.success) {
      // Refresh daftar soal dari MySQL
      const qRes = await fetch('/api/questions');
      const qData = await qRes.json();
      if (qData.success && Array.isArray(qData.questions)) {
        setQuestions(qData.questions);
      }
      setPdfDrafts([]);
    } else {
      throw new Error(data.message || 'Gagal menyimpan batch soal ke database');
    }
  };

  // Admin Kick session (persisted to MySQL)
  const handleKickSession = async (userId: string) => {
    // Optimistic UI update
    setAdminUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, activeSessionId: undefined } : u))
    );
    if (currentUser?.id === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, activeSessionId: undefined } : prev));
    }

    try {
      await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'kick', userId })
      });
      loadAdminData();
    } catch (err) {
      console.warn('Failed to kick session in MySQL:', err);
    }
  };

  // Admin Add Subscription Days (persisted to MySQL)
  const handleAddCredit = async (userId: string, count: number) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_subscription', userId, days: count })
      });
      const data = await res.json();
      if (data.success && data.subscriptionExpiresAt) {
        setAdminUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, subscriptionExpiresAt: data.subscriptionExpiresAt } : u))
        );
        if (currentUser?.id === userId) {
          setCurrentUser((prev) => (prev ? { ...prev, subscriptionExpiresAt: data.subscriptionExpiresAt } : prev));
        }
      }
      loadAdminData();
    } catch (err) {
      console.warn('Failed to add subscription days in MySQL:', err);
    }
  };

  // Admin Change Role (persisted to MySQL)
  const handleChangeRole = async (userId: string, newRole: 'user' | 'admin') => {
    try {
      await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'change_role', userId, role: newRole })
      });
      setAdminUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      if (currentUser?.id === userId) {
        setCurrentUser((prev) => (prev ? { ...prev, role: newRole } : prev));
      }
      loadAdminData();
    } catch (err) {
      console.warn('Failed to change user role in MySQL:', err);
    }
  };

  // Admin Delete User (persisted to MySQL)
  const handleDeleteUser = async (userId: string) => {
    try {
      await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', userId })
      });
      setAdminUsers((prev) => prev.filter((u) => u.id !== userId));
      loadAdminData();
    } catch (err) {
      console.warn('Failed to delete user in MySQL:', err);
    }
  };

  if (isRestoringAuth) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 via-rose-600 to-amber-500 flex items-center justify-center text-white shadow-xl shadow-red-500/20 animate-pulse">
          <GraduationCap className="w-8 h-8" />
        </div>
        <p className="text-xs text-slate-400 font-semibold tracking-wide animate-pulse">Memulihkan sesi ujian...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
          {/* Header Brand */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 via-rose-600 to-amber-500 flex items-center justify-center mx-auto text-white shadow-xl shadow-red-500/20">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Kondang<span className="text-red-500">Sensei</span> CBT
              </h1>
              <p className="text-xs text-slate-400">Masuk untuk mengakses Ujian Simulasi JFT-Basic 2026</p>
            </div>
          </div>

          {/* Error Alert */}
          {loginError && (
            <div className="p-3.5 bg-red-950/80 border border-red-800 text-red-300 rounded-2xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{loginError}</span>
            </div>
          )}

          {/* Auth Tab Switcher */}
          <div className="flex p-1 bg-slate-950 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setLoginError('');
              }}
              className={`flex-1 py-2 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 ${
                authMode === 'login'
                  ? 'bg-slate-800 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              Masuk (Login)
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setLoginError('');
              }}
              className={`flex-1 py-2 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 ${
                authMode === 'signup'
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Daftar Akun Baru
            </button>
          </div>

          {/* Form Login / Signup */}
          {authMode === 'login' ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin(loginEmail, loginPassword);
              }}
              className="space-y-4 text-xs"
            >
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-400" />
                  Alamat Email:
                </label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-indigo-400" />
                  Kata Sandi (Password):
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-xs pr-10 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-black text-xs rounded-xl shadow-lg shadow-red-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                {loginLoading ? 'Memproses Masuk...' : 'Masuk ke Akun'}
              </button>
            </form>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSignup(signupName, loginEmail, loginPassword);
              }}
              className="space-y-4 text-xs"
            >
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-rose-400" />
                  Nama Lengkap Peserta:
                </label>
                <input
                  type="text"
                  required
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="Contoh: Andi Pratama"
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-rose-400" />
                  Alamat Email:
                </label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-rose-400" />
                  Buat Kata Sandi (Minimal 6 Karakter):
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-xs pr-10 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-[11px] leading-relaxed">
                Catatan: Akun baru dibuat dengan 0 hari akses CBT. Anda dapat memilih paket langganan untuk mulai mengerjakan soal.
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                {loginLoading ? 'Mendaftarkan Akun...' : 'Buat Akun & Mulai'}
              </button>
            </form>
          )}

          <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1 pt-2 border-t border-slate-800/80">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Dilindungi enkripsi sesi tunggal CBT</span>
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
        onOpenProfile={() => setProfileModalOpen(true)}
        onOpenPendingPayments={() => setPendingPaymentsModalOpen(true)}
        pendingCount={pendingTransactions.length}
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
            questions={(() => {
              const answeredIds = new Set(currentResult.answers.map((a) => a.questionId));
              const resultQuestions = questions.filter((q) => answeredIds.has(q.id));
              return resultQuestions.length > 0
                ? resultQuestions
                : questions.filter((q) => (q.packageId || 1) === selectedPackageId);
            })()}
            userAnswers={currentResult.answers}
            onBackToReport={() => setView('report')}
          />
        )}

        {/* VIEW: ADMIN PORTAL */}
        {view === 'admin' && (
          <AdminPortal
            users={adminUsers}
            questions={questions}
            transactions={transactions}
            pdfDrafts={pdfDrafts}
            onKickSession={handleKickSession}
            onAddCredit={handleAddCredit}
            onChangeRole={handleChangeRole}
            onDeleteUser={handleDeleteUser}
            onRefreshData={loadAdminData}
            onImportPdfText={handleImportPdfText}
            onImportPdfFile={handleImportPdfFile}
            onSaveBatchQuestions={handleSaveBatchQuestions}
            onSaveQuestion={handleSaveQuestion}
            onDeleteQuestion={handleDeleteQuestion}
          />
        )}

        {/* VIEW: STUDENT DASHBOARD */}
        {view === 'dashboard' && (
          <div className="max-w-7xl mx-auto space-y-8 pb-12">
            {/* Hero Section Banner */}
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-4 sm:p-6 md:p-8 shadow-2xl">
              <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent pointer-events-none"></div>

              <div className="relative z-10 max-w-2xl space-y-3 sm:space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 sm:px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-[11px] sm:text-xs font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3" /> 1 Sesi Terkunci
                  </span>

                  {pendingTransactions.length > 0 && (
                    <button
                      onClick={() => setPendingPaymentsModalOpen(true)}
                      className="px-2.5 sm:px-3 py-1 rounded-full bg-amber-950/90 border border-amber-600 text-amber-300 text-[11px] sm:text-xs font-extrabold flex items-center gap-1.5 hover:bg-amber-900 transition animate-pulse"
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>{pendingTransactions.length} Tagihan Pending</span>
                    </button>
                  )}
                </div>

                <h1 className="text-xl sm:text-2xl md:text-4xl font-black text-white tracking-tight leading-tight">
                  Simulasi Ujian JFT-Basic & Evaluasi Pembahasan Detail
                </h1>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Latihan 50 soal CBT Japan Foundation Test (Moji Goi, Kaiwa, Chōkai Listening, & Dokkai Reading). Dapatkan Rapor Resmi JFT & analisis jawaban salah.
                </p>

                <div className="pt-2 sm:pt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
                  <button
                    onClick={() => handleStartExam()}
                    className="py-3 sm:py-3.5 px-5 sm:px-6 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-extrabold text-xs sm:text-sm rounded-xl sm:rounded-2xl shadow-xl shadow-red-600/30 transition flex items-center justify-center gap-2 transform hover:-translate-y-0.5 shrink-0"
                  >
                    <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
                    <span>Mulai Ujian Simulasi Sekarang</span>
                  </button>

                  <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3">
                    <button
                      onClick={() => setPaymentModalOpen(true)}
                      className="py-2.5 sm:py-3.5 px-4 sm:px-5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl sm:rounded-2xl border border-slate-700 transition flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                      <Zap className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
                      <span>Beli Paket Tryout</span>
                    </button>

                    <button
                      onClick={() => setProfileModalOpen(true)}
                      className="py-2.5 sm:py-3.5 px-4 sm:px-5 bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 font-bold text-xs rounded-xl sm:rounded-2xl border border-indigo-700/80 transition flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                      <UserCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span>Edit Profil Sertifikat</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>



            {/* User Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
                <div className="text-xs text-slate-400 font-semibold">Masa Aktif Akses Tryout</div>
                <div className="text-xl font-black text-amber-400 flex items-center gap-2">
                  <Zap className="w-6 h-6 fill-amber-400" />
                  {isSubscriptionActive(currentUser)
                    ? `Unlimited (${getRemainingSubscriptionText(currentUser)})`
                    : '0 Hari (Perlu Aktivasi)'}
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
        currentUser={currentUser}
        onClose={() => {
          setPaymentModalOpen(false);
          if (currentUser?.id) loadPendingPayments(currentUser.id);
        }}
        onPaymentSuccess={(pkgId, method) => {
          handlePaymentSuccess(pkgId, method);
          if (currentUser?.id) loadPendingPayments(currentUser.id);
        }}
      />

      {/* Pending Payments List Modal */}
      <PendingPaymentsModal
        isOpen={pendingPaymentsModalOpen}
        pendingTransactions={pendingTransactions}
        onClose={() => setPendingPaymentsModalOpen(false)}
        onRefresh={() => {
          if (currentUser?.id) loadPendingPayments(currentUser.id);
        }}
        onPaymentSuccess={(pkgId, method) => {
          handlePaymentSuccess(pkgId, method);
          if (currentUser?.id) loadPendingPayments(currentUser.id);
        }}
      />

      {/* Single Session Lock Modal */}
      <SingleSessionLockModal
        isOpen={isSessionLocked}
        message={sessionLockMessage}
        onRelogin={() => handleLogin(currentUser.email, currentUser.role)}
      />

      {/* Examinee Profile & Certificate Edit Modal */}
      <ProfileModal
        isOpen={profileModalOpen}
        user={currentUser}
        onClose={() => setProfileModalOpen(false)}
        onUpdateUser={(updated) => {
          setCurrentUser(updated);
          // If viewing certificate report, sync report info immediately
          setCurrentResult((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              userName: updated.name,
              registrationNumber: updated.registrationNumber,
              nationality: updated.nationality,
              dateOfBirth: updated.dateOfBirth,
              sex: updated.sex,
              facePhotoUrl: updated.facePhotoUrl
            };
          });
        }}
      />
    </div>
  );
}
