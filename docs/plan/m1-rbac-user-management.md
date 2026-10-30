# Milestone 1: Role-Based Access Control (RBAC) & Multi-Role User Hierarchy

- **Milestone ID:** `M1`
- **File Name:** `m1-rbac-user-management.md`
- **Target Subdomains:** All (`kondangsensei.my.id`, `kelas.kondangsensei.my.id`, `cbt.kondangsensei.my.id`)
- **Primary Stakeholders:** Super Admin, Sensei, Siswa N5, Peserta JFT A2
- **Dependencies:** `M0` (Centralized DB & SSO Auth)
- **Status:** Planned / Architecture Specification

---

## 1. Executive Summary & PRD Mapping
Berdasarkan PRD Seksi 2 (*User Roles & Access Control - RBAC*), sistem KondangSensei membagi pengguna menjadi 4 entitas peran terisolasi: **Super Admin**, **Sensei (Teacher)**, **Siswa N5 (Student)**, dan **Peserta JFT A2**. 

Prinsip keamanan utama:
- Sensei **terisolasi secara otomatis** dari data keuangan/transaksi DOKU dan engine CBT JFT.
- Siswa N5 memiliki akses ke platform LMS tanpa akses ke evaluasi guru atau manajemen soal.
- Peserta JFT A2 hanya dapat mengakses engine CBT JFT-Basic A2 dan riwayat nilainya sendiri.
- Super Admin memegang kontrol audit menyeluruh atas seluruh domain.

---

## 2. Role Permissions Matrix

| Fitur / Modul | Super Admin | Sensei | Siswa N5 | Peserta JFT A2 |
| :--- | :---: | :---: | :---: | :---: |
| **DOKU Payment & Finansial** | CRUD | ❌ Ditolak | Read (Riwayat Sendiri) | Read (Riwayat Sendiri) |
| **Paket Langganan & Bundling** | CRUD | ❌ Ditolak | ❌ Ditolak | ❌ Ditolak |
| **N5 LMS Content (Bunpou, Kotoba)** | CRUD | Read | Read (Sesuai Gating) | ❌ Ditolak |
| **Live Zoom Class Management** | Admin Control | Host / Start | Attendee / Join | ❌ Ditolak |
| **Real-time Gradebook & Review Board** | Read All | Evaluator (Kelasnya) | ❌ Ditolak | ❌ Ditolak |
| **Hanamaru Stamp & Feedback** | ❌ / Monitor | Write | Read (Feedback Sendiri) | ❌ Ditolak |
| **Chat Room Kelas** | Super Monitor | Host / Moderator | Member (Maks 10 Siswa) | ❌ Ditolak |
| **CBT JFT-Basic A2 Engine** | CRUD Soal & Sesi | ❌ Ditolak | ❌ Ditolak (Kecuali Bundling) | Full Test Access |
| **Audit Logs & User Roles Management** | CRUD | ❌ Ditolak | ❌ Ditolak | ❌ Ditolak |

---

## 3. Data Schema & Model Design

### 3.1 Skema Role & Asosiasi Kelas
```sql
-- Role Enum: super_admin, sensei, siswa_n5, peserta_jft
CREATE TABLE roles (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

-- Penugasan Role ke User (Multi-role support, misal Siswa membeli paket Bundling N5 + JFT A2)
CREATE TABLE user_roles (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    role VARCHAR(50) NOT NULL,
    active_until DATETIME NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Pengelompokan Kelas N5 (Maksimal 10 Siswa per Sensei sesuai PRD Seksi 3 Modul D.4)
CREATE TABLE n5_classes (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    batch_number INT NOT NULL,
    sensei_id VARCHAR(36) NOT NULL,
    zoom_meeting_id VARCHAR(100) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sensei_id) REFERENCES users(id)
);

CREATE TABLE n5_class_members (
    id VARCHAR(36) PRIMARY KEY,
    class_id VARCHAR(36) NOT NULL,
    student_id VARCHAR(36) NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES n5_classes(id),
    FOREIGN KEY (student_id) REFERENCES users(id),
    UNIQUE(class_id, student_id)
);
```

---

## 4. RBAC Middleware & Guard Enforcement

### 4.1 Next.js Edge Middleware Guard
Implementasi di `src/middleware.ts` memeriksa token, membaca klaim role, dan mencocokkan dengan hostname subdomain yang sedang diakses:

```typescript
// Pseudocode middleware rule
export function middleware(req: NextRequest) {
  const host = req.headers.get("host") || "";
  const session = verifySession(req.cookies.get("ks_session_token")?.value);

  // 1. Validasi Akses kelas.kondangsensei.my.id
  if (host.startsWith("kelas.")) {
    if (!session) return redirectToLogin(req);
    const hasLMSAccess = session.roles.some((r) => ["super_admin", "sensei", "siswa_n5"].includes(r));
    if (!hasLMSAccess) return redirectToForbidden(req, "Anda belum terdaftar di Kelas N5");
  }

  // 2. Validasi Akses cbt.kondangsensei.my.id
  if (host.startsWith("cbt.")) {
    if (!session) return redirectToLogin(req);
    const hasCBTAccess = session.roles.some((r) => ["super_admin", "peserta_jft"].includes(r));
    if (!hasCBTAccess) return redirectToForbidden(req, "Akses CBT JFT memerlukan paket simulasi aktif");
  }

  // 3. Isolasi Endpoint Sensei dari Finansial & CBT
  if (req.nextUrl.pathname.startsWith("/api/teacher")) {
    if (!session.roles.includes("sensei") && !session.roles.includes("super_admin")) {
      return jsonError("Unauthorized Teacher Access", 403);
    }
  }

  return NextResponse.next();
}
```

---

## 5. Security & Isolation Controls
1. **Teacher Data Boundary:**
   - Database query pada repository Sensei selalu menyertakan filter `WHERE sensei_id = :current_user_id` atau `WHERE class_id IN (assigned_classes)`.
   - Sensei dilarang melihat data siswa dari kelas Sensei lain kecuali memiliki izin supervisi.
2. **Audit Logging (Super Admin):**
   - Setiap perubahan status user, pembatalan langganan, dan pembuatan role dicatat dalam tabel `audit_logs` (`actor_id`, `action`, `resource_id`, `ip_address`, `timestamp`).

---

## 6. Implementation Checklist & Acceptance Criteria
- [ ] Database migration untuk tabel `roles`, `user_roles`, `n5_classes`, dan `n5_class_members`.
- [ ] Implementasi helper `hasRole(user, role)` dan `assertPermission(user, permission)` di core API.
- [ ] Pembuatan middleware proteksi rute di Next.js untuk isolasi subdomain `kelas.` dan `cbt.`.
- [ ] Unit test: Pastikan akun ber-role `sensei` menerima HTTP 403 saat mengakses `/api/admin/payments` dan `/cbt`.
- [ ] Unit test: Pastikan akun ber-role `peserta_jft` menerima HTTP 403 saat mengakses materi N5 sebelum melakukan pembelian paket bimbel.
