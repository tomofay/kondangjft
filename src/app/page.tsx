'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { User, Question, ExamResult, TryoutPackage, Transaction, UserAnswer, PDFQuestionDraft, ExamSet } from '../types';
import { getStore, isSubscriptionActive, getRemainingDays, getRemainingSubscriptionText, EXAM_SETS, DEFAULT_ANONYMOUS_PHOTO } from '../lib/dataStore';
import { Navbar } from '../components/Navbar';
import { SingleSessionLockModal } from '../components/SingleSessionLockModal';
import { CbtExamEngine } from '../components/CbtExamEngine';
import { JftResultReport } from '../components/JftResultReport';
import { QuestionReview } from '../components/QuestionReview';
import { PackagePaymentModal } from '../components/PackagePaymentModal';
import { PendingPaymentsModal } from '../components/PendingPaymentsModal';
import { AdminPortal } from '../components/AdminPortal';
import { ProfileModal } from '../components/ProfileModal';
import { LandingPage } from '../components/LandingPage';
import { MiniTryoutExperience } from '../components/MiniTryoutExperience';
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
  LogOut,
  UserPlus,
  AlertCircle,
  Eye,
  EyeOff,
  Copy,
  Check,
  Calendar,
  Flame,
  Target,
  ArrowRight,
  TrendingUp,
  FileText,
  CreditCard,
  ShieldAlert,
  Volume2,
  X,
  Lightbulb,
  ArrowLeftRight
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
  const [copiedRegNo, setCopiedRegNo] = useState(false);
  const [miniTryoutOpen, setMiniTryoutOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Active view: 'dashboard' | 'exam' | 'report' | 'review' | 'admin'
  const [view, setView] = useState<'dashboard' | 'exam' | 'report' | 'review' | 'admin'>('dashboard');

  // App Data & Selected Question Package (1, 2, 3, 4, 5, ...)
  const [questions, setQuestions] = useState<Question[]>(() => getStore().questions);
  const [examSets, setExamSets] = useState<ExamSet[]>(() => getStore().examSets || EXAM_SETS);
  const [selectedPackageId, setSelectedPackageId] = useState<number>(1);
  const [examResults, setExamResults] = useState<ExamResult[]>(() => getStore().examResults);
  const [packages] = useState<TryoutPackage[]>(() => getStore().packages);
  const [transactions, setTransactions] = useState<Transaction[]>(() => getStore().transactions);
  const [pdfDrafts, setPdfDrafts] = useState<PDFQuestionDraft[]>(() => getStore().pdfDrafts);
  const [adminUsers, setAdminUsers] = useState<User[]>(() => getStore().users);
  const [adminExamResults, setAdminExamResults] = useState<ExamResult[]>([]);
  const examLiveProgressRef = useRef<{
    view?: string;
    currentIndex: number;
    currentNumber: number;
    currentSection: string;
    sectionTitle?: string;
    answeredCount: number;
    totalQuestions: number;
    timeLeftSeconds: number;
    [key: string]: any;
  } | null>(null);

  // Memoize questions for the currently selected package to prevent unnecessary array reference changes
  const currentExamQuestions = useMemo(() => {
    return questions.filter((q) => (q.packageId || 1) === selectedPackageId);
  }, [questions, selectedPackageId]);

  // Selected result for report / review
  const [currentResult, setCurrentResult] = useState<ExamResult | null>(null);

  // Prometric Pre-Exam Confirmation Modal
  const [preExamModalOpen, setPreExamModalOpen] = useState(false);
  const [pendingExamPackageId, setPendingExamPackageId] = useState<number>(1);
  const [preExamAgreement, setPreExamAgreement] = useState(false);

  // Logout Confirmation Modal
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

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
        setAuthModalOpen(false);
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
        setAuthModalOpen(false);
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
      localStorage.removeItem('kondang_active_exam_session');
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

  // Restore authenticated session from localStorage on initial page load
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

            // Check if user was actively in the middle of a CBT exam
            let isExamActive = false;
            try {
              const activeExamRaw = localStorage.getItem('kondang_active_exam_session');
              if (activeExamRaw) {
                const activeExam = JSON.parse(activeExamRaw);
                if (activeExam && activeExam.userId === data.user.id && activeExam.timeLeft > 1) {
                  setSelectedPackageId(activeExam.packageId || 1);
                  setView('exam');
                  isExamActive = true;
                }
              }
            } catch (e) {
              console.warn('Failed to parse active exam:', e);
            }

            if (!isExamActive) {
              if (data.user.role === 'admin') {
                setView('admin');
              } else {
                setView('dashboard');
              }
            }
          } else {
            // Invalid or locked elsewhere, clean up
            localStorage.removeItem('kondang_user_id');
            localStorage.removeItem('kondang_session_id');
            localStorage.removeItem('kondang_active_exam_session');
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

  // Load dynamic exam sets from MySQL database
  const loadExamSets = useCallback(async () => {
    try {
      const res = await fetch('/api/exam-sets');
      const data = await res.json();
      if (data.success && Array.isArray(data.examSets) && data.examSets.length > 0) {
        setExamSets(data.examSets);
      }
    } catch (err) {
      console.warn('Failed to fetch exam sets:', err);
    }
  }, []);

  // Load initial bank soal questions from MySQL
  useEffect(() => {
    async function loadQuestions() {
      try {
        const res = await fetch('/api/questions');
        const data = await res.json();
        if (data.success && Array.isArray(data.questions) && data.questions.length > 0) {
          setQuestions(data.questions);
        }
      } catch (err) {
        console.warn('Failed to fetch questions from MySQL:', err);
      }
    }
    loadQuestions();
    loadExamSets();
  }, [loadExamSets]);

  // Load pending payments and user exam history whenever currentUser changes
  useEffect(() => {
    if (currentUser?.id) {
      loadPendingPayments(currentUser.id);
      loadExamHistory(currentUser.id);
    }
  }, [currentUser?.id, loadPendingPayments, loadExamHistory]);

  // Reset live exam progress when leaving exam view
  useEffect(() => {
    if (view !== 'exam') {
      examLiveProgressRef.current = null;
    }
  }, [view]);

  // Background Session Verification Heartbeat & Realtime Live Activity (pings every 2.5s)
  useEffect(() => {
    if (!currentUser || !sessionId) return;

    const sendHeartbeat = async () => {
      try {
        const curPkg = examSets.find((s) => s.id === selectedPackageId);
        const liveExam = examLiveProgressRef.current;
        const activityPayload = {
          view,
          packageId: selectedPackageId,
          packageName: curPkg?.name || `Paket Ujian #${selectedPackageId}`,
          packageCode: curPkg?.code || `JFT-SET-${selectedPackageId}`,
          ...(view === 'exam' && liveExam ? liveExam : {}),
          updatedAt: Date.now()
        };

        const res = await fetch('/api/auth/session-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id,
            sessionId,
            activity: activityPayload
          })
        });
        const data = await res.json();
        if (data && !data.valid) {
          setIsSessionLocked(true);
          setSessionLockMessage(data.message || 'Akun Anda telah diakses dari perangkat lain.');
        }
      } catch (err) {
        console.warn('Heartbeat session check failed:', err);
      }
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 2500);

    return () => clearInterval(interval);
  }, [currentUser, sessionId, view, selectedPackageId, examSets]);

  // Load admin data
  const loadAdminData = useCallback(async () => {
    try {
      const [usersRes, txRes, resHistory] = await Promise.all([
        fetch('/api/admin/users').then((r) => r.json()),
        fetch('/api/admin/transactions').then((r) => r.json()),
        fetch('/api/exam/history?all=true').then((r) => r.json())
      ]);

      if (usersRes.success && Array.isArray(usersRes.users)) {
        setAdminUsers(usersRes.users);
      }
      if (txRes.success && Array.isArray(txRes.transactions)) {
        setTransactions(txRes.transactions);
      }
      if (resHistory.success && Array.isArray(resHistory.results)) {
        setAdminExamResults(resHistory.results);
      }
    } catch (err) {
      console.warn('Failed to load admin data:', err);
    }
  }, []);

  // Realtime Live Polling for Admin Portal: syncs every 2.5 seconds
  useEffect(() => {
    if (view !== 'admin') return;

    loadAdminData();
    const interval = setInterval(() => {
      loadAdminData();
    }, 2500);

    return () => clearInterval(interval);
  }, [view, loadAdminData]);

  // Start exam handler (Prometric Pre-Exam Check)
  const handleStartExam = (packageId?: number) => {
    const pkgIdToUse = packageId || selectedPackageId;

    if (!isSubscriptionActive(currentUser)) {
      setPaymentModalOpen(true);
      return;
    }

    const availableForPkg = questions.filter((q) => (q.packageId || 1) === pkgIdToUse);
    if (availableForPkg.length === 0) {
      alert(`Paket #${pkgIdToUse} belum memiliki butir soal yang diunggah. Silakan pilih paket lain.`);
      return;
    }

    setPendingExamPackageId(pkgIdToUse);
    setPreExamAgreement(false);
    setPreExamModalOpen(true);
  };

  const handleConfirmStartExam = () => {
    setSelectedPackageId(pendingExamPackageId);
    setPreExamModalOpen(false);
    setView('exam');
  };

  // Submit exam handler
  const handleSubmitExam = async (userAnswers: UserAnswer[], timeSpentSeconds: number) => {
    if (!currentUser) return;

    try {
      const res = await fetch('/api/exam/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          packageId: selectedPackageId,
          answers: userAnswers,
          totalTimeSpentSeconds: timeSpentSeconds
        })
      });

      const data = await res.json();
      if (data.success && data.result) {
        try {
          localStorage.removeItem('kondang_active_exam_session');
        } catch {}
        setCurrentResult(data.result);
        if (data.user) {
          setCurrentUser(data.user);
        }
        setExamResults((prev) => [data.result, ...prev]);
        setView('report');
      } else {
        alert(data.message || 'Gagal menyimpan hasil ujian');
      }
    } catch (err) {
      console.error('Error submitting exam:', err);
      alert('Terjadi kesalahan saat memproses penilaian ujian.');
    }
  };

  // Payment success handler
  const handlePaymentSuccess = async (pkgId: string, paymentMethod: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          packageId: pkgId,
          paymentMethod
        })
      });
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
      }
      setPaymentModalOpen(false);
      setPendingPaymentsModalOpen(false);
      loadPendingPayments(currentUser.id);
    } catch (err) {
      console.error('Checkout error:', err);
    }
  };

  // Question handlers for Admin
  const handleSaveQuestion = async (updatedQ: Question) => {
    const res = await fetch('/api/questions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedQ)
    });
    const data = await res.json();
    if (data.success) {
      setQuestions((prev) => prev.map((q) => (q.id === updatedQ.id ? updatedQ : q)));
    } else {
      alert(data.message || 'Gagal memperbarui soal di basis data');
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    const res = await fetch(`/api/questions?id=${questionId}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (data.success) {
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
    } else {
      alert(data.message || 'Gagal menghapus soal');
    }
  };

  // PDF import handlers
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

  const handleSaveBatchQuestions = async (newQuestions: Question[]) => {
    const res = await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questions: newQuestions })
    });
    const data = await res.json();
    if (data.success) {
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

  // Admin Kick session
  const handleKickSession = async (userId: string) => {
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

  // Helper calculations for Dashboard Statistics (Menggunakan skor terbaik & rekor tertinggi per seksi)
  const dashboardStats = useMemo(() => {
    if (examResults.length === 0) {
      return {
        avgScore: 0,
        avgPercent: 0,
        testsCount: 0,
        accuracyPercent: 0,
        maxScore: 0,
        s1Score: 0,
        s2Score: 0,
        s3Score: 0,
        s4Score: 0,
        sectionRank: [
          { key: 'S1', name: 'S1 Moji & Goi', score: 0, color: 'text-rose-700' },
          { key: 'S2', name: 'S2 Kaiwa', score: 0, color: 'text-amber-700' },
          { key: 'S3', name: 'S3 Chōkai', score: 0, color: 'text-sky-700' },
          { key: 'S4', name: 'S4 Dokkai', score: 0, color: 'text-emerald-700' }
        ]
      };
    }

    const totalScores = examResults.reduce((acc, r) => acc + r.totalScore, 0);
    const avgScore = Math.round(totalScores / examResults.length);
    const avgPercent = Math.round((avgScore / 250) * 100);
    const maxScore = Math.max(...examResults.map((r) => r.totalScore));

    // Section calculations: Ambil nilai terbaik (paling gede) yang pernah diraih siswa di tiap seksi
    let s1Max = 0, s2Max = 0, s3Max = 0, s4Max = 0;
    let hasS1 = false, hasS2 = false, hasS3 = false, hasS4 = false;

    examResults.forEach((r) => {
      if (r.sectionScores) {
        if (r.sectionScores.S1 && r.sectionScores.S1.maxScore) {
          const pct = Math.round((r.sectionScores.S1.score / r.sectionScores.S1.maxScore) * 100);
          if (pct > s1Max || !hasS1) s1Max = pct;
          hasS1 = true;
        }
        if (r.sectionScores.S2 && r.sectionScores.S2.maxScore) {
          const pct = Math.round((r.sectionScores.S2.score / r.sectionScores.S2.maxScore) * 100);
          if (pct > s2Max || !hasS2) s2Max = pct;
          hasS2 = true;
        }
        if (r.sectionScores.S3 && r.sectionScores.S3.maxScore) {
          const pct = Math.round((r.sectionScores.S3.score / r.sectionScores.S3.maxScore) * 100);
          if (pct > s3Max || !hasS3) s3Max = pct;
          hasS3 = true;
        }
        if (r.sectionScores.S4 && r.sectionScores.S4.maxScore) {
          const pct = Math.round((r.sectionScores.S4.score / r.sectionScores.S4.maxScore) * 100);
          if (pct > s4Max || !hasS4) s4Max = pct;
          hasS4 = true;
        }
      }
    });

    const s1Score = hasS1 ? s1Max : 0;
    const s2Score = hasS2 ? s2Max : 0;
    const s3Score = hasS3 ? s3Max : 0;
    const s4Score = hasS4 ? s4Max : 0;

    // Urutkan seksi dari persentase terendah ke tertinggi untuk rekomendasi latihan
    const sectionRank = [
      { key: 'S1', name: 'S1 Moji & Goi', score: s1Score, color: 'text-rose-700' },
      { key: 'S2', name: 'S2 Kaiwa', score: s2Score, color: 'text-amber-700' },
      { key: 'S3', name: 'S3 Chōkai', score: s3Score, color: 'text-sky-700' },
      { key: 'S4', name: 'S4 Dokkai', score: s4Score, color: 'text-emerald-700' }
    ].sort((a, b) => a.score - b.score);

    return {
      avgScore,
      avgPercent,
      testsCount: examResults.length,
      accuracyPercent: avgPercent,
      maxScore,
      s1Score,
      s2Score,
      s3Score,
      s4Score,
      sectionRank
    };
  }, [examResults]);

  if (isRestoringAuth) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-stone-900 flex flex-col items-center justify-center p-4 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 via-rose-600 to-red-700 flex items-center justify-center text-white shadow-xl shadow-red-500/20 animate-pulse">
          <GraduationCap className="w-8 h-8" />
        </div>
        <p className="text-xs text-stone-500 font-bold tracking-wide animate-pulse">
          Memulihkan sesi ujian KondangSensei...
        </p>
      </div>
    );
  }

  // UNAUTHENTICATED VISITOR SCREEN: High-converting Landing Page with Mini Tryout & Auth Modal
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-stone-900 flex flex-col font-sans">
        <LandingPage
          packages={packages}
          onOpenMiniTryout={() => setMiniTryoutOpen(true)}
          onOpenLogin={() => {
            setAuthMode('login');
            setLoginError('');
            setAuthModalOpen(true);
          }}
          onOpenSignup={() => {
            setAuthMode('signup');
            setLoginError('');
            setAuthModalOpen(true);
          }}
          onSelectPackage={(pkg) => {
            setAuthMode('signup');
            setLoginError(`Silakan buat akun atau masuk terlebih dahulu untuk membeli ${pkg.name}. Akun langsung aktif!`);
            setAuthModalOpen(true);
          }}
        />

        {/* 1 Mini Tryout Gratis (10–15 Soal) Modal / Experience */}
        {miniTryoutOpen && (
          <MiniTryoutExperience
            currentUser={null}
            onOpenFullPackagePayment={() => {
              setMiniTryoutOpen(false);
              setAuthMode('signup');
              setLoginError('Buat akun atau masuk untuk membuka akses 5 Paket Simulasi Full & mulai latihan!');
              setAuthModalOpen(true);
            }}
            onClose={() => setMiniTryoutOpen(false)}
          />
        )}

        {/* Auth Modal (Login / Signup) */}
        {authModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
            <div className="relative max-w-md w-full bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-8 animate-in zoom-in-95 duration-200">
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setAuthModalOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header Brand */}
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 via-rose-600 to-red-700 flex items-center justify-center mx-auto text-white shadow-lg shadow-red-500/25">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-red-700 border border-rose-200 text-[10px] font-black uppercase tracking-wider mb-1">
                    <span>KONDANGSENSEI</span>
                    <span>•</span>
                    <span>Platform Simulasi JFT-Basic A2</span>
                  </div>
                  <h2 className="text-2xl font-black text-stone-900 tracking-tight">
                    Kondang<span className="text-red-600">Sensei</span> CBT
                  </h2>
                  <p className="text-xs text-stone-500 mt-1">
                    {authMode === 'login'
                      ? 'Masuk untuk mengakses Ujian Simulasi & Analisis Rapor JFT-Basic A2'
                      : 'Daftar akun baru untuk mulai latihan dan dapatkan nomor registrasi ujian'}
                  </p>
                </div>
              </div>

              {/* Error Alert */}
              {loginError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{loginError}</span>
                </div>
              )}

              {/* Auth Tab Switcher */}
              <div className="flex p-1 bg-stone-100 rounded-2xl border border-stone-200">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setLoginError('');
                  }}
                  className={`flex-1 py-2 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    authMode === 'login'
                      ? 'bg-white text-red-600 font-black shadow-xs'
                      : 'text-stone-500 hover:text-stone-900'
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
                  className={`flex-1 py-2 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    authMode === 'signup'
                      ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-xs font-black'
                      : 'text-stone-500 hover:text-stone-900'
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
                    <label className="font-bold text-stone-700 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-red-600" />
                      Alamat Email:
                    </label>
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="nama@email.com"
                      className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 text-xs focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-stone-700 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-red-600" />
                      Kata Sandi (Password):
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 text-xs pr-10 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-stone-400 hover:text-stone-700 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-black text-xs rounded-xl shadow-md shadow-red-500/25 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    {loginLoading ? 'Memproses Masuk...' : 'Masuk ke Dashboard'}
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
                    <label className="font-bold text-stone-700 flex items-center gap-1.5">
                      <UserIcon className="w-3.5 h-3.5 text-red-600" />
                      Nama Lengkap Peserta:
                    </label>
                    <input
                      type="text"
                      required
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      placeholder="Contoh: Andi Pratama"
                      className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 text-xs focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-stone-700 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-red-600" />
                      Alamat Email:
                    </label>
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="nama@email.com"
                      className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 text-xs focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-stone-700 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-red-600" />
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
                        className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 text-xs pr-10 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-stone-400 hover:text-stone-700 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-red-800 text-[11px] leading-relaxed">
                    Catatan: Akun baru otomatis mendapatkan nomor registrasi resmi JFT dan dapat langsung memilih paket simulasi ujian.
                  </div>

                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-black text-xs rounded-xl shadow-md shadow-red-500/25 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    {loginLoading ? 'Mendaftarkan Akun...' : 'Buat Akun & Mulai'}
                  </button>
                </form>
              )}

              <div className="text-center text-[11px] text-stone-500 flex items-center justify-center gap-1 pt-2 border-t border-stone-100">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Dilindungi enkripsi sesi tunggal CBT KondangSensei</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // MAIN APPLICATION SHELL
  return (
    <div className="min-h-screen bg-[#f8fafc] text-stone-900 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        user={currentUser}
        onOpenBuyCredits={() => setPaymentModalOpen(true)}
        onOpenProfile={() => setProfileModalOpen(true)}
        onOpenPendingPayments={() => setPendingPaymentsModalOpen(true)}
        pendingCount={pendingTransactions.length}
        onLogout={() => setLogoutModalOpen(true)}
        activeView={view}
        onChangeView={(v) => setView(v)}
      />

      {/* Main Container */}
      <main className="flex-1 p-3 sm:p-5 md:p-8">
        {/* VIEW: CBT EXAM SIMULATOR */}
        {view === 'exam' && (
          <CbtExamEngine
            questions={currentExamQuestions}
            onSubmitExam={handleSubmitExam}
            user={currentUser}
            onExitExam={() => setView('dashboard')}
            onProgressUpdate={(prog) => {
              examLiveProgressRef.current = {
                ...prog,
                view: 'exam'
              };
            }}
          />
        )}

        {/* VIEW: JFT CERTIFICATE REPORT */}
        {view === 'report' && currentResult && (
          <JftResultReport
            result={currentResult}
            currentUser={currentUser}
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
            examSets={examSets}
            examResults={adminExamResults}
            onKickSession={handleKickSession}
            onAddCredit={handleAddCredit}
            onChangeRole={handleChangeRole}
            onDeleteUser={handleDeleteUser}
            onRefreshData={async () => {
              await Promise.all([
                loadAdminData(),
                loadExamSets(),
                fetch('/api/questions').then((r) => r.json()).then((d) => {
                  if (d.success && Array.isArray(d.questions)) setQuestions(d.questions);
                })
              ]);
            }}
            onImportPdfText={handleImportPdfText}
            onImportPdfFile={handleImportPdfFile}
            onSaveBatchQuestions={handleSaveBatchQuestions}
            onSaveQuestion={handleSaveQuestion}
            onDeleteQuestion={handleDeleteQuestion}
          />
        )}

        {/* VIEW: STUDENT DASHBOARD (FRESH WHITE & KONDANGSENSEI CBT STYLE) */}
        {view === 'dashboard' && (
          <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-150">
            {/* Top Greeting Banner (Vibrant KondangSensei Edition) */}
            <div className="bg-white border border-stone-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  </div>
                  <span className="text-[11px] sm:text-xs font-black text-stone-800 uppercase tracking-wider">
                    JFT-Basic A2 Simulator
                  </span>
                  <span className="text-xs text-stone-400">•</span>
                  <span className="text-[11px] sm:text-xs font-japanese font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-amber-600 to-sky-600">
                    KondangSensei Edition
                  </span>
                </div>
                <h1 className="text-xl sm:text-3xl font-black text-stone-900 tracking-tight flex items-baseline gap-1.5 sm:gap-2">
                  <span>Halo, {currentUser.name}</span>
                  <span className="text-lg sm:text-2xl font-japanese text-rose-600 font-bold">さん</span>
                </h1>
                <p className="text-xs sm:text-sm text-stone-500 font-medium">
                  Siap menaklukkan JFT/SSW hari ini? Ayo mulai latihan! • 今日も合格を目指して頑張りましょう！
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setMiniTryoutOpen(true)}
                  className="w-full sm:w-auto justify-center py-3 px-4 bg-rose-50 hover:bg-rose-100 text-red-700 border border-rose-200 font-black text-xs sm:text-sm rounded-xl sm:rounded-2xl transition flex items-center gap-2 cursor-pointer shadow-2xs"
                >
                  <Sparkles className="w-4 h-4 text-red-600" />
                  <span>Mini Tryout Gratis (12 Soal)</span>
                </button>
                <button
                  onClick={() => handleStartExam()}
                  className="w-full sm:w-auto justify-center py-3 px-5 sm:px-6 bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-black text-xs sm:text-sm rounded-xl sm:rounded-2xl shadow-md shadow-rose-500/20 transition flex items-center gap-2 transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Mulai Simulasi Sekarang</span>
                </button>
              </div>
            </div>

            {/* Quick Diagnostic Mini Tryout Banner */}
            <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-indigo-700 text-white shadow-lg shadow-red-500/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-wider backdrop-blur-xs">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>Diagnostik Cepat Real-Time</span>
                </div>
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  Uji Level Pemahaman & Deteksi Kelemahan Utama Anda (12 Soal)
                </h3>
                <p className="text-xs text-rose-100">
                  Format CBT resmi 15 menit dengan audio Chōkai anti-cheat & evaluasi skor langsung untuk mengidentifikasi seksi yang perlu diperdalam.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMiniTryoutOpen(true)}
                className="py-2.5 px-5 bg-white hover:bg-stone-100 text-red-700 font-black text-xs sm:text-sm rounded-xl sm:rounded-2xl shadow-md transition flex items-center gap-2 cursor-pointer shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-red-700" />
                <span>Mulai Mini Tryout Gratis</span>
              </button>
            </div>

            {/* Row 1: Masa Berlaku Card & Referral/Registrasi Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Card 1: Masa Berlaku Langganan (Warm Amber / Mikan Theme) */}
              <div className="bg-gradient-to-br from-amber-50/70 via-white to-orange-50/30 border border-amber-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs flex flex-col justify-between gap-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[11px] font-black uppercase text-amber-800 tracking-wider">
                      Masa Berlaku Langganan
                    </span>
                    <div className="text-xs font-semibold text-stone-500 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-600" />
                      <span>
                        {currentUser.subscriptionExpiresAt
                          ? new Date(currentUser.subscriptionExpiresAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })
                          : 'Belum Aktif'}
                      </span>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold">
                    {currentUser.role === 'admin' ? 'Unlimited (Admin)' : 'Unlimited Tryout'}
                  </span>
                </div>

                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-3xl sm:text-5xl font-black text-amber-600 tracking-tight">
                    {getRemainingDays(currentUser)}
                  </span>
                  <span className="text-lg sm:text-2xl font-black text-stone-800">
                    Hari
                  </span>
                  <span className="text-xs text-stone-500 font-medium">
                    ({getRemainingSubscriptionText(currentUser)} tersisa)
                  </span>
                </div>

                <div className="pt-2 border-t border-amber-100 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2.5">
                  <span className="text-xs text-stone-500">Akses seluruh paket tanpa batas</span>
                  <button
                    onClick={() => setPaymentModalOpen(true)}
                    className="w-full xs:w-auto justify-center py-2 px-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-200 fill-amber-200" />
                    Perpanjang Paket
                  </button>
                </div>
              </div>

              {/* Card 2: Kode Registrasi Resmi JFT & Akun (Ocean Sky / Sora Theme) */}
              <div className="bg-gradient-to-br from-sky-50/70 via-white to-indigo-50/30 border border-sky-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs flex flex-col justify-between gap-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[11px] font-black uppercase text-sky-800 tracking-wider">
                      Nomor Registrasi Ujian Saya
                    </span>
                    <p className="text-xs text-stone-500">Tercetak pada Sertifikat & Rapor JFT</p>
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-600" />
                    1 Sesi CBT Aktif
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <div className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white border border-sky-200 font-mono text-sm sm:text-lg font-black text-indigo-950 tracking-wide shadow-2xs">
                    {currentUser.registrationNumber || 'JFT-2026-88912'}
                  </div>

                  <button
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(currentUser.registrationNumber);
                        setCopiedRegNo(true);
                        setTimeout(() => setCopiedRegNo(false), 2000);
                      }
                    }}
                    className="p-2 sm:p-2.5 rounded-xl border border-sky-200 hover:border-sky-400 hover:bg-sky-50 text-sky-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedRegNo ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-700">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Salin Nomor</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="pt-2 border-t border-sky-100 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2">
                  <span className="text-xs text-stone-500 font-medium truncate max-w-full">
                    Nama: <strong className="text-stone-800">{currentUser.name}</strong> • {currentUser.nationality}
                  </span>
                  <button
                    onClick={() => setProfileModalOpen(true)}
                    className="w-full xs:w-auto justify-center py-1.5 px-3 bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                    Edit Profil
                  </button>
                </div>
              </div>
            </div>

            {/* Row 2: Quick Stats Row (4 Distinct Section Colors) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Stat 1: Sky Blue */}
              <div className="bg-gradient-to-br from-sky-50/40 to-white border border-sky-100 rounded-2xl p-4 sm:p-5 shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-sky-700 uppercase tracking-wide flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                  Rata-rata Skor
                </span>
                <div className="text-2xl sm:text-3xl font-black text-sky-600">
                  {dashboardStats.avgPercent}%
                </div>
                <div className="text-[11px] text-stone-400 font-medium">
                  {dashboardStats.avgScore} / 250 Poin
                </div>
              </div>

              {/* Stat 2: Royal Violet */}
              <div className="bg-gradient-to-br from-violet-50/40 to-white border border-violet-100 rounded-2xl p-4 sm:p-5 shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-violet-700 uppercase tracking-wide flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                  Simulasi Dikerjakan
                </span>
                <div className="text-2xl sm:text-3xl font-black text-violet-600">
                  {dashboardStats.testsCount}
                </div>
                <div className="text-[11px] text-stone-400 font-medium">
                  Sesi tryout diselesaikan
                </div>
              </div>

              {/* Stat 3: Mint Emerald */}
              <div className="bg-gradient-to-br from-emerald-50/40 to-white border border-emerald-100 rounded-2xl p-4 sm:p-5 shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Tingkat Akurasi
                </span>
                <div className="text-2xl sm:text-3xl font-black text-emerald-600">
                  {dashboardStats.accuracyPercent}%
                </div>
                <div className="text-[11px] text-stone-400 font-medium">
                  Akurasi jawaban benar
                </div>
              </div>

              {/* Stat 4: Golden Amber */}
              <div className="bg-gradient-to-br from-amber-50/40 to-white border border-amber-100 rounded-2xl p-4 sm:p-5 shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wide flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Nilai Tertinggi
                </span>
                <div className="text-2xl sm:text-3xl font-black text-amber-600">
                  {dashboardStats.maxScore > 0 ? `${dashboardStats.maxScore}` : '-'}
                  <span className="text-sm font-bold text-stone-400 ml-1">/ 250</span>
                </div>
                <div className="text-[11px] text-stone-400 font-medium">
                  Passing Grade A2.2: 200
                </div>
              </div>
            </div>

            {/* Row 3: Section Analysis (The 4 True JFT Exam Pillars) & Study Streak */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Area yang Perlu Ditingkatkan */}
              <div className="lg:col-span-2 bg-white border border-stone-200/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-indigo-600" />
                    <h2 className="text-base font-black text-stone-900">
                      Area yang Perlu Ditingkatkan (Analisis 4 Seksi JFT)
                    </h2>
                  </div>
                  <span className="text-xs font-semibold text-stone-400">
                    Standar Kelulusan A2
                  </span>
                </div>

                <div className="space-y-4">
                  {/* S1: Moji & Goi - Sakura Rose */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-stone-700">
                      <span className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 font-mono font-black text-[11px] flex items-center justify-center border border-rose-300">
                          S1
                        </span>
                        <span>Moji & Goi (文字と語彙 • Huruf & Kosakata)</span>
                      </span>
                      <span className="font-mono text-rose-700 font-bold">{dashboardStats.s1Score}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-rose-50 rounded-full overflow-hidden border border-rose-100">
                      <div
                        className="h-full bg-rose-500 rounded-full transition-all duration-500"
                        style={{ width: `${dashboardStats.s1Score}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* S2: Kaiwa - Sunny Tangerine / Amber */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-stone-700">
                      <span className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 font-mono font-black text-[11px] flex items-center justify-center border border-amber-300">
                          S2
                        </span>
                        <span>Kaiwa (会話と表現 • Percakapan Situasional)</span>
                      </span>
                      <span className="font-mono text-amber-800 font-bold">{dashboardStats.s2Score}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-amber-50 rounded-full overflow-hidden border border-amber-100">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${dashboardStats.s2Score}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* S3: Chokai - Ocean Sky Blue */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-stone-700">
                      <span className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-sky-100 text-sky-800 font-mono font-black text-[11px] flex items-center justify-center border border-sky-300">
                          S3
                        </span>
                        <span>Chōkai (聴解 • Audio Pendengaran & Situasi)</span>
                      </span>
                      <span className="font-mono text-sky-800 font-bold">{dashboardStats.s3Score}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-sky-50 rounded-full overflow-hidden border border-sky-100">
                      <div
                        className="h-full bg-sky-500 rounded-full transition-all duration-500"
                        style={{ width: `${dashboardStats.s3Score}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* S4: Dokkai - Mint Emerald */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-stone-700">
                      <span className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 font-mono font-black text-[11px] flex items-center justify-center border border-emerald-300">
                          S4
                        </span>
                        <span>Dokkai (読解 • Pemahaman Teks & Dokumen)</span>
                      </span>
                      <span className="font-mono text-emerald-800 font-bold">{dashboardStats.s4Score}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-emerald-50 rounded-full overflow-hidden border border-emerald-100">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${dashboardStats.s4Score}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Recommendation Box */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50/60 via-stone-50 to-sky-50/60 border border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-stone-700 gap-3">
                  <span className="flex items-center gap-1.5 flex-wrap">
                    {examResults.length === 0 ? (
                      <>
                        <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 inline-block" />
                        <span><strong>Tips Awal:</strong> Anda belum memiliki riwayat ujian CBT. Mulai tryout pertama Anda untuk mengukur dan memetakan kemampuan 4 seksi JFT!</span>
                      </>
                    ) : dashboardStats.sectionRank[0]?.score >= 80 ? (
                      <>
                        <Sparkles className="w-4 h-4 text-emerald-500 shrink-0 inline-block" />
                        <span><strong>Luar Biasa!</strong> Rekor nilai seluruh 4 seksi Anda telah melampaui 80% (Standar Kelulusan A2.2). Pertahankan performa ini saat ujian resmi Prometric!</span>
                      </>
                    ) : (
                      <>
                        <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 inline-block" />
                        <span>
                          <strong>Rekomendasi Pintar (Rekor Terbaik):</strong> Prioritaskan latihan intensif pada{' '}
                          <strong className={dashboardStats.sectionRank[0]?.color || 'text-rose-700'}>
                            {dashboardStats.sectionRank[0]?.name} ({dashboardStats.sectionRank[0]?.score}%)
                          </strong>{' '}
                          dan{' '}
                          <strong className={dashboardStats.sectionRank[1]?.color || 'text-amber-700'}>
                            {dashboardStats.sectionRank[1]?.name} ({dashboardStats.sectionRank[1]?.score}%)
                          </strong>{' '}
                          untuk melampaui passing grade 200/250 poin.
                        </span>
                      </>
                    )}
                  </span>
                  <button
                    onClick={() => handleStartExam()}
                    className="text-indigo-600 hover:text-indigo-800 font-black whitespace-nowrap flex items-center gap-1 cursor-pointer shrink-0 self-end sm:self-auto"
                  >
                    Drill Soal <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Right 1 Col: Streak & Passing Grade Standards */}
              <div className="bg-white border border-stone-200/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-5">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-amber-600 font-black text-xs uppercase tracking-wider">
                    <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
                    <span>Aktivitas & Passing Grade</span>
                  </div>

                  <div className="space-y-1">
                    <div className="text-3xl font-black text-stone-900">
                      {examResults.length > 0 ? `${examResults.length} Sesi Selesai` : 'Mulai Hari Ini'}
                    </div>
                    <p className="text-xs text-stone-500">
                      {new Date().toLocaleDateString('id-ID', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-stone-100">
                    <span className="text-[11px] font-bold text-stone-500 uppercase">
                      Standar Skor Kelulusan JFT
                    </span>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between p-2 rounded-xl bg-stone-50 border border-stone-200 font-medium">
                        <span>Level A1 (Dasar)</span>
                        <span className="font-mono font-bold text-stone-700">145 - 174 Poin</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-xl bg-sky-50 border border-sky-200 font-medium text-sky-800">
                        <span>Level A2.1 (Pemula)</span>
                        <span className="font-mono font-bold text-sky-800">175 - 199 Poin</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 font-bold text-emerald-800 shadow-2xs">
                        <span>Level A2.2 (LULUS SSW)</span>
                        <span className="font-mono font-black text-emerald-800">200 - 250 Poin</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Nilai akhir & evaluasi langsung terbit begitu ujian selesai dikonfirmasi.</span>
                </div>
              </div>
            </div>

            {/* Row 4: Pilihan Paket Bank Soal Ujian JFT-Basic (Colorful Distinct Cards) */}
            <div className="bg-white border border-stone-200/90 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs space-y-5">
              <div className="flex flex-wrap items-center justify-between border-b border-stone-100 pb-4 gap-2">
                <div>
                  <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-600" />
                    Pilihan Paket Bank Soal Simulasi JFT-Basic ({examSets.length} Paket Tersedia)
                  </h2>
                  <p className="text-xs text-stone-500">
                    Pilih paket tryout yang ingin Anda kerjakan. Dilengkapi bank soal komprehensif dengan simulasi resmi seksi S1 - S4.
                  </p>
                </div>

                <button
                  onClick={() => setPaymentModalOpen(true)}
                  className="py-2 px-3.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-xl border border-amber-200 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  Beli Paket Tambahan
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {examSets.map((set, setIdx) => {
                  const setQuestionCount = questions.filter((q) => (q.packageId || 1) === set.id).length;
                  const isSelected = selectedPackageId === set.id;

                  // Distinct colorful theme per package
                  const themes = [
                    {
                      bg: 'from-emerald-50/80 to-white',
                      border: 'border-emerald-300',
                      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                      btn: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/20',
                      ring: 'ring-emerald-500/30'
                    },
                    {
                      bg: 'from-sky-50/80 to-white',
                      border: 'border-sky-300',
                      badgeBg: 'bg-sky-100 text-sky-800 border-sky-300',
                      btn: 'bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 shadow-sky-500/20',
                      ring: 'ring-sky-500/30'
                    },
                    {
                      bg: 'from-amber-50/80 to-white',
                      border: 'border-amber-300',
                      badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
                      btn: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-amber-500/20',
                      ring: 'ring-amber-500/30'
                    },
                    {
                      bg: 'from-violet-50/80 to-white',
                      border: 'border-violet-300',
                      badgeBg: 'bg-violet-100 text-violet-800 border-violet-300',
                      btn: 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-violet-500/20',
                      ring: 'ring-violet-500/30'
                    },
                    {
                      bg: 'from-rose-50/80 to-white',
                      border: 'border-rose-300',
                      badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
                      btn: 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 shadow-rose-500/20',
                      ring: 'ring-rose-500/30'
                    }
                  ];
                  const theme = themes[setIdx % themes.length];

                  return (
                    <div
                      key={set.id}
                      className={`p-5 rounded-2xl border transition flex flex-col justify-between gap-4 ${
                        isSelected
                          ? `bg-gradient-to-br ${theme.bg} ${theme.border} shadow-md ring-1 ${theme.ring}`
                          : 'bg-stone-50/60 border-stone-200 hover:border-stone-300 hover:bg-white'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-black border ${theme.badgeBg}`}>
                            {set.code}
                          </span>
                          <span className="text-[11px] font-bold text-stone-600 bg-white px-2 py-0.5 rounded-full border border-stone-200 shadow-2xs">
                            {setQuestionCount > 0 ? `${setQuestionCount} Soal Aktif` : `${set.totalQuestions} Soal`}
                          </span>
                        </div>
                        <h3 className="text-base font-black text-stone-900">{set.name}</h3>
                        <p className="text-xs text-stone-500 leading-relaxed">{set.description}</p>
                      </div>

                      <div className="pt-3 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2.5 border-t border-stone-200/60">
                        <span className="text-[11px] font-medium text-stone-400">
                          S1 (12) • S2 (12) • S3 (13) • S4 (13)
                        </span>
                        <button
                          onClick={() => handleStartExam(set.id)}
                          className={`w-full xs:w-auto justify-center py-2.5 px-4 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer ${theme.btn}`}
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

            {/* Row 5: Riwayat Tes Terakhir (Tabel Bersih) */}
            <div className="bg-white border border-stone-200/90 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-lg font-black text-stone-900">
                    Riwayat Tes Terakhir
                  </h2>
                </div>
                <span className="text-xs font-semibold text-stone-500">
                  Total: {examResults.length} Riwayat
                </span>
              </div>

              {examResults.length === 0 ? (
                <div className="text-center py-10 text-stone-400 text-xs">
                  Belum ada simulasi yang dikerjakan. Klik tombol &quot;Mulai Simulasi Sekarang&quot; di atas untuk memulai latihan pertama Anda!
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="overflow-x-auto rounded-xl border border-stone-100">
                    <table className="min-w-[620px] w-full text-left text-xs text-stone-700">
                      <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase text-[10px] font-black">
                        <tr>
                          <th className="py-3 px-3">#</th>
                          <th className="py-3 px-3">Paket Tes</th>
                          <th className="py-3 px-3">Skor Hasil</th>
                          <th className="py-3 px-3">Persen</th>
                          <th className="py-3 px-3">Status</th>
                          <th className="py-3 px-3">Tanggal Mulai</th>
                          <th className="py-3 px-3 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {examResults.map((res: ExamResult, idx: number) => {
                          const totalScore = res.totalScore;
                          const percentage = Math.round((totalScore / 250) * 100);
                          return (
                            <tr key={res.id} className="hover:bg-indigo-50/30 transition">
                              <td className="py-3 px-3 font-mono font-bold text-stone-400">{idx + 1}</td>
                              <td className="py-3 px-3 font-bold text-stone-900">
                                Paket #{res.packageId || 1}
                              </td>
                              <td className="py-3 px-3 font-black text-stone-900">
                                {totalScore} <span className="text-stone-400 font-normal">/ 250</span>
                              </td>
                              <td className="py-3 px-3 font-mono font-bold text-stone-800">
                                {percentage}%
                              </td>
                              <td className="py-3 px-3">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                    res.isPassed
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-rose-50 text-red-700 border border-rose-200'
                                  }`}
                                >
                                  {res.isPassed ? 'LULUS (A2.2)' : 'BELUM LULUS'}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-stone-500 font-medium">
                                {res.testDate}
                              </td>
                              <td className="py-3 px-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => {
                                      setCurrentResult(res);
                                      setView('report');
                                    }}
                                    className="py-1.5 px-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-lg transition"
                                  >
                                    Rapor
                                  </button>
                                  <button
                                    onClick={() => {
                                      setCurrentResult(res);
                                      setView('review');
                                    }}
                                    className="py-1.5 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-2xs transition flex items-center gap-1 cursor-pointer"
                                  >
                                    <BookOpen className="w-3 h-3" />
                                    <span>Pembahasan</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="text-[10px] text-stone-400 text-center py-1 sm:hidden flex items-center justify-center gap-1.5">
                    <ArrowLeftRight className="w-3 h-3 text-stone-400 shrink-0" />
                    <span>Geser tabel ke samping untuk melihat detail riwayat</span>
                  </div>
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

      {/* Prometric Pre-Exam Simulation Confirmation Modal */}
      {preExamModalOpen && currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150 overflow-y-auto">
          <div className="max-w-xl w-full bg-white border border-stone-200 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-4 my-8">
            {/* Header Logos & Prometric Tag */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></span>
                <span className="text-[10px] sm:text-xs font-black uppercase text-indigo-700 tracking-wider">
                  PROMETRIC CBT ENGINE
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreExamModalOpen(false)}
                className="p-1 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Title */}
            <div className="text-center space-y-1">
              <h2 className="text-xl font-black text-stone-900 font-japanese">
                国際交流基金日本語基礎テスト (JFT-Basic)
              </h2>
              <div className="text-xs font-bold text-indigo-900 font-japanese">
                受験前確認 • Konfirmasi Memulai Ujian CBT
              </div>
              <p className="text-[11px] text-stone-500">
                Silakan verifikasi data peserta dan pahami tata tertib ujian sebelum memulai.
              </p>
            </div>

            {/* Examinee Identity Card */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col xs:flex-row items-center xs:items-start text-center xs:text-left gap-3.5 sm:gap-4">
              <img
                src={
                  currentUser.facePhotoUrl && !currentUser.facePhotoUrl.includes('unsplash.com')
                    ? currentUser.facePhotoUrl
                    : DEFAULT_ANONYMOUS_PHOTO
                }
                alt={currentUser.name}
                className="w-16 h-20 sm:w-20 sm:h-24 object-cover rounded-xl border border-stone-300 bg-white shrink-0"
              />
              <div className="space-y-1 text-xs text-stone-800 flex-1 min-w-0 w-full">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <span className="text-[10px] font-bold text-stone-400 uppercase">
                    受験番号 (Reg No)
                  </span>
                  <span className="font-mono font-bold text-indigo-900 text-xs bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                    {currentUser.registrationNumber || 'JFT-2026-88912'}
                  </span>
                </div>
                <div className="font-black text-stone-950 text-sm truncate uppercase">
                  {currentUser.name}
                </div>
                <div className="text-[11px] text-stone-500">
                  {currentUser.nationality} • {currentUser.sex === 'FEMALE' ? 'Female' : 'Male'}
                </div>
                <div className="pt-1 flex items-center justify-center xs:justify-start gap-2 text-[11px] font-semibold text-emerald-800 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 border border-emerald-300">
                    Paket #{pendingExamPackageId}:{' '}
                    {examSets.find((s) => s.id === pendingExamPackageId)?.name || 'Simulasi JFT'}
                  </span>
                  <span className="text-stone-400">•</span>
                  <span className="text-stone-600 font-mono">60 Menit</span>
                </div>
              </div>
            </div>

            {/* Test Structure 4 Sections */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-black uppercase text-stone-600 tracking-wider">
                Struktur 4 Seksi Ujian (Urutan Wajib)
              </span>
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-xl bg-rose-50/80 border border-rose-200 flex items-center justify-between">
                  <span className="font-japanese font-bold text-rose-900">S1: 文字と語彙</span>
                  <span className="text-rose-700 font-mono text-[10px]">12 Soal</span>
                </div>
                <div className="p-2 rounded-xl bg-amber-50/80 border border-amber-200 flex items-center justify-between">
                  <span className="font-japanese font-bold text-amber-900">S2: 会話と表現</span>
                  <span className="text-amber-700 font-mono text-[10px]">12 Soal</span>
                </div>
                <div className="p-2 rounded-xl bg-sky-50/80 border border-sky-200 flex items-center justify-between">
                  <span className="font-japanese font-bold text-sky-900">S3: 聴解 (Audio)</span>
                  <span className="text-sky-700 font-mono text-[10px]">13 Soal</span>
                </div>
                <div className="p-2 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between">
                  <span className="font-japanese font-bold text-emerald-900">S4: 読解 (Bacaan)</span>
                  <span className="text-emerald-700 font-mono text-[10px]">13 Soal</span>
                </div>
              </div>
            </div>

            {/* Prometric Official Warning & Locking Notice */}
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl space-y-2 text-xs text-amber-950">
              <div className="font-black flex items-center gap-1.5 text-amber-900">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Tata Tertib & Peraturan CBT Prometric:</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-amber-900 leading-relaxed list-disc list-inside">
                <li>
                  <strong>Sistem Penguncian Seksi (Locking):</strong> Ujian dikerjakan secara berurutan mulai dari Seksi 1 (Moji to Goi). Anda <strong>tidak dapat melompat</strong> ke seksi lain tanpa menyelesaikan seksi aktif.
                </li>
                <li>
                  <strong>Kunci Permanen:</strong> Begitu Anda mengonfirmasi penyelesaian suatu seksi, seksi tersebut akan <strong>dikunci permanen</strong> dan Anda tidak dapat kembali untuk mengubah jawaban.
                </li>
                <li>
                  <strong>Waktu Berjalan:</strong> Timer 60 menit akan langsung dihitung mundur dan tidak dapat dihentikan (pause).
                </li>
                <li>
                  <strong>Perangkat Suara:</strong> Pastikan audio/headset telah menyala untuk pengerjaan Seksi 3 (Chōkai).
                </li>
              </ul>
            </div>

            {/* Agreement Checkbox */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-800 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={preExamAgreement}
                onChange={(e) => setPreExamAgreement(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-stone-300 focus:ring-indigo-500"
              />
              <span className="text-[11px] leading-relaxed">
                Saya menyatakan data diri saya telah benar dan saya telah membaca serta memahami seluruh tata tertib ujian di atas. Saya siap memulai ujian CBT JFT-Basic.
              </span>
            </label>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setPreExamModalOpen(false)}
                className="py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition cursor-pointer text-center order-2 sm:order-1"
              >
                Batal / Kembali
              </button>
              <button
                type="button"
                disabled={!preExamAgreement}
                onClick={handleConfirmStartExam}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-indigo-600 via-rose-600 to-amber-500 hover:from-indigo-700 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer order-1 sm:order-2"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Mulai Ujian Sekarang (試験を開始する)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {logoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="max-w-md w-full bg-white border border-stone-200/90 rounded-3xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-red-600 mx-auto flex items-center justify-center shadow-xs">
              <LogOut className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-stone-900">Konfirmasi Keluar Akun</h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Apakah Anda yakin ingin keluar dari akun <strong className="text-stone-800">{currentUser?.name}</strong>? Sesi login aktif pada perangkat ini akan diakhiri.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setLogoutModalOpen(false)}
                className="flex-1 py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  setLogoutModalOpen(false);
                  await handleLogout();
                }}
                className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow-md shadow-red-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Ya, Keluar Akun</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mini Tryout Experience for Logged-In User */}
      {miniTryoutOpen && (
        <MiniTryoutExperience
          currentUser={currentUser}
          onOpenFullPackagePayment={() => {
            setMiniTryoutOpen(false);
            setPaymentModalOpen(true);
          }}
          onClose={() => setMiniTryoutOpen(false)}
        />
      )}
    </div>
  );
}
