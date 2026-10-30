'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Zap,
  Volume2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Award,
  BookOpen,
  Flame,
  Clock,
  Play
} from 'lucide-react';
import { MiniTryoutExperience } from '@/components/MiniTryoutExperience';
import { PackagePaymentModal } from '@/components/PackagePaymentModal';
import { DEFAULT_PACKAGES } from '@/lib/dataStore';

export default function TryoutJftPage() {
  const [miniTryoutActive, setMiniTryoutActive] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  // Schema.org Structured Data (Quiz)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    name: 'Mini Tryout JFT-Basic A2 Gratis 12 Soal Resmi',
    description:
      'Uji kesiapan ujian JFT-Basic A2 Anda dalam 15 menit dengan 12 butir soal asli: Moji/Goi, Kaiwa, Chōkai Audio, dan Dokkai. Skor instan skala 250 & laporan kelemahan langsung!',
    educationalLevel: 'Beginner / CEFR A2',
    provider: {
      '@type': 'Organization',
      name: 'KondangSensei',
      sameAs: 'https://kondangsensei.my.id'
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-stone-900 font-sans selection:bg-rose-100 selection:text-rose-900">
      {/* JSON-LD Script for Google SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-stone-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white border border-stone-200 flex items-center justify-center p-1 shadow-2xs">
              <img src="/logo-icon.png" alt="KondangSensei" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="text-base sm:text-xl font-black text-stone-950 tracking-tight leading-none">
                Kondang<span className="text-red-600">Sensei</span>
              </div>
              <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider font-japanese">
                CBT JFT-Basic A2 Tryout
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/kelas-n5"
              className="text-xs font-bold text-stone-600 hover:text-red-600 transition hidden sm:inline-block"
            >
              Kelas Bimbel N5 →
            </Link>
            <button
              onClick={() => setMiniTryoutActive(true)}
              className="py-2 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-xs font-black rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Mulai Tes Gratis</span>
            </button>
          </div>
        </div>
      </header>

      {/* If Mini Tryout Engine is Active, render full engine */}
      {miniTryoutActive ? (
        <div className="py-6 px-4">
          <MiniTryoutExperience
            onClose={() => setMiniTryoutActive(false)}
            onOpenFullPackagePayment={() => {
              setMiniTryoutActive(false);
              setPaymentModalOpen(true);
            }}
          />
        </div>
      ) : (
        <>
          {/* Hero Section */}
          <section className="relative pt-12 pb-16 overflow-hidden bg-gradient-to-b from-rose-50/40 via-white to-[#f8fafc]">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 text-center">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-100 text-red-700 text-xs font-black uppercase tracking-wider shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-red-600" />
                <span>Lead Magnet Gratis: Standar Resmi Prometric Japan Foundation</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-stone-900 tracking-tight leading-tight">
                Mini Tryout JFT-Basic A2{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-600">
                  12 Soal Asli + Audio Chōkai
                </span>
              </h1>

              <p className="text-sm sm:text-base text-stone-600 max-w-2xl mx-auto leading-relaxed">
                Ketahui kesiapan Anda sebelum mendaftar ujian resmi Tokutei Ginou / SSW. Cukup 15 menit pengerjaan, skor langsung keluar dalam <strong>skala 250</strong> lengkap dengan analisis kelemahan per seksi!
              </p>

              {/* Action Button */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => setMiniTryoutActive(true)}
                  className="w-full sm:w-auto py-4 px-8 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-red-500/25 transition flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Mulai Mini Tryout Sekarang (Gratis 100%)</span>
                </button>

                <button
                  onClick={() => setPaymentModalOpen(true)}
                  className="w-full sm:w-auto py-4 px-6 bg-white hover:bg-stone-50 text-stone-800 font-bold text-sm rounded-2xl border border-stone-200 transition shadow-2xs cursor-pointer"
                >
                  Beli 5 Paket Simulasi Full
                </button>
              </div>

              {/* Composition Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-8 text-left">
                <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs space-y-1">
                  <div className="text-xs font-bold text-stone-400">Seksi 1</div>
                  <div className="text-sm font-black text-stone-900">Moji & Goi</div>
                  <div className="text-xs text-stone-500">3 Soal Huruf & Kosakata</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs space-y-1">
                  <div className="text-xs font-bold text-stone-400">Seksi 2</div>
                  <div className="text-sm font-black text-stone-900">Kaiwa & Hyougen</div>
                  <div className="text-xs text-stone-500">3 Soal Percakapan Kerja</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-rose-200 bg-rose-50/30 shadow-2xs space-y-1">
                  <div className="text-xs font-bold text-red-500 flex items-center gap-1">
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Seksi 3</span>
                  </div>
                  <div className="text-sm font-black text-red-900">Chōkai (Audio)</div>
                  <div className="text-xs text-red-600">3 Soal Maks. 2x Putar</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs space-y-1">
                  <div className="text-xs font-bold text-stone-400">Seksi 4</div>
                  <div className="text-sm font-black text-stone-900">Dokkai</div>
                  <div className="text-xs text-stone-500">3 Soal Pemahaman Bacaan</div>
                </div>
              </div>
            </div>
          </section>

          {/* Diagnostic Features Preview */}
          <section className="py-12 bg-white border-y border-stone-200">
            <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
              <h3 className="text-xl sm:text-2xl font-black text-stone-900">
                Apa yang Anda Dapatkan Setelah Menyelesaikan Mini Tryout?
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <h4 className="text-sm font-black text-stone-900">Skor Konversi Skala 250</h4>
                  <p className="text-xs text-stone-600">
                    Sistem otomatis menghitung persentase ke skala resmi JFT 250 poin dengan indikator kelulusan passing grade (200 poin).
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <h4 className="text-sm font-black text-stone-900">Laporan Diagnostik Kelemahan</h4>
                  <p className="text-xs text-stone-600">
                    Mengetahui seksi mana yang nilainya paling rendah (misal: Chōkai 33%) agar Anda tahu apa yang harus diperbaiki.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <h4 className="text-sm font-black text-stone-900">Akses Pembahasan Soal</h4>
                  <p className="text-xs text-stone-600">
                    Bisa meninjau jawaban benar dan penjelasan pola kalimat dari masing-masing soal yang dikerjakan.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Payment Modal */}
      {paymentModalOpen && (
        <PackagePaymentModal
          isOpen={paymentModalOpen}
          packages={DEFAULT_PACKAGES}
          onClose={() => setPaymentModalOpen(false)}
          onPaymentSuccess={() => {
            setPaymentModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
