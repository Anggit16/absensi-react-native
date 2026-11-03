/**
 * Store aplikasi yang terhubung ke AbsensiPro API (Laravel + MySQL).
 *
 * Prinsip:
 * - Semua layar tetap memakai `useApp()` dan bentuk data domain yang sama.
 * - Aksi yang mengubah data kini berupa async (Promise<ActionResult>) karena
 *   server adalah sumber kebenaran.
 * - Token Sanctum disimpan di SecureStore (mobile) / localStorage (web).
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { addDays, inclusiveDays, todayISO } from '../utils/date';
import { api, type AuthUser } from '../api';
import { ApiError, setAuthToken, setUnauthorizedHandler } from '../api/client';
import {
  mapAttendance,
  mapCompany,
  mapCompensation,
  mapJobRole,
  mapLeaveBalance,
  mapLocation,
  mapSubmission,
  mapUser,
  sortAttendances,
  sortSubmissions,
} from '../api/mappers';
import { clearToken, loadToken, saveToken } from '../api/tokenStore';
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
  WorkspaceData,
} from '../types';

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
  latitude: number;
  longitude: number;
  distanceMeters: number;
  withinRadius: boolean;
  selfieCaptured: boolean;
  /** File selfie dari kamera (uri perangkat) untuk diunggah ke server. */
  selfie?: { uri: string; name: string; type: string } | null;
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

interface AppContextValue extends WorkspaceData {
  sessionUser: User | null;
  /** true selama sesi tersimpan sedang dipulihkan saat aplikasi dibuka. */
  isRestoring: boolean;
  isAuthenticating: boolean;
  authError: string;
  login: (identifier: string, password: string) => Promise<ActionResult>;
  logout: () => void;
  checkAttendance: (input: SubmitAttendanceInput) => Promise<ActionResult>;
  createSubmission: (input: NewSubmissionInput) => Promise<ActionResult>;
  cancelSubmission: (submissionId: string, actorId: string) => Promise<ActionResult>;
  decideSubmission: (params: {
    submissionId: string;
    stage: 'HRD' | 'OWNER';
    decision: 'APPROVED' | 'REJECTED';
    note: string;
    actorId: string;
  }) => Promise<ActionResult>;
  adjustLeaveBalance: (params: {
    userId: string;
    delta: number;
    reason: string;
    actorName: string;
  }) => Promise<ActionResult>;
  saveUser: (payload: UserPayload) => Promise<ActionResult>;
  setUserStatus: (userId: string, status: AccountStatus) => Promise<ActionResult>;
  deleteUser: (userId: string) => Promise<ActionResult>;
  saveRole: (payload: RolePayload) => Promise<ActionResult>;
  deleteRole: (roleId: string) => Promise<ActionResult>;
  saveLocation: (payload: LocationPayload) => Promise<ActionResult>;
  deleteLocation: (locationId: string) => Promise<ActionResult>;
  updateHrdCompensation: (
    userId: string,
    payload: Omit<HrdCompensation, 'userId' | 'updatedAt'>,
  ) => Promise<ActionResult>;
  updateCompany: (patch: Partial<Company>) => Promise<ActionResult>;
  updateProfile: (userId: string, patch: Partial<User>) => Promise<ActionResult>;
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

const EMPTY_COMPANY: Company = {
  id: '',
  name: 'AbsensiPro',
  legalName: '',
  industry: '',
  address: '',
  city: '',
  phone: '',
  email: '',
  taxId: '',
  timezone: 'Asia/Jakarta',
  workDaysPerMonth: 22,
  logoInitials: 'AP',
  establishedYear: 0,
};

function emptyData(): WorkspaceData {
  return {
    company: EMPTY_COMPANY,
    users: [],
    roles: [],
    locations: [],
    attendances: [],
    leaveBalances: [],
    submissions: [],
    hrdCompensations: [],
  };
}

/** Tanggal 1 pada N bulan lalu, dipakai sebagai rentang riwayat absensi. */
function firstDayOfMonthsAgo(monthsAgo: number): string {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const month = String(date.getMonth() + 1).padStart(2, '0');

  return `${date.getFullYear()}-${month}-01`;
}

/** Pesan error yang ramah untuk ditampilkan di toast/form. */
function describeError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.firstValidationMessage ?? error.message;
  }

  if (error instanceof TypeError) {
    return 'Tidak dapat terhubung ke server. Periksa koneksi dan EXPO_PUBLIC_API_URL.';
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Terjadi kesalahan. Coba lagi.';
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

/** Ambil seluruh data yang dibutuhkan layar sesuai role pengguna. */
async function fetchWorkspace(auth: AuthUser): Promise<WorkspaceData> {
  const isEmployee = auth.role === 'EMPLOYEE';
  const from = firstDayOfMonthsAgo(2);
  const to = todayISO();

  const [companyResponse, roles, locations, submissions, balances, attendance, employees, hrdAccounts] =
    await Promise.all([
      api.company(),
      api.roles(),
      api.locations(),
      api.submissions(),
      api.leaveBalances(),
      api.attendanceHistory(
        isEmployee ? { from, to } : { from, to, scope: 'company' },
      ),
      isEmployee ? Promise.resolve<AuthUser[]>([]) : api.employees(),
      auth.role === 'OWNER' ? api.hrdAccounts() : Promise.resolve<AuthUser[]>([]),
    ]);

  const company = mapCompany(companyResponse.company);

  const userMap = new Map<string, User>();
  [auth, ...employees, ...hrdAccounts].forEach((record) => {
    userMap.set(record.id, mapUser(record));
  });

  const compensations = [auth, ...hrdAccounts]
    .map(mapCompensation)
    .filter((item): item is HrdCompensation => Boolean(item));

  return {
    company,
    users: [...userMap.values()].sort((a, b) => a.name.localeCompare(b.name)),
    roles: roles.map(mapJobRole),
    locations: locations.map(mapLocation),
    attendances: sortAttendances(attendance.data.map(mapAttendance)),
    leaveBalances: balances.data.map((row) => mapLeaveBalance(row, company.id)),
    submissions: sortSubmissions(submissions.map(mapSubmission)),
    hrdCompensations: compensations,
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<WorkspaceData>(() => emptyData());
  const [session, setSession] = useState<AuthUser | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState('');

  const sessionUser = useMemo(
    () => (session ? data.users.find((user) => user.id === session.id) ?? null : null),
    [data.users, session],
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

  // --- Sesi -------------------------------------------------------------

  const clearSession = useCallback(() => {
    setAuthToken(null);
    setSession(null);
    setData(emptyData());
    setAuthError('');
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(clearSession);

    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const token = await loadToken();
        if (!token) return;

        setAuthToken(token);
        const me = await api.me();
        const snapshot = await fetchWorkspace(me.user);

        if (!active) return;

        setData(snapshot);
        setSession(me.user);
      } catch {
        setAuthToken(null);
        await clearToken();
      } finally {
        if (active) setIsRestoring(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(
    async (identifier: string, password: string): Promise<ActionResult> => {
      setAuthError('');

      if (!identifier.trim() || !password.trim()) {
        const message = 'Email/username dan password wajib diisi.';
        setAuthError(message);
        return { ok: false, message };
      }

      setIsAuthenticating(true);

      try {
        const response = await api.login(identifier.trim(), password);
        const snapshot = await fetchWorkspace(response.user);

        await saveToken(response.token);

        setData(snapshot);
        setSession(response.user);

        return { ok: true, message: `Selamat datang, ${response.user.name}.` };
      } catch (error) {
        setAuthToken(null);
        const message = describeError(error);
        setAuthError(message);
        return { ok: false, message };
      } finally {
        setIsAuthenticating(false);
      }
    },
    [],
  );

  const logout = useCallback(() => {
    void (async () => {
      try {
        await api.logout();
      } catch {
        // Token mungkin sudah kedaluwarsa; tetap bersihkan sesi lokal.
      }

      await clearToken();
      clearSession();
    })();
  }, [clearSession]);

  const reloadWorkspace = useCallback(async (): Promise<void> => {
    if (!session) return;
    setData(await fetchWorkspace(session));
  }, [session]);

  // --- Absensi ----------------------------------------------------------

  const checkAttendance = useCallback(
    async (input: SubmitAttendanceInput): Promise<ActionResult> => {
      if (!input.withinRadius) {
        return {
          ok: false,
          message: 'Absensi ditolak: posisi Anda berada di luar radius lokasi kerja.',
        };
      }

      if (!input.selfieCaptured) {
        return { ok: false, message: 'Ambil selfie terlebih dahulu sebelum absen.' };
      }

      try {
        if (input.mode === 'CHECK_IN') {
          const record = await api.checkIn({
            latitude: input.latitude,
            longitude: input.longitude,
            selfie: input.selfie,
            selfieCaptured: true,
          });

          const mapped = mapAttendance(record);

          setData((previous) => ({
            ...previous,
            attendances: sortAttendances([
              mapped,
              ...previous.attendances.filter((item) => item.id !== mapped.id),
            ]),
          }));

          const time = mapped.checkInAt ?? '--:--';

          return {
            ok: true,
            message:
              mapped.status === 'LATE'
                ? `Absen masuk tercatat pukul ${time} — terlambat ${mapped.lateMinutes} menit.`
                : `Absen masuk tercatat pukul ${time} — tepat waktu.`,
          };
        }

        const record = await api.checkOut({
          latitude: input.latitude,
          longitude: input.longitude,
          selfie: input.selfie,
          selfieCaptured: true,
        });
        const mapped = mapAttendance(record);

        setData((previous) => ({
          ...previous,
          attendances: sortAttendances([
            mapped,
            ...previous.attendances.filter((item) => item.id !== mapped.id),
          ]),
        }));

        return {
          ok: true,
          message: `Absen pulang tercatat pukul ${mapped.checkOutAt ?? '--:--'}.`,
        };
      } catch (error) {
        return { ok: false, message: describeError(error) };
      }
    },
    [],
  );

  // --- Pengajuan --------------------------------------------------------

  const replaceSubmission = useCallback((submission: Submission) => {
    setData((previous) => ({
      ...previous,
      submissions: sortSubmissions([
        submission,
        ...previous.submissions.filter((item) => item.id !== submission.id),
      ]),
    }));
  }, []);

  const refreshSubmissionData = useCallback(async (): Promise<void> => {
    const [rows, balances] = await Promise.all([api.submissions(), api.leaveBalances()]);

    setData((previous) => ({
      ...previous,
      submissions: sortSubmissions(rows.map(mapSubmission)),
      leaveBalances: balances.data.map((row) =>
        mapLeaveBalance(row, previous.company.id || session?.companyId || ''),
      ),
    }));
  }, [session]);

  const createSubmission = useCallback(
    async (input: NewSubmissionInput): Promise<ActionResult> => {
      try {
        const record = await api.createSubmission({
          type: input.type,
          leaveCategory: input.leaveCategory,
          permissionType: input.permissionType,
          startDate: input.startDate,
          endDate: input.endDate,
          reason: input.reason,
          resignEffectiveDate: input.resignEffectiveDate,
          attachmentName: input.attachmentName,
        });

        const mapped = mapSubmission(record);
        replaceSubmission(mapped);

        return {
          ok: true,
          message: `Pengajuan ${mapped.code} berhasil dikirim dan menunggu persetujuan HRD.`,
          id: mapped.id,
        };
      } catch (error) {
        return { ok: false, message: describeError(error) };
      }
    },
    [replaceSubmission],
  );

  const cancelSubmission = useCallback(
    async (submissionId: string): Promise<ActionResult> => {
      try {
        const record = await api.cancelSubmission(submissionId);
        const mapped = mapSubmission(record);
        replaceSubmission(mapped);

        return { ok: true, message: `Pengajuan ${mapped.code} dibatalkan.` };
      } catch (error) {
        return { ok: false, message: describeError(error) };
      }
    },
    [replaceSubmission],
  );

  const decideSubmission = useCallback(
    async (params: {
      submissionId: string;
      stage: 'HRD' | 'OWNER';
      decision: 'APPROVED' | 'REJECTED';
      note: string;
      actorId: string;
    }): Promise<ActionResult> => {
      try {
        const record = await api.decideSubmission(
          params.submissionId,
          params.stage,
          params.decision,
          params.note || undefined,
        );

        const mapped = mapSubmission(record);
        replaceSubmission(mapped);

        await refreshSubmissionData();

        if (mapped.status === 'REJECTED') {
          return { ok: true, message: `Pengajuan ${mapped.code} ditolak.` };
        }

        if (mapped.status === 'PENDING_OWNER') {
          return {
            ok: true,
            message: `Pengajuan ${mapped.code} disetujui HRD dan diteruskan ke Owner.`,
          };
        }

        if (mapped.status === 'FULLY_APPROVED') {
          return { ok: true, message: `Pengajuan ${mapped.code} disetujui penuh.` };
        }

        return { ok: true, message: `Keputusan untuk ${mapped.code} tersimpan.` };
      } catch (error) {
        return { ok: false, message: describeError(error) };
      }
    },
    [refreshSubmissionData, replaceSubmission],
  );

  // --- Saldo cuti -------------------------------------------------------

  const adjustLeaveBalance = useCallback(
    async (params: {
      userId: string;
      delta: number;
      reason: string;
      actorName: string;
    }): Promise<ActionResult> => {
      try {
        await api.adjustLeaveBalance(params.userId, params.delta, params.reason);
        await refreshSubmissionData();

        return {
          ok: true,
          message: `Saldo cuti ${params.delta > 0 ? 'ditambah' : 'dikurangi'} ${Math.abs(params.delta)} hari.`,
        };
      } catch (error) {
        return { ok: false, message: describeError(error) };
      }
    },
    [refreshSubmissionData],
  );

  // --- Data master ------------------------------------------------------

  const saveUser = useCallback(
    async (payload: UserPayload): Promise<ActionResult> => {
      const isHrd = payload.role === 'HRD';

      const body: Record<string, unknown> = {
        name: payload.name.trim(),
        email: payload.email.trim(),
        username: payload.username.trim(),
        employeeCode: payload.employeeCode.trim(),
        phone: payload.phone.trim(),
        joinDate: payload.joinDate,
        employmentType: payload.employmentType,
        status: payload.status,
        notes: payload.notes ?? null,
      };

      if (payload.password) body.password = payload.password;

      if (!isHrd) {
        body.jobRoleId = payload.jobRoleId;
        body.locationId = payload.locationId ?? null;
        body.birthDate = payload.birthDate ?? null;
        body.address = payload.address ?? null;
      }

      try {
        if (isHrd) {
          if (payload.id) {
            await api.updateHrd(payload.id, body);
          } else {
            await api.createHrd({
              ...body,
              // Kompensasi awal dapat diubah pada menu Kompensasi HRD.
              baseSalary: 5_500_000,
              positionAllowance: 400_000,
              transportAllowance: 450_000,
              mealAllowance: 400_000,
              bpjsDeduction: 180_000,
            });
          }
        } else if (payload.id) {
          await api.updateEmployee(payload.id, body);
        } else {
          await api.createEmployee(body);
        }

        await reloadWorkspace();

        return {
          ok: true,
          message: isHrd ? 'Akun HRD berhasil disimpan.' : 'Data karyawan berhasil disimpan.',
        };
      } catch (error) {
        return { ok: false, message: describeError(error) };
      }
    },
    [reloadWorkspace],
  );

  const setUserStatus = useCallback(
    async (userId: string, status: AccountStatus): Promise<ActionResult> => {
      try {
        await api.setEmployeeStatus(userId, status);
        await reloadWorkspace();

        return {
          ok: true,
          message:
            status === 'ACTIVE'
              ? 'Akun diaktifkan kembali.'
              : 'Akun dinonaktifkan. Karyawan tidak dapat login.',
        };
      } catch (error) {
        return { ok: false, message: describeError(error) };
      }
    },
    [reloadWorkspace],
  );

  const deleteUser = useCallback(
    async (userId: string): Promise<ActionResult> => {
      const target = data.users.find((user) => user.id === userId);

      try {
        if (target?.role === 'HRD') {
          await api.deleteHrd(userId);
        } else {
          await api.deleteEmployee(userId);
        }

        await reloadWorkspace();

        return { ok: true, message: 'Akun berhasil dihapus.' };
      } catch (error) {
        return { ok: false, message: describeError(error) };
      }
    },
    [data.users, reloadWorkspace],
  );

  const saveRole = useCallback(
    async (payload: RolePayload): Promise<ActionResult> => {
      const body: Record<string, unknown> = {
        name: payload.name.trim(),
        department: payload.department.trim(),
        checkInTime: payload.checkInTime,
        checkOutTime: payload.checkOutTime,
        lateToleranceMinutes: payload.lateToleranceMinutes,
        salaryBasis: payload.salaryBasis,
        baseSalary: payload.baseSalary,
        transportAllowance: payload.transportAllowance,
        mealAllowance: payload.mealAllowance,
        latePenaltyPerMinute: payload.latePenaltyPerMinute,
        annualLeaveQuota: payload.annualLeaveQuota,
        locationId: payload.locationId ? Number(payload.locationId) : null,
        status: payload.status,
      };

      try {
        if (payload.id) {
          await api.updateRole(payload.id, body);
        } else {
          await api.createRole(body);
        }

        await reloadWorkspace();

        return { ok: true, message: 'Role kerja berhasil disimpan.' };
      } catch (error) {
        return { ok: false, message: describeError(error) };
      }
    },
    [reloadWorkspace],
  );

  const deleteRole = useCallback(
    async (roleId: string): Promise<ActionResult> => {
      try {
        const response = await api.deleteRole(roleId);
        await reloadWorkspace();

        return { ok: true, message: response.message ?? 'Role kerja dihapus.' };
      } catch (error) {
        return { ok: false, message: describeError(error) };
      }
    },
    [reloadWorkspace],
  );

  const saveLocation = useCallback(
    async (payload: LocationPayload): Promise<ActionResult> => {
      const body: Record<string, unknown> = {
        name: payload.name.trim(),
        type: payload.type,
        address: payload.address.trim(),
        latitude: payload.latitude,
        longitude: payload.longitude,
        radiusMeters: payload.radiusMeters,
        status: payload.status,
      };

      try {
        if (payload.id) {
          await api.updateLocation(payload.id, body);
        } else {
          await api.createLocation(body);
        }

        await reloadWorkspace();

        return { ok: true, message: 'Lokasi kerja berhasil disimpan.' };
      } catch (error) {
        return { ok: false, message: describeError(error) };
      }
    },
    [reloadWorkspace],
  );

  const deleteLocation = useCallback(
    async (locationId: string): Promise<ActionResult> => {
      try {
        const response = await api.deleteLocation(locationId);
        await reloadWorkspace();

        return { ok: true, message: response.message ?? 'Lokasi kerja dihapus.' };
      } catch (error) {
        return { ok: false, message: describeError(error) };
      }
    },
    [reloadWorkspace],
  );

  const updateHrdCompensation = useCallback(
    async (
      userId: string,
      payload: Omit<HrdCompensation, 'userId' | 'updatedAt'>,
    ): Promise<ActionResult> => {
      try {
        const response = await api.updateHrdCompensation(userId, payload);

        const compensation = mapCompensation(response.data);

        setData((previous) => ({
          ...previous,
          hrdCompensations: compensation
            ? [
                compensation,
                ...previous.hrdCompensations.filter((item) => item.userId !== compensation.userId),
              ]
            : previous.hrdCompensations,
        }));

        return { ok: true, message: 'Kompensasi HRD berhasil diperbarui.' };
      } catch (error) {
        return { ok: false, message: describeError(error) };
      }
    },
    [],
  );

  const updateCompany = useCallback(
    async (patch: Partial<Company>): Promise<ActionResult> => {
      const body: Record<string, unknown> = {};

      if (patch.name !== undefined) body.name = patch.name;
      if (patch.legalName !== undefined) body.legalName = patch.legalName;
      if (patch.industry !== undefined) body.industry = patch.industry;
      if (patch.address !== undefined) body.address = patch.address;
      if (patch.city !== undefined) body.city = patch.city;
      if (patch.phone !== undefined) body.phone = patch.phone;
      if (patch.email !== undefined) body.email = patch.email;
      if (patch.taxId !== undefined) body.taxId = patch.taxId;
      if (patch.timezone !== undefined) body.timezone = patch.timezone;
      if (patch.workDaysPerMonth !== undefined) body.workDaysPerMonth = patch.workDaysPerMonth;
      if (patch.logoInitials !== undefined) body.logoInitials = patch.logoInitials;
      if (patch.establishedYear !== undefined) body.establishedYear = patch.establishedYear;

      try {
        const response = await api.updateCompany(body);
        const company = mapCompany(response.company);

        setData((previous) => ({ ...previous, company }));

        return { ok: true, message: 'Profil perusahaan berhasil diperbarui.' };
      } catch (error) {
        return { ok: false, message: describeError(error) };
      }
    },
    [],
  );

  const updateProfile = useCallback(
    async (userId: string, patch: Partial<User>): Promise<ActionResult> => {
      if (session && String(session.id) !== userId) {
        return { ok: false, message: 'Hanya dapat mengubah profil sendiri.' };
      }

      const body: Record<string, unknown> = {};

      if (patch.name !== undefined) body.name = patch.name;
      if (patch.email !== undefined) body.email = patch.email;
      if (patch.phone !== undefined) body.phone = patch.phone;
      if (patch.address !== undefined) body.address = patch.address;
      if (patch.birthDate !== undefined) body.birthDate = patch.birthDate;
      if (patch.emergencyContact !== undefined) body.emergencyContact = patch.emergencyContact;

      try {
        const response = await api.updateProfile(body);

        setData((previous) => ({
          ...previous,
          users: previous.users.map((user) =>
            user.id === response.user.id ? mapUser(response.user) : user,
          ),
        }));

        setSession(response.user);

        return { ok: true, message: 'Profil berhasil diperbarui.' };
      } catch (error) {
        return { ok: false, message: describeError(error) };
      }
    },
    [session],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      ...data,
      sessionUser,
      isRestoring,
      isAuthenticating,
      authError,
      login,
      logout,
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
      isRestoring,
      isAuthenticating,
      authError,
      login,
      logout,

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

export const formHelper = {
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

export type { Attendance };
