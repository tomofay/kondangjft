import { assignUserRole } from './rbac';

export interface PackageRecord {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  isBundle?: boolean;
  isActive: boolean;
  durationDays?: number;
  cbtQuota?: number;
}

export interface TransactionRecord {
  id: string;
  invoiceNumber: string;
  userId: string;
  packageId: string;
  packageName: string;
  amount: number;
  paymentMethod: string;
  dokuTransId?: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'expired';
  paidAt?: string;
  createdAt: string;
  expiredAt: string;
}

export interface UserEntitlement {
  id: string;
  userId: string;
  module: 'lms_n5' | 'cbt_jft';
  cbtQuotaRemaining: number;
  validUntil: string;
  transactionId: string;
}

// 1. Initial Packages Catalog
export const PACKAGES_CATALOG: PackageRecord[] = [
  {
    id: 'pkg_bundle_n5_jft',
    name: 'Paket Bundling Bimbel N5 + Simulasi JFT-Basic A2',
    slug: 'bundling-n5-jft',
    description: 'Akses penuh kelas interaktif N5 dan 5x sesi ujian CBT JFT-Basic A2',
    price: 150000,
    originalPrice: 250000,
    isBundle: true,
    isActive: true,
    durationDays: 90,
    cbtQuota: 5
  },
  {
    id: 'pkg_jft_5_simulations',
    name: 'Paket 5x Simulasi JFT-Basic A2',
    slug: '5x-simulasi-jft-a2',
    description: 'Akses 5 kali simulasi Prometric lengkap dengan Chōkai audio player',
    price: 50000,
    originalPrice: 85000,
    isBundle: false,
    isActive: true,
    durationDays: 30,
    cbtQuota: 5
  },
  {
    id: 'pkg_7d',
    name: 'Paket SKS 7 Hari Tryout JFT',
    slug: 'tryout-7d',
    description: 'Akses tryout unlimited selama 7 hari',
    price: 35000,
    isBundle: false,
    isActive: true,
    durationDays: 7,
    cbtQuota: 99
  },
  {
    id: 'pkg_14d',
    name: 'Paket Ideal 14 Hari Tryout JFT',
    slug: 'tryout-14d',
    description: 'Akses tryout unlimited selama 14 hari',
    price: 59000,
    isBundle: false,
    isActive: true,
    durationDays: 14,
    cbtQuota: 99
  }
];

// 2. In-Memory Stores
const transactionsStore: Map<string, TransactionRecord> = new Map([
  [
    'INV-20261030-ALREADY-PAID',
    {
      id: 'tx_seed_paid',
      invoiceNumber: 'INV-20261030-ALREADY-PAID',
      userId: 'usr_siswa_001',
      packageId: 'pkg_7d',
      packageName: 'Paket SKS 7 Hari Tryout JFT',
      amount: 35000,
      paymentMethod: 'QRIS',
      paymentStatus: 'paid',
      paidAt: new Date(Date.now() - 3600000).toISOString(),
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      expiredAt: new Date(Date.now() + 86400000).toISOString()
    }
  ],
  [
    'INV-20261030-9901',
    {
      id: 'tx_seed_9901',
      invoiceNumber: 'INV-20261030-9901',
      userId: 'usr_siswa_001',
      packageId: 'pkg_bundle_n5_jft',
      packageName: 'Paket Bundling Bimbel N5 + Simulasi JFT-Basic A2',
      amount: 150000,
      paymentMethod: 'QRIS',
      paymentStatus: 'pending',
      createdAt: new Date().toISOString(),
      expiredAt: new Date(Date.now() + 86400000).toISOString()
    }
  ]
]);

const entitlementsStore: Map<string, UserEntitlement[]> = new Map();

export function getPackageById(packageId: string): PackageRecord | null {
  return PACKAGES_CATALOG.find((p) => p.id === packageId && p.isActive) || null;
}

export function createCheckoutTransaction(userId: string, packageId: string, paymentMethod = 'QRIS') {
  const pkg = getPackageById(packageId);
  if (!pkg) {
    return { success: false, error: 'Paket tidak ditemukan atau sudah tidak aktif' };
  }

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const invoiceNumber = `INV-${dateStr}-${randomSuffix}`;

  const transaction: TransactionRecord = {
    id: `tx_${Date.now()}`,
    invoiceNumber,
    userId,
    packageId: pkg.id,
    packageName: pkg.name,
    amount: pkg.price,
    paymentMethod,
    paymentStatus: 'pending',
    createdAt: new Date().toISOString(),
    expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  };

  transactionsStore.set(invoiceNumber, transaction);

  const paymentUrl = `https://checkout.doku.com/orders/v1/checkout/${invoiceNumber}`;

  return {
    success: true,
    data: {
      invoiceNumber,
      paymentUrl,
      amount: pkg.price,
      packageName: pkg.name,
      expiredAt: transaction.expiredAt
    }
  };
}

export function getTransactionByInvoice(invoiceNumber: string): TransactionRecord | null {
  return transactionsStore.get(invoiceNumber) || null;
}

export function getAllTransactions(): TransactionRecord[] {
  return Array.from(transactionsStore.values());
}

export function getUserTransactions(userId: string): TransactionRecord[] {
  return Array.from(transactionsStore.values()).filter((t) => t.userId === userId);
}

/**
 * Entitlement Provisioning Service:
 * Automatically assigns user roles (siswa_n5, peserta_jft, or both) and credits entitlements
 */
export function provisionEntitlementsForPaidInvoice(invoiceNumber: string, dokuTransId?: string) {
  const transaction = transactionsStore.get(invoiceNumber);
  if (!transaction) {
    return { success: false, error: 'Transaction not found' };
  }

  if (transaction.paymentStatus === 'paid') {
    return { success: true, alreadyProcessed: true };
  }

  // Update transaction status
  transaction.paymentStatus = 'paid';
  transaction.paidAt = new Date().toISOString();
  transaction.dokuTransId = dokuTransId || 'DOKU_TRANS_AUTO';

  const pkg = PACKAGES_CATALOG.find((p) => p.id === transaction.packageId);
  const userId = transaction.userId;

  const userEnts = entitlementsStore.get(userId) || [];

  if (pkg?.isBundle || transaction.packageId === 'pkg_bundle_n5_jft') {
    // 1. Grant dual roles
    assignUserRole(userId, 'siswa_n5');
    assignUserRole(userId, 'peserta_jft');

    // 2. Grant dual entitlements
    userEnts.push({
      id: `ent_${Date.now()}_1`,
      userId,
      module: 'lms_n5',
      cbtQuotaRemaining: 0,
      validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      transactionId: transaction.id
    });
    userEnts.push({
      id: `ent_${Date.now()}_2`,
      userId,
      module: 'cbt_jft',
      cbtQuotaRemaining: 5,
      validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      transactionId: transaction.id
    });
  } else if (transaction.packageId.includes('jft')) {
    assignUserRole(userId, 'peserta_jft');
    userEnts.push({
      id: `ent_${Date.now()}_jft`,
      userId,
      module: 'cbt_jft',
      cbtQuotaRemaining: pkg?.cbtQuota || 5,
      validUntil: new Date(Date.now() + (pkg?.durationDays || 30) * 24 * 60 * 60 * 1000).toISOString(),
      transactionId: transaction.id
    });
  } else {
    assignUserRole(userId, 'siswa_n5');
    userEnts.push({
      id: `ent_${Date.now()}_n5`,
      userId,
      module: 'lms_n5',
      cbtQuotaRemaining: 0,
      validUntil: new Date(Date.now() + (pkg?.durationDays || 30) * 24 * 60 * 60 * 1000).toISOString(),
      transactionId: transaction.id
    });
  }

  entitlementsStore.set(userId, userEnts);

  return { success: true, alreadyProcessed: false, entitlements: userEnts };
}

export function getUserEntitlements(userId: string): UserEntitlement[] {
  return entitlementsStore.get(userId) || [];
}
