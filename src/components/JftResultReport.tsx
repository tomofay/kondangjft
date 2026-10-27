'use client';

import React, { useRef, useState, useEffect } from 'react';
import { ExamResult, User } from '../types';
import { BookOpen, RefreshCw, CheckCircle2, Printer, FileText, Image as ImageIcon } from 'lucide-react';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import confetti from 'canvas-confetti';

interface JftResultReportProps {
  result: ExamResult;
  currentUser?: User | null;
  onOpenReview: () => void;
  onRetake: () => void;
}

import { DEFAULT_ANONYMOUS_PHOTO } from '../lib/dataStore';

const KondangInstitutionReportLogo: React.FC<{ className?: string }> = ({ className = 'h-9' }) => (
  <div className={`flex items-center gap-2.5 select-none text-right ${className}`}>
    <div className="flex flex-col items-end leading-tight">
      <span className="text-xs font-black tracking-tight text-stone-900 uppercase">
        KONDANG SENSEI INDONESIA
      </span>
      <span className="text-[9px] text-stone-500 font-medium">
        Lembaga Pelatihan & Persiapan Kerja Jepang
      </span>
    </div>
  </div>
);

export const JftResultReport: React.FC<JftResultReportProps> = ({
  result,
  currentUser,
  onOpenReview,
  onRetake
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const certificateRef = useRef<HTMLDivElement>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingPng, setDownloadingPng] = useState(false);
  const [scale, setScale] = useState(1);
  const [certHeight, setCertHeight] = useState(1180);
  const [zoomMode, setZoomMode] = useState<'fit' | 'full'>('fit');

  // Normalize result
  const normalizedResult = React.useMemo(() => {
    const s = result.sectionScores;
    const totalMax =
      (s?.S1?.maxScore || 0) +
      (s?.S2?.maxScore || 0) +
      (s?.S3?.maxScore || 0) +
      (s?.S4?.maxScore || 0);

    if (totalMax > 80) {
      const s1Score = Math.min(s?.S1?.score || 0, 12);
      const s2Score = Math.min(s?.S2?.score || 0, 12);
      const s3Score = Math.min(s?.S3?.score || 0, 13);
      const s4Score = Math.min(s?.S4?.score || 0, 13);
      const totalCorrect = s1Score + s2Score + s3Score + s4Score;
      const totalScore = Math.min(250, Math.max(10, Math.round(10 + (totalCorrect / 50) * 240)));

      let assessmentResult = 'A2.2';
      let assessmentSub = '(A2到達, reached A2)';
      let isPassed = true;

      if (totalScore < 145) {
        assessmentResult = 'Below A1';
        assessmentSub = '(A1未到達, not reached A1)';
        isPassed = false;
      } else if (totalScore < 175) {
        assessmentResult = 'A1';
        assessmentSub = '(A1到達, not reached A2)';
        isPassed = false;
      } else if (totalScore < 200) {
        assessmentResult = 'A2.1';
        assessmentSub = '(A2未到達, not reached A2)';
        isPassed = false;
      }

      return {
        ...result,
        totalScore,
        assessmentResult,
        assessmentSub,
        isPassed,
        sectionScores: {
          S1: { score: s1Score, maxScore: 12, percentage: Math.round((s1Score / 12) * 100) },
          S2: { score: s2Score, maxScore: 12, percentage: Math.round((s2Score / 12) * 100) },
          S3: { score: s3Score, maxScore: 13, percentage: Math.round((s3Score / 13) * 100) },
          S4: { score: s4Score, maxScore: 13, percentage: Math.round((s4Score / 13) * 100) }
        }
      };
    }

    // Standard single package result
    let assessmentResult = 'A2.2';
    let assessmentSub = '(A2到達, reached A2)';
    let isPassed = true;

    if (result.totalScore < 145) {
      assessmentResult = 'Below A1';
      assessmentSub = '(A1未到達, not reached A1)';
      isPassed = false;
    } else if (result.totalScore < 175) {
      assessmentResult = 'A1';
      assessmentSub = '(A1到達, not reached A2)';
      isPassed = false;
    } else if (result.totalScore < 200) {
      assessmentResult = 'A2.1';
      assessmentSub = '(A2未到達, not reached A2)';
      isPassed = false;
    }

    return {
      ...result,
      assessmentResult,
      assessmentSub,
      isPassed
    };
  }, [result]);

  // Resolve Examinee Photo: Prioritas foto profil peserta aktif / hasil ujian
  const examineePhoto = React.useMemo(() => {
    if (result.facePhotoUrl && result.facePhotoUrl.length > 5) {
      return result.facePhotoUrl;
    }
    if (currentUser?.facePhotoUrl && currentUser.facePhotoUrl.length > 5) {
      return currentUser.facePhotoUrl;
    }
    return DEFAULT_ANONYMOUS_PHOTO;
  }, [currentUser, normalizedResult.facePhotoUrl, result.userId]);

  // Trigger confetti if passed
  useEffect(() => {
    if (normalizedResult.isPassed) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [normalizedResult.isPassed]);

  // Dynamic A4 auto-scale calculation to fit any screen
  useEffect(() => {
    const updateDimensions = () => {
      if (certificateRef.current) {
        const h = certificateRef.current.offsetHeight;
        if (h > 200) setCertHeight(h);
      }
      if (wrapperRef.current) {
        const availableWidth = wrapperRef.current.clientWidth;
        if (availableWidth > 0) {
          if (zoomMode === 'fit') {
            // Standard A4 width is 800px. If screen is smaller, scale down seamlessly
            const targetScale = Math.min(1, availableWidth / 800);
            setScale(targetScale);
          } else {
            setScale(1);
          }
        }
      }
    };

    updateDimensions();
    const timer = setTimeout(updateDimensions, 150);

    window.addEventListener('resize', updateDimensions);
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && wrapperRef.current) {
      ro = new ResizeObserver(updateDimensions);
      ro.observe(wrapperRef.current);
    }

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateDimensions);
      if (ro) ro.disconnect();
    };
  }, [zoomMode, result]);

  // Direct PDF Download via html2canvas-pro + jsPDF
  const handleDownloadPdf = async () => {
    if (!certificateRef.current) return;
    setDownloadingPdf(true);
    try {
      const element = certificateRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 1200,
        onclone: (clonedDoc: Document) => {
          const el = clonedDoc.getElementById('jft-certificate-container');
          if (el) {
            el.style.width = '800px';
            el.style.transform = 'none';
            el.style.boxShadow = 'none';
          }
        }
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const margin = 8;
      const contentWidth = pdfWidth - (margin * 2);
      const contentHeight = (canvas.height * contentWidth) / canvas.width;

      if (contentHeight > (pdfHeight - margin * 2)) {
        const scaleFactor = (pdfHeight - margin * 2) / contentHeight;
        const finalWidth = contentWidth * scaleFactor;
        const finalHeight = contentHeight * scaleFactor;
        const xOffset = (pdfWidth - finalWidth) / 2;
        pdf.addImage(imgData, 'JPEG', xOffset, margin, finalWidth, finalHeight, undefined, 'FAST');
      } else {
        const yOffset = (pdfHeight - contentHeight) / 2;
        pdf.addImage(imgData, 'JPEG', margin, yOffset, contentWidth, contentHeight, undefined, 'FAST');
      }

      const safeName = (normalizedResult.userName || 'Peserta').replace(/[^a-zA-Z0-9_-]/g, '_');
      pdf.save(`Rapor_Hasil_JFT_${safeName}.pdf`);
    } catch (err) {
      console.error('Failed generating PDF certificate', err);
      window.print();
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Direct PNG Download
  const handleDownloadPng = async () => {
    if (!certificateRef.current) return;
    setDownloadingPng(true);
    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 1200,
        onclone: (clonedDoc: Document) => {
          const el = clonedDoc.getElementById('jft-certificate-container');
          if (el) {
            el.style.width = '800px';
            el.style.transform = 'none';
            el.style.boxShadow = 'none';
          }
        }
      });
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      const safeName = (normalizedResult.userName || 'Peserta').replace(/[^a-zA-Z0-9_-]/g, '_');
      link.download = `Rapor_Hasil_JFT_${safeName}.png`;
      link.click();
    } catch (err) {
      console.error('Failed downloading certificate image', err);
    } finally {
      setDownloadingPng(false);
    }
  };

  // Browser Native Print / Save as PDF
  const handlePrint = () => {
    window.print();
  };

  // Score calculation marker position percentage (from 10 to 250)
  const calculatePinPercent = (score: number) => {
    const min = 10;
    const max = 250;
    const clamped = Math.max(min, Math.min(max, score));
    return ((clamped - min) / (max - min)) * 100;
  };

  const pinPercent = calculatePinPercent(normalizedResult.totalScore);

  // Format date helper: YYYY/MM/DD
  const formatYmd = (dateStr?: string) => {
    if (!dateStr) return '2026/10/22 (yyyy/mm/dd)';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}/${m}/${day} (yyyy/mm/dd)`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 print:max-w-none print:m-0 print:p-0 print:space-y-0">
      {/* Top Action Bar (Hidden during Print) */}
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-5 bg-white text-stone-900 rounded-3xl shadow-sm border border-stone-200">
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-xl shadow-xs shrink-0 ${
              normalizedResult.isPassed
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base md:text-lg font-black text-stone-900 leading-tight">
              {normalizedResult.isPassed
                ? 'Selamat! Anda Memenuhi Kualifikasi A2 (A2到達)'
                : 'Hasil Penilaian: Belum Mencapai Target A2 (A2未到達)'}
            </h2>
            <p className="text-xs text-stone-500 font-medium">
              Skor Total: <strong className="text-stone-900">{normalizedResult.totalScore} / 250</strong> • Status:{' '}
              <strong className={normalizedResult.isPassed ? 'text-emerald-700' : 'text-stone-800'}>
                {normalizedResult.assessmentResult} {normalizedResult.assessmentSub}
              </strong>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={onOpenReview}
            className="flex-1 sm:flex-initial py-2.5 px-3.5 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span>Pembahasan</span>
          </button>
          
          {/* Main Direct PDF Export */}
          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="flex-1 sm:flex-initial py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl flex items-center justify-center gap-2 transition shadow-xs disabled:opacity-50 cursor-pointer"
            title="Download Dokumen Rapor JFT dalam format PDF Resmi"
          >
            <FileText className="w-4 h-4" />
            <span>{downloadingPdf ? 'Menyimpan...' : 'Unduh PDF'}</span>
          </button>

          {/* Native Print / Save as PDF */}
          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-initial py-2.5 px-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
            title="Cetak langsung atau simpan melalui dialog cetak browser (Ctrl + P)"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden xs:inline">Cetak /</span><span>PDF</span>
          </button>

          {/* Secondary PNG Download */}
          <button
            onClick={handleDownloadPng}
            disabled={downloadingPng}
            className="py-2.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium rounded-xl flex items-center justify-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
            title="Unduh sebagai file gambar PNG"
          >
            <ImageIcon className="w-4 h-4 text-stone-500" />
            <span>{downloadingPng ? '...' : 'PNG'}</span>
          </button>

          <button
            onClick={onRetake}
            className="py-2.5 px-3.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Ulang</span>
          </button>
        </div>
      </div>

      {/* Official JFT Notification of Assessment Results Document (Authentic A4 Format with Responsive Dynamic Scaling) */}
      <div className="w-full flex flex-col items-center">
        {/* Subtle responsive info pill when viewed on small screens */}
        {scale < 1 && (
          <div className="w-full flex items-center justify-between pb-2.5 px-2 text-[11px] text-stone-500 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Sertifikat otomatis disesuaikan ({Math.round(scale * 100)}%)
            </span>
            <button
              type="button"
              onClick={() => setZoomMode(zoomMode === 'fit' ? 'full' : 'fit')}
              className="px-2.5 py-1 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
            >
              {zoomMode === 'fit' ? 'Perbesar 100%' : 'Pas Layar'}
            </button>
          </div>
        )}

        <div
          ref={wrapperRef}
          className={`w-full flex justify-center ${zoomMode === 'full' ? 'overflow-x-auto pb-4' : 'overflow-hidden'}`}
          style={{
            height: zoomMode === 'fit' && scale < 1 ? `${Math.ceil(certHeight * scale)}px` : 'auto',
          }}
        >
          <div
            style={{
              width: '800px',
              transform: zoomMode === 'fit' && scale < 1 ? `scale(${scale})` : undefined,
              transformOrigin: 'top center',
              flexShrink: 0,
            }}
          >
            <div
              ref={certificateRef}
              id="jft-certificate-container"
              style={{ width: '800px', minHeight: '1050px' }}
              className="bg-white text-stone-900 p-10 sm:p-12 shadow-xl border border-stone-300 font-sans space-y-6 relative select-none mx-auto print:shadow-none print:border-none print:p-0 print:m-0 print:w-full print:transform-none rounded-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-stone-200 pb-4">
                <div className="px-3.5 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-red-700 text-xs font-black uppercase tracking-wider">
                  SIMULATION REPORT • LAPORAN EVALUASI
                </div>
                <KondangInstitutionReportLogo className="h-10" />
              </div>

              {/* Centered Document Titles */}
              <div className="text-center space-y-1.5 pt-1">
                <h1 className="text-2xl font-black tracking-wide text-stone-900 font-japanese leading-tight">
                  KondangSensei CBT 日本語能力判定結果通知書
                </h1>
                <p className="text-[13px] text-stone-700 font-medium">
                  KondangSensei CBT Japanese Assessment Test — Simulation Result Report
                </p>
                <p className="text-[10px] text-stone-500 font-medium">
                  * Dokumen ini diterbitkan resmi oleh KondangSensei sebagai lembar evaluasi hasil simulasi mandiri siswa.
                </p>
              </div>

              {/* Examinee Information Section (Authentic A4 Side-by-Side Layout) */}
              <div className="flex items-start gap-8 pt-2 pb-2">
                {/* Left Photo */}
                <div className="shrink-0">
                  <img
                    src={examineePhoto}
                    alt="Examinee Photo"
                    onLoad={() => {
                      if (certificateRef.current) {
                        const h = certificateRef.current.offsetHeight;
                        if (h > 200) setCertHeight(h);
                      }
                    }}
                    className="w-36 h-48 object-cover border border-stone-300 bg-stone-100 rounded-sm shadow-2xs"
                  />
                </div>

                {/* Right Information Rows */}
                <div className="flex-1 space-y-2 text-[13px] text-stone-900">
                  {/* Reg No */}
                  <div className="grid grid-cols-[160px_1fr] items-start">
                    <div>
                      <span className="font-bold font-japanese">受験番号</span>
                      <div className="text-[10px] text-stone-600">Registration Number</div>
                    </div>
                    <div className="font-mono font-bold text-stone-950 flex items-center gap-1.5 pt-0.5">
                      <span>:</span>
                      <span>{normalizedResult.registrationNumber || '4892716382'}</span>
                    </div>
                  </div>

                  {/* Name */}
                  <div className="grid grid-cols-[160px_1fr] items-start">
                    <div>
                      <span className="font-bold font-japanese">氏名</span>
                      <div className="text-[10px] text-stone-600">Name</div>
                    </div>
                    <div className="font-bold uppercase text-stone-950 flex items-center gap-1.5 pt-0.5">
                      <span>:</span>
                      <span>{normalizedResult.userName}</span>
                    </div>
                  </div>

                  {/* Nationality */}
                  <div className="grid grid-cols-[160px_1fr] items-start">
                    <div>
                      <span className="font-bold font-japanese">国籍</span>
                      <div className="text-[10px] text-stone-600">Nationality</div>
                    </div>
                    <div className="font-medium text-stone-950 flex items-center gap-1.5 pt-0.5">
                      <span>:</span>
                      <span>{normalizedResult.nationality || 'Indonesia'}</span>
                    </div>
                  </div>

                  {/* Date of Birth */}
                  <div className="grid grid-cols-[160px_1fr] items-start">
                    <div>
                      <span className="font-bold font-japanese">生年月日</span>
                      <div className="text-[10px] text-stone-600">Date of Birth</div>
                    </div>
                    <div className="font-mono text-stone-950 flex items-center gap-1.5 pt-0.5">
                      <span>:</span>
                      <span>{formatYmd(normalizedResult.dateOfBirth)}</span>
                    </div>
                  </div>

                  {/* Sex */}
                  <div className="grid grid-cols-[160px_1fr] items-start">
                    <div>
                      <span className="font-bold font-japanese">性別</span>
                      <div className="text-[10px] text-stone-600">Sex</div>
                    </div>
                    <div className="font-medium text-stone-950 flex items-center gap-1.5 pt-0.5">
                      <span>:</span>
                      <span>{normalizedResult.sex === 'FEMALE' ? 'Female' : 'Male'}</span>
                    </div>
                  </div>

                  {/* Test Location */}
                  <div className="grid grid-cols-[160px_1fr] items-start">
                    <div>
                      <span className="font-bold font-japanese">受験地</span>
                      <div className="text-[10px] text-stone-600">Test Location</div>
                    </div>
                    <div className="font-medium text-stone-950 flex items-center gap-1.5 pt-0.5">
                      <span>:</span>
                      <span>{normalizedResult.testLocation || 'Indonesia'}</span>
                    </div>
                  </div>

                  {/* Test Date */}
                  <div className="grid grid-cols-[160px_1fr] items-start">
                    <div>
                      <span className="font-bold font-japanese">受験日</span>
                      <div className="text-[10px] text-stone-600">Test Date</div>
                    </div>
                    <div className="font-mono text-stone-950 flex items-center gap-1.5 pt-0.5">
                      <span>:</span>
                      <span>{formatYmd(normalizedResult.testDate)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assessment Results Section Box (Exact Replica) */}
              <div className="border border-stone-300 p-6 sm:p-7 bg-white space-y-6">
                {/* Top Score & Result Header */}
                <div className="flex items-start justify-between">
                  <div className="space-y-4">
                    {/* Total Score */}
                    <div className="flex items-start gap-4">
                      <div className="w-28">
                        <div className="font-bold font-japanese text-sm text-stone-900 leading-tight">総合得点:</div>
                        <div className="text-[11px] text-stone-600">Total Score</div>
                      </div>
                      <div className="text-4xl font-black text-stone-950 tracking-tight font-mono leading-none">
                        {normalizedResult.totalScore}
                      </div>
                    </div>

                    {/* Assessment Result Level */}
                    <div className="flex items-start gap-4">
                      <div className="w-28">
                        <div className="font-bold font-japanese text-sm text-stone-900 leading-tight">判定結果:</div>
                        <div className="text-[11px] text-stone-600">Assessment Results</div>
                      </div>
                      <div>
                        <div className="text-3xl font-black text-stone-950 tracking-tight leading-none">
                          {normalizedResult.assessmentResult}
                        </div>
                        <div className="text-xs font-bold text-stone-700 mt-1">
                          {normalizedResult.assessmentSub}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Passing Benchmark Standards */}
                  <div className="text-right text-xs text-stone-800 space-y-1">
                    <div>
                      <span className="font-japanese">得点範囲:</span> 10-250
                      <div className="text-[10px] text-stone-500">Range of Scores</div>
                    </div>
                    <div className="pt-1">
                      <span className="font-japanese">判定基準点</span> A1: 145, A2.1: 175, A2.2(A2): 200
                      <div className="text-[10px] text-stone-500">Passing Score</div>
                    </div>
                  </div>
                </div>

                {/* Scale Gauge Bar */}
                <div className="pt-7 pb-4">
                  <div className="relative">
                    {/* Horizontal Gradient Bar with Centered Indicator */}
                    <div className="h-4 w-full rounded-xs bg-gradient-to-r from-[#f9a8d4] via-[#f59e0b] to-[#84cc16] relative">
                      {/* Pin Score Tag directly above the marker */}
                      <div
                        className="absolute -top-6 -translate-x-1/2 z-20 font-black text-sm text-stone-950 font-mono pointer-events-none"
                        style={{ left: `${pinPercent}%` }}
                      >
                        {normalizedResult.totalScore}
                      </div>

                      {/* Pin Circular Indicator Centered on the Bar */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 pointer-events-none"
                        style={{ left: `${pinPercent}%` }}
                      >
                        <div className="w-4 h-4 rounded-full bg-amber-400 border-2 border-white shadow-xs ring-1 ring-stone-400"></div>
                      </div>

                      {/* Tick 10 (Left Edge) */}
                      <div className="absolute left-0 -top-1.5 -bottom-1.5 w-[2px] bg-black"></div>

                      {/* Tick 145 (A1) */}
                      <div className="absolute left-[56.25%] -top-1.5 -bottom-1.5 w-[2px] bg-black"></div>

                      {/* Tick 175 (A2.1) */}
                      <div className="absolute left-[68.75%] -top-1.5 -bottom-1.5 w-[2px] bg-black"></div>

                      {/* Tick 200 (A2.2) */}
                      <div className="absolute left-[79.17%] -top-1.5 -bottom-1.5 w-[2px] bg-black"></div>

                      {/* Tick 250 (Right Edge) */}
                      <div className="absolute right-0 -top-1.5 -bottom-1.5 w-[2px] bg-black"></div>
                    </div>

                    {/* Tick Labels Below */}
                    <div className="relative h-10 text-xs text-stone-900 font-mono mt-1.5">
                      <span className="absolute left-0 top-0">10</span>

                      <div className="absolute left-[56.25%] -translate-x-1/2 top-0 text-center leading-tight">
                        <div>145</div>
                        <div className="font-bold font-sans text-[11px]">A1</div>
                      </div>

                      <div className="absolute left-[68.75%] -translate-x-1/2 top-0 text-center leading-tight">
                        <div>175</div>
                        <div className="font-bold font-sans text-[11px]">A2.1</div>
                      </div>

                      <div className="absolute left-[79.17%] -translate-x-1/2 top-0 text-center leading-tight">
                        <div>200</div>
                        <div className="font-bold font-sans text-[11px]">A2.2(A2)</div>
                      </div>

                      <span className="absolute right-0 top-0">250</span>
                    </div>
                  </div>
                </div>

                {/* Section Breakdown Percentage Sliders */}
                <div className="space-y-4 pt-2">
                  <div className="text-[13px] text-stone-900 font-medium">
                    <span className="font-bold font-japanese">セクション毎の正答率 :</span>
                    <span className="text-[11px] text-stone-600 ml-1.5">
                      Percentage of Correct Answers for Each Section
                    </span>
                  </div>

                  {/* 4 Section Rows */}
                  <div className="space-y-3.5">
                    {[
                      {
                        code: 'S1',
                        ja: '文字と語彙',
                        en: 'Script and Vocabulary',
                        data: normalizedResult.sectionScores?.S1
                      },
                      {
                        code: 'S2',
                        ja: '会話と表現',
                        en: 'Conversation and Expression',
                        data: normalizedResult.sectionScores?.S2
                      },
                      {
                        code: 'S3',
                        ja: '聴解',
                        en: 'Listening Comprehension',
                        data: normalizedResult.sectionScores?.S3
                      },
                      {
                        code: 'S4',
                        ja: '読解',
                        en: 'Reading Comprehension',
                        data: normalizedResult.sectionScores?.S4
                      }
                    ].map((sec) => {
                      const pct = sec.data?.percentage ?? 0;
                      return (
                        <div key={sec.code} className="grid grid-cols-[220px_1fr] items-center gap-4">
                          {/* Left: Titles */}
                          <div>
                            <div className="font-bold font-japanese text-[13px] text-stone-900 leading-tight">
                              {sec.ja}
                            </div>
                            <div className="text-[10px] text-stone-600 leading-tight">
                              {sec.en}
                            </div>
                          </div>

                          {/* Right: Grey Track with Orange Pin & Percentage above */}
                          <div className="relative pt-4 pb-1">
                            {/* Percentage above pin */}
                            <div
                              className="absolute top-0 -translate-x-1/2 text-[11px] font-mono font-bold text-stone-900"
                              style={{ left: `${pct}%` }}
                            >
                              {pct}%
                            </div>

                            {/* Grey Track */}
                            <div className="h-3 w-full bg-stone-200 rounded-none relative">
                              {/* Orange Pin */}
                              <div
                                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                                style={{ left: `${pct}%` }}
                              >
                                <div className="w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-white shadow-xs ring-1 ring-stone-400"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Certificate Footer Notice */}
              <div className="pt-6 border-t border-stone-200 text-center space-y-1">
                <div className="text-xs font-bold text-stone-700">
                  Diterbitkan oleh Platform Simulasi KondangSensei CBT • Hak Cipta © KondangSensei Indonesia
                </div>
                <p className="text-[10px] text-stone-400">
                  Pemberitahuan: Dokumen ini diterbitkan oleh KondangSensei Indonesia sebagai lembar evaluasi hasil simulasi mandiri siswa dan bukan merupakan dokumen sertifikasi dari lembaga negara/pihak ketiga manapun.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
