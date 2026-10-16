export interface Student {
  id: string;
  nis: string;
  nisn: string;
  nama: string;
  kelas: string;
  jenisKelamin: 'L' | 'P';
  noHpOrangTua: string;
  qrCodeData: string;
  createdAt: string;
}

export type AttendanceStatus = 'Hadir' | 'Terlambat' | 'Sakit' | 'Izin' | 'Alpa';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  nis: string;
  nama: string;
  kelas: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
  status: AttendanceStatus;
  method: 'QR_SCAN' | 'MANUAL';
  notes?: string;
  recordedAt: string;
}

export interface AppSettings {
  adminPanelTitle: string;
  schoolName: string;
  schoolAddress: string;
  npsn: string;
  headmaster: string;
  academicYear: string;
  lateTimeThreshold: string; // e.g. "07:15"
  logoUrl: string | null;
  legalCopyright: string;
}

export interface DashboardStats {
  today: string;
  totalStudents: number;
  hadir: number;
  terlambat: number;
  sakit: number;
  izin: number;
  alpa: number;
  belumAbsen: number;
  attendanceRate: number;
  classes: string[];
  classStats: {
    kelas: string;
    total: number;
    hadir: number;
    percentage: number;
  }[];
  recentScans: AttendanceRecord[];
}
