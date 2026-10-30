'use client';

import React, { useState, useEffect } from 'react';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  totalXp: number;
  currentStreak: number;
  level: number;
}

interface GamificationState {
  currentStreak: number;
  longestStreak: number;
  totalXp: number;
  level: number;
  streakResetNotice?: boolean;
}

interface DailyStreakLeaderboardProps {
  classId?: string;
}

export default function DailyStreakLeaderboard({
  classId = 'cls_batch1_n5'
}: DailyStreakLeaderboardProps) {
  const [gamification, setGamification] = useState<GamificationState>({
    currentStreak: 4,
    longestStreak: 7,
    totalXp: 450,
    level: 3
  });
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [classId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/gamification/leaderboard?classId=${classId}`);
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
      }
    } catch (err) {
      console.error('Failed to load leaderboard', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleHeartbeat = async () => {
    setIsCheckingIn(true);
    setNotice(null);
    try {
      const res = await fetch('/api/gamification/heartbeat', {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGamification(data.data);
        if (data.data.streakResetNotice) {
          setNotice('⚠️ Streak Anda sempat terputus karena absen lebih dari 1 hari. Streak telah direset ke 1. Tetap semangat!');
        } else {
          setNotice('🔥 Keaktifan harian tercatat! +20 XP ditambahkan ke profil Anda.');
        }
        await fetchData();
      }
    } catch (err: any) {
      setNotice('Gagal merekam keaktifan: ' + err.message);
    } finally {
      setIsCheckingIn(false);
    }
  };

  // XP to next level formula: next Level target = level * 200 XP
  const nextLevelXp = gamification.level * 200;
  const currentLevelBaseXp = (gamification.level - 1) * 200;
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round(((gamification.totalXp - currentLevelBaseXp) / (nextLevelXp - currentLevelBaseXp)) * 100))
  );

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 text-slate-100 p-4 md:p-6">
      {/* 1. Daily Streak & XP Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Streak Flame Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 p-6 backdrop-blur-xl shadow-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Runtutan Keaktifan Harian
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl md:text-5xl font-black text-amber-300">
                {gamification.currentStreak}
              </span>
              <span className="text-sm font-semibold text-slate-400">Hari Berturut-turut</span>
            </div>
            <p className="text-xs text-slate-400">
              Rekor terpanjang Anda: <strong className="text-slate-200">{gamification.longestStreak} Hari</strong>
            </p>
          </div>

          <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-4xl shadow-inner shadow-amber-500/20 animate-pulse">
            🔥
          </div>
        </div>

        {/* XP & Level Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/30 p-6 backdrop-blur-xl shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
              Level & Poin Pengalaman (XP)
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Level {gamification.level}
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="text-3xl font-black text-white">{gamification.totalXp} XP</div>
            <div className="text-xs text-slate-400">Menuju Level {gamification.level + 1}</div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700">
            <div
              className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Heartbeat Check-in Banner */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            Belajar Hari Ini & Jaga Api Streak Tetap Menyala!
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Login harian menjaga streak tidak terputus dan mencegah pesan peringatan WhatsApp otomatis.
          </p>
        </div>

        <button
          type="button"
          onClick={handleHeartbeat}
          disabled={isCheckingIn}
          className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-md shadow-orange-600/20 transition-all shrink-0 flex items-center gap-2"
        >
          {isCheckingIn ? (
            <span>Merekam Keaktifan...</span>
          ) : (
            <>
              <span>Klaim Keaktifan Hari Ini (+20 XP)</span>
              <span>🔥</span>
            </>
          )}
        </button>
      </div>

      {notice && (
        <div className="p-3.5 rounded-xl bg-indigo-950/60 border border-indigo-500/40 text-xs text-indigo-200">
          {notice}
        </div>
      )}

      {/* 2. Class Leaderboard Table */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 md:p-8 backdrop-blur-md shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-xl">🏆</span>
              Papan Peringkat Kelas ({classId})
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Peringkat diperbarui secara otomatis berdasarkan akumulasi perolehan XP siswa.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            Memuat papan peringkat...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Peringkat</th>
                  <th className="py-3 px-4">Nama Siswa</th>
                  <th className="py-3 px-4">Level</th>
                  <th className="py-3 px-4">Daily Streak</th>
                  <th className="py-3 px-4 text-right">Total XP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {leaderboard.map((student) => {
                  const isTop1 = student.rank === 1;
                  const isTop2 = student.rank === 2;
                  const isTop3 = student.rank === 3;

                  return (
                    <tr
                      key={student.userId}
                      className={`hover:bg-slate-800/30 transition-colors ${
                        student.userId === 'usr_siswa_001'
                          ? 'bg-indigo-950/20 font-semibold'
                          : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        {isTop1 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 font-black text-xs border border-amber-500/40">
                            🥇 1
                          </span>
                        ) : isTop2 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300/20 text-slate-200 font-black text-xs border border-slate-300/40">
                            🥈 2
                          </span>
                        ) : isTop3 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700/20 text-amber-500 font-black text-xs border border-amber-700/40">
                            🥉 3
                          </span>
                        ) : (
                          <span className="text-slate-400 font-bold px-2">
                            #{student.rank}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-200">
                        {student.name}
                        {student.userId === 'usr_siswa_001' && (
                          <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            Kamu
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                          Lv. {student.level}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-amber-400 font-medium">
                        🔥 {student.currentStreak} Hari
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-indigo-400">
                        {student.totalXp.toLocaleString()} XP
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
