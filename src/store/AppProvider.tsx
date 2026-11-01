import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { createSeedData, SeedData } from '../data/seed';
import type {
  AccountStatus,
  Attendance,
  Company,
  HrdCompensation,
  JobRole,
  LeaveBalance,
  LeaveCategory,
  OfficeLocation,
  Submission,
  SubmissionType,
  User,
  UserRole,
} from '../types';
import { addDays, inclusiveDays, nowTime, timeToMinutes, todayISO } from '../utils/date';
import { isValidEmail } from '../utils/validation';

export interface ActionResult {
  ok: boolean;
  message: string;
  /** ID entitas terkait, dipakai mis. untuk membuka detail setelah membuat pengajuan. */
  id?: string;
}

export interface SubmitAttendanceInput {
  userId: string;
  mode: 'CHECK_IN' | 'CHECK_OUT';
  locationId?: string;
  locationName?: string;
  latitude?: number;
  longitude?: number;
  distanceMeters?: number;
  withinRadius: boolean;
  selfieCaptured: boolean;
}

export interface NewSubmissionInput {
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
}

export interface UserPayload {
  id?: string;
  name: string;
  email: string;
  username: string;
  password?: string;
  phone: string;
  role: UserRole;
  employeeCode: string;
  jobRoleId?: string;
  locationId?: string;
  joinDate: string;
  employmentType: User['employmentType'];
  status: AccountStatus;
  address?: string;
  birthDate?: string;
  notes?: string;
}

export interface RolePayload {
  id?: string;
  name: string;
  department: string;
  checkInTime: string;
  checkOutTime: string;
  lateToleranceMinutes: number;
  salaryBasis: JobRole['salaryBasis'];
  baseSalary: number;
  transportAllowance: number;
  mealAllowance: number;
  latePenaltyPerMinute: number;
  annualLeaveQuota: number;
  locationId: string;
  status: AccountStatus;
}

export interface LocationPayload {
  id?: string;
  name: string;
  type: OfficeLocation['type'];
  address: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  status: AccountStatus;
}

interface AppContextValue extends SeedData {
  sessionUser: User | null;
  isAuthenticating: boolean;
  authError: string;
  login: (identifier: string, password: string) => Promise<ActionResult>;
  logout: () => void;
  switchDemoAccount: (roleKey: UserRole | 'owner' | 'hrd' | 'employee') => ActionResult;
  checkAttendance: (input: SubmitAttendanceInput) => ActionResult;
  createSubmission: (input: NewSubmissionInput) => ActionResult;
  cancelSubmission: (submissionId: string, actorId: string) => ActionResult;
  decideSubmission: (params: {
    submissionId: string;
    stage: 'HRD' | 'OWNER';
    decision: 'APPROVED' | 'REJECTED';
    note: string;
    actorId: string;
  }) => ActionResult;
  adjustLeaveBalance: (params: {
    userId: string;
    delta: number;
    reason: string;
    actorName: string;
  }) => ActionResult;
  saveUser: (payload: UserPayload) => ActionResult;
  setUserStatus: (userId: string, status: AccountStatus) => ActionResult;
  deleteUser: (userId: string) => ActionResult;
  saveRole: (payload: RolePayload) => ActionResult;
  deleteRole: (roleId: string) => ActionResult;
  saveLocation: (payload: LocationPayload) => ActionResult;
  deleteLocation: (locationId: string) => ActionResult;
  updateHrdCompensation: (
    userId: string,
    payload: Omit<HrdCompensation, 'userId' | 'updatedAt'>,
  ) => ActionResult;
  updateCompany: (patch: Partial<Company>) => ActionResult;
  updateProfile: (userId: string, patch: Partial<User>) => ActionResult;
  resetDemoData: () => void;
  getUser: (userId?: string) => User | undefined;
  getRole: (roleId?: string) => JobRole | undefined;
  getLocation: (locationId?: string) => OfficeLocation | undefined;
  getRoleForUser: (user?: User) => JobRole | undefined;
  getLocationForUser: (user?: User) => OfficeLocation | undefined;
  getBalance: (userId?: string) => LeaveBalance | undefined;
  getCompensation: (userId?: string) => HrdCompensation | undefined;
  isEmailTaken: (email: string, excludeUserId?: string) => boolean;
  isUsernameTaken: (username: string, excludeUserId?: string) => boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<SeedData>(() => createSeedData());
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState('');

  const sessionUser = useMemo(
    () => data.users.find((user) => user.id === sessionUserId) ?? null,
    [data.users, sessionUserId],
  );

  const getUser = useCallback(
    (userId?: string) => (userId ? data.users.find((user) => user.id === userId) : undefined),
    [data.users],
  );

  const getRole = useCallback(
    (roleId?: string) => (roleId ? data.roles.find((role) => role.id === roleId) : undefined),
    [data.roles],
  );

  const getLocation = useCallback(
    (locationId?: string) =>
      locationId ? data.locations.find((location) => location.id === locationId) : undefined,
    [data.locations],
  );

  const getRoleForUser = useCallback(
    (user?: User) => (user?.jobRoleId ? data.roles.find((role) => role.id === user.jobRoleId) : undefined),
    [data.roles],
  );

  const getLocationForUser = useCallback(
    (user?: User) => {
      if (!user) return undefined;
      const direct = user.locationId
        ? data.locations.find((location) => location.id === user.locationId)
        : undefined;
      if (direct) return direct;
      const role = getRoleForUser(user);
      return role ? data.locations.find((location) => location.id === role.locationId) : undefined;
    },
    [data.locations, getRoleForUser],
  );

  const getBalance = useCallback(
    (userId?: string) => (userId ? data.leaveBalances.find((balance) => balance.userId === userId) : undefined),
    [data.leaveBalances],
  );

  const getCompensation = useCallback(
    (userId?: string) =>
      userId ? data.hrdCompensations.find((compensation) => compensation.userId === userId) : undefined,
    [data.hrdCompensations],
  );

  const isEmailTaken = useCallback(
    (email: string, excludeUserId?: string) =>
      data.users.some((user) => normalize(user.email) === normalize(email) && user.id !== excludeUserId),
    [data.users],
  );

  const isUsernameTaken = useCallback(
    (username: string, excludeUserId?: string) =>
      data.users.some(
        (user) => normalize(user.username) === normalize(username) && user.id !== excludeUserId,
      ),
    [data.users],
  );

  const login = useCallback(
    async (identifier: string, password: string): Promise<ActionResult> => {
      setAuthError('');
      if (!identifier.trim() || !password.trim()) {
        const message = 'Email/username dan password wajib diisi.';
        setAuthError(message);
        return { ok: false, message };
      }

      setIsAuthenticating(true);
      await delay(650);

      const found = data.users.find(
        (user) => normalize(user.email) === normalize(identifier) || normalize(user.username) === normalize(identifier),
      );

      if (!found || found.password !== password) {
        const message = 'Email/username atau password tidak sesuai. Gunakan akun demo di bawah.';
        setAuthError(message);
        setIsAuthenticating(false);
        return { ok: false, message };
      }

      if (found.status === 'INACTIVE') {
        const message = 'Akun ini nonaktif. Hubungi Admin/HRD untuk mengaktifkan kembali.';
        setAuthError(message);
        setIsAuthenticating(false);
        return { ok: false, message };
      }

      setSessionUserId(found.id);
      setIsAuthenticating(false);
      return { ok: true, message: `Selamat datang, ${found.name}.` };
    },
    [data.users],
  );

  const logout = useCallback(() => {
    setSessionUserId(null);
    setAuthError('');
  }, []);

  const switchDemoAccount = useCallback(
    (roleKey: UserRole | 'owner' | 'hrd' | 'employee'): ActionResult => {
      const role: UserRole =
        roleKey === 'owner'
          ? 'OWNER'
          : roleKey === 'hrd'
            ? 'HRD'
            : roleKey === 'employee'
              ? 'EMPLOYEE'
              : roleKey;
      const account = data.users.find((user) => user.role === role && user.isDemoAccount);
      if (!account || account.status === 'INACTIVE') {
        return { ok: false, message: 'Akun demo tidak tersedia.' };
      }
      setSessionUserId(account.id);
      setAuthError('');
      return { ok: true, message: `Beralih ke akun ${account.name}.` };
    },
    [data.users],
  );

  const checkAttendance = useCallback(
    (input: SubmitAttendanceInput): ActionResult => {
      const user = data.users.find((item) => item.id === input.userId);
      if (!user) return { ok: false, message: 'Pengguna tidak ditemukan.' };

      const role = user.jobRoleId ? data.roles.find((item) => item.id === user.jobRoleId) : undefined;
      if (!role) return { ok: false, message: 'Role kerja belum diatur. Hubungi Admin/HRD.' };

      if (!input.withinRadius) {
        return {
          ok: false,
          message: 'Absensi ditolak: posisi simulasi berada di luar radius lokasi kerja.',
        };
      }

      if (!input.selfieCaptured) {
        return { ok: false, message: 'Ambil selfie simulasi terlebih dahulu sebelum absen.' };
      }

      const today = todayISO();
      const time = nowTime();
      const existing = data.attendances.find(
        (record) => record.userId === input.userId && record.date === today,
      );

      if (input.mode === 'CHECK_IN') {
        if (existing?.checkInAt) {
          return { ok: false, message: `Anda sudah absen masuk hari ini pukul ${existing.checkInAt}.` };
        }

        const scheduleMinutes = timeToMinutes(role.checkInTime) + role.lateToleranceMinutes;
        const lateMinutes = Math.max(0, timeToMinutes(time) - scheduleMinutes);
        const status: Attendance['status'] = lateMinutes > 0 ? 'LATE' : 'ON_TIME';

        const record: Attendance = {
          id: existing?.id ?? `att-${input.userId}-${today}`,
          companyId: data.company.id,
          userId: input.userId,
          date: today,
          checkInAt: time,
          status,
          lateMinutes,
          locationId: input.locationId,
          locationName: input.locationName,
          latitude: input.latitude,
          longitude: input.longitude,
          distanceMeters: input.distanceMeters,
          selfieCaptured: input.selfieCaptured,
        };

        setData((previous) => ({
          ...previous,
          attendances: [record, ...previous.attendances.filter((item) => item.id !== record.id)].sort((a, b) =>
            b.date.localeCompare(a.date),
          ),
        }));

        return {
          ok: true,
          message:
            status === 'LATE'
              ? `Absen masuk tercatat pukul ${time} — terlambat ${lateMinutes} menit.`
              : `Absen masuk tercatat pukul ${time} — tepat waktu.`,
        };
      }

      if (!existing?.checkInAt) {
        return { ok: false, message: 'Belum ada absen masuk hari ini.' };
      }
      if (existing.checkOutAt) {
        return { ok: false, message: `Anda sudah absen pulang pukul ${existing.checkOutAt}.` };
      }

      setData((previous) => ({
        ...previous,
        attendances: previous.attendances.map((record) =>
          record.id === existing.id
            ? {
                ...record,
                checkOutAt: time,
                selfieCaptured: input.selfieCaptured,
                note: record.note,
              }
            : record,
        ),
      }));

      return { ok: true, message: `Absen pulang tercatat pukul ${time}.` };
    },
    [data.attendances, data.company.id, data.roles, data.users],
  );

  const createSubmission = useCallback(
    (input: NewSubmissionInput): ActionResult => {
      if (input.days <= 0) return { ok: false, message: 'Jumlah hari pengajuan tidak valid.' };
      if (input.reason.trim().length < 10) {
        return { ok: false, message: 'Alasan minimal 10 karakter agar dapat diverifikasi.' };
      }
      if (input.type === 'RESIGN' && !input.resignEffectiveDate) {
        return { ok: false, message: 'Tanggal efektif resign wajib diisi.' };
      }
      if (
        (input.type === 'LEAVE' && input.leaveCategory === 'ANNUAL') &&
        input.days > 0
      ) {
        const balance = data.leaveBalances.find((item) => item.userId === input.userId);
        const remaining = balance ? balance.totalQuota - balance.used : 0;
        if (input.days > remaining) {
          return {
            ok: false,
            message: `Saldo cuti tahunan tidak cukup. Sisa ${remaining} hari, diajukan ${input.days} hari.`,
          };
        }
      }
      if ((input.type === 'SICK' || input.leaveCategory === 'SICK_LEAVE') && !input.attachmentName) {
        return { ok: false, message: 'Cuti sakit wajib melampirkan surat dokter.' };
      }

      const codePrefix =
        input.type === 'LEAVE'
          ? 'CUTI'
          : input.type === 'PERMISSION'
            ? 'IZIN'
            : input.type === 'SICK'
              ? 'SAKIT'
              : 'RESIGN';

      const sequence = data.submissions.length + 1;
      const submission: Submission = {
        id: `sub-${Date.now()}`,
        code: `${codePrefix}-${String(sequence).padStart(3, '0')}`,
        companyId: data.company.id,
        userId: input.userId,
        type: input.type,
        leaveCategory: input.leaveCategory,
        permissionType: input.permissionType,
        startDate: input.startDate,
        endDate: input.endDate ?? input.startDate,
        days: input.days,
        reason: input.reason.trim(),
        attachmentName: input.attachmentName,
        resignEffectiveDate: input.resignEffectiveDate,
        createdAt: new Date().toISOString(),
        status: 'PENDING_HRD',
        approvals: [],
        balanceApplied: false,
      };

      setData((previous) => ({ ...previous, submissions: [submission, ...previous.submissions] }));

      return {
        ok: true,
        message: `Pengajuan ${submission.code} terkirim dan menunggu verifikasi HRD.`,
        id: submission.id,
      };
    },
    [data.company.id, data.leaveBalances, data.submissions.length],
  );

  const cancelSubmission = useCallback(
    (submissionId: string, actorId: string): ActionResult => {
      const submission = data.submissions.find((item) => item.id === submissionId);
      if (!submission) return { ok: false, message: 'Pengajuan tidak ditemukan.' };
      if (submission.userId !== actorId) {
        return { ok: false, message: 'Hanya pemilik pengajuan yang dapat membatalkan.' };
      }
      if (submission.status !== 'PENDING_HRD') {
        return {
          ok: false,
          message: 'Pengajuan hanya dapat dibatalkan selama masih menunggu verifikasi HRD.',
        };
      }

      setData((previous) => ({
        ...previous,
        submissions: previous.submissions.map((item) =>
          item.id === submissionId
            ? { ...item, status: 'CANCELLED', cancelledAt: new Date().toISOString() }
            : item,
        ),
      }));

      return { ok: true, message: 'Pengajuan berhasil dibatalkan.' };
    },
    [data.submissions],
  );

  const decideSubmission = useCallback(
    (params: {
      submissionId: string;
      stage: 'HRD' | 'OWNER';
      decision: 'APPROVED' | 'REJECTED';
      note: string;
      actorId: string;
    }): ActionResult => {
      const { submissionId, stage, decision, note, actorId } = params;
      const submission = data.submissions.find((item) => item.id === submissionId);
      if (!submission) return { ok: false, message: 'Pengajuan tidak ditemukan.' };

      const actor = data.users.find((user) => user.id === actorId);
      if (!actor) return { ok: false, message: 'Pengguna tidak ditemukan.' };
      if (stage === 'HRD' && actor.role !== 'HRD') {
        return { ok: false, message: 'Verifikasi tahap pertama hanya dapat dilakukan Admin/HRD.' };
      }
      if (stage === 'OWNER' && actor.role !== 'OWNER') {
        return { ok: false, message: 'Persetujuan final hanya dapat dilakukan Owner.' };
      }

      if (submission.status === 'FULLY_APPROVED' || submission.status === 'REJECTED' || submission.status === 'CANCELLED') {
        return { ok: false, message: 'Pengajuan ini sudah selesai dan tidak dapat diproses lagi.' };
      }
      if (stage === 'HRD' && submission.status !== 'PENDING_HRD') {
        return { ok: false, message: 'Pengajuan sudah melewati tahap verifikasi HRD.' };
      }
      if (stage === 'OWNER' && submission.status !== 'PENDING_OWNER') {
        return {
          ok: false,
          message: 'Owner hanya dapat memproses pengajuan yang telah disetujui HRD.',
        };
      }

      const nextStatus: Submission['status'] =
        decision === 'REJECTED' ? 'REJECTED' : stage === 'HRD' ? 'PENDING_OWNER' : 'FULLY_APPROVED';

      const isAnnualLeave = submission.type === 'LEAVE' && submission.leaveCategory === 'ANNUAL';
      const shouldApplyBalance = nextStatus === 'FULLY_APPROVED' && isAnnualLeave && !submission.balanceApplied;

      setData((previous) => {
        const nextSubmissions = previous.submissions.map((item) =>
          item.id === submissionId
            ? {
                ...item,
                status: nextStatus,
                balanceApplied: item.balanceApplied || shouldApplyBalance,
                approvals: [
                  ...item.approvals,
                  {
                    stage,
                    actorId: actor.id,
                    actorName: actor.name,
                    actorRole: actor.role,
                    decision,
                    note: note.trim() || (decision === 'APPROVED' ? 'Disetujui.' : 'Ditolak.'),
                    decidedAt: new Date().toISOString(),
                  },
                ],
              }
            : item,
        );

        const nextBalances = shouldApplyBalance
          ? previous.leaveBalances.map((balance) =>
              balance.userId === submission.userId
                ? {
                    ...balance,
                    used: balance.used + submission.days,
                    adjustments: [
                      {
                        id: `adj-${Date.now()}`,
                        at: new Date().toISOString(),
                        byName: 'Sistem (final approval)',
                        delta: 0,
                        reason: `Pemakaian cuti tahunan ${submission.days} hari (${submission.code})`,
                      },
                      ...balance.adjustments,
                    ],
                  }
                : balance,
            )
          : previous.leaveBalances;

        return { ...previous, submissions: nextSubmissions, leaveBalances: nextBalances };
      });

      if (nextStatus === 'PENDING_OWNER') {
        return { ok: true, message: 'Disetujui HRD. Pengajuan diteruskan ke Owner.' };
      }
      if (nextStatus === 'FULLY_APPROVED') {
        return {
          ok: true,
          message: shouldApplyBalance
            ? `Disetujui penuh. Kuota cuti tahunan berkurang ${submission.days} hari.`
            : 'Pengajuan disetujui penuh.',
        };
      }
      return { ok: true, message: 'Pengajuan ditolak. Alur persetujuan dihentikan.' };
    },
    [data.submissions, data.users],
  );

  const adjustLeaveBalance = useCallback(
    (params: { userId: string; delta: number; reason: string; actorName: string }): ActionResult => {
      const { userId, delta, reason, actorName } = params;
      if (!Number.isFinite(delta) || delta === 0) {
        return { ok: false, message: 'Penyesuaian harus berupa angka selain 0.' };
      }
      if (reason.trim().length < 5) {
        return { ok: false, message: 'Alasan penyesuaian minimal 5 karakter.' };
      }
      const balance = data.leaveBalances.find((item) => item.userId === userId);
      if (!balance) return { ok: false, message: 'Saldo cuti karyawan tidak ditemukan.' };
      if (balance.totalQuota + delta - balance.used < 0) {
        return { ok: false, message: 'Penyesuaian membuat sisa saldo menjadi negatif.' };
      }

      setData((previous) => ({
        ...previous,
        leaveBalances: previous.leaveBalances.map((item) =>
          item.userId === userId
            ? {
                ...item,
                totalQuota: item.totalQuota + delta,
                adjustments: [
                  {
                    id: `adj-${Date.now()}`,
                    at: new Date().toISOString(),
                    byName: actorName,
                    delta,
                    reason: reason.trim(),
                  },
                  ...item.adjustments,
                ],
              }
            : item,
        ),
      }));

      return { ok: true, message: `Saldo cuti diperbarui (${delta > 0 ? '+' : ''}${delta} hari).` };
    },
    [data.leaveBalances],
  );

  const saveUser = useCallback(
    (payload: UserPayload): ActionResult => {
      if (payload.name.trim().length < 3) return { ok: false, message: 'Nama minimal 3 karakter.' };
      if (!isValidEmail(payload.email)) return { ok: false, message: 'Format email tidak valid.' };
      if (payload.phone.replace(/\D/g, '').length < 9) {
        return { ok: false, message: 'Nomor telepon minimal 9 digit.' };
      }
      if (payload.username.trim().length < 4) {
        return { ok: false, message: 'Username minimal 4 karakter.' };
      }
      if (isEmailTaken(payload.email, payload.id)) return { ok: false, message: 'Email sudah digunakan akun lain.' };
      if (isUsernameTaken(payload.username, payload.id)) {
        return { ok: false, message: 'Username sudah digunakan akun lain.' };
      }
      if (payload.employeeCode.trim().length < 3) {
        return { ok: false, message: 'Kode karyawan minimal 3 karakter.' };
      }
      if (!payload.id && !payload.password) {
        return { ok: false, message: 'Password awal wajib diisi untuk akun baru.' };
      }
      if (payload.role === 'EMPLOYEE' && !payload.jobRoleId) {
        return { ok: false, message: 'Role kerja wajib dipilih untuk karyawan.' };
      }

      const resultMessage = payload.id
        ? 'Perubahan data berhasil disimpan.'
        : 'Pengguna baru berhasil ditambahkan.';

      setData((previous) => {
        if (payload.id) {
          const exists = previous.users.some((user) => user.id === payload.id);
          if (!exists) return previous;
          return {
            ...previous,
            users: previous.users.map((user) =>
              user.id === payload.id
                ? {
                    ...user,
                    ...payload,
                    password: payload.password || user.password,
                  }
                : user,
            ),
          };
        }

        const newUser: User = {
          id: `u-${Date.now()}`,
          companyId: previous.company.id,
          name: payload.name.trim(),
          email: payload.email.trim(),
          username: payload.username.trim(),
          password: payload.password ?? 'demo12345',
          role: payload.role,
          employeeCode: payload.employeeCode.trim(),
          jobRoleId: payload.jobRoleId,
          locationId: payload.locationId,
          phone: payload.phone,
          joinDate: payload.joinDate,
          birthDate: payload.birthDate,
          address: payload.address,
          employmentType: payload.employmentType,
          status: payload.status,
          notes: payload.notes,
        };

        const role = payload.jobRoleId ? previous.roles.find((item) => item.id === payload.jobRoleId) : undefined;

        const nextCompensations =
          payload.role === 'HRD'
            ? [
                ...previous.hrdCompensations,
                {
                  userId: newUser.id,
                  baseSalary: 5_500_000,
                  positionAllowance: 400_000,
                  transportAllowance: 450_000,
                  mealAllowance: 400_000,
                  bpjsDeduction: 180_000,
                  updatedAt: new Date().toISOString(),
                },
              ]
            : previous.hrdCompensations;

        const nextBalances =
          payload.role === 'EMPLOYEE' && role
            ? [
                ...previous.leaveBalances,
                {
                  id: `lb-${newUser.id}`,
                  companyId: previous.company.id,
                  userId: newUser.id,
                  year: new Date().getFullYear(),
                  totalQuota: role.annualLeaveQuota,
                  used: 0,
                  adjustments: [],
                },
              ]
            : previous.leaveBalances;

        return {
          ...previous,
          users: [...previous.users, newUser],
          hrdCompensations: nextCompensations,
          leaveBalances: nextBalances,
        };
      });

      return { ok: true, message: resultMessage };
    },
    [isEmailTaken, isUsernameTaken],
  );

  const setUserStatus = useCallback(
    (userId: string, status: AccountStatus): ActionResult => {
      const user = data.users.find((item) => item.id === userId);
      if (!user) return { ok: false, message: 'Pengguna tidak ditemukan.' };
      if (user.role === 'OWNER') return { ok: false, message: 'Akun Owner tidak dapat dinonaktifkan.' };
      if (user.id === sessionUserId && status === 'INACTIVE') {
        return { ok: false, message: 'Anda tidak dapat menonaktifkan akun yang sedang digunakan.' };
      }

      setData((previous) => ({
        ...previous,
        users: previous.users.map((item) => (item.id === userId ? { ...item, status } : item)),
      }));

      return {
        ok: true,
        message: status === 'ACTIVE' ? 'Akun diaktifkan kembali.' : 'Akun berhasil dinonaktifkan.',
      };
    },
    [data.users, sessionUserId],
  );

  const deleteUser = useCallback(
    (userId: string): ActionResult => {
      const user = data.users.find((item) => item.id === userId);
      if (!user) return { ok: false, message: 'Pengguna tidak ditemukan.' };
      if (user.role === 'OWNER') return { ok: false, message: 'Akun Owner tidak dapat dihapus.' };
      if (user.id === sessionUserId) return { ok: false, message: 'Tidak dapat menghapus akun aktif.' };
      if (user.isDemoAccount) {
        return { ok: false, message: 'Akun demo tidak dapat dihapus agar alur uji tetap tersedia.' };
      }

      setData((previous) => ({
        ...previous,
        users: previous.users.filter((item) => item.id !== userId),
        leaveBalances: previous.leaveBalances.filter((item) => item.userId !== userId),
        hrdCompensations: previous.hrdCompensations.filter((item) => item.userId !== userId),
      }));

      return { ok: true, message: 'Data karyawan dihapus.' };
    },
    [data.users, sessionUserId],
  );

  const saveRole = useCallback(
    (payload: RolePayload): ActionResult => {
      if (payload.name.trim().length < 3) return { ok: false, message: 'Nama role minimal 3 karakter.' };
      if (!/^\d{2}:\d{2}$/.test(payload.checkInTime) || !/^\d{2}:\d{2}$/.test(payload.checkOutTime)) {
        return { ok: false, message: 'Format jam masuk/pulang harus HH:mm.' };
      }
      if (timeToMinutes(payload.checkOutTime) <= timeToMinutes(payload.checkInTime)) {
        return { ok: false, message: 'Jam pulang harus lebih besar dari jam masuk.' };
      }
      if (payload.baseSalary <= 0) return { ok: false, message: 'Gaji pokok harus lebih dari 0.' };
      if (payload.annualLeaveQuota < 0) return { ok: false, message: 'Kuota cuti tidak boleh negatif.' };
      if (!payload.locationId) return { ok: false, message: 'Lokasi kerja wajib dipilih.' };
      const duplicated = data.roles.some(
        (role) => role.name.toLowerCase() === payload.name.trim().toLowerCase() && role.id !== payload.id,
      );
      if (duplicated) return { ok: false, message: 'Nama role sudah digunakan.' };

      setData((previous) => {
        if (payload.id) {
          return {
            ...previous,
            roles: previous.roles.map((role) =>
              role.id === payload.id ? { ...role, ...payload, name: payload.name.trim() } : role,
            ),
          };
        }
        return {
          ...previous,
          roles: [
            ...previous.roles,
            {
              ...payload,
              id: `role-${Date.now()}`,
              companyId: previous.company.id,
              name: payload.name.trim(),
              createdAt: new Date().toISOString(),
            },
          ],
        };
      });

      return { ok: true, message: payload.id ? 'Role berhasil diperbarui.' : 'Role baru berhasil dibuat.' };
    },
    [data.roles],
  );

  const deleteRole = useCallback(
    (roleId: string): ActionResult => {
      const used = data.users.some((user) => user.jobRoleId === roleId);
      if (used) return { ok: false, message: 'Role masih digunakan karyawan. Pindahkan karyawan terlebih dahulu.' };

      setData((previous) => ({ ...previous, roles: previous.roles.filter((role) => role.id !== roleId) }));
      return { ok: true, message: 'Role berhasil dihapus.' };
    },
    [data.users],
  );

  const saveLocation = useCallback(
    (payload: LocationPayload): ActionResult => {
      if (payload.name.trim().length < 3) return { ok: false, message: 'Nama lokasi minimal 3 karakter.' };
      if (payload.address.trim().length < 5) return { ok: false, message: 'Alamat lokasi minimal 5 karakter.' };
      if (payload.latitude < -90 || payload.latitude > 90) {
        return { ok: false, message: 'Latitude harus di antara -90 dan 90.' };
      }
      if (payload.longitude < -180 || payload.longitude > 180) {
        return { ok: false, message: 'Longitude harus di antara -180 dan 180.' };
      }
      if (payload.radiusMeters < 20 || payload.radiusMeters > 5000) {
        return { ok: false, message: 'Radius geofencing harus 20–5000 meter.' };
      }

      setData((previous) => {
        if (payload.id) {
          return {
            ...previous,
            locations: previous.locations.map((location) =>
              location.id === payload.id ? { ...location, ...payload, name: payload.name.trim() } : location,
            ),
          };
        }
        return {
          ...previous,
          locations: [
            ...previous.locations,
            {
              ...payload,
              id: `loc-${Date.now()}`,
              companyId: previous.company.id,
              name: payload.name.trim(),
            },
          ],
        };
      });

      return { ok: true, message: payload.id ? 'Lokasi kerja diperbarui.' : 'Lokasi kerja ditambahkan.' };
    },
    [],
  );

  const deleteLocation = useCallback(
    (locationId: string): ActionResult => {
      const usedByRole = data.roles.some((role) => role.locationId === locationId);
      const usedByUser = data.users.some((user) => user.locationId === locationId);
      if (usedByRole || usedByUser) {
        return { ok: false, message: 'Lokasi masih dipakai role/karyawan sehingga tidak dapat dihapus.' };
      }
      setData((previous) => ({
        ...previous,
        locations: previous.locations.filter((location) => location.id !== locationId),
      }));
      return { ok: true, message: 'Lokasi kerja dihapus.' };
    },
    [data.roles, data.users],
  );

  const updateHrdCompensation = useCallback(
    (userId: string, payload: Omit<HrdCompensation, 'userId' | 'updatedAt'>): ActionResult => {
      if (payload.baseSalary <= 0) return { ok: false, message: 'Gaji pokok harus lebih dari 0.' };
      if (payload.bpjsDeduction < 0) return { ok: false, message: 'Potongan BPJS tidak boleh negatif.' };

      setData((previous) => ({
        ...previous,
        hrdCompensations: previous.hrdCompensations.some((item) => item.userId === userId)
          ? previous.hrdCompensations.map((item) =>
              item.userId === userId ? { ...item, ...payload, updatedAt: new Date().toISOString() } : item,
            )
          : [
              ...previous.hrdCompensations,
              { userId, ...payload, updatedAt: new Date().toISOString() },
            ],
      }));

      return { ok: true, message: 'Komponen gaji HRD berhasil disimpan.' };
    },
    [],
  );

  const updateCompany = useCallback((patch: Partial<Company>): ActionResult => {
    if (patch.name !== undefined && patch.name.trim().length < 3) {
      return { ok: false, message: 'Nama perusahaan minimal 3 karakter.' };
    }
    if (patch.email !== undefined && !isValidEmail(patch.email)) {
      return { ok: false, message: 'Format email perusahaan tidak valid.' };
    }
    if (patch.workDaysPerMonth !== undefined && (patch.workDaysPerMonth < 1 || patch.workDaysPerMonth > 31)) {
      return { ok: false, message: 'Hari kerja per bulan harus 1–31.' };
    }

    setData((previous) => ({ ...previous, company: { ...previous.company, ...patch } }));
    return { ok: true, message: 'Pengaturan perusahaan disimpan.' };
  }, []);

  const updateProfile = useCallback((userId: string, patch: Partial<User>): ActionResult => {
    if (patch.email && !isValidEmail(patch.email)) {
      return { ok: false, message: 'Format email tidak valid.' };
    }
    if (patch.name !== undefined && patch.name.trim().length < 3) {
      return { ok: false, message: 'Nama minimal 3 karakter.' };
    }
    if (patch.phone !== undefined && patch.phone.replace(/\D/g, '').length < 9) {
      return { ok: false, message: 'Nomor telepon minimal 9 digit.' };
    }

    setData((previous) => ({
      ...previous,
      users: previous.users.map((user) => (user.id === userId ? { ...user, ...patch } : user)),
    }));
    return { ok: true, message: 'Profil berhasil diperbarui.' };
  }, []);

  const resetDemoData = useCallback(() => {
    setData(createSeedData());
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      ...data,
      sessionUser,
      isAuthenticating,
      authError,
      login,
      logout,
      switchDemoAccount,
      checkAttendance,
      createSubmission,
      cancelSubmission,
      decideSubmission,
      adjustLeaveBalance,
      saveUser,
      setUserStatus,
      deleteUser,
      saveRole,
      deleteRole,
      saveLocation,
      deleteLocation,
      updateHrdCompensation,
      updateCompany,
      updateProfile,
      resetDemoData,
      getUser,
      getRole,
      getLocation,
      getRoleForUser,
      getLocationForUser,
      getBalance,
      getCompensation,
      isEmailTaken,
      isUsernameTaken,
    }),
    [
      data,
      sessionUser,
      isAuthenticating,
      authError,
      login,
      logout,
      switchDemoAccount,
      checkAttendance,
      createSubmission,
      cancelSubmission,
      decideSubmission,
      adjustLeaveBalance,
      saveUser,
      setUserStatus,
      deleteUser,
      saveRole,
      deleteRole,
      saveLocation,
      deleteLocation,
      updateHrdCompensation,
      updateCompany,
      updateProfile,
      resetDemoData,
      getUser,
      getRole,
      getLocation,
      getRoleForUser,
      getLocationForUser,
      getBalance,
      getCompensation,
      isEmailTaken,
      isUsernameTaken,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp harus dipakai di dalam AppProvider');
  return context;
}

export function useSessionUser(): User {
  const { sessionUser } = useApp();
  if (!sessionUser) throw new Error('Tidak ada sesi aktif');
  return sessionUser;
}

export const demoHelper = {
  nextEmployeeCode(existing: User[], year: number): string {
    const codes = existing
      .map((user) => user.employeeCode)
      .filter((code) => code.startsWith(`EMP-${year}-`))
      .map((code) => Number(code.split('-').pop()))
      .filter((value) => Number.isFinite(value));
    const next = (codes.length ? Math.max(...codes) : 0) + 1;
    return `EMP-${year}-${String(next).padStart(3, '0')}`;
  },
  defaultJoinDate(): string {
    return todayISO();
  },
  defaultResignDate(): string {
    return addDays(todayISO(), 30);
  },
  inclusiveDays,
};
