/**
 * In-Memory & Database Store for M16: Micro-Classroom WebSocket Chat & Assignment Exchange
 * File: src/lib/classroomChatStore.ts
 */

export interface ChatAttachment {
  id: string;
  messageId: string;
  fileName: string;
  fileUrl: string;
  fileSizeKb: number;
  mimeType: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  class_id: string;
  sender_id: string;
  senderName: string;
  role: string;
  messageType: 'text' | 'image' | 'audio' | 'document' | 'system_announcement';
  content: string;
  is_pinned: boolean;
  sent_at: string;
  attachment?: ChatAttachment;
}

// Initial seed messages
const initialMessages: ChatMessage[] = [
  {
    id: 'msg_announcement_001',
    class_id: 'cls_batch1_n5',
    sender_id: 'usr_sensei_001',
    senderName: 'Tanaka Sensei',
    role: 'sensei',
    messageType: 'system_announcement',
    content: 'Selamat datang di kelas N5 Batch 1! Tugas Kaku Bab 1 sudah dapat dikumpulkan melalui menu tugas.',
    is_pinned: false,
    sent_at: '2026-10-30T09:00:00.000Z'
  },
  {
    id: 'msg_001',
    class_id: 'cls_batch1_n5',
    sender_id: 'usr_siswa_001',
    senderName: 'Budi (Siswa N5)',
    role: 'siswa_n5',
    messageType: 'text',
    content: 'Sensei, apakah audio Kaiwa boleh direkam ulang jika belum sempurna?',
    is_pinned: false,
    sent_at: '2026-10-30T09:15:00.000Z'
  }
];

class ClassroomChatStore {
  private messages: Map<string, ChatMessage[]> = new Map();

  constructor() {
    this.reset();
  }

  public reset() {
    this.messages.clear();
    const batch1Msgs = initialMessages.map((m) => ({ ...m }));
    this.messages.set('cls_batch1_n5', batch1Msgs);
    this.messages.set('cls_batch2_n5', []);
  }

  /**
   * Validate user class membership & permissions
   */
  public validateAccess(user: { userId: string; roles: string[]; classId?: string; activePackages?: string[] }, classId: string): { allowed: boolean; status: number; error?: string } {
    const isSuperAdmin = user.roles.includes('super_admin') || user.roles.includes('admin');
    if (isSuperAdmin) {
      return { allowed: true, status: 200 };
    }

    const isSensei = user.roles.includes('sensei');
    const isSiswaN5 = user.roles.includes('siswa_n5');
    const hasN5Package = user.activePackages?.some((p) => p.includes('n5') || p.includes('bundling'));

    if (!isSensei && !isSiswaN5 && !hasN5Package) {
      return {
        allowed: false,
        status: 403,
        error: 'Forbidden: Anda tidak memiliki akses ke fitur obrolan kelas N5'
      };
    }

    if (isSensei) {
      // Tanaka Sensei is in cls_batch1_n5, Yamada Sensei in cls_batch2_n5
      const senseiClassMap: Record<string, string> = {
        usr_sensei_001: 'cls_batch1_n5',
        usr_sensei_002: 'cls_batch2_n5'
      };
      const assignedClass = user.classId || senseiClassMap[user.userId] || 'cls_batch1_n5';
      if (assignedClass !== classId) {
        return {
          allowed: false,
          status: 403,
          error: 'Forbidden: Bukan instruktur kelas ini'
        };
      }
      return { allowed: true, status: 200 };
    }

    // Siswa N5 membership check
    const studentClassMap: Record<string, string> = {
      usr_siswa_001: 'cls_batch1_n5',
      usr_bundle_001: 'cls_batch1_n5',
      usr_siswa_002: 'cls_batch2_n5'
    };
    const userClass = user.classId || studentClassMap[user.userId] || 'cls_batch1_n5';

    if (userClass !== classId) {
      return {
        allowed: false,
        status: 403,
        error: 'Forbidden: Anda bukan anggota room kelas ini'
      };
    }

    return { allowed: true, status: 200 };
  }

  /**
   * Retrieve messages for a given class
   */
  public getMessages(classId: string, user: { userId: string; roles: string[]; classId?: string; activePackages?: string[] }): { success: boolean; status: number; messages?: ChatMessage[]; error?: string } {
    const auth = this.validateAccess(user, classId);
    if (!auth.allowed) {
      return { success: false, status: auth.status, error: auth.error };
    }

    const msgs = this.messages.get(classId) || [];
    return { success: true, status: 200, messages: [...msgs] };
  }

  /**
   * Post a new message
   */
  public sendMessage(
    classId: string,
    user: { userId: string; roles: string[]; name?: string; classId?: string; activePackages?: string[] },
    payload: { content: string; messageType?: string; attachment?: ChatAttachment }
  ): { success: boolean; status: number; message?: ChatMessage; error?: string } {
    const auth = this.validateAccess(user, classId);
    if (!auth.allowed) {
      return { success: false, status: auth.status, error: auth.error };
    }

    if (!payload.content && !payload.attachment) {
      return { success: false, status: 400, error: 'Konten pesan atau lampiran wajib diisi' };
    }

    const role = user.roles.includes('sensei') ? 'sensei' : user.roles.includes('super_admin') ? 'super_admin' : 'siswa_n5';
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      class_id: classId,
      sender_id: user.userId,
      senderName: user.name || (role === 'sensei' ? 'Sensei' : 'Siswa N5'),
      role,
      messageType: (payload.messageType as any) || 'text',
      content: payload.content || '',
      is_pinned: false,
      sent_at: new Date().toISOString(),
      attachment: payload.attachment
    };

    if (!this.messages.has(classId)) {
      this.messages.set(classId, []);
    }
    this.messages.get(classId)!.push(newMsg);

    return { success: true, status: 200, message: newMsg };
  }

  /**
   * Pin or unpin a message (Sensei / Super Admin only)
   */
  public pinMessage(
    classId: string,
    user: { userId: string; roles: string[]; classId?: string },
    payload: { messageId: string; isPinned: boolean }
  ): { success: boolean; status: number; isPinned?: boolean; error?: string } {
    const isSensei = user.roles.includes('sensei');
    const isSuperAdmin = user.roles.includes('super_admin') || user.roles.includes('admin');

    if (!isSensei && !isSuperAdmin) {
      return {
        success: false,
        status: 403,
        error: 'Forbidden: Regular students cannot pin messages (Only Sensei or Super Admin)'
      };
    }

    const auth = this.validateAccess(user, classId);
    if (!auth.allowed) {
      return { success: false, status: auth.status, error: auth.error };
    }

    const msgs = this.messages.get(classId) || [];
    const targetMsg = msgs.find((m) => m.id === payload.messageId);
    if (targetMsg) {
      targetMsg.is_pinned = payload.isPinned;
    }

    return { success: true, status: 200, isPinned: payload.isPinned };
  }

  /**
   * Process attachment file upload (Max 10 MB)
   */
  public processAttachmentUpload(
    classId: string,
    user: { userId: string; roles: string[]; classId?: string },
    fileSize: number,
    fileName: string,
    mimeType: string
  ): { success: boolean; status: number; attachment?: ChatAttachment; error?: string } {
    const auth = this.validateAccess(user, classId);
    if (!auth.allowed) {
      return { success: false, status: auth.status, error: auth.error };
    }

    const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
    if (fileSize > MAX_SIZE) {
      return {
        success: false,
        status: 413,
        error: 'Payload Too Large: Maksimal ukuran lampiran chat 10 MB'
      };
    }

    const attachment: ChatAttachment = {
      id: `att_${Date.now()}`,
      messageId: '',
      fileName,
      fileUrl: `/uploads/chat/${Date.now()}_${fileName}`,
      fileSizeKb: Math.round(fileSize / 1024),
      mimeType,
      createdAt: new Date().toISOString()
    };

    return { success: true, status: 200, attachment };
  }
}

export const classroomChatStore = new ClassroomChatStore();
