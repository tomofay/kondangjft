/**
 * Gamification Store & Engine (M10)
 * Manages daily streak tracking, XP accumulation, class leaderboards,
 * and automated WhatsApp re-engagement cooldowns.
 */

export interface UserGamificationData {
  userId: string;
  name: string;
  classId: string;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
  totalXp: number;
  level: number;
  phoneNumber?: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  totalXp: number;
  currentStreak: number;
  level: number;
}

// In-memory store for Gamification profiles
const gamificationProfiles = new Map<string, UserGamificationData>([
  [
    'usr_siswa_001',
    {
      userId: 'usr_siswa_001',
      name: 'Budi Pratama',
      classId: 'cls_batch1_n5',
      currentStreak: 4,
      longestStreak: 7,
      lastActiveDate: new Date(Date.now() - 24 * 3600 * 1000).toISOString().split('T')[0], // yesterday
      totalXp: 450,
      level: 3,
      phoneNumber: '+6281234567891'
    }
  ],
  [
    'usr_siswa_002',
    {
      userId: 'usr_siswa_002',
      name: 'Dewi Lestari',
      classId: 'cls_batch1_n5',
      currentStreak: 12,
      longestStreak: 12,
      lastActiveDate: new Date().toISOString().split('T')[0],
      totalXp: 850,
      level: 5,
      phoneNumber: '+6281234567892'
    }
  ],
  [
    'usr_siswa_003',
    {
      userId: 'usr_siswa_003',
      name: 'Rian Hidayat',
      classId: 'cls_batch1_n5',
      currentStreak: 2,
      longestStreak: 5,
      lastActiveDate: new Date().toISOString().split('T')[0],
      totalXp: 310,
      level: 2,
      phoneNumber: '+6281234567893'
    }
  ],
  [
    'usr_siswa_inactive_3days',
    {
      userId: 'usr_siswa_inactive_3days',
      name: 'Aris Setiawan',
      classId: 'cls_batch1_n5',
      currentStreak: 6,
      longestStreak: 6,
      // Inactive for 3 days
      lastActiveDate: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString().split('T')[0],
      totalXp: 280,
      level: 2,
      phoneNumber: '+6281234567890'
    }
  ]
]);

// WhatsApp cooldown tracking: userId -> last reminder timestamp (ms)
const whatsappReminderCooldowns = new Map<string, number>();

/**
 * Helper to get today's calendar date string in YYYY-MM-DD
 */
function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Helper to calculate difference in calendar days
 */
function getDaysDifference(dateStr1: string, dateStr2: string): number {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  const diffMs = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Record Daily Heartbeat
 */
export function recordDailyHeartbeat(userId: string) {
  const today = getTodayString();
  let profile = gamificationProfiles.get(userId);

  if (!profile) {
    profile = {
      userId,
      name: 'Siswa N5',
      classId: 'cls_batch1_n5',
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: '',
      totalXp: 100,
      level: 1
    };
    gamificationProfiles.set(userId, profile);
  }

  // 1. Check if already recorded today
  if (profile.lastActiveDate === today) {
    return {
      currentStreak: profile.currentStreak,
      longestStreak: profile.longestStreak,
      totalXp: profile.totalXp,
      level: profile.level,
      streakResetNotice: false
    };
  }

  let streakResetNotice = false;

  // 2. Check days missed
  if (!profile.lastActiveDate) {
    profile.currentStreak = 1;
    profile.longestStreak = 1;
    profile.totalXp += 15;
  } else {
    const daysSince = getDaysDifference(profile.lastActiveDate, today);

    if (daysSince === 1) {
      // Consecutive day login!
      profile.currentStreak += 1;
      profile.longestStreak = Math.max(profile.longestStreak, profile.currentStreak);
      profile.totalXp += 20; // +20 XP login streak bonus
    } else if (daysSince > 1) {
      // Inactive for more than 1 day -> streak broken, reset to 1
      profile.currentStreak = 1;
      streakResetNotice = true;
      profile.totalXp += 10;
    }
  }

  profile.lastActiveDate = today;
  profile.level = Math.floor(profile.totalXp / 100) + 1;

  return {
    currentStreak: profile.currentStreak,
    longestStreak: profile.longestStreak,
    totalXp: profile.totalXp,
    level: profile.level,
    streakResetNotice
  };
}

/**
 * Get Leaderboard for a Class
 */
export function getClassLeaderboard(classId: string, userClassId?: string) {
  // RBAC check: Student can only view their own class
  if (userClassId && userClassId !== classId) {
    return {
      error: 'Bukan anggota kelas ini: Anda tidak diizinkan mengakses papan peringkat kelas lain.'
    };
  }

  const classStudents = Array.from(gamificationProfiles.values())
    .filter((p) => p.classId === classId)
    .sort((a, b) => b.totalXp - a.totalXp);

  const leaderboard: LeaderboardEntry[] = classStudents.map((student, idx) => ({
    rank: idx + 1,
    userId: student.userId,
    name: student.name,
    totalXp: student.totalXp,
    currentStreak: student.currentStreak,
    level: student.level
  }));

  return {
    leaderboard
  };
}

/**
 * Run Automated WhatsApp Re-engagement Cron
 * Detects students inactive >= 2 days and applies 48-hour cooldown window
 */
export function runWhatsAppReengagementCron() {
  const today = getTodayString();
  const nowMs = Date.now();
  const COOLDOWN_MS = 48 * 3600 * 1000; // 48 hours

  const recipients: string[] = [];

  for (const profile of gamificationProfiles.values()) {
    if (!profile.lastActiveDate) continue;

    const daysInactive = getDaysDifference(profile.lastActiveDate, today);

    // Target: Inactive >= 2 days
    if (daysInactive >= 2) {
      const lastRemindedAt = whatsappReminderCooldowns.get(profile.userId) || 0;

      // Check 48h cooldown window
      if (nowMs - lastRemindedAt >= COOLDOWN_MS) {
        whatsappReminderCooldowns.set(profile.userId, nowMs);
        recipients.push(profile.phoneNumber || '+6281234567890');
      }
    }
  }

  return {
    remindersSentCount: recipients.length,
    recipients
  };
}
