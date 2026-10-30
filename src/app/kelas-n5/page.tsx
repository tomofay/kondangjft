'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Check,
  Video,
  Layers,
  Award,
  Users,
  Clock,
  Zap,
  MessageCircle,
  HelpCircle,
  Flame,
  Star,
  ChevronRight,
  MousePointerClick
} from 'lucide-react';
import { PackagePaymentModal } from '@/components/PackagePaymentModal';
import { DEFAULT_PACKAGES } from '@/lib/dataStore';
import { TryoutPackage } from '@/types';

// Bunpou Interactive Block Token Type
interface BunpouToken {
  id: string;
  jp: string;
  furi?: string;
  romaji: string;
  color: string;
  type: string;
  meaning: string;
  explanation: string;
}

interface DemoSentence {
  id: string;
  title: string;
  translation: string;
  tokens: BunpouToken[];
}

const DEMO_SENTENCES: DemoSentence[] = [
  {
    id: 's1',
    title: 'Pola Dasar Partikel WA & O (Aktivitas Sehari-hari)',
    translation: 'Saya makan sushi di restoran Jepang.',
    tokens: [
      {
        id: 't1',
        jp: '私',
        furi: 'わたし',
        romaji: 'watashi',
        color: 'bg-blue-100 text-blue-900 border-blue-400 hover:bg-blue-200',
        type: 'Topik Kalimat (Subjek)',
        meaning: 'Saya',
        explanation: 'Kata ganti orang pertama tunggal sebagai pelaku utama aktivitas.'
      },
      {
        id: 't2',
        jp: 'は',
        furi: 'わ',
        romaji: 'wa',
        color: 'bg-sky-100 text-sky-900 border-sky-400 hover:bg-sky-200',
        type: 'Partikel Penanda Topik (WA)',
        meaning: '[Penanda Topik]',
        explanation: 'Menandai topik pembicaraan utama. Ditulis dengan hiragana HA, diucapkan WA.'
      },
      {
        id: 't3',
        jp: '日本料理店',
        furi: 'にほんりょうりてん',
        romaji: 'nihon ryouriten',
        color: 'bg-purple-100 text-purple-900 border-purple-400 hover:bg-purple-200',
        type: 'Keterangan Tempat (Tempat Aksi)',
        meaning: 'Restoran Jepang',
        explanation: 'Lokasi spesifik tempat dilakukannya suatu tindakan aktif.'
      },
      {
        id: 't4',
        jp: 'で',
        romaji: 'de',
        color: 'bg-violet-100 text-violet-900 border-violet-400 hover:bg-violet-200',
        type: 'Partikel Lokasi Aktivitas (DE)',
        meaning: 'di',
        explanation: 'Menunjukkan tempat terjadinya aktivitas (makan, belajar, bekerja).'
      },
      {
        id: 't5',
        jp: '寿司',
        furi: 'すし',
        romaji: 'sushi',
        color: 'bg-emerald-100 text-emerald-900 border-emerald-400 hover:bg-emerald-200',
        type: 'Objek Langsung (Penderita)',
        meaning: 'Sushi',
        explanation: 'Benda atau hal yang menjadi sasaran langsung dari kata kerja.'
      },
      {
        id: 't6',
        jp: 'を',
        furi: 'お',
        romaji: 'o',
        color: 'bg-teal-100 text-teal-900 border-teal-400 hover:bg-teal-200',
        type: 'Partikel Penanda Objek (O)',
        meaning: '[Penanda Objek]',
        explanation: 'Menghubungkan objek langsung dengan kata kerja transitif.'
      },
      {
        id: 't7',
        jp: '食べます',
        furi: 'たべます',
        romaji: 'tabemasu',
        color: 'bg-amber-100 text-amber-900 border-amber-400 hover:bg-amber-200',
        type: 'Kata Kerja / Predikat (Masu-kei)',
        meaning: 'Makan',
        explanation: 'Bentuk sopan positif non-lampau (kebiasaan atau aksi yang akan datang).'
      }
    ]
  },
  {
    id: 's2',
    title: 'Pola Perjalanan: Partikel E & DE (Transportasi & Arah)',
    translation: 'Besok Sensei pergi ke Tokyo dengan Shinkansen.',
    tokens: [
      {
        id: 't2_1',
        jp: '明日',
        furi: 'あした',
        romaji: 'ashita',
        color: 'bg-rose-100 text-rose-900 border-rose-400 hover:bg-rose-200',
        type: 'Keterangan Waktu',
        meaning: 'Besok',
        explanation: 'Waktu kejadian mendatang (tidak memerlukan partikel NI karena kata waktu relatif).'
      },
      {
        id: 't2_2',
        jp: '先生',
        furi: 'せんせい',
        romaji: 'sensei',
        color: 'bg-blue-100 text-blue-900 border-blue-400 hover:bg-blue-200',
        type: 'Subjek Pelaku',
        meaning: 'Guru / Sensei',
        explanation: 'Pelaku yang melakukan aksi perpindahan tempat.'
      },
      {
        id: 't2_3',
        jp: 'は',
        furi: 'わ',
        romaji: 'wa',
        color: 'bg-sky-100 text-sky-900 border-sky-400 hover:bg-sky-200',
        type: 'Partikel Penanda Topik (WA)',
        meaning: '[Topik]',
        explanation: 'Menegaskan subjek Sensei sebagai pusat perhatian kalimat.'
      },
      {
        id: 't2_4',
        jp: '新幹線',
        furi: 'しんかんせん',
        romaji: 'shinkansen',
        color: 'bg-orange-100 text-orange-900 border-orange-400 hover:bg-orange-200',
        type: 'Alat / Sarana Transportasi',
        meaning: 'Kereta Cepat Shinkansen',
        explanation: 'Alat atau sarana yang digunakan untuk melakukan perpindahan.'
      },
      {
        id: 't2_5',
        jp: 'で',
        romaji: 'de',
        color: 'bg-violet-100 text-violet-900 border-violet-400 hover:bg-violet-200',
        type: 'Partikel Sarana / Alat (DE)',
        meaning: 'dengan / menggunakan',
        explanation: 'Menunjukkan instrumen transportasi atau sarana melakukan aksi.'
      },
      {
        id: 't2_6',
        jp: '東京',
        furi: 'とうきょう',
        romaji: 'toukyou',
        color: 'bg-purple-100 text-purple-900 border-purple-400 hover:bg-purple-200',
        type: 'Tujuan Perpindahan (Arah)',
        meaning: 'Tokyo',
        explanation: 'Destinasi yang dituju oleh pelaku.'
      },
      {
        id: 't2_7',
        jp: 'へ',
        furi: 'え',
        romaji: 'e',
        color: 'bg-teal-100 text-teal-900 border-teal-400 hover:bg-teal-200',
        type: 'Partikel Arah Tujuan (E)',
        meaning: 'ke / menuju',
        explanation: 'Menunjukkan arah gerakan perpindahan menuju lokasi tujuan.'
      },
      {
        id: 't2_8',
        jp: '行きます',
        furi: 'いきます',
        romaji: 'ikimasu',
        color: 'bg-amber-100 text-amber-900 border-amber-400 hover:bg-amber-200',
        type: 'Kata Kerja Gerak (Ikimasu)',
        meaning: 'Pergi',
        explanation: 'Kata kerja perpindahan arah menjauhi pembicara.'
      }
    ]
  }
];

export default function KelasN5Page() {
  const [selectedSentenceIndex, setSelectedSentenceIndex] = useState(0);
  const activeSentence = DEMO_SENTENCES[selectedSentenceIndex];
  const [selectedToken, setSelectedToken] = useState<BunpouToken>(activeSentence.tokens[0]);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  // Schema.org Structured Data (Course & EducationalOccupationalCredential)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: 'Bimbel Intensif Bahasa Jepang N5 Interaktif & Flipped Classroom',
    description:
      'Kuasai Bahasa Jepang N5 tanpa bosan menonton video pasif. Belajar dengan Blok Warna Bunpou interaktif, SRS Kotoba, dan sesi live tatap muka Zoom bersama Sensei berpengalaman.',
    provider: {
      '@type': 'Organization',
      name: 'KondangSensei',
      sameAs: 'https://kondangsensei.my.id'
    },
    educationalCredentialAwarded: 'Sertifikat Kompetensi Bahasa Jepang JLPT N5 / JFT-Basic A2',
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'online',
      courseWorkload: 'PT90H'
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-stone-900 font-sans selection:bg-rose-100 selection:text-rose-900">
      {/* JSON-LD Script for Google SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header Navigation */}
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
              <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                Kelas Intensif JLPT N5
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/tryout-jft"
              className="text-xs font-bold text-stone-600 hover:text-red-600 transition hidden sm:inline-block"
            >
              Simulasi JFT-Basic A2 →
            </Link>
            <button
              onClick={() => setPaymentModalOpen(true)}
              className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl shadow-xs transition cursor-pointer"
            >
              Daftar Kelas N5
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-10 sm:pt-16 pb-14 overflow-hidden bg-gradient-to-b from-rose-50/50 via-white to-[#f8fafc]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-100 text-red-700 text-xs font-black uppercase tracking-wider shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-red-600" />
            <span>Metode Flipped Classroom Interaktif Generasi Baru</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-stone-900 tracking-tight max-w-4xl mx-auto leading-tight">
            Kuasai Bahasa Jepang N5{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-600">
              Tanpa Bosan Nonton Video Pasif
            </span>
          </h1>

          <p className="text-sm sm:text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed">
            Belajar dengan <strong>Blok Warna Tata Bahasa (Bunpou)</strong> interaktif, pengulangan berjarak (SRS) kosakata, dan interaksi langsung tatap muka via <strong>Live Zoom</strong> bersama Sensei.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => {
                const el = document.getElementById('demo-bunpou');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="py-3.5 px-6 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-black text-sm rounded-2xl shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <MousePointerClick className="w-4 h-4" />
              <span>Coba Demo Blok Warna Interaktif</span>
            </button>

            <Link
              href="/tryout-jft"
              className="py-3.5 px-6 bg-white hover:bg-stone-50 text-stone-800 font-bold text-sm rounded-2xl border border-stone-200 shadow-2xs transition flex items-center gap-2"
            >
              <span>Uji Kemampuan di Tryout JFT</span>
              <ArrowRight className="w-4 h-4 text-stone-400" />
            </Link>
          </div>
        </div>
      </section>

      {/* Interactive Bunpou Demo Widget */}
      <section id="demo-bunpou" className="py-12 sm:py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-red-600 uppercase tracking-widest">
            Fitur Unggulan Tanpa Video Pasif
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-stone-900">
            Interactive Bunpou Color-Coded Engine
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 max-w-xl mx-auto">
            Klik blok kata di bawah ini untuk melihat bagaimana otak Anda memahami struktur kalimat Jepang dalam hitungan detik tanpa rumus rumit!
          </p>
        </div>

        {/* Sentence Tabs */}
        <div className="flex items-center justify-center gap-2">
          {DEMO_SENTENCES.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => {
                setSelectedSentenceIndex(idx);
                setSelectedToken(DEMO_SENTENCES[idx].tokens[0]);
              }}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                selectedSentenceIndex === idx
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100'
              }`}
            >
              Contoh {idx + 1}
            </button>
          ))}
        </div>

        {/* Interactive Sentence Card */}
        <div className="bg-white rounded-3xl border-2 border-stone-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-stone-100 pb-4">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
              {activeSentence.title}
            </span>
            <div className="text-lg font-black text-stone-800 mt-1">
              &ldquo;{activeSentence.translation}&rdquo;
            </div>
          </div>

          {/* Color-Coded Word Blocks */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 py-4">
            {activeSentence.tokens.map((token) => {
              const isSelected = selectedToken.id === token.id;
              return (
                <button
                  key={token.id}
                  onClick={() => setSelectedToken(token)}
                  className={`group relative flex flex-col items-center px-3.5 py-2.5 rounded-2xl border-2 transition transform active:scale-95 cursor-pointer ${
                    token.color
                  } ${
                    isSelected
                      ? 'ring-4 ring-red-500/30 scale-105 shadow-md border-red-500 font-black'
                      : 'border-opacity-60 hover:scale-102'
                  }`}
                >
                  {token.furi && (
                    <span className="text-[11px] font-bold text-stone-500 leading-none mb-1">
                      {token.furi}
                    </span>
                  )}
                  <span className="text-xl sm:text-2xl font-bold tracking-wide">
                    {token.jp}
                  </span>
                  <span className="text-[10px] uppercase font-mono tracking-wider opacity-75 mt-0.5">
                    {token.romaji}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Token Explainer Box */}
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-600 animate-pulse" />
                <h4 className="text-sm font-black text-stone-900">
                  {selectedToken.type}
                </h4>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white border border-stone-200 text-stone-700">
                Makna: {selectedToken.meaning}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              {selectedToken.explanation}
            </p>
          </div>
        </div>
      </section>

      {/* Comparison: Traditional Video vs Flipped Classroom */}
      <section className="py-12 bg-white border-y border-stone-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-black text-stone-900">
              Mengapa Flipped Classroom KondangSensei Jauh Lebih Efektif?
            </h3>
            <p className="text-xs sm:text-sm text-stone-600">
              Perbandingan langsung antara metode kursus konvensional dan sistem akselerasi kami
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-stone-50 border border-stone-200 rounded-3xl p-6 space-y-4">
              <h4 className="text-base font-black text-stone-500 flex items-center gap-2">
                <Video className="w-5 h-5 text-stone-400" />
                <span>Metode Bimbel Video Pasif Lainnya</span>
              </h4>
              <ul className="space-y-3 text-xs sm:text-sm text-stone-600">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-black">✕</span>
                  <span>Menonton video rekaman 30+ menit yang menjemukan dan bikin ngantuk.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-black">✕</span>
                  <span>Tidak ada interaksi jika ada pola kalimat yang belum dipahami.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-black">✕</span>
                  <span>Hafalan kata cepat lupa tanpa sistem pengulangan berkala (SRS).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-black">✕</span>
                  <span>Hasil tugas tidak diperiksa atau dikoreksi langsung oleh pengajar.</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-rose-50 to-white border-2 border-red-500/40 rounded-3xl p-6 space-y-4 shadow-sm">
              <h4 className="text-base font-black text-red-700 flex items-center gap-2">
                <Award className="w-5 h-5 text-red-600" />
                <span>Ekosistem KondangSensei N5</span>
              </h4>
              <ul className="space-y-3 text-xs sm:text-sm text-stone-800">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Blok Bunpou interaktif yang langsung diuji dengan latihan mandiri aktif.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Sesi tatap muka Live Zoom terarah dengan tanya jawab interaktif.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Kartu kosakata SRS pintar yang menyesuaikan jadwal lupa memori Anda.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Feedback tulisan & stempel Hanamaru langsung dari Sensei di kelas.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-stone-900 via-rose-950 to-stone-900 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Tersedia Paket Bundling Hemat Bimbel N5 + 5x Simulasi CBT JFT</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black">
            Siap Lulus Ujian JLPT N5 dan JFT-Basic A2 Sekali Coba?
          </h2>
          <p className="text-stone-300 text-xs sm:text-base max-w-xl mx-auto">
            Dapatkan materi lengkap 25 Bab Minna no Nihongo, akses CBT real-time, dan bimbingan langsung pengajar.
          </p>
          <button
            onClick={() => setPaymentModalOpen(true)}
            className="py-4 px-8 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-sm rounded-2xl shadow-xl transition transform hover:-translate-y-0.5 cursor-pointer"
          >
            Buka Akses Kelas Sekarang
          </button>
        </div>
      </section>

      {/* Checkout Modal */}
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
