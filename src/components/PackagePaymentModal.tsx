'use client';

import React, { useState } from 'react';
import { TryoutPackage, User } from '../types';
import {
  ShieldCheck,
  Zap,
  X,
  AlertCircle,
  Copy,
  CheckCircle2,
  QrCode,
  Check,
  Sparkles,
  Clock,
  ExternalLink
} from 'lucide-react';
import { QrisLogo } from './PaymentLogos';

interface PackagePaymentModalProps {
  isOpen: boolean;
  packages: TryoutPackage[];
  currentUser?: User | null;
  onClose: () => void;
  onPaymentSuccess: (packageId: string, paymentMethod: string) => void;
}

export const PackagePaymentModal: React.FC<PackagePaymentModalProps> = ({
  isOpen,
  packages,
  currentUser,
  onClose,
  onPaymentSuccess
}) => {
  const defaultPackage = packages.find((p) => p.firstTimeOnly) || packages[0] || null;
  const [selectedPkg, setSelectedPkg] = useState<TryoutPackage | null>(defaultPackage);
  const [selectedChannel, setSelectedChannel] = useState<string>('QRIS');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Generated Payment Result State
  const [vaResult, setVaResult] = useState<{
    channelName: string;
    paymentCode: string;
    amount: number;
    howToPayUrl?: string;
    invoiceNumber: string;
    isSandbox?: boolean;
  } | null>(null);

  const [copied, setCopied] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [checkStatusMessage, setCheckStatusMessage] = useState('');

  if (!isOpen) return null;

  const handlePay = async () => {
    if (!selectedPkg) return;
    setIsProcessing(true);
    setErrorMessage('');

    if (currentUser) {
      try {
        const res = await fetch('/api/payments/doku/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id,
            packageId: selectedPkg.id,
            channel: selectedChannel
          })
        });

        const data = await res.json();
        if (data.success && (data.paymentCode || data.howToPayUrl)) {
          if (selectedChannel === 'DOKU_EWALLET' && data.howToPayUrl && !data.isSandbox) {
            window.location.href = data.howToPayUrl;
            return;
          }

          setVaResult({
            channelName: data.channelName,
            paymentCode: data.paymentCode,
            amount: data.amount,
            howToPayUrl: data.howToPayUrl,
            invoiceNumber: data.invoiceNumber,
            isSandbox: data.isSandbox
          });
          return;
        } else {
          setErrorMessage(data.message || 'Gagal menerbitkan nomor pembayaran DOKU.');
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setErrorMessage('Gagal menghubungi server: ' + msg);
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    try {
      await new Promise((res) => setTimeout(res, 1000));
      onPaymentSuccess(selectedPkg.id, selectedChannel);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyCode = () => {
    if (vaResult?.paymentCode) {
      navigator.clipboard.writeText(vaResult.paymentCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCheckPaymentStatus = async () => {
    if (!vaResult) return;
    setIsCheckingPayment(true);
    setCheckStatusMessage('');

    try {
      const res = await fetch(`/api/payments/status?invoiceNumber=${encodeURIComponent(vaResult.invoiceNumber)}`);
      const data = await res.json();

      if (data.success && data.status === 'PAID') {
        setCheckStatusMessage('✅ PEMBAYARAN BERHASIL DIVERIFIKASI! Masa aktif akun Anda telah diperpanjang.');
        setTimeout(() => {
          setVaResult(null);
          onClose();
        }, 1200);
      } else {
        setCheckStatusMessage('Belum ada transfer yang masuk untuk nomor ini. Silakan selesaikan pembayaran di m-Banking / ATM / Kasir.');
      }
    } catch {
      setCheckStatusMessage('Gagal mengecek status pembayaran. Coba beberapa saat lagi.');
    } finally {
      setIsCheckingPayment(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!vaResult) return;
    setIsSimulating(true);
    setCheckStatusMessage('');

    try {
      const res = await fetch('/api/payments/simulate-pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceNumber: vaResult.invoiceNumber })
      });
      const data = await res.json();
      if (data.success) {
        setCheckStatusMessage('✅ SIMULASI PEMBAYARAN BERHASIL! Paket aktif & masa aktif akun telah diperpanjang.');
        setTimeout(() => {
          setVaResult(null);
          if (selectedPkg) {
            onPaymentSuccess(selectedPkg.id, vaResult.channelName);
          }
          onClose();
        }, 1200);
      } else {
        setCheckStatusMessage(data.message || 'Gagal memproses simulasi pembayaran.');
      }
    } catch {
      setCheckStatusMessage('Gagal menghubungi server.');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl md:max-w-2xl bg-white text-stone-900 rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[88vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-white text-stone-900 flex items-center justify-between border-b border-stone-200 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-50 border border-rose-200 text-red-600 flex items-center justify-center font-bold shadow-2xs shrink-0">
              <Zap className="w-5 h-5 fill-red-600" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-black text-stone-900 leading-tight truncate">
                Pilih Paket & Pembayaran JFT
              </h2>
              <p className="text-xs text-stone-500 truncate">
                Pembayaran Instan QRIS • Semua Bank & E-Wallet
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setVaResult(null);
              onClose();
            }}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition shrink-0 ml-2 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {vaResult ? (
            <div className="space-y-4 animate-in zoom-in-95 duration-150">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-1">
                <CheckCircle2 className="w-9 h-9 text-emerald-600 mx-auto" />
                <h3 className="text-sm font-black text-emerald-800">
                  Kode QRIS Berhasil Diterbitkan
                </h3>
                <p className="text-xs text-stone-600">
                  Silakan pindai kode QRIS di bawah ini dengan m-Banking atau E-Wallet Anda:
                </p>
              </div>

              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                <div className="flex justify-between items-center text-xs text-stone-600 border-b border-stone-200 pb-2 font-medium">
                  <span>Metode Pembayaran:</span>
                  <div className="flex items-center gap-2">
                    <QrisLogo className="h-4 w-auto" />
                    <span className="font-bold text-stone-900">QRIS Instant</span>
                  </div>
                </div>

                <div className="space-y-1 text-center py-2">
                  <div className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                    {vaResult.channelName.includes('QRIS')
                      ? 'Pindai Kode QRIS'
                      : vaResult.channelName.includes('Retail') || vaResult.channelName.includes('Alfa') || vaResult.channelName.includes('Indomaret')
                      ? 'Kode Pembayaran Kasir'
                      : 'Nomor Virtual Account'}
                  </div>

                  {vaResult.channelName.includes('QRIS') ? (
                    <div className="flex flex-col items-center justify-center p-3.5 bg-white rounded-2xl w-fit mx-auto border border-stone-200 shadow-sm my-2">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
                          vaResult.paymentCode && vaResult.paymentCode.startsWith('000201')
                            ? vaResult.paymentCode
                            : vaResult.howToPayUrl || vaResult.paymentCode
                        )}`}
                        alt="QRIS Code"
                        className="w-44 h-44 sm:w-52 sm:h-52 rounded-xl shadow-2xs"
                      />
                      <span className="text-[11px] text-stone-600 font-bold mt-2">
                        Pindai via BCA, Mandiri, BRI, BNI, GoPay, OVO, Dana, ShopeePay
                      </span>
                    </div>
                  ) : (
                    <div className="text-xl sm:text-2xl font-black text-red-600 tracking-wider font-mono break-all px-2 py-1">
                      {vaResult.paymentCode}
                    </div>
                  )}

                  <button
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-stone-100 text-stone-700 text-xs font-bold rounded-xl border border-stone-200 transition shadow-2xs mt-1 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copied ? 'Tersalin!' : 'Salin Kode / Nomor'}</span>
                  </button>
                </div>

                <div className="flex justify-between items-center text-xs text-stone-600 border-t border-stone-200 pt-2 font-medium">
                  <span>Total Tagihan:</span>
                  <span className="text-base font-black text-red-600">
                    Rp {vaResult.amount.toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="flex justify-between items-center text-[11px] text-stone-500">
                  <span>No. Invoice:</span>
                  <span className="font-mono font-bold text-stone-700">{vaResult.invoiceNumber}</span>
                </div>
              </div>

              <div className="space-y-2">
                {checkStatusMessage && (
                  <div
                    className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                      checkStatusMessage.includes('BERHASIL')
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                        : 'bg-amber-50 border border-amber-200 text-amber-800'
                    }`}
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{checkStatusMessage}</span>
                  </div>
                )}

                <button
                  type="button"
                  disabled={isCheckingPayment}
                  onClick={handleCheckPaymentStatus}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isCheckingPayment
                    ? 'Mengecek Status Pembayaran ke DOKU...'
                    : 'Cek Status Pembayaran (Sudah Bayar)'}
                </button>

                {vaResult.isSandbox && (
                  <button
                    type="button"
                    disabled={isSimulating}
                    onClick={handleSimulatePayment}
                    className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Zap className="w-3.5 h-3.5 fill-white" />
                    <span>{isSimulating ? 'Memproses Simulasi...' : '⚡ Simulasikan Pembayaran Berhasil (Sandbox Testing)'}</span>
                  </button>
                )}

                {vaResult.howToPayUrl && (
                  <a
                    href={vaResult.howToPayUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 text-center cursor-pointer"
                  >
                    <span>
                      {vaResult.isSandbox && vaResult.channelName.includes('QRIS')
                        ? 'Buka DOKU QRIS Simulator'
                        : vaResult.channelName.includes('QRIS') || vaResult.channelName.includes('Wallet')
                        ? 'Buka Halaman Pembayaran Resmi DOKU'
                        : 'Buka Halaman Panduan Resmi DOKU'}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-white" />
                  </a>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Packages List */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                    1. Pilih Paket Durasi Akses:
                  </label>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>Akses 4 Paket Soal JFT + Audio</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {packages.map((pkg) => {
                    const isSelected = selectedPkg?.id === pkg.id;
                    const durationText = pkg.durationHours
                      ? `${pkg.durationHours} Jam Akses Penuh`
                      : `${pkg.durationDays} Hari Akses Unlimited`;

                    // Calculate visual badges & strikethrough value with vibrant color themes
                    let originalPrice: number | null = null;
                    let badgeText = pkg.badge;
                    let dailyPriceText = '';
                    let badgeStyle = 'bg-stone-100 text-stone-700 border-stone-200';
                    let pkgTheme = {
                      selectedBorder: 'border-indigo-600 bg-gradient-to-r from-indigo-50/90 via-white to-sky-50/40 ring-indigo-500/20',
                      radio: 'border-indigo-600 bg-indigo-600',
                      priceText: 'text-indigo-600'
                    };

                    if (pkg.firstTimeOnly || pkg.id === 'pkg_special_1h') {
                      originalPrice = 15000;
                      badgeText = '⚡ FLASH PROMO • KHUSUS PENGGUNA BARU';
                      badgeStyle = 'bg-rose-100 text-rose-700 border-rose-300 font-black';
                      pkgTheme = {
                        selectedBorder: 'border-rose-500 bg-gradient-to-r from-rose-50/90 via-white to-orange-50/30 ring-rose-500/20',
                        radio: 'border-rose-500 bg-rose-500',
                        priceText: 'text-rose-600'
                      };
                    } else if (pkg.id === 'pkg_7d') {
                      originalPrice = 50000;
                      badgeText = '🔥 PALING POPULER';
                      dailyPriceText = 'Rp 5.000 / hari';
                      badgeStyle = 'bg-amber-500 text-white border-amber-600 font-black';
                      pkgTheme = {
                        selectedBorder: 'border-amber-500 bg-gradient-to-r from-amber-50/90 via-white to-orange-50/30 ring-amber-500/20',
                        radio: 'border-amber-500 bg-amber-500',
                        priceText: 'text-amber-600'
                      };
                    } else if (pkg.id === 'pkg_14d') {
                      originalPrice = 80000;
                      badgeText = '⭐ INTENSIF • HEMAT 26%';
                      dailyPriceText = 'Rp 4.200 / hari';
                      badgeStyle = 'bg-sky-500 text-white border-sky-600 font-bold';
                      pkgTheme = {
                        selectedBorder: 'border-sky-500 bg-gradient-to-r from-sky-50/90 via-white to-blue-50/30 ring-sky-500/20',
                        radio: 'border-sky-500 bg-sky-500',
                        priceText: 'text-sky-600'
                      };
                    } else if (pkg.id === 'pkg_30d') {
                      originalPrice = 160000;
                      badgeText = '👑 BEST VALUE • HEMAT 38%';
                      dailyPriceText = 'Rp 3.300 / hari';
                      badgeStyle = 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-transparent font-black shadow-2xs';
                      pkgTheme = {
                        selectedBorder: 'border-violet-500 bg-gradient-to-r from-violet-50/90 via-white to-indigo-50/30 ring-violet-500/20',
                        radio: 'border-violet-500 bg-violet-500',
                        priceText: 'text-violet-600'
                      };
                    }

                    return (
                      <div
                        key={pkg.id}
                        onClick={() => setSelectedPkg(pkg)}
                        className={`relative p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isSelected
                            ? `${pkgTheme.selectedBorder} shadow-sm ring-2`
                            : 'bg-white border-stone-200/90 hover:border-stone-300 hover:bg-stone-50/60 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          {/* Custom Radio check */}
                          <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
                            isSelected
                              ? `${pkgTheme.radio} text-white shadow-2xs`
                              : 'border-stone-300 bg-white'
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>

                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-black text-sm text-stone-900 tracking-tight">
                                {pkg.name}
                              </span>
                              {badgeText && (
                                <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider border ${badgeStyle}`}>
                                  {badgeText}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-stone-500 leading-snug line-clamp-2">
                              {pkg.description}
                            </p>
                            {dailyPriceText && (
                              <div className="text-[11px] font-bold text-stone-500 flex items-center gap-1.5 pt-0.5">
                                <Clock className="w-3 h-3 text-amber-500" />
                                <span>{dailyPriceText}</span>
                                <span className="text-stone-300">•</span>
                                <span className="text-emerald-700 font-semibold">{durationText}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-left sm:text-right shrink-0 pl-8 sm:pl-0 border-t sm:border-t-0 border-stone-100 pt-2 sm:pt-0">
                          {originalPrice && (
                            <div className="text-[11px] text-stone-400 line-through font-medium">
                              Rp {originalPrice.toLocaleString('id-ID')}
                            </div>
                          )}
                          <div className={`text-base sm:text-lg font-black tracking-tight ${pkgTheme.priceText}`}>
                            Rp {pkg.price.toLocaleString('id-ID')}
                          </div>
                          {!dailyPriceText && (
                            <div className="text-[10px] font-bold text-emerald-700">
                              {durationText}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Metode Pembayaran: QRIS Only */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    2. Metode Pembayaran:
                  </label>
                  <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    Verifikasi Otomatis 24 Jam
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl border-2 border-emerald-500 bg-gradient-to-r from-emerald-50/70 via-white to-teal-50/30 shadow-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-14 h-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center p-1.5 shrink-0 shadow-2xs">
                      <QrisLogo className="h-6 w-auto" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-black text-xs sm:text-sm text-stone-900 flex items-center gap-1.5">
                        <span>QRIS Instant</span>
                        <span className="px-1.5 py-0.5 bg-emerald-600 text-white text-[9px] rounded-full font-bold">Resmi</span>
                      </div>
                      <p className="text-[11px] text-stone-500 truncate font-medium">
                        BCA, Mandiri, BRI, BNI, GoPay, OVO, DANA, ShopeePay
                      </p>
                    </div>
                  </div>

                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-[11px] text-stone-600 flex items-center gap-2 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Pembayaran diproses aman melalui DOKU Payment Gateway resmi berlisensi Bank Indonesia.
                </span>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!vaResult && (
          <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-3 shrink-0">
            <div>
              <div className="text-[10px] text-stone-500 uppercase font-bold">Total Pembayaran:</div>
              <div className="text-base sm:text-lg font-black text-emerald-600 font-mono">
                Rp {selectedPkg?.price.toLocaleString('id-ID')}
              </div>
            </div>

            <button
              onClick={handlePay}
              disabled={isProcessing || !selectedPkg}
              className="py-3 px-6 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 text-white font-black text-xs rounded-xl shadow-md shadow-red-600/25 transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>{isProcessing ? 'Memproses...' : 'Bayar Sekarang via QRIS'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
