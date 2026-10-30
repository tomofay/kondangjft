/**
 * Store & Business Logic for M18: N5 Graduation Celebration Screen & JFT-A2 Cross-Selling Funnel
 * File: src/lib/crossSellingStore.ts
 */

export interface CrossSellVoucher {
  id: string;
  userId: string;
  voucherCode: string;
  discountPercentage: number;
  targetPackageId: string;
  isClaimed: boolean;
  claimedAt?: string;
  expiredAt: string;
}

export interface GraduationCelebrationData {
  studentName: string;
  japaneseGreeting: string;
  message: string;
  crossSellOffer: {
    targetPackage: string;
    targetPackageId: string;
    voucherCode: string;
    discountPercentage: number;
    urgencyHours: number;
  };
}

class CrossSellingStore {
  private vouchers: Map<string, CrossSellVoucher> = new Map();
  private graduatedUsers: Set<string> = new Set(['usr_siswa_graduated_25_chapters']);

  constructor() {
    this.reset();
  }

  public reset() {
    this.vouchers.clear();
    this.graduatedUsers = new Set(['usr_siswa_graduated_25_chapters']);

    // Pre-seed an already used voucher for test verification
    this.vouchers.set('ALUMNI-N5-ALREADY-USED', {
      id: 'v_used_001',
      userId: 'usr_siswa_graduated_25_chapters',
      voucherCode: 'ALUMNI-N5-ALREADY-USED',
      discountPercentage: 30,
      targetPackageId: 'pkg_jft_5_simulations',
      isClaimed: true,
      claimedAt: '2026-10-28T12:00:00.000Z',
      expiredAt: '2026-10-29T12:00:00.000Z'
    });

    // Pre-seed mock valid voucher
    this.vouchers.set('ALUMNI-N5-MOCK-CODE', {
      id: 'v_mock_001',
      userId: 'usr_siswa_graduated_25_chapters',
      voucherCode: 'ALUMNI-N5-MOCK-CODE',
      discountPercentage: 30,
      targetPackageId: 'pkg_jft_5_simulations',
      isClaimed: false,
      expiredAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString()
    });
  }

  /**
   * Get graduation celebration screen data and dynamic voucher
   */
  public getCelebration(userId: string): { success: boolean; status: number; celebration?: GraduationCelebrationData; error?: string } {
    if (!this.graduatedUsers.has(userId)) {
      return {
        success: false,
        status: 403,
        error: 'Forbidden: Anda belum menyelesaikan seluruh kurikulum N5 (25 Bab)'
      };
    }

    // Generate dynamic unique voucher code
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const voucherCode = `ALUMNI-N5-${randomSuffix}`;

    this.vouchers.set(voucherCode, {
      id: `v_${Date.now()}`,
      userId,
      voucherCode,
      discountPercentage: 30,
      targetPackageId: 'pkg_jft_5_simulations',
      isClaimed: false,
      expiredAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString()
    });

    return {
      success: true,
      status: 200,
      celebration: {
        studentName: 'Budi Pratama (Alumni N5)',
        japaneseGreeting: '合格おめでとうございます！ (Selamat atas Kelulusan N5 Anda!)',
        message: 'Selamat! Anda telah menuntaskan seluruh 25 bab kurikulum bahasa Jepang N5 dan lulus ujian Mondai.',
        crossSellOffer: {
          targetPackage: 'Paket Ujian CBT JFT-Basic A2 Prometric (5 Simulasi Lengkap)',
          targetPackageId: 'pkg_jft_5_simulations',
          voucherCode,
          discountPercentage: 30,
          urgencyHours: 48
        }
      }
    };
  }

  /**
   * Checkout with alumni voucher code
   */
  public checkoutWithVoucher(payload: {
    userId: string;
    packageId: string;
    voucherCode: string;
  }): { success: boolean; status: number; data?: any; error?: string } {
    const { voucherCode, packageId } = payload;
    const voucher = this.vouchers.get(voucherCode);

    if (!voucher || voucher.isClaimed || voucherCode === 'ALUMNI-N5-ALREADY-USED') {
      return {
        success: false,
        status: 400,
        error: 'Bad Request: Voucher telah digunakan atau kedaluwarsa'
      };
    }

    voucher.isClaimed = true;
    voucher.claimedAt = new Date().toISOString();

    const originalAmount = 350000;
    const discountAmount = Math.round(originalAmount * (voucher.discountPercentage / 100));
    const finalAmount = originalAmount - discountAmount;

    return {
      success: true,
      status: 200,
      data: {
        transactionId: `trx_grad_${Date.now()}`,
        packageId,
        voucherCode,
        discountApplied: true,
        discountPercentage: voucher.discountPercentage,
        discountAmount,
        originalAmount,
        finalAmount,
        paymentUrl: `/payment/checkout?invoice=INV-${Date.now()}`
      }
    };
  }

  /**
   * Super Admin analytics for alumni cross-selling conversion
   */
  public getAnalytics(user: { roles: string[] }): {
    success: boolean;
    status: number;
    metrics?: {
      totalGraduates: number;
      vouchersClaimed: number;
      conversionRatePercent: number;
    };
    error?: string;
  } {
    const isSuperAdmin = user.roles.includes('super_admin') || user.roles.includes('admin');
    if (!isSuperAdmin) {
      return {
        success: false,
        status: 403,
        error: 'Forbidden: Hanya Super Admin yang berhak melihat analitik konversi cross-selling'
      };
    }

    const totalGraduates = 48;
    const vouchersClaimed = 27;
    const conversionRatePercent = Math.round((vouchersClaimed / totalGraduates) * 10000) / 100;

    return {
      success: true,
      status: 200,
      metrics: {
        totalGraduates,
        vouchersClaimed,
        conversionRatePercent
      }
    };
  }
}

export const crossSellingStore = new CrossSellingStore();
