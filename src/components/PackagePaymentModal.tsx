'use client';

import React, { useState } from 'react';
import { TryoutPackage } from '../types';
import { CreditCard, QrCode, ShieldCheck, Zap, X } from 'lucide-react';

interface PackagePaymentModalProps {
  isOpen: boolean;
  packages: TryoutPackage[];
  onClose: () => void;
  onPaymentSuccess: (packageId: string, paymentMethod: string) => void;
}

export const PackagePaymentModal: React.FC<PackagePaymentModalProps> = ({
  isOpen,
  packages,
  onClose,
  onPaymentSuccess
}) => {
  const [selectedPkg, setSelectedPkg] = useState<TryoutPackage | null>(packages[1] || packages[0] || null);
  const [paymentMethod, setPaymentMethod] = useState<'QRIS' | 'VA_BCA' | 'VA_MANDIRI'>('QRIS');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handlePay = async () => {
    if (!selectedPkg) return;
    setIsProcessing(true);
    try {
      await new Promise((res) => setTimeout(res, 1200)); // Simulate gateway delay
      onPaymentSuccess(selectedPkg.id, paymentMethod === 'QRIS' ? 'QRIS Instant' : paymentMethod);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="max-w-xl w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Beli Paket Tryout JFT-Basic</h2>
              <p className="text-xs text-slate-400">Pilih paket latihan & nikmati simulasi CBT lengkap</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Packages Grid */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              1. Pilih Paket Simulasi:
            </label>

            <div className="grid grid-cols-1 gap-3">
              {packages.map((pkg) => {
                const isSelected = selectedPkg?.id === pkg.id;

                return (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPkg(pkg)}
                    className={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between relative ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-600 dark:border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {pkg.popular && (
                      <span className="absolute -top-2.5 right-4 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full shadow uppercase tracking-wider">
                        Paling Laris
                      </span>
                    )}

                    <div className="space-y-1">
                      <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        {pkg.name}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
                        {pkg.description}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">
                        Rp {pkg.price.toLocaleString('id-ID')}
                      </div>
                      <div className="text-[11px] font-semibold text-emerald-500">{pkg.durationDays} Hari Akses Unlimited</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Method Selector (Mock Gateway) */}
          <div className="space-y-3 pt-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              2. Metode Pembayaran (Simulasi Payment Gateway):
            </label>

            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('QRIS')}
                className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition ${
                  paymentMethod === 'QRIS'
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900 shadow'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                <QrCode className="w-5 h-5 text-emerald-500" />
                <span>QRIS Instant</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('VA_BCA')}
                className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition ${
                  paymentMethod === 'VA_BCA'
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900 shadow'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                <CreditCard className="w-5 h-5 text-blue-500" />
                <span>BCA Virtual</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('VA_MANDIRI')}
                className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition ${
                  paymentMethod === 'VA_MANDIRI'
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900 shadow'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                <CreditCard className="w-5 h-5 text-amber-500" />
                <span>Mandiri VA</span>
              </button>
            </div>
          </div>

          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-500 shrink-0" />
            <span>
              Gateway siap dihubungkan dengan Midtrans / Xendit. Untuk mode tes saat ini, klik bayar langsung membuka paket!
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Total Bayar:</div>
            <div className="text-lg font-extrabold text-slate-900 dark:text-white">
              Rp {selectedPkg?.price.toLocaleString('id-ID')}
            </div>
          </div>

          <button
            onClick={handlePay}
            disabled={isProcessing || !selectedPkg}
            className="py-3 px-6 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? 'Memproses Gateway...' : 'Bayar Sekarang (Instant Unlock)'}
          </button>
        </div>
      </div>
    </div>
  );
};
