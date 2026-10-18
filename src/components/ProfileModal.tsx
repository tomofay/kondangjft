'use client';

import React, { useState, useRef } from 'react';
import { User } from '../types';
import { UserCheck, Camera, Save, X, Globe, Calendar, FileBadge, CheckCircle, AlertCircle, Upload, Loader2 } from 'lucide-react';

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
  const [facePhotoUrl, setFacePhotoUrl] = useState(user.facePhotoUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        setStatusMessage({ type: 'success', text: 'Foto berhasil diunggah! Jangan lupa simpan profil.' });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl max-w-xl w-full p-4 sm:p-6 md:p-8 shadow-2xl space-y-4 sm:space-y-6 my-4 sm:my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between border-b pb-3 sm:pb-4 border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 sm:p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
                <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />
              </span>
              <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Profil Peserta & Sertifikat
              </h2>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1">
              Sesuaikan data peserta yang akan dicetak pada <b>Rapor Sertifikat JFT-Basic</b>.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {statusMessage && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-red-50 dark:bg-red-950/80 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* Photo Upload & Preview */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative group shrink-0">
              <img
                src={facePhotoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                alt="Foto Peserta"
                className="w-20 h-24 rounded-xl object-cover border-2 border-slate-300 dark:border-slate-700 shadow-sm bg-slate-200"
              />
              {isUploading && (
                <div className="absolute inset-0 bg-slate-950/70 rounded-xl flex items-center justify-center text-white">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                </div>
              )}
            </div>

            <div className="flex-1 space-y-2 w-full">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-indigo-500" />
                  Foto Formal Wajah (Pasfoto 3x4):
                </label>
              </div>

              {/* Upload Button & Hidden Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-1.5 transition text-xs shadow-sm shadow-indigo-600/30 disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Mengunggah...
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      Pilih & Upload Foto
                    </>
                  )}
                </button>

                {facePhotoUrl && (
                  <button
                    type="button"
                    onClick={() => setFacePhotoUrl('')}
                    className="px-2.5 py-2 text-slate-500 hover:text-red-500 dark:hover:text-red-400 text-xs transition"
                  >
                    Hapus Foto
                  </button>
                )}
              </div>

              <div className="pt-1">
                <input
                  type="text"
                  value={facePhotoUrl}
                  onChange={(e) => setFacePhotoUrl(e.target.value)}
                  placeholder="Atau tempel URL foto..."
                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <p className="text-[10px] text-slate-400">
                Format foto JPG, PNG, atau WebP (maks. 5MB). Otomatis tampil di sertifikat resmi JFT.
              </p>
            </div>
          </div>

          {/* Nama Lengkap & No Registrasi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                氏名 / Nama Lengkap Peserta:
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Budi Pratama"
                className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <FileBadge className="w-3.5 h-3.5 text-amber-500" />
                受験番号 / No. Registrasi (Reg No):
              </label>
              <input
                type="text"
                required
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                placeholder="Contoh: JFT-2026-88912"
                className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Kewarganegaraan, Tanggal Lahir, Jenis Kelamin */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-blue-500" />
                国籍 / Kewarganegaraan:
              </label>
              <input
                type="text"
                required
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                placeholder="INDONESIA"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 uppercase font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-rose-500" />
                生年月日 / Tanggal Lahir:
              </label>
              <input
                type="text"
                required
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                placeholder="YYYY/MM/DD (2001/05/14)"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                性別 / Jenis Kelamin:
              </label>
              <select
                value={sex.toUpperCase()}
                onChange={(e) => setSex(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="MALE">Laki-laki (MALE)</option>
                <option value="FEMALE">Perempuan (FEMALE)</option>
              </select>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-extrabold shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Menyimpan ke MySQL...' : 'Simpan Data Sertifikat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
