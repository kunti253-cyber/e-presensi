import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, ShieldCheck, School, ArrowRight, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { AppSettings } from '../types';

interface LoginModalProps {
  settings: AppSettings;
  onLoginSuccess: (username: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ settings, onLoginSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await api.login(username.trim(), password);
      if (res.success) {
        onLoginSuccess(res.username);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Gagal masuk ke server. Periksa username dan password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header with School Branding */}
        <div className="px-6 pt-8 pb-6 bg-gradient-to-b from-blue-50/80 to-white border-b border-slate-100 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md mb-4 overflow-hidden border-2 border-white">
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={settings.schoolName}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <School className="w-8 h-8 text-white" />
            )}
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            {settings.adminPanelTitle || 'ADMIN PANEL ABSENSI SISWA'}
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            {settings.schoolName || 'Sistem Database Terpusat Sekolah'}
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100/60 text-blue-700 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Hak Akses Terbatas: Khusus Admin</span>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Username Admin
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username admin"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password Admin (Kustom)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password admin"
                className="w-full pl-9 pr-10 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-slate-900"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Password dapat diganti kapan saja melalui Menu Pengaturan.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm shadow-blue-500/20 transition-all disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <span>Memverifikasi Akun Server...</span>
              ) : (
                <>
                  <span>Masuk ke Admin Panel</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Preset hint box */}
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 text-[11px] text-slate-600 text-center">
            <span className="font-medium text-slate-700">Kredensial Default Awal:</span>{' '}
            <code className="px-1 py-0.5 rounded bg-slate-200/80 font-mono text-slate-800">admin</code> /{' '}
            <code className="px-1 py-0.5 rounded bg-slate-200/80 font-mono text-slate-800">admin123</code>
          </div>

          <div className="text-center pt-2 border-t border-slate-100">
            <p className="text-[11px] text-slate-400">
              Hak Cipta & Legalitas: <span className="font-medium text-slate-600 font-mono">{settings.legalCopyright}</span>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
