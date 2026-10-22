'use client';

import React, { useState, useRef } from 'react';
import { User } from '../types';
import { DEFAULT_ANONYMOUS_PHOTO } from '../lib/dataStore';
import {
  UserCheck,
  Camera,
  Save,
  X,
  Globe,
  Calendar,
  FileBadge,
  CheckCircle,
  AlertCircle,
  Upload,
  Loader2
} from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUpdateUser: (updatedUser: User) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateUser
}) => {
  const [name, setName] = useState(user.name || '');
  const [registrationNumber, setRegistrationNumber] = useState(user.registrationNumber || 'JFT-2026-88912');
  const [nationality, setNationality] = useState(user.nationality || 'INDONESIA');
  const [dateOfBirth, setDateOfBirth] = useState(user.dateOfBirth || '2001/05/14');
  const [sex, setSex] = useState(user.sex || 'MALE');
  const [facePhotoUrl, setFacePhotoUrl] = useState(
    user.facePhotoUrl && !user.facePhotoUrl.includes('unsplash.com') ? user.facePhotoUrl : ''
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state whenever modal opens or user prop updates
  React.useEffect(() => {
    if (isOpen && user) {
      setName(user.name || '');
      setRegistrationNumber(user.registrationNumber || 'JFT-2026-88912');
      setNationality(user.nationality || 'INDONESIA');
      setDateOfBirth(user.dateOfBirth || '2001/05/14');
      setSex(user.sex || 'MALE');
      setFacePhotoUrl(
        user.facePhotoUrl && !user.facePhotoUrl.includes('unsplash.com') ? user.facePhotoUrl : ''
      );
      setStatusMessage(null);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStatusMessage({ type: 'error', text: 'Pilih file gambar yang valid (JPG, PNG, WebP).' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setStatusMessage({ type: 'error', text: 'Ukuran foto maksimal 5MB.' });
      return;
    }

    setIsUploading(true);
    setStatusMessage(null);

    try {
      const formData = new FormData();
      formData.append('photo', file);

      const res = await fetch('/api/user/upload-photo', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (data.success && data.url) {
        setFacePhotoUrl(data.url);

        // Auto-save immediately to profile
        try {
          const saveRes = await fetch('/api/user/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: user.id,
              name,
              registrationNumber,
              nationality,
              dateOfBirth,
              sex,
              facePhotoUrl: data.url
            })
          });
          const saveData = await saveRes.json();
          if (saveData.success && saveData.user) {
            onUpdateUser(saveData.user);
            setStatusMessage({ type: 'success', text: 'Foto berhasil diunggah & langsung diterapkan ke profil!' });
            return;
          }
        } catch {
          // fallback
        }

        setStatusMessage({ type: 'success', text: 'Foto berhasil diunggah! Jangan lupa klik Simpan.' });
      } else {
        setStatusMessage({ type: 'error', text: data.message || 'Gagal mengunggah foto.' });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMessage({ type: 'error', text: 'Gagal upload foto: ' + msg });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    setFacePhotoUrl('');
    try {
      const saveRes = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          name,
          registrationNumber,
          nationality,
          dateOfBirth,
          sex,
          facePhotoUrl: ''
        })
      });
      const saveData = await saveRes.json();
      if (saveData.success && saveData.user) {
        onUpdateUser(saveData.user);
        setStatusMessage({ type: 'success', text: 'Foto kustom dihapus. Profil kembali menggunakan siluet anonim.' });
      }
    } catch {
      setStatusMessage({ type: 'success', text: 'Foto disetel ke siluet anonim.' });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          name,
          registrationNumber,
          nationality,
          dateOfBirth,
          sex,
          facePhotoUrl
        })
      });

      const data = await res.json();
      if (data.success && data.user) {
        setStatusMessage({ type: 'success', text: data.message || 'Profil berhasil disimpan!' });
        onUpdateUser(data.user);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setStatusMessage({ type: 'error', text: data.message || 'Gagal menyimpan profil.' });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMessage({ type: 'error', text: 'Koneksi gagal: ' + msg });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 bg-white border-b border-stone-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-red-600 flex items-center justify-center font-bold shadow-2xs">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-stone-900 leading-tight">
                Profil Peserta & Sertifikat JFT
              </h2>
              <p className="text-xs text-stone-500">
                Data resmi yang tercetak pada Rapor Hasil Ujian
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-red-700'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            {/* Photo Upload & Preview */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex items-center gap-4">
              <div className="relative group shrink-0">
                <img
                  src={facePhotoUrl && !facePhotoUrl.includes('unsplash.com') ? facePhotoUrl : DEFAULT_ANONYMOUS_PHOTO}
                  alt="Foto Peserta"
                  className="w-20 h-24 rounded-xl object-cover border border-stone-300 shadow-2xs bg-white"
                />
                {isUploading && (
                  <div className="absolute inset-0 bg-stone-900/60 rounded-xl flex items-center justify-center text-white">
                    <Loader2 className="w-6 h-6 animate-spin text-red-400" />
                  </div>
                )}
              </div>

              <div className="space-y-2 flex-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-stone-700 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-red-600" />
                    Pasfoto Formal (3x4):
                  </label>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    facePhotoUrl && !facePhotoUrl.includes('unsplash.com')
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-stone-200 text-stone-600'
                  }`}>
                    {facePhotoUrl && !facePhotoUrl.includes('unsplash.com') ? 'Foto Kustom' : 'Siluet Anonim'}
                  </span>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="py-2 px-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition text-xs shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploading ? 'Mengunggah...' : 'Unggah Foto Baru'}</span>
                  </button>

                  {facePhotoUrl && !facePhotoUrl.includes('unsplash.com') && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="py-2 px-2.5 bg-stone-100 hover:bg-rose-50 text-stone-600 hover:text-red-700 font-bold rounded-xl transition text-xs border border-stone-200 cursor-pointer"
                    >
                      Gunakan Siluet Anonim
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Nama Lengkap */}
            <div className="space-y-1">
              <label className="font-bold text-stone-700">Nama Lengkap (Huruf Romawi):</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white"
              />
            </div>

            {/* Nomor Registrasi */}
            <div className="space-y-1">
              <label className="font-bold text-stone-700">Nomor Registrasi Ujian (Registration No.):</label>
              <input
                type="text"
                required
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white"
              />
            </div>

            {/* Kewarganegaraan & Jenis Kelamin */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-stone-700">Kewarganegaraan:</label>
                <input
                  type="text"
                  required
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value.toUpperCase())}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">Jenis Kelamin:</label>
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white cursor-pointer"
                >
                  <option value="MALE">Laki-laki (MALE)</option>
                  <option value="FEMALE">Perempuan (FEMALE)</option>
                </select>
              </div>
            </div>

            {/* Tanggal Lahir */}
            <div className="space-y-1">
              <label className="font-bold text-stone-700">Tanggal Lahir (YYYY/MM/DD):</label>
              <input
                type="text"
                required
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                placeholder="2001/05/14"
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan Profil'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
