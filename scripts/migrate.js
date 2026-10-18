const mysql = require('mysql2/promise');

async function migrate() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'db_kondangsensei',
    waitForConnections: true,
    connectionLimit: 5
  });

  console.log('Connecting to MySQL db_kondangsensei...');

  // 1. Users Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
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
  console.log('✅ users table created/verified');

  // 2. Questions Table
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
  console.log('✅ questions table created/verified');

  // 3. Exam Results Table
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
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('✅ exam_results table created/verified');

  // 4. Transactions Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id VARCHAR(64) PRIMARY KEY,
      userId VARCHAR(64) NOT NULL,
      userName VARCHAR(255) NOT NULL,
      packageId VARCHAR(64) NOT NULL,
      packageName VARCHAR(255) NOT NULL,
      amount INT NOT NULL,
      paymentMethod VARCHAR(64) NOT NULL,
      status ENUM('PENDING', 'PAID', 'FAILED') NOT NULL DEFAULT 'PAID',
      createdAt VARCHAR(64) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('✅ transactions table created/verified');

  // Seed default user if not exists
  const [existing] = await pool.query('SELECT id FROM users WHERE id = ?', ['u_1']);
  if (existing.length === 0) {
    const expiry = new Date(Date.now() + 7 * 86400000).toISOString();
    await pool.query(
      `INSERT INTO users (id, name, email, role, subscriptionExpiresAt, credits, facePhotoUrl, registrationNumber, nationality, dateOfBirth, sex)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'u_1',
        'Budi Pratama',
        'peserta@kondang.com',
        'user',
        expiry,
        99,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        'JFT-2026-88912',
        'INDONESIA',
        '2001/05/14',
        'MALE'
      ]
    );
    console.log('✅ Seeded default user u_1');
  }

  const [existingAdmin] = await pool.query('SELECT id FROM users WHERE id = ?', ['u_admin']);
  if (existingAdmin.length === 0) {
    const adminExpiry = new Date(Date.now() + 365 * 86400000).toISOString();
    await pool.query(
      `INSERT INTO users (id, name, email, role, subscriptionExpiresAt, credits, facePhotoUrl, registrationNumber, nationality, dateOfBirth, sex)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'u_admin',
        'Super Admin Kondang',
        'admin@kondang.com',
        'admin',
        adminExpiry,
        999,
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
        'ADM-2026-00001',
        'INDONESIA',
        '1995/10/20',
        'MALE'
      ]
    );
    console.log('✅ Seeded admin user u_admin');
  }

  const [tables] = await pool.query('SHOW TABLES');
  console.log('Current tables in db_kondangsensei:', tables);

  await pool.end();
  console.log('Migration finished successfully!');
}

migrate().catch(console.error);
