'use client';

import React, { useState } from 'react';
import { TryoutPackage, User } from '../types';
import { CreditCard, ShieldCheck, Zap, X, AlertCircle, Copy, CheckCircle2, Store, Building2, Wallet, QrCode, Smartphone } from 'lucide-react';

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
  const [selectedChannel, setSelectedChannel] = useState<string>('DOKU_EWALLET');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Generated Payment Result State
  const [vaResult, setVaResult] = useState<{
    channelName: string;
    paymentCode: string;
    amount: number;
    howToPayUrl?: string;
    invoiceNumber: string;
  } | null>(null);

  const [copied, setCopied] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
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
          // If DOKU e-Wallet or Akulaku returns direct payment page, redirect or open immediately
          if ((selectedChannel === 'DOKU_EWALLET' || selectedChannel === 'AKULAKU') && data.howToPayUrl) {
            window.location.href = data.howToPayUrl;
            return;
          }

          setVaResult({
            channelName: data.channelName,
            paymentCode: data.paymentCode,
            amount: data.amount,
            howToPayUrl: data.howToPayUrl,
            invoiceNumber: data.invoiceNumber
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

    // Fallback jika tidak ada user
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

      if (data.success && data.isPaid) {
        setCheckStatusMessage('Pembayaran BERHASIL terkonfirmasi oleh DOKU!');
        if (selectedPkg) {
          onPaymentSuccess(selectedPkg.id, `DOKU (${vaResult.channelName})`);
        }
        setTimeout(() => {
          setVaResult(null);
          onClose();
        }, 1200);
      } else {
        setCheckStatusMessage('Belum ada transfer yang masuk untuk nomor ini. Silakan selesaikan pembayaran di m-Banking / ATM / Kasir.');
      }
    } catch (err) {
      setCheckStatusMessage('Gagal mengecek status pembayaran. Coba beberapa saat lagi.');
    } finally {
      setIsCheckingPayment(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="max-w-xl w-full bg-slate-900 text-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="p-3.5 sm:p-5 md:p-6 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-red-500 to-amber-500 flex items-center justify-center font-bold text-white shadow shrink-0">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base md:text-lg font-bold text-white leading-tight">Pembayaran DOKU Gateway</h2>
              <p className="text-[10px] sm:text-xs text-slate-400">Pilih paket & bayar melalui Virtual Account, e-Wallet, atau QRIS</p>
            </div>
          </div>
          <button 
            onClick={() => { setVaResult(null); onClose(); }} 
            className="p-1.5 sm:p-2 text-slate-400 hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3.5 sm:p-5 md:p-6 overflow-y-auto space-y-4 sm:space-y-6">
          {/* JIKA SUDAH MENDAPATKAN NOMOR VA / KODE BAYAR DOKU */}
          {vaResult ? (
            <div className="space-y-4 sm:space-y-6 animate-in zoom-in-95 duration-200">
              <div className="p-3.5 sm:p-5 bg-emerald-950/40 border border-emerald-800/80 rounded-2xl text-center space-y-1.5 sm:space-y-2">
                <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400 mx-auto" />
                <h3 className="text-sm sm:text-base font-bold text-emerald-300">Nomor Pembayaran DOKU Diterbitkan</h3>
                <p className="text-[11px] sm:text-xs text-slate-300">
                  Silakan lakukan pembayaran ke rekening Virtual Account / Kasir di bawah ini:
                </p>
              </div>

              <div className="p-3.5 sm:p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3 sm:space-y-4">
                <div className="flex justify-between items-center text-xs text-slate-400 border-b border-slate-800/80 pb-2.5 sm:pb-3">
                  <span>Metode Pembayaran:</span>
                  <span className="font-bold text-white">{vaResult.channelName}</span>
                </div>

                <div className="space-y-1.5 text-center py-1 sm:py-2">
                  <div className="text-[11px] sm:text-xs text-slate-400 uppercase tracking-wider font-semibold">
                    {vaResult.channelName.includes('QRIS') 
                      ? 'Scan QRIS untuk Membayar' 
                      : vaResult.channelName.includes('Retail') 
                        ? 'Kode Pembayaran Kasir' 
                        : vaResult.channelName.includes('Google')
                          ? 'Kode Sesi Pembayaran'
                          : 'Nomor Virtual Account'}
                  </div>
                  
                  {vaResult.channelName.includes('QRIS') && vaResult.paymentCode && vaResult.paymentCode.startsWith('000201') ? (
                    <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl w-fit mx-auto shadow-inner my-2">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(vaResult.paymentCode)}`}
                        alt="QRIS Code"
                        className="w-40 h-40 sm:w-48 sm:h-48 rounded-lg"
                      />
                      <span className="text-[10px] text-slate-700 font-bold mt-1">Scan dengan BCA, GoPay, OVO, Dana, ShopeePay</span>
                    </div>
                  ) : (
                    <div className="text-xl sm:text-2xl font-black text-amber-400 tracking-wider font-mono break-all px-2">
                      {vaResult.paymentCode}
                    </div>
                  )}

                  <button
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition mt-2"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copied ? 'Tersalin!' : vaResult.channelName.includes('QRIS') ? 'Salin Kode QRIS' : 'Salin Nomor'}</span>
                  </button>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-400 border-t border-slate-800/80 pt-3">
                  <span>Total Tagihan:</span>
                  <span className="text-base font-black text-emerald-400">
                    Rp {vaResult.amount.toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span>No. Invoice:</span>
                  <span className="font-mono text-slate-300">{vaResult.invoiceNumber}</span>
                </div>
              </div>

              <div className="space-y-3">
                {vaResult.howToPayUrl && (
                  <div className="space-y-2">
                    <a
                      href={vaResult.howToPayUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-center py-3 px-4 bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-xs font-extrabold rounded-xl shadow-md transition flex items-center justify-center gap-2"
                    >
                      <Wallet className="w-4 h-4" />
                      <span>
                        {vaResult.channelName.includes('QRIS') 
                          ? 'Buka Layar QRIS / Bayar DOKU ↗' 
                          : vaResult.channelName.includes('Google') 
                            ? 'Buka Portal Google Pay ↗' 
                            : vaResult.channelName.includes('Akulaku')
                              ? 'Buka Akulaku PayLater ↗'
                              : 'Buka Aplikasi / Portal Pembayaran DOKU ↗'}
                      </span>
                    </a>
                    <p className="text-[11px] text-slate-400 text-center">
                      {vaResult.channelName.includes('QRIS')
                        ? 'Atau gunakan aplikasi mobile banking / e-wallet apa saja untuk memindai kode QRIS di atas.'
                        : vaResult.channelName.includes('Akulaku')
                          ? 'Klik tombol di atas untuk membuka aplikasi Akulaku dan menyelesaikan cicilan PayLater Anda.'
                          : 'Atau salin nomor rekening DOKU di atas untuk transfer dari aplikasi e-Wallet / m-Banking Anda.'}
                    </p>
                  </div>
                )}

                {checkStatusMessage && (
                  <div className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
                    checkStatusMessage.includes('BERHASIL')
                      ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-300'
                      : 'bg-amber-950/80 border border-amber-800 text-amber-300'
                  }`}>
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{checkStatusMessage}</span>
                  </div>
                )}

                <button
                  type="button"
                  disabled={isCheckingPayment}
                  onClick={handleCheckPaymentStatus}
                  className="w-full py-3.5 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-extrabold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isCheckingPayment ? (
                    'Mengecek Status Pembayaran ke DOKU...'
                  ) : (
                    'Cek Status Pembayaran (Sudah Bayar)'
                  )}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Packages Grid */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  1. Pilih Paket Simulasi:
                </label>

                <div className="grid grid-cols-1 gap-3">
                  {packages.map((pkg) => {
                    const isSelected = selectedPkg?.id === pkg.id;
                    const durationText = pkg.durationHours
                      ? `${pkg.durationHours} Jam Akses Penuh`
                      : `${pkg.durationDays} Hari Akses Unlimited`;

                    return (
                      <div
                        key={pkg.id}
                        onClick={() => setSelectedPkg(pkg)}
                        className={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between relative ${
                          pkg.firstTimeOnly
                            ? isSelected
                              ? 'bg-gradient-to-r from-amber-950/60 via-red-950/40 to-slate-900 border-amber-500 shadow-lg ring-2 ring-amber-500/30'
                              : 'bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900 border-amber-600/60 hover:border-amber-500'
                            : isSelected
                            ? 'bg-indigo-950/40 border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                            : 'bg-slate-800/40 border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        {pkg.badge ? (
                          <span className="absolute -top-2.5 right-4 bg-gradient-to-r from-amber-400 via-rose-500 to-red-500 text-slate-950 font-black text-[10px] px-3 py-0.5 rounded-full shadow-lg uppercase tracking-wider animate-bounce">
                            ✨ {pkg.badge}
                          </span>
                        ) : pkg.popular ? (
                          <span className="absolute -top-2.5 right-4 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full shadow uppercase tracking-wider">
                            Paling Laris
                          </span>
                        ) : null}

                        <div className="space-y-1">
                          <div className="font-bold text-sm text-white flex items-center gap-2">
                            {pkg.name}
                            {pkg.firstTimeOnly && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/40">
                                1x Promo
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                            {pkg.description}
                          </p>
                        </div>

                        <div className="text-right">
                          <div className={`text-base font-extrabold ${pkg.firstTimeOnly ? 'text-amber-400 font-mono text-lg' : 'text-indigo-400'}`}>
                            Rp {pkg.price.toLocaleString('id-ID')}
                          </div>
                          <div className={`text-[11px] font-semibold ${pkg.firstTimeOnly ? 'text-amber-300' : 'text-emerald-400'}`}>
                            {durationText}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* DOKU Active Channels Selector */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  2. Pilih Metode Pembayaran DOKU (Status: Aktif):
                </label>

                {/* e-Wallet & Digital Payment Category */}
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-rose-400" /> Dompet Digital & Instan:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-2.5">
                    <button
                      type="button"
                      onClick={() => setSelectedChannel('DOKU_EWALLET')}
                      className={`p-2.5 sm:p-3 rounded-xl border text-xs font-bold flex flex-col sm:flex-row items-center sm:items-center text-center sm:text-left gap-2 sm:gap-3 transition ${
                        selectedChannel === 'DOKU_EWALLET'
                          ? 'bg-rose-950/60 border-rose-500 shadow ring-1 ring-rose-500/30 text-white'
                          : 'bg-slate-800/40 border-slate-700 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                        <Wallet className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-extrabold text-white text-[11px] sm:text-xs truncate">DOKU Wallet</div>
                        <div className="text-[9px] sm:text-[10px] text-slate-400 font-normal truncate">App DOKU</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedChannel('QRIS')}
                      className={`p-2.5 sm:p-3 rounded-xl border text-xs font-bold flex flex-col sm:flex-row items-center sm:items-center text-center sm:text-left gap-2 sm:gap-3 transition ${
                        selectedChannel === 'QRIS'
                          ? 'bg-red-950/60 border-red-500 shadow ring-1 ring-red-500/30 text-white'
                          : 'bg-slate-800/40 border-slate-700 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
                        <QrCode className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-extrabold text-white text-[11px] sm:text-xs truncate">QRIS Instan</div>
                        <div className="text-[9px] sm:text-[10px] text-slate-400 font-normal truncate">Semua e-Wallet</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedChannel('GOOGLE_PAY')}
                      className={`p-2.5 sm:p-3 rounded-xl border text-xs font-bold flex flex-col sm:flex-row items-center sm:items-center text-center sm:text-left gap-2 sm:gap-3 transition ${
                        selectedChannel === 'GOOGLE_PAY'
                          ? 'bg-blue-950/60 border-blue-500 shadow ring-1 ring-blue-500/30 text-white'
                          : 'bg-slate-800/40 border-slate-700 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-extrabold text-white text-[11px] sm:text-xs truncate">Google Pay</div>
                        <div className="text-[9px] sm:text-[10px] text-slate-400 font-normal truncate">Kartu/GPay</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedChannel('AKULAKU')}
                      className={`p-2.5 sm:p-3 rounded-xl border text-xs font-bold flex flex-col sm:flex-row items-center sm:items-center text-center sm:text-left gap-2 sm:gap-3 transition ${
                        selectedChannel === 'AKULAKU'
                          ? 'bg-emerald-950/60 border-emerald-500 shadow ring-1 ring-emerald-500/30 text-white'
                          : 'bg-slate-800/40 border-slate-700 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-extrabold text-white text-[11px] sm:text-xs truncate">Akulaku</div>
                        <div className="text-[9px] sm:text-[10px] text-slate-400 font-normal truncate">PayLater Cicil</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Virtual Accounts */}
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-400" /> Virtual Account Bank (Realtime Terbuka):
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-2.5">
                    {[
                      { id: 'BRI', name: 'BRI VA', color: 'text-blue-400' },
                      { id: 'BNI', name: 'BNI VA', color: 'text-amber-400' },
                      { id: 'BSI', name: 'BSI Syariah', color: 'text-teal-400' },
                      { id: 'CIMB', name: 'CIMB Niaga', color: 'text-red-400' },
                      { id: 'DANAMON', name: 'Danamon', color: 'text-emerald-400' },
                      { id: 'MAYBANK', name: 'Maybank', color: 'text-yellow-400' }
                    ].map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setSelectedChannel(b.id)}
                        className={`p-2 sm:p-2.5 rounded-xl border text-[11px] sm:text-xs font-bold flex flex-col items-center justify-center gap-1 transition ${
                          selectedChannel === b.id
                            ? 'bg-indigo-950/60 border-indigo-500 shadow ring-1 ring-indigo-500/30 text-white'
                            : 'bg-slate-800/40 border-slate-700 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        <CreditCard className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${b.color}`} />
                        <span className="truncate w-full text-center">{b.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Retail Store */}
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-amber-400" /> Gerai Retail (Bayar di Kasir):
                  </span>
                  <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                    {[
                      { id: 'ALFAMART', name: 'Alfamart' },
                      { id: 'INDOMARET', name: 'Indomaret' }
                    ].map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelectedChannel(r.id as any)}
                        className={`p-2.5 sm:p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                          selectedChannel === r.id
                            ? 'bg-red-950/50 border-red-500 shadow ring-1 ring-red-500/30 text-white'
                            : 'bg-slate-800/40 border-slate-700 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        <Store className="w-4 h-4 text-amber-400" />
                        <span>{r.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 sm:p-3.5 bg-red-950/80 border border-red-800 text-red-300 rounded-xl sm:rounded-2xl text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="p-3 sm:p-3.5 bg-slate-800/60 rounded-xl sm:rounded-2xl border border-slate-700 text-[11px] sm:text-xs text-slate-300 flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" />
                <span>
                  Terhubung langsung dengan server DOKU Payment Gateway Live. Nomor Virtual Account & Kode Bayar kasir diterbitkan instan.
                </span>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!vaResult && (
          <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 flex flex-row items-center justify-between gap-2 shrink-0">
            <div>
              <div className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-wider">Total Tagihan:</div>
              <div className="text-base sm:text-lg font-extrabold text-white">
                Rp {selectedPkg?.price.toLocaleString('id-ID')}
              </div>
            </div>

            <button
              onClick={handlePay}
              disabled={isProcessing || !selectedPkg}
              className="py-2.5 px-4 sm:py-3 sm:px-6 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-extrabold text-xs rounded-xl shadow-lg transition flex items-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? 'Memproses...' : `Bayar via ${selectedChannel}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
