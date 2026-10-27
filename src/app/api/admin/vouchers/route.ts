import { NextResponse } from 'next/server';
import { getStore } from '@/lib/dataStore';
import { pool, initDatabase } from '@/lib/db';
import { Voucher } from '@/types';
import { RowDataPacket } from 'mysql2';

interface VoucherRow extends RowDataPacket {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  maxDiscountAmount: number | null;
  minPurchaseAmount: number;
  usageLimit: number | null;
  usedCount: number;
  validPackages: string | string[] | null;
  startDate: string | null;
  expiredAt: string | null;
  isActive: number | boolean;
  description: string | null;
  createdAt: string;
}

// GET /api/admin/vouchers - Mengambil seluruh data kode voucher
export async function GET() {
  try {
    await initDatabase();
    const store = getStore();

    let dbVouchers: Voucher[] = [];
    try {
      const [rows] = await pool.query<VoucherRow[]>(
        'SELECT * FROM vouchers ORDER BY createdAt DESC'
      );
      if (rows && rows.length > 0) {
        dbVouchers = rows.map((r) => {
          let validPkgs: string[] = [];
          if (r.validPackages) {
            try {
              validPkgs = typeof r.validPackages === 'string' ? JSON.parse(r.validPackages) : r.validPackages;
            } catch {}
          }

          return {
            id: r.id,
            code: r.code,
            discountType: r.discountType,
            discountValue: Number(r.discountValue),
            maxDiscountAmount: r.maxDiscountAmount !== null ? Number(r.maxDiscountAmount) : null,
            minPurchaseAmount: Number(r.minPurchaseAmount || 0),
            usageLimit: r.usageLimit !== null ? Number(r.usageLimit) : null,
            usedCount: Number(r.usedCount || 0),
            validPackages: validPkgs,
            startDate: r.startDate,
            expiredAt: r.expiredAt,
            isActive: Boolean(r.isActive),
            description: r.description || undefined,
            createdAt: r.createdAt
          };
        });

        // Sync to memory store
        store.vouchers = [...dbVouchers];
      }
    } catch (err) {
      console.warn('MySQL vouchers fetch warning, fallback to memory store:', err);
    }

    const finalVouchers = dbVouchers.length > 0 ? dbVouchers : store.vouchers;

    return NextResponse.json({
      success: true,
      vouchers: finalVouchers
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

// POST /api/admin/vouchers - Operasi CRUD (Create, Update, Toggle, Delete)
export async function POST(request: Request) {
  try {
    await initDatabase();
    const body = await request.json();
    const { action = 'create' } = body;
    const store = getStore();

    // 1. DELETE ACTION
    if (action === 'delete') {
      const { id } = body;
      if (!id) {
        return NextResponse.json({ success: false, message: 'ID voucher wajib diisi.' }, { status: 400 });
      }

      try {
        await pool.query('DELETE FROM vouchers WHERE id = ?', [id]);
      } catch (dbErr) {
        console.warn('MySQL delete voucher warning:', dbErr);
      }

      store.vouchers = store.vouchers.filter((v: Voucher) => v.id !== id);

      return NextResponse.json({
        success: true,
        message: 'Voucher berhasil dihapus.',
        vouchers: store.vouchers
      });
    }

    // 2. TOGGLE ACTIVE ACTION
    if (action === 'toggle') {
      const { id } = body;
      const voucher = store.vouchers.find((v: Voucher) => v.id === id);
      if (!voucher) {
        return NextResponse.json({ success: false, message: 'Voucher tidak ditemukan.' }, { status: 404 });
      }

      const newStatus = !voucher.isActive;
      voucher.isActive = newStatus;

      try {
        await pool.query('UPDATE vouchers SET isActive = ? WHERE id = ?', [newStatus ? 1 : 0, id]);
      } catch (dbErr) {
        console.warn('MySQL toggle voucher warning:', dbErr);
      }

      return NextResponse.json({
        success: true,
        message: `Voucher ${voucher.code} berhasil di-${newStatus ? 'aktifkan' : 'nonaktifkan'}.`,
        voucher
      });
    }

    // 3. CREATE OR UPDATE ACTION
    const {
      id,
      code,
      discountType = 'PERCENTAGE',
      discountValue,
      maxDiscountAmount,
      minPurchaseAmount = 0,
      usageLimit,
      validPackages = [],
      startDate,
      expiredAt,
      isActive = true,
      description
    } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ success: false, message: 'Kode voucher wajib diisi.' }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (!cleanCode) {
      return NextResponse.json({ success: false, message: 'Format kode voucher tidak valid.' }, { status: 400 });
    }

    const numValue = Number(discountValue);
    if (isNaN(numValue) || numValue <= 0) {
      return NextResponse.json({ success: false, message: 'Nilai diskon harus berupa angka lebih dari 0.' }, { status: 400 });
    }

    if (discountType === 'PERCENTAGE' && numValue > 100) {
      return NextResponse.json({ success: false, message: 'Diskon persentase tidak boleh melebihi 100%.' }, { status: 400 });
    }

    const isUpdate = action === 'update' && id;
    const voucherId = isUpdate ? id : `v_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Check duplicate code if creating or changing code
    const existingSameCode = store.vouchers.find(
      (v: Voucher) => v.code.toUpperCase() === cleanCode && v.id !== voucherId
    );
    if (existingSameCode) {
      return NextResponse.json(
        { success: false, message: `Kode voucher "${cleanCode}" sudah digunakan. Silakan gunakan kode unik lain.` },
        { status: 400 }
      );
    }

    const maxDisc = maxDiscountAmount ? Number(maxDiscountAmount) : null;
    const minPurch = Number(minPurchaseAmount || 0);
    const limit = usageLimit ? Number(usageLimit) : null;
    const pkgsJson = Array.isArray(validPackages) && validPackages.length > 0 ? JSON.stringify(validPackages) : null;

    const newVoucher: Voucher = {
      id: voucherId,
      code: cleanCode,
      discountType: discountType as 'PERCENTAGE' | 'FIXED',
      discountValue: numValue,
      maxDiscountAmount: maxDisc,
      minPurchaseAmount: minPurch,
      usageLimit: limit,
      usedCount: isUpdate ? (store.vouchers.find((v) => v.id === voucherId)?.usedCount || 0) : 0,
      validPackages: Array.isArray(validPackages) ? validPackages : [],
      startDate: startDate || null,
      expiredAt: expiredAt || null,
      isActive: Boolean(isActive),
      description: description?.trim() || undefined,
      createdAt: isUpdate ? (store.vouchers.find((v) => v.id === voucherId)?.createdAt || new Date().toISOString()) : new Date().toISOString()
    };

    // Update in MySQL
    try {
      await pool.query(
        `INSERT INTO vouchers (id, code, discountType, discountValue, maxDiscountAmount, minPurchaseAmount, usageLimit, usedCount, validPackages, startDate, expiredAt, isActive, description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           code = VALUES(code),
           discountType = VALUES(discountType),
           discountValue = VALUES(discountValue),
           maxDiscountAmount = VALUES(maxDiscountAmount),
           minPurchaseAmount = VALUES(minPurchaseAmount),
           usageLimit = VALUES(usageLimit),
           validPackages = VALUES(validPackages),
           startDate = VALUES(startDate),
           expiredAt = VALUES(expiredAt),
           isActive = VALUES(isActive),
           description = VALUES(description)`,
        [
          newVoucher.id,
          newVoucher.code,
          newVoucher.discountType,
          newVoucher.discountValue,
          newVoucher.maxDiscountAmount,
          newVoucher.minPurchaseAmount,
          newVoucher.usageLimit,
          newVoucher.usedCount,
          pkgsJson,
          newVoucher.startDate,
          newVoucher.expiredAt,
          newVoucher.isActive ? 1 : 0,
          newVoucher.description || null
        ]
      );
    } catch (dbErr) {
      console.warn('MySQL upsert voucher warning:', dbErr);
    }

    // Update in memory store
    const idx = store.vouchers.findIndex((v: Voucher) => v.id === voucherId);
    if (idx !== -1) {
      store.vouchers[idx] = newVoucher;
    } else {
      store.vouchers.unshift(newVoucher);
    }

    return NextResponse.json({
      success: true,
      message: isUpdate ? `Voucher ${newVoucher.code} berhasil diperbarui.` : `Voucher ${newVoucher.code} berhasil dibuat.`,
      voucher: newVoucher,
      vouchers: store.vouchers
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
