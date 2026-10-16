import React, { useEffect, useState } from 'react';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  HelpCircle, 
  ScanLine, 
  QrCode, 
  UserPlus, 
  FileSpreadsheet,
  ArrowUpRight,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { DashboardStats, AppSettings } from '../types';
import { NavTab } from '../components/Sidebar';

interface DashboardViewProps {
  settings: AppSettings;
  onNavigate: (tab: NavTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ settings, onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Auto refresh every 20 seconds for multi-device sync
    const interval = setInterval(fetchStats, 20000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading && !stats) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-xs font-medium">Memuat data statistik server terpusat...</p>
        </div>
      </div>
    );
  }

  const s = stats || {
    today: new Date().toISOString().split('T')[0],
    totalStudents: 0,
    hadir: 0,
    terlambat: 0,
    sakit: 0,
    izin: 0,
    alpa: 0,
    belumAbsen: 0,
    attendanceRate: 0,
    classes: [],
    classStats: [],
    recentScans: [],
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-blue-600 font-semibold uppercase tracking-wider mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>Sistem Online Terpusat</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Selamat Datang di {settings.adminPanelTitle || 'Admin Panel Absensi'}
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Pantau kehadiran siswa secara real-time dari seluruh perangkat. Batas jam masuk tepat waktu diset pukul{' '}
            <span className="font-semibold text-slate-700">{settings.lateTimeThreshold || '07:15'} WIB</span>.
          </p>
        </div>
        <div className="flex items-center gap-2 self-stretch md:self-auto shrink-0">
          <button
            onClick={fetchStats}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Segarkan Data</span>
          </button>
          <button
            onClick={() => onNavigate('scan-qr')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <ScanLine className="w-4 h-4" />
            <span>Buka Scanner Kamera</span>
          </button>
        </div>
      </div>

      {/* Main KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Total Siswa */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Total Siswa</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {s.totalStudents}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Terdaftar aktif</div>
        </div>

        {/* Hadir Tepat Waktu */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-xs font-medium">Tepat Waktu</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 font-mono tabular-nums">
            {s.hadir}
          </div>
          <div className="text-[11px] text-emerald-600/80 mt-1">Sebelum batas</div>
        </div>

        {/* Terlambat */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-xs font-medium">Terlambat</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-700 font-mono tabular-nums">
            {s.terlambat}
          </div>
          <div className="text-[11px] text-amber-600/80 mt-1">Lewat batas</div>
        </div>

        {/* Sakit */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-indigo-600 mb-2">
            <span className="text-xs font-medium">Sakit</span>
            <AlertTriangle className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-indigo-700 font-mono tabular-nums">
            {s.sakit}
          </div>
          <div className="text-[11px] text-indigo-600/80 mt-1">Surat dokter/wali</div>
        </div>

        {/* Izin */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-cyan-600 mb-2">
            <span className="text-xs font-medium">Izin</span>
            <HelpCircle className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-2xl font-bold text-cyan-700 font-mono tabular-nums">
            {s.izin}
          </div>
          <div className="text-[11px] text-cyan-600/80 mt-1">Izin resmi</div>
        </div>

        {/* Alpa */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-rose-600 mb-2">
            <span className="text-xs font-medium">Alpa</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-700 font-mono tabular-nums">
            {s.alpa}
          </div>
          <div className="text-[11px] text-rose-600/80 mt-1">Tanpa keterangan</div>
        </div>

        {/* Belum Absen */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Belum Scan</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-700 font-mono tabular-nums">
            {s.belumAbsen}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Siswa menunggu</div>
        </div>
      </div>

      {/* Two column grid: Class Progress & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Class Progress (1 col) */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Tingkat Kehadiran per Kelas
            </h3>
            <span className="text-xs font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              Hari Ini
            </span>
          </div>

          <div className="space-y-4 flex-1">
            {s.classStats.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-8">
                Belum ada data siswa terdaftar.
              </div>
            ) : (
              s.classStats.map((item) => (
                <div key={item.kelas} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{item.kelas}</span>
                    <span className="font-mono text-slate-500">
                      {item.hadir} / {item.total} Siswa ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, item.percentage)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Persentase Total Hadir:</span>
              <span className="font-bold text-slate-900 font-mono text-sm">
                {s.attendanceRate}%
              </span>
            </div>
          </div>
        </div>

        {/* Live Scans Feed (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Riwayat Absensi Terkini (Hari Ini)
              </h3>
              <p className="text-xs text-slate-500">
                Data real-time yang tersimpan pada server terpusat.
              </p>
            </div>
            <button
              onClick={() => onNavigate('rekap')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Lihat Rekap Lengkap</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 text-slate-400 font-medium">
                  <th className="py-2.5 px-3">Jam Scan</th>
                  <th className="py-2.5 px-3">NIS</th>
                  <th className="py-2.5 px-3">Nama Siswa</th>
                  <th className="py-2.5 px-3">Kelas</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Metode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {s.recentScans.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Belum ada aktivitas absensi tercatat hari ini. Gunakan menu Scan QR Code untuk mulai.
                    </td>
                  </tr>
                ) : (
                  s.recentScans.map((att) => {
                    let statusBg = 'bg-slate-100 text-slate-700';
                    if (att.status === 'Hadir') statusBg = 'bg-emerald-50 text-emerald-700 border border-emerald-200/60';
                    if (att.status === 'Terlambat') statusBg = 'bg-amber-50 text-amber-700 border border-amber-200/60';
                    if (att.status === 'Sakit') statusBg = 'bg-indigo-50 text-indigo-700 border border-indigo-200/60';
                    if (att.status === 'Izin') statusBg = 'bg-cyan-50 text-cyan-700 border border-cyan-200/60';
                    if (att.status === 'Alpa') statusBg = 'bg-rose-50 text-rose-700 border border-rose-200/60';

                    return (
                      <tr key={att.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-slate-600 tabular-nums">
                          {att.time}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">
                          {att.nis}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {att.nama}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {att.kelas}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${statusBg}`}>
                            {att.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                          {att.method === 'QR_SCAN' ? 'Scan Kamera' : 'Manual Admin'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button
          onClick={() => onNavigate('scan-qr')}
          className="p-4 rounded-xl bg-white border border-slate-200/80 hover:border-blue-400 hover:shadow-sm transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <ScanLine className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">Scan QR Code Kamera</h4>
          <p className="text-xs text-slate-500 mt-1">
            Gunakan kamera laptop atau ponsel untuk mencatat presensi siswa secara instan.
          </p>
        </button>

        <button
          onClick={() => onNavigate('students')}
          className="p-4 rounded-xl bg-white border border-slate-200/80 hover:border-blue-400 hover:shadow-sm transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <UserPlus className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">Input Data Siswa</h4>
          <p className="text-xs text-slate-500 mt-1">
            Tambah data siswa satuan atau unggah massal melalui file Excel / CSV.
          </p>
        </button>

        <button
          onClick={() => onNavigate('print-qr')}
          className="p-4 rounded-xl bg-white border border-slate-200/80 hover:border-blue-400 hover:shadow-sm transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:bg-purple-600 group-hover:text-white transition-colors">
            <QrCode className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">Cetak Kartu QR Siswa</h4>
          <p className="text-xs text-slate-500 mt-1">
            Cetak kartu pelajar ber-QR code untuk dibagikan kepada masing-masing siswa.
          </p>
        </button>

        <button
          onClick={() => onNavigate('rekap')}
          className="p-4 rounded-xl bg-white border border-slate-200/80 hover:border-blue-400 hover:shadow-sm transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:bg-amber-600 group-hover:text-white transition-colors">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">Rekapitulasi & Ekspor</h4>
          <p className="text-xs text-slate-500 mt-1">
            Filter rekapitulasi per tanggal atau kelas, dan unduh ke format Excel (.xlsx).
          </p>
        </button>
      </div>
    </div>
  );
};
