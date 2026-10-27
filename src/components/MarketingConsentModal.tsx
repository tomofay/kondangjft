'use client';

import React from 'react';
import { X, MessageCircle, ShieldCheck, CheckCircle2, BellRing, PhoneOff } from 'lucide-react';

interface MarketingConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MarketingConsentModal: React.FC<MarketingConsentModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white text-stone-900 rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-stone-50 border-b border-stone-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center font-bold shadow-2xs shrink-0">
              <MessageCircle className="w-5 h-5 fill-emerald-600/20" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-stone-900 leading-tight">
                Persetujuan Kontak WhatsApp
              </h2>
              <p className="text-xs text-stone-500">
                Ketentuan Penggunaan Data Kontak & Penawaran Edukasi
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-200/80 rounded-xl transition cursor-pointer"
            aria-label="Tutup Persetujuan Kontak"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs text-stone-700 leading-relaxed">
          {/* Poin 1 */}
          <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-1">
            <div className="font-bold text-emerald-950 flex items-center gap-1.5 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>1. Pengiriman Hasil Nilai & Evaluasi Belajar</span>
            </div>
            <p className="text-emerald-900/90 text-[11px] pl-5.5">
              Nama dan nomor WhatsApp yang Anda masukkan digunakan untuk menampilkan dan mengonfirmasi lembar rapor skor Mini Tryout, persentase kelulusan, dan rekomendasi fokus belajar per seksi (Moji-Goi, Kaiwa, Chōkai, Dokkai).
            </p>
          </div>

          {/* Poin 2 */}
          <div className="p-3.5 bg-indigo-50/70 rounded-2xl border border-indigo-200 space-y-1">
            <div className="font-bold text-indigo-950 flex items-center gap-1.5 text-xs">
              <BellRing className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>2. Konsultasi & Penawaran Program Edukasi</span>
            </div>
            <p className="text-indigo-900/90 text-[11px] pl-5.5">
              Anda menyetujui bahwa tim atau admin resmi KondangSensei dapat menghubungi Anda melalui WhatsApp untuk memberikan konsultasi persiapan ujian JFT-Basic A2, tips lulus ujian JFT-Basic A2, serta penawaran paket latihan tryout full CBT berdiskon.
            </p>
          </div>

          {/* Poin 3 */}
          <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-1">
            <div className="font-bold text-stone-900 flex items-center gap-1.5 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>3. Keamanan Data & Anti-Spam</span>
            </div>
            <p className="text-stone-600 text-[11px] pl-5.5">
              Nomor WhatsApp Anda hanya digunakan secara eksklusif oleh admin resmi KondangSensei. Data Anda terenkripsi aman dan tidak akan diperjualbelikan atau dibagikan kepada pihak luar mana pun.
            </p>
          </div>

          {/* Poin 4 */}
          <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-1">
            <div className="font-bold text-amber-950 flex items-center gap-1.5 text-xs">
              <PhoneOff className="w-4 h-4 text-amber-600 shrink-0" />
              <span>4. Hak Berhenti (Opt-Out) Kapan Saja</span>
            </div>
            <p className="text-amber-900/90 text-[11px] pl-5.5">
              Jika di kemudian hari Anda tidak ingin menerima pesan follow-up atau informasi program belajar lebih lanjut, Anda berhak berhenti kapan saja cukup dengan membalas pesan admin dengan kata &quot;STOP&quot; atau meminta admin menghapus nomor Anda.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-stone-500">
            KondangSensei • Kebijakan Kontak WhatsApp
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
          >
            Saya Mengerti & Setuju
          </button>
        </div>
      </div>
    </div>
  );
};
