import React from 'react';
import { NavTab } from './Sidebar';
import { AppSettings } from '../types';
import { ScanLine, Calendar, User, Clock } from 'lucide-react';

interface HeaderProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  settings: AppSettings;
  adminUsername: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  settings,
  adminUsername,
}) => {
  const getTabTitle = (tab: NavTab) => {
    switch (tab) {
      case 'dashboard':
        return 'Dashboard & Statistik Kehadiran';
      case 'students':
        return 'Input & Manajemen Data Siswa';
      case 'print-qr':
        return 'Cetak Kartu QR Code Siswa';
      case 'scan-qr':
        return 'Scan Kamera Langsung Siswa';
      case 'rekap':
        return 'Rekapitulasi Kehadiran & Ekspor';
      case 'settings':
        return 'Pengaturan Instansi & Admin Panel';
      default:
        return 'Absensi QR Code';
    }
  };

  const todayStr = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <header className="no-print h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between gap-8 shrink-0">
      {/* Zone 1: Current section / Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <h1 className="text-base font-bold text-slate-900 tracking-tight whitespace-nowrap">
          {getTabTitle(currentTab)}
        </h1>
        <span className="text-slate-300 hidden md:inline">/</span>
        <span className="text-xs text-slate-500 hidden md:inline truncate">
          {settings.schoolName || 'SD Negeri Harapan Bangsa'}
        </span>
      </div>

      {/* Zone 2: Date & School Identity */}
      <div className="hidden lg:flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60">
        <Calendar className="w-3.5 h-3.5 text-blue-600" />
        <span className="font-medium">{todayStr}</span>
        <span className="text-slate-300">·</span>
        <Clock className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-500">Batas Terlambat: {settings.lateTimeThreshold || '07:15'} WIB</span>
      </div>

      {/* Zone 3: Quick Action */}
      <div className="flex items-center gap-3 shrink-0">
        {currentTab !== 'scan-qr' && (
          <button
            onClick={() => onTabChange('scan-qr')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer whitespace-nowrap"
          >
            <ScanLine className="w-4 h-4" />
            <span>Mulai Scan Kamera</span>
          </button>
        )}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 text-xs text-slate-700">
          <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
            <User className="w-3.5 h-3.5" />
          </div>
          <span className="font-medium hidden sm:inline">{adminUsername}</span>
        </div>
      </div>
    </header>
  );
};
