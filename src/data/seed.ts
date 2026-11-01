import type {
  Attendance,
  Company,
  HrdCompensation,
  JobRole,
  LeaveBalance,
  OfficeLocation,
  Submission,
  User,
} from '../types';
import { addDays, nowTime, timeToMinutes, todayISO, toISODate } from '../utils/date';

export interface SeedData {
  company: Company;
  users: User[];
  roles: JobRole[];
  locations: OfficeLocation[];
  attendances: Attendance[];
  leaveBalances: LeaveBalance[];
  submissions: Submission[];
  hrdCompensations: HrdCompensation[];
}

const COMPANY_ID = 'comp-1';

function rand(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

function pick(seed: string, min: number, max: number): number {
  return min + Math.floor(rand(seed) * (max - min + 1));
}

function isoDateTime(daysAgo: number, hour = 9, minute = 0): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

function offsetDateTime(dayOffset: number, minutesAgo = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setMinutes(date.getMinutes() - minutesAgo);
  return date.toISOString();
}

export function createSeedData(): SeedData {
  const today = todayISO();

  const company: Company = {
    id: COMPANY_ID,
    name: 'PT Nusantara Teknologi Global',
    legalName: 'PT Nusantara Teknologi Global',
    industry: 'Teknologi & Konstruksi Digital',
    address: 'Jl. Jend. Sudirman Kav. 52-53, SCBD Lot 9',
    city: 'Jakarta Selatan',
    phone: '021-5150 8899',
    email: 'hrd@nusantaratech.co.id',
    taxId: '01.234.567.8-901.000',
    timezone: 'Asia/Jakarta (WIB)',
    workDaysPerMonth: 22,
    logoInitials: 'NT',
    establishedYear: 2019,
  };

  const locations: OfficeLocation[] = [
    {
      id: 'loc-hq',
      companyId: COMPANY_ID,
      name: 'Kantor Pusat Jakarta',
      type: 'KANTOR',
      address: 'Jl. Jend. Sudirman Kav. 52-53, SCBD Lot 9, Jakarta Selatan',
      latitude: -6.2246,
      longitude: 106.8096,
      radiusMeters: 150,
      status: 'ACTIVE',
    },
    {
      id: 'loc-bsd',
      companyId: COMPANY_ID,
      name: 'Proyek BSD City',
      type: 'PROYEK',
      address: 'BSD Green Office Park, Jl. BSD Grand Boulevard, Tangerang',
      latitude: -6.302,
      longitude: 106.653,
      radiusMeters: 300,
      status: 'ACTIVE',
    },
    {
      id: 'loc-bandung',
      companyId: COMPANY_ID,
      name: 'Cabang Bandung',
      type: 'CABANG',
      address: 'Jl. Asia Afrika No. 8, Braga, Bandung',
      latitude: -6.9216,
      longitude: 107.6071,
      radiusMeters: 200,
      status: 'ACTIVE',
    },
  ];

  const roles: JobRole[] = [
    {
      id: 'role-se',
      companyId: COMPANY_ID,
      name: 'Software Engineer',
      department: 'Technology',
      checkInTime: '08:00',
      checkOutTime: '17:00',
      lateToleranceMinutes: 15,
      salaryBasis: 'BULANAN',
      baseSalary: 8_500_000,
      transportAllowance: 25_000,
      mealAllowance: 20_000,
      latePenaltyPerMinute: 2_000,
      annualLeaveQuota: 12,
      locationId: 'loc-hq',
      status: 'ACTIVE',
      createdAt: isoDateTime(600, 9, 0),
    },
    {
      id: 'role-admin',
      companyId: COMPANY_ID,
      name: 'Staff Administrasi',
      department: 'Operations',
      checkInTime: '08:00',
      checkOutTime: '16:00',
      lateToleranceMinutes: 10,
      salaryBasis: 'BULANAN',
      baseSalary: 5_200_000,
      transportAllowance: 20_000,
      mealAllowance: 15_000,
      latePenaltyPerMinute: 1_000,
      annualLeaveQuota: 12,
      locationId: 'loc-hq',
      status: 'ACTIVE',
      createdAt: isoDateTime(540, 9, 0),
    },
    {
      id: 'role-supervisor',
      companyId: COMPANY_ID,
      name: 'Site Supervisor',
      department: 'Project Delivery',
      checkInTime: '07:00',
      checkOutTime: '16:00',
      lateToleranceMinutes: 10,
      salaryBasis: 'HARIAN',
      baseSalary: 280_000,
      transportAllowance: 30_000,
      mealAllowance: 25_000,
      latePenaltyPerMinute: 1_500,
      annualLeaveQuota: 12,
      locationId: 'loc-bsd',
      status: 'ACTIVE',
      createdAt: isoDateTime(760, 9, 0),
    },
    {
      id: 'role-marketing',
      companyId: COMPANY_ID,
      name: 'Marketing Executive',
      department: 'Marketing',
      checkInTime: '08:30',
      checkOutTime: '17:30',
      lateToleranceMinutes: 15,
      salaryBasis: 'BULANAN',
      baseSalary: 6_800_000,
      transportAllowance: 40_000,
      mealAllowance: 20_000,
      latePenaltyPerMinute: 1_000,
      annualLeaveQuota: 12,
      locationId: 'loc-hq',
      status: 'ACTIVE',
      createdAt: isoDateTime(420, 9, 0),
    },
    {
      id: 'role-support',
      companyId: COMPANY_ID,
      name: 'Customer Support',
      department: 'Operations',
      checkInTime: '09:00',
      checkOutTime: '18:00',
      lateToleranceMinutes: 15,
      salaryBasis: 'BULANAN',
      baseSalary: 4_900_000,
      transportAllowance: 20_000,
      mealAllowance: 15_000,
      latePenaltyPerMinute: 1_000,
      annualLeaveQuota: 12,
      locationId: 'loc-bandung',
      status: 'ACTIVE',
      createdAt: isoDateTime(300, 9, 0),
    },
  ];

  const users: User[] = [
    {
      id: 'u-owner-1',
      companyId: COMPANY_ID,
      name: 'Budi Santoso',
      email: 'owner@absensipro.id',
      username: 'budi.santoso',
      password: 'owner123',
      role: 'OWNER',
      employeeCode: 'OWN-001',
      phone: '0811-2000-100',
      joinDate: '2019-01-05',
      birthDate: '1982-04-11',
      address: 'Jl. Senopati No. 21, Kebayoran Baru, Jakarta Selatan',
      emergencyContact: 'Dewi Santoso — 0812-8899-001',
      employmentType: 'TETAP',
      status: 'ACTIVE',
      isDemoAccount: true,
      notes: 'Pendiri sekaligus pemilik PT Nusantara Teknologi Global.',
    },
    {
      id: 'u-hrd-1',
      companyId: COMPANY_ID,
      name: 'Sinta Dewi',
      email: 'hrd@absensipro.id',
      username: 'sinta.dewi',
      password: 'hrd123',
      role: 'HRD',
      employeeCode: 'HRD-001',
      phone: '0812-3000-200',
      joinDate: '2021-03-01',
      birthDate: '1991-09-23',
      address: 'Jl. Kemang Raya No. 8, Jakarta Selatan',
      emergencyContact: 'Ahmad Dewi — 0813-2211-777',
      employmentType: 'TETAP',
      status: 'ACTIVE',
      isDemoAccount: true,
      notes: 'Penanggung jawab HR & payroll.',
    },
    {
      id: 'u-hrd-2',
      companyId: COMPANY_ID,
      name: 'Rudi Hartono',
      email: 'rudi.hartono@absensipro.id',
      username: 'rudi.hartono',
      password: 'rudi123',
      role: 'HRD',
      employeeCode: 'HRD-002',
      phone: '0812-3000-201',
      joinDate: '2023-08-14',
      employmentType: 'TETAP',
      status: 'ACTIVE',
      notes: 'Fokus rekrutmen dan administrasi karyawan.',
    },
    {
      id: 'u-hrd-3',
      companyId: COMPANY_ID,
      name: 'Melati Anggraini',
      email: 'melati.anggraini@absensipro.id',
      username: 'melati.anggraini',
      password: 'melati123',
      role: 'HRD',
      employeeCode: 'HRD-003',
      phone: '0812-3000-202',
      joinDate: '2024-05-02',
      employmentType: 'KONTRAK',
      status: 'INACTIVE',
      notes: 'Kontrak berakhir, akses dinonaktifkan sementara.',
    },
    {
      id: 'u-emp-1',
      companyId: COMPANY_ID,
      name: 'Andi Pratama',
      email: 'karyawan@absensipro.id',
      username: 'andi.pratama',
      password: 'karyawan123',
      role: 'EMPLOYEE',
      employeeCode: 'EMP-2023-001',
      jobRoleId: 'role-se',
      locationId: 'loc-hq',
      phone: '0813-4000-301',
      joinDate: '2023-02-13',
      birthDate: '1996-06-17',
      address: 'Jl. Tebet Timur Dalam No. 14, Jakarta Selatan',
      emergencyContact: 'Rani Pratama — 0812-7788-331',
      employmentType: 'TETAP',
      status: 'ACTIVE',
      isDemoAccount: true,
    },
    {
      id: 'u-emp-2',
      companyId: COMPANY_ID,
      name: 'Rina Kartika',
      email: 'rina.kartika@absensipro.id',
      username: 'rina.kartika',
      password: 'rina123',
      role: 'EMPLOYEE',
      employeeCode: 'EMP-2023-004',
      jobRoleId: 'role-admin',
      locationId: 'loc-hq',
      phone: '0813-4000-302',
      joinDate: '2023-06-01',
      employmentType: 'TETAP',
      status: 'ACTIVE',
    },
    {
      id: 'u-emp-3',
      companyId: COMPANY_ID,
      name: 'Bayu Nugroho',
      email: 'bayu.nugroho@absensipro.id',
      username: 'bayu.nugroho',
      password: 'bayu123',
      role: 'EMPLOYEE',
      employeeCode: 'EMP-2022-002',
      jobRoleId: 'role-supervisor',
      locationId: 'loc-bsd',
      phone: '0813-4000-303',
      joinDate: '2022-09-05',
      employmentType: 'TETAP',
      status: 'ACTIVE',
    },
    {
      id: 'u-emp-4',
      companyId: COMPANY_ID,
      name: 'Dewi Lestari',
      email: 'dewi.lestari@absensipro.id',
      username: 'dewi.lestari',
      password: 'dewi123',
      role: 'EMPLOYEE',
      employeeCode: 'EMP-2024-011',
      jobRoleId: 'role-marketing',
      locationId: 'loc-hq',
      phone: '0813-4000-304',
      joinDate: '2024-01-08',
      employmentType: 'KONTRAK',
      status: 'ACTIVE',
    },
    {
      id: 'u-emp-5',
      companyId: COMPANY_ID,
      name: 'Fajar Ramadhan',
      email: 'fajar.ramadhan@absensipro.id',
      username: 'fajar.ramadhan',
      password: 'fajar123',
      role: 'EMPLOYEE',
      employeeCode: 'EMP-2024-015',
      jobRoleId: 'role-se',
      locationId: 'loc-hq',
      phone: '0813-4000-305',
      joinDate: '2024-03-18',
      employmentType: 'TETAP',
      status: 'ACTIVE',
    },
    {
      id: 'u-emp-6',
      companyId: COMPANY_ID,
      name: 'Putri Maharani',
      email: 'putri.maharani@absensipro.id',
      username: 'putri.maharani',
      password: 'putri123',
      role: 'EMPLOYEE',
      employeeCode: 'EMP-2024-019',
      jobRoleId: 'role-admin',
      locationId: 'loc-hq',
      phone: '0813-4000-306',
      joinDate: '2024-07-01',
      employmentType: 'KONTRAK',
      status: 'ACTIVE',
    },
    {
      id: 'u-emp-7',
      companyId: COMPANY_ID,
      name: 'Nadia Safira',
      email: 'nadia.safira@absensipro.id',
      username: 'nadia.safira',
      password: 'nadia123',
      role: 'EMPLOYEE',
      employeeCode: 'EMP-2025-022',
      jobRoleId: 'role-marketing',
      locationId: 'loc-bandung',
      phone: '0813-4000-307',
      joinDate: '2025-02-10',
      employmentType: 'TETAP',
      status: 'ACTIVE',
    },
    {
      id: 'u-emp-8',
      companyId: COMPANY_ID,
      name: 'Agus Setiawan',
      email: 'agus.setiawan@absensipro.id',
      username: 'agus.setiawan',
      password: 'agus123',
      role: 'EMPLOYEE',
      employeeCode: 'EMP-2021-008',
      jobRoleId: 'role-supervisor',
      locationId: 'loc-bsd',
      phone: '0813-4000-308',
      joinDate: '2021-11-02',
      employmentType: 'TETAP',
      status: 'INACTIVE',
      notes: 'Kontrak proyek selesai per akhir kuartal.',
    },
  ];

  const hrdCompensations: HrdCompensation[] = [
    {
      userId: 'u-hrd-1',
      baseSalary: 9_500_000,
      positionAllowance: 1_500_000,
      transportAllowance: 600_000,
      mealAllowance: 500_000,
      bpjsDeduction: 320_000,
      updatedAt: isoDateTime(12, 10, 15),
    },
    {
      userId: 'u-hrd-2',
      baseSalary: 6_800_000,
      positionAllowance: 500_000,
      transportAllowance: 450_000,
      mealAllowance: 400_000,
      bpjsDeduction: 210_000,
      updatedAt: isoDateTime(40, 11, 5),
    },
    {
      userId: 'u-hrd-3',
      baseSalary: 6_200_000,
      positionAllowance: 400_000,
      transportAllowance: 450_000,
      mealAllowance: 400_000,
      bpjsDeduction: 190_000,
      updatedAt: isoDateTime(120, 9, 30),
    },
  ];

  const employees = users.filter((user) => user.role === 'EMPLOYEE' && user.status === 'ACTIVE');
  const attendanceList: Attendance[] = [];

  const todaySpecial = new Map<string, 'ON_LEAVE' | 'ABSENT' | 'LATE' | 'ON_TIME'>([
    ['u-emp-2', 'ON_TIME'],
    ['u-emp-3', 'LATE'],
    ['u-emp-4', 'LATE'],
    ['u-emp-5', 'ON_TIME'],
    ['u-emp-6', 'ON_LEAVE'],
    ['u-emp-7', 'ABSENT'],
  ]);

  const currentTime = timeToMinutes(nowTime());

  for (let dayOffset = 34; dayOffset >= 0; dayOffset -= 1) {
    const dateISO = addDays(today, -dayOffset);
    const weekday = new Date(`${dateISO}T00:00:00`).getDay();
    if (weekday === 0 || weekday === 6) continue;

    for (const employee of employees) {
      // Karyawan demo (Andi) sengaja belum memiliki absensi hari ini
      // agar alur simulasi Absen Masuk dapat diuji.
      if (dayOffset === 0 && employee.id === 'u-emp-1') continue;

      const role = roles.find((item) => item.id === employee.jobRoleId);
      const location = locations.find((item) => item.id === employee.locationId) ?? locations[0];
      if (!role) continue;

      const seed = `${employee.id}-${dateISO}`;
      let status: Attendance['status'];

      if (dayOffset === 0) {
        status = todaySpecial.get(employee.id) ?? 'ON_TIME';
      } else {
        const roll = rand(seed);
        if (roll < 0.055) status = 'ABSENT';
        else if (roll < 0.1) status = 'ON_LEAVE';
        else if (roll < 0.28) status = 'LATE';
        else status = 'ON_TIME';
      }

      const baseRecord: Attendance = {
        id: `att-${employee.id}-${dateISO}`,
        companyId: COMPANY_ID,
        userId: employee.id,
        date: dateISO,
        status,
        lateMinutes: 0,
        locationId: location?.id,
        locationName: location?.name,
        latitude: location?.latitude,
        longitude: location?.longitude,
      };

      if (status === 'ABSENT' || status === 'ON_LEAVE') {
        attendanceList.push({
          ...baseRecord,
          note: status === 'ABSENT' ? 'Tidak ada konfirmasi kehadiran sampai batas waktu.' : 'Cuti/izin disetujui (data demo).',
        });
        continue;
      }

      const scheduleIn = timeToMinutes(role.checkInTime);
      let lateMinutes = 0;
      let checkInMinutes: number;

      if (status === 'LATE') {
        lateMinutes = pick(`${seed}-late`, 6, 38);
        checkInMinutes = scheduleIn + role.lateToleranceMinutes + lateMinutes;
      } else {
        checkInMinutes = scheduleIn - pick(`${seed}-early`, 2, 14);
      }

      const checkInAt = `${String(Math.floor(checkInMinutes / 60)).padStart(2, '0')}:${String(checkInMinutes % 60).padStart(2, '0')}`;
      const scheduleOut = timeToMinutes(role.checkOutTime);
      const checkOutMinutes = Math.max(scheduleOut + pick(`${seed}-out`, -8, 24), checkInMinutes + 60);
      const hasCheckedOut = dayOffset > 0 || currentTime > checkOutMinutes + 15;

      const distance = pick(`${seed}-dist`, 8, 120);
      const latitude = (location?.latitude ?? 0) + (rand(`${seed}-lat`) - 0.5) * 0.0008;
      const longitude = (location?.longitude ?? 0) + (rand(`${seed}-lng`) - 0.5) * 0.0008;

      attendanceList.push({
        ...baseRecord,
        status: lateMinutes > 0 ? 'LATE' : 'ON_TIME',
        checkInAt,
        checkOutAt: hasCheckedOut
          ? `${String(Math.floor(checkOutMinutes / 60)).padStart(2, '0')}:${String(checkOutMinutes % 60).padStart(2, '0')}`
          : undefined,
        lateMinutes,
        distanceMeters: distance,
        latitude: Number(latitude.toFixed(6)),
        longitude: Number(longitude.toFixed(6)),
        selfieCaptured: true,
      });
    }
  }

  const currentYear = new Date().getFullYear();
  const balanceSeed: Record<string, { used: number; adjustments: { delta: number; reason: string }[] }> = {
    'u-emp-1': {
      used: 4,
      adjustments: [
        { delta: 2, reason: 'Carry over cuti tahun lalu' },
        { delta: -2, reason: 'Koreksi pencatatan kuota' },
      ],
    },
    'u-emp-2': { used: 2, adjustments: [] },
    'u-emp-3': { used: 5, adjustments: [{ delta: 1, reason: 'Kompensasi lembur proyek' }] },
    'u-emp-4': { used: 3, adjustments: [] },
    'u-emp-5': { used: 1, adjustments: [] },
    'u-emp-6': { used: 0, adjustments: [] },
    'u-emp-7': { used: 6, adjustments: [{ delta: 1, reason: 'Tambahan kuota kontrak' }] },
    'u-emp-8': { used: 0, adjustments: [] },
  };

  const leaveBalances: LeaveBalance[] = employees.map((employee) => {
    const role = roles.find((item) => item.id === employee.jobRoleId);
    const seed = balanceSeed[employee.id] ?? { used: 0, adjustments: [] };
    const netAdjustment = seed.adjustments.reduce((total, item) => total + item.delta, 0);
    return {
      id: `lb-${employee.id}`,
      companyId: COMPANY_ID,
      userId: employee.id,
      year: currentYear,
      totalQuota: (role?.annualLeaveQuota ?? 12) + netAdjustment,
      used: seed.used,
      adjustments: seed.adjustments.map((item, index) => ({
        id: `adj-${employee.id}-${index}`,
        at: isoDateTime(20 + index * 5, 9, 30),
        byName: 'Sinta Dewi',
        delta: item.delta,
        reason: item.reason,
      })),
    };
  });

  // Karyawan nonaktif tetap punya saldo agar data historis konsisten.
  const inactiveBalance: LeaveBalance = {
    id: 'lb-u-emp-8',
    companyId: COMPANY_ID,
    userId: 'u-emp-8',
    year: currentYear,
    totalQuota: 12,
    used: 0,
    adjustments: [],
  };
  if (!leaveBalances.some((balance) => balance.userId === 'u-emp-8')) leaveBalances.push(inactiveBalance);

  const hrdApproval = (note: string, daysAgo: number): Submission['approvals'] => [
    {
      stage: 'HRD',
      actorId: 'u-hrd-1',
      actorName: 'Sinta Dewi',
      actorRole: 'HRD',
      decision: 'APPROVED',
      note,
      decidedAt: isoDateTime(daysAgo, 10, 20),
    },
  ];

  const fullApproval = (hrdNote: string, ownerNote: string, daysAgo: number): Submission['approvals'] => [
    ...hrdApproval(hrdNote, daysAgo + 1),
    {
      stage: 'OWNER',
      actorId: 'u-owner-1',
      actorName: 'Budi Santoso',
      actorRole: 'OWNER',
      decision: 'APPROVED',
      note: ownerNote,
      decidedAt: isoDateTime(daysAgo, 14, 5),
    },
  ];

  const submissions: Submission[] = [
    {
      id: 'sub-001',
      code: 'CUTI-001',
      companyId: COMPANY_ID,
      userId: 'u-emp-1',
      type: 'LEAVE',
      leaveCategory: 'ANNUAL',
      startDate: addDays(today, 7),
      endDate: addDays(today, 8),
      days: 2,
      reason: 'Acara keluarga di luar kota dan perjalanan pulang kampung.',
      createdAt: offsetDateTime(-2, 60 * 5),
      status: 'PENDING_HRD',
      approvals: [],
      balanceApplied: false,
    },
    {
      id: 'sub-002',
      code: 'SAKIT-002',
      companyId: COMPANY_ID,
      userId: 'u-emp-2',
      type: 'SICK',
      startDate: addDays(today, -1),
      endDate: addDays(today, -1),
      days: 1,
      reason: 'Demam dan sakit tenggorokan, dianjurkan istirahat oleh dokter.',
      attachmentName: 'surat-dokter-rina.pdf',
      createdAt: offsetDateTime(-2, 60 * 30),
      status: 'PENDING_OWNER',
      approvals: hrdApproval('Surat dokter lengkap. Disetujui untuk diteruskan ke Owner.', 2),
      balanceApplied: false,
    },
    {
      id: 'sub-003',
      code: 'IZIN-003',
      companyId: COMPANY_ID,
      userId: 'u-emp-4',
      type: 'PERMISSION',
      permissionType: 'Urusan keluarga',
      startDate: addDays(today, -12),
      endDate: addDays(today, -12),
      days: 1,
      reason: 'Mengantar orang tua kontrol rutin ke rumah sakit.',
      createdAt: offsetDateTime(-15, 0),
      status: 'FULLY_APPROVED',
      approvals: fullApproval('Izin wajar, pekerjaan sudah didelegasikan.', 'Disetujui, tetap koordinasi dengan tim marketing.', 12),
      balanceApplied: false,
    },
    {
      id: 'sub-004',
      code: 'CUTI-004',
      companyId: COMPANY_ID,
      userId: 'u-emp-3',
      type: 'LEAVE',
      leaveCategory: 'ANNUAL',
      startDate: addDays(today, 3),
      endDate: addDays(today, 5),
      days: 3,
      reason: 'Liburan keluarga ke Yogyakarta.',
      createdAt: offsetDateTime(-5, 45),
      status: 'REJECTED',
      approvals: [
        {
          stage: 'HRD',
          actorId: 'u-hrd-1',
          actorName: 'Sinta Dewi',
          actorRole: 'HRD',
          decision: 'REJECTED',
          note: 'Bentrok dengan jadwal serah terima proyek BSD. Silakan ajukan ulang setelah tanggal 20.',
          decidedAt: isoDateTime(4, 11, 10),
        },
      ],
      balanceApplied: false,
    },
    {
      id: 'sub-005',
      code: 'RESIGN-005',
      companyId: COMPANY_ID,
      userId: 'u-emp-6',
      type: 'RESIGN',
      startDate: addDays(today, 30),
      endDate: addDays(today, 30),
      days: 1,
      reason: 'Melanjutkan studi magister dan pindah domisili ke Surabaya.',
      resignEffectiveDate: addDays(today, 30),
      createdAt: offsetDateTime(-1, 120),
      status: 'PENDING_HRD',
      approvals: [],
      balanceApplied: false,
    },
    {
      id: 'sub-006',
      code: 'CUTI-006',
      companyId: COMPANY_ID,
      userId: 'u-emp-5',
      type: 'LEAVE',
      leaveCategory: 'ANNUAL',
      startDate: addDays(today, -20),
      endDate: addDays(today, -20),
      days: 1,
      reason: 'Keperluan administrasi rumah.',
      createdAt: offsetDateTime(-25, 0),
      status: 'FULLY_APPROVED',
      approvals: fullApproval('Disetujui, tidak ada agenda rilis.', 'Setuju, pastikan handover selesai.', 21),
      balanceApplied: true,
    },
    {
      id: 'sub-007',
      code: 'CUTI-007',
      companyId: COMPANY_ID,
      userId: 'u-emp-1',
      type: 'LEAVE',
      leaveCategory: 'ANNUAL',
      startDate: addDays(today, -35),
      endDate: addDays(today, -34),
      days: 2,
      reason: 'Menghadiri wisuda saudara di Bandung.',
      createdAt: offsetDateTime(-40, 0),
      status: 'FULLY_APPROVED',
      approvals: fullApproval('Disetujui, sprint sudah selesai.', 'Disetujui.', 36),
      balanceApplied: true,
    },
    {
      id: 'sub-008',
      code: 'CUTI-008',
      companyId: COMPANY_ID,
      userId: 'u-emp-7',
      type: 'LEAVE',
      leaveCategory: 'ANNUAL',
      startDate: addDays(today, 10),
      endDate: addDays(today, 11),
      days: 2,
      reason: 'Menghadiri acara pernikahan keluarga di Bandung.',
      createdAt: offsetDateTime(-3, 200),
      status: 'PENDING_OWNER',
      approvals: hrdApproval('Kuota tersedia (sisa 7 hari). Disetujui untuk approval Owner.', 3),
      balanceApplied: false,
    },
    {
      id: 'sub-009',
      code: 'SAKIT-009',
      companyId: COMPANY_ID,
      userId: 'u-emp-1',
      type: 'SICK',
      startDate: addDays(today, -8),
      endDate: addDays(today, -8),
      days: 1,
      reason: 'Sakit flu dan demam, istirahat sesuai anjuran dokter.',
      attachmentName: 'surat-dokter-andi.pdf',
      createdAt: offsetDateTime(-9, 0),
      status: 'FULLY_APPROVED',
      approvals: fullApproval('Surat dokter valid.', 'Disetujui.', 8),
      balanceApplied: false,
    },
    {
      id: 'sub-010',
      code: 'CUTI-010',
      companyId: COMPANY_ID,
      userId: 'u-emp-4',
      type: 'LEAVE',
      leaveCategory: 'UNPAID',
      startDate: addDays(today, 14),
      endDate: addDays(today, 16),
      days: 3,
      reason: 'Keperluan pribadi yang tidak bisa ditunda.',
      createdAt: offsetDateTime(-1, 20),
      status: 'PENDING_HRD',
      approvals: [],
      balanceApplied: false,
    },
  ];

  const orderedAttendance = attendanceList.sort((a, b) => b.date.localeCompare(a.date));

  return {
    company,
    users,
    roles,
    locations,
    attendances: orderedAttendance,
    leaveBalances,
    submissions,
    hrdCompensations,
  };
}

export function seedTodayISO(): string {
  return toISODate(new Date());
}
