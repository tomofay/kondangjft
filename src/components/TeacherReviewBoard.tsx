'use client';

import React, { useState, useEffect, useRef } from 'react';

interface PendingReviewItem {
  submissionId: string;
  studentId: string;
  studentName: string;
  classId: string;
  submissionType: 'kaku_image' | 'kaiwa_audio';
  fileUrl: string;
  submittedAt: string;
}

interface StampCoordinates {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

interface TeacherReviewBoardProps {
  classId?: string;
}

export default function TeacherReviewBoard({
  classId = 'cls_batch1_n5'
}: TeacherReviewBoardProps) {
  const [queue, setQueue] = useState<PendingReviewItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<PendingReviewItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Review & Stamp state
  const [hanamaruType, setHanamaruType] = useState<'super_hanamaru' | 'standard_hanamaru' | 'revision_stamp'>('super_hanamaru');
  const [stampCoords, setStampCoords] = useState<StampCoordinates>({ x: 350, y: 150, scale: 1.0, rotation: -5 });
  const [feedbackText, setFeedbackText] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const imageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchQueue();
  }, [classId]);

  const fetchQueue = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/teacher/reviews/pending-queue?classId=${classId}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setQueue(data.queue || []);
        if (data.queue?.length > 0) {
          setSelectedItem(data.queue[0]);
        }
      } else {
        setErrorMsg(data.error || 'Gagal memuat antrean koreksi');
      }
    } catch (err: any) {
      setErrorMsg('Gagal memuat antrean: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    setStampCoords((prev) => ({ ...prev, x, y }));
  };

  const handleSubmitEvaluation = async (status: 'approved' | 'revision_needed') => {
    if (!selectedItem) return;

    if (status === 'revision_needed' && (!feedbackText || feedbackText.trim() === '')) {
      setErrorMsg('Catatan koreksi wajib diisi saat meminta revisi dari siswa.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/teacher/reviews/submit-evaluation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionType: selectedItem.submissionType,
          submissionId: selectedItem.submissionId,
          status,
          hanamaruType: status === 'approved' ? hanamaruType : 'revision_stamp',
          stampCoordinates: stampCoords,
          writtenFeedback: feedbackText
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengirim evaluasi');
      }

      setSuccessMsg(
        status === 'approved'
          ? '🎉 Tugas berhasil disetujui & stempel Hanamaru telah dibubuhkan!'
          : '✏️ Permintaan revisi berhasil dikirimkan ke siswa dengan catatan feedback.'
      );

      // Remove from queue & select next
      const remaining = queue.filter((item) => item.submissionId !== selectedItem.submissionId);
      setQueue(remaining);
      setSelectedItem(remaining.length > 0 ? remaining[0] : null);
      setFeedbackText('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 text-slate-100 p-4 md:p-6">
      {/* Top Header Card */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-rose-950/30 to-slate-900 border border-slate-800 p-6 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold uppercase tracking-wider mb-2">
            Voice & Image Review Board
          </div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <span>Meja Koreksi Sensei & Stempel Hanamaru (はなまる)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Koreksi foto tulisan tangan Kaku dan audio pelafalan Kaiwa. Bubuhkan stempel Hanamaru visual di atas kanvas tugas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-semibold">
            Antrean: {queue.length} Tugas Menunggu
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

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Pending Queue & Canvas Viewer (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Submission Selector Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {queue.map((item) => (
              <button
                key={item.submissionId}
                type="button"
                onClick={() => {
                  setSelectedItem(item);
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 border transition-all flex items-center gap-2 ${
                  selectedItem?.submissionId === item.submissionId
                    ? 'bg-rose-600/20 border-rose-500 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span>{item.submissionType === 'kaku_image' ? '📷 Kaku' : '🎙️ Kaiwa'}</span>
                <span>{item.studentName}</span>
              </button>
            ))}
          </div>

          {/* Interactive Inspection Canvas */}
          {selectedItem ? (
            <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  Siswa: <strong className="text-white">{selectedItem.studentName}</strong> (ID: {selectedItem.submissionId})
                </span>
                <span className="text-rose-400 font-medium">
                  {selectedItem.submissionType === 'kaku_image'
                    ? '💡 Klik foto untuk memindahkan posisi Stempel Hanamaru'
                    : 'Dengarkan rekaman suara di bawah'}
                </span>
              </div>

              {selectedItem.submissionType === 'kaku_image' ? (
                <div
                  ref={imageContainerRef}
                  onClick={handleCanvasClick}
                  className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900 min-h-[380px] max-h-[500px] flex items-center justify-center cursor-crosshair select-none"
                >
                  <img
                    src={selectedItem.fileUrl}
                    alt="Foto Tugas Kaku Siswa"
                    className="max-h-[480px] w-auto object-contain pointer-events-none"
                  />

                  {/* Dynamic Hanamaru Stamp Overlay */}
                  <div
                    style={{
                      position: 'absolute',
                      left: `${stampCoords.x}px`,
                      top: `${stampCoords.y}px`,
                      transform: `translate(-50%, -50%) rotate(${stampCoords.rotation}deg) scale(${stampCoords.scale})`,
                      transition: 'all 0.15s ease-out'
                    }}
                    className="pointer-events-none drop-shadow-xl"
                  >
                    <div className="w-24 h-24 rounded-full border-4 border-red-500/80 bg-red-500/10 flex items-center justify-center text-red-500 font-black text-center text-xs p-1 transform rotate-[-8deg] shadow-lg shadow-red-500/20">
                      {hanamaruType === 'super_hanamaru' && (
                        <span>💮 大変よく<br />できました</span>
                      )}
                      {hanamaruType === 'standard_hanamaru' && (
                        <span>🌸 よく<br />できました</span>
                      )}
                      {hanamaruType === 'revision_stamp' && (
                        <span>✏️ もうすこし<br />(Revisi)</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 px-6 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-4">
                  <div className="text-4xl">🎙️</div>
                  <h4 className="text-sm font-bold text-white">Rekaman Suara Percakapan Kaiwa</h4>
                  <audio controls className="w-full max-w-md mx-auto" src={selectedItem.fileUrl}>
                    Browser tidak mendukung audio player.
                  </audio>
                </div>
              )}
            </div>
          ) : (
            <div className="p-16 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-500 text-sm">
              Semua tugas telah selesai dikoreksi! Tidak ada antrean tugas tertunda.
            </div>
          )}
        </div>

        {/* Right Side: Sensei Evaluation Palette & Feedback (4 cols) */}
        {selectedItem && (
          <div className="lg:col-span-4 rounded-2xl bg-slate-900/90 border border-slate-800 p-6 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3">
                Instrumen Penilaian Sensei
              </h3>

              {/* Hanamaru Stamp Palette */}
              {selectedItem.submissionType === 'kaku_image' && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">
                    Pilih Jenis Stempel:
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() => setHanamaruType('super_hanamaru')}
                      className={`p-3 rounded-xl border text-left text-xs transition-all flex items-center gap-2.5 ${
                        hanamaruType === 'super_hanamaru'
                          ? 'border-red-500 bg-red-950/40 text-red-200'
                          : 'border-slate-800 bg-slate-950 text-slate-400'
                      }`}
                    >
                      <span className="text-lg">💮</span>
                      <div>
                        <strong>Super Hanamaru</strong>
                        <div className="text-[10px] text-slate-400">Goresan sempurna & sangat rapi</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setHanamaruType('standard_hanamaru')}
                      className={`p-3 rounded-xl border text-left text-xs transition-all flex items-center gap-2.5 ${
                        hanamaruType === 'standard_hanamaru'
                          ? 'border-red-500 bg-red-950/40 text-red-200'
                          : 'border-slate-800 bg-slate-950 text-slate-400'
                      }`}
                    >
                      <span className="text-lg">🌸</span>
                      <div>
                        <strong>Standard Hanamaru</strong>
                        <div className="text-[10px] text-slate-400">Tugas benar dan memenuhi syarat</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Feedback Textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Catatan Evaluasi / Instruksi Revisi:
                </label>
                <textarea
                  rows={4}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Tuliskan catatan goresan huruf atau apresiasi untuk siswa..."
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => handleSubmitEvaluation('approved')}
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span>💮 Beri Stempel & Luluskan Tugas</span>
              </button>

              <button
                type="button"
                onClick={() => handleSubmitEvaluation('revision_needed')}
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl font-bold text-xs text-amber-300 bg-amber-950/40 hover:bg-amber-900/40 border border-amber-500/30 transition-colors disabled:opacity-50"
              >
                <span>✏️ Minta Siswa Merevisi Tugas</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
