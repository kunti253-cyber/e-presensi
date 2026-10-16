import React from 'react';
import { 
  LayoutDashboard, 
  UserPlus, 
  QrCode, 
  ScanLine, 
  ClipboardList, 
  Settings, 
  LogOut, 
  School,
  Database,
  Radio
} from 'lucide-react';
import { AppSettings } from '../types';

export type NavTab = 'dashboard' | 'students' | 'print-qr' | 'scan-qr' | 'rekap' | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  settings: AppSettings;
  adminUsername: string;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  settings,
  adminUsername,
  onLogout,
}) => {
  const menuItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students' as NavTab, label: 'Input Data Siswa', icon: UserPlus },
    { id: 'print-qr' as NavTab, label: 'Cetak QR Code', icon: QrCode },
    { id: 'scan-qr' as NavTab, label: 'Scan QR Code', icon: ScanLine },
    { id: 'rekap' as NavTab, label: 'Rekap Absensi', icon: ClipboardList },
    { id: 'settings' as NavTab, label: 'Pengaturan', icon: Settings },
  ];

  return (
    <aside className="no-print w-64 bg-white border-r border-slate-200/80 flex flex-col shrink-0 h-screen sticky top-0">
      {/* Brand & Logo Area */}
      <div className="p-4 border-b border-slate-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm overflow-hidden border border-slate-100">
          {settings.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt="Logo Instansi"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <School className="w-5 h-5 text-white" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-xs font-bold text-slate-900 tracking-tight leading-snug truncate uppercase">
            {settings.adminPanelTitle || 'ADMIN PANEL'}
          </h2>
          <p className="text-[11px] text-slate-500 truncate">
            {settings.schoolName || 'Sistem Terpusat'}
          </p>
        </div>
      </div>

      {/* Online Server Indicator */}
      <div className="px-4 py-2 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
          <span>Database Terpusat Aktif</span>
        </div>
        <span className="text-slate-400 font-mono text-[10px]">Server Sync</span>
      </div>

      {/* Navigation links */}
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Menu Utama
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors text-left ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span className="truncate">{item.label}</span>
              {item.id === 'scan-qr' && (
                <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded ${isActive ? 'bg-blue-500/50 text-white' : 'bg-blue-50 text-blue-600'}`}>
                  Live
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Admin Profile & Logout */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/70 shadow-2xs">
          <div className="min-w-0 pr-2">
            <div className="text-xs font-semibold text-slate-800 truncate">
              {adminUsername || 'Administrator'}
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              Role: Admin Penuh
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Keluar / Logout"
            className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
