'use client';

import React, { useState, useRef, useEffect } from 'react';
import { compressHomeworkWithStats, CompressionResult } from '@/lib/imageCompressor';

interface KakuAssignment {
  id: string;
  chapter_id: number;
  title: string;
  instructions: string;
  sample_sheet_pdf_url: string;
}

interface KakuSubmission {
  id: string;
  assignment_id: string;
  user_id: string;
  class_id?: string;
  image_url: string;
  compressed_size_kb: number;
  original_size_kb: number;
  status: 'pending' | 'approved' | 'revision_needed';
  sensei_notes?: string;
  hanamaru_awarded?: boolean;
  submitted_at: string;
}

interface KakuHomeworkUploadProps {
  chapterId?: number;
  classId?: string;
}

export default function KakuHomeworkUpload({
  chapterId = 1,
  classId = 'cls_batch1_n5'
}: KakuHomeworkUploadProps) {
  const [assignment, setAssignment] = useState<KakuAssignment | null>(null);
  const [submissions, setSubmissions] = useState<KakuSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [compressionStats, setCompressionStats] = useState<CompressionResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAssignmentAndHistory();
  }, [chapterId]);

  const fetchAssignmentAndHistory = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      // 1. Fetch Assignment Details
      const assignRes = await fetch(`/api/n5/kaku/assignment?chapterId=${chapterId}`);
      if (assignRes.ok) {
        const assignData = await assignRes.json();
        setAssignment(assignData.assignment);
      }

      // 2. Fetch Submission History
      const subsRes = await fetch('/api/n5/kaku/my-submissions');
      if (subsRes.ok) {
        const subsData = await subsRes.json();
        setSubmissions(subsData.submissions || []);
      }
    } catch (err: any) {
      setErrorMsg('Gagal memuat data penugasan Kaku: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelection = async (file: File) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    // Basic MIME check
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Format file tidak didukung. Mohon unggah foto berformat WebP, JPEG, atau PNG.');
      return;
    }

    // 10 MB raw limit
    if (file.size > 12 * 1024 * 1024) {
      setErrorMsg('Foto melebihi batas 10 MB. Harap kurangi resolusi kamera Anda.');
      return;
    }

    try {
      setIsCompressing(true);
      const result = await compressHomeworkWithStats(file, {
        maxDimension: 1920,
        quality: 0.82,
        targetFormat: 'image/webp'
      });

      setCompressionStats(result);
      const objectUrl = URL.createObjectURL(result.blob);
      setPreviewUrl(objectUrl);
    } catch (err: any) {
      setErrorMsg('Gagal mengompresi gambar: ' + (err.message || 'Kesalahan browser'));
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSubmit = async () => {
    if (!compressionStats || !previewUrl || !assignment) {
      setErrorMsg('Silakan pilih atau ambil foto tugas terlebih dahulu.');
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const formData = new FormData();
      formData.append(
        'homeworkPhoto',
        compressionStats.blob,
        `kaku_ch${chapterId}_homework.webp`
      );
      formData.append('assignmentId', assignment.id);
      formData.append('classId', classId);
      formData.append('compressedSizeKb', compressionStats.compressedSizeKb.toString());
      formData.append('originalSizeKb', compressionStats.originalSizeKb.toString());

      const res = await fetch('/api/n5/kaku/submit', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengirimkan tugas');
      }

      setSuccessMsg('🎉 Tugas tulisan tangan berhasil dikirim! Menunggu koreksi dan stempel Hanamaru dari Sensei.');
      setCompressionStats(null);
      setPreviewUrl(null);

      // Refresh history
      await fetchAssignmentAndHistory();
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan jaringan.');
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusBadge = (status: KakuSubmission['status']) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Disetujui (Hanamaru)
          </span>
        );
      case 'revision_needed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            Perlu Revisi
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
            Menunggu Koreksi
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mr-3"></div>
        <span>Memuat materi penugasan Kaku...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 p-4 md:p-6 text-slate-100">
      {/* 1. Header & Instructions Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/90 via-indigo-950/40 to-slate-900/90 border border-indigo-500/20 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-2">
              Buku PR Digital Kaku (書く)
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              {assignment?.title || `Latihan Menulis Bab ${chapterId}`}
            </h2>
            <p className="mt-2 text-slate-300 text-sm leading-relaxed max-w-2xl">
              {assignment?.instructions ||
                'Tuliskan karakter di lembar kotak-kotak fisik Anda. Foto hasilnya dan unggah di sini.'}
            </p>
          </div>

          {assignment?.sample_sheet_pdf_url && (
            <a
              href={assignment.sample_sheet_pdf_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-all shadow-md shrink-0"
            >
              <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Unduh Lembar Kotak (PDF)
            </a>
          )}
        </div>
      </div>

      {/* 2. Photo Upload & Compression Interface */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 md:p-8 backdrop-blur-md shadow-xl">
        <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
          Unggah Lembar Hasil Tulisan Tangan
        </h3>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-sm flex items-center gap-3">
            <svg className="w-5 h-5 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-sm flex items-center gap-3">
            <svg className="w-5 h-5 shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Compression / Preview Panel */}
        {previewUrl ? (
          <div className="space-y-4">
            <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950 max-h-96 flex items-center justify-center">
              <img
                src={previewUrl}
                alt="Pratinjau Lembar Tugas Kaku"
                className="max-h-96 w-auto object-contain rounded-lg"
              />
            </div>

            {/* Compression Stats Badge */}
            {compressionStats && (
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">Ukuran Asli Kamera: <strong className="text-slate-200">{compressionStats.originalSizeKb} KB</strong></span>
                  <span className="text-indigo-400">➔</span>
                  <span className="text-slate-400">Setelah Kompresi WebP: <strong className="text-emerald-400">{compressionStats.compressedSizeKb} KB</strong></span>
                </div>
                <div className="inline-flex items-center gap-1.5 font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/30">
                  ⚡ Hemat Bandwidth {compressionStats.compressionRatioPercent}%
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isUploading}
                className="flex-1 min-w-[200px] py-3 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Mengirim Tugas...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Kirim Tugas ke Sensei</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setPreviewUrl(null);
                  setCompressionStats(null);
                }}
                disabled={isUploading}
                className="px-5 py-3 rounded-xl font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Foto Ulang
              </button>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500/50 rounded-2xl p-8 text-center transition-all bg-slate-950/40">
            {isCompressing ? (
              <div className="py-8 space-y-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-400 mx-auto"></div>
                <p className="text-sm font-semibold text-indigo-300">
                  Mengompresi ukuran foto tulisan tangan secara otomatis...
                </p>
                <p className="text-xs text-slate-400">
                  Mempertahankan ketajaman goresan tinta/pensil dengan kompresi WebP
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>

                <div>
                  <h4 className="text-base font-semibold text-slate-200">
                    Ambil Foto Lembar Tugas atau Pilih dari Galeri
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Foto akan dikompresi otomatis di HP Anda sebelum dikirim agar hemat kuota dan super cepat.
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  {/* Camera Button (Mobile) */}
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-white text-xs transition-all shadow-md shadow-indigo-600/30"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    </svg>
                    Buka Kamera Ponsel
                  </button>

                  {/* Gallery/File Picker */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold text-slate-200 text-xs transition-colors border border-slate-700"
                  >
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Pilih File Gambar
                  </button>
                </div>

                {/* Hidden File Inputs */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelection(file);
                  }}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelection(file);
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Submissions History & Tracking */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 md:p-8 backdrop-blur-md shadow-xl">
        <h3 className="text-lg font-bold text-slate-200 mb-6 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Riwayat & Pemantauan Status PR Kaku
          </span>
          <span className="text-xs font-normal text-slate-400">
            Total {submissions.length} Pengumpulan
          </span>
        </h3>

        {submissions.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            Belum ada tugas yang dikumpulkan untuk bab ini.
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((sub) => (
              <div
                key={sub.id}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors hover:border-slate-700"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-lg bg-slate-800 overflow-hidden shrink-0 border border-slate-700">
                    <img
                      src={sub.image_url}
                      alt="Thumbnail Tugas"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200 text-sm">
                        Pengumpulan Tugas
                      </span>
                      {getStatusBadge(sub.status)}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Waktu kirim: {new Date(sub.submitted_at).toLocaleString('id-ID')} • Ukuran terkompresi: {sub.compressed_size_kb} KB
                    </p>
                    {sub.sensei_notes && (
                      <div className="mt-2 text-xs p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/20 text-indigo-200">
                        💬 <strong>Catatan Sensei:</strong> {sub.sensei_notes}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <a
                    href={sub.image_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                  >
                    Lihat Foto
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
