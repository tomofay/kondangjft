'use client';

import React, { useState } from 'react';

export function SuperAdminUnifiedDashboard() {
  const [activeTab, setActiveTab] = useState<'metrics' | 'finance' | 'audit'>('metrics');
  const [settlementDate, setSettlementDate] = useState('2026-10-30');
  const [reconciliationResult, setReconciliationResult] = useState<any | null>({
    settlementDate: '2026-10-30',
    totalGrossIdr: 15400000,
    dokuFeeIdr: 462000,
    netReceivedIdr: 14938000,
    totalTransactionsCount: 32,
    reconciliationStatus: 'matched'
  });
  const [isReconciling, setIsReconciling] = useState(false);

  const metrics = {
    grossRevenueIdr: 48500000,
    totalActiveStudents: 142,
    n5GraduationRatePercent: 78.5,
    jftPassRatePercent: 84.2,
    leadConversionRatePercent: 23.8
  };

  const auditLogs = [
    {
      id: 'log_001',
      actor_email: 'admin@kondangsensei.my.id',
      ip_address: '103.28.12.44',
      action_type: 'role_change',
      target: 'usr_siswa_002',
      details: 'Menambahkan role siswa_n5 setelah verifikasi transaksi VA',
      created_at: '2026-10-30T08:30:00.000Z'
    },
    {
      id: 'log_002',
      actor_email: 'admin@kondangsensei.my.id',
      ip_address: '103.28.12.44',
      action_type: 'package_update',
      target: 'pkg_bundle_n5_jft',
      details: 'Penyesuaian diskon bundling paket kombo N5 + JFT A2',
      created_at: '2026-10-29T14:15:00.000Z'
    },
    {
      id: 'log_003',
      actor_email: 'admin@kondangsensei.my.id',
      ip_address: '103.28.12.44',
      action_type: 'role_change',
      target: 'usr_sensei_002',
      details: 'Penugasan Yamada Sensei ke Batch 2 N5',
      created_at: '2026-10-28T10:00:00.000Z'
    }
  ];

  const handleReconcile = () => {
    setIsReconciling(true);
    setTimeout(() => {
      if (settlementDate === '2026-10-25') {
        setReconciliationResult({
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
        });
      } else {
        setReconciliationResult({
          settlementDate,
          totalGrossIdr: 15400000,
          dokuFeeIdr: 462000,
          netReceivedIdr: 14938000,
          totalTransactionsCount: 32,
          reconciliationStatus: 'matched'
        });
      }
      setIsReconciling(false);
    }, 400);
  };

  return (
    <div
      style={{
        background: '#0f172a',
        color: '#f8fafc',
        minHeight: '100vh',
        padding: '32px 40px',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
      }}
    >
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>🛡️</span>
            <h1 style={{ fontSize: '22px', fontWeight: '800', margin: 0, color: '#f8fafc' }}>
              Super Admin Executive Portal
            </h1>
            <span
              style={{
                background: '#dc2626',
                color: '#ffffff',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '800'
              }}
            >
              SUPER ADMIN
            </span>
          </div>
          <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
            Ecosystem Metrics, DOKU Reconciliation, and Immutable Audit Trail
          </div>
        </div>

        {/* Tab Controls */}
        <div style={{ display: 'flex', background: '#1e293b', borderRadius: '10px', padding: '4px', gap: '4px' }}>
          {[
            { key: 'metrics', label: '📊 KPI Ekosistem' },
            { key: 'finance', label: '💳 Rekonsiliasi DOKU' },
            { key: 'audit', label: '🔒 Log Audit Keamanan' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                background: activeTab === tab.key ? '#2563eb' : 'transparent',
                color: activeTab === tab.key ? '#ffffff' : '#94a3b8',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Ecosystem KPI Overview */}
      {activeTab === 'metrics' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '32px' }}>
            <div style={{ background: '#1e293b', padding: '20px', borderRadius: '14px', border: '1px solid #334155' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Total Pendapatan (Gross)</div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: '#38bdf8' }}>
                Rp {(metrics.grossRevenueIdr / 1000000).toFixed(1)} Jt
              </div>
              <div style={{ fontSize: '11px', color: '#10b981', marginTop: '4px' }}>↑ +14.2% bln ini</div>
            </div>

            <div style={{ background: '#1e293b', padding: '20px', borderRadius: '14px', border: '1px solid #334155' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Siswa Aktif Terdaftar</div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: '#38bdf8' }}>
                {metrics.totalActiveStudents}
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>N5 LMS & CBT JFT</div>
            </div>

            <div style={{ background: '#1e293b', padding: '20px', borderRadius: '14px', border: '1px solid #334155' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Tingkat Lulus N5</div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: '#34d399' }}>
                {metrics.n5GraduationRatePercent}%
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>25 Bab Selesai</div>
            </div>

            <div style={{ background: '#1e293b', padding: '20px', borderRadius: '14px', border: '1px solid #334155' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Kelulusan CBT JFT A2</div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: '#34d399' }}>
                {metrics.jftPassRatePercent}%
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Skor ≥ 200 Poin</div>
            </div>

            <div style={{ background: '#1e293b', padding: '20px', borderRadius: '14px', border: '1px solid #334155' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Konversi Lead Magnet</div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: '#f59e0b' }}>
                {metrics.leadConversionRatePercent}%
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Mini Tryout → Berbayar</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: DOKU Reconciliation */}
      {activeTab === 'finance' && (
        <div style={{ background: '#1e293b', borderRadius: '16px', border: '1px solid #334155', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '700' }}>Rekonsiliasi Transaksi Settlement DOKU</div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                Mencocokkan penerimaan lokal sistem dengan laporan penyelesaian DOKU Payment Gateway
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="date"
                value={settlementDate}
                onChange={(e) => setSettlementDate(e.target.value)}
                style={{
                  background: '#0f172a',
                  border: '1px solid #475569',
                  color: '#f8fafc',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '13px'
                }}
              />
              <button
                onClick={handleReconcile}
                disabled={isReconciling}
                style={{
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 18px',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                {isReconciling ? 'Memverifikasi...' : 'Cocokkan Settlement'}
              </button>
            </div>
          </div>

          {reconciliationResult && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
                <div style={{ background: '#0f172a', padding: '16px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>Gross Settlement DOKU</div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: '#f8fafc' }}>
                    Rp {reconciliationResult.totalGrossIdr.toLocaleString('id-ID')}
                  </div>
                </div>

                <div style={{ background: '#0f172a', padding: '16px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>MDR & Fee Transaksi DOKU</div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: '#f87171' }}>
                    - Rp {reconciliationResult.dokuFeeIdr.toLocaleString('id-ID')}
                  </div>
                </div>

                <div style={{ background: '#0f172a', padding: '16px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>Net Diterima Rekening</div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: '#34d399' }}>
                    Rp {reconciliationResult.netReceivedIdr.toLocaleString('id-ID')}
                  </div>
                </div>

                <div style={{ background: '#0f172a', padding: '16px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>Status Rekonsiliasi</div>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: '800',
                      color: reconciliationResult.reconciliationStatus === 'matched' ? '#34d399' : '#f87171',
                      marginTop: '4px'
                    }}
                  >
                    {reconciliationResult.reconciliationStatus === 'matched'
                      ? '✓ MATCHED (Cocok 100%)'
                      : '⚠️ DISCREPANCY (Selisih)'}
                  </div>
                </div>
              </div>

              {reconciliationResult.reconciliationStatus === 'discrepancy' && (
                <div
                  style={{
                    background: '#450a0a',
                    border: '1px solid #ef4444',
                    borderRadius: '10px',
                    padding: '16px',
                    color: '#fecaca',
                    fontSize: '13px'
                  }}
                >
                  <div style={{ fontWeight: '700', marginBottom: '4px' }}>
                    Ditemukan Selisih Pembayaran Tanggal {reconciliationResult.settlementDate}:
                  </div>
                  <div>
                    Database Lokal: Rp {reconciliationResult.discrepancyDetails?.localDbGross.toLocaleString('id-ID')} vs DOKU Settlement: Rp {reconciliationResult.discrepancyDetails?.dokuReportedGross.toLocaleString('id-ID')}.
                  </div>
                  <div>Invoice belum cocok: {reconciliationResult.discrepancyDetails?.unmatchedInvoices?.join(', ')}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Immutable Audit Logs */}
      {activeTab === 'audit' && (
        <div style={{ background: '#1e293b', borderRadius: '16px', border: '1px solid #334155', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '700' }}>Log Audit Aktivitas Sistem & Keamanan</div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                Seluruh aktivitas Super Admin dan Sensei dicatat secara permanen (Immutable Audit Trail)
              </div>
            </div>

            <span
              style={{
                background: '#065f46',
                color: '#a7f3d0',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '700'
              }}
            >
              🔒 IMMUTABLE (DELETE PROTECTED)
            </span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8', textAlign: 'left' }}>
                <th style={{ padding: '12px 8px' }}>Waktu</th>
                <th style={{ padding: '12px 8px' }}>Aktor</th>
                <th style={{ padding: '12px 8px' }}>IP Address</th>
                <th style={{ padding: '12px 8px' }}>Tipe Aksi</th>
                <th style={{ padding: '12px 8px' }}>Rincian Perubahan</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '12px 8px', color: '#94a3b8', fontFamily: 'monospace' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 8px', fontWeight: '600' }}>{log.actor_email}</td>
                  <td style={{ padding: '12px 8px', color: '#38bdf8', fontFamily: 'monospace' }}>{log.ip_address}</td>
                  <td style={{ padding: '12px 8px' }}>
                    <span
                      style={{
                        background: '#0f172a',
                        border: '1px solid #334155',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px'
                      }}
                    >
                      {log.action_type}
                    </span>
                  </td>
                  <td style={{ padding: '12px 8px', color: '#cbd5e1' }}>{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
export default SuperAdminUnifiedDashboard;
