export type Role = 'user' | 'admin';

export type SectionType = 'S1' | 'S2' | 'S3' | 'S4';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: Role;
  subscriptionExpiresAt?: string | null; // Tanggal kedaluwarsa akses unlimited (ISO string)
  credits?: number; // Opsional untuk kompatibilitas
  facePhotoUrl?: string;
  registrationNumber: string;
  nationality: string;
  dateOfBirth: string;
  sex: 'Male' | 'Female' | 'MALE' | 'FEMALE' | string;
  activeSessionId?: string; // Single session token
  lastActiveAt?: string;
}

export interface Question {
  id: number;
  packageId?: number; // 1 | 2 | 3 | 4 (default 1)
  section: SectionType; // S1: Moji/Goi, S2: Kaiwa, S3: Chokai, S4: Dokkai
  sectionTitle: string; // e.g. "Seksi 1 - 文字と語彙 (Huruf & Kosakata)"
  number: number; // 1-50
  questionText: string;
  readingPassage?: string; // Teks bacaan panjang (Dokkai S4)
  imageUrl?: string;
  audioUrl?: string; // File audio MP3/WAV (Chokai S3)
  options: {
    key: 'A' | 'B' | 'C' | 'D';
    text: string;
    imageUrl?: string;
  }[];
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string; // Teks pembahasan & insight lengkap
}

export interface ExamSet {
  id: number;
  name: string;
  code: string;
  description: string;
  totalQuestions: number;
}

export interface UserAnswer {
  questionId: number;
  selectedOption: 'A' | 'B' | 'C' | 'D' | null;
  isFlagged: boolean; // Flag / Ragu-ragu
}

export interface ExamResult {
  id: string;
  userId: string;
  userName: string;
  registrationNumber: string;
  nationality?: string;
  dateOfBirth?: string;
  sex?: string;
  facePhotoUrl?: string;
  testDate: string;
  testLocation: string;
  totalScore: number; // 10 - 250
  assessmentResult: 'A1' | 'A2.1' | 'A2.2' | 'Tidak Lulus (Below A1)';
  isPassed: boolean;
  sectionScores: {
    S1: { score: number; maxScore: number; percentage: number }; // Huruf & Kosakata (12 soal)
    S2: { score: number; maxScore: number; percentage: number }; // Percakapan & Ekspresi (12 soal)
    S3: { score: number; maxScore: number; percentage: number }; // Pendengaran (13 soal)
    S4: { score: number; maxScore: number; percentage: number }; // Bacaan (13 soal)
  };
  answers: UserAnswer[];
  totalTimeSpentSeconds: number;
}

export interface TryoutPackage {
  id: string;
  name: string;
  description: string;
  durationDays: number; // Durasi masa aktif akses unlimited (dalam hari)
  durationHours?: number; // Opsional jika durasi dalam jam (misal paket trial 1 jam)
  price: number;
  popular?: boolean;
  firstTimeOnly?: boolean; // Khusus pengguna pertama kali / belum pernah langganan
  badge?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  packageId: string;
  packageName: string;
  amount: number;
  paymentMethod: string; // e.g. "QRIS", "BCA Virtual Account", "Mandiri VA"
  status: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED';
  createdAt: string;
  paymentCode?: string;
  howToPayUrl?: string;
  expiredAt?: string;
}

export interface PDFQuestionDraft {
  id: string;
  number?: number;
  rawText: string;
  section: SectionType;
  sectionTitle?: string;
  questionText: string;
  passageText?: string;
  imageUrl?: string;
  audioUrl?: string;
  options: { key: 'A' | 'B' | 'C' | 'D'; text: string }[];
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  status: 'DRAFT' | 'IMPORTED';
}
