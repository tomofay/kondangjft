'use client';

import React from 'react';
import { User } from '../types';
import { Lock, LogOut, Zap, Sparkles } from 'lucide-react';

import { isSubscriptionActive, getRemainingDays } from '../lib/dataStore';

interface NavbarProps {
  user: User;
  onOpenBuyCredits: () => void;
  onSwitchRole: (targetRole: 'user' | 'admin') => void;
  onLogout: () => void;
  activeView: 'dashboard' | 'exam' | 'report' | 'review' | 'admin';
  onChangeView: (view: 'dashboard' | 'admin') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onOpenBuyCredits,
  onSwitchRole,
  onLogout,
  activeView,
  onChangeView
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onChangeView('dashboard')}>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 flex items-center justify-center font-extrabold text-white text-lg shadow-lg shadow-red-500/20">
            JFT
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-black text-lg tracking-tight text-white">
              Kondang<span className="text-red-500">Sensei</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800">
                JFT-Basic CBT
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">Simulasi Ujian Japan Foundation Test</p>
          </div>
        </div>

        {/* Center: Navigation Links */}
        <div className="hidden md:flex items-center gap-2 bg-slate-950/60 p-1 rounded-2xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => onChangeView('dashboard')}
            className={`px-4 py-2 rounded-xl transition ${
              activeView !== 'admin'
                ? 'bg-slate-800 text-white font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Dashboard Peserta
          </button>
          {user.role === 'admin' && (
            <button
              onClick={() => onChangeView('admin')}
              className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
                activeView === 'admin'
                  ? 'bg-indigo-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Portal Admin
            </button>
          )}
        </div>

        {/* Right side: Session status & Profile */}
        <div className="flex items-center gap-3 text-xs">
          {/* Single Session Lock Status Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 text-[11px] font-medium shadow-inner">
            <Lock className="w-3.5 h-3.5" />
            <span>1 Sesi Aktif (Locked)</span>
          </div>

          {/* Subscription Status Badge */}
          {user.role === 'user' && (
            <button
              onClick={onOpenBuyCredits}
              className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5 transition"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              <span>
                {isSubscriptionActive(user)
                  ? `Unlimited (${getRemainingDays(user)} Hari)`
                  : 'Masa Aktif Habis (Beli Paket)'}
              </span>
            </button>
          )}

          {/* Role Switcher Demo */}
          <div className="flex items-center bg-slate-800 rounded-xl p-0.5 border border-slate-700">
            <button
              onClick={() => onSwitchRole('user')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                user.role === 'user' ? 'bg-slate-700 text-white shadow' : 'text-slate-400'
              }`}
            >
              Peserta
            </button>
            <button
              onClick={() => onSwitchRole('admin')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                user.role === 'admin' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'
              }`}
            >
              Admin
            </button>
          </div>

          {/* Logout */}
          <button
            onClick={onLogout}
            title="Keluar"
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
