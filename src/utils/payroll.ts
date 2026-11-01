import type {
  Attendance,
  AttendanceSummary,
  Company,
  HrdCompensation,
  JobRole,
  PayrollRow,
  Submission,
  User,
} from '../types';
import { inclusiveDays, periodBounds } from './date';

/** Gaji pokok harian: konversi memakai asumsi demo hari kerja perusahaan. */
export function dailyBaseSalary(role: Pick<JobRole, 'baseSalary' | 'salaryBasis'>, workDaysPerMonth: number): number {
  if (role.salaryBasis === 'HARIAN') return Math.round(role.baseSalary);
  return Math.round(role.baseSalary / Math.max(1, workDaysPerMonth));
}

export function dailyGrossRate(role: Pick<JobRole, 'baseSalary' | 'salaryBasis' | 'transportAllowance' | 'mealAllowance'>, workDaysPerMonth: number): number {
  return dailyBaseSalary(role, workDaysPerMonth) + role.transportAllowance + role.mealAllowance;
}

export function summaryFromAttendance(records: Attendance[], referenceUserIds?: string[]): AttendanceSummary {
  const filtered = referenceUserIds
    ? records.filter((record) => referenceUserIds.includes(record.userId))
    : records;
  return {
    onTime: filtered.filter((record) => record.status === 'ON_TIME').length,
    late: filtered.filter((record) => record.status === 'LATE').length,
    absent: filtered.filter((record) => record.status === 'ABSENT').length,
    onLeave: filtered.filter((record) => record.status === 'ON_LEAVE').length,
    total: filtered.length,
  };
}

function daysInPeriod(start: string, end: string | undefined, period: string): number {
  const bounds = periodBounds(period);
  const rangeEnd = end ?? start;
  const from = start > bounds.start ? start : bounds.start;
  const to = rangeEnd < bounds.end ? rangeEnd : bounds.end;
  if (from > to) return 0;
  return inclusiveDays(from, to);
}

interface PayrollInput {
  user: User;
  role: JobRole;
  attendances: Attendance[];
  submissions: Submission[];
  company: Company;
  period: string;
}

export function computePayrollRow({
  user,
  role,
  attendances,
  submissions,
  company,
  period,
}: PayrollInput): PayrollRow {
  const bounds = periodBounds(period);
  const monthlyRecords = attendances.filter(
    (record) => record.userId === user.id && record.date >= bounds.start && record.date <= bounds.end,
  );

  const presentRecords = monthlyRecords.filter(
    (record) => record.status === 'ON_TIME' || record.status === 'LATE',
  );
  const lateRecords = presentRecords.filter((record) => record.status === 'LATE');

  const dailyBase = dailyBaseSalary(role, company.workDaysPerMonth);
  const presentDays = presentRecords.length;
  const lateMinutes = lateRecords.reduce((total, record) => total + record.lateMinutes, 0);

  const transportTotal = presentDays * role.transportAllowance;
  const mealTotal = presentDays * role.mealAllowance;
  const lateDeduction = lateMinutes * role.latePenaltyPerMinute;

  const approved = submissions.filter(
    (submission) => submission.userId === user.id && submission.status === 'FULLY_APPROVED',
  );

  const unpaidLeaveDays = approved
    .filter((submission) => submission.type === 'LEAVE' && submission.leaveCategory === 'UNPAID')
    .reduce((total, submission) => total + daysInPeriod(submission.startDate, submission.endDate, period), 0);

  const permissionDays = approved
    .filter((submission) => submission.type === 'PERMISSION')
    .reduce((total, submission) => total + daysInPeriod(submission.startDate, submission.endDate, period), 0);

  const unpaidLeaveDeduction = unpaidLeaveDays * dailyBase;
  const permissionDeduction = permissionDays * dailyBase;

  const grossEarned = Math.max(
    0,
    presentDays * dailyBase + transportTotal + mealTotal - lateDeduction - unpaidLeaveDeduction - permissionDeduction,
  );

  const dailyRate = dailyBase + role.transportAllowance + role.mealAllowance;
  const remainingDays = Math.max(0, company.workDaysPerMonth - presentDays);
  const projectedGross = Math.max(
    0,
    grossEarned + remainingDays * dailyRate - unpaidLeaveDeduction - permissionDeduction,
  );

  return {
    userId: user.id,
    name: user.name,
    employeeCode: user.employeeCode,
    roleName: role.name,
    kind: 'EMPLOYEE',
    status: user.status,
    period,
    presentDays,
    onTimeDays: presentRecords.filter((record) => record.status === 'ON_TIME').length,
    lateDays: lateRecords.length,
    absentDays: monthlyRecords.filter((record) => record.status === 'ABSENT').length,
    lateMinutes,
    dailyBaseSalary: dailyBase,
    monthlyBaseSalary: dailyBase * company.workDaysPerMonth,
    transportPerDay: role.transportAllowance,
    mealPerDay: role.mealAllowance,
    transportTotal,
    mealTotal,
    fixedAllowance: 0,
    otherDeduction: 0,
    lateDeduction,
    unpaidLeaveDays,
    unpaidLeaveDeduction,
    permissionDays,
    permissionDeduction,
    grossEarned,
    projectedGross,
    workDaysPerMonth: company.workDaysPerMonth,
  };
}

export function computeHrdPayrollRow(
  user: User,
  compensation: HrdCompensation,
  company: Company,
  period: string,
): PayrollRow {
  const gross =
    compensation.baseSalary +
    compensation.positionAllowance +
    compensation.transportAllowance +
    compensation.mealAllowance -
    compensation.bpjsDeduction;

  const monthlyBase = compensation.baseSalary;
  const dailyBase = Math.round(monthlyBase / Math.max(1, company.workDaysPerMonth));

  return {
    userId: user.id,
    name: user.name,
    employeeCode: user.employeeCode,
    roleName: 'Admin / HRD',
    kind: 'HRD',
    status: user.status,
    period,
    presentDays: company.workDaysPerMonth,
    onTimeDays: company.workDaysPerMonth,
    lateDays: 0,
    absentDays: 0,
    lateMinutes: 0,
    dailyBaseSalary: dailyBase,
    monthlyBaseSalary: monthlyBase,
    transportPerDay: 0,
    mealPerDay: 0,
    transportTotal: compensation.transportAllowance,
    mealTotal: compensation.mealAllowance,
    fixedAllowance: compensation.positionAllowance,
    otherDeduction: compensation.bpjsDeduction,
    lateDeduction: 0,
    unpaidLeaveDays: 0,
    unpaidLeaveDeduction: 0,
    permissionDays: 0,
    permissionDeduction: 0,
    grossEarned: Math.max(0, gross),
    projectedGross: Math.max(0, gross),
    workDaysPerMonth: company.workDaysPerMonth,
  };
}

export interface PayrollSummary {
  total: number;
  projectedTotal: number;
  employeeTotal: number;
  hrdTotal: number;
  transportTotal: number;
  mealTotal: number;
  lateDeductionTotal: number;
  presentDays: number;
  headcount: number;
}

export function summarizePayroll(rows: PayrollRow[]): PayrollSummary {
  return rows.reduce<PayrollSummary>(
    (summary, row) => ({
      total: summary.total + row.grossEarned,
      projectedTotal: summary.projectedTotal + row.projectedGross,
      employeeTotal: summary.employeeTotal + (row.kind === 'EMPLOYEE' ? row.grossEarned : 0),
      hrdTotal: summary.hrdTotal + (row.kind === 'HRD' ? row.grossEarned : 0),
      transportTotal: summary.transportTotal + row.transportTotal,
      mealTotal: summary.mealTotal + row.mealTotal,
      lateDeductionTotal: summary.lateDeductionTotal + row.lateDeduction,
      presentDays: summary.presentDays + row.presentDays,
      headcount: summary.headcount + 1,
    }),
    {
      total: 0,
      projectedTotal: 0,
      employeeTotal: 0,
      hrdTotal: 0,
      transportTotal: 0,
      mealTotal: 0,
      lateDeductionTotal: 0,
      presentDays: 0,
      headcount: 0,
    },
  );
}

/** Estimasi gaji satu hari berdasarkan komponen role + denda hari ini. */
export function estimateDailyPay(role: JobRole, company: Company, lateMinutes = 0): number {
  const base = dailyGrossRate(role, company.workDaysPerMonth);
  return Math.max(0, base - lateMinutes * role.latePenaltyPerMinute);
}
