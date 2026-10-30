import fs from 'fs';
import path from 'path';

// Parse .env.local manually without external dependencies
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.substring(0, idx).trim();
        let val = trimmed.substring(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    });
  }
} catch (e) {
  console.warn('Warning reading .env.local:', e);
}

import { initDatabase, pool } from '../src/lib/db';

async function main() {
  console.log('🚀 Memulai inisialisasi tabel dan seed data ke MySQL db_kondangsensei...');
  try {
    await initDatabase();
    console.log('✅ Inisialisasi tabel dan seeding berhasil 100%!\n');

    const [tables] = await pool.query<any[]>('SHOW TABLES');
    console.log(`📊 Total tabel yang terverifikasi di MySQL: ${tables.length}`);

    const [users] = await pool.query<any[]>('SELECT id, name, email, role, credits FROM users');
    console.log('\n👥 Daftar Pengguna Tersemai (Seeded Users):');
    console.table(users);

    const [qCount] = await pool.query<any[]>('SELECT COUNT(*) as count FROM questions');
    console.log(`\n📚 Total Butir Bank Soal: ${qCount[0].count} soal`);

    const [examSets] = await pool.query<any[]>('SELECT id, name, code, totalQuestions FROM exam_sets');
    console.log('\n📦 Paket Ujian (Exam Sets):');
    console.table(examSets);

    const [vouchers] = await pool.query<any[]>('SELECT id, code, discountType, discountValue, isActive FROM vouchers');
    console.log('\n🏷️ Voucher Diskon Aktif:');
    console.table(vouchers);

    process.exit(0);
  } catch (err) {
    console.error('❌ Gagal menjalankan inisialisasi database:', err);
    process.exit(1);
  }
}

main();
