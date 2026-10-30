# KondangSensei Ecosystem — Vitest / Supertest E2E Test Suite

Direktori ini memuat seluruh berkas pengujian End-to-End (E2E) API berbasis **Vitest & Supertest** yang berpasangan **1:1** dengan 20 rencana milestone di [docs/plan/](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/docs/plan/).

Setiap berkas pengujian menguji 3 pilar skenario:
1. **Happy Path:** Alur sukses standar, struktur data JSON balikan, HTTP 200/201.
2. **Edge Cases:** Validasi format, sanitasi payload, penanganan kedaluwarsa, batas file/quota, dan idempotensi.
3. **RBAC Authorization:** Pengujian ketat hak akses 4 Peran (`super_admin`, `sensei`, `siswa_n5`, `peserta_jft`), boundary subdomain, dan penolakan HTTP 401 / 403.

---

## 🎯 1:1 Plan to E2E Spec Mapping Matrix

| Milestone Plan | Berkas E2E Spec Test | Cakupan Pengujian Utama |
| :--- | :--- | :--- |
| [M0: Architecture & SSO](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/docs/plan/m0-architecture-sso.md) | [architecture-sso.e2e-spec.ts](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/apps/api/test/architecture-sso.e2e-spec.ts) | Cookie `.kondangsensei.my.id`, login lintas subdomain, global logout, CORS |
| [M1: RBAC Hierarchy](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/docs/plan/m1-rbac-user-management.md) | [rbac-user-management.e2e-spec.ts](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/apps/api/test/rbac-user-management.e2e-spec.ts) | Multi-role bundling, isolasi Sensei dari finansial & CBT, boundary data kelas |
| [M2: Portal Lead Magnet](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/docs/plan/m2-portal-landing-lead-magnet.md) | [portal-lead-magnet.e2e-spec.ts](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/apps/api/test/portal-lead-magnet.e2e-spec.ts) | 12 Soal Mini Tryout, skor real-time skala 250, analisis kelemahan, lead WA capture |
| [M3: Payment & Bundling](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/docs/plan/m3-payment-gateway-bundling.md) | [payment-bundling.e2e-spec.ts](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/apps/api/test/payment-bundling.e2e-spec.ts) | DOKU Checkout, validasi HMAC-SHA256 signature, idempotency webhook, dual provisioning |
| [M4: Bunpou Color Engine](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/docs/plan/m4-bunpou-color-coded-engine.md) | [bunpou.e2e-spec.ts](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/apps/api/test/bunpou.e2e-spec.ts) | Zero-video blocks (topik, partikel, predikat), tabs, accordion, audio lafal |
| [M5: Kotoba SRS](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/docs/plan/m5-kotoba-flashcard-srs.md) | [kotoba-srs.e2e-spec.ts](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/apps/api/test/kotoba-srs.e2e-spec.ts) | Deck kosakata SRS, algoritma SM-2, rating 1-4, interval schedule, reset pada rating 1 |
| [M6: Dynamic Renshu](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/docs/plan/m6-renshu-dynamic-practice.md) | [renshu.e2e-spec.ts](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/apps/api/test/renshu.e2e-spec.ts) | Token pengacakan Fisher-Yates, drag & drop susun kalimat, permutasi valid, rumpang partikel |
| [M7: Kaiwa Visual Novel](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/docs/plan/m7-kaiwa-visual-novel-shadowing.md) | [kaiwa-shadowing.e2e-spec.ts](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/apps/api/test/kaiwa-shadowing.e2e-spec.ts) | Script dialog VN, shadowing player (0.5x, 0.75x, 1.0x), upload audio MediaRecorder, limit 5MB |
| [M8: Kaku Homework](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/docs/plan/m8-kaku-digital-homework.md) | [kaku-homework.e2e-spec.ts](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/apps/api/test/kaku-homework.e2e-spec.ts) | Tugas tulis fisik, upload WebP terkompresi, limit 10MB, status tracking (pending, approved, revision) |
| [M9: Mondai Gating](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/docs/plan/m9-mondai-evaluation-gating.md) | [mondai-gating.e2e-spec.ts](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/apps/api/test/mondai-gating.e2e-spec.ts) | Timer ujian server-enforced, auto-grading 75% passing grade, pembukaan kunci Bab N+1 |
| [M10: Gamifikasi & WA](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/docs/plan/m10-gamification-streak-whatsapp.md) | [gamification-whatsapp.e2e-spec.ts](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/apps/api/test/gamification-whatsapp.e2e-spec.ts) | Daily streak heartbeat, XP counter, leaderboard kelas, cron WA reminder siswa inaktif >= 2 hari |
| [M11: Omake & Sertifikat](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/docs/plan/m11-omake-rewards-certificate.md) | [omake-certificate.e2e-spec.ts](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/apps/api/test/omake-certificate.e2e-spec.ts) | Konten budaya Jepang unlocked on pass, generate sertifikat PDF A4 dengan QR verifikasi publik |
| [M12: Flipped Classroom](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/docs/plan/m12-flipped-classroom-workflow.md) | [flipped-classroom.e2e-spec.ts](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/apps/api/test/flipped-classroom.e2e-spec.ts) | Transisi state machine (Pre-Class -> In-Class -> Post-Class), pencegahan lompat tahap |
| [M13: Zoom Live Class](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/docs/plan/m13-zoom-web-sdk-integration.md) | [zoom-live-class.e2e-spec.ts](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/apps/api/test/zoom-live-class.e2e-spec.ts) | Zoom Web SDK embedded, signature generation (Role 1 Host vs Role 0 Attendee), presensi otomatis |
| [M14: Live Gradebook](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/docs/plan/m14-realtime-gradebook.md) | [realtime-gradebook.e2e-spec.ts](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/apps/api/test/realtime-gradebook.e2e-spec.ts) | Matriks live telemetry 10 siswa, heatmap benar/salah, analisis tingkat error per butir soal |
| [M15: Review & Hanamaru](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/docs/plan/m15-review-board-hanamaru-stamp.md) | [teacher-review.e2e-spec.ts](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/apps/api/test/teacher-review.e2e-spec.ts) | Antrean koreksi tugas foto & audio, stempel kanvas Hanamaru, catatan koreksi Sensei |
| [M16: Classroom Chat](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/docs/plan/m16-classroom-websocket-chat.md) | [classroom-chat.e2e-spec.ts](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/apps/api/test/classroom-chat.e2e-spec.ts) | Chat room terisolasi maks 10 siswa + 1 Sensei, karakter Jepang UTF-8, lampiran tugas maks 10MB |
| [M17: CBT JFT-Basic A2](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/docs/plan/m17-cbt-jft-engine.md) | [cbt-jft.e2e-spec.ts](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/apps/api/test/cbt-jft.e2e-spec.ts) | Simulasi Prometric 50 soal 4 seksi, limit audio Chōkai 2x putar, scoring mutlak 250 poin |
| [M18: Cross-Selling Funnel](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/docs/plan/m18-cross-selling-graduation-funnel.md) | [cross-selling.e2e-spec.ts](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/apps/api/test/cross-selling.e2e-spec.ts) | Layar kelulusan 25 bab N5, klaim voucher diskon alumni N5 30% untuk simulasi JFT A2 |
| [M19: Super Admin Reporting](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/docs/plan/m19-super-admin-unified-reporting.md) | [super-admin-reporting.e2e-spec.ts](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/apps/api/test/super-admin-reporting.e2e-spec.ts) | KPI eksekutif, rekonsiliasi DOKU settlement API, audit log permanen (anti-delete) |

---

## 🚀 Cara Menjalankan Uji Coba

Jalankan perintah berikut di terminal:

```bash
# Menjalankan seluruh test suite E2E
npx vitest run apps/api/test/

# Menjalankan pengujian spesifik per modul (contoh: Bunpou)
npx vitest run apps/api/test/bunpou.e2e-spec.ts

# Menjalankan dengan mode watch saat pengembangan
npx vitest apps/api/test/
```
