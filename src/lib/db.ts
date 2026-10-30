import mysql from 'mysql2/promise';
import { DEFAULT_ANONYMOUS_PHOTO } from './dataStore';

function getPoolConfig() {
  if (process.env.DATABASE_URL) {
    const url = process.env.DATABASE_URL;
    const isCloud = !url.includes('localhost') && !url.includes('127.0.0.1');
    const useSsl = process.env.DB_SSL === 'true' || (process.env.DB_SSL !== 'false' && isCloud);
    return {
      uri: url,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      connectTimeout: 20000,
      ssl: useSsl ? { rejectUnauthorized: false } : undefined
    };
  }

  const host = process.env.DB_HOST || 'localhost';
  const isLocal = host === 'localhost' || host === '127.0.0.1';
  const useSsl = process.env.DB_SSL === 'true' || (!isLocal && process.env.DB_SSL !== 'false');

  return {
    host,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'db_kondangsensei',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    connectTimeout: 20000,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined
  };
}

// MySQL Connection Pool (Supports local development & cloud hosting / DATABASE_URL)
export const pool = mysql.createPool(getPoolConfig());

// Safe error listener on underlying pool to prevent unhandled socket drop errors
try {
  (pool as any).pool?.on?.('error', (err: any) => {
    console.error('Unexpected error on idle MySQL connection in pool:', err);
  });
} catch {}

let isInitialized = false;

/**
 * Automatically initializes database tables in db_kondangsensei if they do not exist.
 */
export async function initDatabase() {
  if (isInitialized) return;
  // Skip database operations during build phase to avoid ENOTFOUND / connection timeouts
  if (
    process.env.IS_DOCKER_BUILD === 'true' ||
    process.env.NEXT_PHASE === 'phase-production-build'
  ) {
    return;
  }
  try {
    const connection = await pool.getConnection();
    try {
      // 1. Users Table
      await connection.query(`
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

      // Migration: Ensure currentActivity column exists in users
      try {
        await connection.query(`ALTER TABLE users ADD COLUMN currentActivity JSON NULL AFTER lastActiveAt`);
      } catch {}

      // 2. Questions Table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS questions (
          id INT PRIMARY KEY,
          packageId INT NOT NULL DEFAULT 1,
          section ENUM('S1', 'S2', 'S3', 'S4') NOT NULL,
          sectionTitle VARCHAR(255) NOT NULL,
          number INT NOT NULL,
          questionText TEXT NOT NULL,
          readingPassage MEDIUMTEXT NULL,
          imageUrl MEDIUMTEXT NULL,
          audioUrl MEDIUMTEXT NULL,
          options JSON NOT NULL,
          correctAnswer ENUM('A', 'B', 'C', 'D') NOT NULL,
          explanation TEXT NOT NULL,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // Migration: Ensure imageUrl and audioUrl are MEDIUMTEXT
      try {
        await connection.query(`ALTER TABLE questions MODIFY COLUMN imageUrl MEDIUMTEXT NULL`);
      } catch {}
      try {
        await connection.query(`ALTER TABLE questions MODIFY COLUMN audioUrl MEDIUMTEXT NULL`);
      } catch {}
      try {
        await connection.query(`ALTER TABLE questions MODIFY COLUMN readingPassage MEDIUMTEXT NULL`);
      } catch {}

      // 3. Exam Results Table
      await connection.query(`
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

      // Migration: Ensure packageId, facePhotoUrl, nationality, dateOfBirth, sex columns exist in exam_results
      try {
        await connection.query(`ALTER TABLE exam_results ADD COLUMN packageId INT NULL AFTER totalTimeSpentSeconds`);
      } catch {}
      try {
        await connection.query(`ALTER TABLE exam_results ADD COLUMN facePhotoUrl TEXT NULL AFTER packageId`);
      } catch {}
      try {
        await connection.query(`ALTER TABLE exam_results ADD COLUMN nationality VARCHAR(64) NULL AFTER userName`);
      } catch {}
      try {
        await connection.query(`ALTER TABLE exam_results ADD COLUMN dateOfBirth VARCHAR(64) NULL AFTER nationality`);
      } catch {}
      try {
        await connection.query(`ALTER TABLE exam_results ADD COLUMN sex VARCHAR(32) NULL AFTER dateOfBirth`);
      } catch {}

      // 4. Transactions Table
      await connection.query(`
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

      // Migration: Ensure columns & enum values exist if table was created previously
      try {
        await connection.query(`ALTER TABLE transactions MODIFY COLUMN status ENUM('PENDING', 'PAID', 'FAILED', 'EXPIRED') NOT NULL DEFAULT 'PENDING'`);
      } catch {}
      try {
        await connection.query(`ALTER TABLE transactions ADD COLUMN paymentCode VARCHAR(64) NULL AFTER paymentMethod`);
      } catch {}
      try {
        await connection.query(`ALTER TABLE transactions ADD COLUMN howToPayUrl TEXT NULL AFTER paymentCode`);
      } catch {}
      try {
        await connection.query(`ALTER TABLE transactions ADD COLUMN expiredAt VARCHAR(64) NULL AFTER howToPayUrl`);
      } catch {}
      try {
        await connection.query(`ALTER TABLE transactions ADD COLUMN voucherCode VARCHAR(64) NULL AFTER amount`);
      } catch {}
      try {
        await connection.query(`ALTER TABLE transactions ADD COLUMN discountAmount INT NOT NULL DEFAULT 0 AFTER voucherCode`);
      } catch {}
      try {
        await connection.query(`ALTER TABLE transactions ADD COLUMN originalAmount INT NULL AFTER discountAmount`);
      } catch {}

      // 5. Exam Sets Table (Paket Bank Soal Dinamis)
      await connection.query(`
        CREATE TABLE IF NOT EXISTS exam_sets (
          id INT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          code VARCHAR(64) NOT NULL,
          description TEXT NOT NULL,
          totalQuestions INT NOT NULL DEFAULT 50,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 6. Vouchers Table (Kode Kupon & Potongan Diskon)
      await connection.query(`
        CREATE TABLE IF NOT EXISTS vouchers (
          id VARCHAR(64) PRIMARY KEY,
          code VARCHAR(64) NOT NULL UNIQUE,
          discountType ENUM('PERCENTAGE', 'FIXED') NOT NULL DEFAULT 'PERCENTAGE',
          discountValue INT NOT NULL,
          maxDiscountAmount INT NULL,
          minPurchaseAmount INT NOT NULL DEFAULT 0,
          usageLimit INT NULL DEFAULT NULL,
          usedCount INT NOT NULL DEFAULT 0,
          validPackages JSON NULL,
          startDate VARCHAR(64) NULL,
          expiredAt VARCHAR(64) NULL,
          isActive BOOLEAN NOT NULL DEFAULT TRUE,
          description VARCHAR(255) NULL,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 7. Leads Table (M2 Lead Magnet)
      await connection.query(`
        CREATE TABLE IF NOT EXISTS leads (
          id VARCHAR(36) PRIMARY KEY,
          name VARCHAR(150) NOT NULL,
          whatsapp_number VARCHAR(20) NOT NULL,
          email VARCHAR(191) NULL,
          score INT NOT NULL,
          max_score INT DEFAULT 250,
          passing_grade INT DEFAULT 200,
          is_passed BOOLEAN NOT NULL,
          weakest_section VARCHAR(50) NOT NULL,
          utm_source VARCHAR(100) NULL,
          utm_campaign VARCHAR(100) NULL,
          converted_to_user_id VARCHAR(36) NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 8. Packages Table (M3 Centralized Catalog)
      await connection.query(`
        CREATE TABLE IF NOT EXISTS packages (
          id VARCHAR(36) PRIMARY KEY,
          name VARCHAR(150) NOT NULL,
          slug VARCHAR(150) UNIQUE NOT NULL,
          description TEXT,
          price DECIMAL(12,2) NOT NULL,
          original_price DECIMAL(12,2) NULL,
          is_bundle BOOLEAN DEFAULT FALSE,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 9. Bundle Items Table (M3 Bundling Components)
      await connection.query(`
        CREATE TABLE IF NOT EXISTS bundle_items (
          id VARCHAR(36) PRIMARY KEY,
          bundle_package_id VARCHAR(36) NOT NULL,
          target_module ENUM('lms_n5', 'cbt_jft') NOT NULL,
          access_duration_days INT NOT NULL,
          cbt_attempt_quota INT DEFAULT 0
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 10. User Entitlements Table (M3 Entitlement Provisioning)
      await connection.query(`
        CREATE TABLE IF NOT EXISTS user_entitlements (
          id VARCHAR(36) PRIMARY KEY,
          user_id VARCHAR(64) NOT NULL,
          module ENUM('lms_n5', 'cbt_jft') NOT NULL,
          cbt_quota_remaining INT DEFAULT 0,
          valid_until DATETIME NOT NULL,
          transaction_id VARCHAR(64) NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 11. Bunpou Lessons Table (M4 Zero-Video Bunpou Architecture)
      await connection.query(`
        CREATE TABLE IF NOT EXISTS bunpou_lessons (
          id VARCHAR(36) PRIMARY KEY,
          chapter_id INT NOT NULL,
          pattern_code VARCHAR(64) NOT NULL,
          title VARCHAR(255) NOT NULL,
          meaning TEXT NOT NULL,
          formula_blocks JSON NOT NULL,
          key_points JSON NOT NULL,
          example_sentences JSON NOT NULL,
          nuance_accordion JSON NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 12. Vocabularies Table (M5 Kotoba SRS)
      await connection.query(`
        CREATE TABLE IF NOT EXISTS vocabularies (
          id VARCHAR(36) PRIMARY KEY,
          chapter_id INT NOT NULL,
          kanji VARCHAR(50) NULL,
          kana VARCHAR(50) NOT NULL,
          romaji VARCHAR(50) NOT NULL,
          indonesian_meaning TEXT NOT NULL,
          word_type VARCHAR(50) NULL,
          audio_url VARCHAR(255) NULL,
          example_sentence_jp TEXT NULL,
          example_sentence_id TEXT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 13. User Vocab SRS Table (M5 SM-2 Algorithm Progress)
      await connection.query(`
        CREATE TABLE IF NOT EXISTS user_vocab_srs (
          id VARCHAR(36) PRIMARY KEY,
          user_id VARCHAR(64) NOT NULL,
          vocab_id VARCHAR(36) NOT NULL,
          easiness_factor DECIMAL(4,2) DEFAULT 2.50,
          repetition_count INT DEFAULT 0,
          interval_days INT DEFAULT 0,
          last_quality_rating INT NULL,
          next_review_at DATETIME NOT NULL,
          last_reviewed_at DATETIME NULL,
          UNIQUE KEY uq_user_vocab (user_id, vocab_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 14. Renshu Questions Table (M6 Dynamic Practice)
      await connection.query(`
        CREATE TABLE IF NOT EXISTS renshu_questions (
          id VARCHAR(36) PRIMARY KEY,
          chapter_id INT NOT NULL,
          question_type ENUM('drag_drop', 'fill_blank') NOT NULL,
          prompt_text TEXT NOT NULL,
          correct_tokens JSON NOT NULL,
          distractor_tokens JSON NULL,
          target_sentence_jp VARCHAR(255) NOT NULL,
          explanation TEXT NOT NULL,
          difficulty_level INT DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 15. Renshu Submissions Table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS renshu_submissions (
          id VARCHAR(36) PRIMARY KEY,
          user_id VARCHAR(64) NOT NULL,
          question_id VARCHAR(36) NOT NULL,
          class_id VARCHAR(64) NULL,
          submitted_tokens JSON NOT NULL,
          is_correct BOOLEAN NOT NULL,
          attempt_count INT DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 16. Kaiwa Scenes Table (M7 2D Visual Novel)
      await connection.query(`
        CREATE TABLE IF NOT EXISTS kaiwa_scenes (
          id VARCHAR(36) PRIMARY KEY,
          chapter_id INT NOT NULL,
          scene_title VARCHAR(150) NOT NULL,
          setting_background_url VARCHAR(255) NOT NULL,
          situation_description TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 17. Kaiwa Lines Table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS kaiwa_lines (
          id VARCHAR(36) PRIMARY KEY,
          scene_id VARCHAR(36) NOT NULL,
          line_order INT NOT NULL,
          speaker_name VARCHAR(50) NOT NULL,
          character_avatar_url VARCHAR(255) NOT NULL,
          character_position ENUM('left', 'right') DEFAULT 'left',
          japanese_text TEXT NOT NULL,
          furigana_json JSON NULL,
          romaji TEXT NOT NULL,
          indonesian_translation TEXT NOT NULL,
          audio_url VARCHAR(255) NOT NULL,
          is_student_role BOOLEAN DEFAULT FALSE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 18. Kaiwa Voice Submissions Table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS kaiwa_voice_submissions (
          id VARCHAR(36) PRIMARY KEY,
          user_id VARCHAR(64) NOT NULL,
          line_id VARCHAR(36) NOT NULL,
          audio_file_url VARCHAR(255) NOT NULL,
          audio_duration_seconds DECIMAL(5,2) NOT NULL,
          review_status ENUM('pending', 'approved', 'revision_needed') DEFAULT 'pending',
          sensei_feedback_audio_url VARCHAR(255) NULL,
          sensei_feedback_text TEXT NULL,
          hanamaru_awarded BOOLEAN DEFAULT FALSE,
          submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 7. Auto Seed & Sync Bank Soal, Exam Sets, Users, and Vouchers
      await syncUsersToDatabase(connection);
      await syncQuestionsToDatabase(connection);
      await syncExamSetsToDatabase(connection);
      await syncVouchersToDatabase(connection);

      isInitialized = true;
      console.log('✅ MySQL database tables in db_kondangsensei verified/created successfully.');
    } finally {
      connection.release();
    }
  } catch (err) {
    console.warn('⚠️ Could not connect to MySQL server or initialize tables:', err instanceof Error ? err.message : err);
  }
}

/**
 * Synchronizes default dummy users (u_1, u_2, u_admin) to MySQL database if empty or missing.
 */
export async function syncUsersToDatabase(existingConn?: mysql.PoolConnection, force = false) {
  const conn = existingConn || (await pool.getConnection());
  try {
    const [userCountRows] = await conn.query<any[]>('SELECT COUNT(*) as count FROM users');
    const count = userCountRows?.[0]?.count || 0;
    if (count === 0 || force) {
      const bcrypt = (await import('bcryptjs')).default;
      const hashedUserPass = await bcrypt.hash('password123', 10);
      const hashedAdminPass = await bcrypt.hash('adminsecret123', 10);

      const defaultUsers = [
        {
          id: 'u_1',
          name: 'Budi Pratama',
          email: 'peserta@kondang.com',
          password: hashedUserPass,
          role: 'user',
          subscriptionExpiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
          credits: 99,
          facePhotoUrl: DEFAULT_ANONYMOUS_PHOTO,
          registrationNumber: 'JFT-2026-88912',
          nationality: 'INDONESIA',
          dateOfBirth: '2001/05/14',
          sex: 'MALE'
        },
        {
          id: 'u_2',
          name: 'Siti Rahmawati',
          email: 'siti@kondang.com',
          password: hashedUserPass,
          role: 'user',
          subscriptionExpiresAt: new Date(Date.now() + 14 * 86400000).toISOString(),
          credits: 99,
          facePhotoUrl: DEFAULT_ANONYMOUS_PHOTO,
          registrationNumber: 'JFT-2026-77821',
          nationality: 'INDONESIA',
          dateOfBirth: '2002/08/21',
          sex: 'FEMALE'
        },
        {
          id: 'u_admin',
          name: 'Super Admin Kondang',
          email: 'admin@kondang.com',
          password: hashedAdminPass,
          role: 'admin',
          subscriptionExpiresAt: new Date(Date.now() + 365 * 86400000).toISOString(),
          credits: 999,
          facePhotoUrl: DEFAULT_ANONYMOUS_PHOTO,
          registrationNumber: 'ADM-2026-00001',
          nationality: 'INDONESIA',
          dateOfBirth: '1995/10/20',
          sex: 'MALE'
        }
      ];

      for (const u of defaultUsers) {
        await conn.query(
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
      }
      console.log('✅ Berhasil menyinkronkan data user awal (peserta & admin) ke MySQL.');
    }
  } catch (err) {
    console.warn('⚠️ Gagal menyinkronkan users ke MySQL:', err);
  } finally {
    if (!existingConn) {
      conn.release();
    }
  }
}

/**
 * Synchronizes default Exam Sets (Paket 1 - 4) to MySQL database if empty.
 * Only Mini Tryout (id = 99) is strictly protected from deletion.
 */
export async function syncExamSetsToDatabase(existingConn?: mysql.PoolConnection, force = false) {
  const conn = existingConn || (await pool.getConnection());
  try {
    const [setCountRows] = await conn.query<any[]>('SELECT COUNT(*) as count FROM exam_sets');
    const count = setCountRows?.[0]?.count || 0;
    const { EXAM_SETS } = await import('./dataStore');

    // Hanya masukkan paket awal lengkap (Paket 1 - 4) jika database kosong / baru pertama kali dibuat
    if (count === 0 || force) {
      for (const set of EXAM_SETS) {
        await conn.query(
          `INSERT INTO exam_sets (id, name, code, description, totalQuestions)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             name = VALUES(name),
             code = VALUES(code),
             description = VALUES(description),
             totalQuestions = VALUES(totalQuestions)`,
          [set.id, set.name, set.code, set.description, set.totalQuestions]
        );
      }
      console.log('✅ Berhasil menyinkronkan daftar paket awal ke MySQL.');
    } else {
      // Pastikan Paket Mini Tryout (id = 99) SELALU ada di database
      const [miniRows] = await conn.query<any[]>('SELECT COUNT(*) as count FROM exam_sets WHERE id = 99');
      if ((miniRows?.[0]?.count || 0) === 0) {
        const miniSet = EXAM_SETS.find((s) => s.id === 99);
        if (miniSet) {
          await conn.query(
            `INSERT INTO exam_sets (id, name, code, description, totalQuestions)
             VALUES (?, ?, ?, ?, ?)`,
            [miniSet.id, miniSet.name, miniSet.code, miniSet.description, miniSet.totalQuestions]
          );
        }
      }
    }
  } catch (err) {
    console.warn('⚠️ Gagal menyinkronkan exam_sets ke MySQL:', err);
  } finally {
    if (!existingConn) {
      conn.release();
    }
  }
}

/**
 * Synchronizes Bank Soal (Paket 1 - 4) to MySQL database.
 * Updates questions if count < 200 or forces sync.
 */
export async function syncQuestionsToDatabase(existingConn?: mysql.PoolConnection, force = false) {
  const conn = existingConn || (await pool.getConnection());
  try {
    const [qCountRows] = await conn.query<any[]>('SELECT COUNT(*) as count FROM questions');
    const qCount = qCountRows?.[0]?.count || 0;
    if (qCount === 0 || force) {
      const { generateAllPackageQuestions } = await import('./dataStore');
      const allQuestions = generateAllPackageQuestions();
      console.log(`📥 Menyinkronkan ${allQuestions.length} bank soal ke database MySQL (force: ${force})...`);

      for (const q of allQuestions) {
        await conn.query(
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
      console.log('✅ Berhasil menyinkronkan seluruh Bank Soal ke MySQL.');
    }

    // Pastikan 12 Soal Mini Tryout (packageId = 99) selalu tersimpan di MySQL jika belum ada
    const [miniRows] = await conn.query<any[]>('SELECT COUNT(*) as count FROM questions WHERE packageId = 99');
    if ((miniRows?.[0]?.count || 0) < 12) {
      const { MINI_TRYOUT_QUESTIONS } = await import('./miniTryoutQuestions');
      for (const q of MINI_TRYOUT_QUESTIONS) {
        await conn.query(
          `INSERT INTO questions 
           (id, packageId, section, sectionTitle, number, questionText, readingPassage, imageUrl, audioUrl, options, correctAnswer, explanation)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             packageId = VALUES(packageId)`,
          [
            q.id,
            99,
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
      console.log('✅ Berhasil memastikan 12 Soal Mini Tryout tersimpan di database MySQL.');
    }
  } catch (seedErr) {
    console.warn('⚠️ Gagal menyinkronkan bank soal ke MySQL:', seedErr);
  } finally {
    if (!existingConn) {
      conn.release();
    }
  }
}

/**
 * Synchronizes default Vouchers to MySQL database if empty.
 */
export async function syncVouchersToDatabase(existingConn?: mysql.PoolConnection) {
  const conn = existingConn || (await pool.getConnection());
  try {
    const [rows] = await conn.query<any[]>('SELECT COUNT(*) as count FROM vouchers');
    const count = rows?.[0]?.count || 0;
    if (count === 0) {
      const { DEFAULT_VOUCHERS } = await import('./dataStore');
      for (const v of DEFAULT_VOUCHERS) {
        await conn.query(
          `INSERT INTO vouchers (id, code, discountType, discountValue, maxDiscountAmount, minPurchaseAmount, usageLimit, usedCount, validPackages, startDate, expiredAt, isActive, description)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             code = VALUES(code)`,
          [
            v.id,
            v.code,
            v.discountType,
            v.discountValue,
            v.maxDiscountAmount || null,
            v.minPurchaseAmount || 0,
            v.usageLimit || null,
            v.usedCount || 0,
            v.validPackages ? JSON.stringify(v.validPackages) : null,
            v.startDate || null,
            v.expiredAt || null,
            v.isActive ? 1 : 0,
            v.description || null
          ]
        );
      }
      console.log('✅ Berhasil menyinkronkan daftar voucher awal ke MySQL.');
    }
  } catch (err) {
    console.warn('⚠️ Gagal menyinkronkan vouchers ke MySQL:', err);
  } finally {
    if (!existingConn) {
      conn.release();
    }
  }
}

