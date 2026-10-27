'use client';

import React, { useState, useEffect } from 'react';
import { TryoutPackage, User } from '../types';
import { DEFAULT_PACKAGES } from '../lib/dataStore';
import {
  ShieldCheck,
  Flame,
  Star,
  Crown,
  Zap,
  X,
  AlertCircle,
  Copy,
  CheckCircle2,
  QrCode,
  Check,
  Sparkles,
  Clock,
  ExternalLink,
  Tag,
  Ticket,
  RefreshCw
} from 'lucide-react';
import { QrisLogo } from './PaymentLogos';

interface PackagePaymentModalProps {
  isOpen: boolean;
  packages: TryoutPackage[];
  currentUser?: User | null;
  onClose: () => void;
  onPaymentSuccess: (packageId: string, paymentMethod: string) => void;
  onOpenTerms?: () => void;
}

export const PackagePaymentModal: React.FC<PackagePaymentModalProps> = ({
  isOpen,
  packages,
  currentUser,
  onClose,
  onPaymentSuccess,
  onOpenTerms
}) => {
  const availablePackages = (packages && packages.length > 0 ? packages : DEFAULT_PACKAGES).filter(
    (p) => p.id !== 'pkg_special_1h' && p.price > 100 && !p.firstTimeOnly
  );
  const defaultPackage = availablePackages.find((p) => p.popular) || availablePackages[0] || null;
  const [selectedPkg, setSelectedPkg] = useState<TryoutPackage | null>(defaultPackage);

  useEffect(() => {
    if (!selectedPkg || !availablePackages.some((p) => p.id === selectedPkg.id)) {
      if (defaultPackage) setSelectedPkg(defaultPackage);
    }
  }, [availablePackages, defaultPackage, selectedPkg]);

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

  // Voucher states
  const [voucherCodeInput, setVoucherCodeInput] = useState('');
  const [appliedVoucherData, setAppliedVoucherData] = useState<{
    code: string;
    discountType: string;
    discountValue: number;
    discountAmount: number;
    finalPrice: number;
    description?: string;
  } | null>(null);
  const [voucherError, setVoucherError] = useState('');
  const [isValidatingVoucher, setIsValidatingVoucher] = useState(false);

  // Recalculate voucher if selected package changes
  useEffect(() => {
    if (appliedVoucherData && selectedPkg) {
      fetch('/api/vouchers/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: appliedVoucherData.code,
          packageId: selectedPkg.id,
          userId: currentUser?.id
        })
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.success && d.valid) {
            setAppliedVoucherData({
              code: d.voucher.code,
              discountType: d.voucher.discountType,
              discountValue: d.voucher.discountValue,
              discountAmount: d.discountAmount,
              finalPrice: d.finalPrice,
              description: d.voucher.description
            });
            setVoucherError('');
          } else {
            setAppliedVoucherData(null);
            setVoucherError(d.message || 'Voucher tidak berlaku untuk paket ini.');
          }
        })
        .catch(() => {});
    }
  }, [selectedPkg?.id]);

  const handleApplyVoucher = async () => {
    if (!voucherCodeInput.trim() || !selectedPkg) return;
    setIsValidatingVoucher(true);
    setVoucherError('');
    try {
      const res = await fetch('/api/vouchers/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: voucherCodeInput.trim(),
          packageId: selectedPkg.id,
          userId: currentUser?.id
        })
      });
      const data = await res.json();
      if (data.success && data.valid) {
        setAppliedVoucherData({
          code: data.voucher.code,
          discountType: data.voucher.discountType,
          discountValue: data.voucher.discountValue,
          discountAmount: data.discountAmount,
          finalPrice: data.finalPrice,
          description: data.voucher.description
        });
        setVoucherError('');
      } else {
        setVoucherError(data.message || 'Kode voucher tidak valid.');
        setAppliedVoucherData(null);
      }
    } catch {
      setVoucherError('Gagal memvalidasi kode voucher. Silakan periksa koneksi Anda.');
      setAppliedVoucherData(null);
    } finally {
      setIsValidatingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucherData(null);
    setVoucherCodeInput('');
    setVoucherError('');
  };

  const finalPayAmount = appliedVoucherData ? appliedVoucherData.finalPrice : (selectedPkg?.price || 0);

  // Auto-poll payment status while QR is displayed
  useEffect(() => {
    if (!isOpen || !vaResult?.invoiceNumber) return;

    const interval = setInterval(async () => {
      try {
        const queryParams = new URLSearchParams({
          invoiceNumber: vaResult.invoiceNumber,
          ...(currentUser?.id ? { userId: currentUser.id } : {}),
          ...(selectedPkg?.id ? { packageId: selectedPkg.id } : {})
        });
        const res = await fetch(`/api/payments/status?${queryParams.toString()}`);
        const data = await res.json();
        if (data.success && (data.status === 'PAID' || data.isPaid)) {
          clearInterval(interval);
          setCheckStatusMessage('PEMBAYARAN BERHASIL DIVERIFIKASI! Masa aktif akun Anda telah diperpanjang.');
          if (selectedPkg) {
            onPaymentSuccess(selectedPkg.id, vaResult.channelName);
          }
          setTimeout(() => {
            setVaResult(null);
            onClose();
          }, 1200);
        }
      } catch {}
    }, 3500);

    return () => clearInterval(interval);
  }, [isOpen, vaResult?.invoiceNumber, selectedPkg, onPaymentSuccess, onClose]);

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
            channel: selectedChannel,
            voucherCode: appliedVoucherData?.code
          })
        });

        const data = await res.json();

        // 100% Free Voucher Claimed Instantly
        if (data.success && data.isFree) {
          if (selectedPkg) {
            onPaymentSuccess(selectedPkg.id, `Voucher 100% (${appliedVoucherData?.code || 'PROMO'})`);
          }
          setVaResult(null);
          onClose();
          return;
        }
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
      const queryParams = new URLSearchParams({
        invoiceNumber: vaResult.invoiceNumber,
        ...(currentUser?.id ? { userId: currentUser.id } : {}),
        ...(selectedPkg?.id ? { packageId: selectedPkg.id } : {})
      });
      const res = await fetch(`/api/payments/status?${queryParams.toString()}`);
      const data = await res.json();

      if (data.success && (data.status === 'PAID' || data.isPaid)) {
        setCheckStatusMessage('PEMBAYARAN BERHASIL DIVERIFIKASI! Masa aktif akun Anda telah diperpanjang.');
        if (selectedPkg) {
          onPaymentSuccess(selectedPkg.id, vaResult.channelName);
        }
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
        setCheckStatusMessage('SIMULASI PEMBAYARAN BERHASIL! Paket aktif & masa aktif akun telah diperpanjang.');
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
                    <div className="flex flex-col items-center justify-center p-3 sm:p-3.5 bg-white rounded-2xl w-fit max-w-full mx-auto border border-stone-200 shadow-sm my-2">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                          vaResult.paymentCode
                        )}`}
                        alt="QRIS Code"
                        className="w-44 h-44 sm:w-56 sm:h-56 max-w-full rounded-xl shadow-2xs bg-white p-1"
                      />
                      <span className="text-[10px] sm:text-[11px] text-stone-700 font-extrabold mt-2 text-center max-w-xs">
                        Scan langsung untuk bayar via GoPay, BCA, Mandiri, BRI, OVO, Dana, ShopeePay
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
                    {checkStatusMessage.includes('BERHASIL') ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />}
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
                    <span>{isSimulating ? 'Memproses Simulasi...' : 'Simulasikan Pembayaran Berhasil (Sandbox Testing)'}</span>
                  </button>
                )}

                {vaResult.isSandbox && vaResult.channelName.includes('QRIS') && vaResult.howToPayUrl && (
                  <a
                    href={vaResult.howToPayUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 text-center cursor-pointer"
                  >
                    <span>Buka DOKU QRIS Simulator</span>
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
                    <span>Akses Seluruh Paket Soal JFT + Audio</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {availablePackages.map((pkg) => {
                    const isSelected = selectedPkg?.id === pkg.id;
                    const durationText = `${pkg.durationDays} Hari Akses Unlimited`;

                    // Calculate visual badges & strikethrough value with vibrant color themes
                    let originalPrice: number | null = null;
                    let badgeText = pkg.badge;
                    let dailyPriceText = '';
                    let badgeStyle = 'bg-stone-100 text-stone-700 border-stone-200';
                    let pkgTheme = {
                      selectedBorder: 'border-red-600 bg-gradient-to-r from-rose-50/90 via-white to-amber-50/30 ring-red-500/20',
                      radio: 'border-red-600 bg-red-600',
                      priceText: 'text-red-600'
                    };

                    if (pkg.id === 'pkg_7d') {
                      originalPrice = 50000;
                      badgeText = 'MEPET UJIAN • SKS';
                      dailyPriceText = 'Rp 5.000 / hari';
                      badgeStyle = 'bg-stone-700 text-white border-stone-800 font-bold';
                      pkgTheme = {
                        selectedBorder: 'border-stone-600 bg-gradient-to-r from-stone-50/90 via-white to-stone-50/30 ring-stone-500/20',
                        radio: 'border-stone-600 bg-stone-600',
                        priceText: 'text-stone-800'
                      };
                    } else if (pkg.id === 'pkg_14d') {
                      originalPrice = 80000;
                      badgeText = '★ REKOMENDASI UTAMA • PALING IDEAL';
                      dailyPriceText = 'Rp 4.200 / hari • Hemat 26%';
                      badgeStyle = 'bg-gradient-to-r from-red-600 to-rose-600 text-white border-red-700 font-black shadow-xs';
                      pkgTheme = {
                        selectedBorder: 'border-red-600 bg-gradient-to-r from-rose-50/90 via-white to-amber-50/30 ring-red-500/30 shadow-md',
                        radio: 'border-red-600 bg-red-600',
                        priceText: 'text-red-600'
                      };
                    } else if (pkg.id === 'pkg_30d') {
                      originalPrice = 160000;
                      badgeText = '🎁 BONUS PDF KOSAKATA VIA WA';
                      dailyPriceText = 'Rp 3.300 / hari • Hemat 38%';
                      badgeStyle = 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-700 font-black shadow-xs';
                      pkgTheme = {
                        selectedBorder: 'border-emerald-600 bg-gradient-to-r from-emerald-50/90 via-white to-teal-50/30 ring-emerald-500/20',
                        radio: 'border-emerald-600 bg-emerald-600',
                        priceText: 'text-emerald-700'
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
                                <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider border inline-flex items-center gap-1 ${badgeStyle}`}>
                                  {badgeText.includes('FLASH') ? <Zap className="w-2.5 h-2.5 shrink-0" /> : badgeText.includes('POPULER') ? <Flame className="w-2.5 h-2.5 shrink-0" /> : badgeText.includes('INTENSIF') ? <Star className="w-2.5 h-2.5 shrink-0" /> : badgeText.includes('BEST') ? <Crown className="w-2.5 h-2.5 shrink-0" /> : null}
                                  <span>{badgeText}</span>
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

              {/* 2. Voucher Code Section */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-rose-600" />
                    2. Punya Kode Voucher?
                  </label>
                  {appliedVoucherData && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Hemat Rp {appliedVoucherData.discountAmount.toLocaleString('id-ID')}
                    </span>
                  )}
                </div>

                {!appliedVoucherData ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Ticket className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={voucherCodeInput}
                          onChange={(e) => {
                            setVoucherCodeInput(e.target.value.toUpperCase());
                            setVoucherError('');
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleApplyVoucher();
                            }
                          }}
                          placeholder="Masukkan kode voucher (contoh: KONDANG50)"
                          className="w-full pl-9 pr-3 py-2.5 text-xs font-mono font-bold tracking-wider text-stone-900 placeholder-stone-400 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition"
                        />
                      </div>
                      <button
                        type="button"
                        disabled={isValidatingVoucher || !voucherCodeInput.trim()}
                        onClick={handleApplyVoucher}
                        className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-2xs shrink-0 cursor-pointer flex items-center gap-1.5"
                      >
                        {isValidatingVoucher ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        )}
                        <span>Gunakan</span>
                      </button>
                    </div>

                    {voucherError && (
                      <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-red-700 flex items-center gap-2 font-medium">
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                        <span>{voucherError}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white border border-emerald-300 rounded-2xl flex items-center justify-between gap-3 shadow-2xs animate-in zoom-in-95 duration-150">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-black text-xs text-emerald-900 bg-white px-2 py-0.5 rounded-lg border border-emerald-200">
                            {appliedVoucherData.code}
                          </span>
                          <span className="text-xs font-black text-emerald-700">
                            -Rp {appliedVoucherData.discountAmount.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-800 font-medium truncate mt-0.5">
                          {appliedVoucherData.description || 'Kode voucher berhasil digunakan!'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemoveVoucher}
                      className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-rose-50 rounded-xl transition shrink-0 cursor-pointer"
                      title="Batalkan Voucher"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* 3. Metode Pembayaran: QRIS Only (jika tidak gratis) */}
              {finalPayAmount > 0 ? (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      3. Metode Pembayaran:
                    </label>
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
              ) : (
                <div className="p-3.5 rounded-2xl border-2 border-emerald-400 bg-emerald-50/90 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Sparkles className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-emerald-900">Total Tagihan Rp 0 (Diskon 100%)</h4>
                    <p className="text-[11px] text-emerald-700 font-medium">
                      Anda tidak perlu membayar apa pun. Klik tombol di bawah untuk langsung mengaktifkan paket akses gratis Anda!
                    </p>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-[11px] text-stone-600 space-y-1.5 font-medium">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Pembayaran diproses aman melalui DOKU Payment Gateway resmi berlisensi Bank Indonesia.
                  </span>
                </div>
                <div className="text-[10px] text-stone-500 pl-6 leading-relaxed">
                  Akses langsung aktif instan setelah pembayaran terkonfirmasi. Layanan ini adalah produk digital dengan masa aktif dan bersifat non-refundable (tidak dapat dibatalkan).{' '}
                  {onOpenTerms && (
                    <button
                      type="button"
                      onClick={onOpenTerms}
                      className="text-red-600 hover:text-red-800 underline font-bold cursor-pointer"
                    >
                      Baca Ketentuan Layanan
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!vaResult && (
          <div className="p-3.5 sm:p-4 bg-stone-50 border-t border-stone-200 flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-3 shrink-0">
            <div className="flex xs:flex-col justify-between items-center xs:items-start">
              <div className="text-[10px] text-stone-500 uppercase font-bold flex items-center gap-1.5">
                <span>Total Pembayaran:</span>
                {appliedVoucherData && (
                  <span className="text-[10px] font-mono line-through text-stone-400">
                    Rp {selectedPkg?.price.toLocaleString('id-ID')}
                  </span>
                )}
              </div>
              <div className="text-base sm:text-lg font-black font-mono flex items-center gap-2">
                <span className={finalPayAmount === 0 ? 'text-emerald-600' : 'text-stone-900'}>
                  {finalPayAmount === 0 ? 'GRATIS (Rp 0)' : `Rp ${finalPayAmount.toLocaleString('id-ID')}`}
                </span>
                {appliedVoucherData && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                    Hemat Rp {appliedVoucherData.discountAmount.toLocaleString('id-ID')}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={handlePay}
              disabled={isProcessing || !selectedPkg}
              className={`w-full xs:w-auto justify-center py-3 px-5 sm:px-6 text-white font-black text-xs rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50 cursor-pointer ${
                finalPayAmount === 0
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-600/25'
                  : 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 shadow-red-600/25'
              }`}
            >
              {finalPayAmount === 0 ? (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{isProcessing ? 'Mengaktifkan...' : 'Klaim Akses Gratis Sekarang'}</span>
                </>
              ) : (
                <>
                  <QrCode className="w-4 h-4" />
                  <span>{isProcessing ? 'Memproses...' : 'Bayar Sekarang via QRIS'}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
