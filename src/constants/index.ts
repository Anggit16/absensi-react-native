import type {
  AccountStatus,
  AttendanceStatus,
  DemoAccount,
  EmploymentType,
  LeaveCategory,
  LocationType,
  SalaryBasis,
  SubmissionStatus,
  SubmissionType,
  UserRole,
} from '../types';

export type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary' | 'violet';

export interface BadgeMeta {
  label: string;
  tone: BadgeTone;
}

export const ROLE_LABEL: Record<UserRole, string> = {
  OWNER: 'Owner',
  HRD: 'Admin / HRD',
  EMPLOYEE: 'Karyawan',
};

export const ROLE_DESCRIPTION: Record<UserRole, string> = {
  OWNER: 'Akses penuh, approval final, dan pengaturan perusahaan',
  HRD: 'Kelola karyawan, absensi, dan verifikasi tahap pertama',
  EMPLOYEE: 'Absensi, pengajuan, dan informasi payroll pribadi',
};

export const ACCOUNT_STATUS_LABEL: Record<AccountStatus, string> = {
  ACTIVE: 'Aktif',
  INACTIVE: 'Nonaktif',
};

export const ACCOUNT_STATUS_META: Record<AccountStatus, BadgeMeta> = {
  ACTIVE: { label: 'Aktif', tone: 'success' },
  INACTIVE: { label: 'Nonaktif', tone: 'neutral' },
};

export const ATTENDANCE_STATUS_META: Record<AttendanceStatus, BadgeMeta> = {
  ON_TIME: { label: 'On Time', tone: 'success' },
  LATE: { label: 'Terlambat', tone: 'warning' },
  ABSENT: { label: 'Absen', tone: 'danger' },
  ON_LEAVE: { label: 'Cuti / Izin', tone: 'info' },
};

export const SUBMISSION_STATUS_META: Record<SubmissionStatus, BadgeMeta> = {
  PENDING_HRD: { label: 'Menunggu HRD', tone: 'warning' },
  PENDING_OWNER: { label: 'Menunggu Owner', tone: 'info' },
  FULLY_APPROVED: { label: 'Disetujui Penuh', tone: 'success' },
  REJECTED: { label: 'Ditolak', tone: 'danger' },
  CANCELLED: { label: 'Dibatalkan', tone: 'neutral' },
};

export const SUBMISSION_STATUS_DESCRIPTION: Record<SubmissionStatus, string> = {
  PENDING_HRD: 'Menunggu verifikasi Admin/HRD',
  PENDING_OWNER: 'Lolos HRD, menunggu persetujuan final Owner',
  FULLY_APPROVED: 'Disetujui HRD dan Owner',
  REJECTED: 'Ditolak — alur persetujuan berhenti',
  CANCELLED: 'Dibatalkan oleh karyawan sebelum diverifikasi',
};

export const SUBMISSION_TYPE_LABEL: Record<SubmissionType, string> = {
  LEAVE: 'Cuti',
  PERMISSION: 'Izin',
  SICK: 'Sakit',
  RESIGN: 'Resign',
};

export const SUBMISSION_TYPE_DESCRIPTION: Record<SubmissionType, string> = {
  LEAVE: 'Cuti tahunan, sakit, tanpa gaji, atau khusus',
  PERMISSION: 'Izin keperluan pribadi di hari kerja',
  SICK: 'Laporan sakit dengan surat dokter',
  RESIGN: 'Pengunduran diri dengan tanggal efektif',
};

export const LEAVE_CATEGORY_LABEL: Record<LeaveCategory, string> = {
  ANNUAL: 'Cuti Tahunan',
  SICK_LEAVE: 'Cuti Sakit',
  UNPAID: 'Cuti Tanpa Gaji',
  SPECIAL: 'Cuti Khusus',
};

export const LEAVE_CATEGORY_DESCRIPTION: Record<LeaveCategory, string> = {
  ANNUAL: 'Mengurangi kuota cuti tahunan setelah disetujui penuh',
  SICK_LEAVE: 'Tidak mengurangi kuota tahunan, wajib surat dokter',
  UNPAID: 'Tidak mengurangi kuota, gaji tanggal terkait menjadi nol',
  SPECIAL: 'Tidak menggunakan saldo cuti tahunan (mis. pernikahan)',
};

export const SALARY_BASIS_LABEL: Record<SalaryBasis, string> = {
  HARIAN: 'Harian',
  BULANAN: 'Bulanan',
};

export const EMPLOYMENT_TYPE_LABEL: Record<EmploymentType, string> = {
  TETAP: 'Karyawan Tetap',
  KONTRAK: 'Kontrak',
  MAGANG: 'Magang',
};

export const LOCATION_TYPE_LABEL: Record<LocationType, string> = {
  KANTOR: 'Kantor Pusat',
  PROYEK: 'Lokasi Proyek',
  CABANG: 'Cabang',
};

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    key: 'owner',
    role: 'OWNER',
    label: 'Owner',
    description: 'Dashboard eksekutif & approval final',
    email: 'owner@absensipro.id',
    password: 'owner123',
  },
  {
    key: 'hrd',
    role: 'HRD',
    label: 'Admin / HRD',
    description: 'Kelola karyawan & verifikasi tahap 1',
    email: 'hrd@absensipro.id',
    password: 'hrd123',
  },
  {
    key: 'employee',
    role: 'EMPLOYEE',
    label: 'Karyawan',
    description: 'Absensi, pengajuan, dan payroll pribadi',
    email: 'karyawan@absensipro.id',
    password: 'karyawan123',
  },
];

export const PERMISSION_TYPES = [
  'Keperluan pribadi',
  'Urusan keluarga',
  'Dinas luar kantor',
  'Kegiatan sosial / komunitas',
] as const;

export const ANNUAL_LEAVE_QUOTA_DEFAULT = 12;

/** Salinan aturan bisnis PRD yang ditampilkan di UI. */
export const LEAVE_POLICY_RULES = [
  {
    title: 'Cuti Tahunan',
    body: 'Mengurangi kuota cuti tahunan setelah HRD dan Owner menyetujui. Tidak memotong gaji.',
  },
  {
    title: 'Cuti Sakit',
    body: 'Tidak mengurangi kuota tahunan, wajib melampirkan surat dokter, dan tidak memotong gaji.',
  },
  {
    title: 'Cuti Tanpa Gaji',
    body: 'Tidak mengurangi kuota tahunan, tetapi gaji untuk tanggal terkait menjadi nol.',
  },
  {
    title: 'Izin Pribadi',
    body: 'Tidak mengurangi kuota tahunan. Potongan mengikuti kebijakan durasi izin (gaji pokok harian per hari izin).',
  },
  {
    title: 'Cuti Khusus',
    body: 'Tidak menggunakan saldo cuti tahunan dan tidak memotong gaji.',
  },
] as const;

export const PAYROLL_RULES = [
  'Gaji pokok harian = gaji pokok ÷ 22 hari kerja (asumsi perusahaan).',
  'Tunjangan transportasi dan makan dihitung per hari hadir.',
  'Denda keterlambatan = menit terlambat × denda per menit pada role.',
  'Cuti tanpa gaji memotong gaji pokok harian; izin pribadi memotong gaji pokok harian per hari.',
  'Proyeksi bulanan mengasumsikan seluruh 22 hari kerja dihadiri.',
] as const;

export const TAB_ICON_SIZE = 22;
