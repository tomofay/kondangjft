'use client';

import React from 'react';
import { X, ShieldCheck, FileText, CreditCard, Lock, CheckCircle2 } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white text-stone-900 rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-stone-50 border-b border-stone-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-bold shadow-2xs shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-stone-900 leading-tight">
                Ketentuan Layanan & Kebijakan
              </h2>
              <p className="text-xs text-stone-500">
                KondangSensei CBT • Platform Simulasi Mandiri JFT-Basic A2
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-200/80 rounded-xl transition"
            aria-label="Tutup Ketentuan Layanan"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs text-stone-700 leading-relaxed">
          {/* 1. Penggunaan Layanan */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 font-black text-stone-900 text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <h3>1. Ruang Lingkup & Keaslian Simulasi</h3>
            </div>
            <p>
              KondangSensei adalah platform simulasi mandiri berbasis komputer (Computer Based Test) untuk latihan ujian JFT-Basic (Japan Foundation Test for Basic Japanese) A2. Platform ini dibangun secara independen sebagai sarana pembelajaran dan evaluasi kesiapan calon tenaga kerja ke Jepang.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-stone-600">
              <li>Format ujian mengadopsi struktur 50 butir soal: Moji & Goi, Kaiwa, Chōkai (Audio), dan Dokkai.</li>
              <li>Hasil nilai, persentase kelulusan, dan Rapor PDF merupakan evaluasi mandiri simulasi dan bukan sertifikat resmi pemerintah atau lembaga penyelenggara resmi ujian di Jepang.</li>
            </ul>
          </section>

          {/* 2. Pembayaran & Akses Digital */}
          <section className="space-y-2 pt-2 border-t border-stone-100">
            <div className="flex items-center gap-2 font-black text-stone-900 text-sm">
              <CreditCard className="w-4 h-4 text-indigo-600 shrink-0" />
              <h3>2. Kebijakan Pembayaran & Akses Digital (No Refund)</h3>
            </div>
            <p>
              Seluruh transaksi paket di KondangSensei diproses secara otomatis melalui payment gateway berizin resmi (QRIS, Bank Transfer).
            </p>
            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-1.5 text-amber-950 font-medium">
              <div className="font-bold flex items-center gap-1.5 text-amber-900">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Ketentuan Pengaktifan Instan:</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-[11px] text-amber-900/90">
                <li>Masa aktif paket simulasi dihitung dan diaktifkan secara instan begitu pembayaran terkonfirmasi oleh sistem.</li>
                <li>Karena merupakan produk konten digital dengan akses langsung tanpa batas (unlimited tryout) selama periode aktif, <strong>pembelian yang sudah terkonfirmasi bersifat final dan tidak dapat dibatalkan atau dikembalikan (Non-Refundable)</strong>.</li>
                <li>Jika terjadi kendala teknis (misal saldo terpotong namun paket belum aktif), pengguna berhak menghubungi Customer Service via WhatsApp dengan menyertakan Nomor Invoice untuk aktivasi manual.</li>
              </ul>
            </div>
          </section>

          {/* 3. Keamanan Akun & Single Session */}
          <section className="space-y-2 pt-2 border-t border-stone-100">
            <div className="flex items-center gap-2 font-black text-stone-900 text-sm">
              <Lock className="w-4 h-4 text-rose-600 shrink-0" />
              <h3>3. Keamanan Akun & Ketentuan Penggunaan</h3>
            </div>
            <p>
              Setiap akun peserta dilindungi oleh sistem sesi tunggal. Akun dimaksudkan untuk penggunaan individu peserta yang bersangkutan:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-stone-600">
              <li>Pengguna dilarang membagikan detail login akun untuk digunakan bersamaan pada beberapa perangkat saat sesi ujian berlangsung.</li>
              <li>Sistem berhak menangguhkan akun jika terdeteksi aktivitas mencurigakan atau upaya peretasan engine ujian CBT.</li>
            </ul>
          </section>

          {/* 4. Privasi & Data Pengguna */}
          <section className="space-y-2 pt-2 border-t border-stone-100">
            <div className="flex items-center gap-2 font-black text-stone-900 text-sm">
              <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
              <h3>4. Kebijakan Privasi Data</h3>
            </div>
            <p>
              Data pribadi yang dimasukkan peserta (seperti nama lengkap, tanggal lahir, dan pasfoto) hanya digunakan untuk keperluan pencetakan lembar Rapor Hasil Evaluasi Mandiri dan identitas pengerjaan ujian. Data Anda tidak akan diperjualbelikan atau dibagikan kepada pihak ketiga untuk tujuan komersial di luar ekosistem KondangSensei.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-stone-500">
            Terakhir diperbarui: 2026
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
          >
            Saya Mengerti
          </button>
        </div>
      </div>
    </div>
  );
};
