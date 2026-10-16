import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  CheckSquare, 
  Square, 
  School, 
  QrCode, 
  LayoutGrid, 
  Layers, 
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import QRCode from 'qrcode';
import { api } from '../services/api';
import { Student, AppSettings } from '../types';

interface PrintQrViewProps {
  settings: AppSettings;
}

interface StudentWithQr extends Student {
  qrDataUrl: string;
}

export const PrintQrView: React.FC<PrintQrViewProps> = ({ settings }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [studentsWithQr, setStudentsWithQr] = useState<StudentWithQr[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState('Semua');
  const [cardLayout, setCardLayout] = useState<'id-card' | 'sticker'>('id-card');
  const [search, setSearch] = useState('');

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const res = await api.getStudents();
      setStudents(res.students);
      // Select all by default
      setSelectedIds(res.students.map((s) => s.id));

      // Generate QR Data URLs in batch
      const withQr = await Promise.all(
        res.students.map(async (st) => {
          const url = await QRCode.toDataURL(st.qrCodeData || `SISWA:${st.nis}`, {
            width: 250,
            margin: 1,
            color: {
              dark: '#0f172a',
              light: '#ffffff',
            },
          });
          return {
            ...st,
            qrDataUrl: url,
          };
        })
      );
      setStudentsWithQr(withQr);
    } catch (err) {
      console.error('Failed to load students for QR printing:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const classesList = Array.from(new Set(students.map((s) => s.kelas))).sort();

  const filteredStudents = studentsWithQr.filter((s) => {
    const matchesClass = selectedClass === 'Semua' || s.kelas === selectedClass;
    const matchesSearch =
      search === '' ||
      s.nama.toLowerCase().includes(search.toLowerCase()) ||
      s.nis.includes(search);
    return matchesClass && matchesSearch;
  });

  const handleToggleSelectAll = () => {
    const currentFilteredIds = filteredStudents.map((s) => s.id);
    const allSelected = currentFilteredIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(selectedIds.filter((id) => !currentFilteredIds.includes(id)));
    } else {
      const merged = Array.from(new Set([...selectedIds, ...currentFilteredIds]));
      setSelectedIds(merged);
    }
  };

  const handleToggleStudent = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const printableStudents = studentsWithQr.filter((s) => selectedIds.includes(s.id));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Non-print control bar */}
      <div className="no-print bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <QrCode className="w-5 h-5 text-blue-600" />
              <span>Cetak Kartu & Label QR Code Siswa</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Siap dicetak pada kertas A4 atau kartu PVC. Terpilih {printableStudents.length} dari {students.length} siswa.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={printableStudents.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Sekarang (Print)</span>
            </button>
          </div>
        </div>

        {/* Controls row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          {/* Layout Toggle */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Model Desain Kartu</label>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                onClick={() => setCardLayout('id-card')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md font-semibold ${
                  cardLayout === 'id-card' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Kartu Pelajar</span>
              </button>
              <button
                onClick={() => setCardLayout('sticker')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md font-semibold ${
                  cardLayout === 'sticker' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Stiker Mini</span>
              </button>
            </div>
          </div>

          {/* Class Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Filter Kelas</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="Semua">Semua Kelas ({students.length})</option>
              {classesList.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Cari Siswa</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Nama atau NIS..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Select all toggle */}
          <div className="flex items-end">
            <button
              onClick={handleToggleSelectAll}
              className="w-full py-2 px-3 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 flex items-center justify-center gap-1.5"
            >
              {filteredStudents.length > 0 &&
              filteredStudents.every((s) => selectedIds.includes(s.id)) ? (
                <>
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                  <span>Batal Pilih Semua</span>
                </>
              ) : (
                <>
                  <Square className="w-4 h-4 text-slate-400" />
                  <span>Pilih Semua di Layar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* PRINTABLE AREA */}
      <div className="print-area">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 no-print">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
            <p className="text-xs">Sedang memproses QR Code seluruh siswa...</p>
          </div>
        ) : printableStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200 no-print">
            <p className="text-sm font-semibold text-slate-700">Tidak ada siswa yang dipilih untuk dicetak.</p>
            <p className="text-xs text-slate-400 mt-1">Centang siswa di atas untuk menampilkan kartu.</p>
          </div>
        ) : cardLayout === 'id-card' ? (
          /* CARD LAYOUT: KARTU PELAJAR (Grid of 2 or 3 per row on A4) */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {printableStudents.map((st) => (
              <div
                key={st.id}
                className="print-card relative bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between"
                style={{ width: '100%', minHeight: '340px' }}
              >
                {/* Non-print selection checkbox */}
                <div className="no-print absolute top-2 right-2 z-10">
                  <button
                    onClick={() => handleToggleStudent(st.id)}
                    className="p-1 bg-white/90 rounded-md shadow-xs border border-slate-200 text-blue-600"
                  >
                    <CheckSquare className="w-4 h-4" />
                  </button>
                </div>

                {/* Card Header with School Logo & Title */}
                <div className="p-3 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center gap-2.5 border-b border-blue-900/40">
                  <div className="w-10 h-10 rounded-lg bg-white p-0.5 shrink-0 flex items-center justify-center overflow-hidden">
                    {settings.logoUrl ? (
                      <img
                        src={settings.logoUrl}
                        alt="Logo"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <School className="w-6 h-6 text-blue-700" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[11px] font-extrabold tracking-tight uppercase leading-tight truncate">
                      {settings.schoolName || 'SD NEGERI HARAPAN BANGSA'}
                    </h3>
                    <p className="text-[9px] text-blue-100 truncate">
                      {settings.schoolAddress || 'KARTU ABSENSI SISWA DIGITAL'}
                    </p>
                    <p className="text-[8px] text-blue-200/90 font-mono">
                      NPSN: {settings.npsn || '20234567'} · TA {settings.academicYear || '2024/2025'}
                    </p>
                  </div>
                </div>

                {/* Card Body with QR Code and Student Details */}
                <div className="p-4 flex items-center gap-4 flex-1 bg-white">
                  {/* QR Image */}
                  <div className="p-1.5 bg-white rounded-xl border border-slate-200 shadow-2xs shrink-0 flex flex-col items-center">
                    <img src={st.qrDataUrl} alt={`QR ${st.nama}`} className="w-24 h-24 object-contain" />
                    <span className="text-[9px] font-mono text-slate-500 font-semibold mt-0.5">
                      {st.nis}
                    </span>
                  </div>

                  {/* Student Info */}
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div>
                      <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Nama Siswa</div>
                      <div className="text-xs font-bold text-slate-900 truncate leading-snug">{st.nama}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <div className="text-[8px] font-semibold text-slate-400 uppercase">NIS</div>
                        <div className="font-mono font-semibold text-slate-700">{st.nis}</div>
                      </div>
                      <div>
                        <div className="text-[8px] font-semibold text-slate-400 uppercase">Kelas</div>
                        <div className="font-semibold text-blue-700">{st.kelas}</div>
                      </div>
                    </div>
                    <div className="text-[10px]">
                      <div className="text-[8px] font-semibold text-slate-400 uppercase">Jenis Kelamin</div>
                      <div className="text-slate-700 font-medium">
                        {st.jenisKelamin === 'L' ? 'Laki-laki (L)' : 'Perempuan (P)'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Scan instruction & Legal Authority */}
                <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[8px] text-slate-500">
                  <span className="font-medium">Scan QR saat masuk gerbang/kelas</span>
                  <span className="font-mono font-semibold text-slate-700">{settings.legalCopyright}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* COMPACT STIKER LAYOUT (Grid of 4 or 6 per row) */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {printableStudents.map((st) => (
              <div
                key={st.id}
                className="print-card relative bg-white rounded-xl border border-slate-300 p-2.5 text-center flex flex-col items-center justify-between shadow-2xs"
                style={{ minHeight: '180px' }}
              >
                <div className="no-print absolute top-1 right-1">
                  <button
                    onClick={() => handleToggleStudent(st.id)}
                    className="p-0.5 text-blue-600"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="w-full">
                  <div className="text-[8px] font-bold text-slate-700 uppercase truncate">
                    {settings.schoolName || 'SD HARAPAN BANGSA'}
                  </div>
                  <div className="text-[7px] text-slate-400">QR CODE PRESENSI</div>
                </div>

                <div className="p-1 bg-white rounded-lg border border-slate-200 my-1">
                  <img src={st.qrDataUrl} alt={`QR ${st.nama}`} className="w-20 h-20 object-contain mx-auto" />
                </div>

                <div className="w-full">
                  <div className="text-[10px] font-bold text-slate-900 truncate leading-tight">
                    {st.nama}
                  </div>
                  <div className="text-[9px] font-mono font-semibold text-slate-600 mt-0.5">
                    {st.nis} · {st.kelas}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
