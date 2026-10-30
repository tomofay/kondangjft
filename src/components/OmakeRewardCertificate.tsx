'use client';

import React, { useState, useEffect } from 'react';

interface OmakeReward {
  id: string;
  chapter_id: number;
  title: string;
  japanese_title: string;
  category: string;
  thumbnail_url: string;
  content_markdown: string;
  reading_time_minutes: number;
}

interface CertificateInfo {
  certificateNumber: string;
  verificationHash: string;
  qrCodeUrl: string;
  pdfFileUrl: string;
  studentName?: string;
  issueDate?: string;
}

interface OmakeRewardCertificateProps {
  chapterId?: number;
}

export default function OmakeRewardCertificate({
  chapterId = 1
}: OmakeRewardCertificateProps) {
  const [omake, setOmake] = useState<OmakeReward | null>(null);
  const [isOmakeUnlocked, setIsOmakeUnlocked] = useState(false);
  const [omakeError, setOmakeError] = useState<string | null>(null);
  const [isLoadingOmake, setIsLoadingOmake] = useState(true);

  // Certificate state
  const [certificate, setCertificate] = useState<CertificateInfo | null>(null);
  const [isGeneratingCert, setIsGeneratingCert] = useState(false);
  const [certMessage, setCertMessage] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    fetchOmake();
  }, [chapterId]);

  const fetchOmake = async () => {
    setIsLoadingOmake(true);
    setOmakeError(null);
    try {
      const res = await fetch(`/api/n5/omake?chapterId=${chapterId}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setOmake(data.omake);
        setIsOmakeUnlocked(data.isUnlocked);
      } else {
        setOmakeError(data.error || 'Hadiah Omake belum terbuka.');
        setIsOmakeUnlocked(false);
      }
    } catch (err: any) {
      setOmakeError('Gagal memuat hadiah Omake: ' + err.message);
      setIsOmakeUnlocked(false);
    } finally {
      setIsLoadingOmake(false);
    }
  };

  const handleGenerateCertificate = async () => {
    setIsGeneratingCert(true);
    setCertMessage(null);
    try {
      const res = await fetch('/api/n5/certificates/generate', {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCertificate(data.certificate);
        setCertMessage({
          text: '🎉 Selamat! Sertifikat kelulusan resmi N5 berhasil diterbitkan berformat PDF dengan QR Code terverifikasi.',
          isError: false
        });
      } else {
        setCertMessage({
          text: data.error || 'Gagal menerbitkan sertifikat. Pastikan Anda telah menyelesaikan seluruh 25 bab.',
          isError: true
        });
      }
    } catch (err: any) {
      setCertMessage({ text: 'Terjadi kesalahan sistem: ' + err.message, isError: true });
    } finally {
      setIsGeneratingCert(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 p-4 md:p-6 text-slate-100">
      {/* 1. Omake Cultural Reward Section */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 md:p-8 backdrop-blur-xl shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold uppercase tracking-wider mb-2">
              Hadiah Budaya Omake (おまけ)
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white">
              {omake ? omake.title : `Hadiah Budaya Bab ${chapterId}`}
            </h2>
            {omake?.japanese_title && (
              <p className="text-sm font-medium text-rose-400 mt-1">
                {omake.japanese_title}
              </p>
            )}
          </div>

          <div className="shrink-0">
            {isOmakeUnlocked ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Terbuka (Lulus Mondai)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
                🔒 Masih Terkunci
              </span>
            )}
          </div>
        </div>

        {isLoadingOmake ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            Memeriksa status hadiah Omake...
          </div>
        ) : isOmakeUnlocked && omake ? (
          <div className="space-y-6">
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span>Kategori: <strong className="text-slate-200 capitalize">{omake.category}</strong></span>
              <span>•</span>
              <span>Waktu Baca: <strong className="text-slate-200">{omake.reading_time_minutes} Menit</strong></span>
            </div>

            <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800/80 prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed whitespace-pre-line">
              {omake.content_markdown}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center rounded-2xl bg-slate-950/40 border border-slate-800/80 space-y-3">
            <div className="text-4xl">🔒</div>
            <h3 className="text-base font-bold text-slate-200">
              Konten Eksklusif Budaya Jepang Ini Masih Terkunci
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {omakeError ||
                `Selesaikan dan raih nilai minimal 75% pada Ujian Evaluasi Mondai Bab ${chapterId} untuk membuka hadiah Omake ini.`}
            </p>
          </div>
        )}
      </div>

      {/* 2. Completion Certificate Generator Section */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/30 p-6 md:p-8 backdrop-blur-xl shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
              Verifiable PDF Certificate Engine
            </div>
            <h3 className="text-2xl font-black text-white">
              Sertifikat Kelulusan Resmi Kelas N5
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Diterbitkan dalam format PDF A4 Landscape standar industri dengan tanda tangan digital Sensei dan QR Code verifikasi online untuk pihak LPK / perusahaan.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGenerateCertificate}
            disabled={isGeneratingCert}
            className="px-6 py-3 rounded-2xl font-extrabold text-sm text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-xl shadow-indigo-600/30 transition-all shrink-0 disabled:opacity-50 flex items-center gap-2"
          >
            {isGeneratingCert ? (
              <span>Menerbitkan Sertifikat...</span>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Terbitkan Sertifikat PDF</span>
              </>
            )}
          </button>
        </div>

        {certMessage && (
          <div
            className={`p-4 rounded-2xl text-xs flex items-center gap-3 border ${
              certMessage.isError
                ? 'bg-amber-950/40 border-amber-500/30 text-amber-200'
                : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
            }`}
          >
            <span className="text-lg">{certMessage.isError ? '⚠️' : '🎉'}</span>
            <span>{certMessage.text}</span>
          </div>
        )}

        {/* Certificate Preview Card */}
        {certificate && (
          <div className="p-6 rounded-2xl bg-slate-950/70 border border-indigo-500/40 space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  Nomor Sertifikat Resmi
                </span>
                <div className="text-xl md:text-2xl font-black text-white font-mono">
                  {certificate.certificateNumber}
                </div>
                <p className="text-xs text-slate-400">
                  Hash Integritas SHA-256: <code className="text-indigo-300 text-[10px] break-all">{certificate.verificationHash}</code>
                </p>
              </div>

              {/* QR Code Mock Preview */}
              <div className="p-3 bg-white rounded-xl shrink-0 shadow-lg flex flex-col items-center">
                <div className="w-24 h-24 bg-slate-100 flex items-center justify-center border border-slate-300 rounded-lg">
                  <span className="text-xs font-bold text-slate-800 text-center">
                    [QR Code Verifikasi]
                  </span>
                </div>
                <span className="text-[10px] text-slate-600 font-bold mt-1">Pindai untuk Verifikasi</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-3 border-t border-slate-800">
              <a
                href={certificate.pdfFileUrl}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Unduh PDF Sertifikat (A4)
              </a>

              <a
                href={`/api/public/verify/${certificate.verificationHash}`}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors border border-slate-700"
              >
                Uji Halaman Verifikasi Publik
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
