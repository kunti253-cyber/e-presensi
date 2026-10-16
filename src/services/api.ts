import { AppSettings, AttendanceRecord, DashboardStats, Student, AttendanceStatus } from '../types';

const TOKEN_KEY = 'absensi_admin_token';

export const getAuthToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearAuthToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthToken();
    }
    throw new Error(data.error || `Terjadi kesalahan (Status ${response.status})`);
  }

  return data as T;
}

export const api = {
  // Auth
  async login(username: string, password: string): Promise<{ success: boolean; token: string; username: string }> {
    const data = await apiFetch<{ success: boolean; token: string; username: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setAuthToken(data.token);
    return data;
  },

  async verifyAuth(): Promise<boolean> {
    const token = getAuthToken();
    if (!token) return false;
    try {
      const data = await apiFetch<{ valid: boolean }>('/api/auth/verify');
      return data.valid;
    } catch {
      clearAuthToken();
      return false;
    }
  },

  async logout(): Promise<void> {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      clearAuthToken();
    }
  },

  async changeCredentials(currentPassword: string, newUsername: string, newPassword: string): Promise<{ success: boolean; message: string; username: string }> {
    return apiFetch('/api/auth/change-credentials', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newUsername, newPassword }),
    });
  },

  // Settings
  async getSettings(): Promise<AppSettings> {
    return apiFetch<AppSettings>('/api/settings');
  },

  async updateSettings(settings: Partial<AppSettings>): Promise<{ success: boolean; settings: AppSettings; message: string }> {
    return apiFetch('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  async uploadLogo(logoBase64: string): Promise<{ success: boolean; logoUrl: string; message: string }> {
    return apiFetch('/api/settings/upload-logo', {
      method: 'POST',
      body: JSON.stringify({ logoBase64 }),
    });
  },

  async deleteLogo(): Promise<{ success: boolean; message: string }> {
    return apiFetch('/api/settings/logo', {
      method: 'DELETE',
    });
  },

  // Students
  async getStudents(params: { search?: string; kelas?: string } = {}): Promise<{ students: Student[]; total: number }> {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.kelas && params.kelas !== 'Semua') query.set('kelas', params.kelas);
    return apiFetch(`/api/students?${query.toString()}`);
  },

  async createStudent(student: Omit<Student, 'id' | 'qrCodeData' | 'createdAt'>): Promise<{ success: boolean; student: Student; message: string }> {
    return apiFetch('/api/students', {
      method: 'POST',
      body: JSON.stringify(student),
    });
  },

  async bulkCreateStudents(students: Partial<Student>[]): Promise<{ success: boolean; addedCount: number; skippedCount: number; skipped: string[]; message: string }> {
    return apiFetch('/api/students/bulk', {
      method: 'POST',
      body: JSON.stringify({ students }),
    });
  },

  async updateStudent(id: string, student: Partial<Student>): Promise<{ success: boolean; student: Student; message: string }> {
    return apiFetch(`/api/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(student),
    });
  },

  async deleteStudent(id: string): Promise<{ success: boolean; message: string }> {
    return apiFetch(`/api/students/${id}`, {
      method: 'DELETE',
    });
  },

  // Attendance & QR Scanner
  async scanQr(
    qrContent: string,
    customStatus?: AttendanceStatus,
    notes?: string
  ): Promise<{
    success: boolean;
    alreadyScanned: boolean;
    student: Student;
    record: AttendanceRecord;
    message: string;
  }> {
    return apiFetch('/api/attendance/scan', {
      method: 'POST',
      body: JSON.stringify({ qrContent, customStatus, notes }),
    });
  },

  async manualAttendance(
    studentId: string,
    date: string,
    status: AttendanceStatus,
    notes?: string
  ): Promise<{ success: boolean; record: AttendanceRecord; message: string }> {
    return apiFetch('/api/attendance/manual', {
      method: 'POST',
      body: JSON.stringify({ studentId, date, status, notes }),
    });
  },

  async deleteAttendance(id: string): Promise<{ success: boolean; message: string }> {
    return apiFetch(`/api/attendance/${id}`, {
      method: 'DELETE',
    });
  },

  async getAttendance(params: {
    date?: string;
    startDate?: string;
    endDate?: string;
    kelas?: string;
    status?: string;
    search?: string;
  } = {}): Promise<{ records: AttendanceRecord[]; total: number }> {
    const query = new URLSearchParams();
    if (params.date) query.set('date', params.date);
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    if (params.kelas && params.kelas !== 'Semua') query.set('kelas', params.kelas);
    if (params.status && params.status !== 'Semua') query.set('status', params.status);
    if (params.search) query.set('search', params.search);
    return apiFetch(`/api/attendance?${query.toString()}`);
  },

  // Dashboard Stats
  async getStats(): Promise<DashboardStats> {
    return apiFetch<DashboardStats>('/api/stats');
  },
};
