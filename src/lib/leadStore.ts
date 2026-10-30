import { MINI_TRYOUT_QUESTIONS } from './miniTryoutQuestions';
import { pool } from './db';

export interface Lead {
  id: string;
  name: string;
  whatsapp_number: string;
  email?: string;
  score: number;
  max_score: number;
  passing_grade: number;
  is_passed: boolean;
  weakest_section: string;
  utm_source?: string;
  utm_campaign?: string;
  converted_to_user_id?: string;
  created_at: string;
}

// In-memory fallback store for leads
const inMemoryLeads: Lead[] = [
  {
    id: 'lead_seed_001',
    name: 'Budi Test Lead',
    whatsapp_number: '081234567890',
    email: 'budi.lead@example.com',
    score: 180,
    max_score: 250,
    passing_grade: 200,
    is_passed: false,
    weakest_section: 'Chōkai Section',
    created_at: new Date().toISOString()
  }
];

/**
 * Normalizes Indonesian phone numbers:
 * - strips non-digit characters (+, -, space, etc.)
 * - converts +62... or 62... into 08...
 * - validates length >= 9 digits
 */
export function normalizePhoneNumber(rawNumber: string): string | null {
  if (!rawNumber || typeof rawNumber !== 'string') return null;

  let cleaned = rawNumber.replace(/[\s\-\(\)\.]/g, '');

  if (cleaned.startsWith('+62')) {
    cleaned = '0' + cleaned.slice(3);
  } else if (cleaned.startsWith('62')) {
    cleaned = '0' + cleaned.slice(2);
  }

  // Validate digits only and valid length
  if (!/^\d+$/.test(cleaned) || cleaned.length < 9) {
    return null;
  }

  return cleaned;
}

const SECTION_NAMES: Record<string, string> = {
  S1: 'Moji & Goi Section',
  S2: 'Kaiwa Section',
  S3: 'Chōkai Section',
  S4: 'Dokkai Section'
};

/**
 * Calculates real-time 250-point score, pass status, and identifies weakest section
 */
export function calculateMiniTryoutDiagnostic(answers: { questionId: string; selectedOptionIndex: number }[]) {
  const answerMap = new Map<string, number>();
  answers.forEach((a) => {
    // support numeric or string question IDs
    answerMap.set(String(a.questionId), a.selectedOptionIndex);
  });

  const sectionScores: Record<string, { total: number; correct: number }> = {
    S1: { total: 0, correct: 0 },
    S2: { total: 0, correct: 0 },
    S3: { total: 0, correct: 0 },
    S4: { total: 0, correct: 0 }
  };

  let totalCorrect = 0;

  MINI_TRYOUT_QUESTIONS.forEach((q, idx) => {
    const sec = q.section || 'S1';
    sectionScores[sec].total += 1;

    const correctIndex = ['A', 'B', 'C', 'D'].indexOf(q.correctAnswer);
    // Question id could match question.id or index based id
    const submittedIdx = answerMap.get(String(q.id)) ?? answerMap.get(`mini_q_${idx + 1}`);

    if (submittedIdx !== undefined && submittedIdx === correctIndex) {
      sectionScores[sec].correct += 1;
      totalCorrect += 1;
    }
  });

  // Calculate score on 250-point scale
  const totalQuestions = MINI_TRYOUT_QUESTIONS.length;
  const score = Math.round((totalCorrect / totalQuestions) * 250);
  const maxScore = 250;
  const passingGrade = 200;
  const isPassed = score >= passingGrade;

  // Identify weakest section (lowest correct percentage)
  let weakestSec = 'S3'; // default Chokai
  let lowestPercentage = 100;

  for (const [secKey, val] of Object.entries(sectionScores)) {
    const pct = val.total > 0 ? (val.correct / val.total) * 100 : 0;
    if (pct < lowestPercentage) {
      lowestPercentage = pct;
      weakestSec = secKey;
    }
  }

  const weakestSectionName = SECTION_NAMES[weakestSec] || 'Chōkai Section';
  const ctaMessage = isPassed
    ? 'Selamat! Kamu sudah memenuhi passing grade dasar. Buka akses 5 Paket Simulasi Full untuk memantapkan kesiapan ujian resmimu!'
    : `Skor kamu: ${score}/250 (Belum Lulus). Kelemahan utama: ${weakestSectionName}. Mau latihan soal full-length yang mirip ujian aslinya biar makin siap? Buka akses 5 Paket Simulasi Full sekarang!`;

  return {
    score,
    maxScore,
    passingGrade,
    isPassed,
    weakestSection: weakestSectionName,
    ctaMessage,
    sectionBreakdown: sectionScores
  };
}

/**
 * Save new lead to store & MySQL database
 */
export async function saveLead(leadData: Omit<Lead, 'id' | 'created_at'>): Promise<Lead> {
  const newLead: Lead = {
    ...leadData,
    id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    created_at: new Date().toISOString()
  };

  inMemoryLeads.unshift(newLead);

  // Try persisting to MySQL if available
  try {
    await pool.query(
      `INSERT INTO leads (id, name, whatsapp_number, email, score, max_score, passing_grade, is_passed, weakest_section, utm_source, utm_campaign, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        newLead.id,
        newLead.name,
        newLead.whatsapp_number,
        newLead.email || null,
        newLead.score,
        newLead.max_score,
        newLead.passing_grade,
        newLead.is_passed ? 1 : 0,
        newLead.weakest_section,
        newLead.utm_source || null,
        newLead.utm_campaign || null
      ]
    );
  } catch (err) {
    // Graceful fallback to memory store
  }

  return newLead;
}

export async function getAllLeads(): Promise<Lead[]> {
  try {
    const [rows] = await pool.query<any[]>('SELECT * FROM leads ORDER BY created_at DESC');
    if (rows && rows.length > 0) {
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        whatsapp_number: r.whatsapp_number,
        email: r.email,
        score: r.score,
        max_score: r.max_score,
        passing_grade: r.passing_grade,
        is_passed: Boolean(r.is_passed),
        weakest_section: r.weakest_section,
        utm_source: r.utm_source,
        utm_campaign: r.utm_campaign,
        created_at: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString()
      }));
    }
  } catch (err) {
    // Fallback to in-memory store
  }

  return inMemoryLeads;
}
