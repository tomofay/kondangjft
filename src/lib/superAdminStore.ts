/**
 * Store & Business Logic for M19: Super Admin Dashboard, Financial Reconciliation, & Ecosystem Audit Logs
 * File: src/lib/superAdminStore.ts
 */

export interface EcosystemMetrics {
  grossRevenueIdr: number;
  totalActiveStudents: number;
  n5GraduationRatePercent: number;
  jftPassRatePercent: number;
  leadConversionRatePercent: number;
}

export interface SettlementRecord {
  settlementDate: string;
  totalGrossIdr: number;
  dokuFeeIdr: number;
  netReceivedIdr: number;
  totalTransactionsCount?: number;
  reconciliationStatus: 'matched' | 'discrepancy' | 'pending';
  discrepancyDetails?: any;
}

export interface AuditLogEntry {
  id: string;
  actor_user_id: string;
  actor_email: string;
  ip_address: string;
  action_type: string;
  target_resource_id: string;
  details_json: Record<string, any>;
  created_at: string;
}

const initialAuditLogs: AuditLogEntry[] = [
  {
    id: 'log_001',
    actor_user_id: 'usr_super_admin_001',
    actor_email: 'admin@kondangsensei.my.id',
    ip_address: '103.28.12.44',
    action_type: 'role_change',
    target_resource_id: 'usr_siswa_002',
    details_json: {
      action: 'assign_role',
      addedRoles: ['siswa_n5'],
      reason: 'Manual payment verification for Batch 2'
    },
    created_at: '2026-10-30T08:30:00.000Z'
  },
  {
    id: 'log_002',
    actor_user_id: 'usr_super_admin_001',
    actor_email: 'admin@kondangsensei.my.id',
    ip_address: '103.28.12.44',
    action_type: 'package_update',
    target_resource_id: 'pkg_bundle_n5_jft',
    details_json: {
      action: 'price_adjustment',
      oldPrice: 1250000,
      newPrice: 1100000
    },
    created_at: '2026-10-29T14:15:00.000Z'
  },
  {
    id: 'log_003',
    actor_user_id: 'usr_super_admin_001',
    actor_email: 'admin@kondangsensei.my.id',
    ip_address: '103.28.12.44',
    action_type: 'role_change',
    target_resource_id: 'usr_sensei_002',
    details_json: {
      action: 'assign_class',
      assignedClassId: 'cls_batch2_n5'
    },
    created_at: '2026-10-28T10:00:00.000Z'
  }
];

class SuperAdminStore {
  private auditLogs: AuditLogEntry[] = [];

  constructor() {
    this.reset();
  }

  public reset() {
    this.auditLogs = initialAuditLogs.map((log) => ({ ...log }));
  }

  /**
   * Get executive KPI overview
   */
  public getOverviewMetrics(user?: { roles: string[] }): {
    success: boolean;
    status: number;
    data?: EcosystemMetrics;
    error?: string;
  } {
    if (!user) {
      return { success: false, status: 401, error: 'Unauthorized: Autentikasi diperlukan' };
    }

    const isSuperAdmin = user.roles.includes('super_admin') || user.roles.includes('admin');
    if (!isSuperAdmin) {
      return { success: false, status: 403, error: 'Forbidden: Hanya Super Admin yang berhak mengakses ringkasan metrik ekosistem' };
    }

    return {
      success: true,
      status: 200,
      data: {
        grossRevenueIdr: 48500000,
        totalActiveStudents: 142,
        n5GraduationRatePercent: 78.5,
        jftPassRatePercent: 84.2,
        leadConversionRatePercent: 23.8
      }
    };
  }

  /**
   * Reconcile DOKU financial settlement
   */
  public reconcileDoku(
    user?: { roles: string[] },
    settlementDate = '2026-10-30'
  ): {
    success: boolean;
    status: number;
    settlement?: SettlementRecord;
    error?: string;
  } {
    if (!user) {
      return { success: false, status: 401, error: 'Unauthorized: Autentikasi diperlukan' };
    }

    const isSuperAdmin = user.roles.includes('super_admin') || user.roles.includes('admin');
    if (!isSuperAdmin) {
      return { success: false, status: 403, error: 'Forbidden: Hanya Super Admin yang berhak memicu rekonsiliasi finansial DOKU' };
    }

    // Mock settlement mismatch on 2026-10-25
    if (settlementDate === '2026-10-25') {
      return {
        success: true,
        status: 200,
        settlement: {
          settlementDate: '2026-10-25',
          totalGrossIdr: 12500000,
          dokuFeeIdr: 375000,
          netReceivedIdr: 12125000,
          totalTransactionsCount: 25,
          reconciliationStatus: 'discrepancy',
          discrepancyDetails: {
            localDbGross: 13000000,
            dokuReportedGross: 12500000,
            differenceIdr: 500000,
            unmatchedInvoices: ['INV-20261025-004']
          }
        }
      };
    }

    // Default matched settlement
    return {
      success: true,
      status: 200,
      settlement: {
        settlementDate,
        totalGrossIdr: 15400000,
        dokuFeeIdr: 462000,
        netReceivedIdr: 14938000,
        totalTransactionsCount: 32,
        reconciliationStatus: 'matched'
      }
    };
  }

  /**
   * Query immutable security audit logs
   */
  public getAuditLogs(
    user?: { roles: string[] },
    filter?: { actionType?: string; limit?: number }
  ): {
    success: boolean;
    status: number;
    logs?: AuditLogEntry[];
    error?: string;
  } {
    if (!user) {
      return { success: false, status: 401, error: 'Unauthorized: Autentikasi diperlukan' };
    }

    const isSuperAdmin = user.roles.includes('super_admin') || user.roles.includes('admin');
    if (!isSuperAdmin) {
      return { success: false, status: 403, error: 'Forbidden: Hanya Super Admin yang berhak membaca audit logs' };
    }

    let result = [...this.auditLogs];
    if (filter?.actionType) {
      result = result.filter((log) => log.action_type === filter.actionType);
    }
    if (filter?.limit) {
      result = result.slice(0, filter.limit);
    }

    return {
      success: true,
      status: 200,
      logs: result
    };
  }

  /**
   * Reject deletion of audit logs (Immutable audit trail protection)
   */
  public deleteAuditLog(): {
    success: boolean;
    status: number;
    error: string;
  } {
    return {
      success: false,
      status: 405,
      error: 'Method Not Allowed: Audit logs are immutable and cannot be deleted to preserve compliance trail.'
    };
  }
}

export const superAdminStore = new SuperAdminStore();
