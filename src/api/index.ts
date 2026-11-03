/**
 * Kontrak endpoint AbsensiPro API (Laravel).
 * Tipe di file ini sengaja memakai camelCase agar cocok dengan
 * tipe domain di `src/types` tanpa transformasi tambahan.
 */

import { request, setAuthToken, type RequestOptions } from './client';

// ---------------------------------------------------------------------------
// Tipe respons
// ---------------------------------------------------------------------------

export interface AuthUser {
  id: string;
  companyId: string;
  name: string;
  email: string;
  username: string;
  role: 'OWNER' | 'HRD' | 'EMPLOYEE';
  employeeCode: string;
  jobRoleId: string | null;
  jobRoleName?: string | null;
  locationId: string | null;
  locationName?: string | null;
  phone?: string | null;
  joinDate?: string | null;
  birthDate?: string | null;
  address?: string | null;
  emergencyContact?: string | null;
  employmentType: 'TETAP' | 'KONTRAK' | 'MAGANG';
  status: 'ACTIVE' | 'INACTIVE';
  isDemoAccount: boolean;
  notes?: string | null;
  compensation?: HrdCompensation | null;
}

export interface HrdCompensation {
  userId: string;
  baseSalary: number;
  positionAllowance: number;
  transportAllowance: number;
  mealAllowance: number;
  bpjsDeduction: number;
  updatedAt?: string | null;
}

export interface LeaveBalance {
  userId: string;
  name?: string;
  employeeCode?: string;
  year: number;
  totalQuota: number;
  used: number;
  remaining: number;
}

export interface LeaveAdjustmentRecord {
  id: string;
  at: string;
  byName: string;
  delta: number;
  reason: string;
}

/** Baris tabel saldo cuti (sudah termasuk riwayat penyesuaian). */
export interface LeaveBalanceRecord extends LeaveBalance {
  id: string;
  companyId: string;
  roleName?: string;
  adjustments: LeaveAdjustmentRecord[];
}

export interface CompanyRecord {
  id: string;
  name: string;
  legalName: string | null;
  industry: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  taxId: string | null;
  timezone: string;
  workDaysPerMonth: number;
  logoInitials: string | null;
  establishedYear: number | null;
  annualLeaveQuotaDefault: number;
}

export interface JobRoleRecord {
  id: string;
  companyId: string;
  name: string;
  department: string | null;
  checkInTime: string;
  checkOutTime: string;
  lateToleranceMinutes: number;
  salaryBasis: 'HARIAN' | 'BULANAN';
  baseSalary: number;
  transportAllowance: number;
  mealAllowance: number;
  latePenaltyPerMinute: number;
  annualLeaveQuota: number;
  locationId: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string | null;
}

export interface OfficeLocationRecord {
  id: string;
  companyId: string;
  name: string;
  type: 'KANTOR' | 'PROYEK' | 'CABANG';
  address: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  status: 'ACTIVE' | 'INACTIVE';
  isDefault: boolean;
}

export interface AttendanceRecord {
  id: string;
  companyId: string;
  userId: string;
  userName?: string;
  date: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  checkOutLatitude?: number | null;
  checkOutLongitude?: number | null;
  checkOutDistanceMeters?: number | null;
  checkOutSelfieCaptured?: boolean;
  checkOutSelfieUrl?: string | null;
  status: 'ON_TIME' | 'LATE' | 'ABSENT' | 'ON_LEAVE';
  lateMinutes: number;
  locationId: string | null;
  locationName?: string | null;
  latitude: number | null;
  longitude: number | null;
  distanceMeters: number | null;
  selfieCaptured: boolean;
  selfieUrl: string | null;
  note: string | null;
}

export interface ApprovalStepRecord {
  stage: 'HRD' | 'OWNER';
  actorId: string;
  actorName: string | null;
  actorRole: 'OWNER' | 'HRD' | 'EMPLOYEE' | null;
  decision: 'APPROVED' | 'REJECTED';
  note: string | null;
  decidedAt: string;
}

export interface SubmissionRecord {
  id: string;
  code: string;
  companyId: string;
  userId: string;
  userName?: string;
  employeeCode?: string;
  type: 'LEAVE' | 'PERMISSION' | 'SICK' | 'RESIGN';
  leaveCategory: 'ANNUAL' | 'SICK_LEAVE' | 'UNPAID' | 'SPECIAL' | null;
  permissionType: string | null;
  startDate: string;
  endDate: string | null;
  days: number;
  reason: string;
  attachmentName: string | null;
  attachmentUrl: string | null;
  resignEffectiveDate: string | null;
  createdAt: string | null;
  status: 'PENDING_HRD' | 'PENDING_OWNER' | 'FULLY_APPROVED' | 'REJECTED' | 'CANCELLED';
  balanceApplied: boolean;
  cancelledAt: string | null;
  nextStage: 'HRD' | 'OWNER' | null;
  approvals: ApprovalStepRecord[];
}

export interface PayrollSummaryRecord {
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

export interface PayrollRowRecord {
  userId: string;
  name: string;
  employeeCode: string;
  roleName: string;
  kind: 'EMPLOYEE' | 'HRD';
  status: 'ACTIVE' | 'INACTIVE';
  period: string;
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

export interface PayrollReport {
  period: string;
  status: 'DRAFT' | 'FINAL';
  scope: 'company' | 'self';
  rows: PayrollRowRecord[];
  summary: PayrollSummaryRecord;
  finalizedAt: string | null;
}

export interface LetterPayload {
  letterNumber: string;
  qrToken: string;
  verifyUrl: string;
  issuedAt: string;
  company: {
    name: string | null;
    legalName: string | null;
    address: string | null;
    city: string | null;
    phone: string | null;
  };
  employee: {
    name: string;
    employeeCode: string;
    jobRole: string | null;
    joinDate: string | null;
  };
  submission: {
    code: string;
    type: SubmissionRecord['type'];
    leaveCategory: SubmissionRecord['leaveCategory'];
    startDate: string;
    endDate: string | null;
    days: number;
    reason: string;
    status: SubmissionRecord['status'];
  };
  approvals: ApprovalStepRecord[];
}

/** Payload pengajuan baru; nama field mengikuti gaya camelCase aplikasi. */
export interface CreateSubmissionPayload {
  type: SubmissionRecord['type'];
  leaveCategory?: SubmissionRecord['leaveCategory'];
  permissionType?: string | null;
  startDate: string;
  endDate?: string | null;
  reason: string;
  resignEffectiveDate?: string | null;
  /** Nama lampiran. Unggah berkas belum tersedia pada API. */
  attachmentName?: string | null;
  attachment?: {
    uri: string;
    name: string;
    type: string;
  } | null;
}

export interface CheckInPayload {
  latitude: number;
  longitude: number;
  selfie?: { uri: string; name: string; type: string } | null;
  selfieCaptured?: boolean;
  note?: string | null;
}

// ---------------------------------------------------------------------------
// Endpoint
// ---------------------------------------------------------------------------

const unwrap = <T>(payload: { data: T }): T => payload.data;

export const api = {
  // --- Autentikasi -------------------------------------------------------
  async login(identifier: string, password: string, deviceName = 'expo-mobile') {
    const response = await request<{ token: string; user: AuthUser }>('/auth/token', {
      method: 'POST',
      body: { identifier, password, deviceName },
    });

    setAuthToken(response.token);

    return response;
  },

  async me() {
    return request<{
      user: AuthUser;
      leaveBalance: LeaveBalance;
      todayAttendance: AttendanceRecord | null;
    }>('/auth/me');
  },

  async logout() {
    await request<{ message: string }>('/auth/token', { method: 'DELETE' });
    setAuthToken(null);
  },

  async updateProfile(body: Record<string, unknown>) {
    return request<{ user: AuthUser }>('/auth/profile', { method: 'PUT', body });
  },

  // --- Dashboard --------------------------------------------------------
  dashboard<T = Record<string, unknown>>() {
    return request<T>('/dashboard');
  },

  // --- Perusahaan -------------------------------------------------------
  company() {
    return request<{ company: CompanyRecord }>('/company');
  },

  updateCompany(body: Record<string, unknown>) {
    return request<{ company: CompanyRecord }>('/company', { method: 'PUT', body });
  },

  // --- Role kerja -------------------------------------------------------
  async roles() {
    const response = await request<{ data: JobRoleRecord[] }>('/roles');
    return response.data;
  },

  async createRole(body: Record<string, unknown>) {
    const response = await request<{ data: JobRoleRecord }>('/roles', { method: 'POST', body });
    return response.data;
  },

  async updateRole(id: string, body: Record<string, unknown>) {
    const response = await request<{ data: JobRoleRecord }>(`/roles/${id}`, {
      method: 'PUT',
      body,
    });

    return response.data;
  },

  deleteRole(id: string) {
    return request<{ message?: string; data?: JobRoleRecord }>(`/roles/${id}`, {
      method: 'DELETE',
    });
  },

  // --- Lokasi kerja -----------------------------------------------------
  async locations() {
    const response = await request<{ data: OfficeLocationRecord[] }>('/locations');
    return response.data;
  },

  async createLocation(body: Record<string, unknown>) {
    const response = await request<{ data: OfficeLocationRecord }>('/locations', {
      method: 'POST',
      body,
    });

    return response.data;
  },

  async updateLocation(id: string, body: Record<string, unknown>) {
    const response = await request<{ data: OfficeLocationRecord }>(`/locations/${id}`, {
      method: 'PUT',
      body,
    });

    return response.data;
  },

  deleteLocation(id: string) {
    return request<{ message?: string }>(`/locations/${id}`, { method: 'DELETE' });
  },

  // --- Absensi ----------------------------------------------------------
  async todayAttendance() {
    const response = await request<{ data: AttendanceRecord | null }>('/attendances/today');
    return response.data;
  },

  async checkIn(payload: CheckInPayload) {
    const form = new FormData();
    form.append('latitude', String(payload.latitude));
    form.append('longitude', String(payload.longitude));
    form.append('selfieCaptured', payload.selfieCaptured ? '1' : '0');

    if (payload.note) form.append('note', payload.note);

    if (payload.selfie) {
      // React Native menerima objek {uri, name, type} sebagai file multipart.
      form.append('selfie', payload.selfie as unknown as Blob);
    }

    const response = await request<{ data: AttendanceRecord }>('/attendances/check-in', {
      method: 'POST',
      form,
    });

    return response.data;
  },

  async checkOut(payload: CheckInPayload) {
    const form = new FormData();
    form.append('latitude', String(payload.latitude));
    form.append('longitude', String(payload.longitude));
    form.append('selfieCaptured', payload.selfieCaptured ? '1' : '0');

    if (payload.note) form.append('note', payload.note);

    if (payload.selfie) {
      form.append('selfie', payload.selfie as unknown as Blob);
    }

    const response = await request<{ data: AttendanceRecord }>('/attendances/check-out', {
      method: 'POST',
      form,
    });

    return response.data;
  },

  async attendanceHistory(
    params: { from?: string; to?: string; userId?: string; scope?: 'company' } = {},
  ) {
    return request<{ data: AttendanceRecord[]; summary: Record<string, number> }>(
      '/attendances',
      { query: params },
    );
  },

  async dailyEstimate() {
    const response = await request<{
      data: {
        dailyBaseSalary: number;
        transportAllowance: number;
        mealAllowance: number;
        lateMinutes: number;
        lateDeduction: number;
        estimatedDailyPay: number;
      };
    }>('/attendances/daily-estimate');

    return response.data;
  },

  async attendanceMonitoring(date?: string) {
    return request<{ date: string; data: AttendanceRecord[]; summary: Record<string, number> }>(
      '/attendance-monitoring',
      { query: { date } },
    );
  },

  // --- Pengajuan --------------------------------------------------------
  async submissions(params: { scope?: 'inbox'; status?: string; type?: string; userId?: string } = {}) {
    const response = await request<{ data: SubmissionRecord[] }>('/submissions', {
      query: params,
    });

    return response.data;
  },

  async createSubmission(payload: CreateSubmissionPayload) {
    const fields: Record<string, unknown> = {
      type: payload.type,
      startDate: payload.startDate,
      reason: payload.reason,
    };

    if (payload.endDate) fields.endDate = payload.endDate;
    if (payload.leaveCategory) fields.leaveCategory = payload.leaveCategory;
    if (payload.permissionType) fields.permissionType = payload.permissionType;
    if (payload.resignEffectiveDate) fields.resignEffectiveDate = payload.resignEffectiveDate;
    if (payload.attachmentName) fields.attachmentName = payload.attachmentName;

    // Lampiran asli (bila ada) dikirim sebagai multipart, selain itu cukup JSON.
    let form: FormData | undefined;

    if (payload.attachment) {
      form = new FormData();

      Object.entries(fields).forEach(([key, value]) => form?.append(key, String(value)));
      form.append('attachment', payload.attachment as unknown as Blob);
    }

    const response = await request<{ data: SubmissionRecord }>('/submissions', {
      method: 'POST',
      ...(form ? { form } : { body: fields }),
    });

    return response.data;
  },

  async submission(id: string) {
    const response = await request<{ data: SubmissionRecord }>(`/submissions/${id}`);
    return response.data;
  },

  async cancelSubmission(id: string) {
    const response = await request<{ data: SubmissionRecord }>(`/submissions/${id}`, {
      method: 'DELETE',
    });

    return response.data;
  },

  async decideSubmission(
    id: string,
    stage: 'HRD' | 'OWNER',
    decision: 'APPROVED' | 'REJECTED',
    note?: string,
  ) {
    const response = await request<{ data: SubmissionRecord }>(`/submissions/${id}/decisions`, {
      method: 'POST',
      body: { stage, decision, note },
    });

    return response.data;
  },

  async submissionLetter(id: string) {
    const response = await request<{ data: LetterPayload }>(`/submissions/${id}/letter`);
    return response.data;
  },

  // --- Saldo cuti -------------------------------------------------------
  async leaveBalances(year?: number) {
    return request<{ data: LeaveBalanceRecord[]; year?: number }>('/leave-balances', {
      query: { year },
    });
  },

  async adjustLeaveBalance(userId: string, delta: number, reason: string, year?: number) {
    const response = await request<{ data: LeaveBalanceRecord }>(
      `/leave-balances/${userId}/adjustments`,
      { method: 'POST', body: { delta, reason, year } },
    );

    return response.data;
  },

  // --- Karyawan ---------------------------------------------------------
  async employees(params: { search?: string; status?: string } = {}) {
    const response = await request<{ data: AuthUser[] }>('/employees', { query: params });
    return response.data;
  },

  employee(id: string) {
    return request<{
      employee: AuthUser;
      leaveBalance: LeaveBalance;
      stats: { attendances: number; submissions: number };
    }>(`/employees/${id}`);
  },

  async createEmployee(body: Record<string, unknown>) {
    const response = await request<{ data: AuthUser }>('/employees', { method: 'POST', body });
    return response.data;
  },

  async updateEmployee(id: string, body: Record<string, unknown>) {
    const response = await request<{ data: AuthUser }>(`/employees/${id}`, {
      method: 'PUT',
      body,
    });

    return response.data;
  },

  async setEmployeeStatus(id: string, status: 'ACTIVE' | 'INACTIVE') {
    const response = await request<{ data: AuthUser }>(`/employees/${id}/status`, {
      method: 'PATCH',
      body: { status },
    });

    return response.data;
  },

  deleteEmployee(id: string) {
    return request<{ message?: string }>(`/employees/${id}`, { method: 'DELETE' });
  },

  // --- Akun HRD (khusus Owner) -----------------------------------------
  async hrdAccounts() {
    const response = await request<{ data: AuthUser[] }>('/hrd-accounts');
    return response.data;
  },

  async createHrd(body: Record<string, unknown>) {
    const response = await request<{ data: AuthUser }>('/hrd-accounts', { method: 'POST', body });
    return response.data;
  },

  async updateHrd(id: string, body: Record<string, unknown>) {
    const response = await request<{ data: AuthUser }>(`/hrd-accounts/${id}`, {
      method: 'PUT',
      body,
    });

    return response.data;
  },

  deleteHrd(id: string) {
    return request<{ message?: string }>(`/hrd-accounts/${id}`, { method: 'DELETE' });
  },

  async updateHrdCompensation(id: string, body: Omit<HrdCompensation, 'userId' | 'updatedAt'>) {
    return request<{ data: AuthUser; takeHomePay: number }>(
      `/hrd-accounts/${id}/compensation`,
      { method: 'PUT', body },
    );
  },

  // --- Payroll ----------------------------------------------------------
  payroll(period?: string) {
    return request<PayrollReport>('/payroll', { query: { period } });
  },

  async payrollRow(period: string, userId: string) {
    return request<{ period: string; status: string; data: PayrollRowRecord }>(
      `/payroll/${period}/employees/${userId}`,
    );
  },

  finalizePayroll(period: string) {
    return request<{ message: string; data: { period: string; status: string; rows: number } }>(
      `/payroll/${period}/finalize`,
      { method: 'POST' },
    );
  },

  // --- Util -------------------------------------------------------------
  raw: <T>(path: string, options?: RequestOptions) => request<T>(path, options),
  unwrap,
};

export type { RequestOptions };
