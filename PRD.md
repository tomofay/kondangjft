# Product Requirements Document (PRD)

**Nama Produk:** KondangSensei  
**Tujuan Produk:** Platform Simulasi Ujian JFT-Basic Interaktif  
**Fase Rilis:** MVP (Minimum Viable Product) V1.0  

---

## 1. Ringkasan Eksekutif
KondangSensei adalah aplikasi simulasi ujian berbasis web yang mereplikasi pengalaman ujian Japan Foundation Test for Basic Japanese (JFT-Basic). Platform ini menyediakan ekosistem terpadu (*end-to-end*) di mana administrator dapat mengelola bank soal, paket langganan, dan transaksi, sementara peserta mendapatkan pengalaman ujian yang akurat, lengkap dengan antarmuka multimedia, penilaian instan (*grading*), dan pembahasan mendalam (*review*) pengerjaan.

---

## 2. Target Pengguna
1. **Admin / Pengelola (Superadmin):** Bertanggung jawab atas pengelolaan konten ujian (input soal, audio, gambar), manajemen pengguna, dan validasi arus kas/pembayaran.
2. **Peserta / Siswa (User):** Pembelajar bahasa Jepang yang membutuhkan latihan ujian CBT (Computer Based Test) JFT-Basic dengan simulasi skor dan evaluasi akurat.

---

## 3. Spesifikasi Ujian (Sistem JFT-Basic)
Platform wajib mengakomodasi 50 soal dalam satu kali simulasi dengan pembagian seksi sebagai berikut:
* **Bagian 1 (S1) - Moji & Goi (Huruf & Kosakata):** 12 soal. Mendukung penyisipan gambar/foto.
* **Bagian 2 (S2) - Kaiwa (Percakapan & Ekspresi):** 12 soal. Mendukung penyisipan gambar/foto.
* **Bagian 3 (S3) - Chōkai (Pendengaran):** 13 soal. Wajib mendukung pemutar *audio* (MP3/WAV) terdedikasi per soal, dan penyisipan gambar/foto untuk opsi jawaban.
* **Bagian 4 (S4) - Dokkai (Pemahaman Bacaan):** 13 soal. Memerlukan ruang teks panjang untuk bacaan dan mendukung penyisipan gambar/foto.

---

## 4. Fitur Utama & Ruang Lingkup

### 4.1. Modul Administrator (Backend)
* **Manajemen Pengguna:** CRUD (Create, Read, Update, Delete) data peserta, mereset kata sandi, dan memantau riwayat ujian tiap peserta.
* **Manajemen Pembayaran & Paket Langganan:** Membuat paket langganan berbasis durasi waktu (contoh: "Paket 1 Minggu", "Paket 2 Minggu", "Paket 1 Bulan" dengan akses tryout tanpa batas / unlimited selama masa aktif), menetapkan harga, dan melakukan validasi pembayaran.
* **Manajemen Bank Soal:**
  * Editor visual untuk memasukkan teks soal, gambar pendukung, audio, opsi jawaban, jawaban benar, dan teks penjelasan/pembahasan.
  * Fitur modifikasi soal secara individual (satu per satu) untuk perbaikan *typo* atau penggantian *asset*.
* **Sistem Import Soal PDF:** Fitur *parser* cerdas. Admin dapat mengunggah berkas PDF berisi kumpulan soal. Sistem akan mengekstrak teks menjadi draf soal (memisahkan pertanyaan dan opsi) yang kemudian dapat ditinjau, diedit satu per satu, dan disimpan secara permanen ke basis data.

### 4.2. Modul Peserta (Frontend)
* **Dashboard Peserta:** Halaman untuk melihat paket yang tersedia, riwayat transaksi, dan statistik tryout sebelumnya.
* **Engine Simulasi Ujian (CBT):**
  * Antarmuka bersih tanpa distraksi dengan penghitung waktu mundur (*timer*).
  * Navigasi antar seksi (S1 - S4) dan panel nomor soal.
  * *Audio player* di setiap soal Chōkai dengan limitasi putar (opsional, menyesuaikan standar JFT).
* **Penilaian JFT-Style (Scoring):** Setelah konfirmasi selesai, sistem langsung menampilkan skor total, persentase kebenaran tiap seksi (S1-S4), dan status kelulusan berdasarkan *passing grade* standar JFT-Basic.
* **Sistem Evaluasi (Review Answer):** Peserta dapat membuka kembali kertas ujian mereka untuk melihat rincian soal mana yang salah/benar. Sistem menampilkan jawaban yang diinput peserta berdampingan dengan kunci jawaban yang benar beserta panel teks penjelasan (*insight*) mengapa pilihan tersebut benar/salah.

---

## 5. Rekomendasi Tumpukan Teknologi (Tech Stack)
Mempertimbangkan kompleksitas interaksi *user*, ekstraksi dokumen, dan stabilitas simulasi, berikut adalah rekomendasi teknis:
* **Frontend (Aplikasi Peserta):** Next.js, React, atau Livewire dipadukan dengan Tailwind CSS. Pendekatan *Single Page Application* (SPA) direkomendasikan saat sesi ujian berlangsung agar tidak ada interupsi waktu akibat *page reload*.
* **Backend (Admin & API):** Laravel. Sangat andal untuk mengamankan relasi *database* (User -> Transaksi -> Paket -> Soal).
* **Ekstraksi PDF:** Script Python (misal: PyMuPDF atau PDFMiner) diimplementasikan sebagai skrip latar belakang atau *microservice* API untuk mengekstrak teks/gambar soal ujian dengan presisi tinggi.


---

## 6. Alur Pengguna (User Flow) Utama
1. **Pendaftaran:** Siswa mendaftar ke KondangSensei.
2. **Transaksi:** Siswa memilih paket simulasi dan membayar. Admin atau sistem mengubah status transaksi menjadi 'Lunas'.
3. **Persiapan:** Siswa masuk ke menu "Mulai Ujian" dan mengonfirmasi kesiapan.
4. **Pengerjaan:** Siswa melalui tahapan S1 hingga S4. Dapat melewati soal dan kembali lagi.
5. **Penyelesaian:** Siswa menekan "Selesai", sistem menghitung skor dalam hitungan detik dan menampilkan Rapor JFT.
6. **Pembelajaran:** Siswa menekan "Lihat Pembahasan" untuk membaca ulasan komprehensif atas kesalahan yang dilakukan.