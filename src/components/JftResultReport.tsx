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

  // Trigger confetti if passed
  React.useEffect(() => {
    if (result.isPassed) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [result.isPassed]);

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
      link.download = `Sertifikat_JFT_${result.userName.replace(/\s+/g, '_')}_${result.testDate}.png`;
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

  const pinPercent = calculatePinPercent(result.totalScore);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl ${
              result.isPassed ? 'bg-emerald-500 text-slate-950' : 'bg-red-500 text-white'
            }`}
          >
            {result.isPassed ? <CheckCircle2 className="w-7 h-7" /> : <XCircle className="w-7 h-7" />}
          </div>
          <div>
            <h2 className="text-lg font-bold">
              {result.isPassed ? 'Selamat! Anda Dinyatakan LULUS JFT' : 'Hasil Simulasi: Belum Lulus'}
            </h2>
            <p className="text-xs text-slate-400">
              Skor Total: <span className="font-semibold text-amber-400">{result.totalScore} / 250</span> • Level: {' '}
              <span className="font-semibold text-emerald-400">{result.assessmentResult}</span>
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
            {downloading ? 'Mengunduh...' : 'Unduh Rapor JFT'}
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

      {/* Official JFT Certificate Document Container (Replicating exact Japan Foundation Layout) */}
      <div
        ref={certificateRef}
        className="bg-white text-slate-900 rounded-xl p-8 shadow-2xl border-4 border-slate-300 font-sans space-y-6 relative overflow-hidden select-none"
        style={{ minWidth: '700px' }}
      >
        {/* Decorative Top Logos */}
        <div className="flex items-center justify-between border-b pb-4 border-slate-300">
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-slate-900 text-white font-extrabold text-xl tracking-tighter rounded">
              JFT-Basic
            </div>
            <div className="text-xs font-semibold text-slate-700 leading-tight">
              国際交流基金 日本語基礎テスト
            </div>
          </div>

          <div className="border-2 border-red-500 text-red-600 px-4 py-0.5 font-bold tracking-widest text-sm uppercase">
            SIMULATION CERTIFICATE
          </div>

          <div className="flex items-center gap-2 text-right">
            <div className="text-[11px] font-bold text-slate-800 tracking-wider">
              JAPANFOUNDATION 国際交流基金
            </div>
          </div>
        </div>

        {/* Certificate Main Title */}
        <div className="text-center space-y-1">
          <h1 className="text-xl font-extrabold tracking-wide text-slate-900">
            国際交流基金日本語基礎テスト 判定結果通知書
          </h1>
          <p className="text-xs font-bold text-slate-700 tracking-tight">
            Japan Foundation Test for Basic Japanese Notification of assessment results
          </p>
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
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
                alt="Face Photo"
                className="w-16 h-20 object-cover rounded border border-slate-300 bg-slate-200"
              />
              <div className="space-y-1 flex-1 text-[11px]">
                <div>
                  <span className="text-slate-500">受験番号 / Reg No:</span>{' '}
                  <span className="font-bold">{result.registrationNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500">氏名 / Name:</span>{' '}
                  <span className="font-bold">{result.userName}</span>
                </div>
                <div>
                  <span className="text-slate-500">国籍 / Nationality:</span> INDONESIA
                </div>
                <div>
                  <span className="text-slate-500">生年月日 / Date of Birth:</span> 2001/05/14
                </div>
                <div>
                  <span className="text-slate-500">性別 / Sex:</span> MALE
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
                <div className="font-semibold text-slate-800 text-[11px] pl-2">{result.testLocation}</div>
              </div>
              <div>
                <div className="text-slate-500 text-[10px]">・受験日 / Test Date:</div>
                <div className="font-semibold text-slate-800 text-[11px] pl-2">{result.testDate}</div>
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
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{result.totalScore}</span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-xs font-bold text-slate-800">判定結果 : <span className="text-[10px] text-slate-500 font-normal">Assessment Results</span></span>
                <span className={`text-2xl font-extrabold tracking-tight ${result.isPassed ? 'text-emerald-700' : 'text-red-600'}`}>
                  {result.assessmentResult}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-600 space-y-0.5 text-right">
              <div>得点範囲 (Range of Scores) : <strong>10-250</strong></div>
              <div>判定基準点 (Passing Score Standards) :</div>
              <div className="font-mono text-[10px] bg-slate-100 p-1.5 rounded border border-slate-200">
                A1 : 145, A2.1 : 175, A2.2 (A2) : 200
              </div>
            </div>
          </div>

          {/* Graphical Score Gauge Bar (Mirroring standard JFT Certificate) */}
          <div className="space-y-2 px-2">
            <div className="flex justify-between text-[10px] font-bold text-slate-700 px-1">
              <span>10</span>
              <span className="text-indigo-700">145 (A1)</span>
              <span className="text-blue-700">175 (A2.1)</span>
              <span className="text-emerald-700">200 (A2.2)</span>
              <span>250</span>
            </div>

            <div className="relative h-6 rounded-full bg-gradient-to-r from-pink-300 via-amber-200 via-emerald-300 to-green-500 border border-slate-400 shadow-inner overflow-visible">
              {/* Threshold Dividers */}
              <div className="absolute left-[56.25%] top-0 bottom-0 w-0.5 bg-slate-800 z-10"></div>
              <div className="absolute left-[68.75%] top-0 bottom-0 w-0.5 bg-slate-800 z-10"></div>
              <div className="absolute left-[79.16%] top-0 bottom-0 w-0.5 bg-slate-800 z-10"></div>

              {/* Pin Indicator */}
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 transition-all duration-700"
                style={{ left: `${pinPercent}%` }}
              >
                <div className="w-6 h-6 rounded-full bg-white border-2 border-amber-600 shadow-md flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-600 animate-ping"></div>
                </div>
              </div>
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
                  <span className="font-bold text-slate-900">{result.sectionScores.S1.percentage}%</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${result.sectionScores.S1.percentage}%` }}
                  ></div>
                </div>
                <div className="text-[10px] text-slate-500 text-right">
                  {result.sectionScores.S1.score} / {result.sectionScores.S1.maxScore} Soal Benar
                </div>
              </div>

              {/* S2 */}
              <div className="space-y-1 bg-slate-50 p-2.5 rounded border border-slate-200">
                <div className="flex justify-between font-semibold text-slate-800 text-[11px]">
                  <span>会話と表現 (Conversation and Expression)</span>
                  <span className="font-bold text-slate-900">{result.sectionScores.S2.percentage}%</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${result.sectionScores.S2.percentage}%` }}
                  ></div>
                </div>
                <div className="text-[10px] text-slate-500 text-right">
                  {result.sectionScores.S2.score} / {result.sectionScores.S2.maxScore} Soal Benar
                </div>
              </div>

              {/* S3 */}
              <div className="space-y-1 bg-slate-50 p-2.5 rounded border border-slate-200">
                <div className="flex justify-between font-semibold text-slate-800 text-[11px]">
                  <span>聴解 (Listening Comprehension)</span>
                  <span className="font-bold text-slate-900">{result.sectionScores.S3.percentage}%</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${result.sectionScores.S3.percentage}%` }}
                  ></div>
                </div>
                <div className="text-[10px] text-slate-500 text-right">
                  {result.sectionScores.S3.score} / {result.sectionScores.S3.maxScore} Soal Benar
                </div>
              </div>

              {/* S4 */}
              <div className="space-y-1 bg-slate-50 p-2.5 rounded border border-slate-200">
                <div className="flex justify-between font-semibold text-slate-800 text-[11px]">
                  <span>読解 (Reading Comprehension)</span>
                  <span className="font-bold text-slate-900">{result.sectionScores.S4.percentage}%</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${result.sectionScores.S4.percentage}%` }}
                  ></div>
                </div>
                <div className="text-[10px] text-slate-500 text-right">
                  {result.sectionScores.S4.score} / {result.sectionScores.S4.maxScore} Soal Benar
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center text-[10px] text-slate-400 font-mono">
          Simulated by KondangSensei CBT Platform • Verified JFT-Basic Standard Exam Engine
        </div>
      </div>
    </div>
  );
};
