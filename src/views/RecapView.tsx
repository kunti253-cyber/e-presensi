import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  FileSpreadsheet, 
  Printer, 
  Search, 
  Filter, 
  Calendar, 
  Download, 
  Trash2, 
  Plus, 
  RefreshCw,
  X,
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { api } from '../services/api';
import { AttendanceRecord, AttendanceStatus, Student, AppSettings } from '../types';

interface RecapViewProps {
  settings: AppSettings;
}

export const RecapView: React.FC<RecapViewProps> = ({ settings }) => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [datePreset, setDatePreset] = useState<'today' | 'yesterday' | 'week' | 'month' | 'custom'>('today');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState('Semua');
  const [selectedStatus, setSelectedStatus] = useState('Semua');
  const [search, setSearch] = useState('');

  // Manual Attendance Modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualStudentId, setManualStudentId] = useState('');
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualStatus, setManualStatus] = useState<AttendanceStatus>('Hadir');
  const [manualNotes, setManualNotes] = useState('');
  const [isManualSubmitting, setIsManualSubmitting] = useState(false);

  // Fetch data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [attRes, stdRes] = await Promise.all([
        api.getAttendance({
          startDate: datePreset === 'custom' || datePreset === 'week' || datePreset === 'month' ? startDate : undefined,
          endDate: datePreset === 'custom' || datePreset === 'week' || datePreset === 'month' ? endDate : undefined,
          date: datePreset === 'today' || datePreset === 'yesterday' ? startDate : undefined,
          kelas: selectedClass,
          status: selectedStatus,
          search,
        }),
        api.getStudents(),
      ]);
      setRecords(attRes.records);
      setStudents(stdRes.students);
    } catch (err) {
      console.error('Failed to load attendance records:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate, selectedClass, selectedStatus, search]);

  // Handle Preset Change
  const handlePresetChange = (preset: 'today' | 'yesterday' | 'week' | 'month' | 'custom') => {
    setDatePreset(preset);
    const today = new Date();

    if (preset === 'today') {
      const t = today.toISOString().split('T')[0];
      setStartDate(t);
      setEndDate(t);
    } else if (preset === 'yesterday') {
      const y = new Date(today);
      y.setDate(today.getDate() - 1);
      const str = y.toISOString().split('T')[0];
      setStartDate(str);
      setEndDate(str);
    } else if (preset === 'week') {
      const w = new Date(today);
      w.setDate(today.getDate() - 7);
      setStartDate(w.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    } else if (preset === 'month') {
      const m = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(m.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    }
  };

  // Delete Record
  const handleDeleteRecord = async (id: string, nama: string) => {
    if (!window.confirm(`Hapus catatan absensi ${nama}?`)) return;
    try {
      await api.deleteAttendance(id);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Manual Attendance
  const handleManualAttendanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualStudentId) {
      alert('Pilih siswa terlebih dahulu.');
      return;
    }

    setIsManualSubmitting(true);
    try {
      await api.manualAttendance(manualStudentId, manualDate, manualStatus, manualNotes);
      setShowManualModal(false);
      setManualNotes('');
      fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal menyimpan absensi manual.');
    } finally {
      setIsManualSubmitting(false);
    }
  };

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    if (records.length === 0) {
      alert('Tidak ada data absensi untuk diekspor.');
      return;
    }

    const exportRows = records.map((r, i) => ({
      No: i + 1,
      Tanggal: r.date,
      Jam: r.time,
      NIS: r.nis,
      'Nama Siswa': r.nama,
      Kelas: r.kelas,
      Status: r.status,
      Metode: r.method === 'QR_SCAN' ? 'Scan QR' : 'Manual Admin',
      Keterangan: r.notes || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rekap Absensi');

    const fileName = `Rekap_Absensi_${settings.schoolName.replace(/\s+/g, '_')}_${startDate}_sd_${endDate}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // Export to CSV
  const handleExportCsv = () => {
    if (records.length === 0) {
      alert('Tidak ada data absensi untuk diekspor.');
      return;
    }

    const exportRows = records.map((r, i) => ({
      No: i + 1,
      Tanggal: r.date,
      Jam: r.time,
      NIS: r.nis,
      'Nama Siswa': r.nama,
      Kelas: r.kelas,
      Status: r.status,
      Metode: r.method === 'QR_SCAN' ? 'Scan QR' : 'Manual Admin',
      Keterangan: r.notes || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const csvOutput = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Rekap_Absensi_${startDate}_sd_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Recap report
  const handlePrint = () => {
    window.print();
  };

  // Calculate summary stats for the current filtered list
  const totalHadir = records.filter((r) => r.status === 'Hadir').length;
  const totalTerlambat = records.filter((r) => r.status === 'Terlambat').length;
  const totalSakit = records.filter((r) => r.status === 'Sakit').length;
  const totalIzin = records.filter((r) => r.status === 'Izin').length;
  const totalAlpa = records.filter((r) => r.status === 'Alpa').length;

  const classesList = Array.from(new Set(students.map((s) => s.kelas))).sort();

  return (
    <div className="space-y-6">
      {/* Control Filter Bar */}
      <div className="no-print bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-blue-600" />
              <span>Rekapitulasi Kehadiran Siswa</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pantau laporan absensi, filter rentang tanggal dan kelas, serta ekspor ke format Excel.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowManualModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-blue-600" />
              <span>Catat Absen Manual</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Ekspor Excel (.xlsx)</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Laporan</span>
            </button>
          </div>
        </div>

        {/* Date presets & date picker */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-semibold">
            <button
              onClick={() => handlePresetChange('today')}
              className={`px-3 py-1 rounded-md transition-colors ${
                datePreset === 'today' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hari Ini
            </button>
            <button
              onClick={() => handlePresetChange('yesterday')}
              className={`px-3 py-1 rounded-md transition-colors ${
                datePreset === 'yesterday' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kemarin
            </button>
            <button
              onClick={() => handlePresetChange('week')}
              className={`px-3 py-1 rounded-md transition-colors ${
                datePreset === 'week' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7 Hari Terakhir
            </button>
            <button
              onClick={() => handlePresetChange('month')}
              className={`px-3 py-1 rounded-md transition-colors ${
                datePreset === 'month' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bulan Ini
            </button>
            <button
              onClick={() => handlePresetChange('custom')}
              className={`px-3 py-1 rounded-md transition-colors ${
                datePreset === 'custom' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Rentang Kustom
            </button>
          </div>

          {datePreset === 'custom' && (
            <div className="flex items-center gap-2 text-xs">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-800"
              />
              <span className="text-slate-400">s/d</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-800"
              />
            </div>
          )}
        </div>

        {/* Secondary filters: Class, Status, Search */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Filter Kelas</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-700"
            >
              <option value="Semua">Semua Kelas</option>
              {classesList.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Filter Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-700"
            >
              <option value="Semua">Semua Status Kehadiran</option>
              <option value="Hadir">Hadir</option>
              <option value="Terlambat">Terlambat</option>
              <option value="Sakit">Sakit</option>
              <option value="Izin">Izin</option>
              <option value="Alpa">Alpa</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Cari Nama / NIS</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari siswa atau NIS..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 text-slate-900"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] text-slate-400">Total Tercatat</div>
          <div className="text-xl font-bold text-slate-900 font-mono tabular-nums">{records.length}</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] text-emerald-600 font-medium">Hadir Tepat</div>
          <div className="text-xl font-bold text-emerald-700 font-mono tabular-nums">{totalHadir}</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] text-amber-600 font-medium">Terlambat</div>
          <div className="text-xl font-bold text-amber-700 font-mono tabular-nums">{totalTerlambat}</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] text-indigo-600 font-medium">Sakit</div>
          <div className="text-xl font-bold text-indigo-700 font-mono tabular-nums">{totalSakit}</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] text-cyan-600 font-medium">Izin</div>
          <div className="text-xl font-bold text-cyan-700 font-mono tabular-nums">{totalIzin}</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] text-rose-600 font-medium">Alpa</div>
          <div className="text-xl font-bold text-rose-700 font-mono tabular-nums">{totalAlpa}</div>
        </div>
      </div>

      {/* Printable Report Header (Visible in print mode) */}
      <div className="hidden print:block p-6 mb-4 border-b-2 border-slate-900 text-center">
        <h2 className="text-xl font-extrabold uppercase">{settings.schoolName}</h2>
        <p className="text-sm">{settings.schoolAddress}</p>
        <p className="text-xs font-mono">NPSN: {settings.npsn} · Tahun Pelajaran {settings.academicYear}</p>
        <div className="mt-3 font-bold text-base underline uppercase">
          LAPORAN REKAPITULASI PRESENSI SISWA
        </div>
        <p className="text-xs mt-1">
          Periode: {startDate} s/d {endDate} {selectedClass !== 'Semua' ? `· ${selectedClass}` : ''}
        </p>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-3 px-4">No</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Jam</th>
                <th className="py-3 px-4">NIS</th>
                <th className="py-3 px-4">Nama Siswa</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Metode</th>
                <th className="py-3 px-4">Keterangan</th>
                <th className="py-3 px-4 text-right no-print">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    Memuat data rekapitulasi server...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    Tidak ada catatan absensi sesuai filter yang dipilih.
                  </td>
                </tr>
              ) : (
                records.map((r, idx) => {
                  let badge = 'bg-slate-100 text-slate-700';
                  if (r.status === 'Hadir') badge = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
                  if (r.status === 'Terlambat') badge = 'bg-amber-50 text-amber-700 border border-amber-200';
                  if (r.status === 'Sakit') badge = 'bg-indigo-50 text-indigo-700 border border-indigo-200';
                  if (r.status === 'Izin') badge = 'bg-cyan-50 text-cyan-700 border border-cyan-200';
                  if (r.status === 'Alpa') badge = 'bg-rose-50 text-rose-700 border border-rose-200';

                  return (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-4 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-4 font-mono text-slate-700">{r.date}</td>
                      <td className="py-2.5 px-4 font-mono font-medium text-slate-800">{r.time}</td>
                      <td className="py-2.5 px-4 font-mono text-slate-600">{r.nis}</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-900">{r.nama}</td>
                      <td className="py-2.5 px-4 text-slate-600">{r.kelas}</td>
                      <td className="py-2.5 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${badge}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">
                        {r.method === 'QR_SCAN' ? 'Scan QR' : 'Manual'}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500 truncate max-w-xs">
                        {r.notes || '-'}
                      </td>
                      <td className="py-2.5 px-4 text-right no-print">
                        <button
                          onClick={() => handleDeleteRecord(r.id, r.nama)}
                          title="Hapus Catatan Absen"
                          className="p-1 rounded text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Signature Section */}
      <div className="hidden print:flex justify-between items-start mt-12 px-8 text-xs">
        <div className="text-center">
          <p>Mengetahui,</p>
          <p className="font-semibold">Kepala Sekolah</p>
          <div className="h-20"></div>
          <p className="font-bold underline">{settings.headmaster || 'Dra. Siti Rahmah, M.Pd.'}</p>
          <p className="font-mono">NIP. 19780512 200501 2 004</p>
        </div>

        <div className="text-center">
          <p>Kota Cerdas, {new Date().toLocaleDateString('id-ID')}</p>
          <p className="font-semibold">Petugas Presensi / Admin</p>
          <div className="h-20"></div>
          <p className="font-bold underline">{settings.legalCopyright.replace('by ', '')}</p>
          <p className="font-mono">Petugas Terdaftar</p>
        </div>
      </div>

      {/* MANUAL ATTENDANCE MODAL */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Catat Presensi Siswa Manual</h3>
              <button
                onClick={() => setShowManualModal(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleManualAttendanceSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Pilih Siswa <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={manualStudentId}
                  onChange={(e) => setManualStudentId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800"
                >
                  <option value="">-- Pilih Siswa dari Database --</option>
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.nis} - {st.nama} ({st.kelas})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Kehadiran</label>
                  <select
                    value={manualStatus}
                    onChange={(e) => setManualStatus(e.target.value as AttendanceStatus)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  >
                    <option value="Hadir">Hadir</option>
                    <option value="Terlambat">Terlambat</option>
                    <option value="Sakit">Sakit</option>
                    <option value="Izin">Izin</option>
                    <option value="Alpa">Alpa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Keterangan / Catatan</label>
                <input
                  type="text"
                  placeholder="Contoh: Surat dokter terlampir / izin acara keluarga"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-3 py-2 rounded-lg border text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isManualSubmitting}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
                >
                  {isManualSubmitting ? 'Menyimpan...' : 'Simpan Presensi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
