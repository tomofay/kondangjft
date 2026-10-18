'use client';

import React, { useState } from 'react';
import { User } from '../types';
import {
  Lock,
  LogOut,
  Zap,
  GraduationCap,
  LayoutDashboard,
  ShieldCheck,
  Clock,
  Menu,
  X
} from 'lucide-react';
import { isSubscriptionActive, getRemainingSubscriptionText } from '../lib/dataStore';

interface NavbarProps {
  user: User;
  onOpenBuyCredits: () => void;
  onOpenProfile?: () => void;
  onOpenPendingPayments?: () => void;
  pendingCount?: number;
  onSwitchRole?: (targetRole: 'user' | 'admin') => void;
  onLogout: () => void;
  activeView: 'dashboard' | 'exam' | 'report' | 'review' | 'admin';
  onChangeView: (view: 'dashboard' | 'admin') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onOpenBuyCredits,
  onOpenProfile,
  onOpenPendingPayments,
  pendingCount = 0,
  onLogout,
  activeView,
  onChangeView
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2">
        {/* Brand */}
        <div
          className="flex items-center gap-2.5 cursor-pointer select-none group shrink-0"
          onClick={() => {
            onChangeView('dashboard');
            setMobileMenuOpen(false);
          }}
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-red-500 via-rose-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-red-500/20 group-hover:scale-105 transition-transform duration-200 shrink-0">
            <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-black text-base sm:text-lg tracking-tight text-white leading-none">
              <span>Kondang<span className="text-red-500">Sensei</span></span>
              <span className="text-[9px] sm:text-[10px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full bg-red-950/80 text-red-400 border border-red-800/80 uppercase">
                CBT
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium hidden md:block">
              Simulasi Ujian CBT Bahasa Jepang KondangSensei
            </p>
          </div>
        </div>

        {/* Center: Navigation Links (Desktop) */}
        <div className="hidden md:flex items-center gap-1.5 bg-slate-950/70 p-1.5 rounded-2xl border border-slate-800/90 text-xs font-semibold">
          <button
            onClick={() => onChangeView('dashboard')}
            className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              activeView !== 'admin'
                ? 'bg-slate-800 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-indigo-400" />
            Dashboard Peserta
          </button>
          {user.role === 'admin' && (
            <button
              onClick={() => onChangeView('admin')}
              className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                activeView === 'admin'
                  ? 'bg-indigo-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
              Portal Admin
            </button>
          )}
        </div>

        {/* Right side: Session status & Profile & Mobile Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 text-xs shrink-0">
          {/* Single Session Lock Status Badge (Desktop Large) */}
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 text-[11px] font-medium shadow-inner">
            <Lock className="w-3.5 h-3.5" />
            <span>1 Sesi Aktif</span>
          </div>

          {/* Pending Invoices Button */}
          {user.role === 'user' && onOpenPendingPayments && (
            <button
              onClick={onOpenPendingPayments}
              className={`px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-xl border flex items-center gap-1 sm:gap-1.5 transition ${
                pendingCount > 0
                  ? 'bg-amber-950/60 border-amber-600/80 text-amber-300 hover:bg-amber-900/60 animate-pulse'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title="Cek tagihan pending & nomor pembayaran"
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Tagihan</span>
              <span className="font-bold">({pendingCount})</span>
            </button>
          )}

          {/* Subscription Status Badge */}
          {user.role === 'user' && (
            <button
              onClick={onOpenBuyCredits}
              className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-md flex items-center gap-1 sm:gap-1.5 transition text-[11px] sm:text-xs"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300 shrink-0" />
              <span className="hidden sm:inline">
                {isSubscriptionActive(user)
                  ? `Unlimited (${getRemainingSubscriptionText(user)})`
                  : '0 Hari (Beli Paket)'}
              </span>
              <span className="sm:hidden font-bold">
                {isSubscriptionActive(user)
                  ? getRemainingSubscriptionText(user).split(' ')[0]
                  : 'Beli'}
              </span>
            </button>
          )}

          {/* User Profile Button with Avatar */}
          {onOpenProfile && (
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 hover:text-white rounded-xl border border-slate-700/80 transition shadow-sm group"
              title="Edit Profil Peserta & Data Sertifikat"
            >
              <div className="w-7 h-7 sm:w-6 sm:h-6 rounded-lg overflow-hidden border border-slate-600 bg-slate-700 shrink-0">
                {user.facePhotoUrl ? (
                  <img
                    src={user.facePhotoUrl}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-indigo-900/60 text-indigo-300 text-[10px] font-bold">
                    {user.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="font-bold text-slate-200 text-[11px] truncate max-w-[100px] leading-tight group-hover:text-indigo-300 transition-colors">
                  {user.name}
                </span>
                <span className="text-[9px] text-slate-400 capitalize leading-tight">
                  {user.role === 'admin' ? 'Superadmin' : 'Peserta'}
                </span>
              </div>
            </button>
          )}

          {/* Desktop Logout Button */}
          <button
            onClick={onLogout}
            title="Keluar Akun"
            className="hidden sm:flex p-2 text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded-xl transition items-center gap-1.5 border border-transparent hover:border-red-900/40"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-xs hidden md:inline font-semibold">Keluar</span>
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-xl border border-slate-700 transition md:hidden"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-red-400" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer / Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900/98 px-4 py-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
            <span className="font-semibold text-slate-200">{user.name}</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-bold text-slate-300 uppercase">
              {user.role === 'admin' ? 'Superadmin' : 'Peserta CBT'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
            <button
              onClick={() => {
                onChangeView('dashboard');
                setMobileMenuOpen(false);
              }}
              className={`p-2.5 rounded-xl transition flex items-center justify-center gap-2 ${
                activeView !== 'admin'
                  ? 'bg-slate-800 text-white font-bold border border-slate-700'
                  : 'text-slate-400 hover:text-white bg-slate-950/50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-indigo-400" />
              Dashboard
            </button>

            {user.role === 'admin' && (
              <button
                onClick={() => {
                  onChangeView('admin');
                  setMobileMenuOpen(false);
                }}
                className={`p-2.5 rounded-xl transition flex items-center justify-center gap-2 ${
                  activeView === 'admin'
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white bg-slate-950/50'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-amber-300" />
                Portal Admin
              </button>
            )}
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
              <Lock className="w-3.5 h-3.5" />
              <span>1 Sesi Terkunci</span>
            </div>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onLogout();
              }}
              className="px-3 py-1.5 bg-red-950/60 hover:bg-red-900/60 text-red-300 rounded-xl font-bold text-xs flex items-center gap-1.5 transition border border-red-800/60"
            >
              <LogOut className="w-3.5 h-3.5" />
              Keluar Akun
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

