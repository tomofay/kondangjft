# KondangSensei CBT - Platform Simulasi Ujian JFT-Basic A2

KondangSensei CBT adalah platform Computer Based Test (CBT) modern yang dirancang khusus untuk simulasi ujian bahasa Jepang Japan Foundation Test for Basic Japanese (JFT-Basic) level A2. Platform ini ditujukan bagi calon pekerja migran Tokutei Ginou (Specified Skilled Worker / SSW), siswa Lembaga Pelatihan Kerja (LPK), serta pembelajar mandiri bahasa Jepang di Indonesia.

Antarmuka ujian dirancang dengan akurasi tinggi (99% identik dengan sistem CBT Prometric resmi), dilengkapi audio Chokai autentik, sistem penilaian otomatis sesuai standar penilaian Japan Foundation (skor 0-250 dengan ambang kelulusan 200 poin), serta sistem CRM dan manajemen bisnis terintegrasi.

---

## Daftar Fitur Utama

### 1. Modul Mini Tryout Gratis (Funnel Konversi Calon Siswa)
- Akses Langsung Tanpa Registrasi: Calon siswa dapat langsung mencoba simulasi mini tanpa hambatan registrasi di awal.
- Komposisi Soal Representatif: 12 butir soal yang mencakup 4 seksi ujian:
  - Seksi 1: Moji & Goi (Huruf & Kosakata)
  - Seksi 2: Kaiwa & Bunpou (Percakapan & Tata Bahasa)
  - Seksi 3: Chokai (Mendengarkan dengan Audio Asli)
  - Seksi 4: Dokkai (Membaca Teks & Pemahaman)
- Timer Countdown: 15 menit waktu pengerjaan otomatis.
- Gated Result Unlock: Nilai dan pembahasan dikunci di akhir tes. Siswa memasukkan Nama Lengkap dan Nomor WhatsApp untuk membuka rapor hasil.
- Validasi Nomor Seluler Ketat:
  - Badge prefix otomatis +62.
  - Sanitasi input otomatis (hanya angka).
  - Validasi nomor seluler aktif Indonesia (wajib diawali format 8 atau 628, minimal 10 digit angka).
  - Pencegahan data sampah (menolak teks acak seperti nama atau karakter non-angka).
- Persetujuan Marketing & Follow-up (ToS Modal):
  - Checkbox persetujuan komunikasi dan penawaran program belajar via WhatsApp.
  - Modal Syarat dan Ketentuan layanan digital dan kebijakan privasi data calon siswa.

### 2. Modul Simulasi Ujian CBT Lengkap (Full 50 Soal)
- Antarmuka CBT Standar Prometric: Layout ujian, tipografi, penomoran, dan navigasi menyerupai sistem ujian resmi JFT-Basic.
- 4 Seksi Ujian Komprehensif:
  - Seksi 1: Moji & Goi (Huruf & Kosakata) - 12 Soal
  - Seksi 2: Kaiwa & Bunpou (Percakapan & Tata Bahasa) - 12 Soal
  - Seksi 3: Chokai (Pendengaran / Listening) - 13 Soal
  - Seksi 4: Dokkai (Pemahaman Bacaan) - 13 Soal
- Pemutar Audio Chokai Khusus:
  - Batasan putar maksimal 2 kali per butir soal audio (sesuai aturan ujian resmi).
  - Indikator progres pemutaran audio real-time.
- Navigasi & Utilitas Ujian:
  - Panel nomor soal dengan indikator status (Sudah Dijawab, Belum Dijawab, Ragu-ragu / Ditandai).
  - Fitur penanda soal (Flag/Ragu-ragu) untuk ditinjau kembali sebelum selesai.
  - Timer ujian 60 menit dengan modal peringatan saat waktu tersisa 5 menit.
  - Proteksi konfirmasi penyelesaian sebelum pengiriman jawaban.

### 3. Rapor Hasil & Pembahasan Soal (Score Report & Analytics)
- Format Rapor Resmi JFT-Basic A2:
  - Skor total dengan rentang nilai 0 - 250.
  - Ambang batas kelulusan standar 200 poin dengan status LULUS atau TIDAK LULUS.
  - Persentase capaian per seksi untuk evaluasi kekuatan dan kelemahan materi.
- Pembahasan Lengkap (Question Review):
  - Kunci jawaban benar dan perbandingan dengan jawaban yang dipilih siswa.
  - Penjelasan tata bahasa dan terjemahan bahasa Indonesia untuk setiap soal.
  - Transkrip percakapan audio Chokai lengkap dengan terjemahan.
  - Fasilitas pemutaran ulang audio saat sesi pembahasan.
- Unduh / Cetak Hasil: Fasilitas ekspor rapor hasil ujian untuk arsip siswa atau laporan evaluasi LPK.

### 4. Portal Siswa & Manajemen Akun
- Akun Pribadi Siswa: Registrasi dan login berbasis email dan kata sandi yang dienkripsi (bcrypt).
- Proteksi Sesi Tunggal (Single Active Session Enforcement): Mencegah pembagian satu akun ke banyak orang secara bersamaan. Sesi baru akan otomatis mengakhiri sesi sebelumnya.
- Dasbor Siswa:
  - Status aktif langganan dan sisa hari akses paket.
  - Riwayat seluruh sesi ujian yang pernah diselesaikan beserta grafik perkembangan nilai.
  - Akses cepat ke bank paket ujian (Paket 1, Paket 2, Paket 3, Paket 4).

### 5. Sistem Transaksi & Payment Gateway DOKU
- Integrasi DOKU Payment Gateway (Mode Live):
  - Pembayaran QRIS instan otomatis.
  - Pembayaran Virtual Account (BCA, Mandiri, BNI, BRI, Permata).
- Notifikasi Status Otomatis: Pembaruan status pembayaran real-time melalui webhook DOKU.
- Aktivasi Paket Otomatis: Akses langganan siswa (7 hari, 14 hari, 30 hari) langsung aktif seketika setelah pembayaran terverifikasi.
- Syarat & Ketentuan Pembayaran: Modal ketentuan layanan produk digital (Non-Refundable policy) sebelum konfirmasi transaksi.

### 6. Portal Administrator (Admin Management Suite)
- Dasbor & Ringkasan Metrik: Menampilkan total pengguna, total ujian terselesaikan, omzet transaksi, dan jumlah leads terdaftar.
- Manajemen Pengguna (Tab Users):
  - Melihat daftar seluruh siswa terdaftar.
  - Menambah durasi langganan (hari akses) atau kuota ujian secara manual.
  - Mengatur role akun (User / Administrator).
  - Fitur Reset / Kick Sesi Aktif pengguna secara instan.
  - Hapus data pengguna.
- Manajemen Bank Soal (Tab Questions):
  - Melihat dan memfilter butir soal berdasarkan paket dan seksi ujian.
  - Form editor interaktif untuk mengedit teks soal, opsi jawaban (A, B, C, D), kunci jawaban, gambar, dan URL audio.
  - Menambahkan butir soal baru langsung ke database.
- Import Soal dari PDF / OCR (Tab PDF Parser):
  - Unggah berkas PDF modul latihan atau paste teks mentah latihan soal.
  - Algoritma parser cerdas yang mengekstrak soal, opsi, dan kunci jawaban menjadi draft soal terstruktur.
  - Simpan massal (batch save) langsung ke bank soal database.
- Rekapitulasi Transaksi (Tab Transactions):
  - Daftar riwayat transaksi pembayaran QRIS dan Virtual Account.
  - Status transaksi (PAID, PENDING, EXPIRED).
  - Fitur sinkronisasi dan verifikasi transaksi.
- CRM & Monitoring Leads Calon Siswa (Tab Leads):
  - Pelacakan data calon siswa dari Mini Tryout gratis secara real-time.
  - Kartu KPI: Total Leads, Jumlah Sudah Selesai Tes, Rata-rata Skor, Rasio Kelulusan.
  - Tabel Analisis Leads: Tanggal Masuk, Nama Siswa, Nomor WhatsApp, Skor Hasil Mini Tryout, dan Analisis Kelemahan Materi (seksi dengan skor terendah).
  - Tombol Tindakan 1-Klik Chat WhatsApp: Membuka chat WhatsApp dengan draft pesan personalisasi otomatis menyebutkan nama siswa, skor perolehan, dan rekomendasi konsultasi program persiapan SSW.
  - Fitur Salin Nomor WhatsApp ke Clipboard.
  - Ekspor Data Leads ke format CSV untuk analisis spreadsheet atau integrasi ke alat broadcast marketing.
  - Sistem Deduplikasi Otomatis: Mencegah data ganda jika nomor WhatsApp yang sama mengulang ujian.

### 7. Fitur UX, Aksesibilitas & SEO
- Tombol Bantuan WhatsApp Mengambang: Widget mengambang di pojok kanan bawah pada seluruh halaman untuk mempermudah calon siswa menghubungi Customer Service.
- Desain Responsif & Modern: Kompatibel dengan layar monitor PC, laptop, tablet, dan smartphone Android / iOS.
- SEO Teroptimasi:
  - Meta tags dinamis, canonical URL, OpenGraph, dan Twitter Card.
  - Berkas sitemap.xml dan robots.txt terotomatisasi.
  - Structured Data Schema.org (WebSite, EducationalOrganization) untuk indeksasi mesin pencari Google.

---

## Teknologi yang Digunakan

- Frontend Framework: Next.js 16 (App Router) dengan TypeScript
- Styling: Tailwind CSS & Lucide React Icons
- Basis Data: MySQL (Didukung pool koneksi mysql2/promise)
- Otentikasi: Enkripsi kata sandi berbasis bcryptjs & manajemen sesi berbasis token unik
- Gateway Pembayaran: DOKU Payment API (QRIS & Virtual Account)
- Containerization: Docker & Docker Compose (Optimasi multi-stage build, Alpine Linux)
- Server & Deployment: Node.js 20 LTS, Nginx Reverse Proxy, SSL Let's Encrypt

---

## Struktur Direktori

```text
KondangJFT/
├── public/                 # Berkas statis (ikon, favicon, gambar OpenGraph, logo)
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── api/            # API Endpoints
│   │   │   ├── auth/       # Login, register, logout, session check
│   │   │   ├── leads/      # Pengumpulan, deduplikasi, dan ekspor data calon siswa
│   │   │   ├── orders/     # Pembuatan invoice dan integrasi DOKU
│   │   │   ├── payments/   # Webhook dan verifikasi pembayaran
│   │   │   ├── questions/  # CRUD bank soal ujian
│   │   │   └── user/       # Update profil, reset sesi, dan data akun
│   │   ├── globals.css     # Konfigurasi gaya global
│   │   ├── layout.tsx      # Root layout, metadata SEO, dan Schema.org JSON-LD
│   │   ├── page.tsx        # Halaman utama, landing page, dan modal otentikasi
│   │   ├── robots.ts       # Generator robots.txt
│   │   └── sitemap.ts      # Generator sitemap.xml
│   ├── components/         # Komponen Antarmuka Pengguna
│   │   ├── AdminPortal.tsx           # Panel kontrol lengkap admin & CRM leads
│   │   ├── CbtExamEngine.tsx         # Mesin ujian simulasi CBT utama (50 soal)
│   │   ├── MiniTryoutExperience.tsx  # Mesin ujian mini tryout gratis (12 soal)
│   │   ├── JftResultReport.tsx       # Komponen rapor hasil ujian standar JFT-Basic
│   │   ├── QuestionReview.tsx        # Komponen pembahasan jawaban & transkrip audio
│   │   ├── FloatingWhatsAppButton.tsx# Widget tombol bantuan CS mengambang
│   │   ├── MarketingConsentModal.tsx # Modal persetujuan ToS & marketing WhatsApp
│   │   ├── TermsModal.tsx            # Modal syarat & ketentuan layanan
│   │   ├── PackagePaymentModal.tsx   # Modal pembayaran paket (QRIS / VA)
│   │   └── Navbar.tsx                # Navigasi utama
│   ├── lib/                # Utilitas, koneksi database, dan bank soal default
│   │   ├── db.ts                     # Inisialisasi pool MySQL & auto-migration
│   │   ├── dataStore.ts              # Data paket langganan dan konfigurasi default
│   │   ├── jftQuestions.ts           # Bank soal standar 50 butir JFT-Basic A2
│   │   └── miniTryoutQuestions.ts    # 12 butir soal mini tryout gratis
│   └── types/              # Definisi interface TypeScript
├── Dockerfile              # Konfigurasi container Docker production
├── docker-compose.yml      # Konfigurasi deployment layanan terintegrasi
├── package.json            # Daftar dependensi dan scripts npm
└── README.md               # Dokumentasi proyek
```

---

## Panduan Instalasi & Menjalankan Lokal

### 1. Prasyarat Sistem
- Node.js versi 18.18 atau lebih baru (direkomendasikan Node.js 20 LTS).
- Server MySQL versi 8.0 atau MariaDB 10.5 ke atas.
- Git.

### 2. Kloning Repositori & Instalasi Dependensi
```bash
git clone https://github.com/tomofay/kondangjft.git
cd kondangjft
npm install
```

### 3. Konfigurasi Lingkungan (.env.local)
Buat berkas `.env.local` di direktori utama proyek dan sesuaikan nilainya:
```env
# URL Domain
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# WhatsApp Customer Service (Gunakan format 62...)
NEXT_PUBLIC_WHATSAPP_NUMBER=6281299998888

# Konfigurasi MySQL Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=db_kondangsensei

# Kredensial DOKU Payment Gateway
DOKU_IS_PRODUCTION=false
DOKU_CLIENT_ID=your_doku_client_id
DOKU_SECRET_KEY=your_doku_secret_key
```

### 4. Menjalankan Server Pengembangan
```bash
npm run dev
```
Buka peramban pada alamat `http://localhost:3000`. Database dan tabel akan diinisialisasi secara otomatis saat aplikasi pertama kali dijalankan.

### 5. Kompilasi Produksi (Build)
```bash
npm run build
npm run start
```

---

## Deployment Menggunakan Docker

Proyek ini telah dilengkapi dengan berkas `Dockerfile` teroptimasi untuk lingkungan VPS / Cloud:

```bash
# Membangun image Docker
docker build -t kondangjft:latest .

# Menjalankan container di port 3000
docker run -d --name kondangjft-app -p 3000:3000 --env-file .env.local kondangjft:latest
```

---

## Lisensi & Kepemilikan
Hak Cipta (c) KondangSensei Indonesia. Seluruh hak cipta dilindungi undang-undang.
Platform ini dikembangkan untuk mendukung persiapan ujian kompetensi bahasa Jepang bagi calon tenaga kerja Indonesia.
