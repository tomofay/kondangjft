'use client';

import React, { useState, useEffect } from 'react';

interface StudentMatrixRow {
  studentId: string;
  studentName: string;
  answersMap: Record<number, 'correct' | 'wrong' | 'pending'>;
}

interface QuestionStat {
  questionNumber: number;
  totalAnswered: number;
  wrongCount: number;
  errorRatePercent: number;
}

interface TeacherGradebookMatrixProps {
  classId?: string;
  onSelectDiscussionQuestion?: (qNum: number) => void;
}

export default function TeacherGradebookMatrix({
  classId = 'cls_batch1_n5',
  onSelectDiscussionQuestion
}: TeacherGradebookMatrixProps) {
  const [students, setStudents] = useState<StudentMatrixRow[]>([]);
  const [questionStats, setQuestionStats] = useState<QuestionStat[]>([]);
  const [recommendedQ, setRecommendedQ] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchMatrixAndStats();
  }, [classId]);

  const fetchMatrixAndStats = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      // 1. Fetch live matrix
      const matrixRes = await fetch(`/api/teacher/classes/${classId}/gradebook-matrix`);
      const matrixData = await matrixRes.json();
      if (!matrixRes.ok) {
        throw new Error(matrixData.error || 'Gagal memuat gradebook matrix');
      }
      setStudents(matrixData.matrix.students || []);

      // 2. Fetch error-rate analytics
      const analyticsRes = await fetch(
        `/api/teacher/classes/${classId}/error-rate-analytics?exerciseType=renshu&chapterId=1`
      );
      const analyticsData = await analyticsRes.json();
      if (analyticsRes.ok && analyticsData.analytics) {
        setQuestionStats(analyticsData.analytics.questionStats || []);
        setRecommendedQ(analyticsData.analytics.recommendedDiscussionQuestion || null);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsLoading(false);
    }
  };

  const questionColumns = [1, 2, 3, 4, 5];

  const getStatusBadge = (status: 'correct' | 'wrong' | 'pending' | undefined) => {
    if (status === 'correct') {
      return (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 font-black text-xs border border-emerald-500/40">
          ✓
        </span>
      );
    }
    if (status === 'wrong') {
      return (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-red-500/20 text-red-300 font-black text-xs border border-red-500/40 animate-pulse">
          ✕
        </span>
      );
    }
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-800 text-slate-500 font-bold text-xs border border-slate-700">
        -
      </span>
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 text-slate-100 p-4 md:p-6">
      {/* Top Header Card */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-6 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
            Sensei Live Telemetry Gradebook
          </div>
          <h2 className="text-2xl font-black text-white">
            Matriks Nilai & Pengerjaan Soal ({classId})
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Pantau status pengerjaan latihan 10 siswa secara simultan saat kelas Zoom berlangsung.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            Telemetry Real-time Aktif
          </div>
          <button
            type="button"
            onClick={fetchMatrixAndStats}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700 text-xs font-bold"
            title="Refresh Matriks"
          >
            🔄 Sinkronkan
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Top Error-Rate Alert Bar */}
      {recommendedQ && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h4 className="text-sm font-bold text-amber-300">
                Peringatan Tingkat Kesalahan Tinggi (Soal #{recommendedQ})
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Sebagian besar siswa menjawab keliru pada Soal #{recommendedQ}. Disarankan segera membuka pembahasan di layar Zoom.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectDiscussionQuestion && onSelectDiscussionQuestion(recommendedQ)}
            className="px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-amber-600 hover:bg-amber-500 transition-colors shadow-md shadow-amber-600/20 shrink-0"
          >
            Bahas Soal #{recommendedQ} di Zoom ➔
          </button>
        </div>
      )}

      {/* Main Heatmap Matrix Table */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 backdrop-blur-md shadow-2xl">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center justify-between">
          <span>Tabel Pengerjaan Soal Siswa ({students.length}/10 Siswa Terdaftar)</span>
          <span className="text-xs text-slate-400 font-normal">
            🟢 Benar • 🔴 Salah • ⚪ Belum
          </span>
        </h3>

        {isLoading ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            Memuat data telemetri kelas...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Nama Siswa</th>
                  {questionColumns.map((qNum) => (
                    <th key={qNum} className="py-3 px-3 text-center">
                      Soal #{qNum}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {students.map((student) => (
                  <tr key={student.studentId} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-200">
                      {student.studentName}
                    </td>
                    {questionColumns.map((qNum) => (
                      <td key={qNum} className="py-3 px-3 text-center">
                        {getStatusBadge(student.answersMap[qNum])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>

              {/* Error-Rate Summary Row */}
              <tfoot>
                <tr className="border-t-2 border-slate-800 bg-slate-950/60 text-xs font-bold">
                  <td className="py-3.5 px-4 text-slate-300">
                    Tingkat Kesalahan (% Salah)
                  </td>
                  {questionColumns.map((qNum) => {
                    const stat = questionStats.find((s) => s.questionNumber === qNum);
                    const errorPct = stat ? stat.errorRatePercent : 0;
                    const isHigh = errorPct >= 50;

                    return (
                      <td
                        key={qNum}
                        className={`py-3.5 px-3 text-center ${
                          isHigh ? 'text-red-400 font-extrabold' : 'text-slate-400'
                        }`}
                      >
                        {errorPct}%
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
