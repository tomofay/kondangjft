'use client';

import React, { useState } from 'react';
import { User } from '../types';
import {
  LogOut,
  Zap,
  GraduationCap,
  LayoutDashboard,
  ShieldCheck,
  Clock,
  Menu,
  X,
  Sparkles
} from 'lucide-react';
import { isSubscriptionActive, getRemainingSubscriptionText, DEFAULT_ANONYMOUS_PHOTO } from '../lib/dataStore';

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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/90 text-stone-900 shadow-xs">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 py-2 sm:py-3 flex items-center justify-between gap-2 sm:gap-3">
        {/* Brand with Colorful KondangSensei Styling */}
        <div
          className={`flex items-center gap-2 sm:gap-2.5 select-none group shrink-0 ${
            activeView === 'exam' ? 'cursor-default' : 'cursor-pointer'
          }`}
          onClick={() => {
            if (activeView !== 'exam') {
              onChangeView('dashboard');
              setMobileMenuOpen(false);
            }
          }}
        >
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-white border border-stone-200/90 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform duration-200 shrink-0 p-0.5 overflow-hidden">
            <img src="/logo-icon.png" alt="KondangSensei Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-1 sm:gap-1.5 font-black text-sm sm:text-lg tracking-tight text-stone-900 leading-none">
              <span>Kondang<span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-amber-600 to-sky-600">Sensei</span></span>
              <span className="hidden xs:inline-block text-[9px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 rounded-full bg-gradient-to-r from-rose-50 via-amber-50 to-sky-50 text-stone-800 border border-stone-200 uppercase tracking-wider">
                KondangSensei CBT
              </span>
            </div>
            <p className="text-[10px] text-stone-500 font-medium hidden md:block">
              日本語能力試験 • KondangSensei Simulasi CBT JFT-Basic
            </p>
          </div>
        </div>

        {/* Center: Admin Portal Shortcut (Only visible for admin, Dashboard Peserta button removed) */}
        {user.role === 'admin' && activeView !== 'exam' && (
          <div className="hidden md:flex items-center">
            <button
              onClick={() => onChangeView(activeView === 'admin' ? 'dashboard' : 'admin')}
              className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold ${
                activeView === 'admin'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black shadow-xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200/90'
              }`}
            >
              <ShieldCheck className={`w-3.5 h-3.5 ${activeView === 'admin' ? 'text-amber-300' : 'text-indigo-600'}`} />
              {activeView === 'admin' ? 'Kembali ke Beranda' : 'Portal Admin'}
            </button>
          </div>
        )}

        {/* Right side: Session status & Profile & Mobile Toggle */}
        <div className="flex items-center gap-1 sm:gap-2 text-xs shrink-0">
          {/* Pending Invoices Button (Pill Styled & Always Visible) */}
          {onOpenPendingPayments && (
            <button
              onClick={onOpenPendingPayments}
              className={`px-2 sm:px-3 py-1.5 rounded-full border flex items-center gap-1 sm:gap-1.5 transition text-[11px] sm:text-xs font-bold shadow-xs cursor-pointer ${
                pendingCount > 0
                  ? 'bg-amber-500/15 border-amber-500/50 text-amber-900 hover:bg-amber-500/25 animate-pulse'
                  : 'bg-stone-100/90 border-stone-300 text-stone-700 hover:text-stone-900 hover:bg-stone-200/80'
              }`}
              title="Cek daftar tagihan pending & nomor pembayaran"
            >
              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="hidden xs:inline">Tagihan</span>
              <strong className="text-amber-700 font-black">({pendingCount})</strong>
            </button>
          )}

          {/* Subscription Status Badge with Colorful Sunrise Accent */}
          {user.role === 'user' && (
            <button
              onClick={onOpenBuyCredits}
              className="px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-bold rounded-xl shadow-xs shadow-orange-500/20 flex items-center gap-1 sm:gap-1.5 transition text-[11px] sm:text-xs cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-200 fill-amber-200 shrink-0" />
              <span className="hidden sm:inline">
                {isSubscriptionActive(user)
                  ? `Paket Aktif (${getRemainingSubscriptionText(user)})`
                  : 'Masa Aktif Habis (Beli)'}
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
              className="flex items-center gap-1.5 sm:gap-2 px-1.5 py-1 sm:px-2.5 sm:py-1.5 bg-stone-50 hover:bg-stone-100 text-stone-700 hover:text-stone-900 rounded-xl border border-stone-200 transition shadow-2xs group cursor-pointer"
              title="Edit Profil Peserta & Data Sertifikat"
            >
              <div className="w-7 h-7 sm:w-7 sm:h-7 rounded-lg overflow-hidden border border-stone-300 bg-stone-200 shrink-0">
                <img
                  src={
                    user.facePhotoUrl && !user.facePhotoUrl.includes('unsplash.com')
                      ? user.facePhotoUrl
                      : DEFAULT_ANONYMOUS_PHOTO
                  }
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="font-bold text-stone-900 text-[11px] truncate max-w-[110px] leading-tight group-hover:text-red-600 transition-colors">
                  {user.name} さん
                </span>
                <span className="text-[9px] text-stone-500 capitalize leading-tight">
                  {user.role === 'admin' ? 'Super Admin' : 'Peserta CBT'}
                </span>
              </div>
            </button>
          )}

          {/* Desktop Logout Button */}
          <button
            onClick={onLogout}
            title="Keluar Akun"
            className="hidden sm:flex p-2 text-stone-500 hover:text-red-600 hover:bg-rose-50 rounded-xl transition items-center gap-1.5 border border-transparent hover:border-rose-200"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-xs hidden md:inline font-bold">Keluar</span>
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl border border-stone-200 transition md:hidden cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-red-600" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer / Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stone-200 bg-white px-4 py-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150 shadow-md">
          <div className="flex items-center justify-between text-xs text-stone-500 pb-2 border-b border-stone-100">
            <span className="font-bold text-stone-900">{user.name} さん</span>
            <span className="px-2 py-0.5 rounded-md bg-stone-100 text-[10px] font-extrabold text-stone-600 uppercase">
              {user.role === 'admin' ? 'Super Admin' : 'Peserta CBT'}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2 text-xs font-semibold">
            {onOpenProfile && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenProfile();
                }}
                className="p-2.5 rounded-xl transition flex items-center justify-center gap-2 border bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                Edit Profil & Sertifikat
              </button>
            )}

            {onOpenPendingPayments && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenPendingPayments();
                }}
                className={`p-2.5 rounded-xl transition flex items-center justify-center gap-2 border cursor-pointer ${
                  pendingCount > 0
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-900 font-bold'
                    : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <Clock className="w-4 h-4 text-amber-600" />
                Daftar Tagihan ({pendingCount})
              </button>
            )}

            {user.role === 'admin' && activeView !== 'exam' && (
              <button
                onClick={() => {
                  onChangeView(activeView === 'admin' ? 'dashboard' : 'admin');
                  setMobileMenuOpen(false);
                }}
                className={`p-2.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                  activeView === 'admin'
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold'
                    : 'text-stone-600 hover:text-stone-900 bg-stone-50 hover:bg-stone-100'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-amber-300" />
                {activeView === 'admin' ? 'Kembali ke Beranda' : 'Portal Admin'}
              </button>
            )}
          </div>

          <div className="pt-2 border-t border-stone-100 flex items-center justify-end">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onLogout();
              }}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-red-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition border border-rose-200 cursor-pointer"
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
