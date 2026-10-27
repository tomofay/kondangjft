import { NextResponse } from 'next/server';
import { getStore, calculateVoucherDiscount } from '@/lib/dataStore';
import { pool, initDatabase } from '@/lib/db';
import { Voucher, TryoutPackage } from '@/types';
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

export async function POST(request: Request) {
  try {
    await initDatabase();
    const { code, packageId, userId } = await request.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Kode voucher wajib diisi.' },
        { status: 400 }
      );
    }

    if (!packageId) {
      return NextResponse.json(
        { success: false, message: 'Paket langganan wajib dipilih.' },
        { status: 400 }
      );
    }

    const store = getStore();
    const cleanCode = code.trim().toUpperCase();

    // Find package to get price
    const pkg = store.packages.find((p: TryoutPackage) => p.id === packageId);
    if (!pkg) {
      return NextResponse.json(
        { success: false, message: 'Paket yang dipilih tidak ditemukan.' },
        { status: 404 }
      );
    }

    let voucher: Voucher | null = null;

    // 1. Try to fetch voucher from MySQL
    try {
      const [rows] = await pool.query<VoucherRow[]>(
        'SELECT * FROM vouchers WHERE UPPER(code) = ? LIMIT 1',
        [cleanCode]
      );
      if (rows && rows.length > 0) {
        const row = rows[0];
        let validPkgs: string[] = [];
        if (row.validPackages) {
          try {
            validPkgs = typeof row.validPackages === 'string' ? JSON.parse(row.validPackages) : row.validPackages;
          } catch {}
        }

        voucher = {
          id: row.id,
          code: row.code,
          discountType: row.discountType,
          discountValue: Number(row.discountValue),
          maxDiscountAmount: row.maxDiscountAmount !== null ? Number(row.maxDiscountAmount) : null,
          minPurchaseAmount: Number(row.minPurchaseAmount || 0),
          usageLimit: row.usageLimit !== null ? Number(row.usageLimit) : null,
          usedCount: Number(row.usedCount || 0),
          validPackages: validPkgs,
          startDate: row.startDate,
          expiredAt: row.expiredAt,
          isActive: Boolean(row.isActive),
          description: row.description || undefined
        };
      }
    } catch (dbErr) {
      console.warn('MySQL voucher lookup warning:', dbErr);
    }

    // Fallback to memory store if not found in MySQL
    if (!voucher) {
      const memVoucher = store.vouchers.find((v: Voucher) => v.code.toUpperCase() === cleanCode);
      if (memVoucher) {
        voucher = { ...memVoucher };
      }
    }

    if (!voucher) {
      return NextResponse.json(
        { success: false, message: `Kode voucher "${cleanCode}" tidak ditemukan atau salah.` },
        { status: 404 }
      );
    }

    // Calculate discount & validity
    const result = calculateVoucherDiscount(voucher, pkg.price, pkg.id);

    if (!result.isValid) {
      return NextResponse.json(
        { success: false, message: result.reason || 'Kode voucher tidak dapat digunakan.' },
        { status: 400 }
      );
    }

    const discountLabel = voucher.discountType === 'PERCENTAGE'
      ? `${voucher.discountValue}% (Hemat Rp ${result.discountAmount.toLocaleString('id-ID')})`
      : `Rp ${result.discountAmount.toLocaleString('id-ID')}`;

    return NextResponse.json({
      success: true,
      valid: true,
      voucher: {
        id: voucher.id,
        code: voucher.code,
        discountType: voucher.discountType,
        discountValue: voucher.discountValue,
        maxDiscountAmount: voucher.maxDiscountAmount,
        description: voucher.description
      },
      originalPrice: pkg.price,
      discountAmount: result.discountAmount,
      finalPrice: result.finalPrice,
      isFree: result.finalPrice === 0,
      message: `Voucher ${voucher.code} berhasil digunakan! Potongan ${discountLabel}.`
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
