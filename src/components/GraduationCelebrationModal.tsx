'use client';

import React, { useState, useEffect } from 'react';

interface GraduationCelebrationModalProps {
  studentName?: string;
  voucherCode?: string;
  discountPercentage?: number;
  onProceedToCheckout?: (voucherCode: string) => void;
  onClose?: () => void;
}

export function GraduationCelebrationModal({
  studentName = 'Budi Pratama',
  voucherCode = 'ALUMNI-N5-89X2K',
  discountPercentage = 30,
  onProceedToCheckout,
  onClose
}: GraduationCelebrationModalProps) {
  const [copied, setCopied] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(48 * 3600); // 48 hours

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatHours = (totalSecs: number) => {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(voucherCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.92)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          borderRadius: '24px',
          border: '1px solid #334155',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(56, 189, 248, 0.2)',
          width: '640px',
          maxWidth: '92vw',
          overflow: 'hidden',
          position: 'relative',
          color: '#ffffff'
        }}
      >
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: '#94a3b8',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        )}

        {/* Header Celebration Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)',
            padding: '28px 24px 20px',
            textAlign: 'center',
            position: 'relative'
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '4px' }}>🌸 🎓 🌸</div>
          <div style={{ fontSize: '26px', fontWeight: '900', letterSpacing: '0.04em' }}>
            合格おめでとうございます！
          </div>
          <div style={{ fontSize: '14px', color: '#fecaca', marginTop: '4px', fontWeight: '500' }}>
            Selamat atas Kelulusan N5 Anda, <span style={{ fontWeight: '700', color: '#ffffff' }}>{studentName}</span>!
          </div>
          <div style={{ fontSize: '12px', color: '#fee2e2', marginTop: '2px' }}>
            Anda telah berhasil menyelesaikan seluruh 25 Bab Kurikulum Intensif N5.
          </div>
        </div>

        {/* Cross-Selling Offer Body */}
        <div style={{ padding: '28px 32px' }}>
          <div
            style={{
              background: '#1e3a8a',
              border: '1px solid #3b82f6',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '24px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span
                style={{
                  background: '#f59e0b',
                  color: '#000000',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '800',
                  textTransform: 'uppercase'
                }}
              >
                Langkah Karir Selanjutnya • Tokutei Ginou
              </span>
              <div style={{ fontSize: '11px', color: '#93c5fd', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>⏳ Berakhir dalam:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#fef08a' }}>
                  {formatHours(secondsRemaining)}
                </span>
              </div>
            </div>

            <div style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff', marginBottom: '6px' }}>
              Simulasi Ujian Kerja Prometric JFT-Basic A2
            </div>
            <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.5', margin: '0 0 16px 0' }}>
              Syarat utama bekerja di Jepang dengan Visa Pekerja Berketerampilan Khusus (SSW) adalah lulus ujian JFT-Basic A2. Lanjutkan momentum belajarmu dengan paket 5 simulasi resmi!
            </p>

            {/* Voucher Code Box */}
            <div
              style={{
                background: '#0f172a',
                border: '1px dashed #60a5fa',
                borderRadius: '12px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>
                  Kupon Diskon Alumni {discountPercentage}%
                </div>
                <div style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '0.08em', color: '#38bdf8' }}>
                  {voucherCode}
                </div>
              </div>

              <button
                onClick={handleCopy}
                style={{
                  background: copied ? '#059669' : '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                {copied ? '✓ Tersalin!' : 'Salin Kode'}
              </button>
            </div>
          </div>

          {/* Action CTAs */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => onProceedToCheckout?.(voucherCode)}
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '14px',
                fontSize: '14px',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
              }}
            >
              Klaim Diskon Alumni {discountPercentage}% & Mulai JFT A2 ▶
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default GraduationCelebrationModal;
