import { NextResponse } from 'next/server';
import { pool, initDatabase } from '@/lib/db';

export interface LeadRecord {
  id: string | number;
  name: string;
  whatsapp: string;
  source: string;
  score?: number | null;
  weakness?: string | null;
  createdAt: string;
}

declare global {
  var __kondangLeads: LeadRecord[] | undefined;
}

if (!globalThis.__kondangLeads) {
  globalThis.__kondangLeads = [];
}

// POST: Simpan nomor WhatsApp & Nama peserta yang mencoba Mini Tryout Gratis
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, whatsapp, score, weakness, source = 'mini_tryout' } = body;

    if (!name || !whatsapp) {
      return NextResponse.json({ success: false, message: 'Nama dan Nomor WhatsApp wajib diisi' }, { status: 400 });
    }

    const cleanName = String(name).trim();
    if (cleanName.length < 2 || /^(test|testing|asdf|12345|qwerty|dwadawdwa)$/i.test(cleanName)) {
      return NextResponse.json({
        success: false,
        message: 'Silakan masukkan nama lengkap yang valid.'
      }, { status: 400 });
    }

    const digitsOnly = String(whatsapp).replace(/[^0-9]/g, '');
    let cleanWa = digitsOnly;
    if (cleanWa.startsWith('0')) {
      cleanWa = '62' + cleanWa.slice(1);
    } else if (cleanWa.startsWith('8')) {
      cleanWa = '62' + cleanWa;
    }

    // Validasi nomor seluler Indonesia: wajib diawali 628 dengan panjang 11-15 digit
    if (!cleanWa.startsWith('628') || cleanWa.length < 11 || cleanWa.length > 15) {
      return NextResponse.json({
        success: false,
        message: 'Nomor WhatsApp tidak valid. Masukkan nomor HP Indonesia yang aktif diawali 08 atau +628 (contoh: 081234567890).'
      }, { status: 400 });
    }

    const newLead: LeadRecord = {
      id: 'lead_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      name: cleanName,
      whatsapp: cleanWa,
      source,
      score: typeof score === 'number' ? score : null,
      weakness: weakness || null,
      createdAt: new Date().toISOString()
    };

    // 1. In-memory deduplication
    const existingIndex = (globalThis.__kondangLeads || []).findIndex((l) => l.whatsapp === cleanWa);
    if (existingIndex >= 0) {
      globalThis.__kondangLeads![existingIndex] = {
        ...globalThis.__kondangLeads![existingIndex],
        name: cleanName,
        score: typeof score === 'number' ? score : globalThis.__kondangLeads![existingIndex].score,
        weakness: weakness || globalThis.__kondangLeads![existingIndex].weakness,
        source
      };
    } else {
      globalThis.__kondangLeads = [newLead, ...(globalThis.__kondangLeads || [])];
    }

    // 2. Simpan di MySQL jika database aktif dengan deduplikasi
    try {
      await initDatabase();
      const connection = await pool.getConnection();
      try {
        await connection.query(`
          CREATE TABLE IF NOT EXISTS leads (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            whatsapp VARCHAR(64) NOT NULL,
            source VARCHAR(64) DEFAULT 'mini_tryout',
            score INT NULL,
            weakness VARCHAR(255) NULL,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        const [existing] = await connection.query<any[]>(
          'SELECT id FROM leads WHERE whatsapp = ? ORDER BY id DESC LIMIT 1',
          [cleanWa]
        );

        if (Array.isArray(existing) && existing.length > 0) {
          const existingId = existing[0].id;
          await connection.query(
            'UPDATE leads SET name = ?, score = ?, weakness = ?, source = ?, createdAt = CURRENT_TIMESTAMP WHERE id = ?',
            [cleanName, typeof score === 'number' ? score : null, weakness || null, source, existingId]
          );
        } else {
          await connection.query(
            `INSERT INTO leads (name, whatsapp, source, score, weakness) VALUES (?, ?, ?, ?, ?)`,
            [cleanName, cleanWa, source, typeof score === 'number' ? score : null, weakness || null]
          );
        }
      } finally {
        connection.release();
      }
    } catch (dbErr) {
      // Non-fatal fallback to in-memory store
      console.warn('MySQL leads save fallback to memory:', dbErr);
    }

    return NextResponse.json({ success: true, lead: newLead });
  } catch (err) {
    console.error('Error saving lead:', err);
    return NextResponse.json({ success: false, message: 'Gagal mencatat kontak' }, { status: 500 });
  }
}

// GET: Ambil daftar leads untuk monitoring
export async function GET() {
  try {
    try {
      await initDatabase();
      const [rows] = await pool.query('SELECT * FROM leads ORDER BY createdAt DESC LIMIT 200');
      if (Array.isArray(rows) && rows.length > 0) {
        return NextResponse.json({ success: true, leads: rows });
      }
    } catch {}

    return NextResponse.json({ success: true, leads: globalThis.__kondangLeads || [] });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Gagal mengambil leads' }, { status: 500 });
  }
}
