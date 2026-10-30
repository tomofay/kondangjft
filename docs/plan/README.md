# KondangSensei Ecosystem — Master Implementation Plan & Roadmap

Dokumen ini memetakan seluruh arsitektur, modul teknis, dan fitur dari [PRD.md](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/PRD.md) ke dalam 20 file milestone terperinci (`M0` s.d. `M19`) di direktori `docs/plan/`.

---

## 🗺️ Master Milestone Index

| Milestone | Berkas Dokumen | Lingkup Subdomain & Modul | Stakeholder Utama | Status |
| :---: | :--- | :--- | :--- | :---: |
| **M0** | [m0-architecture-sso.md](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/docs/plan/m0-architecture-sso.md) | Decoupled Subdomain Topology, Shared DB, & SSO Session Management | DevOps, All Users | Planned |
| **M1** | [m1-rbac-user-management.md](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/docs/plan/m1-rbac-user-management.md) | Role-Based Access Control (RBAC) & Multi-Role User Hierarchy | Super Admin, Sensei, Siswa, Peserta | Planned |
| **M2** | [m2-portal-landing-lead-magnet.md](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/docs/plan/m2-portal-landing-lead-magnet.md) | Main Portal, Split-Path (`/kelas-n5`, `/tryout-jft`), & 12-Question Mini Tryout Lead Magnet | Calon Siswa & Peserta, Marketing | Planned |
| **M3** | [m3-payment-gateway-bundling.md](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/docs/plan/m3-payment-gateway-bundling.md) | Centralized DOKU Payment Gateway & Multi-Product Bundling Engine | Super Admin, Pembeli Paket | Planned |
| **M4** | [m4-bunpou-color-coded-engine.md](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/docs/plan/m4-bunpou-color-coded-engine.md) | Zero-Video Bunpou Architecture & Color-Coded Grammar Block Engine | Siswa N5, Sensei | Planned |
| **M5** | [m5-kotoba-flashcard-srs.md](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/docs/plan/m5-kotoba-flashcard-srs.md) | Kotoba Flashcards & Spaced Repetition System (SM-2 SRS Algorithm) | Siswa N5 (Pre-Class) | Planned |
| **M6** | [m6-renshu-dynamic-practice.md](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/docs/plan/m6-renshu-dynamic-practice.md) | Dynamic Renshu Engine (Drag-and-Drop Sentence Builder & Fill-in-Blank) | Siswa N5, Sensei | Planned |
| **M7** | [m7-kaiwa-visual-novel-shadowing.md](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/docs/plan/m7-kaiwa-visual-novel-shadowing.md) | 2D Kaiwa Visual Novel, Shadowing Player, & MediaRecorder Audio Submission | Siswa N5, Sensei | Planned |
| **M8** | [m8-kaku-digital-homework.md](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/docs/plan/m8-kaku-digital-homework.md) | Kaku Assignment Pipeline, Client-Side Image Compression, & Submission Tracking | Siswa N5, Sensei | Planned |
| **M9** | [m9-mondai-evaluation-gating.md](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/docs/plan/m9-mondai-evaluation-gating.md) | Timed Mondai Test Engine, Auto-Grading, & Prerequisite Bab Gating | Siswa N5, Sensei | Planned |
| **M10** | [m10-gamification-streak-whatsapp.md](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/docs/plan/m10-gamification-streak-whatsapp.md) | Daily Streak, XP Engine, Leaderboard, & WhatsApp Re-engagement Automation | Siswa N5, Retention Team | Planned |
| **M11** | [m11-omake-rewards-certificate.md](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/docs/plan/m11-omake-rewards-certificate.md) | Omake Japanese Culture Rewards & Verifiable PDF Certificate Generator | Siswa N5, Verifikator LPK/HR | Planned |
| **M12** | [m12-flipped-classroom-workflow.md](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/docs/plan/m12-flipped-classroom-workflow.md) | Flipped Classroom Orchestrator & Student Journey State Machine | Siswa N5, Sensei | Planned |
| **M13** | [m13-zoom-web-sdk-integration.md](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/docs/plan/m13-zoom-web-sdk-integration.md) | Embedded Zoom Web SDK & In-App Live Classroom Infrastructure | Sensei (Host), Siswa N5 | Planned |
| **M14** | [m14-realtime-gradebook.md](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/docs/plan/m14-realtime-gradebook.md) | Teacher Real-Time Gradebook Matrix & Live Class Analytics | Sensei (Live Telemetry) | Planned |
| **M15** | [m15-review-board-hanamaru-stamp.md](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/docs/plan/m15-review-board-hanamaru-stamp.md) | Voice/Image Review Board & Interactive Hanamaru Digital Stamp | Sensei (Evaluator), Siswa | Planned |
| **M16** | [m16-classroom-websocket-chat.md](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/docs/plan/m16-classroom-websocket-chat.md) | Micro-Classroom WebSocket Chat Room (Max 10 Siswa + 1 Sensei) | Siswa N5, Sensei | Planned |
| **M17** | [m17-cbt-jft-engine.md](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/docs/plan/m17-cbt-jft-engine.md) | JFT-Basic A2 Prometric-Style CBT Engine & Chōkai Audio Controller | Peserta JFT A2, Super Admin | Planned |
| **M18** | [m18-cross-selling-graduation-funnel.md](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/docs/plan/m18-cross-selling-graduation-funnel.md) | N5 Graduation Celebration Screen & JFT-A2 Cross-Selling Funnel | Siswa N5 Alumni, Marketing | Planned |
| **M19** | [m19-super-admin-unified-reporting.md](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/docs/plan/m19-super-admin-unified-reporting.md) | Super Admin Dashboard, Financial Reconciliation, & Ecosystem Audit Logs | Super Admin, Finance | Planned |

---

## 🏛️ PRD Coverage Cross-Reference

| Modul dalam PRD | Cakupan Fitur Spesifik | Milestone Terkait |
| :--- | :--- | :--- |
| **Seksi 1: Topology & Subdomain** | `kondangsensei.my.id`, `kelas.`, `cbt.`, Central DB, Shared Auth | **M0** |
| **Seksi 2: RBAC** | Super Admin, Sensei, Siswa N5, Peserta JFT A2 | **M1** |
| **Modul A.1: Bunpou** | Zero-Video, Blok Warna (Topik, Partikel, Predikat), Tabs & Accordion | **M4** |
| **Modul A.2: Kotoba Flashcard** | Flip 3D, Audio Native/TTS, Spaced Repetition (SM-2) | **M5** |
| **Modul A.3: Renshu Dinamis** | Drag & Drop Kalimat, Pilihan Partikel, Randomizer Soal | **M6** |
| **Modul A.4: Kaiwa VN** | 2D Visual Novel, Typewriter, Shadowing (0.5x, 0.75x, 1.0x), MediaRecorder | **M7** |
| **Modul A.5: Kaku PR Digital** | Physical-to-Digital, Kompresor Foto Klien, Status Tracking | **M8** |
| **Modul A.6: Mondai & Gating** | Ujian Berbatas Waktu, Auto-Grading, Penguncian Bab N+1 | **M9** |
| **Modul B.1 & B.2: Gamifikasi** | Daily Streak, Akumulasi XP, Peringkat Kelas, Notifikasi Otomatis WA | **M10** |
| **Modul B.3 & B.4: Omake & Sertif** | Budaya Omake Unlocked on Pass, Sertifikat PDF A4 dengan QR Verifikasi | **M11** |
| **Modul C: Flipped Classroom** | State Machine 3 Tahap (Pre-Class, In-Class, Post-Class) | **M12** |
| **Modul D.1: Live Zoom SDK** | Video Conference Tertanam Tanpa Link Eksternal | **M13** |
| **Modul D.2: Real-time Gradebook** | Matriks Nilai Live Siswa & Analisis Tingkat Kesalahan Soal | **M14** |
| **Modul D.3: Review Board** | Pemutar Audio Kaiwa, Kanvas Kaku, Stempel Digital Hanamaru | **M15** |
| **Modul D.4: Chat Room Kelas** | WebSocket Chat Terisolasi Maks 10 Siswa + 1 Sensei | **M16** |
| **Modul E.1: Payment Gateway** | DOKU (QRIS, VA, E-Wallet) & Bundling Engine (N5 + JFT) | **M3** |
| **Modul E.2: SSO & Session** | Token JWT/Sanctum melintasi Subdomain `.kondangsensei.my.id` | **M0, M1** |
| **Modul E.3 & Seksi 1.1: Funnel** | Portal Split-Path, Mini Tryout 12 Soal Lead Magnet, Banner Cross-Selling | **M2, M18** |
| **Seksi Ujian JFT-Basic A2** | 50 Soal 4 Seksi, Limit Audio Chōkai 2x, Navigasi Linier Terkunci | **M17** |
| **Super Admin & Reporting** | Rekonsiliasi Finansial DOKU, Manajemen User/Kelas, Audit Trail | **M19** |
