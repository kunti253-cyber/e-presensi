import React, { useState, useRef } from 'react';
import { 
  Settings, 
  School, 
  Upload, 
  Trash2, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  Database,
  Award,
  Clock,
  Building,
  KeyRound
} from 'lucide-react';
import { api } from '../services/api';
import { AppSettings } from '../types';

interface SettingsViewProps {
  settings: AppSettings;
  onSettingsUpdate: (newSettings: AppSettings) => void;
  adminUsername: string;
  onAdminUsernameChange: (newUsername: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSettingsUpdate,
  adminUsername,
  onAdminUsernameChange,
}) => {
  // Settings Form State
  const [formData, setFormData] = useState<AppSettings>({ ...settings });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsStatus, setSettingsStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Logo Upload State
  const [logoPreview, setLogoPreview] = useState<string | null>(settings.logoUrl);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Admin Credentials State
  const [credForm, setCredForm] = useState({
    currentPassword: '',
    newUsername: adminUsername || 'admin',
    newPassword: '',
    confirmPassword: '',
  });
  const [isSavingCreds, setIsSavingCreds] = useState(false);
  const [credStatus, setCredStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Handle General Settings Save
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setSettingsStatus(null);

    try {
      const res = await api.updateSettings({
        adminPanelTitle: formData.adminPanelTitle.trim(),
        schoolName: formData.schoolName.trim(),
        schoolAddress: formData.schoolAddress.trim(),
        npsn: formData.npsn.trim(),
        headmaster: formData.headmaster.trim(),
        academicYear: formData.academicYear.trim(),
        lateTimeThreshold: formData.lateTimeThreshold.trim(),
        logoUrl: logoPreview,
      });

      if (res.success) {
        onSettingsUpdate(res.settings);
        setSettingsStatus({ type: 'success', message: 'Identitas instansi dan pengaturan berhasil disimpan di server terpusat!' });
      }
    } catch (err: unknown) {
      setSettingsStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal menyimpan pengaturan.',
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Handle Logo File Selection
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file logo terlalu besar. Maksimal 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setLogoPreview(base64);
      setIsUploadingLogo(true);
      try {
        const res = await api.uploadLogo(base64);
        if (res.success) {
          onSettingsUpdate({ ...settings, logoUrl: res.logoUrl });
          setSettingsStatus({ type: 'success', message: 'Foto logo instansi berhasil diunggah ke server!' });
        }
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : 'Gagal mengunggah logo.');
      } finally {
        setIsUploadingLogo(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Delete Logo
  const handleDeleteLogo = async () => {
    if (!window.confirm('Hapus foto logo instansi?')) return;
    try {
      await api.deleteLogo();
      setLogoPreview(null);
      onSettingsUpdate({ ...settings, logoUrl: null });
      if (fileInputRef.current) fileInputRef.current.value = '';
      setSettingsStatus({ type: 'success', message: 'Foto logo berhasil dihapus.' });
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Change Admin Credentials
  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredStatus(null);

    if (credForm.newPassword !== credForm.confirmPassword) {
      setCredStatus({ type: 'error', message: 'Konfirmasi password baru tidak cocok!' });
      return;
    }

    if (credForm.newPassword.length < 4) {
      setCredStatus({ type: 'error', message: 'Password baru minimal 4 karakter.' });
      return;
    }

    setIsSavingCreds(true);
    try {
      const res = await api.changeCredentials(
        credForm.currentPassword,
        credForm.newUsername.trim(),
        credForm.newPassword
      );

      if (res.success) {
        onAdminUsernameChange(res.username);
        setCredStatus({
          type: 'success',
          message: 'Kredensial admin server berhasil diperbarui! Gunakan password baru ini saat login.',
        });
        setCredForm({
          currentPassword: '',
          newUsername: res.username,
          newPassword: '',
          confirmPassword: '',
        });
      }
    } catch (err: unknown) {
      setCredStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal memperbarui password admin.',
      });
    } finally {
      setIsSavingCreds(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* View Header */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Pengaturan Instansi & Panel Admin
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola judul admin panel, identitas sekolah, logo instansi, serta kredensial akun admin terpusat.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 1: LOGO INSTANSI UPLOAD */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Upload className="w-4 h-4 text-blue-600" />
            <span>Upload Foto Logo Instansi</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Logo ini akan ditampilkan pada Admin Panel, Kartu QR Siswa, dan Halaman Login.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
          {/* Logo Preview Frame */}
          <div className="relative w-28 h-28 rounded-2xl border-2 border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shadow-2xs shrink-0 group">
            {logoPreview ? (
              <img
                src={logoPreview}
                alt="Logo Instansi"
                className="w-full h-full object-contain p-2"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="text-center p-3 text-slate-400">
                <School className="w-8 h-8 mx-auto mb-1 text-slate-300" />
                <span className="text-[10px] block">Belum ada logo</span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="space-y-3 flex-1 text-center sm:text-left">
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoFileChange}
                className="hidden"
                id="logo-file-input"
              />
              <label
                htmlFor="logo-file-input"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>{logoPreview ? 'Ganti Foto Logo' : 'Unggah Foto Logo Baru'}</span>
              </label>

              {logoPreview && (
                <button
                  type="button"
                  onClick={handleDeleteLogo}
                  className="ml-2 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Logo</span>
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Format yang disarankan: PNG transparan atau JPG, rasio 1:1, ukuran maksimal 5 MB.
            </p>
            {isUploadingLogo && (
              <p className="text-xs text-blue-600 font-medium">Sedang mengunggah dan menyimpan logo...</p>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: IDENTITAS INSTANSI & JUDUL ADMIN PANEL */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs">
        <div className="border-b border-slate-100 pb-3 mb-5">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Building className="w-4 h-4 text-blue-600" />
            <span>Judul Admin Panel & Identitas Instansi</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Sesuaikan nama sistem dan profil sekolah untuk kartu presensi dan laporan rekap.
          </p>
        </div>

        {settingsStatus && (
          <div
            className={`mb-4 p-3 rounded-lg text-xs flex items-center gap-2 ${
              settingsStatus.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                : 'bg-rose-50 border border-rose-200 text-rose-700'
            }`}
          >
            {settingsStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{settingsStatus.message}</span>
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Judul Header 'Admin Panel' (Kustom) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.adminPanelTitle}
              onChange={(e) => setFormData({ ...formData, adminPanelTitle: e.target.value })}
              placeholder="Contoh: ADMIN PANEL ABSENSI SISWA"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold text-slate-900"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Judul ini akan tampil di bagian atas menu samping dan halaman login.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Sekolah / Instansi <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.schoolName}
                onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                placeholder="Contoh: SD NEGERI HARAPAN BANGSA"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                NPSN (Nomor Pokok Sekolah Nasional)
              </label>
              <input
                type="text"
                value={formData.npsn}
                onChange={(e) => setFormData({ ...formData, npsn: e.target.value })}
                placeholder="Contoh: 20234567"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 font-mono text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Alamat Lengkap Instansi
            </label>
            <input
              type="text"
              value={formData.schoolAddress}
              onChange={(e) => setFormData({ ...formData, schoolAddress: e.target.value })}
              placeholder="Contoh: Jl. Pendidikan Mandiri No. 12, Kota Cerdas"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 text-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Kepala Sekolah / Pimpinan
              </label>
              <input
                type="text"
                value={formData.headmaster}
                onChange={(e) => setFormData({ ...formData, headmaster: e.target.value })}
                placeholder="Contoh: H. Suherman, S.Pd., M.M."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tahun Ajaran Aktif
              </label>
              <input
                type="text"
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                placeholder="Contoh: 2024/2025"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 font-mono text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Batas Jam Masuk (Terlambat)
              </label>
              <input
                type="time"
                value={formData.lateTimeThreshold}
                onChange={(e) => setFormData({ ...formData, lateTimeThreshold: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 font-mono text-slate-900"
              />
              <span className="text-[10px] text-slate-400">Scan setelah jam ini ditandai Terlambat</span>
            </div>
          </div>

          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              disabled={isSavingSettings}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingSettings ? 'Menyimpan ke Server...' : 'Simpan Pengaturan Instansi'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 3: KREDENSIAL AKUN ADMIN SERVER (LOGIN PASSWORD KUSTOM) */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs">
        <div className="border-b border-slate-100 pb-3 mb-5">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-blue-600" />
            <span>Keamanan Akun Admin (Password Kustom)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Autentikasi admin server terpusat. Kredensial baru ini berlaku untuk login dari semua perangkat.
          </p>
        </div>

        {credStatus && (
          <div
            className={`mb-4 p-3 rounded-lg text-xs flex items-center gap-2 ${
              credStatus.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                : 'bg-rose-50 border border-rose-200 text-rose-700'
            }`}
          >
            {credStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{credStatus.message}</span>
          </div>
        )}

        <form onSubmit={handleSaveCredentials} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Username Admin Baru
              </label>
              <input
                type="text"
                required
                value={credForm.newUsername}
                onChange={(e) => setCredForm({ ...credForm, newUsername: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Password Saat Ini (Password Lama) <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                required
                value={credForm.currentPassword}
                onChange={(e) => setCredForm({ ...credForm, currentPassword: e.target.value })}
                placeholder="Masukkan password admin saat ini"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Password Baru <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                required
                value={credForm.newPassword}
                onChange={(e) => setCredForm({ ...credForm, newPassword: e.target.value })}
                placeholder="Minimal 4 karakter"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Ulangi Password Baru <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                required
                value={credForm.confirmPassword}
                onChange={(e) => setCredForm({ ...credForm, confirmPassword: e.target.value })}
                placeholder="Ketik ulang password baru"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 text-slate-900"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSavingCreds}
              className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold transition-colors cursor-pointer"
            >
              {isSavingCreds ? 'Memperbarui Akun...' : 'Perbarui Kredensial Admin'}
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 4: LEGALITAS & HAK CIPTA */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Hak Cipta & Legalitas Pengembang
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Sistem Absensi QR Code Siswa ini dilindungi hak legalitas dan dikembangkan secara resmi oleh:
            </p>
            <div className="mt-3 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-900 font-bold font-mono text-xs">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>{settings.legalCopyright}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Legalitas ini terpampang secara permanen di pojok kanan bawah seluruh antarmuka aplikasi sebagai identitas resmi pengembang.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
