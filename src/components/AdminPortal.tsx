'use client';

import React, { useState } from 'react';
import { User, Question, Transaction, PDFQuestionDraft, SectionType } from '../types';
import { Users, FileText, Lock, Upload, Layers, DollarSign, BookOpen, X, ChevronLeft, ChevronRight, RefreshCw, Trash2, Shield } from 'lucide-react';
import { isSubscriptionActive, getRemainingDays, getRemainingSubscriptionText } from '../lib/dataStore';

interface AdminPortalProps {
  users: User[];
  questions: Question[];
  transactions: Transaction[];
  pdfDrafts: PDFQuestionDraft[];
  onKickSession: (userId: string) => Promise<void> | void;
  onAddCredit: (userId: string, count: number) => Promise<void> | void;
  onChangeRole?: (userId: string, newRole: 'user' | 'admin') => Promise<void> | void;
  onDeleteUser?: (userId: string) => Promise<void> | void;
  onRefreshData?: () => Promise<void> | void;
  onImportPdfText: (pdfText: string) => Promise<void>;
  onSaveQuestion?: (question: Question) => void;
  onDeleteQuestion?: (questionId: number) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  users,
  questions,
  transactions,
  onKickSession,
  onAddCredit,
  onChangeRole,
  onDeleteUser,
  onRefreshData,
  onImportPdfText,
  onSaveQuestion,
  onDeleteQuestion
}) => {
  const [activeTab, setActiveTab] = useState<'USERS' | 'QUESTIONS' | 'PDF_PARSER' | 'TRANSACTIONS'>('USERS');
  const [pdfInputText, setPdfInputText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseMessage, setParseMessage] = useState('');
  const [actionLoadingUserId, setActionLoadingUserId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Question Bank Editor Filters, Paging & Modal State
  const [selectedPkgFilter, setSelectedPkgFilter] = useState<number>(0); // 0 = Semua Paket
  const [selectedSecFilter, setSelectedSecFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Sample PDF demo text generator
  const fillSamplePdfText = () => {
    setPdfInputText(`[S1] Soal 1
【本】の ひらがな は どれ ですか。
A) ほん
B) はん
C) き
D) みず
Kunci: A
Pembahasan: Kanji 本 dibaca ほん (hon) berarti buku.

[S2] Soal 2
A: 「いっしょに お茶 を （ ）か。」
B: 「ええ、いいですね。」
A) のみません
B) のんで
C) のむ
D) のみます
Kunci: A
Pembahasan: Form masen ka digunakan untuk mengajak.

[S3] Soal 3 (Chokai)
男の人 と 女の人 が 話して います。男の人 は 何時 に 会いますか。
A) 10:00
B) 10:30
C) 11:00
D) 11:30
Kunci: B
Pembahasan: Laki-laki mengusulkan 10:30.`);
  };

  const handleRunPdfParse = async () => {
    if (!pdfInputText.trim()) return;
    setIsParsing(true);
    setParseMessage('');
    try {
      await onImportPdfText(pdfInputText);
      setParseMessage('Berhasil mengimpor draf soal dari teks PDF!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setParseMessage('Gagal mengurai PDF: ' + msg);
    } finally {
      setIsParsing(false);
    }
  };

  const handleOpenEdit = (q: Question) => {
    setEditingQuestion({ ...q, options: q.options.map(o => ({ ...o })) });
    setIsEditModalOpen(true);
  };

  const handleOpenAdd = () => {
    const nextId = questions.length > 0 ? Math.max(...questions.map((q) => q.id)) + 1 : 1;
    const targetPkg = selectedPkgFilter > 0 ? selectedPkgFilter : 1;
    setEditingQuestion({
      id: nextId,
      packageId: targetPkg,
      section: 'S1',
      sectionTitle: 'Seksi 1 - 文字と語彙 (Huruf & Kosakata)',
      number: 1,
      questionText: '',
      options: [
        { key: 'A', text: '' },
        { key: 'B', text: '' },
        { key: 'C', text: '' },
        { key: 'D', text: '' }
      ],
      correctAnswer: 'A',
      explanation: ''
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEditModal = () => {
    if (!editingQuestion || !onSaveQuestion) return;
    if (!editingQuestion.questionText.trim()) {
      alert('Teks pertanyaan tidak boleh kosong!');
      return;
    }
    onSaveQuestion(editingQuestion);
    setIsEditModalOpen(false);
    setEditingQuestion(null);
  };

  // Filter questions list
  const filteredQuestions = questions.filter((q) => {
    const pkg = q.packageId || 1;
    if (selectedPkgFilter > 0 && pkg !== selectedPkgFilter) return false;
    if (selectedSecFilter !== 'ALL' && q.section !== selectedSecFilter) return false;
    if (searchQuery.trim()) {
      const qText = (q.questionText + ' ' + q.explanation).toLowerCase();
      if (!qText.includes(searchQuery.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Admin Header */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 rounded-full bg-indigo-950 border border-indigo-700 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            Superadmin Control Panel
          </span>
          <h1 className="text-2xl font-black tracking-tight mt-1">Portal Administrator KondangSensei</h1>
          <p className="text-xs text-slate-400">Kelola Bank Soal 50 Soal, Sesi Single Lock, Transaksi & Parser PDF</p>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('USERS')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'USERS' ? 'bg-indigo-600 text-white shadow font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            Peserta & Sesi ({users.length})
          </button>

          <button
            onClick={() => setActiveTab('QUESTIONS')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'QUESTIONS' ? 'bg-indigo-600 text-white shadow font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            Bank Soal ({questions.length})
          </button>

          <button
            onClick={() => setActiveTab('PDF_PARSER')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'PDF_PARSER' ? 'bg-indigo-600 text-white shadow font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4 text-amber-400" />
            Parser PDF Importer
          </button>

          <button
            onClick={() => setActiveTab('TRANSACTIONS')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'TRANSACTIONS' ? 'bg-indigo-600 text-white shadow font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <DollarSign className="w-4 h-4 text-emerald-400" />
            Transaksi ({transactions.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Users & Single Session Lock Manager */}
      {activeTab === 'USERS' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex flex-wrap items-center justify-between border-b pb-4 border-slate-200 dark:border-slate-800 gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-indigo-500" />
                Manajemen Pengguna & Sesi Tunggal ({users.length} Akun Terdaftar)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Data terhubung langsung ke Database MySQL. Setiap akun memiliki proteksi 1 sesi aktif (Single Device Lock).
              </p>
            </div>

            {onRefreshData && (
              <button
                type="button"
                onClick={async () => {
                  setIsRefreshing(true);
                  try {
                    await onRefreshData();
                  } finally {
                    setIsRefreshing(false);
                  }
                }}
                disabled={isRefreshing}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-500' : ''}`} />
                {isRefreshing ? 'Memuat Ulang...' : 'Sinkronkan Data'}
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">
                  <th className="p-3">Nama & No. Reg</th>
                  <th className="p-3">Email Akun</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status Sesi Aktif</th>
                  <th className="p-3">Masa Aktif Akses</th>
                  <th className="p-3 text-right">Kelola Akun</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      Belum ada data pengguna terdaftar di database.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const hasActiveSession = !!u.activeSessionId;
                    const isBusy = actionLoadingUserId === u.id;

                    return (
                      <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="p-3 font-semibold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            {u.facePhotoUrl ? (
                              <img src={u.facePhotoUrl} alt={u.name} className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-[10px]">
                                {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                              </div>
                            )}
                            <div>
                              <div>{u.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{u.registrationNumber || u.id}</div>
                            </div>
                          </div>
                        </td>

                        <td className="p-3 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                          {u.email}
                        </td>

                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                                u.role === 'admin'
                                  ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {u.role}
                            </span>
                            {onChangeRole && (
                              <button
                                type="button"
                                title={`Ganti role menjadi ${u.role === 'admin' ? 'user' : 'admin'}`}
                                onClick={async () => {
                                  if (confirm(`Ubah role ${u.name} menjadi ${u.role === 'admin' ? 'user biasa' : 'superadmin'}?`)) {
                                    setActionLoadingUserId(u.id);
                                    try {
                                      await onChangeRole(u.id, u.role === 'admin' ? 'user' : 'admin');
                                    } finally {
                                      setActionLoadingUserId(null);
                                    }
                                  }
                                }}
                                disabled={isBusy}
                                className="text-slate-400 hover:text-indigo-600 p-0.5 transition"
                              >
                                <Shield className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>

                        <td className="p-3">
                          {hasActiveSession ? (
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-mono text-[11px] font-bold border border-emerald-300 dark:border-emerald-800 flex items-center gap-1.5 w-max">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                              Terkunci (1 Sesi)
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Offline</span>
                          )}
                        </td>

                        <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                          {isSubscriptionActive(u) ? (
                            <span className="text-emerald-600 dark:text-emerald-400">
                              {getRemainingSubscriptionText(u)}
                            </span>
                          ) : (
                            <span className="text-red-500 font-semibold text-[11px]">Kedaluwarsa</span>
                          )}
                        </td>

                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {hasActiveSession && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={async () => {
                                  setActionLoadingUserId(u.id);
                                  try {
                                    await onKickSession(u.id);
                                  } finally {
                                    setActionLoadingUserId(null);
                                  }
                                }}
                                className="py-1 px-2.5 bg-red-100 hover:bg-red-200 dark:bg-red-950 dark:hover:bg-red-900 text-red-700 dark:text-red-300 rounded-lg font-semibold text-[11px] transition disabled:opacity-50"
                              >
                                {isBusy ? '...' : 'Kick Sesi'}
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={async () => {
                                setActionLoadingUserId(u.id);
                                try {
                                  await onAddCredit(u.id, 7);
                                } finally {
                                  setActionLoadingUserId(null);
                                }
                              }}
                              className="py-1 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-[11px] transition shadow disabled:opacity-50"
                            >
                              +7 Hari
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={async () => {
                                setActionLoadingUserId(u.id);
                                try {
                                  await onAddCredit(u.id, 30);
                                } finally {
                                  setActionLoadingUserId(null);
                                }
                              }}
                              className="py-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold text-[11px] transition border border-slate-700 disabled:opacity-50"
                            >
                              +30 Hari
                            </button>
                            {onDeleteUser && (
                              <button
                                type="button"
                                title="Hapus pengguna ini dari database"
                                disabled={isBusy}
                                onClick={async () => {
                                  if (confirm(`Yakin ingin menghapus peserta ${u.name} (${u.email}) secara permanen dari database?`)) {
                                    setActionLoadingUserId(u.id);
                                    try {
                                      await onDeleteUser(u.id);
                                    } finally {
                                      setActionLoadingUserId(null);
                                    }
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 disabled:opacity-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Questions Bank */}
      {activeTab === 'QUESTIONS' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4 border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Bank Soal JFT-Basic ({questions.length} Total Soal Dikelola)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Edit teks soal, opsi A-D, kunci jawaban, seksi (S1-S4), dan alokasi Paket (Paket 1, 2, 3, 4)
              </p>
            </div>

            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
            >
              + Tambah Soal Baru
            </button>
          </div>

          {/* Filters: Paket & Seksi */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-700 dark:text-slate-300">Filter Paket:</span>
              {[0, 1, 2, 3, 4].map((pkgNum) => (
                <button
                  key={pkgNum}
                  onClick={() => setSelectedPkgFilter(pkgNum)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition ${
                    selectedPkgFilter === pkgNum
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {pkgNum === 0 ? 'Semua Paket' : `Paket #${pkgNum}`}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-700 dark:text-slate-300">Filter Seksi:</span>
              {['ALL', 'S1', 'S2', 'S3', 'S4'].map((sec) => (
                <button
                  key={sec}
                  onClick={() => setSelectedSecFilter(sec)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition ${
                    selectedSecFilter === sec
                      ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 shadow'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {sec === 'ALL' ? 'Semua Seksi' : sec}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-semibold">Tampilkan:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={5}>5 Soal</option>
                  <option value={10}>10 Soal</option>
                  <option value={20}>20 Soal</option>
                  <option value={50}>50 Soal</option>
                  <option value={100}>100 Soal</option>
                </select>
              </div>

              <div className="w-full sm:w-64">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Cari kata kunci soal..."
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Question List */}
          <div className="grid grid-cols-1 gap-4">
            {filteredQuestions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
                Tidak ada soal yang cocok dengan filter.
              </div>
            ) : (
              (() => {
                const totalPages = Math.ceil(filteredQuestions.length / pageSize) || 1;
                const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
                const startIndex = (safeCurrentPage - 1) * pageSize;
                const pageQuestions = filteredQuestions.slice(startIndex, startIndex + pageSize);

                return (
                  <>
                    {pageQuestions.map((q) => (
                      <div
                        key={q.id}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3 text-xs"
                      >
                        <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                              Paket #{q.packageId || 1} • Soal #{q.number} ({q.section})
                            </span>
                            <span className="text-slate-500 text-[11px] font-normal">{q.sectionTitle}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                              Kunci: {q.correctAnswer}
                            </span>
                            <button
                              onClick={() => handleOpenEdit(q)}
                              className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg transition"
                            >
                              Edit Soal
                            </button>
                            {onDeleteQuestion && (
                              <button
                                onClick={() => {
                                  if (confirm(`Hapus soal #${q.number} dari Paket #${q.packageId || 1}?`)) {
                                    onDeleteQuestion(q.id);
                                  }
                                }}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition"
                              >
                                Hapus
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="font-semibold text-slate-900 dark:text-white font-japanese text-sm bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                          {q.questionText}
                        </p>

                        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-700 dark:text-slate-300">
                          {q.options.map((opt) => (
                            <div
                              key={opt.key}
                              className={`p-2 rounded-lg border ${
                                opt.key === q.correctAnswer
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 font-bold text-emerald-800 dark:text-emerald-300'
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                              }`}
                            >
                              {opt.key}) {opt.text}
                            </div>
                          ))}
                        </div>

                        <p className="text-[11px] text-slate-500 italic bg-slate-100 dark:bg-slate-900/60 p-2.5 rounded-lg flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
                          <span>Pembahasan: {q.explanation}</span>
                        </p>
                      </div>
                    ))}

                    {/* Pagination Bar */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="text-slate-500 dark:text-slate-400">
                        Menampilkan <span className="font-bold text-slate-900 dark:text-white">{startIndex + 1}</span> -{' '}
                        <span className="font-bold text-slate-900 dark:text-white">
                          {Math.min(startIndex + pageSize, filteredQuestions.length)}
                        </span>{' '}
                        dari <span className="font-bold text-indigo-600 dark:text-indigo-400">{filteredQuestions.length}</span> soal
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={safeCurrentPage <= 1}
                          className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                          title="Halaman Sebelumnya"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>

                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(
                              (p) =>
                                p === 1 ||
                                p === totalPages ||
                                Math.abs(p - safeCurrentPage) <= 1
                            )
                            .map((p, idx, arr) => {
                              const prevPage = arr[idx - 1];
                              const showEllipsis = prevPage && p - prevPage > 1;

                              return (
                                <React.Fragment key={p}>
                                  {showEllipsis && (
                                    <span className="px-2 text-slate-400">...</span>
                                  )}
                                  <button
                                    onClick={() => setCurrentPage(p)}
                                    className={`w-8 h-8 rounded-xl font-bold transition text-xs ${
                                      safeCurrentPage === p
                                        ? 'bg-indigo-600 text-white shadow'
                                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                    }`}
                                  >
                                    {p}
                                  </button>
                                </React.Fragment>
                              );
                            })}
                        </div>

                        <button
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={safeCurrentPage >= totalPages}
                          className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                          title="Halaman Selanjutnya"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </>
                );
              })()
            )}
          </div>
        </div>
      )}

      {/* Tab 3: PDF Question Parser */}
      {activeTab === 'PDF_PARSER' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="border-b pb-4 border-slate-200 dark:border-slate-800 space-y-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-500" />
              Sistem Impor & Parser PDF Cerdas
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Admin dapat menempelkan teks hasil ekstraksi berkas PDF soal JFT. Parser akan otomatis memisahkan seksi, pertanyaan, opsi jawaban A-D, kunci, dan pembahasan.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Teks PDF Ujian JFT-Basic:
              </label>
              <button
                onClick={fillSamplePdfText}
                className="text-indigo-600 dark:text-indigo-400 hover:underline text-xs font-semibold"
              >
                + Isi Contoh Format Teks PDF Demo
              </button>
            </div>

            <textarea
              rows={8}
              value={pdfInputText}
              onChange={(e) => setPdfInputText(e.target.value)}
              placeholder="Tempel teks PDF soal di sini (misal: [S1] Soal 1... A) ほん B) はん... Kunci: A...)"
              className="w-full p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            ></textarea>

            {parseMessage && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-semibold">
                {parseMessage}
              </div>
            )}

            <button
              onClick={handleRunPdfParse}
              disabled={isParsing || !pdfInputText.trim()}
              className="py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-2 disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              {isParsing ? 'Mengurai Teks PDF...' : 'Ekstrak & Simpan Draf Soal ke Bank Soal'}
            </button>
          </div>
        </div>
      )}

      {/* Tab 4: Transactions */}
      {activeTab === 'TRANSACTIONS' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex flex-wrap items-center justify-between border-b pb-4 border-slate-200 dark:border-slate-800 gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Riwayat Pembayaran & Transaksi Paket ({transactions.length} Total Transaksi)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Data transaksi pembayaran real-time dari database MySQL & DOKU Payment Gateway
              </p>
            </div>

            {onRefreshData && (
              <button
                type="button"
                onClick={async () => {
                  setIsRefreshing(true);
                  try {
                    await onRefreshData();
                  } finally {
                    setIsRefreshing(false);
                  }
                }}
                disabled={isRefreshing}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-500' : ''}`} />
                {isRefreshing ? 'Memuat Ulang...' : 'Sinkronkan Transaksi'}
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-3">ID Transaksi</th>
                  <th className="p-3">Waktu</th>
                  <th className="p-3">Peserta</th>
                  <th className="p-3">Paket</th>
                  <th className="p-3">Nominal</th>
                  <th className="p-3">Metode Bayar</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      Belum ada transaksi di database.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="p-3 font-mono text-[11px] text-slate-500">{tx.id}</td>
                      <td className="p-3 text-[11px] text-slate-400">
                        {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">{tx.userName}</td>
                      <td className="p-3 text-slate-700 dark:text-slate-300">{tx.packageName}</td>
                      <td className="p-3 font-bold text-indigo-600 dark:text-indigo-400">
                        Rp {tx.amount.toLocaleString('id-ID')}
                      </td>
                      <td className="p-3 text-slate-500">{tx.paymentMethod}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          tx.status === 'PAID'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : tx.status === 'PENDING'
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                            : 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* QUESTION EDIT MODAL OVERLAY */}
      {isEditModalOpen && editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 max-w-2xl w-full rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 my-8">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Editor Soal JFT (ID #{editingQuestion.id})
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Pilih Paket:</label>
                <select
                  value={editingQuestion.packageId || 1}
                  onChange={(e) =>
                    setEditingQuestion({ ...editingQuestion, packageId: Number(e.target.value) })
                  }
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 font-bold"
                >
                  <option value={1}>Paket #1 (Simulasi Utama)</option>
                  <option value={2}>Paket #2 (Intensif)</option>
                  <option value={3}>Paket #3 (Master Chokai)</option>
                  <option value={4}>Paket #4 (Tryout Spesial)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Seksi Ujian:</label>
                <select
                  value={editingQuestion.section}
                  onChange={(e) => {
                    const sec = e.target.value as SectionType;
                    const secTitles: Record<SectionType, string> = {
                      S1: 'Seksi 1 - 文字と語彙 (Huruf & Kosakata)',
                      S2: 'Seksi 2 - 会話表現 (Percakapan & Ekspresi)',
                      S3: 'Seksi 3 - 聴解 (Pendengaran)',
                      S4: 'Seksi 4 - 読解 (Pemahaman Bacaan)'
                    };
                    setEditingQuestion({
                      ...editingQuestion,
                      section: sec,
                      sectionTitle: secTitles[sec] || sec
                    });
                  }}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 font-bold"
                >
                  <option value="S1">S1 (Moji Goi)</option>
                  <option value="S2">S2 (Kaiwa)</option>
                  <option value="S3">S3 (Chokai)</option>
                  <option value="S4">S4 (Dokkai)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Nomor Soal:</label>
                <input
                  type="number"
                  value={editingQuestion.number}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, number: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 font-bold"
                />
              </div>
            </div>

            <div className="text-xs space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Teks Pertanyaan:</label>
              <textarea
                rows={3}
                value={editingQuestion.questionText}
                onChange={(e) => setEditingQuestion({ ...editingQuestion, questionText: e.target.value })}
                className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 font-japanese text-xs"
              ></textarea>
            </div>

            {/* Options A-D */}
            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-700 dark:text-slate-300">Opsi Jawaban A, B, C, D:</label>
              <div className="grid grid-cols-2 gap-2">
                {editingQuestion.options.map((opt, idx) => (
                  <div key={opt.key} className="flex items-center gap-2">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 w-4">{opt.key})</span>
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => {
                        const newOpts = [...editingQuestion.options];
                        newOpts[idx].text = e.target.value;
                        setEditingQuestion({ ...editingQuestion, options: newOpts });
                      }}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Kunci Jawaban Benar:</label>
                <select
                  value={editingQuestion.correctAnswer}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, correctAnswer: e.target.value as 'A' | 'B' | 'C' | 'D' })}
                  className="w-full p-2.5 bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 rounded-xl text-emerald-900 dark:text-emerald-300 font-bold"
                >
                  <option value="A">Opsi A</option>
                  <option value="B">Opsi B</option>
                  <option value="C">Opsi C</option>
                  <option value="D">Opsi D</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">URL Audio (Opsional S3 Chōkai MP3/OGG):</label>
                <input
                  type="text"
                  value={editingQuestion.audioUrl || ''}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, audioUrl: e.target.value })}
                  placeholder="https://www.irodori.jpf.go.jp/assets/data/...mp3"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs"
                />
                {editingQuestion.audioUrl && (
                  <div className="mt-2 p-2 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] text-slate-500 font-semibold mb-1">Preview Suara:</p>
                    <audio key={editingQuestion.audioUrl} controls className="w-full h-8" src={editingQuestion.audioUrl}>
                      <source src={editingQuestion.audioUrl} type={editingQuestion.audioUrl.endsWith('.ogg') ? 'audio/ogg' : 'audio/mpeg'} />
                    </audio>
                  </div>
                )}
              </div>
            </div>

            <div className="text-xs space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Penjelasan & Pembahasan (Insight):</label>
              <textarea
                rows={2}
                value={editingQuestion.explanation}
                onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs"
              ></textarea>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveEditModal}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition shadow-lg"
              >
                Simpan Perubahan Soal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
