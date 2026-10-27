const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

// Load environment variables from .env.local if present
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex > 0) {
        const key = trimmed.slice(0, eqIndex).trim();
        const value = trimmed.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}

loadEnv();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = Number(process.env.DB_PORT) || 3306;
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'db_kondangsensei';

// Load questions from src/lib/jftQuestions.ts via typescript transpile
function loadBaseQuestions() {
  const filePath = path.join(__dirname, '..', 'src', 'lib', 'jftQuestions.ts');
  const code = fs.readFileSync(filePath, 'utf8');
  const js = ts.transpile(code);
  const mod = { exports: {} };
  const fn = new Function('exports', 'require', js);
  fn(mod.exports, require);
  return mod.exports.JFT_QUESTIONS_BANK || [];
}

function generateAllPackageQuestions(baseQuestions) {
  const pkg1 = baseQuestions.map((q) => ({ ...q, packageId: 1 }));

  const pkg2 = baseQuestions.map((q) => ({
    ...q,
    id: 50 + q.id,
    packageId: 2,
    questionText: q.questionText.replace('【本】', '【水】').replace('【雨】', '【雪】')
  }));

  const pkg3 = baseQuestions.map((q) => ({
    ...q,
    id: 100 + q.id,
    packageId: 3,
    questionText: q.questionText.replace('【本】', '【車】').replace('【雨】', '【風】')
  }));

  const pkg4 = baseQuestions.map((q) => ({
    ...q,
    id: 150 + q.id,
    packageId: 4,
    questionText: q.questionText.replace('【本】', '【魚】').replace('【雨】', '【雲】')
  }));

  return [...pkg1, ...pkg2, ...pkg3, ...pkg4];
}

const EXAM_SETS = [
  {
    id: 1,
    name: 'Paket Ujian #1 (Simulasi Utama)',
    code: 'JFT-SET-A',
    description: '50 Soal standar asli JFT-Basic (Moji/Goi, Kaiwa, Chōkai Audio, Dokkai Passage).',
    totalQuestions: 50
  },
  {
    id: 2,
    name: 'Paket Ujian #2 (Intensif Kosakata & Tata Bahasa)',
    code: 'JFT-SET-B',
    description: '50 Soal variasi tata bahasa A2, percakapan kantor & kehidupan di Jepang.',
    totalQuestions: 50
  },
  {
    id: 3,
    name: 'Paket Ujian #3 (Master Chōkai Pendengaran)',
    code: 'JFT-SET-C',
    description: '50 Soal dengan simulasi audio percakapan tempat kerja & kehidupan sehari-hari.',
    totalQuestions: 50
  },
  {
    id: 4,
    name: 'Paket Ujian #4 (Tryout Spesial Final Test)',
    code: 'JFT-SET-D',
    description: '50 Soal komprehensif tingkat kesulitan A2.2 untuk tes akhir sebelum ujian resmi.',
    totalQuestions: 50
  }
];

async function migrateAndSeed() {
  console.log('====================================================');
  console.log(`🚀 KondangSensei Database Migration & Seed Tool`);
  console.log(`📡 Connecting to MySQL: ${DB_USER}@${DB_HOST}:${DB_PORT} -> ${DB_NAME}`);
  console.log('====================================================');

  // Step 1: Connect to server and ensure database exists (if permitted)
  try {
    if (!process.env.DATABASE_URL) {
      const isLocal = DB_HOST === 'localhost' || DB_HOST === '127.0.0.1';
      const rootConn = await mysql.createConnection({
        host: DB_HOST,
        port: DB_PORT,
        user: DB_USER,
        password: DB_PASSWORD,
        ssl: process.env.DB_SSL === 'true' || (!isLocal && process.env.DB_SSL !== 'false') ? { rejectUnauthorized: false } : undefined
      });

      await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
      console.log(`✅ Basis data '${DB_NAME}' siap.`);
      await rootConn.end();
    }
  } catch (err) {
    console.log(`ℹ️ Catatan database server: ${err.message}. Melanjutkan koneksi langsung ke '${DB_NAME}'...`);
  }

  // Step 2: Connect to the specific database pool
  const poolConfig = process.env.DATABASE_URL
    ? {
        uri: process.env.DATABASE_URL,
        ssl: process.env.DB_SSL === 'true' || !process.env.DATABASE_URL.includes('localhost') ? { rejectUnauthorized: false } : undefined,
        waitForConnections: true,
        connectionLimit: 10
      }
    : {
        host: DB_HOST,
        port: DB_PORT,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME,
        ssl: process.env.DB_SSL === 'true' || (DB_HOST !== 'localhost' && DB_HOST !== '127.0.0.1' && process.env.DB_SSL !== 'false') ? { rejectUnauthorized: false } : undefined,
        waitForConnections: true,
        connectionLimit: 10
      };

  const pool = mysql.createPool(poolConfig);

  // Step 3: Schema Migrations
  console.log('\n--- 1. Menyiapkan Tabel Basis Data ---');

  // 1. Users Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL DEFAULT 'password123',
      role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
      subscriptionExpiresAt VARCHAR(64) NULL,
      credits INT NOT NULL DEFAULT 99,
      facePhotoUrl TEXT NULL,
      registrationNumber VARCHAR(64) NOT NULL,
      nationality VARCHAR(100) NOT NULL DEFAULT 'INDONESIA',
      dateOfBirth VARCHAR(32) NOT NULL DEFAULT '2001/05/14',
      sex VARCHAR(16) NOT NULL DEFAULT 'MALE',
      activeSessionId VARCHAR(128) NULL,
      lastActiveAt VARCHAR(64) NULL,
      currentActivity JSON NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Migration patches for users
  try {
    await pool.query(`ALTER TABLE users ADD COLUMN password VARCHAR(255) NOT NULL DEFAULT 'password123' AFTER email`);
  } catch {}
  try {
    await pool.query(`ALTER TABLE users ADD COLUMN currentActivity JSON NULL AFTER lastActiveAt`);
  } catch {}
  console.log('✅ Tabel `users` siap.');

  // 2. Exam Sets Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS exam_sets (
      id INT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(64) NOT NULL,
      description TEXT NOT NULL,
      totalQuestions INT NOT NULL DEFAULT 50,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('✅ Tabel `exam_sets` siap.');

  // 3. Questions Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS questions (
      id INT PRIMARY KEY,
      packageId INT NOT NULL DEFAULT 1,
      section ENUM('S1', 'S2', 'S3', 'S4') NOT NULL,
      sectionTitle VARCHAR(255) NOT NULL,
      number INT NOT NULL,
      questionText TEXT NOT NULL,
      readingPassage TEXT NULL,
      imageUrl TEXT NULL,
      audioUrl TEXT NULL,
      options JSON NOT NULL,
      correctAnswer ENUM('A', 'B', 'C', 'D') NOT NULL,
      explanation TEXT NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('✅ Tabel `questions` siap.');

  // 4. Exam Results Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS exam_results (
      id VARCHAR(64) PRIMARY KEY,
      userId VARCHAR(64) NOT NULL,
      userName VARCHAR(255) NOT NULL,
      registrationNumber VARCHAR(64) NOT NULL,
      testDate VARCHAR(32) NOT NULL,
      testLocation VARCHAR(255) NOT NULL,
      totalScore INT NOT NULL,
      assessmentResult VARCHAR(64) NOT NULL,
      isPassed BOOLEAN NOT NULL,
      sectionScores JSON NOT NULL,
      answers JSON NOT NULL,
      totalTimeSpentSeconds INT NOT NULL,
      packageId INT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  try {
    await pool.query(`ALTER TABLE exam_results ADD COLUMN packageId INT NULL AFTER totalTimeSpentSeconds`);
  } catch {}
  console.log('✅ Tabel `exam_results` siap.');

  // 5. Transactions Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id VARCHAR(64) PRIMARY KEY,
      userId VARCHAR(64) NOT NULL,
      userName VARCHAR(255) NOT NULL,
      packageId VARCHAR(64) NOT NULL,
      packageName VARCHAR(255) NOT NULL,
      amount INT NOT NULL,
      paymentMethod VARCHAR(255) NOT NULL,
      paymentCode VARCHAR(64) NULL,
      howToPayUrl TEXT NULL,
      expiredAt VARCHAR(64) NULL,
      status ENUM('PENDING', 'PAID', 'FAILED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
      createdAt VARCHAR(64) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  try {
    await pool.query(`ALTER TABLE transactions MODIFY COLUMN status ENUM('PENDING', 'PAID', 'FAILED', 'EXPIRED') NOT NULL DEFAULT 'PENDING'`);
  } catch {}
  try {
    await pool.query(`ALTER TABLE transactions ADD COLUMN paymentCode VARCHAR(64) NULL AFTER paymentMethod`);
  } catch {}
  try {
    await pool.query(`ALTER TABLE transactions ADD COLUMN howToPayUrl TEXT NULL AFTER paymentCode`);
  } catch {}
  try {
    await pool.query(`ALTER TABLE transactions ADD COLUMN expiredAt VARCHAR(64) NULL AFTER howToPayUrl`);
  } catch {}
  console.log('✅ Tabel `transactions` siap.');

  // Step 4: Seeding Users
  console.log('\n--- 2. Melakukan Seeding Data Pengguna (Users) ---');
  const userPasswordHash = await bcrypt.hash('password123', 10);
  const adminPasswordHash = await bcrypt.hash('adminsecret123', 10);

  const defaultUsers = [
    {
      id: 'u_1',
      name: 'Budi Pratama',
      email: 'peserta@kondang.com',
      password: userPasswordHash,
      role: 'user',
      subscriptionExpiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      credits: 99,
      facePhotoUrl: null,
      registrationNumber: 'JFT-2026-88912',
      nationality: 'INDONESIA',
      dateOfBirth: '2001/05/14',
      sex: 'MALE'
    },
    {
      id: 'u_2',
      name: 'Siti Rahmawati',
      email: 'siti@kondang.com',
      password: userPasswordHash,
      role: 'user',
      subscriptionExpiresAt: new Date(Date.now() + 14 * 86400000).toISOString(),
      credits: 99,
      facePhotoUrl: null,
      registrationNumber: 'JFT-2026-77821',
      nationality: 'INDONESIA',
      dateOfBirth: '2002/08/21',
      sex: 'FEMALE'
    },
    {
      id: 'u_admin',
      name: 'Super Admin Kondang',
      email: 'admin@kondang.com',
      password: adminPasswordHash,
      role: 'admin',
      subscriptionExpiresAt: new Date(Date.now() + 365 * 86400000).toISOString(),
      credits: 999,
      facePhotoUrl: null,
      registrationNumber: 'ADM-2026-00001',
      nationality: 'INDONESIA',
      dateOfBirth: '1995/10/20',
      sex: 'MALE'
    }
  ];

  for (const u of defaultUsers) {
    await pool.query(
      `INSERT INTO users 
       (id, name, email, password, role, subscriptionExpiresAt, credits, facePhotoUrl, registrationNumber, nationality, dateOfBirth, sex)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         email = VALUES(email),
         password = VALUES(password),
         role = VALUES(role),
         subscriptionExpiresAt = VALUES(subscriptionExpiresAt),
         credits = VALUES(credits),
         facePhotoUrl = VALUES(facePhotoUrl),
         registrationNumber = VALUES(registrationNumber),
         nationality = VALUES(nationality),
         dateOfBirth = VALUES(dateOfBirth),
         sex = VALUES(sex)`,
      [
        u.id,
        u.name,
        u.email,
        u.password,
        u.role,
        u.subscriptionExpiresAt,
        u.credits,
        u.facePhotoUrl,
        u.registrationNumber,
        u.nationality,
        u.dateOfBirth,
        u.sex
      ]
    );
    console.log(`  👤 [${u.role.toUpperCase()}] ${u.name} (${u.email}) - password: ${u.role === 'admin' ? 'adminsecret123' : 'password123'}`);
  }
  console.log('✅ Seeding user berhasil diselesaikan.');

  // Step 5: Seeding Exam Sets
  console.log('\n--- 3. Melakukan Seeding Paket Ujian (Exam Sets) ---');
  for (const set of EXAM_SETS) {
    await pool.query(
      `INSERT INTO exam_sets (id, name, code, description, totalQuestions)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         code = VALUES(code),
         description = VALUES(description),
         totalQuestions = VALUES(totalQuestions)`,
      [set.id, set.name, set.code, set.description, set.totalQuestions]
    );
    console.log(`  📦 [Paket #${set.id}] ${set.name} (${set.code})`);
  }
  console.log('✅ Seeding exam_sets berhasil diselesaikan.');

  // Step 6: Seeding Questions Bank
  console.log('\n--- 4. Melakukan Seeding Bank Soal (Questions) ---');
  const baseQuestions = loadBaseQuestions();
  console.log(`  📖 Ditemukan ${baseQuestions.length} soal master dari jftQuestions.ts.`);
  const allQuestions = generateAllPackageQuestions(baseQuestions);
  console.log(`  ⚡ Menyinkronkan total ${allQuestions.length} soal untuk 4 paket ke database MySQL...`);

  for (const q of allQuestions) {
    await pool.query(
      `INSERT INTO questions 
       (id, packageId, section, sectionTitle, number, questionText, readingPassage, imageUrl, audioUrl, options, correctAnswer, explanation)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         packageId = VALUES(packageId),
         section = VALUES(section),
         sectionTitle = VALUES(sectionTitle),
         number = VALUES(number),
         questionText = VALUES(questionText),
         readingPassage = VALUES(readingPassage),
         imageUrl = VALUES(imageUrl),
         audioUrl = VALUES(audioUrl),
         options = VALUES(options),
         correctAnswer = VALUES(correctAnswer),
         explanation = VALUES(explanation)`,
      [
        q.id,
        q.packageId || 1,
        q.section,
        q.sectionTitle,
        q.number,
        q.questionText,
        q.readingPassage || null,
        q.imageUrl || null,
        q.audioUrl || null,
        JSON.stringify(q.options),
        q.correctAnswer,
        q.explanation
      ]
    );
  }
  console.log(`✅ Berhasil menyinkronkan seluruh ${allQuestions.length} bank soal ke tabel questions.`);

  // Step 7: Verifikasi Akhir
  console.log('\n--- 5. Ringkasan Status Basis Data db_kondangsensei ---');
  const [[{ userCount }]] = await pool.query('SELECT COUNT(*) as userCount FROM users');
  const [[{ setCount }]] = await pool.query('SELECT COUNT(*) as setCount FROM exam_sets');
  const [[{ questionCount }]] = await pool.query('SELECT COUNT(*) as questionCount FROM questions');
  const [[{ examResultCount }]] = await pool.query('SELECT COUNT(*) as examResultCount FROM exam_results');
  const [[{ txCount }]] = await pool.query('SELECT COUNT(*) as txCount FROM transactions');

  console.log(`📊 users        : ${userCount} akun`);
  console.log(`📊 exam_sets    : ${setCount} paket`);
  console.log(`📊 questions    : ${questionCount} butir soal`);
  console.log(`📊 exam_results : ${examResultCount} riwayat`);
  console.log(`📊 transactions : ${txCount} transaksi`);

  await pool.end();
  console.log('\n====================================================');
  console.log('🎉 Migrasi dan Seeding db_kondangsensei Selesai 100%!');
  console.log('====================================================');
}

migrateAndSeed().catch((err) => {
  console.error('\n❌ Terjadi kesalahan saat migrasi/seeding:', err);
  process.exit(1);
});
