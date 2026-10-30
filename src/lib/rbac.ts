import { SessionPayload, UserRole } from './authCookie';

export const VALID_ROLES: UserRole[] = ['super_admin', 'sensei', 'siswa_n5', 'peserta_jft'];

export function isValidRole(role: string): role is UserRole {
  return VALID_ROLES.includes(role as UserRole);
}

export function hasRole(session: SessionPayload | null | undefined, role: UserRole): boolean {
  if (!session || !session.roles) return false;
  return session.roles.includes(role) || session.roles.includes('super_admin');
}

export function hasAnyRole(session: SessionPayload | null | undefined, roles: UserRole[]): boolean {
  if (!session || !session.roles) return false;
  if (session.roles.includes('super_admin')) return true;
  return roles.some((r) => session.roles.includes(r));
}

/**
 * In-memory Mock Data Store for Tests & Fallbacks
 */
interface UserRecord {
  id: string;
  name: string;
  email: string;
  roles: UserRole[];
  classId?: string;
  isSuspended?: boolean;
}

const mockUsersStore: Map<string, UserRecord> = new Map([
  [
    'usr_superadmin_001',
    {
      id: 'usr_superadmin_001',
      name: 'Super Admin Kondang',
      email: 'admin@kondangsensei.my.id',
      roles: ['super_admin']
    }
  ],
  [
    'usr_sensei_001',
    {
      id: 'usr_sensei_001',
      name: 'Tanaka Sensei',
      email: 'tanaka@kondangsensei.my.id',
      roles: ['sensei'],
      classId: 'cls_batch1_n5'
    }
  ],
  [
    'usr_sensei_002',
    {
      id: 'usr_sensei_002',
      name: 'Yamada Sensei',
      email: 'yamada@kondangsensei.my.id',
      roles: ['sensei'],
      classId: 'cls_batch2_n5'
    }
  ],
  [
    'usr_siswa_001',
    {
      id: 'usr_siswa_001',
      name: 'Budi Pratama',
      email: 'budi@example.com',
      roles: ['siswa_n5'],
      classId: 'cls_batch1_n5'
    }
  ],
  [
    'usr_peserta_001',
    {
      id: 'usr_peserta_001',
      name: 'Siti Rahma',
      email: 'siti@example.com',
      roles: ['peserta_jft']
    }
  ],
  [
    'usr_bundle_001',
    {
      id: 'usr_bundle_001',
      name: 'Andi Wijaya',
      email: 'andi@example.com',
      roles: ['siswa_n5', 'peserta_jft'],
      classId: 'cls_batch1_n5'
    }
  ]
]);

export function getAllUsers(): UserRecord[] {
  return Array.from(mockUsersStore.values());
}

export function getUserById(userId: string): UserRecord | null {
  return mockUsersStore.get(userId) || null;
}

export function assignUserRole(userId: string, role: UserRole): { success: boolean; roles: UserRole[] } {
  const user = mockUsersStore.get(userId);
  if (!user) {
    // If not found, create placeholder
    const newUser: UserRecord = {
      id: userId,
      name: 'User ' + userId,
      email: `${userId}@example.com`,
      roles: [role]
    };
    mockUsersStore.set(userId, newUser);
    return { success: true, roles: newUser.roles };
  }

  if (!user.roles.includes(role)) {
    user.roles.push(role);
  }
  return { success: true, roles: user.roles };
}

/**
 * Class membership helper
 */
const mockClassStudents: Record<string, string[]> = {
  cls_batch1_n5: ['usr_siswa_001', 'usr_bundle_001'],
  cls_batch2_n5: ['usr_siswa_002']
};

export function getClassStudents(classId: string, requestingSenseiId?: string): { success: boolean; students?: any[]; error?: string } {
  if (requestingSenseiId) {
    const sensei = getUserById(requestingSenseiId);
    if (sensei && sensei.roles.includes('sensei') && sensei.classId !== classId) {
      return { success: false, error: 'Forbidden: Bukan instruktur kelas ini' };
    }
  }

  const studentIds = mockClassStudents[classId] || [];
  const students = studentIds.map((id) => mockUsersStore.get(id)).filter(Boolean);
  return { success: true, students };
}
