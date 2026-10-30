# Milestone 11: Omake Japanese Culture Rewards & Verifiable PDF Certificate Generator

- **Milestone ID:** `M11`
- **File Name:** `m11-omake-rewards-certificate.md`
- **Target Subdomain:** `kelas.kondangsensei.my.id`, `kondangsensei.my.id` (Public Verification Route)
- **Primary Stakeholders:** Siswa N5, Sensei, Calon Pemberi Kerja / LPK
- **Dependencies:** `M0` (Shared DB), `M9` (Mondai Completion)
- **Status:** Planned / Architecture Specification

---

## 1. Executive Summary & PRD Mapping
Berdasarkan PRD Seksi 3 Modul B.3 (*Reward Omake*) dan Modul B.4 (*Auto-Generate Sertifikat PDF*):
Modul ini memberikan penghargaan instrinsik dan ekstrinsik atas pencapaian belajar siswa:
1. **Reward Omake (おまけ):** Konten budaya Jepang eksklusif (tata krama kerja, etiket kehidupan di Jepang, video budaya pop, tips praktis hidup di Jepang) yang terbuka otomatis hanya jika siswa lulus ujian Mondai bab terkait.
2. **Auto-Generate Sertifikat PDF:** Ketika siswa menyelesaikan seluruh bab kurikulum N5 dan lulus seluruh ujian Mondai, sistem mengompilasi sertifikat kelulusan beresolusi tinggi (format PDF A4) lengkap dengan **QR Code Verifikasi Online Unik** untuk memvalidasi keaslian dokumen oleh instansi/LPK.

---

## 2. Architecture & Generation Pipeline

```mermaid
graph TD
    MondaiPass[Siswa Lulus Ujian Mondai Bab N] --> UnlockOmake[Buka Akses Konten Omake Bab N]
    UnlockOmake --> ReadOmake[Halaman Ekstra Budaya: Artikel, Video, Quiz Ringan]
    
    AllBabPass[Siswa Lulus Seluruh 25 Bab Mondai N5] --> CertTrigger[Trigger Pembuatan Sertifikat Kelulusan]
    CertTrigger --> GenCertId[Generate Unique Certificate Hash & Serial Number]
    CertTrigger --> GenQR[Generate QR Code: https://kondangsensei.my.id/verify/{id}]
    
    GenQR --> PDFEngine[Server-side PDF Generator: @react-pdf/renderer atau Puppeteer]
    PDFEngine --> SaveCert[(Simpan File PDF di Storage & DB)]
    SaveCert --> DownloadStudent[Siswa Dapat Unduh PDF A4 & Bagikan ke LinkedIn]
    
    PublicHR([Pihak Ketiga / LPK / HRD]) --> ScanQR[Scan QR Code pada Sertifikat Fisik]
    ScanQR --> VerifyPortal[Halaman Verifikasi Publik: Tampilkan Data Nilai Asli]
```

---

## 3. Data Schema (`omake_rewards`, `user_omake_unlocked`, `certificates`)

```sql
CREATE TABLE omake_rewards (
    id VARCHAR(36) PRIMARY KEY,
    chapter_id INT UNIQUE NOT NULL,
    title VARCHAR(150) NOT NULL,
    japanese_title VARCHAR(150) NOT NULL,
    category ENUM('culture', 'etiquette', 'pop_culture', 'daily_life', 'travel') NOT NULL,
    thumbnail_url VARCHAR(255) NOT NULL,
    content_markdown TEXT NOT NULL,
    media_url VARCHAR(255) NULL,         -- Video atau audio pendukung
    reading_time_minutes INT DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_omake_unlocked (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    omake_id VARCHAR(36) NOT NULL,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (omake_id) REFERENCES omake_rewards(id),
    UNIQUE(user_id, omake_id)
);

CREATE TABLE certificates (
    id VARCHAR(36) PRIMARY KEY,
    certificate_number VARCHAR(50) UNIQUE NOT NULL, -- Format: KS-N5-YYYYMM-XXXX
    verification_hash VARCHAR(64) UNIQUE NOT NULL,  -- SHA-256 hash untuk QR URL
    user_id VARCHAR(36) NOT NULL,
    course_name VARCHAR(150) DEFAULT 'Kelas Intensif Bahasa Jepang N5 Interaktif',
    student_name VARCHAR(150) NOT NULL,
    issue_date DATE NOT NULL,
    final_gpa_score DECIMAL(5,2) NOT NULL,
    pdf_file_url VARCHAR(255) NOT NULL,
    qr_code_url VARCHAR(255) NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 4. Technical Specifications

### 4.1 Automated Omake Gating Hook
Ketika `mondai_test_attempts` mencatat nilai lulus:
```typescript
export async function unlockOmakeOnMondaiSuccess(userId: string, chapterId: number) {
  const omake = await db.omakeReward.findUnique({ where: { chapterId } });
  if (omake) {
    await db.userOmakeUnlocked.upsert({
      where: { userId_omakeId: { userId, omakeId: omake.id } },
      create: { userId, omakeId: omake.id },
      update: {}
    });
  }
}
```

### 4.2 PDF Certificate Generation Engine
- **Layout & Dimensi:** Standar A4 Landscape (297mm x 210mm).
- **Desain Estetika:** Ornamen klasik modern Jepang (motif *Asanoha* / *Seigaiha* halus bergradasi emas dan merah marun), logo resmi KondangSensei dengan stempel merah Sensei (*Inkan / Hanko* digital).
- **Anti-Pemalsuan:**
  - Barcode / QR Code dinamis mengarah ke: `https://kondangsensei.my.id/verify/{verification_hash}`.
  - Tanda tangan digital Sensei & Serial Number resmi.
  - Metadata PDF berisi hash integritas data kelulusan.

### 4.3 Public Verification Route (`/verify/[hash]`)
Halaman publik ringan dan responsif untuk membuktikan keaslian sertifikat:
- Menampilkan Nama Siswa, Nomor Sertifikat, Tanggal Terbit, Rincian Modul yang Dikuasai, dan Status: **"VERIFIED & AUTHENTIC"**.

---

## 5. Implementation Checklist & Acceptance Criteria
- [ ] Database migration untuk tabel `omake_rewards`, `user_omake_unlocked`, dan `certificates`.
- [ ] Komponen halaman Omake `OmakeRewardPage.tsx` dengan badge locked/unlocked.
- [ ] Mesin pembuatan PDF sertifikat server-side `@react-pdf/renderer` di `src/lib/certificateGenerator.ts`.
- [ ] QR code generator terintegrasi menggunakan library `qrcode`.
- [ ] Halaman verifikasi publik `src/app/verify/[hash]/page.tsx`.
- [ ] Unit test: Pastikan sertifikat hanya bisa di-generate jika SEMUA 25 bab Mondai N5 berstatus lulus.
- [ ] Pengujian cetak fisik / download PDF dengan rasio A4 presisi tanpa font pecah.
