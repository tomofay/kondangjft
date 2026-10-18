'use client';

import React, { useRef, useState } from 'react';
import { ExamResult } from '../types';
import { CheckCircle2, XCircle, Download, BookOpen, RefreshCw } from 'lucide-react';
import html2canvas from 'html2canvas';
import confetti from 'canvas-confetti';

interface JftResultReportProps {
  result: ExamResult;
  onOpenReview: () => void;
  onRetake: () => void;
}

export const JftResultReport: React.FC<JftResultReportProps> = ({
  result,
  onOpenReview,
  onRetake
}) => {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  // Normalize result only for legacy records where all packages were merged (>80 questions)
  const normalizedResult = React.useMemo(() => {
    const s = result.sectionScores;
    const totalMax = (s?.S1?.maxScore || 0) + (s?.S2?.maxScore || 0) + (s?.S3?.maxScore || 0) + (s?.S4?.maxScore || 0);
    if (totalMax > 80) {
      const s1Score = Math.min(s?.S1?.score || 0, 12);
      const s2Score = Math.min(s?.S2?.score || 0, 12);
      const s3Score = Math.min(s?.S3?.score || 0, 13);
      const s4Score = Math.min(s?.S4?.score || 0, 13);
      const totalCorrect = s1Score + s2Score + s3Score + s4Score;
      const totalScore = Math.min(250, Math.max(10, Math.round(10 + (totalCorrect / 50) * 240)));
      let assessmentResult = 'Tidak Lulus (Below A1)';
      let isPassed = false;
      if (totalScore >= 200) {
        assessmentResult = 'Lulus (A2.2)';
        isPassed = true;
      } else if (totalScore >= 175) {
        assessmentResult = 'Lulus (A2.1)';
        isPassed = true;
      } else if (totalScore >= 145) {
        assessmentResult = 'Lulus (A1)';
        isPassed = true;
      }
      return {
        ...result,
        totalScore,
        assessmentResult,
        isPassed,
        sectionScores: {
          S1: { score: s1Score, maxScore: 12, percentage: Math.round((s1Score / 12) * 100) },
          S2: { score: s2Score, maxScore: 12, percentage: Math.round((s2Score / 12) * 100) },
          S3: { score: s3Score, maxScore: 13, percentage: Math.round((s3Score / 13) * 100) },
          S4: { score: s4Score, maxScore: 13, percentage: Math.round((s4Score / 13) * 100) },
        }
      };
    }
    return result;
  }, [result]);

  // Trigger confetti if passed
  React.useEffect(() => {
    if (normalizedResult.isPassed) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [normalizedResult.isPassed]);

  const handleDownload = async () => {
    if (!certificateRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `Rapor_Simulasi_KondangSensei_${normalizedResult.userName.replace(/\s+/g, '_')}_${normalizedResult.testDate}.png`;
      link.click();
    } catch (err) {
      console.error('Failed downloading certificate image', err);
    } finally {
      setDownloading(false);
    }
  };

  // Score calculation marker position percentage (from 10 to 250)
  const calculatePinPercent = (score: number) => {
    const min = 10;
    const max = 250;
    const clamped = Math.max(min, Math.min(max, score));
    return ((clamped - min) / (max - min)) * 100;
  };

  const pinPercent = calculatePinPercent(normalizedResult.totalScore);

  const totalCorrect =
    (normalizedResult.sectionScores?.S1?.score || 0) +
    (normalizedResult.sectionScores?.S2?.score || 0) +
    (normalizedResult.sectionScores?.S3?.score || 0) +
    (normalizedResult.sectionScores?.S4?.score || 0);

  const totalQuestions =
    (normalizedResult.sectionScores?.S1?.maxScore || 0) +
    (normalizedResult.sectionScores?.S2?.maxScore || 0) +
    (normalizedResult.sectionScores?.S3?.maxScore || 0) +
    (normalizedResult.sectionScores?.S4?.maxScore || 0) ||
    normalizedResult.answers?.length || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl ${
              normalizedResult.isPassed ? 'bg-emerald-500 text-slate-950' : 'bg-red-500 text-white'
            }`}
          >
            {normalizedResult.isPassed ? <CheckCircle2 className="w-7 h-7" /> : <XCircle className="w-7 h-7" />}
          </div>
          <div>
            <h2 className="text-lg font-bold">
              {normalizedResult.isPassed ? 'Selamat! Anda Dinyatakan LULUS Simulasi CBT' : 'Hasil Simulasi: Belum Lulus'}
            </h2>
            <p className="text-xs text-slate-400">
              Skor Total: <span className="font-semibold text-amber-400">{normalizedResult.totalScore} / 250</span> • Level:{' '}
              <span className="font-semibold text-emerald-400">{normalizedResult.assessmentResult}</span>
              {totalQuestions > 0 && (
                <>
                  {' '}• Paket Soal:{' '}
                  <span className="font-semibold text-white">
                    {totalQuestions} Soal ({totalCorrect} Benar, {Math.max(0, totalQuestions - totalCorrect)} Salah)
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenReview}
            className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition shadow"
          >
            <BookOpen className="w-4 h-4" />
            Lihat Pembahasan Soal
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition shadow disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {downloading ? 'Mengunduh...' : 'Unduh Rapor KondangSensei'}
          </button>
          <button
            onClick={onRetake}
            className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-2 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Coba Ulang
          </button>
        </div>
      </div>

      {/* KondangSensei Simulation Certificate Container */}
      <div className="w-full overflow-x-auto pb-4">
        <div
          ref={certificateRef}
          className="bg-white text-slate-900 rounded-xl p-8 shadow-2xl border-4 border-slate-300 font-sans space-y-6 relative overflow-hidden select-none mx-auto"
          style={{ minWidth: '700px', maxWidth: '850px' }}
        >
          {/* Top Branding Header */}
          <div className="flex items-center justify-between border-b pb-4 border-slate-300">
            <div className="flex items-center gap-3">
              <div className="px-3.5 py-1.5 bg-indigo-600 text-white font-black text-xl tracking-tight rounded-xl shadow-sm">
                KondangSensei
              </div>
              <div className="text-xs font-bold text-slate-800 leading-tight">
                <div>KondangSensei CBT</div>
                <div className="text-[10px] text-slate-500 font-normal">Platform Simulasi Ujian Bahasa Jepang</div>
              </div>
            </div>

            <div className="border-2 border-indigo-600 bg-indigo-50 text-indigo-700 px-3.5 py-1 font-black tracking-wider text-[11px] uppercase rounded-lg shadow-sm">
              SIMULATION REPORT • LAPORAN EVALUASI
            </div>

            <div className="text-right">
              <div className="text-xs font-black text-slate-900 tracking-wider">
                KONDANG SENSEI INDONESIA
              </div>
              <div className="text-[10px] text-slate-500">
                Lembaga Pelatihan & Persiapan Kerja Jepang
              </div>
            </div>
          </div>

          {/* Certificate Main Title */}
          <div className="text-center space-y-1">
            <h1 className="text-xl font-black tracking-wide text-slate-900">
              KondangSensei CBT 日本語能力判定結果通知書
            </h1>
            <p className="text-xs font-bold text-slate-700 tracking-tight">
              KondangSensei CBT Japanese Assessment Test — Simulation Result Report
            </p>
            <div className="inline-block mt-1 px-3 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] text-slate-500 font-medium">
              * Dokumen ini diterbitkan resmi oleh KondangSensei sebagai lembar evaluasi hasil simulasi mandiri siswa.
            </div>
          </div>

          {/* Grid: Examinee Info & Test Info */}
          <div className="grid grid-cols-2 gap-4">
            {/* Examinee Info Box */}
            <div className="border border-slate-300 rounded-lg p-3 bg-slate-50 space-y-2">
              <div className="text-xs font-bold text-slate-700 border-b border-slate-200 pb-1">
                受験者情報 <span className="font-normal text-[10px]">Examinee information</span>
              </div>
              <div className="flex gap-3 text-xs">
                <img
                  src={normalizedResult.facePhotoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"}
                  alt="Face Photo"
                  className="w-16 h-20 object-cover rounded border border-slate-300 bg-slate-200"
                />
                <div className="space-y-1 flex-1 text-[11px]">
                  <div>
                    <span className="text-slate-500">受験番号 / Reg No:</span>{' '}
                    <span className="font-bold">{normalizedResult.registrationNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">氏名 / Name:</span>{' '}
                    <span className="font-bold">{normalizedResult.userName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">国籍 / Nationality:</span>{' '}
                    <span className="font-semibold uppercase">{normalizedResult.nationality || 'INDONESIA'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">生年月日 / Date of Birth:</span>{' '}
                    <span className="font-semibold">{normalizedResult.dateOfBirth || '2001/05/14'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">性別 / Sex:</span>{' '}
                    <span className="font-semibold uppercase">{normalizedResult.sex || 'MALE'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Test Info Box */}
            <div className="border border-slate-300 rounded-lg p-3 bg-slate-50 space-y-2">
              <div className="text-xs font-bold text-slate-700 border-b border-slate-200 pb-1">
                受験情報 <span className="font-normal text-[10px]">Test information</span>
              </div>
              <div className="space-y-2 text-xs pt-1">
                <div>
                  <div className="text-slate-500 text-[10px]">・受験地 / Test Location:</div>
                  <div className="font-semibold text-slate-800 text-[11px] pl-2">{normalizedResult.testLocation || 'KondangSensei CBT Online Simulator'}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px]">・受験日 / Test Date:</div>
                  <div className="font-semibold text-slate-800 text-[11px] pl-2">{normalizedResult.testDate}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Score and Assessment Results Section */}
          <div className="border-2 border-slate-400 rounded-xl p-5 bg-white space-y-5 shadow-sm">
            <div className="flex items-start justify-between border-b pb-4 border-slate-200">
              <div className="space-y-2">
                <div className="flex items-baseline gap-3">
                  <span className="text-xs font-bold text-slate-800">総合得分 : <span className="text-[10px] text-slate-500 font-normal">Total Score</span></span>
                  <span className="text-3xl font-black text-slate-900 tracking-tight">{normalizedResult.totalScore}</span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-xs font-bold text-slate-800">判定結果 : <span className="text-[10px] text-slate-500 font-normal">Assessment Results</span></span>
                  <span className={`text-2xl font-black tracking-tight ${normalizedResult.isPassed ? 'text-emerald-700' : 'text-red-600'}`}>
                    {normalizedResult.assessmentResult}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-600 space-y-0.5 text-right">
                <div>得点範囲 (Range of Scores) : <strong>10-250</strong></div>
                <div>判定基準 (Passing Benchmark Standards) :</div>
                <div className="font-mono text-[10px] bg-slate-100 p-1.5 rounded border border-slate-200">
                  A1 : 145, A2.1 : 175, A2.2 (A2) : 200
                </div>
              </div>
            </div>

            {/* Graphical Score Gauge Bar with Accurate Coordinate Markers */}
            <div className="space-y-3 px-2 pt-1">
              {/* Threshold Labels accurately positioned over their respective dividers */}
              <div className="relative h-6 text-[10px] font-bold text-slate-700">
                <span className="absolute left-0 top-0">10</span>
                <span className="absolute left-[56.25%] -translate-x-1/2 top-0 text-indigo-700 font-extrabold whitespace-nowrap bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 shadow-xs">
                  145 (A1)
                </span>
                <span className="absolute left-[68.75%] -translate-x-1/2 top-0 text-blue-700 font-extrabold whitespace-nowrap bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 shadow-xs">
                  175 (A2.1)
                </span>
                <span className="absolute left-[79.17%] -translate-x-1/2 top-0 text-emerald-700 font-extrabold whitespace-nowrap bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shadow-xs">
                  200 (A2.2)
                </span>
                <span className="absolute right-0 top-0">250</span>
              </div>

              {/* The Bar */}
              <div className="relative h-7 rounded-full bg-gradient-to-r from-red-200 via-amber-200 via-emerald-200 to-emerald-500 border-2 border-slate-400 shadow-inner overflow-visible">
                {/* Threshold Divider Lines */}
                <div className="absolute left-[56.25%] top-0 bottom-0 w-0.5 bg-slate-900 z-10" title="Ambang A1 (145)"></div>
                <div className="absolute left-[68.75%] top-0 bottom-0 w-0.5 bg-slate-900 z-10" title="Ambang A2.1 (175)"></div>
                <div className="absolute left-[79.17%] top-0 bottom-0 w-0.5 bg-slate-900 z-10" title="Ambang A2.2 (200)"></div>

                {/* Pin Indicator */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 transition-all duration-700"
                  style={{ left: `${pinPercent}%` }}
                >
                  <div className="relative flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full bg-white border-2 border-amber-600 shadow-lg flex items-center justify-center ring-2 ring-amber-400/50">
                      <div className="w-3 h-3 rounded-full bg-amber-600 animate-ping"></div>
                    </div>
                    {/* Floating Score Tag directly below the pin */}
                    <div className="absolute -bottom-6 px-1.5 py-0.5 rounded bg-slate-900 text-white text-[9px] font-black tracking-tight whitespace-nowrap shadow-md border border-slate-700">
                      Skor: {normalizedResult.totalScore}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom guide explanation */}
              <div className="flex justify-between text-[9px] text-slate-500 pt-3 px-1 font-medium">
                <span>Kurang dari A1 (&lt; 145)</span>
                <span className="text-indigo-600 font-semibold">Taraf Dasar A1 (145 - 174)</span>
                <span className="text-blue-600 font-semibold">Taraf Mandiri A2.1 (175 - 199)</span>
                <span className="text-emerald-600 font-semibold">Taraf Utama A2.2 (≥ 200)</span>
              </div>
            </div>

            {/* Section Breakdown Percentage Progress Gauges */}
            <div className="pt-2 space-y-3">
              <div className="text-xs font-bold text-slate-800">
                セクション毎の正答率 : <span className="text-[10px] text-slate-500 font-normal">The percentage of correct answers for each section</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* S1 */}
                <div className="space-y-1 bg-slate-50 p-2.5 rounded border border-slate-200">
                  <div className="flex justify-between font-semibold text-slate-800 text-[11px]">
                    <span>文字と語彙 (Script and Vocabulary)</span>
                    <span className="font-bold text-slate-900">
                      {(normalizedResult.sectionScores?.S1?.maxScore || 0) > 0 ? `${normalizedResult.sectionScores.S1.percentage}%` : '-'}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${(normalizedResult.sectionScores?.S1?.maxScore || 0) > 0 ? normalizedResult.sectionScores.S1.percentage : 0}%` }}
                    ></div>
                  </div>
                  <div className="text-[10px] text-slate-500 text-right">
                    {(normalizedResult.sectionScores?.S1?.maxScore || 0) > 0
                      ? `${normalizedResult.sectionScores.S1.score} / ${normalizedResult.sectionScores.S1.maxScore} Soal Benar`
                      : 'Tidak diujikan dalam paket ini'}
                  </div>
                </div>

                {/* S2 */}
                <div className="space-y-1 bg-slate-50 p-2.5 rounded border border-slate-200">
                  <div className="flex justify-between font-semibold text-slate-800 text-[11px]">
                    <span>会話と表現 (Conversation and Expression)</span>
                    <span className="font-bold text-slate-900">
                      {(normalizedResult.sectionScores?.S2?.maxScore || 0) > 0 ? `${normalizedResult.sectionScores.S2.percentage}%` : '-'}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${(normalizedResult.sectionScores?.S2?.maxScore || 0) > 0 ? normalizedResult.sectionScores.S2.percentage : 0}%` }}
                    ></div>
                  </div>
                  <div className="text-[10px] text-slate-500 text-right">
                    {(normalizedResult.sectionScores?.S2?.maxScore || 0) > 0
                      ? `${normalizedResult.sectionScores.S2.score} / ${normalizedResult.sectionScores.S2.maxScore} Soal Benar`
                      : 'Tidak diujikan dalam paket ini'}
                  </div>
                </div>

                {/* S3 */}
                <div className="space-y-1 bg-slate-50 p-2.5 rounded border border-slate-200">
                  <div className="flex justify-between font-semibold text-slate-800 text-[11px]">
                    <span>聴解 (Listening Comprehension)</span>
                    <span className="font-bold text-slate-900">
                      {(normalizedResult.sectionScores?.S3?.maxScore || 0) > 0 ? `${normalizedResult.sectionScores.S3.percentage}%` : '-'}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${(normalizedResult.sectionScores?.S3?.maxScore || 0) > 0 ? normalizedResult.sectionScores.S3.percentage : 0}%` }}
                    ></div>
                  </div>
                  <div className="text-[10px] text-slate-500 text-right">
                    {(normalizedResult.sectionScores?.S3?.maxScore || 0) > 0
                      ? `${normalizedResult.sectionScores.S3.score} / ${normalizedResult.sectionScores.S3.maxScore} Soal Benar`
                      : 'Tidak diujikan dalam paket ini'}
                  </div>
                </div>

                {/* S4 */}
                <div className="space-y-1 bg-slate-50 p-2.5 rounded border border-slate-200">
                  <div className="flex justify-between font-semibold text-slate-800 text-[11px]">
                    <span>読解 (Reading Comprehension)</span>
                    <span className="font-bold text-slate-900">
                      {(normalizedResult.sectionScores?.S4?.maxScore || 0) > 0 ? `${normalizedResult.sectionScores.S4.percentage}%` : '-'}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${(normalizedResult.sectionScores?.S4?.maxScore || 0) > 0 ? normalizedResult.sectionScores.S4.percentage : 0}%` }}
                    ></div>
                  </div>
                  <div className="text-[10px] text-slate-500 text-right">
                    {(normalizedResult.sectionScores?.S4?.maxScore || 0) > 0
                      ? `${normalizedResult.sectionScores.S4.score} / ${normalizedResult.sectionScores.S4.maxScore} Soal Benar`
                      : 'Tidak diujikan dalam paket ini'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-500 space-y-1 font-sans pt-3 border-t border-slate-200">
            <div className="font-bold text-slate-700">
              Diterbitkan oleh Platform Simulasi KondangSensei CBT • Hak Cipta © KondangSensei Indonesia
            </div>
            <div className="text-[9px] text-slate-400">
              Pemberitahuan: Dokumen ini diterbitkan oleh KondangSensei Indonesia sebagai lembar evaluasi hasil simulasi mandiri siswa dan bukan merupakan dokumen sertifikasi dari lembaga negara/pihak ketiga manapun.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
