/**
 * E2E Spec: M16 - Micro-Classroom WebSocket Chat Room & Real-Time Assignment Exchange
 * File: apps/api/test/classroom-chat.e2e-spec.ts
 * Plan: docs/plan/m16-classroom-websocket-chat.md
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { MOCK_USERS, authHeader } from './test-helpers';

const BASE_URL = 'http://localhost:3000';

describe('M16: Micro-Classroom Chat & Assignment Exchange (E2E)', () => {
  describe('Happy Path: Japanese Messaging & Homework File Sharing', () => {
    it('Siswa N5 can fetch recent chat message history of their active class', async () => {
      const res = await request(BASE_URL)
        .get('/api/n5/chat/messages?classId=cls_batch1_n5')
        .set(authHeader(MOCK_USERS.siswaN5, 'kelas.kondangsensei.my.id'));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.messages)).toBe(true);

      if (res.body.messages.length > 0) {
        const msg = res.body.messages[0];
        expect(msg).toHaveProperty('id');
        expect(msg).toHaveProperty('senderName');
        expect(msg).toHaveProperty('content');
        expect(msg).toHaveProperty('sent_at');
      }
    });

    it('Siswa N5 can send a message with Japanese kanji, hiragana, and romaji', async () => {
      const japaneseText = '先生、質問があります。宿題の提出期限は何時までですか？ (Sensei, shitsumon ga arimasu)';

      const res = await request(BASE_URL)
        .post('/api/n5/chat/send')
        .set(authHeader(MOCK_USERS.siswaN5, 'kelas.kondangsensei.my.id'))
        .send({
          classId: 'cls_batch1_n5',
          content: japaneseText,
          messageType: 'text'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message.content).toBe(japaneseText);
      expect(res.body.message.sender_id).toBe(MOCK_USERS.siswaN5.userId);
    });

    it('Sensei can pin an important class announcement message', async () => {
      const res = await request(BASE_URL)
        .post('/api/teacher/chat/pin-message')
        .set(authHeader(MOCK_USERS.sensei, 'kelas.kondangsensei.my.id'))
        .send({
          classId: 'cls_batch1_n5',
          messageId: 'msg_announcement_001',
          isPinned: true
        });

      expect(res.status).toBe(200);
      expect(res.body.isPinned).toBe(true);
    });
  });

  describe('Edge Cases: Room Isolation & File Size Limits', () => {
    it('Siswa from Batch 1 cannot read or send messages in Batch 2 chat room', async () => {
      const res = await request(BASE_URL)
        .get('/api/n5/chat/messages?classId=cls_batch2_n5')
        .set(authHeader(MOCK_USERS.siswaN5, 'kelas.kondangsensei.my.id'));

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Anda bukan anggota room kelas ini/i);
    });

    it('should reject chat file attachments exceeding 10 MB with 413 Payload Too Large', async () => {
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024, 0x33); // 11 MB

      const res = await request(BASE_URL)
        .post('/api/n5/chat/upload-attachment')
        .set(authHeader(MOCK_USERS.siswaN5, 'kelas.kondangsensei.my.id'))
        .attach('attachment', largeBuffer, {
          filename: 'oversize_doc.pdf',
          contentType: 'application/pdf'
        })
        .field('classId', 'cls_batch1_n5');

      expect(res.status).toBe(413);
      expect(res.body.error).toMatch(/Maksimal ukuran lampiran chat 10 MB/i);
    });
  });

  describe('RBAC Authorization: Chat Moderation Privileges', () => {
    it('Regular students cannot pin messages (Only Sensei or Super Admin)', async () => {
      const res = await request(BASE_URL)
        .post('/api/teacher/chat/pin-message')
        .set(authHeader(MOCK_USERS.siswaN5, 'kelas.kondangsensei.my.id'))
        .send({
          classId: 'cls_batch1_n5',
          messageId: 'msg_001',
          isPinned: true
        });

      expect(res.status).toBe(403);
    });

    it('Peserta JFT without N5 package is FORBIDDEN from accessing classroom chat', async () => {
      const res = await request(BASE_URL)
        .get('/api/n5/chat/messages?classId=cls_batch1_n5')
        .set(authHeader(MOCK_USERS.pesertaJFT, 'kelas.kondangsensei.my.id'));

      expect(res.status).toBe(403);
    });
  });
});
