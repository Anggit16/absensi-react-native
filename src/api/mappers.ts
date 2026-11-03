/**
 * Transformasi respons API (camelCase) menjadi tipe domain aplikasi.
 *
 * Tujuannya agar 31 layar yang sudah ada tetap memakai `AppContextValue`
 * tanpa perubahan bentuk data.
 */

import type {
  Attendance,
  Company,
  HrdCompensation,
  JobRole,
  LeaveBalance,
  OfficeLocation,
  PayrollRow,
  Submission,
  User,
} from '../types';
import type { PayrollSummary } from '../utils/payroll';
import type {
  AttendanceRecord,
  AuthUser,
  CompanyRecord,
  JobRoleRecord,
  LeaveBalanceRecord,
  OfficeLocationRecord,
  PayrollRowRecord,
  PayrollSummaryRecord,
  SubmissionRecord,
} from './index';

export function mapCompany(record: CompanyRecord): Company {
  return {
    id: record.id,
    name: record.name,
    legalName: record.legalName ?? '',
    industry: record.industry ?? '',
    address: record.address ?? '',
    city: record.city ?? '',
    phone: record.phone ?? '',
    email: record.email ?? '',
    taxId: record.taxId ?? '',
    timezone: record.timezone,
    workDaysPerMonth: record.workDaysPerMonth,
    logoInitials: record.logoInitials ?? record.name.slice(0, 2).toUpperCase(),
    establishedYear: record.establishedYear ?? 0,
  };
}

export function mapUser(record: AuthUser): User {
  return {
    id: record.id,
    companyId: record.companyId,
    name: record.name,
    email: record.email,
    username: record.username,
    role: record.role,
    employeeCode: record.employeeCode,
    jobRoleId: record.jobRoleId ?? undefined,
    locationId: record.locationId ?? undefined,
    phone: record.phone ?? '',
    joinDate: record.joinDate ?? '',
    birthDate: record.birthDate ?? undefined,
    address: record.address ?? undefined,
    emergencyContact: record.emergencyContact ?? undefined,
    employmentType: record.employmentType,
    status: record.status,
    isDemoAccount: record.isDemoAccount,
    notes: record.notes ?? undefined,
  };
}

export function mapCompensation(record: AuthUser): HrdCompensation | undefined {
  if (!record.compensation) return undefined;

  return {
    userId: record.compensation.userId,
    baseSalary: record.compensation.baseSalary,
    positionAllowance: record.compensation.positionAllowance,
    transportAllowance: record.compensation.transportAllowance,
    mealAllowance: record.compensation.mealAllowance,
    bpjsDeduction: record.compensation.bpjsDeduction,
    updatedAt: record.compensation.updatedAt ?? new Date().toISOString(),
  };
}

export function mapJobRole(record: JobRoleRecord): JobRole {
  return {
    id: record.id,
    companyId: record.companyId,
    name: record.name,
    department: record.department ?? '',
    checkInTime: record.checkInTime,
    checkOutTime: record.checkOutTime,
    lateToleranceMinutes: record.lateToleranceMinutes,
    salaryBasis: record.salaryBasis,
    baseSalary: record.baseSalary,
    transportAllowance: record.transportAllowance,
    mealAllowance: record.mealAllowance,
    latePenaltyPerMinute: record.latePenaltyPerMinute,
    annualLeaveQuota: record.annualLeaveQuota,
    locationId: record.locationId ?? '',
    status: record.status,
    createdAt: record.createdAt ?? '',
  };
}

export function mapLocation(record: OfficeLocationRecord): OfficeLocation {
  return {
    id: record.id,
    companyId: record.companyId,
    name: record.name,
    type: record.type,
    address: record.address,
    latitude: record.latitude,
    longitude: record.longitude,
    radiusMeters: record.radiusMeters,
    status: record.status,
  };
}

export function mapAttendance(record: AttendanceRecord): Attendance {
  return {
    id: record.id,
    companyId: record.companyId,
    userId: record.userId,
    date: record.date,
    checkInAt: record.checkInAt ?? undefined,
    checkOutAt: record.checkOutAt ?? undefined,
    checkOutDistanceMeters: record.checkOutDistanceMeters ?? undefined,
    checkOutSelfieCaptured: record.checkOutSelfieCaptured ?? undefined,
    status: record.status,
    lateMinutes: record.lateMinutes,
    locationId: record.locationId ?? undefined,
    locationName: record.locationName ?? undefined,
    latitude: record.latitude ?? undefined,
    longitude: record.longitude ?? undefined,
    distanceMeters: record.distanceMeters ?? undefined,
    selfieCaptured: record.selfieCaptured,
    note: record.note ?? undefined,
  };
}

export function mapLeaveBalance(record: LeaveBalanceRecord, fallbackCompanyId = ''): LeaveBalance {
  return {
    id: record.id,
    companyId: record.companyId ?? fallbackCompanyId,
    userId: record.userId,
    year: record.year,
    totalQuota: record.totalQuota,
    used: record.used,
    adjustments: (record.adjustments ?? []).map((item) => ({
      id: item.id,
      at: item.at ?? '',
      byName: item.byName ?? 'HRD',
      delta: item.delta,
      reason: item.reason,
    })),
  };
}

export function mapSubmission(record: SubmissionRecord): Submission {
  return {
    id: record.id,
    code: record.code,
    companyId: record.companyId,
    userId: record.userId,
    type: record.type,
    leaveCategory: record.leaveCategory ?? undefined,
    permissionType: record.permissionType ?? undefined,
    startDate: record.startDate,
    endDate: record.endDate ?? undefined,
    days: record.days,
    reason: record.reason,
    attachmentName: record.attachmentName ?? undefined,
    resignEffectiveDate: record.resignEffectiveDate ?? undefined,
    createdAt: record.createdAt ?? new Date().toISOString(),
    status: record.status,
    approvals: (record.approvals ?? []).map((step) => ({
      stage: step.stage,
      actorId: step.actorId,
      actorName: step.actorName ?? '',
      actorRole: step.actorRole ?? 'EMPLOYEE',
      decision: step.decision,
      note: step.note ?? '',
      decidedAt: step.decidedAt,
    })),
    balanceApplied: record.balanceApplied,
    cancelledAt: record.cancelledAt ?? undefined,
  };
}

/** Urutkan pengajuan terbaru lebih dulu. */
export function sortSubmissions(items: Submission[]): Submission[] {
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Ubah baris respons payroll server menjadi tipe domain aplikasi. */
export function mapPayrollRow(record: PayrollRowRecord): PayrollRow {
  return {
    userId: record.userId,
    name: record.name,
    employeeCode: record.employeeCode,
    roleName: record.roleName,
    kind: record.kind,
    status: record.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    period: record.period,
    presentDays: record.presentDays,
    onTimeDays: record.onTimeDays,
    lateDays: record.lateDays,
    absentDays: record.absentDays,
    lateMinutes: record.lateMinutes,
    dailyBaseSalary: record.dailyBaseSalary,
    monthlyBaseSalary: record.monthlyBaseSalary,
    transportPerDay: record.transportPerDay,
    mealPerDay: record.mealPerDay,
    transportTotal: record.transportTotal,
    mealTotal: record.mealTotal,
    fixedAllowance: record.fixedAllowance,
    otherDeduction: record.otherDeduction,
    lateDeduction: record.lateDeduction,
    unpaidLeaveDays: record.unpaidLeaveDays,
    unpaidLeaveDeduction: record.unpaidLeaveDeduction,
    permissionDays: record.permissionDays,
    permissionDeduction: record.permissionDeduction,
    grossEarned: record.grossEarned,
    projectedGross: record.projectedGross,
    workDaysPerMonth: record.workDaysPerMonth,
  };
}

/** Ubah ringkasan respons payroll server menjadi tipe domain aplikasi. */
export function mapPayrollSummary(record: PayrollSummaryRecord): PayrollSummary {
  return {
    total: record.total,
    projectedTotal: record.projectedTotal,
    employeeTotal: record.employeeTotal,
    hrdTotal: record.hrdTotal,
    transportTotal: record.transportTotal,
    mealTotal: record.mealTotal,
    lateDeductionTotal: record.lateDeductionTotal,
    presentDays: record.presentDays,
    headcount: record.headcount,
  };
}

/** Urutkan absensi tanggal terbaru lebih dulu. */
export function sortAttendances(items: Attendance[]): Attendance[] {
  return [...items].sort((a, b) => b.date.localeCompare(a.date));
}
