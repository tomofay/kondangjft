'use client';

import React from 'react';
import { ShieldAlert, LogOut, RefreshCw } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-red-500/30 overflow-hidden text-center p-6 space-y-5">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center animate-bounce">
          <ShieldAlert className="w-9 h-9" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Sesi Akun Terputus (1 Sesi Per Waktu)
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {message ||
              'Akun Anda telah diakses di perangkat atau browser lain. Sistem KondangSensei membatasi 1 sesi aktif bersamaan per akun untuk menjaga keabsahan ujian.'}
          </p>
        </div>

        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 text-left space-y-1">
          <p className="font-semibold flex items-center gap-1">
            💡 Mengapa hal ini terjadi?
          </p>
          <ul className="list-disc list-inside space-y-0.5 opacity-90">
            <li>Seseorang sedang menggunakan akun Anda di tab/device lain.</li>
            <li>Sharing akun dilarang untuk keamanan lisensi tryout.</li>
          </ul>
        </div>

        <div className="pt-2 flex flex-col gap-2">
          <button
            onClick={onRelogin}
            className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-semibold rounded-xl shadow-lg shadow-red-500/25 transition flex items-center justify-center gap-2 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Ambil Alih & Login Kembali di Device Ini
          </button>
        </div>
      </div>
    </div>
  );
};
