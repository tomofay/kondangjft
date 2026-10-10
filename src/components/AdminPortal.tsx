'use client';

import React, { useState } from 'react';
import { User, Question, Transaction, PDFQuestionDraft } from '../types';
import { Users, FileText, Plus, Edit, Trash2, ShieldAlert, CheckCircle2, Lock, Upload, Search, RefreshCw, Key, Layers, DollarSign } from 'lucide-react';

interface AdminPortalProps {
  users: User[];
  questions: Question[];
  transactions: Transaction[];
  pdfDrafts: PDFQuestionDraft[];
  onKickSession: (userId: string) => void;
  onAddCredit: (userId: string, count: number) => void;
  onImportPdfText: (pdfText: string) => Promise<void>;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  users,
  questions,
  transactions,
  pdfDrafts,
  onKickSession,
  onAddCredit,
  onImportPdfText
}) => {
  const [activeTab, setActiveTab] = useState<'USERS' | 'QUESTIONS' | 'PDF_PARSER' | 'TRANSACTIONS'>('USERS');
  const [pdfInputText, setPdfInputText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseMessage, setParseMessage] = useState('');

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
    } catch (err: any) {
      setParseMessage('Gagal mengurai PDF: ' + err.message);
    } finally {
      setIsParsing(false);
    }
  };

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
          <div className="flex items-center justify-between border-b pb-4 border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-indigo-500" />
                Manajemen Sesi Tunggal & Peserta
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Setiap akun hanya diizinkan 1 sesi aktif bersamaan. Anda dapat memantau atau mengakhiri sesi aktif di sini.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">
                  <th className="p-3">Nama & Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status Sesi Aktif (Single Lock)</th>
                  <th className="p-3">Sisa Tryout</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => {
                  const hasActiveSession = !!u.activeSessionId;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">
                        <div>{u.name}</div>
                        <div className="text-[11px] text-slate-400 font-normal">{u.email}</div>
                      </td>

                      <td className="p-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                            u.role === 'admin'
                              ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>

                      <td className="p-3">
                        {hasActiveSession ? (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-mono text-[11px] font-bold border border-emerald-300 dark:border-emerald-800 flex items-center gap-1.5 w-max">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                            Terunci (1 Device Active)
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Tidak Ada Sesi Aktif</span>
                        )}
                      </td>

                      <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                        {u.credits} Sesi
                      </td>

                      <td className="p-3 text-right space-x-2">
                        {hasActiveSession && (
                          <button
                            onClick={() => onKickSession(u.id)}
                            className="py-1 px-3 bg-red-100 hover:bg-red-200 dark:bg-red-950 dark:hover:bg-red-900 text-red-700 dark:text-red-300 rounded-xl font-semibold text-[11px] transition"
                          >
                            Kick Sesi Aktif
                          </button>
                        )}
                        <button
                          onClick={() => onAddCredit(u.id, 1)}
                          className="py-1 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-[11px] transition shadow"
                        >
                          +1 Sesi Tryout
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Questions Bank */}
      {activeTab === 'QUESTIONS' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b pb-4 border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Bank Soal JFT-Basic (Total 50 Soal Standard)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Terbagi atas Seksi S1 (Moji Goi), S2 (Kaiwa), S3 (Chokai Listening), S4 (Dokkai Reading)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {questions.slice(0, 15).map((q) => (
              <div
                key={q.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                  <span className="px-2.5 py-1 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    Soal #{q.number} ({q.section})
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400">Kunci: {q.correctAnswer}</span>
                </div>
                <p className="font-semibold font-japanese text-slate-800 dark:text-slate-200">{q.questionText}</p>
                <p className="text-[11px] text-slate-500 italic">Pembahasan: {q.explanation}</p>
              </div>
            ))}
            {questions.length > 15 && (
              <p className="text-center text-xs text-slate-400 py-2">
                ...dan {questions.length - 15} soal JFT-Basic lainnya aktif dalam database.
              </p>
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
          <div className="border-b pb-4 border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Riwayat Pembayaran & Transaksi Paket
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-3">ID Transaksi</th>
                  <th className="p-3">Peserta</th>
                  <th className="p-3">Paket</th>
                  <th className="p-3">Nominal</th>
                  <th className="p-3">Metode Bayar</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="p-3 font-mono text-[11px] text-slate-500">{tx.id}</td>
                    <td className="p-3 font-semibold text-slate-900 dark:text-white">{tx.userName}</td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">{tx.packageName}</td>
                    <td className="p-3 font-bold text-indigo-600 dark:text-indigo-400">
                      Rp {tx.amount.toLocaleString('id-ID')}
                    </td>
                    <td className="p-3 text-slate-500">{tx.paymentMethod}</td>
                    <td className="p-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
