/**
 * Tipe domain aplikasi AbsensiPro. Nilai berasal dari API Laravel.
 * Struktur dibuat menyerupai kontrak API agar mudah diganti dengan backend.
 */

export type UserRole = 'OWNER' | 'HRD' | 'EMPLOYEE';
export type AccountStatus = 'ACTIVE' | 'INACTIVE';

export type AttendanceStatus = 'ON_TIME' | 'LATE' | 'ABSENT' | 'ON_LEAVE';

export type SubmissionType = 'LEAVE' | 'PERMISSION' | 'SICK' | 'RESIGN';
export type LeaveCategory = 'ANNUAL' | 'SICK_LEAVE' | 'UNPAID' | 'SPECIAL';

export type SubmissionStatus =
  | 'PENDING_HRD'
  | 'PENDING_OWNER'
  | 'FULLY_APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

export type ApprovalStage = 'HRD' | 'OWNER';
export type ApprovalDecision = 'APPROVED' | 'REJECTED';

export type SalaryBasis = 'HARIAN' | 'BULANAN';
export type EmploymentType = 'TETAP' | 'KONTRAK' | 'MAGANG';
export type LocationType = 'KANTOR' | 'PROYEK' | 'CABANG';

export interface Company {
  id: string;
  name: string;
  legalName: string;
  industry: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  taxId: string;
  timezone: string;
  /** Asumsi demo: jumlah hari kerja per bulan untuk konversi gaji bulanan <-> harian. */
  workDaysPerMonth: number;
  logoInitials: string;
  establishedYear: number;
}

export interface JobRole {
  id: string;
  companyId: string;
  name: string;
  department: string;
  checkInTime: string; // "HH:mm"
  checkOutTime: string; // "HH:mm"
  lateToleranceMinutes: number;
  salaryBasis: SalaryBasis;
  /** Nominal gaji pokok sesuai `salaryBasis`. */
  baseSalary: number;
  transportAllowance: number; // per hari hadir
  mealAllowance: number; // per hari hadir
  latePenaltyPerMinute: number;
  annualLeaveQuota: number;
  locationId: string;
  status: AccountStatus;
  createdAt: string;
}

export interface OfficeLocation {
  id: string;
  companyId: string;
  name: string;
  type: LocationType;
  address: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  status: AccountStatus;
}

export interface User {
  id: string;
  companyId: string;
  name: string;
  email: string;
  username: string;
  role: UserRole;
  employeeCode: string;
  jobRoleId?: string;
  locationId?: string;
  phone: string;
  joinDate: string; // YYYY-MM-DD
  birthDate?: string;
  address?: string;
  emergencyContact?: string;
  employmentType: EmploymentType;
  status: AccountStatus;
  isDemoAccount?: boolean;
  notes?: string;
}

export interface HrdCompensation {
  userId: string;
  baseSalary: number;
  positionAllowance: number;
  transportAllowance: number;
  mealAllowance: number;
  bpjsDeduction: number;
  updatedAt: string;
}

export interface Attendance {
  id: string;
  companyId: string;
  userId: string;
  date: string; // YYYY-MM-DD
  checkInAt?: string; // HH:mm
  checkOutAt?: string; // HH:mm
  checkOutDistanceMeters?: number;
  checkOutSelfieCaptured?: boolean;
  status: AttendanceStatus;
  lateMinutes: number;
  locationId?: string;
  locationName?: string;
  latitude?: number;
  longitude?: number;
  distanceMeters?: number;
  /** true = foto selfie absensi tersimpan di server (bukan verifikasi biometrik). */
  selfieCaptured?: boolean;
  note?: string;
}

export interface LeaveAdjustment {
  id: string;
  at: string; // ISO datetime
  byName: string;
  delta: number;
  reason: string;
}

export interface LeaveBalance {
  id: string;
  companyId: string;
  userId: string;
  year: number;
  totalQuota: number;
  used: number;
  adjustments: LeaveAdjustment[];
}

export interface ApprovalStep {
  stage: ApprovalStage;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  decision: ApprovalDecision;
  note: string;
  decidedAt: string; // ISO datetime
}

export interface Submission {
  id: string;
  code: string;
  companyId: string;
  userId: string;
  type: SubmissionType;
  leaveCategory?: LeaveCategory;
  permissionType?: string;
  startDate: string;
  endDate?: string;
  days: number;
  reason: string;
  attachmentName?: string;
  resignEffectiveDate?: string;
  createdAt: string; // ISO datetime
  status: SubmissionStatus;
  approvals: ApprovalStep[];
  /** Mencegah pemotongan saldo cuti dua kali untuk pengajuan yang sama. */
  balanceApplied: boolean;
  cancelledAt?: string;
}

/** Baris rekap payroll hasil perhitungan aplikasi dari data absensi server. */
export interface PayrollRow {
  userId: string;
  name: string;
  employeeCode: string;
  roleName: string;
  kind: 'EMPLOYEE' | 'HRD';
  status: AccountStatus;
  period: string; // YYYY-MM
  presentDays: number;
  onTimeDays: number;
  lateDays: number;
  absentDays: number;
  lateMinutes: number;
  dailyBaseSalary: number;
  monthlyBaseSalary: number;
  transportPerDay: number;
  mealPerDay: number;
  transportTotal: number;
  mealTotal: number;
  fixedAllowance: number;
  otherDeduction: number;
  lateDeduction: number;
  unpaidLeaveDays: number;
  unpaidLeaveDeduction: number;
  permissionDays: number;
  permissionDeduction: number;
  grossEarned: number;
  projectedGross: number;
  workDaysPerMonth: number;
}

export interface AttendanceSummary {
  onTime: number;
  late: number;
  absent: number;
  onLeave: number;
  total: number;
}

/** Kumpulan data yang disinkronkan dari API untuk seluruh layar. */
export interface WorkspaceData {
  company: Company;
  users: User[];
  roles: JobRole[];
  locations: OfficeLocation[];
  attendances: Attendance[];
  leaveBalances: LeaveBalance[];
  submissions: Submission[];
  hrdCompensations: HrdCompensation[];
}

export interface DemoAccount {
  key: 'owner' | 'hrd' | 'employee';
  role: UserRole;
  label: string;
  description: string;
  email: string;
  password: string;
}
