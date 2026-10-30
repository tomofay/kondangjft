# Milestone 16: Micro-Classroom WebSocket Chat Room & Real-Time Assignment Exchange

- **Milestone ID:** `M16`
- **File Name:** `m16-classroom-websocket-chat.md`
- **Target Subdomain:** `kelas.kondangsensei.my.id` (LMS & Teacher Dashboard)
- **Primary Stakeholders:** Sensei (Moderator), Siswa N5 (Anggota Kelas)
- **Dependencies:** `M0` (Shared DB), `M1` (Class Grouping RBAC)
- **Status:** Planned / Architecture Specification

---

## 1. Executive Summary & PRD Mapping
Berdasarkan PRD Seksi 3 Modul D.4 (*Chat Room Kelas - WebSocket Engine*):
Setiap kelompok belajar di KondangSensei dirancang sebagai kelas mikro (*micro-cohort*) beranggotakan **maksimal 10 siswa dan 1 Sensei**. 

Untuk memfasilitasi komunikasi harian di luar sesi tatap muka video, sistem menyediakan ruang obrolan internal terisolasi berbasis **WebSocket Engine** yang mendukung obrolan teks real-time, penyisipan karakter Jepang/Furigana, serta pengiriman berkas lampiran materi dan tugas harian.

---

## 2. Micro-Classroom Chat Architecture

```mermaid
graph LR
    Student([Siswa di Browser]) -->|Kirim Pesan / File| WSSocket[WebSocket Client Connection]
    Teacher([Sensei di Browser]) -->|Kirim Pengumuman / Tugas| WSSocket
    
    WSSocket --> WSGateway[WebSocket Gateway & Auth Middleware]
    WSGateway --> ChannelAuth{Apakah Anggota Terdaftar di Kelas Ini?}
    
    ChannelAuth -->|TIDAK| DropConn[Putus Koneksi / Tolak Pesan]
    ChannelAuth -->|YA| RoomManager[Room Hub: room_class_{classId}]
    
    RoomManager --> Broadcaster[Broadcast Pesan Real-time ke Seluruh Anggota Ruang]
    RoomManager --> PersistQueue[(Simpan Riwayat Pesan ke Database)]
    
    Broadcaster --> ClientUI[Chat UI: Gelembung Obrolan & Notifikasi Suara]
```

---

## 3. Data Schema (`class_chat_messages`, `class_chat_attachments`)

```sql
CREATE TABLE class_chat_messages (
    id VARCHAR(36) PRIMARY KEY,
    class_id VARCHAR(36) NOT NULL,
    sender_id VARCHAR(36) NOT NULL,
    message_type ENUM('text', 'image', 'audio', 'system_announcement') DEFAULT 'text',
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES n5_classes(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id)
);

CREATE TABLE class_chat_attachments (
    id VARCHAR(36) PRIMARY KEY,
    message_id VARCHAR(36) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(255) NOT NULL,
    file_size_kb INT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES class_chat_messages(id) ON DELETE CASCADE
);
```

---

## 4. Technical Specifications & Real-Time Protocol

### 4.1 WebSocket Room Isolation
- **Room Key:** `class_room:${classId}`.
- Siswa hanya memiliki izin *join room* jika pasangan `(classId, studentId)` tervalidasi di tabel `n5_class_members`.
- Sensei hanya dapat bergabung ke room kelas yang `sensei_id`-nya cocok.
- Peserta maksimal per room dibatasi ketat: **11 pengguna aktif** (10 Siswa + 1 Sensei).

### 4.2 Japanese Text & Attachment Handling
- **Dukungan Teks Jepang:** UTF-8 penuh yang mendukung kanji rumit, hiragana, katakana, dan emoji standar.
- **Attachment Pipeline:**
  - File diunggah melalui API `POST /api/chat/upload` (maksimal 5 MB untuk gambar, 10 MB untuk PDF/dokumen).
  - Sistem menghasilkan URL aman dan memancarkan (*emit*) event chat dengan tipe lampiran.

---

## 5. UI/UX: Integrated Classroom Chat Sidebar
- **Tampilan Antarmuka:** Komponen laci (*drawer*) atau sidebar samping yang dapat diminimalkan saat fokus belajar dan dibuka kapan saja.
- **Pesan Khusus Sensei:** Gelembung obrolan Sensei memiliki bingkai khusus berwarna biru tua dengan lencana `"Sensei"` untuk membedakannya dari siswa.
- **Fitur Pin Message:** Sensei dapat menyematkan (*pin*) tugas rumah atau link penting di bagian atas ruang obrolan.

---

## 6. Implementation Checklist & Acceptance Criteria
- [ ] Database migration tabel `class_chat_messages` dan `class_chat_attachments`.
- [ ] Implementasi channel WebSocket chat di server backend.
- [ ] Komponen React `ClassroomChatWidget.tsx` dengan auto-scroll ke bawah saat ada pesan baru.
- [ ] Upload helper untuk berkas lampiran gambar dan dokumen tugas harian.
- [ ] Validasi keamanan isolasi room: Siswa Kelas A tidak dapat membaca atau mengirim pesan ke Kelas B.
