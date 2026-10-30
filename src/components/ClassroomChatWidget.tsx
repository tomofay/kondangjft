'use client';

import React, { useState, useEffect, useRef } from 'react';

export interface ChatMessageUI {
  id: string;
  sender_id: string;
  senderName: string;
  role: 'sensei' | 'siswa_n5' | 'super_admin';
  content: string;
  messageType: 'text' | 'image' | 'audio' | 'document' | 'system_announcement';
  is_pinned: boolean;
  sent_at: string;
  attachment?: {
    fileName: string;
    fileUrl: string;
    fileSizeKb: number;
    mimeType: string;
  };
}

interface ClassroomChatWidgetProps {
  classId?: string;
  currentUserId?: string;
  currentUserRole?: string;
  currentUserName?: string;
}

export function ClassroomChatWidget({
  classId = 'cls_batch1_n5',
  currentUserId = 'usr_siswa_001',
  currentUserRole = 'siswa_n5',
  currentUserName = 'Budi Pratama'
}: ClassroomChatWidgetProps) {
  const [messages, setMessages] = useState<ChatMessageUI[]>([
    {
      id: 'msg_announcement_001',
      sender_id: 'usr_sensei_001',
      senderName: 'Tanaka Sensei',
      role: 'sensei',
      content: 'Selamat datang di kelas N5 Batch 1! Tugas Kaku Bab 1 sudah dapat dikumpulkan melalui menu tugas.',
      messageType: 'system_announcement',
      is_pinned: true,
      sent_at: '2026-10-30T09:00:00.000Z'
    },
    {
      id: 'msg_001',
      sender_id: 'usr_siswa_001',
      senderName: 'Budi Pratama',
      role: 'siswa_n5',
      content: '先生、質問があります。宿題の提出期限は何時までですか？ (Sensei, shitsumon ga arimasu)',
      messageType: 'text',
      is_pinned: false,
      sent_at: '2026-10-30T09:15:00.000Z'
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isSenseiOrAdmin = currentUserRole === 'sensei' || currentUserRole === 'super_admin';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const newMsg: ChatMessageUI = {
      id: `msg_${Date.now()}`,
      sender_id: currentUserId,
      senderName: currentUserName,
      role: (currentUserRole as any) || 'siswa_n5',
      content: inputText.trim(),
      messageType: 'text',
      is_pinned: false,
      sent_at: new Date().toISOString()
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTogglePin = (messageId: string, currentPinned: boolean) => {
    if (!isSenseiOrAdmin) return;
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, is_pinned: !currentPinned } : msg
      )
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);

    const MAX_SIZE = 10 * 1024 * 1024; // 10 MB limit
    if (file.size > MAX_SIZE) {
      setUploadError('Maksimal ukuran lampiran chat 10 MB. Ukuran file terlalu besar.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    setTimeout(() => {
      const newMsg: ChatMessageUI = {
        id: `msg_att_${Date.now()}`,
        sender_id: currentUserId,
        senderName: currentUserName,
        role: (currentUserRole as any) || 'siswa_n5',
        content: `Mengirim lampiran: ${file.name}`,
        messageType: 'document',
        is_pinned: false,
        sent_at: new Date().toISOString(),
        attachment: {
          fileName: file.name,
          fileUrl: URL.createObjectURL(file),
          fileSizeKb: Math.round(file.size / 1024),
          mimeType: file.type || 'application/octet-stream'
        }
      };

      setMessages((prev) => [...prev, newMsg]);
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }, 400);
  };

  const insertJapaneseChar = (char: string) => {
    setInputText((prev) => prev + char);
  };

  const pinnedMessage = messages.find((m) => m.is_pinned);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        width: isMinimized ? '280px' : '400px',
        height: isMinimized ? '48px' : '620px',
        background: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 20px 40px rgba(15, 23, 42, 0.18)',
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 9999,
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
      }}
    >
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          color: '#ffffff',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          borderBottom: '1px solid #334155'
        }}
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 8px #10b981'
            }}
          />
          <div>
            <div style={{ fontSize: '14px', fontWeight: '700' }}>
              Kelas N5 (Batch 1)
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              Maks 10 Siswa • Tanaka Sensei
            </div>
          </div>
        </div>
        <button
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            fontSize: '18px',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          {isMinimized ? '▲' : '▼'}
        </button>
      </div>

      {!isMinimized && (
        <>
          {/* Pinned Announcement Bar */}
          {pinnedMessage && (
            <div
              style={{
                background: '#eff6ff',
                borderBottom: '1px solid #bfdbfe',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                fontSize: '12px',
                color: '#1e40af'
              }}
            >
              <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '14px' }}>📌</span>
                <div>
                  <span style={{ fontWeight: '700' }}>{pinnedMessage.senderName}: </span>
                  <span>{pinnedMessage.content}</span>
                </div>
              </div>
              {isSenseiOrAdmin && (
                <button
                  onClick={() => handleTogglePin(pinnedMessage.id, true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    fontSize: '11px',
                    marginLeft: '8px'
                  }}
                  title="Lepas sematan"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {/* Messages Stream */}
          <div
            style={{
              flex: 1,
              padding: '16px',
              overflowY: 'auto',
              background: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            {messages.map((msg) => {
              const isMe = msg.sender_id === currentUserId;
              const isSenseiMsg = msg.role === 'sensei';

              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    alignSelf: isMe ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '11px',
                      color: '#64748b',
                      marginBottom: '3px'
                    }}
                  >
                    <span style={{ fontWeight: isSenseiMsg ? '700' : '500', color: isSenseiMsg ? '#1e40af' : '#64748b' }}>
                      {msg.senderName}
                    </span>
                    {isSenseiMsg && (
                      <span
                        style={{
                          background: '#1e3a8a',
                          color: '#ffffff',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          fontSize: '9px',
                          fontWeight: '700'
                        }}
                      >
                        SENSEI
                      </span>
                    )}
                    <span>
                      {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isSenseiOrAdmin && (
                      <button
                        onClick={() => handleTogglePin(msg.id, msg.is_pinned)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '11px',
                          padding: '0 2px',
                          color: msg.is_pinned ? '#f59e0b' : '#94a3b8'
                        }}
                        title={msg.is_pinned ? 'Lepas sematan' : 'Sematkan pesan'}
                      >
                        📌
                      </button>
                    )}
                  </div>

                  <div
                    style={{
                      background: isSenseiMsg
                        ? '#1e293b'
                        : isMe
                        ? '#2563eb'
                        : '#ffffff',
                      color: isSenseiMsg || isMe ? '#ffffff' : '#0f172a',
                      padding: '10px 14px',
                      borderRadius: isMe ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                      fontSize: '13px',
                      lineHeight: '1.5',
                      border: isSenseiMsg ? '1px solid #334155' : isMe ? 'none' : '1px solid #e2e8f0',
                      wordBreak: 'break-word'
                    }}
                  >
                    {msg.content}

                    {msg.attachment && (
                      <div
                        style={{
                          marginTop: '8px',
                          background: 'rgba(255, 255, 255, 0.15)',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '12px'
                        }}
                      >
                        <span>📎</span>
                        <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: '600' }}>{msg.attachment.fileName}</div>
                          <div style={{ fontSize: '10px', opacity: 0.85 }}>{msg.attachment.fileSizeKb} KB</div>
                        </div>
                        <a
                          href={msg.attachment.fileUrl}
                          download={msg.attachment.fileName}
                          style={{
                            color: '#ffffff',
                            textDecoration: 'underline',
                            fontSize: '11px',
                            fontWeight: '600'
                          }}
                        >
                          Unduh
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Japanese Characters Bar */}
          <div
            style={{
              padding: '6px 12px',
              background: '#f1f5f9',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              gap: '6px',
              alignItems: 'center',
              overflowX: 'auto'
            }}
          >
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>JP:</span>
            {['「', '」', '、', '。', '〜', '？', '！', '先生', '宿題', '質問'].map((item) => (
              <button
                key={item}
                onClick={() => insertJapaneseChar(item)}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  color: '#334155'
                }}
              >
                {item}
              </button>
            ))}
          </div>

          {/* Upload Error Alert */}
          {uploadError && (
            <div
              style={{
                background: '#fee2e2',
                color: '#991b1b',
                padding: '6px 12px',
                fontSize: '11px',
                borderTop: '1px solid #f87171'
              }}
            >
              ⚠️ {uploadError}
            </div>
          )}

          {/* Input & Action Footer */}
          <div
            style={{
              padding: '10px 12px',
              background: '#ffffff',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'flex-end',
              gap: '8px'
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              style={{
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '8px 10px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#475569'
              }}
              title="Kirim lampiran dokumen tugas (Maks 10 MB)"
            >
              {isUploading ? '⏳' : '📎'}
            </button>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tulis pesan atau pertanyaan... (Enter kirim)"
              rows={2}
              style={{
                flex: 1,
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '8px 10px',
                fontSize: '13px',
                fontFamily: 'inherit',
                resize: 'none',
                outline: 'none'
              }}
            />

            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim()}
              style={{
                background: inputText.trim() ? '#2563eb' : '#94a3b8',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 14px',
                fontWeight: '700',
                fontSize: '13px',
                cursor: inputText.trim() ? 'pointer' : 'not-allowed',
                transition: 'background 0.2s ease'
              }}
            >
              Kirim
            </button>
          </div>
        </>
      )}
    </div>
  );
}
export default ClassroomChatWidget;
