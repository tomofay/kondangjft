'use client';

import React, { useState, useEffect } from 'react';

interface JourneyState {
  current_stage: 'pre_class' | 'in_class' | 'post_class' | 'completed';
  pre_class_srs_completed: boolean;
  in_class_attendance: boolean;
  in_class_renshu_score?: number | null;
  in_class_kaku_submitted?: boolean;
  post_class_audio_submitted?: boolean;
  post_class_mondai_passed?: boolean;
}

interface FlippedClassroomStepperProps {
  chapterId?: number;
  classId?: string;
  isSensei?: boolean;
  onOpenZoom?: () => void;
}

export default function FlippedClassroomStepper({
  chapterId = 1,
  classId = 'cls_batch1_n5',
  isSensei = false,
  onOpenZoom
}: FlippedClassroomStepperProps) {
  const [journey, setJourney] = useState<JourneyState>({
    current_stage: 'pre_class',
    pre_class_srs_completed: false,
    in_class_attendance: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchJourney();
  }, [chapterId]);

  const fetchJourney = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/n5/journey/state?chapterId=${chapterId}`);
      if (res.ok) {
        const data = await res.json();
        setJourney(data.journey);
      }
    } catch (err: any) {
      console.error('Failed to fetch journey state', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteStep = async (stepKey: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/n5/journey/complete-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterId, stepKey })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setJourney(data.journey);
        setSuccessMsg(`Langkah "${stepKey}" berhasil diselesaikan! Tahapan belajar diperbarui.`);
      } else {
        setErrorMsg(data.error || 'Gagal menyelesaikan tahapan.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem.');
    }
  };

  const handleTeacherBroadcast = async (stage: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/teacher/classes/${classId}/stage-controller`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeStage: stage, targetQuestionNumber: 1 })
      });
      const data = await res.json();
      if (res.ok && data.broadcastSuccess) {
        setSuccessMsg(`Sinyal panggung "${stage}" berhasil disiarkan ke seluruh siswa kelas.`);
      } else {
        setErrorMsg(data.error || 'Gagal menyiarkan panggung.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan.');
    }
  };

  const getStageColor = (stage: string) => {
    if (journey.current_stage === 'completed') return 'border-emerald-500 bg-emerald-950/20';
    if (journey.current_stage === stage) return 'border-indigo-500 bg-indigo-950/40 ring-2 ring-indigo-500/20';
    return 'border-slate-800 bg-slate-900/60 opacity-70';
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 text-slate-100 p-4 md:p-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-6 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
            Metodologi Flipped Classroom
          </span>
          <h2 className="text-2xl font-black text-white">
            Alur Pembelajaran Bab {chapterId}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Transisi 3 tahap: Persiapan Mandiri (Pre-Class) ➔ Tatap Muka Zoom (In-Class) ➔ Evaluasi (Post-Class).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1 rounded-full font-bold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Tahap Aktif: {journey.current_stage.replace('_', ' ')}
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs">
          ⚠️ {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs">
          ✅ {successMsg}
        </div>
      )}

      {/* 3-Stage Stepper Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stage 1: Pre-Class */}
        <div className={`p-6 rounded-2xl border transition-all space-y-4 ${getStageColor('pre_class')}`}>
          <div className="flex items-center justify-between">
            <span className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 font-bold text-sm flex items-center justify-center border border-amber-500/30">
              1
            </span>
            {journey.pre_class_srs_completed ? (
              <span className="text-xs font-bold text-emerald-400">✓ Selesai</span>
            ) : (
              <span className="text-xs font-medium text-amber-400">Sedang Berjalan</span>
            )}
          </div>

          <div>
            <h3 className="text-base font-bold text-white">Pre-Class</h3>
            <p className="text-xs text-slate-400 mt-1">
              Hafalkan kosakata Kotoba dan baca pola dasar sebelum kelas live dimulai.
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className={journey.pre_class_srs_completed ? 'text-emerald-400' : 'text-slate-500'}>
                {journey.pre_class_srs_completed ? '☑' : '☐'}
              </span>
              <span className="text-slate-300">Review Kotoba Flashcard SRS</span>
            </div>
          </div>

          {!journey.pre_class_srs_completed && (
            <button
              type="button"
              onClick={() => handleCompleteStep('pre_class_srs')}
              className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-md"
            >
              Selesaikan Kotoba SRS
            </button>
          )}
        </div>

        {/* Stage 2: In-Class */}
        <div className={`p-6 rounded-2xl border transition-all space-y-4 ${getStageColor('in_class')}`}>
          <div className="flex items-center justify-between">
            <span className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 font-bold text-sm flex items-center justify-center border border-blue-500/30">
              2
            </span>
            {journey.in_class_attendance ? (
              <span className="text-xs font-bold text-emerald-400">✓ Hadir Live</span>
            ) : (
              <span className="text-xs font-medium text-slate-400">Menunggu Jadwal</span>
            )}
          </div>

          <div>
            <h3 className="text-base font-bold text-white">In-Class (Live Zoom)</h3>
            <p className="text-xs text-slate-400 mt-1">
              Sesi interaktif bersama Sensei: drill Bunpou, Renshu simultan, dan Kaku upload.
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className={journey.in_class_attendance ? 'text-emerald-400' : 'text-slate-500'}>
                {journey.in_class_attendance ? '☑' : '☐'}
              </span>
              <span className="text-slate-300">Presensi Live Zoom Web SDK</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {onOpenZoom && (
              <button
                type="button"
                onClick={onOpenZoom}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all shadow-md"
              >
                Masuk Ruang Kelas Zoom
              </button>
            )}

            {!journey.in_class_attendance && (
              <button
                type="button"
                onClick={() => handleCompleteStep('in_class_attendance')}
                className="w-full py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Catat Presensi Kelas
              </button>
            )}
          </div>
        </div>

        {/* Stage 3: Post-Class */}
        <div className={`p-6 rounded-2xl border transition-all space-y-4 ${getStageColor('post_class')}`}>
          <div className="flex items-center justify-between">
            <span className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-sm flex items-center justify-center border border-emerald-500/30">
              3
            </span>
            {journey.post_class_mondai_passed ? (
              <span className="text-xs font-bold text-emerald-400">✓ Selesai & Lulus</span>
            ) : (
              <span className="text-xs font-medium text-slate-400">Evaluasi Akhir</span>
            )}
          </div>

          <div>
            <h3 className="text-base font-bold text-white">Post-Class (Evaluasi)</h3>
            <p className="text-xs text-slate-400 mt-1">
              Rekam suara percakapan Kaiwa dan ikuti ujian Mondai untuk membuka bab berikutnya.
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className={journey.post_class_mondai_passed ? 'text-emerald-400' : 'text-slate-500'}>
                {journey.post_class_mondai_passed ? '☑' : '☐'}
              </span>
              <span className="text-slate-300">Ujian Evaluasi Mondai ($\ge 75\%$)</span>
            </div>
          </div>

          {!journey.post_class_mondai_passed && (
            <button
              type="button"
              onClick={() => handleCompleteStep('post_class_mondai')}
              className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-md"
            >
              Kirim Jawaban Mondai
            </button>
          )}
        </div>
      </div>

      {/* Sensei Live Controller Panel */}
      {isSensei && (
        <div className="rounded-2xl bg-indigo-950/30 border border-indigo-500/30 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-indigo-300 flex items-center gap-2">
              <span>🎛️</span>
              Sensei Live Stage Switcher (Kendali Panggung In-Class)
            </h4>
            <span className="text-xs text-slate-400">Kelas: {classId}</span>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => handleTeacherBroadcast('simultaneous_renshu')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            >
              Aktifkan Mode Renshu Simultan
            </button>

            <button
              type="button"
              onClick={() => handleTeacherBroadcast('kaku_photo_session')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white transition-colors"
            >
              Buka Sesi Upload Kaku (5 Menit)
            </button>

            <button
              type="button"
              onClick={() => handleTeacherBroadcast('kaiwa_roleplay')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
            >
              Mulai Roleplay Dialog Kaiwa
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
