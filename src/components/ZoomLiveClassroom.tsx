'use client';

import React, { useState, useEffect } from 'react';

interface ZoomSessionInfo {
  signature: string;
  meetingNumber: string;
  password?: string;
  role: number;
  userName: string;
}

interface ZoomLiveClassroomProps {
  classId?: string;
  isHost?: boolean;
}

export default function ZoomLiveClassroom({
  classId = 'cls_batch1_n5'
}: ZoomLiveClassroomProps) {
  const [session, setSession] = useState<ZoomSessionInfo | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [attendanceLogged, setAttendanceLogged] = useState(false);

  // Video/Audio mock control states
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [handRaised, setHandRaised] = useState(false);

  useEffect(() => {
    fetchSignature();
  }, [classId]);

  const fetchSignature = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/zoom/generate-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSession(data);
      } else {
        setErrorMsg(data.error || 'Gagal membuat signature sesi Zoom');
      }
    } catch (err: any) {
      setErrorMsg('Gagal terhubung ke Zoom API: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinMeeting = async () => {
    if (!session) return;
    setIsConnected(true);

    // Trigger auto-attendance webhook
    try {
      const res = await fetch('/api/zoom/attendance-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId,
          meetingStatus: 'connected',
          timestamp: new Date().toISOString()
        })
      });
      const data = await res.json();
      if (res.ok && data.attendanceLogged) {
        setAttendanceLogged(true);
      }
    } catch (err) {
      console.warn('Gagal mencatat presensi otomatis', err);
    }
  };

  const handleLeaveMeeting = () => {
    setIsConnected(false);
    setAttendanceLogged(false);
  };

  return (
    <div className="w-full max-w-5xl mx-auto rounded-3xl bg-slate-900/95 border border-slate-800 p-6 md:p-8 backdrop-blur-2xl shadow-2xl text-slate-100 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-bold uppercase tracking-wider mb-2">
            In-App Embedded Zoom Web SDK
          </div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <span>Ruang Kelas Live N5</span>
            {session && (
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                  session.role === 1
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}
              >
                {session.role === 1 ? 'Pengajar (Host)' : 'Siswa (Attendee)'}
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Kelas langsung tertanam di dalam portal tanpa perlu aplikasi Zoom eksternal atau link WhatsApp.
          </p>
        </div>

        {attendanceLogged && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Presensi Kehadiran Tercatat
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Main Dual Pane Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Pane (Learning Canvas: 7 cols) */}
        <div className="lg:col-span-7 rounded-2xl bg-slate-950/60 border border-slate-800 p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
              Papan Pembelajaran Simultan
            </span>
            <h3 className="text-lg font-bold text-white">
              Sesi Latihan Bunpou & Renshu Bersama
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Sensei akan memaparkan materi pola kalimat dan memandu latihan secara sinkron. Siswa dapat mengerjakan latihan soal langsung di layar ini berdampingan dengan video guru.
            </p>

            <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-200">
              💡 <strong>Unified Learning:</strong> Sesi video Zoom berjalan berdampingan dengan lembar soal interaktif sehingga tidak perlu berpindah tab atau perangkat.
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>Room ID: <strong className="text-slate-200">{session?.meetingNumber || 'Memuat...'}</strong></span>
            <span>Pengguna: <strong className="text-slate-200">{session?.userName || '...'}</strong></span>
          </div>
        </div>

        {/* Right Pane (Embedded Zoom Video Window: 5 cols) */}
        <div className="lg:col-span-5 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex flex-col">
          {/* Video Screen Area */}
          <div className="relative aspect-video bg-gradient-to-br from-slate-900 to-black flex items-center justify-center p-4">
            {isConnected ? (
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center mx-auto text-2xl">
                  {isVideoOn ? '🎥' : '👤'}
                </div>
                <div className="text-xs font-bold text-slate-200">
                  {session?.userName} ({session?.role === 1 ? 'Sensei / Host' : 'Siswa'})
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Audio / Video Live
                </span>
              </div>
            ) : (
              <div className="text-center space-y-3 py-6">
                <div className="text-3xl text-blue-400">📹</div>
                <div className="text-xs font-semibold text-slate-300">
                  Ruang Kelas Zoom Tertanam
                </div>
                <button
                  type="button"
                  onClick={handleJoinMeeting}
                  disabled={isLoading || !session}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-md shadow-blue-600/30 disabled:opacity-50"
                >
                  {isLoading ? 'Memuat Signature...' : 'Masuk Sesi Kelas Live'}
                </button>
              </div>
            )}

            {/* Hand Raised Icon */}
            {handRaised && isConnected && (
              <div className="absolute top-3 right-3 text-2xl animate-bounce">
                ✋
              </div>
            )}
          </div>

          {/* Video Control Bar */}
          {isConnected && (
            <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-around gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className={`p-2 rounded-lg font-semibold transition-colors ${
                  isMuted ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-200'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? '🔇 Muted' : '🎙️ Mic On'}
              </button>

              <button
                type="button"
                onClick={() => setIsVideoOn(!isVideoOn)}
                className={`p-2 rounded-lg font-semibold transition-colors ${
                  !isVideoOn ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-200'
                }`}
                title={isVideoOn ? 'Stop Video' : 'Start Video'}
              >
                {isVideoOn ? '📹 Video On' : '🚫 Video Off'}
              </button>

              <button
                type="button"
                onClick={() => setHandRaised(!handRaised)}
                className={`p-2 rounded-lg font-semibold transition-colors ${
                  handRaised ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-200'
                }`}
              >
                ✋ Angkat Tangan
              </button>

              <button
                type="button"
                onClick={handleLeaveMeeting}
                className="px-3 py-2 rounded-lg font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 transition-colors"
              >
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
