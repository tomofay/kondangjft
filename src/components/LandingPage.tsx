'use client';

import React, { useState } from 'react';
import {
  GraduationCap,
  Sparkles,
  Zap,
  Play,
  Award,
  CheckCircle2,
  Volume2,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Star,
  Users,
  Clock,
  FileText,
  CreditCard,
  MessageCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  LogIn,
  UserPlus,
  Check,
  Flame,
  Layers,
  Lock,
  MapPin
} from 'lucide-react';
import { TryoutPackage } from '../types';
import { DEFAULT_PACKAGES } from '../lib/dataStore';

interface LandingPageProps {
  packages: TryoutPackage[];
  onOpenMiniTryout: () => void;
  onOpenLogin: () => void;
  onOpenSignup: () => void;
  onSelectPackage: (pkg: TryoutPackage) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  packages,
  onOpenMiniTryout,
  onOpenLogin,
  onOpenSignup,
  onSelectPackage
}) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Apa itu ujian JFT-Basic A2 dan mengapa perlu simulasi CBT?',
      a: 'JFT-Basic adalah ujian resmi berbasis komputer (CBT) yang mengukur kemampuan bahasa Jepang tingkat A2 untuk syarat visa Tokutei Ginou (Specified Skilled Worker). Format ujian menggunakan komputer dengan timer ketat dan audio Chōkai yang hanya berputar 2 kali tanpa bisa diulang/dijeda. Simulasi CBT KondangSensei dirancang 99% mirip sistem ujian asli agar Anda tidak kaget saat menghadapi tes sebenarnya.'
    },
    {
      q: 'Apakah Mini Tryout 12 Soal benar-benar 100% gratis?',
      a: 'Ya, 100% Gratis tanpa biaya dan tanpa perlu kartu kredit! Cukup masukkan nama dan nomor WhatsApp Anda, Anda langsung dapat mengerjakan 12 butir soal asli (termasuk audio Chōkai) dan mendapatkan skor real-time serta analisis kelemahan utama Anda.'
    },
    {
      q: 'Berapa banyak paket simulasi ujian yang tersedia?',
      a: 'Kami menyediakan 5 Paket Ujian Lengkap (250 butir soal asli) yang mencakup 4 seksi ujian: Moji & Goi, Kaiwa & Hyougen, Chōkai (Audio), dan Dokkai (Bacaan). Setiap paket dilengkapi pembahasan detail serta Lembar Hasil Evaluasi & Sertifikat Resmi (PDF).'
    },
    {
      q: 'Metode pembayaran apa saja yang didukung?',
      a: 'Kami mendukung pembayaran QRIS Instant otomatis. Anda dapat membayar langsung dari aplikasi perbankan (BCA Mobile, Livin Mandiri, BRImo, BNI) maupun e-wallet (GoPay, OVO, DANA, ShopeePay). Akses langsung aktif otomatis dalam hitungan detik setelah bayar!'
    },
    {
      q: 'Apakah lembar hasil evaluasi / sertifikat bisa diunduh ke PDF?',
      a: 'Ya! Setiap kali menyelesaikan simulasi ujian, sistem otomatis menerbitkan Lembar Hasil Evaluasi & Sertifikat resmi yang siap cetak atau diunduh langsung dalam format PDF dan PNG resolusi tinggi.'
    },
    {
      q: 'Apakah peserta atau siswa LPK dari Bogor dan sekitarnya bisa ikut simulasi ini?',
      a: 'Tentu saja! Platform simulasi CBT KondangSensei (kondangsensei.my.id) beroperasi 100% online berbasis web. Peserta mandiri, siswa LPK bahasa Jepang di Kota Bogor, Kabupaten Bogor, Cibinong, Depok, Jabodetabek, hingga seluruh Indonesia dapat berlatih kapan saja langsung dari laptop atau smartphone tanpa perlu instalasi aplikasi.'
    },
    {
      q: 'Bagaimana simulasi ini mempersiapkan peserta asal Bogor untuk menghadapi ujian CBT resmi?',
      a: 'Calon pekerja SSW asal Bogor dan Jawa Barat umumnya mengikuti tes resmi JFT-Basic A2 di pusat tes CBT Jakarta dan sekitarnya. Simulasi CBT KondangSensei dirancang presisi meniru antarmuka ujian CBT komputer asli — termasuk pembagian waktu 60 menit dan audio Chōkai standar resmi (maks. 2x putar) — sehingga peserta sudah terbiasa dan percaya diri saat menghadapi tes sesungguhnya.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-stone-900 font-sans selection:bg-rose-100 selection:text-rose-900">
      {/* ========================================================= */}
      {/* 1. TOP ANNOUNCEMENT BAR */}
      {/* ========================================================= */}
      <div className="bg-gradient-to-r from-stone-900 via-rose-950 to-stone-900 text-white py-2 px-4 text-center text-xs font-semibold flex items-center justify-center gap-2 border-b border-rose-900/30">
        <span className="inline-flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Promo Pengguna Baru: Coba 1 Mini Tryout Gratis (12 Soal) & Skor Real-Time Langsung di Layar!</span>
        </span>
        <button
          onClick={onOpenMiniTryout}
          className="hidden sm:inline-flex underline font-bold text-amber-300 hover:text-white transition cursor-pointer"
        >
          Mulai Sekarang →
        </button>
      </div>

      {/* ========================================================= */}
      {/* 2. LANDING NAVBAR */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-stone-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-red-600 via-rose-600 to-red-700 text-white flex items-center justify-center shadow-md shadow-red-500/20 shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="text-base sm:text-xl font-black text-stone-950 tracking-tight leading-none">
                Kondang<span className="text-red-600">Sensei</span>
              </div>
              <div className="text-[10px] sm:text-[11px] font-bold text-stone-500 tracking-wider uppercase font-japanese">
                CBT 日本語能力判定テスト
              </div>
            </div>
          </div>

          {/* Nav Menu */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-stone-600">
            <a href="#mini-tryout" className="hover:text-red-600 transition">Mini Tryout Gratis</a>
            <a href="#fitur" className="hover:text-red-600 transition">Fitur CBT</a>
            <a href="#paket" className="hover:text-red-600 transition">Paket Simulasi</a>
            <a href="#testimoni" className="hover:text-red-600 transition">Testimoni Siswa</a>
            <a href="#faq" className="hover:text-red-600 transition">FAQ</a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenLogin}
              className="py-2 sm:py-2.5 px-3 sm:px-4 text-xs font-bold text-stone-700 hover:text-red-600 transition cursor-pointer"
            >
              Masuk
            </button>

            <button
              onClick={onOpenMiniTryout}
              className="py-2 sm:py-2.5 px-3.5 sm:px-5 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-xs sm:text-sm font-black rounded-xl sm:rounded-2xl shadow-md shadow-red-500/20 transition flex items-center gap-1.5 cursor-pointer transform hover:-translate-y-0.5"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Tryout Gratis</span>
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 3. HERO SECTION WITH DIRECT FREE TRYOUT CARD */}
      {/* ========================================================= */}
      <section className="relative pt-8 sm:pt-16 pb-12 sm:pb-20 overflow-hidden bg-gradient-to-b from-white via-rose-50/20 to-[#f8fafc]">
        {/* Glow Background Effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-br from-rose-200/30 via-amber-100/20 to-sky-200/20 blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-12">
          {/* Main Hero Header */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-red-700 text-xs font-black uppercase tracking-wider shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-red-600" />
              <span>Platform Simulasi CBT JFT-Basic A2 No. 1 di Indonesia</span>
            </div>

            <h1 className="text-2xl xs:text-3xl sm:text-5xl font-black text-stone-900 tracking-tight leading-tight sm:leading-none">
              Simulasi CBT JFT-Basic A2 — <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-rose-600 to-amber-600">Mirip 99% Ujian Asli</span>
            </h1>

            <p className="text-xs sm:text-base text-stone-600 leading-relaxed max-w-2xl mx-auto">
              Kuasai ujian kerja Tokutei Ginou (SSW) Jepang dengan latihan soal asli, audio Chōkai terstandar, skor real-time, dan lembar hasil evaluasi resmi JFT-Basic A2.
            </p>

            {/* Quick action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={onOpenMiniTryout}
                className="w-full sm:w-auto py-3.5 px-7 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-red-500/25 transition flex items-center justify-center gap-2 transform hover:-translate-y-0.5 cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>Mulai 1 Mini Tryout Gratis (12 Soal)</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href="#paket"
                className="w-full sm:w-auto py-3.5 px-6 bg-white hover:bg-stone-100 text-stone-800 font-bold text-xs sm:text-sm rounded-2xl border border-stone-200 transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <span>Lihat 5 Paket Simulasi Full</span>
              </a>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 pt-4 text-xs font-bold text-stone-500">
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>5 Paket Lengkap (250 Soal)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Audio Chōkai Standar Ujian Asli</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Lembar Hasil Evaluasi &amp; Sertifikat PDF</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Bayar Instan QRIS Otomatis</span>
              </span>
            </div>
          </div>

          {/* ========================================================= */}
          {/* EMBEDDED MINI TRYOUT CALLOUT CARD */}
          {/* ========================================================= */}
          <div id="mini-tryout" className="scroll-mt-24">
            <div className="bg-gradient-to-br from-white via-rose-50/30 to-amber-50/20 border-2 border-red-200/90 rounded-3xl p-6 sm:p-10 shadow-xl shadow-rose-500/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-red-400/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
                <div className="space-y-3 max-w-xl text-center lg:text-left">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>GRATIS • TANPA KARTU KREDIT • CUKUP WHATSAPP</span>
                  </div>

                  <h2 className="text-xl sm:text-3xl font-black text-stone-900 tracking-tight leading-tight">
                    Coba 1 Mini Tryout Gratis (10–15 Soal) Langsung di Sini!
                  </h2>

                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                    Sediakan waktu 15 menit. Tes ini mencakup 4 seksi ujian resmi: <strong>Moji-Goi (Kosakata)</strong>, <strong>Kaiwa (Percakapan)</strong>, <strong>Chōkai (Audio Asli)</strong>, dan <strong>Dokkai (Teks Bacaan)</strong>.
                  </p>

                  <div className="p-4 bg-white/90 rounded-2xl border border-stone-200/80 space-y-1.5 text-xs text-stone-700">
                    <div className="font-bold text-stone-900 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-600" />
                      <span>Fitur Real-Time Score + Laporan Kelemahan:</span>
                    </div>
                    <p className="text-[11px] text-stone-500 italic">
                      "Begitu tes selesai, kamu langsung tahu skor total (skala 10-250) dan analisis bagian mana yang paling sering salah (misal: Kelemahan utama di Chōkai Audio)!"
                    </p>
                  </div>
                </div>

                <div className="w-full lg:w-96 bg-white p-5 sm:p-7 rounded-2xl border border-stone-200 shadow-lg space-y-4 shrink-0 text-center">
                  <div className="space-y-1">
                    <div className="text-base font-black text-stone-900">Mulai Tryout Gratis</div>
                    <div className="text-xs text-stone-500">12 Soal Pilihan • Waktu 15 Menit</div>
                  </div>

                  <div className="space-y-2 text-left text-xs text-stone-600 font-medium">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Audio Chōkai asli persis ujian CBT</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Skor langsung muncul setelah submit</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Kunci jawaban & pembahasan lengkap</span>
                    </div>
                  </div>

                  <button
                    onClick={onOpenMiniTryout}
                    className="w-full py-4 px-6 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-black text-xs sm:text-sm rounded-xl shadow-md shadow-red-500/25 transition flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
                  >
                    <Zap className="w-4 h-4 fill-current" />
                    <span>Mulai Tes Gratis Sekarang</span>
                  </button>

                  <div className="text-[10px] text-stone-400">
                    Cukup masukkan Nama & WhatsApp untuk membuka soal.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. FITUR UNGGULAN SECTION */}
      {/* ========================================================= */}
      <section id="fitur" className="py-12 sm:py-20 bg-white border-y border-stone-200 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-black text-red-600 uppercase tracking-wider">KENAPA KONDANGSENSEI?</span>
            <h2 className="text-2xl sm:text-4xl font-black text-stone-900 tracking-tight">
              Fitur Lengkap yang Menjamin Kesiapan Mental Ujian Anda
            </h2>
            <p className="text-xs sm:text-sm text-stone-500">
              Didesain khusus berdasarkan format ujian CBT JFT-Basic A2 terbaru untuk calon pekerja Tokutei Ginou di Jepang.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="p-6 bg-stone-50 rounded-3xl border border-stone-200/90 space-y-3 hover:border-red-300 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-stone-900">Engine CBT 1:1 Ujian Asli</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Tata letak layar, countdown timer 60 menit, penguncian seksi berurutan, dan navigasi nomor soal yang persis seperti bilik ujian CBT resmi di pusat tes.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-6 bg-sky-50/60 rounded-3xl border border-sky-200/90 space-y-3 hover:border-sky-300 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold">
                <Volume2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-sky-950">Audio Chōkai Standar Ujian Asli</h3>
              <p className="text-xs text-sky-800/80 leading-relaxed">
                Pemutar audio otomatis yang mengikuti standar ujian resmi, dibatasi maksimal 2 kali putar agar Anda terbiasa dengan kecepatan percakapan penutur asli Jepang.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-6 bg-amber-50/60 rounded-3xl border border-amber-200/90 space-y-3 hover:border-amber-300 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-amber-950">Lembar Hasil Evaluasi &amp; Sertifikat (PDF)</h3>
              <p className="text-xs text-amber-800/80 leading-relaxed">
                Setiap selesai simulasi, lembar evaluasi resmi langsung diterbitkan lengkap dengan foto peserta, passing benchmark A2, dan tombol cetak/unduh PDF.
              </p>
            </div>

            {/* Card 4 */}
            <div className="p-6 bg-emerald-50/60 rounded-3xl border border-emerald-200/90 space-y-3 hover:border-emerald-300 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-emerald-950">Pembahasan Tiap Butir Soal</h3>
              <p className="text-xs text-emerald-800/80 leading-relaxed">
                Bukan cuma tahu skor, tapi Anda juga bisa meninjau alasan kenapa jawaban Anda benar atau salah, lengkap dengan arti kanji, tata bahasa, dan konteks budayanya.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. TABEL PERBANDINGAN */}
      {/* ========================================================= */}
      <section className="py-12 sm:py-20 bg-[#f8fafc]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-black text-stone-500 uppercase tracking-wider">PERBANDINGAN</span>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              Belajar Buku Biasa vs Simulasi CBT KondangSensei
            </h2>
          </div>

          <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-xs">
            <div className="grid grid-cols-3 p-4 sm:p-5 bg-stone-100/70 border-b border-stone-200 text-xs sm:text-sm font-black text-stone-800">
              <div>Kriteria Latihan</div>
              <div className="text-center text-stone-500">Buku / PDF Biasa</div>
              <div className="text-center text-red-600">KondangSensei CBT</div>
            </div>

            <div className="divide-y divide-stone-100 text-xs sm:text-sm">
              <div className="grid grid-cols-3 p-4 sm:p-5 items-center">
                <div className="font-bold text-stone-800">Pengalaman Layar Ujian</div>
                <div className="text-center text-stone-500">Kertas cetak biasa</div>
                <div className="text-center font-bold text-emerald-700">99% Mirip Ujian CBT Asli</div>
              </div>

              <div className="grid grid-cols-3 p-4 sm:p-5 items-center">
                <div className="font-bold text-stone-800">Audio Chōkai Realistis</div>
                <div className="text-center text-stone-500">Bisa diulang-ulang sesuka hati</div>
                <div className="text-center font-bold text-emerald-700">Maks. 2x Putar Otomatis</div>
              </div>

              <div className="grid grid-cols-3 p-4 sm:p-5 items-center">
                <div className="font-bold text-stone-800">Tekanan Waktu (Timer)</div>
                <div className="text-center text-stone-500">Hitung manual pakai stopwatch</div>
                <div className="text-center font-bold text-emerald-700">Countdown Otomatis 60 Menit</div>
              </div>

              <div className="grid grid-cols-3 p-4 sm:p-5 items-center">
                <div className="font-bold text-stone-800">Analisis Kelemahan</div>
                <div className="text-center text-stone-500">Koreksi manual satu-satu</div>
                <div className="text-center font-bold text-emerald-700">Diagnostik Instan Real-Time</div>
              </div>

              <div className="grid grid-cols-3 p-4 sm:p-5 items-center">
                <div className="font-bold text-stone-800">Sertifikat / Lembar Hasil Ujian</div>
                <div className="text-center text-stone-500">Tidak ada sertifikat resmi</div>
                <div className="text-center font-bold text-emerald-700">Lembar Hasil Evaluasi &amp; Sertifikat (PDF)</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. PAKET SIMULASI & PRICING SECTION */}
      {/* ========================================================= */}
      <section id="paket" className="py-12 sm:py-20 bg-white border-t border-stone-200 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-red-700 text-xs font-black uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5 text-red-600" />
              <span>PILIHAN PAKET SIMULASI RESMI</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight leading-snug">
              &ldquo;Mau latihan soal full-length yang mirip ujian aslinya biar makin siap? Buka akses 5 Paket Simulasi Full cuma Rp35.000!&rdquo;
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Dapatkan total <strong>250 Soal Asli JFT-Basic A2 (5 Paket Penuh)</strong> dengan audio Chōkai standar ujian, sistem skoring otomatis resmi, dan sertifikat kelulusan A2.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(packages && packages.length > 0 ? packages : DEFAULT_PACKAGES)
              .filter((p) => p.id !== 'pkg_special_1h' && p.price > 100 && !p.firstTimeOnly)
              .map((pkg) => {
                const isPromo = pkg.firstTimeOnly;
                const isPopular = pkg.popular;
                return (
                <div
                  key={pkg.id}
                  className={`rounded-3xl border p-6 flex flex-col justify-between space-y-6 relative transition ${
                    isPopular
                      ? 'border-2 border-red-500 bg-gradient-to-b from-rose-50/40 via-white to-white shadow-xl shadow-red-500/10'
                      : isPromo
                      ? 'border-2 border-amber-400 bg-gradient-to-b from-amber-50/40 via-white to-white shadow-md'
                      : 'border-stone-200 bg-white hover:border-stone-300 shadow-xs'
                  }`}
                >
                  {/* Badge */}
                  {isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-red-600 to-rose-600 text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                      Paling Populer
                    </div>
                  )}
                  {isPromo && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                      Promo Pengguna Baru
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-base font-black text-stone-900">{pkg.name}</h3>
                      <p className="text-xs text-stone-500 leading-relaxed">{pkg.description}</p>
                    </div>

                    <div className="pt-2 border-t border-stone-100">
                      <span className="text-xs text-stone-400 font-bold">Investasi:</span>
                      <div className="text-2xl sm:text-3xl font-black text-stone-950 font-mono">
                        Rp {pkg.price.toLocaleString('id-ID')}
                      </div>
                      <div className="text-[11px] text-stone-500 font-medium">
                        {pkg.durationDays > 0 ? `Masa Aktif: ${pkg.durationDays} Hari Unlimited` : 'Masa Aktif: 1 Jam Akses Penuh'}
                      </div>
                    </div>

                    <div className="space-y-2 text-xs text-stone-700 pt-2 border-t border-stone-100">
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Akses 5 Paket Ujian JFT-Basic A2</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Audio Chōkai Standar Ujian Asli</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Lembar Hasil Evaluasi &amp; Sertifikat (PDF)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Pembahasan Lengkap Tiap Soal</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectPackage(pkg)}
                    className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                      isPopular
                        ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-red-500/25'
                        : isPromo
                        ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white'
                        : 'bg-stone-900 hover:bg-black text-white'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Pilih Paket Ini</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 7. TESTIMONI SISWA LOLOS SSW */}
      {/* ========================================================= */}
      <section id="testimoni" className="py-12 sm:py-20 bg-[#f8fafc] border-t border-stone-200 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-black text-emerald-600 uppercase tracking-wider">KISAH SUKSES</span>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              Mereka yang Telah Lolos JFT-Basic A2 & Berangkat ke Jepang
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-3xl border border-stone-200 space-y-4 shadow-2xs">
              <div className="flex items-center gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-stone-700 leading-relaxed italic">
                "Simulasi Chōkai di KondangSensei sangat membantu! Di ujian aslinya audio benar-benar tidak bisa dipause, persis seperti di simulasi ini. Skor saya 218 dan berhasil lolos sekali tes!"
              </p>
              <div className="pt-2 border-t border-stone-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 font-bold flex items-center justify-center text-sm">
                  AR
                </div>
                <div>
                  <div className="font-bold text-xs text-stone-900">Aris Munandar</div>
                  <div className="text-[10px] text-stone-500">SSW Bidang Kaigo (Caregiver), Osaka</div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white rounded-3xl border border-stone-200 space-y-4 shadow-2xs">
              <div className="flex items-center gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-stone-700 leading-relaxed italic">
                "Awalnya saya coba Mini Tryout gratis dan skor saya cuma 170 karena kelemahan di Dokkai. Setelah ambil paket 1 minggu dan latihan semua pembahasannya, saya lolos dengan skor 205!"
              </p>
              <div className="pt-2 border-t border-stone-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-sm">
                  DN
                </div>
                <div>
                  <div className="font-bold text-xs text-stone-900">Dina Novita</div>
                  <div className="text-[10px] text-stone-500">SSW Pengolahan Makanan, Saitama</div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white rounded-3xl border border-stone-200 space-y-4 shadow-2xs">
              <div className="flex items-center gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-stone-700 leading-relaxed italic">
                "Rapor evaluasinya sangat mirip dengan aslinya. Saya print rapornya untuk bukti kemajuan belajar ke LPK saya. Sangat recommended buat yang mau ujian CBT!"
              </p>
              <div className="pt-2 border-t border-stone-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-sm">
                  RW
                </div>
                <div>
                  <div className="font-bold text-xs text-stone-900">Rizky Wahyudi</div>
                  <div className="text-[10px] text-stone-500">SSW Pertanian, Gunma</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 7.5. LOCAL SEO & REGIONAL COVERAGE (BOGOR & INDONESIA) */}
      {/* ========================================================= */}
      <section className="py-12 bg-white border-t border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-rose-50/60 via-stone-50 to-amber-50/60 rounded-3xl border border-stone-200/90 p-6 sm:p-10 space-y-6 shadow-2xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-stone-200 text-stone-800 text-xs font-black uppercase tracking-wider shadow-2xs">
                  <MapPin className="w-3.5 h-3.5 text-red-600" />
                  <span>Jangkauan Simulasi CBT JFT A2 Bogor, Jabodetabek &amp; Nasional</span>
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight leading-snug">
                  Persiapan Ujian JFT-Basic A2 untuk Peserta &amp; LPK di Bogor &amp; Sekitarnya
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  Bagi pembelajar bahasa Jepang, siswa mandiri, maupun lembaga pelatihan kerja (LPK) di wilayah <strong>Kota Bogor, Kabupaten Bogor, Cibinong, Depok, dan Jabodetabek</strong> yang hendak mengikuti tes resmi di pusat tes CBT, <strong>KondangSensei</strong> menyediakan fasilitas simulasi ujian CBT online penuh yang dapat diakses 24 jam tanpa batas ruang dan waktu.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 shrink-0">
                <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-2xs text-center space-y-1">
                  <div className="text-lg font-black text-red-600">100% Online</div>
                  <div className="text-[11px] text-stone-500 font-semibold">Akses Kapan Saja dari Bogor</div>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-2xs text-center space-y-1">
                  <div className="text-lg font-black text-stone-900">Standar Ujian Resmi</div>
                  <div className="text-[11px] text-stone-500 font-semibold">Seksi S1 - S4 Lengkap</div>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-2xs text-center space-y-1">
                  <div className="text-lg font-black text-stone-900">Audio Chōkai</div>
                  <div className="text-[11px] text-stone-500 font-semibold">Standar Level A2 Resmi</div>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-2xs text-center space-y-1">
                  <div className="text-lg font-black text-emerald-600">Mini Tryout 0 Rp</div>
                  <div className="text-[11px] text-stone-500 font-semibold">Langsung Coba Sekarang</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 8. FAQ ACCORDION */}
      {/* ========================================================= */}
      <section id="faq" className="py-12 sm:py-20 bg-white border-t border-stone-200 scroll-mt-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-black text-stone-500 uppercase tracking-wider">TANYA JAWAB</span>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              Pertanyaan yang Sering Diajukan
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((f, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className="border border-stone-200 rounded-2xl overflow-hidden transition">
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 text-left font-bold text-xs sm:text-sm text-stone-900 flex items-center justify-between gap-4 hover:bg-stone-50 transition cursor-pointer"
                  >
                    <span>{f.q}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-stone-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-stone-400 shrink-0" />}
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 text-xs text-stone-600 leading-relaxed border-t border-stone-100 pt-3">
                      {f.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 9. BOTTOM CONVERSION FOOTER BANNER */}
      {/* ========================================================= */}
      <section className="py-12 sm:py-16 bg-gradient-to-br from-stone-900 via-stone-900 to-rose-950 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
            Jangan Sampai Gagal di Bilik Ujian CBT Asli!
          </h2>
          <p className="text-xs sm:text-sm text-stone-300 max-w-xl mx-auto leading-relaxed">
            Biaya ujian asli JFT-Basic adalah ratusan ribu rupiah. Matangkan persiapan Anda sekarang dengan Mini Tryout Gratis & 5 Paket Simulasi CBT KondangSensei.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenMiniTryout}
              className="w-full sm:w-auto py-3.5 px-8 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-red-500/25 transition cursor-pointer"
            >
              Mulai 1 Mini Tryout Gratis Sekarang
            </button>
            <a
              href="https://wa.me/6281299998888?text=Halo%20Admin%20KondangSensei,%20saya%20mau%20tanya%20tentang%20paket%20simulasi%20JFT-Basic%20A2"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto py-3.5 px-6 bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm rounded-2xl border border-white/20 transition flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>Hubungi WhatsApp CS</span>
            </a>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 10. FOOTER */}
      {/* ========================================================= */}
      <footer className="py-8 bg-stone-950 text-stone-500 text-xs border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-black text-white">KondangSensei CBT</span>
            <span>• Hak Cipta © 2026 KondangSensei Indonesia</span>
          </div>

          <div className="text-[11px] text-stone-600 text-center sm:text-right">
            Platform Simulasi Mandiri CBT JFT-Basic A2 untuk Calon Tenaga Kerja SSW Jepang.
          </div>
        </div>
      </footer>
    </div>
  );
};
