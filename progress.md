# JFT Simulation Project – Progress Report

**Date:** 2026-10-12

---

## ✅ Completed Work

1. **Sistem Login Otentikasi & Akun Dummy Lengkap**
   - Halaman utama sekarang menampilkan gerbang login profesional dengan input Email & Password, validasi error, dan tombol show/hide kata sandi.
   - Disediakan 3 akun dummy interaktif dengan tombol quick-fill:
     - **Budi Pratama (Peserta Demo 1)**: `peserta@kondang.com` / `password123`
     - **Siti Rahmawati (Peserta Demo 2)**: `siti@kondang.com` / `password123`
     - **Super Admin Kondang (Superadmin)**: `admin@kondang.com` / `adminsecret123`
   - Sinkronisasi otentikasi ganda via in-memory session dan verifikasi database MySQL `db_kondangsensei`.

2. **Halaman Admin Disembunyikan Sesuai Hak Akses (Role-Based Access Control)**
   - Tombol tab "Portal Admin" di Navbar disembunyikan sepenuhnya dari peserta biasa (`role === 'user'`).
   - Tombol demo switcher peran ("Peserta" / "Admin") telah dihapus dari antarmuka pengguna agar tidak dapat diakses sembarangan.
   - Portal Admin eksklusif hanya terbuka jika user login menggunakan kredensial akun Admin (`admin@kondang.com`).
   - Tombol "Keluar" (Logout) berfungsi mengakhiri sesi aktif dan mengembalikan pengguna ke form login.

3. **Fitur Edit Profil Peserta untuk Data Sertifikat JFT-Basic**
   - Komponen modal interaktif [ProfileModal.tsx](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/src/components/ProfileModal.tsx).
   - Menyunting data sertifikat resmi: Nama Lengkap, Nomor Registrasi (Reg No), Kewarganegaraan, Tanggal Lahir, Jenis Kelamin, dan Foto formal.
   - Terkoneksi langsung ke database MySQL `db_kondangsensei`.

4. **Koneksi Database MySQL (`db_kondangsensei`)**
   - Host: `localhost`, User: `root`, Password: `""`, Database: `db_kondangsensei`.
   - Modul koneksi [src/lib/db.ts](file:///c:/Users/toram/OneDrive/Dokumen/kondangjft/src/lib/db.ts) dengan skema `users`, `questions`, `exam_results`, dan `transactions`.

5. **Direct Audio MP3 Playback (Chōkai)**
   - Tag `<audio>` mendukung link audio eksternal langsung (seperti link Irodori JPF MP3).

---

## 📋 Status Komponen Proyek
- Sembunyikan Halaman Admin dari Peserta: **Selesai & Teruji**
- Form Login & 3 Akun Dummy: **Selesai & Teruji**
- Edit Profil Peserta & Sertifikat: **Selesai & Teruji**
- Koneksi MySQL (`db_kondangsensei`): **Selesai & Teruji**
- Audio Player Direct URL (MP3/OGG Irodori): **Selesai & Teruji**
- 4 Paket Bank Soal Ujian & Pemilihan Peserta: **Selesai & Teruji**
- Editor Bank Soal Interaktif oleh Admin: **Selesai & Teruji**
- Engine CBT Ujian 50 Soal JFT: **Selesai & Teruji**
- 1-Session Locking Mechanism: **Selesai & Teruji**

---

*Laporan ini diperbarui otomatis untuk memantau status pengembangan KondangSensei.*
