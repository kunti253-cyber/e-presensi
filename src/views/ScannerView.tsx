import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  CameraOff, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ScanLine, 
  User, 
  Search, 
  Volume2, 
  VolumeX, 
  Sparkles,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { Html5Qrcode, CameraDevice } from 'html5-qrcode';
import { api } from '../services/api';
import { sounds } from '../services/audio';
import { Student, AttendanceRecord, AttendanceStatus, AppSettings } from '../types';

interface ScannerViewProps {
  settings: AppSettings;
}

export const ScannerView: React.FC<ScannerViewProps> = ({ settings }) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Scan states
  const [attendanceMode, setAttendanceMode] = useState<AttendanceStatus | 'AUTO'>('AUTO');
  const [lastScannedResult, setLastScannedResult] = useState<{
    student: Student;
    record: AttendanceRecord;
    alreadyScanned: boolean;
    message: string;
  } | null>(null);

  const [recentScans, setRecentScans] = useState<AttendanceRecord[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Manual fallback input
  const [manualInput, setManualInput] = useState('');
  const [isManualSubmitting, setIsManualSubmitting] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isProcessingScanRef = useRef(false);
  const lastScannedCodeRef = useRef<string>('');
  const lastScanTimestampRef = useRef<number>(0);

  // Load cameras on mount
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer back camera if available, or first camera
          const backCam = devices.find((d) => /back|rear|belakang/i.test(d.label));
          setSelectedCameraId(backCam ? backCam.id : devices[0].id);
        }
      })
      .catch((err) => {
        console.warn('Unable to get cameras automatically:', err);
      });

    // Fetch initial recent scans
    fetchRecentScans();

    return () => {
      stopCamera();
    };
  }, []);

  const fetchRecentScans = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await api.getAttendance({ date: today });
      setRecentScans(res.records.slice(0, 8));
    } catch (err) {
      console.error(err);
    }
  };

  const startCamera = async (cameraId?: string) => {
    setCameraError(null);
    const targetId = cameraId || selectedCameraId;

    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode('qr-reader-container');
      } else if (html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
      }

      const config = {
        fps: 15,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      const cameraSource = targetId ? { deviceId: { exact: targetId } } : { facingMode: 'environment' };

      await html5QrCodeRef.current.start(
        cameraSource,
        config,
        onScanSuccess,
        onScanFailure
      );

      setIsCameraActive(true);
    } catch (err: unknown) {
      console.error('Failed to start camera:', err);
      setIsCameraActive(false);
      setCameraError(
        'Tidak dapat mengakses kamera perangkat. Harap izinkan akses kamera di browser Anda.'
      );
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (err) {
        console.error('Error stopping camera:', err);
      }
    }
    setIsCameraActive(false);
  };

  const onScanSuccess = async (decodedText: string) => {
    const now = Date.now();

    // Prevent duplicate rapid-fire scans within 3 seconds for the same QR
    if (
      decodedText === lastScannedCodeRef.current &&
      now - lastScanTimestampRef.current < 3000
    ) {
      return;
    }

    if (isProcessingScanRef.current) return;
    isProcessingScanRef.current = true;
    lastScannedCodeRef.current = decodedText;
    lastScanTimestampRef.current = now;

    try {
      const modeParam = attendanceMode === 'AUTO' ? undefined : attendanceMode;
      const res = await api.scanQr(decodedText, modeParam);

      if (res.success) {
        if (res.alreadyScanned) {
          if (soundEnabled) sounds.playWarning();
        } else {
          if (soundEnabled) sounds.playSuccess();
        }

        setLastScannedResult({
          student: res.student,
          record: res.record,
          alreadyScanned: res.alreadyScanned,
          message: res.message,
        });

        fetchRecentScans();
      }
    } catch (err: unknown) {
      if (soundEnabled) sounds.playError();
      const msg = err instanceof Error ? err.message : 'Gagal memproses QR Code.';
      setCameraError(msg);
    } finally {
      setTimeout(() => {
        isProcessingScanRef.current = false;
      }, 1000);
    }
  };

  const onScanFailure = () => {
    // Normal continuous frame search; suppress noise
  };

  // Manual code submission
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;

    setIsManualSubmitting(true);
    setManualError(null);

    try {
      const modeParam = attendanceMode === 'AUTO' ? undefined : attendanceMode;
      const res = await api.scanQr(manualInput.trim(), modeParam);

      if (res.success) {
        if (res.alreadyScanned) {
          if (soundEnabled) sounds.playWarning();
        } else {
          if (soundEnabled) sounds.playSuccess();
        }

        setLastScannedResult({
          student: res.student,
          record: res.record,
          alreadyScanned: res.alreadyScanned,
          message: res.message,
        });

        setManualInput('');
        fetchRecentScans();
      }
    } catch (err: unknown) {
      if (soundEnabled) sounds.playError();
      setManualError(err instanceof Error ? err.message : 'Siswa tidak ditemukan.');
    } finally {
      setIsManualSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Settings */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-blue-600" />
            <span>Pemindai QR Code Presensi Siswa</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kamera langsung terhubung dengan perangkat. Data absensi tersimpan otomatis di database terpusat sekolah.
          </p>
        </div>

        {/* Audio Mute & Mode */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              soundEnabled ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-400'
            }`}
            title="Aktifkan/Matikan Suara Beep"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-blue-600" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">Suara: {soundEnabled ? 'Aktif' : 'Mati'}</span>
          </button>
        </div>
      </div>

      {/* Main Two Column View: Camera Live Viewport (Left) & Feedback Info (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Camera (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
            {/* Camera Selector Bar */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex-1 max-w-xs">
                <select
                  value={selectedCameraId}
                  disabled={isCameraActive}
                  onChange={(e) => setSelectedCameraId(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50"
                >
                  {cameras.length === 0 ? (
                    <option value="">Kamera Default Perangkat</option>
                  ) : (
                    cameras.map((c, i) => (
                      <option key={c.id} value={c.id}>
                        {c.label || `Kamera ${i + 1}`}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {isCameraActive ? (
                <button
                  onClick={stopCamera}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <CameraOff className="w-3.5 h-3.5" />
                  <span>Matikan Kamera</span>
                </button>
              ) : (
                <button
                  onClick={() => startCamera()}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Aktifkan Kamera</span>
                </button>
              )}
            </div>

            {/* Attendance Mode Selector */}
            <div className="mb-3 p-2 bg-slate-50 rounded-lg border border-slate-200/70">
              <div className="text-[11px] font-semibold text-slate-600 mb-1">
                Pilihan Status Absensi Saat Scan:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setAttendanceMode('AUTO')}
                  className={`py-1 px-2 rounded-md font-semibold text-[11px] transition-all ${
                    attendanceMode === 'AUTO'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Otomatis
                </button>
                <button
                  type="button"
                  onClick={() => setAttendanceMode('Hadir')}
                  className={`py-1 px-2 rounded-md font-semibold text-[11px] transition-all ${
                    attendanceMode === 'Hadir'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Hadir
                </button>
                <button
                  type="button"
                  onClick={() => setAttendanceMode('Terlambat')}
                  className={`py-1 px-2 rounded-md font-semibold text-[11px] transition-all ${
                    attendanceMode === 'Terlambat'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Terlambat
                </button>
                <button
                  type="button"
                  onClick={() => setAttendanceMode('Sakit')}
                  className={`py-1 px-2 rounded-md font-semibold text-[11px] transition-all ${
                    attendanceMode === 'Sakit'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Sakit
                </button>
                <button
                  type="button"
                  onClick={() => setAttendanceMode('Izin')}
                  className={`py-1 px-2 rounded-md font-semibold text-[11px] transition-all ${
                    attendanceMode === 'Izin'
                      ? 'bg-cyan-600 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Izin
                </button>
              </div>
            </div>

            {cameraError && (
              <div className="mb-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{cameraError}</span>
              </div>
            )}

            {/* Video Canvas Container */}
            <div className="relative rounded-xl overflow-hidden bg-slate-950 aspect-video flex items-center justify-center border border-slate-800">
              <div
                id="qr-reader-container"
                className="w-full h-full flex items-center justify-center [&>video]:object-cover [&>video]:w-full [&>video]:h-full"
              />

              {!isCameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-900/90 text-slate-300">
                  <div className="w-14 h-14 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
                    <Camera className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Kamera Belum Aktif</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    Klik tombol di bawah untuk menghubungkan langsung ke kamera perangkat Anda.
                  </p>
                  <button
                    onClick={() => startCamera()}
                    className="mt-4 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md transition-colors"
                  >
                    Nyalakan Kamera Sekarang
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Manual Input Backup */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
            <h4 className="text-xs font-bold text-slate-800 mb-1">
              Input Alternatif / Darurat (Tanpa Kamera)
            </h4>
            <p className="text-[11px] text-slate-500 mb-3">
              Ketik NIS siswa atau kode QR jika barcode rusak atau kamera tidak tersedia:
            </p>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="Masukkan NIS siswa (contoh: 240101)..."
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                type="submit"
                disabled={isManualSubmitting || !manualInput.trim()}
                className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {isManualSubmitting ? 'Memproses...' : 'Catat Hadir'}
              </button>
            </form>
            {manualError && (
              <div className="mt-2 text-xs text-rose-600 font-medium">{manualError}</div>
            )}
          </div>
        </div>

        {/* Right Column: Scan Result Feedback & Today's Scans (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Result Card */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Hasil Scan Terakhir
            </h3>

            {lastScannedResult ? (
              <div
                className={`p-4 rounded-xl border transition-all ${
                  lastScannedResult.alreadyScanned
                    ? 'bg-amber-50/60 border-amber-300'
                    : 'bg-emerald-50/60 border-emerald-300'
                }`}
              >
                {/* Status Header */}
                <div className="flex items-center gap-2 mb-3">
                  {lastScannedResult.alreadyScanned ? (
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  )}
                  <div className="font-bold text-xs uppercase tracking-tight">
                    {lastScannedResult.alreadyScanned ? (
                      <span className="text-amber-800">PERINGATAN: SUDAH ABSEN HARI INI</span>
                    ) : (
                      <span className="text-emerald-800">ABSENSI BERHASIL DICATAT</span>
                    )}
                  </div>
                </div>

                {/* Student Profile Lockup */}
                <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-200/70 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-base shrink-0">
                    {lastScannedResult.student.nama.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-slate-900 truncate">
                      {lastScannedResult.student.nama}
                    </h4>
                    <p className="text-xs text-slate-500 font-mono">
                      NIS: {lastScannedResult.student.nis} · {lastScannedResult.student.kelas}
                    </p>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                    <div className="text-[10px] text-slate-400">Jam Tercatat</div>
                    <div className="font-mono font-bold text-slate-800 text-sm">
                      {lastScannedResult.record.time} WIB
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                    <div className="text-[10px] text-slate-400">Status Kehadiran</div>
                    <div className="font-bold text-emerald-700 text-sm">
                      {lastScannedResult.record.status}
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-[11px] text-slate-600 leading-snug">
                  {lastScannedResult.message}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <ScanLine className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-700 text-xs">Menunggu Scan Siswa</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Arahkan kartu QR code siswa ke depan kamera untuk mencatat presensi.
                </p>
              </div>
            )}
          </div>

          {/* Recent Scans Strip */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-900">Antrean Absensi Hari Ini</h4>
              <button
                onClick={fetchRecentScans}
                className="text-slate-400 hover:text-slate-600 p-1"
                title="Refresh Antrean"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              {recentScans.length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-400">
                  Belum ada siswa yang absen hari ini.
                </div>
              ) : (
                recentScans.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50/80 border border-slate-100 text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-semibold text-slate-900 truncate">{r.nama}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {r.nis} · {r.kelas}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono font-medium text-slate-600 text-[11px] block">
                        {r.time}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-600">
                        {r.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
