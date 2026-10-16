import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Body parser with 10mb limit for logo base64 uploads and bulk Excel data
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database path
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Interface definitions
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

export interface AttendanceRecord {
  id: string;
  studentId: string;
  nis: string;
  nama: string;
  kelas: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
  status: 'Hadir' | 'Terlambat' | 'Sakit' | 'Izin' | 'Alpa';
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

export interface AdminCredentials {
  username: string;
  passwordHash: string; // stored as plain or simple hash
}

export interface DatabaseSchema {
  settings: AppSettings;
  adminCredentials: AdminCredentials;
  students: Student[];
  attendance: AttendanceRecord[];
  activeTokens: string[];
}

// Initial default data
const defaultData: DatabaseSchema = {
  settings: {
    adminPanelTitle: 'ADMIN PANEL ABSENSI SISWA',
    schoolName: 'SD NEGERI HARAPAN BANGSA',
    schoolAddress: 'Jl. Pendidikan Mandiri No. 12, Kota Cerdas',
    npsn: '20234567',
    headmaster: 'H. Suherman, S.Pd., M.M.',
    academicYear: '2024/2025',
    lateTimeThreshold: '07:15',
    logoUrl: null,
    legalCopyright: 'by Kunti Kunanti, M.Pd.',
  },
  adminCredentials: {
    username: 'admin',
    passwordHash: 'admin123',
  },
  students: [
    {
      id: 'std_001',
      nis: '240101',
      nisn: '0081293841',
      nama: 'Aditya Pratama',
      kelas: 'Kelas 4A',
      jenisKelamin: 'L',
      noHpOrangTua: '081234567801',
      qrCodeData: 'SISWA:240101',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'std_002',
      nis: '240102',
      nisn: '0081293842',
      nama: 'Aisyah Putri Azzahra',
      kelas: 'Kelas 4A',
      jenisKelamin: 'P',
      noHpOrangTua: '081234567802',
      qrCodeData: 'SISWA:240102',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'std_003',
      nis: '240103',
      nisn: '0081293843',
      nama: 'Bagas Firmansyah',
      kelas: 'Kelas 4A',
      jenisKelamin: 'L',
      noHpOrangTua: '081234567803',
      qrCodeData: 'SISWA:240103',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'std_004',
      nis: '240104',
      nisn: '0081293844',
      nama: 'Cantika Dewi Lestari',
      kelas: 'Kelas 4A',
      jenisKelamin: 'P',
      noHpOrangTua: '081234567804',
      qrCodeData: 'SISWA:240104',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'std_005',
      nis: '240105',
      nisn: '0081293845',
      nama: 'Dafi Rizki Nugraha',
      kelas: 'Kelas 4B',
      jenisKelamin: 'L',
      noHpOrangTua: '081234567805',
      qrCodeData: 'SISWA:240105',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'std_006',
      nis: '240106',
      nisn: '0081293846',
      nama: 'Eka Nurul Fadilah',
      kelas: 'Kelas 4B',
      jenisKelamin: 'P',
      noHpOrangTua: '081234567806',
      qrCodeData: 'SISWA:240106',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'std_007',
      nis: '240107',
      nisn: '0081293847',
      nama: 'Fahri Ramadhan',
      kelas: 'Kelas 5A',
      jenisKelamin: 'L',
      noHpOrangTua: '081234567807',
      qrCodeData: 'SISWA:240107',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'std_008',
      nis: '240108',
      nisn: '0081293848',
      nama: 'Gita Maharani',
      kelas: 'Kelas 5A',
      jenisKelamin: 'P',
      noHpOrangTua: '081234567808',
      qrCodeData: 'SISWA:240108',
      createdAt: new Date().toISOString(),
    },
  ],
  attendance: [],
  activeTokens: [],
};

// Database helper functions
function initDatabase(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
    return defaultData;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    // Ensure legalCopyright is set
    if (!parsed.settings.legalCopyright) {
      parsed.settings.legalCopyright = 'by Kunti Kunanti, M.Pd.';
    }
    return parsed;
  } catch (err) {
    console.error('Error reading database file, resetting to default', err);
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
    return defaultData;
  }
}

function saveDatabase(data: DatabaseSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database', err);
  }
}

let db = initDatabase();

// Auth Middleware: Check token from Bearer or header x-auth-token
function authenticateAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : (req.headers['x-auth-token'] as string);

  if (!token || !db.activeTokens.includes(token)) {
    return res.status(401).json({ error: 'Unauthorized: Harap login sebagai Admin.' });
  }
  next();
}

// ---------------- API ROUTES ----------------

// 1. Auth routes
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username dan password wajib diisi.' });
  }

  if (
    username === db.adminCredentials.username &&
    password === db.adminCredentials.passwordHash
  ) {
    const token = 'tok_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    db.activeTokens.push(token);
    // Keep max 50 tokens
    if (db.activeTokens.length > 50) {
      db.activeTokens.shift();
    }
    saveDatabase(db);
    return res.json({
      success: true,
      token,
      username: db.adminCredentials.username,
      message: 'Login berhasil.',
    });
  }

  return res.status(401).json({ error: 'Username atau password admin salah.' });
});

app.get('/api/auth/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : (req.headers['x-auth-token'] as string);

  if (token && db.activeTokens.includes(token)) {
    return res.json({ valid: true, username: db.adminCredentials.username });
  }
  return res.status(401).json({ valid: false });
});

app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : (req.headers['x-auth-token'] as string);

  if (token) {
    db.activeTokens = db.activeTokens.filter((t) => t !== token);
    saveDatabase(db);
  }
  return res.json({ success: true });
});

app.post('/api/auth/change-credentials', authenticateAdmin, (req, res) => {
  const { currentPassword, newUsername, newPassword } = req.body;
  if (!currentPassword || !newUsername || !newPassword) {
    return res.status(400).json({ error: 'Semua kolom kredensial harus diisi.' });
  }
  if (currentPassword !== db.adminCredentials.passwordHash) {
    return res.status(400).json({ error: 'Password saat ini salah.' });
  }
  if (newPassword.length < 4) {
    return res.status(400).json({ error: 'Password baru minimal 4 karakter.' });
  }

  db.adminCredentials.username = newUsername.trim();
  db.adminCredentials.passwordHash = newPassword;
  saveDatabase(db);

  return res.json({
    success: true,
    message: 'Username dan password admin berhasil diperbarui!',
    username: db.adminCredentials.username,
  });
});

// 2. Settings routes
app.get('/api/settings', (req, res) => {
  // Settings can be read openly so header and login screen can display school name and title
  res.json(db.settings);
});

app.put('/api/settings', authenticateAdmin, (req, res) => {
  const updates = req.body;
  db.settings = {
    ...db.settings,
    ...updates,
    legalCopyright: 'by Kunti Kunanti, M.Pd.', // permanently maintained as requested
  };
  saveDatabase(db);
  res.json({ success: true, settings: db.settings, message: 'Pengaturan berhasil disimpan!' });
});

app.post('/api/settings/upload-logo', authenticateAdmin, (req, res) => {
  const { logoBase64 } = req.body;
  if (!logoBase64) {
    return res.status(400).json({ error: 'Data logo tidak ditemukan.' });
  }
  db.settings.logoUrl = logoBase64;
  saveDatabase(db);
  res.json({ success: true, logoUrl: db.settings.logoUrl, message: 'Logo instansi berhasil diunggah!' });
});

app.delete('/api/settings/logo', authenticateAdmin, (req, res) => {
  db.settings.logoUrl = null;
  saveDatabase(db);
  res.json({ success: true, message: 'Logo instansi berhasil dihapus.' });
});

// 3. Students management
app.get('/api/students', authenticateAdmin, (req, res) => {
  const { search, kelas } = req.query;
  let list = [...db.students];

  if (kelas && typeof kelas === 'string' && kelas !== 'Semua') {
    list = list.filter((s) => s.kelas.toLowerCase() === kelas.toLowerCase());
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    list = list.filter(
      (s) =>
        s.nama.toLowerCase().includes(q) ||
        s.nis.toLowerCase().includes(q) ||
        s.nisn.toLowerCase().includes(q)
    );
  }

  res.json({ students: list, total: list.length });
});

app.post('/api/students', authenticateAdmin, (req, res) => {
  const { nis, nisn, nama, kelas, jenisKelamin, noHpOrangTua } = req.body;

  if (!nis || !nama || !kelas) {
    return res.status(400).json({ error: 'NIS, Nama Siswa, dan Kelas wajib diisi.' });
  }

  // Check unique NIS
  const exists = db.students.some((s) => s.nis.trim() === nis.trim());
  if (exists) {
    return res.status(400).json({ error: `Siswa dengan NIS ${nis} sudah terdaftar!` });
  }

  const newStudent: Student = {
    id: 'std_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    nis: String(nis).trim(),
    nisn: String(nisn || '').trim(),
    nama: String(nama).trim(),
    kelas: String(kelas).trim(),
    jenisKelamin: jenisKelamin === 'P' ? 'P' : 'L',
    noHpOrangTua: String(noHpOrangTua || '').trim(),
    qrCodeData: `SISWA:${String(nis).trim()}`,
    createdAt: new Date().toISOString(),
  };

  db.students.unshift(newStudent);
  saveDatabase(db);

  res.json({ success: true, student: newStudent, message: 'Data siswa berhasil ditambahkan!' });
});

app.post('/api/students/bulk', authenticateAdmin, (req, res) => {
  const { students } = req.body;
  if (!Array.isArray(students) || students.length === 0) {
    return res.status(400).json({ error: 'Daftar data siswa tidak boleh kosong.' });
  }

  const added: Student[] = [];
  const skipped: string[] = [];

  for (const item of students) {
    const nis = String(item.nis || '').trim();
    const nama = String(item.nama || '').trim();
    const kelas = String(item.kelas || '').trim();

    if (!nis || !nama) {
      skipped.push(`${item.nama || 'Tanpa Nama'} (NIS/Nama kosong)`);
      continue;
    }

    const exists = db.students.some((s) => s.nis === nis);
    if (exists) {
      skipped.push(`${nama} (NIS ${nis} sudah ada)`);
      continue;
    }

    const newStudent: Student = {
      id: 'std_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      nis,
      nisn: String(item.nisn || '').trim(),
      nama,
      kelas: kelas || 'Kelas 1',
      jenisKelamin: String(item.jenisKelamin).toUpperCase().startsWith('P') ? 'P' : 'L',
      noHpOrangTua: String(item.noHpOrangTua || item.noHp || '').trim(),
      qrCodeData: `SISWA:${nis}`,
      createdAt: new Date().toISOString(),
    };

    db.students.push(newStudent);
    added.push(newStudent);
  }

  saveDatabase(db);

  res.json({
    success: true,
    addedCount: added.length,
    skippedCount: skipped.length,
    skipped,
    message: `Berhasil mengimpor ${added.length} siswa.${skipped.length > 0 ? ` (${skipped.length} dilewati)` : ''}`,
  });
});

app.put('/api/students/:id', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  const { nis, nisn, nama, kelas, jenisKelamin, noHpOrangTua } = req.body;

  const idx = db.students.findIndex((s) => s.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Siswa tidak ditemukan.' });
  }

  // Check unique NIS if changed
  if (nis && nis.trim() !== db.students[idx].nis) {
    const exists = db.students.some((s) => s.id !== id && s.nis === nis.trim());
    if (exists) {
      return res.status(400).json({ error: `NIS ${nis} sudah digunakan oleh siswa lain.` });
    }
  }

  const updated: Student = {
    ...db.students[idx],
    nis: nis ? String(nis).trim() : db.students[idx].nis,
    nisn: nisn !== undefined ? String(nisn).trim() : db.students[idx].nisn,
    nama: nama ? String(nama).trim() : db.students[idx].nama,
    kelas: kelas ? String(kelas).trim() : db.students[idx].kelas,
    jenisKelamin: jenisKelamin === 'P' ? 'P' : 'L',
    noHpOrangTua: noHpOrangTua !== undefined ? String(noHpOrangTua).trim() : db.students[idx].noHpOrangTua,
    qrCodeData: `SISWA:${(nis ? String(nis).trim() : db.students[idx].nis)}`,
  };

  db.students[idx] = updated;

  // Also sync existing attendance record names/classes if updated
  db.attendance = db.attendance.map((att) => {
    if (att.studentId === id || att.nis === db.students[idx].nis) {
      return {
        ...att,
        nama: updated.nama,
        kelas: updated.kelas,
        nis: updated.nis,
      };
    }
    return att;
  });

  saveDatabase(db);
  res.json({ success: true, student: updated, message: 'Data siswa berhasil diperbarui!' });
});

app.delete('/api/students/:id', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  const initialLen = db.students.length;
  db.students = db.students.filter((s) => s.id !== id);
  if (db.students.length === initialLen) {
    return res.status(404).json({ error: 'Siswa tidak ditemukan.' });
  }
  saveDatabase(db);
  res.json({ success: true, message: 'Siswa berhasil dihapus.' });
});

// 4. Attendance & QR Scan routes
app.post('/api/attendance/scan', authenticateAdmin, (req, res) => {
  const { qrContent, customStatus, notes } = req.body;
  if (!qrContent) {
    return res.status(400).json({ error: 'Konten QR Code tidak terbaca.' });
  }

  // QR content can be "SISWA:240101" or raw NIS "240101"
  let parsedNis = qrContent.trim();
  if (parsedNis.startsWith('SISWA:')) {
    parsedNis = parsedNis.replace('SISWA:', '').trim();
  }

  // Find student in centralized DB
  const student = db.students.find(
    (s) => s.nis === parsedNis || s.qrCodeData === qrContent.trim()
  );

  if (!student) {
    return res.status(404).json({
      error: `Data siswa dengan kode "${parsedNis}" tidak ditemukan dalam database sekolah!`,
    });
  }

  // Current date and time in WIB / local
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const timeStr = `${hours}:${minutes}:${seconds}`;

  // Check if student has already been marked attendance today
  const existingIndex = db.attendance.findIndex(
    (a) => a.studentId === student.id && a.date === dateStr
  );

  // Determine status (Hadir vs Terlambat if not custom)
  let finalStatus: 'Hadir' | 'Terlambat' | 'Sakit' | 'Izin' | 'Alpa' = 'Hadir';
  if (customStatus) {
    finalStatus = customStatus;
  } else {
    // Check against late threshold
    const [thH, thM] = (db.settings.lateTimeThreshold || '07:15').split(':').map(Number);
    const lateCutoffMinutes = thH * 60 + thM;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    if (currentMinutes > lateCutoffMinutes) {
      finalStatus = 'Terlambat';
    } else {
      finalStatus = 'Hadir';
    }
  }

  let record: AttendanceRecord;
  let alreadyScanned = false;

  if (existingIndex !== -1) {
    alreadyScanned = true;
    record = db.attendance[existingIndex];
    // Return with warning that student was already scanned
    return res.json({
      success: true,
      alreadyScanned: true,
      student,
      record,
      message: `Perhatian: Siswa ${student.nama} (${student.nis}) SUDAH absen hari ini pada pukul ${record.time} (Status: ${record.status}).`,
    });
  } else {
    record = {
      id: 'att_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      studentId: student.id,
      nis: student.nis,
      nama: student.nama,
      kelas: student.kelas,
      date: dateStr,
      time: timeStr,
      status: finalStatus,
      method: 'QR_SCAN',
      notes: notes || (finalStatus === 'Terlambat' ? `Masuk pukul ${timeStr}` : ''),
      recordedAt: now.toISOString(),
    };
    db.attendance.unshift(record);
    saveDatabase(db);
  }

  res.json({
    success: true,
    alreadyScanned: false,
    student,
    record,
    message: `Absensi Berhasil! ${student.nama} dicatat ${record.status} pada ${record.time}.`,
  });
});

// Manual attendance (e.g. for Sakit, Izin, Alpa or manual Hadir)
app.post('/api/attendance/manual', authenticateAdmin, (req, res) => {
  const { studentId, date, status, notes } = req.body;
  if (!studentId || !date || !status) {
    return res.status(400).json({ error: 'ID Siswa, Tanggal, dan Status wajib diisi.' });
  }

  const student = db.students.find((s) => s.id === studentId);
  if (!student) {
    return res.status(404).json({ error: 'Siswa tidak ditemukan.' });
  }

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  const existingIndex = db.attendance.findIndex(
    (a) => a.studentId === student.id && a.date === date
  );

  let record: AttendanceRecord;

  if (existingIndex !== -1) {
    // Update existing
    db.attendance[existingIndex] = {
      ...db.attendance[existingIndex],
      status,
      notes: notes || db.attendance[existingIndex].notes,
      method: 'MANUAL',
    };
    record = db.attendance[existingIndex];
  } else {
    record = {
      id: 'att_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      studentId: student.id,
      nis: student.nis,
      nama: student.nama,
      kelas: student.kelas,
      date,
      time: timeStr,
      status,
      method: 'MANUAL',
      notes: notes || '',
      recordedAt: now.toISOString(),
    };
    db.attendance.unshift(record);
  }

  saveDatabase(db);
  res.json({ success: true, record, message: `Status absensi ${student.nama} berhasil disimpan!` });
});

app.delete('/api/attendance/:id', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  db.attendance = db.attendance.filter((a) => a.id !== id);
  saveDatabase(db);
  res.json({ success: true, message: 'Data absensi berhasil dihapus.' });
});

// 5. Attendance query & recap
app.get('/api/attendance', authenticateAdmin, (req, res) => {
  const { date, startDate, endDate, kelas, status, search } = req.query;

  let list = [...db.attendance];

  if (date && typeof date === 'string') {
    list = list.filter((a) => a.date === date);
  } else {
    if (startDate && typeof startDate === 'string') {
      list = list.filter((a) => a.date >= startDate);
    }
    if (endDate && typeof endDate === 'string') {
      list = list.filter((a) => a.date <= endDate);
    }
  }

  if (kelas && typeof kelas === 'string' && kelas !== 'Semua') {
    list = list.filter((a) => a.kelas.toLowerCase() === kelas.toLowerCase());
  }

  if (status && typeof status === 'string' && status !== 'Semua') {
    list = list.filter((a) => a.status.toLowerCase() === status.toLowerCase());
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    list = list.filter(
      (a) =>
        a.nama.toLowerCase().includes(q) ||
        a.nis.toLowerCase().includes(q) ||
        a.kelas.toLowerCase().includes(q)
    );
  }

  res.json({ records: list, total: list.length });
});

// 6. Dashboard Statistics
app.get('/api/stats', authenticateAdmin, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const totalStudents = db.students.length;

  const todayRecords = db.attendance.filter((a) => a.date === today);

  const hadir = todayRecords.filter((a) => a.status === 'Hadir').length;
  const terlambat = todayRecords.filter((a) => a.status === 'Terlambat').length;
  const sakit = todayRecords.filter((a) => a.status === 'Sakit').length;
  const izin = todayRecords.filter((a) => a.status === 'Izin').length;
  const alpa = todayRecords.filter((a) => a.status === 'Alpa').length;

  const totalRecorded = hadir + terlambat + sakit + izin + alpa;
  const belumAbsen = Math.max(0, totalStudents - totalRecorded);

  // Distinct classes
  const classes = Array.from(new Set(db.students.map((s) => s.kelas))).sort();

  // Class breakdown for today
  const classStats = classes.map((cls) => {
    const studentsInClass = db.students.filter((s) => s.kelas === cls);
    const recordsInClass = todayRecords.filter((a) => a.kelas === cls);
    const presentInClass = recordsInClass.filter((a) => a.status === 'Hadir' || a.status === 'Terlambat').length;
    return {
      kelas: cls,
      total: studentsInClass.length,
      hadir: presentInClass,
      percentage: studentsInClass.length > 0 ? Math.round((presentInClass / studentsInClass.length) * 100) : 0,
    };
  });

  // Recent 10 scans
  const recentScans = todayRecords.slice(0, 10);

  res.json({
    today,
    totalStudents,
    hadir,
    terlambat,
    sakit,
    izin,
    alpa,
    belumAbsen,
    attendanceRate: totalStudents > 0 ? Math.round(((hadir + terlambat) / totalStudents) * 100) : 0,
    classes,
    classStats,
    recentScans,
  });
});

// Vite integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
