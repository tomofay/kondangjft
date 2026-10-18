'use client';

import React, { useState, useEffect } from 'react';
import { Transaction } from '../types';
import { Clock, CreditCard, Copy, CheckCircle2, AlertCircle, X, ExternalLink, RefreshCw, AlertTriangle } from 'lucide-react';

interface PendingPaymentsModalProps {
  isOpen: boolean;
  pendingTransactions: Transaction[];
  onClose: () => void;
  onRefresh: () => void;
  onPaymentSuccess: (packageId: string, paymentMethod: string) => void;
}

export const PendingPaymentsModal: React.FC<PendingPaymentsModalProps> = ({
  isOpen,
  pendingTransactions,
  onClose,
  onRefresh,
  onPaymentSuccess
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [checkingInvoice, setCheckingInvoice] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ [invoice: string]: string }>({});
  const [nowTime, setNowTime] = useState<number>(Date.now());

  // Update ticker every second for accurate countdown
  useEffect(() => {
    if (!isOpen) return;
    setNowTime(Date.now());
    const interval = setInterval(() => {
      setNowTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCheckStatus = async (tx: Transaction) => {
    setCheckingInvoice(tx.id);
    setStatusMessage((prev) => ({ ...prev, [tx.id]: '' }));

    try {
      const res = await fetch(`/api/payments/status?invoiceNumber=${encodeURIComponent(tx.id)}`);
      const data = await res.json();

      if (data.success && data.isPaid) {
        setStatusMessage((prev) => ({ ...prev, [tx.id]: 'Pembayaran BERHASIL terkonfirmasi!' }));
        onPaymentSuccess(tx.packageId, tx.paymentMethod);
        setTimeout(() => {
          onRefresh();
        }, 1500);
      } else {
        setStatusMessage((prev) => ({
          ...prev,
          [tx.id]: 'Belum ada pembayaran masuk dari bank/kasir. Silakan selesaikan transfer.'
        }));
      }
    } catch {
      setStatusMessage((prev) => ({
        ...prev,
        [tx.id]: 'Gagal mengecek status pembayaran. Silakan coba lagi.'
      }));
    } finally {
      setCheckingInvoice(null);
    }
  };

  // Calculate remaining time within the 1-hour window
  const getRemainingTime = (tx: Transaction) => {
    let expiryTimestamp: number = NaN;

    if (tx.expiredAt) {
      if (/^\d{14}$/.test(tx.expiredAt)) {
        const y = tx.expiredAt.substring(0, 4);
        const m = tx.expiredAt.substring(4, 6);
        const d = tx.expiredAt.substring(6, 8);
        const h = tx.expiredAt.substring(8, 10);
        const min = tx.expiredAt.substring(10, 12);
        const s = tx.expiredAt.substring(12, 14);
        const parsed = new Date(`${y}-${m}-${d}T${h}:${min}:${s}+07:00`).getTime();
        if (!isNaN(parsed)) expiryTimestamp = parsed;
      } else {
        const parsed = new Date(tx.expiredAt).getTime();
        if (!isNaN(parsed)) expiryTimestamp = parsed;
      }
    }

    if (isNaN(expiryTimestamp)) {
      const created = new Date(tx.createdAt).getTime();
      expiryTimestamp = !isNaN(created) ? created + 60 * 60 * 1000 : Date.now();
    }

    const diffMs = expiryTimestamp - nowTime;

    if (diffMs <= 0) {
      return { isExpired: true, text: 'Waktu Pembayaran Habis (Dibatalkan)' };
    }

    const minutes = Math.floor(diffMs / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);
    return {
      isExpired: false,
      text: `${minutes}m ${seconds < 10 ? '0' : ''}${seconds}d`,
      diffMs
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="max-w-2xl w-full bg-slate-900 text-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="p-3.5 sm:p-5 md:p-6 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base md:text-lg font-bold text-white leading-tight">Tagihan Pending</h2>
              <p className="text-[10px] sm:text-xs text-slate-400">Batas pembayaran 1 jam dari pemesanan</p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={onRefresh}
              title="Segarkan data"
              className="p-1.5 sm:p-2 text-slate-400 hover:text-white rounded-lg transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-1.5 sm:p-2 text-slate-400 hover:text-white rounded-lg transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-3.5 sm:p-5 md:p-6 overflow-y-auto space-y-3.5 sm:space-y-4">
          {pendingTransactions.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <p className="text-sm font-bold text-slate-200">Tidak Ada Tagihan Aktif</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Semua invoice telah selesai atau otomatis dibatalkan karena melewati batas 1 jam. Silakan pilih paket untuk melakukan pemesanan baru.
              </p>
            </div>
          ) : (
            pendingTransactions.map((tx) => {
              const codeMatch = tx.paymentMethod.match(/-\s*([0-9A-Za-z]+)$/);
              const paymentCode = tx.paymentCode || (codeMatch ? codeMatch[1] : null);
              const remaining = getRemainingTime(tx);

              return (
                <div
                  key={tx.id}
                  className={`p-5 rounded-2xl bg-slate-950 border transition space-y-4 ${
                    remaining.isExpired
                      ? 'border-red-900/50 opacity-75'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div>
                      <span className="font-extrabold text-sm text-white">{tx.packageName}</span>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="font-mono">{tx.id}</span>
                        <span>•</span>
                        <span>{new Date(tx.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {remaining.isExpired ? (
                        <span className="px-2.5 py-1 rounded-full bg-red-950/80 border border-red-800 text-red-400 text-xs font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Batal Otomatis (Kedaluwarsa)
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-amber-950/80 border border-amber-800 text-amber-400 text-xs font-bold flex items-center gap-1.5 animate-pulse">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>Sisa: {remaining.text}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Payment Code / VA Box */}
                  <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                        {tx.paymentMethod.replace(/\s*-\s*[0-9A-Za-z]+$/, '')}
                      </div>
                      {paymentCode ? (
                        <div className="flex items-center gap-3">
                          <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono tracking-wider">
                            {paymentCode}
                          </span>
                          <button
                            onClick={() => handleCopy(paymentCode, tx.id)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition"
                            title="Salin Nomor"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs text-amber-300/80 italic flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Nomor kode belum tercatat. Silakan buat pesanan baru.</span>
                        </div>
                      )}
                    </div>

                    <div className="text-right space-y-1">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                        Total Tagihan:
                      </div>
                      <div className="text-lg font-black text-emerald-400">
                        Rp {tx.amount.toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>

                  {/* Time Warning Notice */}
                  {!remaining.isExpired && (
                    <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-900/50 text-[11px] text-amber-300/90 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                      <span>Tagihan dibatalkan otomatis jika belum dibayar dalam 1 jam (sebelum pukul {new Date(new Date(tx.createdAt).getTime() + 60 * 60 * 1000).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB).</span>
                    </div>
                  )}

                  {/* Feedback Message */}
                  {statusMessage[tx.id] && (
                    <div
                      className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                        statusMessage[tx.id].includes('BERHASIL')
                          ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-300'
                          : 'bg-amber-950/80 border border-amber-800 text-amber-300'
                      }`}
                    >
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{statusMessage[tx.id]}</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
                    {paymentCode && (
                      <button
                        onClick={() => handleCopy(paymentCode, tx.id)}
                        className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center gap-1.5"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedId === tx.id ? 'Tersalin!' : 'Salin Nomor'}</span>
                      </button>
                    )}

                    {tx.howToPayUrl && (
                      <a
                        href={tx.howToPayUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center gap-1.5"
                      >
                        <span>Panduan Bayar</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}

                    {!remaining.isExpired ? (
                      <button
                        disabled={checkingInvoice === tx.id}
                        onClick={() => handleCheckStatus(tx)}
                        className="py-2.5 px-5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50"
                      >
                        {checkingInvoice === tx.id ? (
                          'Mengecek Status...'
                        ) : (
                          <>
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Cek Pembayaran</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={onRefresh}
                        className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Perbarui Daftar</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
