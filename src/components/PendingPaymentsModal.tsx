'use client';

import React, { useState, useEffect } from 'react';
import { Transaction } from '../types';
import {
  Clock,
  CreditCard,
  Copy,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
  BookOpen,
  Zap
} from 'lucide-react';
import { QrisLogo } from './PaymentLogos';

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
  const [guideModalTx, setGuideModalTx] = useState<Transaction | null>(null);
  const [simulatingId, setSimulatingId] = useState<string | null>(null);

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
    if (!text) return;
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

  const handleSimulatePayment = async (tx: Transaction) => {
    setSimulatingId(tx.id);
    setStatusMessage((prev) => ({ ...prev, [tx.id]: '' }));

    try {
      const res = await fetch('/api/payments/simulate-pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceNumber: tx.id })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage((prev) => ({ ...prev, [tx.id]: '✅ Simulasi Pembayaran BERHASIL! Paket telah aktif.' }));
        onPaymentSuccess(tx.packageId, tx.paymentMethod);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setStatusMessage((prev) => ({ ...prev, [tx.id]: data.message || 'Gagal memproses simulasi.' }));
      }
    } catch {
      setStatusMessage((prev) => ({ ...prev, [tx.id]: 'Gagal menghubungi server.' }));
    } finally {
      setSimulatingId(null);
    }
  };

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

    const expiryDate = new Date(expiryTimestamp);
    const expireTimeStr = expiryDate.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    }) + ' WIB';

    if (diffMs <= 0) {
      return { isExpired: true, text: 'Kedaluwarsa', expireTimeStr };
    }

    const mins = Math.floor(diffMs / 60000);
    const secs = Math.floor((diffMs % 60000) / 1000);
    return {
      isExpired: false,
      text: `${mins}m ${secs}d`,
      expireTimeStr
    };
  };

  const handleOpenGuide = (tx: Transaction) => {
    if (tx.howToPayUrl && tx.howToPayUrl.startsWith('http')) {
      window.open(tx.howToPayUrl, '_blank');
    } else {
      setGuideModalTx(tx);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white text-stone-900 rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header (Like Reference Screenshot 2) */}
        <div className="p-4 sm:p-5 bg-white border-b border-stone-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-stone-900 leading-tight">
                Tagihan Pending
              </h2>
              <p className="text-xs text-stone-500">
                Batas pembayaran 1 jam dari pemesanan
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={onRefresh}
              title="Segarkan data"
              className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {pendingTransactions.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <p className="text-sm font-bold text-stone-800">Tidak Ada Tagihan Aktif</p>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Semua invoice telah selesai atau otomatis dibatalkan karena melewati batas waktu.
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
                  className={`p-5 rounded-2xl bg-white border border-stone-200 shadow-sm transition space-y-3.5 ${
                    remaining.isExpired ? 'opacity-60' : ''
                  }`}
                >
                  {/* Top Row: Package Name, Invoice & Countdown Badge */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
                    <div>
                      <span className="font-black text-base text-stone-900">{tx.packageName}</span>
                      <div className="text-[11px] text-stone-500 flex items-center gap-2 mt-0.5 font-medium">
                        <span className="font-mono font-bold text-stone-700">{tx.id}</span>
                        <span>•</span>
                        <span>
                          {new Date(tx.createdAt).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}{' '}
                          WIB
                        </span>
                      </div>
                    </div>

                    <div>
                      {remaining.isExpired ? (
                        <span className="px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-red-700 text-xs font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Kedaluwarsa
                        </span>
                      ) : (
                        <span className="px-3.5 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-900 text-xs font-black flex items-center gap-1.5 shadow-2xs">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Sisa: {remaining.text}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Payment Code / VA Box (KondangSensei Fresh & Colorful Theme) */}
                  <div className="p-4 bg-gradient-to-br from-amber-50/50 via-white to-sky-50/40 rounded-2xl border border-stone-200 flex flex-wrap items-center justify-between gap-4 shadow-xs">
                    <div className="space-y-1">
                      <div className="text-[11px] text-stone-600 font-bold uppercase tracking-wider flex items-center gap-2">
                        <QrisLogo className="h-4 w-auto" />
                        <span className="font-extrabold text-stone-800">QRIS Instant</span>
                      </div>

                      {tx.paymentMethod.includes('QRIS') ? (
                        <div className="flex flex-col items-start gap-1.5 pt-1">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                              paymentCode && paymentCode.startsWith('000201')
                                ? paymentCode
                                : tx.howToPayUrl || paymentCode || tx.id
                            )}`}
                            alt="QRIS Code"
                            className="w-28 h-28 sm:w-32 sm:h-32 rounded-lg border border-stone-200 bg-white p-1 shadow-2xs"
                          />
                          <span className="text-[10px] text-stone-500 font-semibold">
                            Pindai via BCA, Mandiri, GoPay, OVO, Dana, ShopeePay
                          </span>
                        </div>
                      ) : paymentCode ? (
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl sm:text-3xl font-black text-indigo-950 font-mono tracking-wider">
                            {paymentCode}
                          </span>
                          <button
                            onClick={() => handleCopy(paymentCode, tx.id)}
                            className="p-1.5 text-stone-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-stone-200 transition cursor-pointer shadow-2xs"
                            title="Salin Nomor"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs text-stone-400 italic">
                          Nomor kode belum tercatat.
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">
                        Total Tagihan:
                      </div>
                      <div className="text-xl sm:text-2xl font-black text-emerald-600 font-mono">
                        Rp {tx.amount.toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>

                  {/* Amber Warning Notice Bar (Like Reference Screenshot 2) */}
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-900 font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      Tagihan dibatalkan otomatis jika belum dibayar dalam 1 jam (sebelum pukul{' '}
                      <strong>{remaining.expireTimeStr}</strong>).
                    </span>
                  </div>

                  {statusMessage[tx.id] && (
                    <div className="p-2.5 rounded-xl text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{statusMessage[tx.id]}</span>
                    </div>
                  )}

                  {/* 3 Action Buttons (Exact Match to Screenshot 2) */}
                  {!remaining.isExpired && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                      {/* Button 1: Salin Nomor */}
                      <button
                        type="button"
                        onClick={() => paymentCode && handleCopy(paymentCode, tx.id)}
                        className="py-2.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl border border-stone-200 transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <Copy className="w-4 h-4 text-stone-600" />
                        <span>{copiedId === tx.id ? 'Tersalin!' : 'Salin Nomor'}</span>
                      </button>

                      {/* Button 2: Panduan Bayar */}
                      <button
                        type="button"
                        onClick={() => handleOpenGuide(tx)}
                        className="py-2.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl border border-stone-200 transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <span>Panduan Bayar</span>
                        <ExternalLink className="w-3.5 h-3.5 text-stone-500" />
                      </button>

                      {/* Button 3: Cek Pembayaran */}
                      <button
                        type="button"
                        onClick={() => handleCheckStatus(tx)}
                        disabled={checkingInvoice === tx.id}
                        className="py-2.5 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>
                          {checkingInvoice === tx.id ? 'Memeriksa...' : 'Cek Pembayaran'}
                        </span>
                      </button>

                      {/* Button 4: Simulasi Sandbox Testing (Hanya tampil untuk transaksi Sandbox) */}
                      {(tx.paymentMethod.includes('SANDBOX') || tx.paymentMethod.includes('Sandbox')) && (
                        <button
                          type="button"
                          onClick={() => handleSimulatePayment(tx)}
                          disabled={simulatingId === tx.id}
                          className="col-span-full py-2 px-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 mt-0.5"
                        >
                          <Zap className="w-3.5 h-3.5 fill-white" />
                          <span>{simulatingId === tx.id ? 'Memproses Simulasi...' : '⚡ Simulasikan Pembayaran Berhasil (Sandbox Testing)'}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Fallback Panduan Bayar Pop-up Modal if no external URL */}
      {guideModalTx && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="font-black text-stone-900 text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-red-600" />
                Panduan Pembayaran
              </h3>
              <button
                onClick={() => setGuideModalTx(null)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-stone-700">
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                <div className="text-[11px] text-stone-500 font-bold">Metode Pembayaran:</div>
                <div className="font-black text-sm text-stone-900">{guideModalTx.paymentMethod}</div>
                <div className="font-mono text-base font-black text-red-600 pt-1">
                  {guideModalTx.paymentCode || guideModalTx.id}
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <h4 className="font-bold text-stone-900 text-xs">
                  {guideModalTx.paymentMethod.includes('QRIS')
                    ? 'Langkah Pembayaran (Scan QRIS):'
                    : guideModalTx.paymentMethod.includes('Indomaret') || guideModalTx.paymentMethod.includes('Alfa')
                    ? 'Langkah Pembayaran di Kasir Gerai:'
                    : 'Langkah Pembayaran (m-Banking / ATM):'}
                </h4>
                {guideModalTx.paymentMethod.includes('QRIS') ? (
                  <ol className="list-decimal list-inside space-y-1 text-stone-600 pl-1 leading-relaxed">
                    <li>Buka aplikasi m-Banking atau E-Wallet pilihan Anda (GoPay, OVO, DANA, ShopeePay, BCA, BRI, Mandiri, dll).</li>
                    <li>Pilih menu <strong>Bayar / QRIS (Pindai QR)</strong>.</li>
                    <li>Pindai kode QR atau masukkan kode pembayaran di atas.</li>
                    <li>Pastikan nama merchant adalah <strong>KondangSensei / DOKU</strong> dan total sesuai.</li>
                    <li>Masukkan PIN Anda dan simpan bukti transaksi.</li>
                  </ol>
                ) : guideModalTx.paymentMethod.includes('Indomaret') || guideModalTx.paymentMethod.includes('Alfa') ? (
                  <ol className="list-decimal list-inside space-y-1 text-stone-600 pl-1 leading-relaxed">
                    <li>Kunjungi kasir {guideModalTx.paymentMethod.includes('Indomaret') ? 'Indomaret' : 'Alfamart'} terdekat.</li>
                    <li>Beri tahu kasir ingin melakukan <strong>Pembayaran Merchant DOKU / KondangSensei</strong>.</li>
                    <li>Tunjukkan nomor kode pembayaran di atas kepada kasir.</li>
                    <li>Bayar nominal tepat sebesar <strong>Rp {guideModalTx.amount.toLocaleString('id-ID')}</strong>.</li>
                    <li>Simpan struk pembayaran kasir sebagai bukti sah.</li>
                  </ol>
                ) : (
                  <ol className="list-decimal list-inside space-y-1 text-stone-600 pl-1 leading-relaxed">
                    <li>Buka aplikasi m-Banking atau kunjungi ATM bank Anda.</li>
                    <li>Pilih menu <strong>Transfer</strong> &gt; <strong>Virtual Account / Pembayaran</strong>.</li>
                    <li>Masukkan nomor kode pembayaran di atas.</li>
                    <li>Periksa apakah nama merchant adalah <strong>KondangSensei / DOKU</strong> dan nominal tepat <strong>Rp {guideModalTx.amount.toLocaleString('id-ID')}</strong>.</li>
                    <li>Konfirmasi PIN transaksi dan simpan bukti pembayaran.</li>
                  </ol>
                )}
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium">
                Setelah transfer selesai, klik tombol <strong>&quot;Cek Pembayaran&quot;</strong> di kartu tagihan Anda.
              </div>
            </div>

            <button
              onClick={() => setGuideModalTx(null)}
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition"
            >
              Tutup Panduan
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
