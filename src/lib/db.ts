import mysql from 'mysql2/promise';

// MySQL Connection Pool to localhost db_kondangsensei (user: root, no password)
export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'db_kondangsensei',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

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
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

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

      // 6. Auto Seed & Sync Bank Soal (Paket 1 - 4)
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
 * Updates questions if count === 0 or forces sync.
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
  } catch (seedErr) {
    console.warn('⚠️ Gagal menyinkronkan bank soal ke MySQL:', seedErr);
  } finally {
    if (!existingConn) {
      conn.release();
    }
  }
}
