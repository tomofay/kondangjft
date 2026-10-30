# Product Requirements Document (PRD)
## Project Name: KondangSensei Ecosystem (N5 LMS & JFT A2 CBT)

---

## 1. Executive Summary & Architecture Overview

KondangSensei adalah ekosistem platform pembelajaran bahasa Jepang dan simulasi ujian berbasis web yang menggabungkan LMS N5 Interaktif dan CBT JFT-Basic A2 Engine. Sistem ini menggunakan arsitektur Decoupled Subdomain dengan Single Database dan Single Sign-On (SSO) untuk efisiensi beban kerja server dan lalu lintas pengguna.

### 1.1 Infrastructure & Subdomain Topology
- **`kondangsensei.my.id` (Main Portal & Split-Path Landing Page)**
  - Portal penyaring pengunjung untuk optimasi SEO (Target kata kunci informasional & transaksional).
  - `/kelas-n5`: Halaman penawaran kursus interaktif N5.
  - `/tryout-jft`: Lead magnet berupa formulir Mini Tryout 12 soal.
  - Menampilkan spanduk cross-selling otomatis di akhir kelulusan N5.
- **`kelas.kondangsensei.my.id` (N5 LMS & Interactive Platform)**
  - Mengelola modul pembelajaran N5, Zoom Web SDK, WebSocket chat room, dan Teacher Dashboard.
- **`cbt.kondangsensei.my.id` (JFT-Basic A2 CBT Simulation Engine)**
  - Engine khusus penguji sistem Prometric, timer presisi, dan kalkulasi skor mutlak JFT A2.
- **Centralized Database & Auth**:
  - Pangkalan data terpusat (MySQL/PostgreSQL).
  - Token Auth terpusat (Laravel Sanctum/JWT) untuk Single Sign-On (SSO) antar subdomain.

---

## 2. User Roles & Access Control (RBAC)

1. **Super Admin**:
   - Memiliki akses penuh ke seluruh ekosistem (KondangSensei, LMS N5, CBT JFT).
   - Mengelola DOKU Payment Gateway, laporan keuangan terpusat, paket kombinasi (bundling), serta audit log.
2. **Sensei (Teacher)**:
   - Mengakses Teacher Dashboard (`kelas.kondangsensei.my.id`).
   - Mengelola Real-time Gradebook, Voice & Image Review Board, Hanamaru Stamp, dan Zoom Class Control.
   - Terisolasi otomatis dari data transaksi dan engine CBT JFT.
3. **Siswa N5 (Student)**:
   - Akses materi interaktif N5, Flashcard SRS, Renshu, Kaiwa VN, Kaku Assignment, Mondai Evaluation, Gamifikasi, dan Live Zoom.
4. **Peserta JFT A2**:
   - Akses mesin ujian CBT JFT-Basic A2 dan riwayat hasil tryout.

---

## 3. Detailed Feature Specifications

### Module A: Modul Materi Interaktif N5 (Front-End LMS)

#### 1. UI Tata Bahasa (Bunpou) Tersegmentasi
- **Zero-Video Concept**: Penjelasan tata bahasa murni interaktif tanpa media video.
- **Color-Coded Block Engine**: Pemisahan visual otomatis menggunakan blok warna terpisah untuk:
  - Topik Kalimat (Topic Marker)
  - Partikel (Particles)
  - Kata Kerja / Predikat (Verbs/Predicates)
- **Interactive UI Components**:
  - System Tabulasi: Switcher antara "Poin Penting" dan "Contoh Kalimat".
  - Accordion Element: Expand/collapse detail tata bahasa sebagai pemantik interaksi siswa.

#### 2. Flashcard Kosakata (Kotoba) dengan SRS
- **Digital Flip-Card**: Kartu bolak-balik menampilkan Huruf Jepang (Kanji/Kana), Romaji, dan Terjemahan Bahasa Indonesia.
- **In-Browser Audio**: Tombol pelafalan audio MP3/TTS bawaan.
- **Spaced Repetition System (SRS) Algorithm**:
  - Implementasi algoritma pengulangan berkala (SM-2 variant).
  - Menghitung interval penampilan ulang kartu berdasarkan riwayat kesalahan jawab siswa.

#### 3. Latihan Soal Dinamis (Renshu)
- **Drag-and-Drop Interactive Engine**: Skenario menyusun struktur kalimat Jepang secara presisi.
- **Fill-in-the-Blank**: Input/pilihan melengkapi partikel yang tepat.
- **Randomization Engine**: Pengacakan urutan soal dan opsi dari pangkalan data per sesi kuis untuk mencegah hafalan pola letak jawaban.

#### 4. Praktek Percakapan (Kaiwa) Visual Novel
- **2D Visual Novel UI**: Tampilan karakter 2D dengan efek *typewriter* / teks mengalir.
- **Shadowing Player**: Pemutar audio dialog dengan tombol penyesuaian tempo (*playback rate*: 0.5x, 0.75x, 1.0x).
- **In-Browser Audio Recorder**:
  - Integrasi `MediaRecorder API` di browser untuk merekam suara latihan siswa.
  - Fitur re-record, preview audio, dan tombol submit ke server.

#### 5. Buku PR Digital (Kaku)
- **Physical-to-Digital Assignment**: Siswa menulis huruf/kanji di buku fisik.
- **Image Upload & Compressor**: Modul unggah foto tugas dengan kompresi gambar otomatis di sisi klien sebelum dikirim ke server storage.
- **Status Tracking**: Status tugas (`Pending Review`, `Approved`, `Revision Needed`).

#### 6. Ujian Evaluasi (Mondai) & System Gating
- **Timed Test Engine**: Modul ujian akhir bab berbatas waktu otomatis (*countdown timer*).
- **Auto-Grading Calculation**: Kalkulasi nilai seketika setelah ujian selesai.
- **System Gating**: Mechanisme penguncian otomatis. Bab berikutnya (`Bab N+1`) terkunci penuh sampai siswa mencapai *Passing Grade* minimum di ujian Mondai bab saat ini.

---

### Module B: Gamifikasi & Retensi Siswa

1. **Daily Streak & Point System**:
   - Tracking Runtutan Login (*Daily Streak counter*).
   - Perhitungan akumulasi XP/Poin otomatis setiap penyelesaian materi, Renshu, dan Mondai.
2. **Integrasi Pengingat WhatsApp (Automation)**:
   - Cron Job / Scheduler di backend yang memeriksa keaktifan siswa.
   - Pemicu otomatis pesan WhatsApp via WA Gateway jika siswa tidak aktif/login lebih dari 2 hari berturut-turut.
3. **Reward Omake**:
   - Halaman ekstra khusus berisi artikel/video pendek budaya pop & tata krama Jepang.
   - Terkunci penuh dan hanya terbuka (*unlocked*) secara otomatis setelah lulus ujian Mondai bab terkait.
4. **Auto-Generate Sertifikat PDF**:
   - Generator PDF otomatis saat siswa lulus seluruh ujian Mondai N5.
   - Dilengkapi QR Code / Barcode unik untuk verifikasi keaslian sertifikat secara online.

---

### Module C: Student Journey & Flipped Classroom Workflow

#### Tahap 1: Persiapan Mandiri (Pre-Class)
1. Siswa login -> Diperbarui indikator Daily Streak dan posisi di Leaderboard Kelas.
2. Siswa membuka Kotoba Flashcard -> Sistem SRS menyajikan kosakata baru dan mengulang kosakata sulit.

#### Tahap 2: Sesi Kelas Live (In-Class / Zoom Embedded)
1. **Presentasi Bunpou**: Sensei Share Screen dari portal, menerangkan blok warna Bunpou.
2. **Praktek Renshu Bersama**: Siswa mengerjakan Renshu secara simultan -> Nilai masuk *Real-time* ke Teacher Dashboard -> Sensei membahas soal dengan tingkat kesalahan tertinggi.
3. **Sesi Kaku**: Siswa menulis di buku fisik -> Memfoto -> Mengunggah ke modul Kaku.
4. **Praktek Kaiwa Live**: Sensei dan siswa membaca dialog Visual Novel bersama-sama secara live.

#### Tahap 3: Penugasan & Evaluasi (Post-Class)
1. Siswa melatih pelafalan Kaiwa dengan Shadowing (0.5x/0.75x) -> Merekam suara -> Submit.
2. Siswa menyelesaikan ujian Mondai berbatas waktu -> Jika Lulus: Poin bertambah, Bab berikutnya terbuka, Reward Omake terbuka.

---

### Module D: Teacher Dashboard & Live Class Infrastructure

1. **Integrasi Zoom Web SDK**:
   - Window video conference yang tertanam (*embedded*) langsung di dalam portal `kelas.kondangsensei.my.id`.
   - Bebas dari ketergantungan link eksternal.
2. **Real-time Gradebook**:
   - Matriks pantauan nilai siswa berbasis WebSocket / Polling.
   - Menampilkan statistik pengerjaan Renshu dan Mondai per siswa secara *live*.
3. **Voice & Image Review Board**:
   - Dasbor khusus Sensei untuk memutar rekaman audio Kaiwa siswa.
   - Image viewer untuk memeriksa foto tulisan tangan Kaku.
   - **Hanamaru Digital Stamp**: Modul pemberian stempel apresiasi digital dan catatan evaluasi.
4. **Chat Room Kelas (WebSocket Engine)**:
   - Grup obrolan internal terbatas (Maksimal 10 Siswa + 1 Sensei).
   - Mendukung diskusi real-time dan pengiriman lampiran tugas harian.

---

### Module E: Ecosystem Integration & Monetization

1. **Centralized Payment Gateway (DOKU Integration)**:
   - Penanganan transaksi QRIS, E-Wallet, dan Bank Transfer via DOKU API.
   - **Bundling Engine**: Kemampuan membuat paket produk kombinasi (Contoh: *Bimbel N5 + Voucher Tryout JFT A2*).
2. **Single Sign-On (SSO) & Session Management**:
   - Pengguna cukup mendaftar/login sekali di domain manapun.
   - Token Sanctum/JWT dibagikan aman melintasi subdomain `kelas.kondangsensei.my.id` dan `cbt.kondangsensei.my.id`.
3. **Cross-Selling & Lead Magnet Engine**:
   - Mini Tryout 12 Soal di `/tryout-jft` sebagai penangkap data calon siswa (Lead Magnet).
   - Banner penawaran diskon CBT JFT A2 otomatis muncul di layar selebrasi kelulusan N5.