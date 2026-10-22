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
          readingPassage TEXT NULL,
          imageUrl TEXT NULL,
          audioUrl TEXT NULL,
          options JSON NOT NULL,
          correctAnswer ENUM('A', 'B', 'C', 'D') NOT NULL,
          explanation TEXT NOT NULL,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

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

      // Migration: Ensure packageId column exists in exam_results
      try {
        await connection.query(`ALTER TABLE exam_results ADD COLUMN packageId INT NULL AFTER totalTimeSpentSeconds`);
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

      // 6. Auto Seed & Sync Bank Soal, Exam Sets, and Users
      await syncUsersToDatabase(connection);
      await syncQuestionsToDatabase(connection);
      await syncExamSetsToDatabase(connection);

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
 */
export async function syncExamSetsToDatabase(existingConn?: mysql.PoolConnection) {
  const conn = existingConn || (await pool.getConnection());
  try {
    const [countRows] = await conn.query<any[]>('SELECT COUNT(*) as count FROM exam_sets');
    const count = countRows?.[0]?.count || 0;
    if (count === 0) {
      const { EXAM_SETS } = await import('./dataStore');
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
      console.log('✅ Berhasil menyinkronkan daftar paket awal (Paket 1 - 4) ke MySQL.');
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
    if (qCount < 200 || force) {
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
  } catch (seedErr) {
    console.warn('⚠️ Gagal menyinkronkan bank soal ke MySQL:', seedErr);
  } finally {
    if (!existingConn) {
      conn.release();
    }
  }
}
