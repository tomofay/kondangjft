'use client';

import React from 'react';
import { ShieldAlert, RefreshCw, HelpCircle } from 'lucide-react';

interface SingleSessionLockModalProps {
  isOpen: boolean;
  message?: string;
  onRelogin: () => void;
}

export const SingleSessionLockModal: React.FC<SingleSessionLockModalProps> = ({
  isOpen,
  message,
  onRelogin
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="max-w-md w-full bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-stone-200 overflow-hidden text-center p-5 sm:p-7 space-y-4 sm:space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-red-600 mx-auto flex items-center justify-center animate-bounce">
          <ShieldAlert className="w-9 h-9" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl font-black text-stone-900">
            Sesi Akun Terputus (Sesi Tunggal CBT)
          </h2>
          <p className="text-xs text-stone-600 leading-relaxed">
            {message ||
              'Akun Anda telah diakses di perangkat atau browser lain. Sistem KondangSensei membatasi 1 sesi aktif bersamaan per akun untuk menjaga keabsahan simulasi ujian.'}
          </p>
        </div>

        <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-800 text-left space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
            Mengapa hal ini terjadi?
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] opacity-90 font-medium">
            <li>Seseorang sedang membuka akun Anda di tab atau browser lain.</li>
            <li>Sistem otomatis mengamankan sesi ujian agar tidak terjadi bentrok jawaban.</li>
          </ul>
        </div>

        <div className="pt-2">
          <button
            onClick={onRelogin}
            className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl shadow-xs transition flex items-center justify-center gap-2 text-xs cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Ambil Alih & Masuk Kembali di Perangkat Ini
          </button>
        </div>
      </div>
    </div>
  );
};
