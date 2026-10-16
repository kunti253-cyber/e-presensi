import React, { useState, useEffect, useRef } from 'react';
import { 
  UserPlus, 
  Upload, 
  FileSpreadsheet, 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  Download, 
  AlertCircle, 
  CheckCircle2, 
  QrCode, 
  X,
  RefreshCw,
  Eye
} from 'lucide-react';
import * as XLSX from 'xlsx';
import QRCode from 'qrcode';
import { api } from '../services/api';
import { Student } from '../types';

export const StudentsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'list' | 'manual' | 'upload'>('list');
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('Semua');

  // Manual Form State
  const [manualForm, setManualForm] = useState({
    nis: '',
    nisn: '',
    nama: '',
    kelas: 'Kelas 4A',
    jenisKelamin: 'L' as 'L' | 'P',
    noHpOrangTua: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Modal State
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState({
    nis: '',
    nisn: '',
    nama: '',
    kelas: '',
    jenisKelamin: 'L' as 'L' | 'P',
    noHpOrangTua: '',
  });

  // QR Preview Modal State
  const [previewQrStudent, setPreviewQrStudent] = useState<Student | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  // Bulk Upload State
  const [parsedRows, setParsedRows] = useState<Partial<Student>[]>([]);
  const [uploadFileName, setUploadFileName] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const res = await api.getStudents({ search: searchTerm, kelas: selectedClass });
      setStudents(res.students);
    } catch (err) {
      console.error('Failed to fetch students:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [searchTerm, selectedClass]);

  // Handle Manual Form Submit
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!manualForm.nis.trim() || !manualForm.nama.trim() || !manualForm.kelas.trim()) {
      setFormError('NIS, Nama Lengkap, dan Kelas wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.createStudent({
        nis: manualForm.nis.trim(),
        nisn: manualForm.nisn.trim(),
        nama: manualForm.nama.trim(),
        kelas: manualForm.kelas.trim(),
        jenisKelamin: manualForm.jenisKelamin,
        noHpOrangTua: manualForm.noHpOrangTua.trim(),
      });
      setFormSuccess(res.message);
      setManualForm({
        nis: '',
        nisn: '',
        nama: '',
        kelas: manualForm.kelas,
        jenisKelamin: 'L',
        noHpOrangTua: '',
      });
      fetchStudents();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError('Gagal menambahkan siswa.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    try {
      await api.updateStudent(editingStudent.id, editForm);
      setEditingStudent(null);
      fetchStudents();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal memperbarui data.');
    }
  };

  // Handle Delete
  const handleDelete = async (id: string, nama: string) => {
    if (!window.confirm(`Yakin ingin menghapus data siswa ${nama}?`)) return;
    try {
      await api.deleteStudent(id);
      fetchStudents();
    } catch (err) {
      console.error(err);
    }
  };

  // Handle QR Preview
  const handleViewQr = async (student: Student) => {
    setPreviewQrStudent(student);
    try {
      const url = await QRCode.toDataURL(student.qrCodeData || `SISWA:${student.nis}`, {
        width: 300,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      });
      setQrDataUrl(url);
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Excel/CSV File Parsing
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFileName(file.name);
    setUploadStatus(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

        // Normalize keys
        const formatted: Partial<Student>[] = rawJson.map((row) => {
          // find keys flexibly
          const nisKey = Object.keys(row).find((k) => /nis/i.test(k) && !/nisn/i.test(k)) || 'nis';
          const nisnKey = Object.keys(row).find((k) => /nisn/i.test(k)) || 'nisn';
          const namaKey = Object.keys(row).find((k) => /nama/i.test(k)) || 'nama';
          const kelasKey = Object.keys(row).find((k) => /kelas/i.test(k)) || 'kelas';
          const jkKey = Object.keys(row).find((k) => /jk|gender|kelamin/i.test(k)) || 'jenisKelamin';
          const hpKey = Object.keys(row).find((k) => /hp|telp|wa|phone/i.test(k)) || 'noHpOrangTua';

          return {
            nis: String(row[nisKey] || '').trim(),
            nisn: String(row[nisnKey] || '').trim(),
            nama: String(row[namaKey] || '').trim(),
            kelas: String(row[kelasKey] || 'Kelas 1').trim(),
            jenisKelamin: (String(row[jkKey] || 'L').toUpperCase().startsWith('P') ? 'P' : 'L') as 'L' | 'P',
            noHpOrangTua: String(row[hpKey] || '').trim(),
          };
        }).filter((item) => item.nis && item.nama);

        setParsedRows(formatted);
      } catch (err) {
        console.error('Error parsing excel:', err);
        setUploadStatus('Gagal membaca file Excel/CSV. Pastikan format tabel sesuai template.');
      }
    };
    reader.readAsBinaryString(file);
  };

  // Submit Bulk Upload
  const handleBulkSubmit = async () => {
    if (parsedRows.length === 0) return;
    setIsSubmitting(true);
    setUploadStatus(null);
    try {
      const res = await api.bulkCreateStudents(parsedRows);
      setUploadStatus(res.message);
      setParsedRows([]);
      setUploadFileName(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchStudents();
    } catch (err: unknown) {
      setUploadStatus(err instanceof Error ? err.message : 'Gagal mengimpor siswa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Download Sample Template
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        nis: '240201',
        nisn: '0089123401',
        nama: 'Ahmad Dani Saputra',
        kelas: 'Kelas 4A',
        jenisKelamin: 'L',
        noHpOrangTua: '081234567890',
      },
      {
        nis: '240202',
        nisn: '0089123402',
        nama: 'Bella Amanda',
        kelas: 'Kelas 4A',
        jenisKelamin: 'P',
        noHpOrangTua: '081234567891',
      },
      {
        nis: '240203',
        nisn: '0089123403',
        nama: 'Candra Wijaya',
        kelas: 'Kelas 4B',
        jenisKelamin: 'L',
        noHpOrangTua: '081234567892',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Siswa');
    XLSX.writeFile(wb, 'template_data_siswa.xlsx');
  };

  // Unique classes list for filter
  const classesList = Array.from(new Set(students.map((s) => s.kelas))).sort();

  return (
    <div className="space-y-6">
      {/* Top Navigation Segmented Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'list' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Daftar Siswa ({students.length})
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'manual' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Input Manual</span>
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'upload' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File (Excel/CSV)</span>
          </button>
        </div>

        <button
          onClick={fetchStudents}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* TAB 1: LIST SISWA */}
      {activeTab === 'list' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Filter Bar */}
          <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari berdasarkan Nama, NIS, atau NISN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="text-xs rounded-lg border border-slate-200 px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="Semua">Semua Kelas</option>
                {classesList.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-3 px-4">No</th>
                  <th className="py-3 px-4">NIS</th>
                  <th className="py-3 px-4">NISN</th>
                  <th className="py-3 px-4">Nama Lengkap Siswa</th>
                  <th className="py-3 px-4">Kelas</th>
                  <th className="py-3 px-4">L/P</th>
                  <th className="py-3 px-4">No. HP Orang Tua</th>
                  <th className="py-3 px-4 text-right">Aksi & QR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Memuat data siswa dari server...
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <div className="max-w-xs mx-auto">
                        <UserPlus className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-semibold text-slate-700">Tidak ada data siswa ditemukan</p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Silakan tambahkan data melalui tab Input Manual atau Upload File Excel.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  students.map((student, idx) => (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">{student.nis}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{student.nisn || '-'}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{student.nama}</td>
                      <td className="py-3 px-4 text-slate-700">
                        <span className="font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {student.kelas}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          student.jenisKelamin === 'L' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'
                        }`}>
                          {student.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">{student.noHpOrangTua || '-'}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleViewQr(student)}
                            title="Lihat & Unduh QR Code"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingStudent(student);
                              setEditForm({
                                nis: student.nis,
                                nisn: student.nisn,
                                nama: student.nama,
                                kelas: student.kelas,
                                jenisKelamin: student.jenisKelamin,
                                noHpOrangTua: student.noHpOrangTua,
                              });
                            }}
                            title="Edit Data Siswa"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(student.id, student.nama)}
                            title="Hapus Siswa"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: INPUT MANUAL */}
      {activeTab === 'manual' && (
        <div className="max-w-2xl bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs">
          <div className="border-b border-slate-100 pb-4 mb-5">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Tambah Data Siswa Secara Manual
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Data yang ditambahkan akan tersimpan secara terpusat pada server dan dapat discan langsung.
            </p>
          </div>

          {formError && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{formSuccess}</span>
            </div>
          )}

          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor Induk Siswa (NIS) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 240109"
                  value={manualForm.nis}
                  onChange={(e) => setManualForm({ ...manualForm, nis: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  NISN (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 0081234567"
                  value={manualForm.nisn}
                  onChange={(e) => setManualForm({ ...manualForm, nisn: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-mono text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Lengkap Siswa <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Masukkan nama lengkap siswa"
                value={manualForm.nama}
                onChange={(e) => setManualForm({ ...manualForm, nama: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kelas / Rombel <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kelas 4A, Kelas 5B"
                  value={manualForm.kelas}
                  onChange={(e) => setManualForm({ ...manualForm, kelas: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jenis Kelamin
                </label>
                <select
                  value={manualForm.jenisKelamin}
                  onChange={(e) => setManualForm({ ...manualForm, jenisKelamin: e.target.value as 'L' | 'P' })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900"
                >
                  <option value="L">Laki-laki (L)</option>
                  <option value="P">Perempuan (P)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor WhatsApp / HP Orang Tua / Wali
              </label>
              <input
                type="text"
                placeholder="Contoh: 081234567890"
                value={manualForm.noHpOrangTua}
                onChange={(e) => setManualForm({ ...manualForm, noHpOrangTua: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-mono text-slate-900"
              />
            </div>

            <div className="pt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Kembali ke Daftar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Siswa'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: UPLOAD FILE EXCEL / CSV */}
      {activeTab === 'upload' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-5">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Impor Massal Data Siswa (Excel & CSV)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Unggah file spreadsheet siswa dengan kolom: NIS, NISN, Nama, Kelas, Jenis Kelamin, No HP.
                </p>
              </div>
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Unduh Template Excel (.xlsx)</span>
              </button>
            </div>

            {/* Dropzone */}
            <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center hover:border-blue-400 transition-colors bg-slate-50/50">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload-input"
              />
              <label htmlFor="file-upload-input" className="cursor-pointer block">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-slate-800">
                  Klik untuk Memilih File Excel atau CSV
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Format yang didukung: .xlsx, .xls, .csv
                </p>
              </label>
              {uploadFileName && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-100 text-blue-800 text-xs font-medium">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>File Terpilih: {uploadFileName}</span>
                </div>
              )}
            </div>

            {uploadStatus && (
              <div className="mt-4 p-3 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{uploadStatus}</span>
              </div>
            )}
          </div>

          {/* Parsed Preview Table */}
          {parsedRows.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Pratinjau Data Impor ({parsedRows.length} Siswa Terbaca)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Periksa data di bawah sebelum menyimpan ke database server terpusat.
                  </p>
                </div>
                <button
                  onClick={handleBulkSubmit}
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'Menyimpan ke Server...' : `Simpan ${parsedRows.length} Siswa ke Database`}
                </button>
              </div>

              <div className="overflow-x-auto max-h-80 border rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 sticky top-0 border-b">
                    <tr className="text-slate-600 font-semibold">
                      <th className="py-2.5 px-3">No</th>
                      <th className="py-2.5 px-3">NIS</th>
                      <th className="py-2.5 px-3">NISN</th>
                      <th className="py-2.5 px-3">Nama Siswa</th>
                      <th className="py-2.5 px-3">Kelas</th>
                      <th className="py-2.5 px-3">L/P</th>
                      <th className="py-2.5 px-3">No HP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono text-slate-400">{i + 1}</td>
                        <td className="py-2 px-3 font-mono font-medium text-slate-800">{r.nis}</td>
                        <td className="py-2 px-3 font-mono text-slate-500">{r.nisn || '-'}</td>
                        <td className="py-2 px-3 font-semibold text-slate-900">{r.nama}</td>
                        <td className="py-2 px-3 text-slate-700">{r.kelas}</td>
                        <td className="py-2 px-3">{r.jenisKelamin}</td>
                        <td className="py-2 px-3 font-mono text-slate-600">{r.noHpOrangTua || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* EDIT MODAL */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Edit Data Siswa</h3>
              <button
                onClick={() => setEditingStudent(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">NIS</label>
                  <input
                    type="text"
                    required
                    value={editForm.nis}
                    onChange={(e) => setEditForm({ ...editForm, nis: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">NISN</label>
                  <input
                    type="text"
                    value={editForm.nisn}
                    onChange={(e) => setEditForm({ ...editForm, nisn: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={editForm.nama}
                  onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kelas</label>
                  <input
                    type="text"
                    required
                    value={editForm.kelas}
                    onChange={(e) => setEditForm({ ...editForm, kelas: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={editForm.jenisKelamin}
                    onChange={(e) => setEditForm({ ...editForm, jenisKelamin: e.target.value as 'L' | 'P' })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200"
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">No. HP Orang Tua</label>
                <input
                  type="text"
                  value={editForm.noHpOrangTua}
                  onChange={(e) => setEditForm({ ...editForm, noHpOrangTua: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 font-mono"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR PREVIEW MODAL */}
      {previewQrStudent && qrDataUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-xl shadow-xl border border-slate-200 p-6 text-center">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-900">QR Code Siswa</h3>
              <button
                onClick={() => setPreviewQrStudent(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 inline-block mb-4 shadow-2xs">
              <img src={qrDataUrl} alt="QR Code" className="w-48 h-48 mx-auto" />
            </div>

            <h4 className="text-base font-bold text-slate-900">{previewQrStudent.nama}</h4>
            <p className="text-xs font-mono text-slate-500 mt-0.5">NIS: {previewQrStudent.nis} · {previewQrStudent.kelas}</p>
            <p className="text-[11px] font-mono text-blue-600 mt-1 bg-blue-50 py-1 px-2 rounded">
              {previewQrStudent.qrCodeData}
            </p>

            <div className="mt-5 flex items-center justify-center gap-2">
              <a
                href={qrDataUrl}
                download={`QR_${previewQrStudent.nis}_${previewQrStudent.nama}.png`}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Gambar PNG</span>
              </a>
              <button
                onClick={() => setPreviewQrStudent(null)}
                className="px-4 py-2 rounded-lg border text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
