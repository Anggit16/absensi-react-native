# Laporan Implementasi — AbsensiPro

Aplikasi mobile **Expo + TypeScript** untuk absensi, persetujuan cuti/izin/sakit/resign, dan rekap payroll
multi-perusahaan (demo: satu perusahaan), dengan 3 role: **Owner**, **Admin/HRD**, dan **Karyawan**.
Seluruh data adalah **mock di memori aplikasi**. Tidak ada backend, API eksternal, Supabase, GPS asli,
kamera asli, atau PDF resmi.

- Status akhir: **`tsc --noEmit` bersih**, **`expo export --platform web` sukses**, **`expo-doctor` 20/20**,
  dan **dua suite E2E Playwright lolos** (17 skenario total).
- Semua perubahan belum di-commit (repo git tanpa commit).

---

## 1. Arsitektur

### 1.1 Lapisan

```
App.tsx
  └─ SafeAreaProvider
      └─ AppProvider            ← seluruh state mock, sesi, aturan bisnis, selector
          └─ ToastProvider      ← notifikasi global
              └─ RootNavigator  ← Login (jika belum sesi) atau stack + bottom tabs per role
```

| Lapisan | Isi | Peran |
| --- | --- | --- |
| `theme/` | token warna, spacing, radius, tipografi, shadow | satu sumber gaya (tanpa NativeWind) |
| `types/` | tipe domain (User, Role, Location, Attendance, Submission, LeaveBalance, Payroll…) | kontrak data |
| `constants/` | label Indonesia, warna badge, aturan cuti/payroll, akun demo | teks & kebijakan terpusat |
| `data/seed.ts` | 12 user, 5 role, 3 lokasi, ±30 hari absensi, 10 pengajuan, saldo cuti, kompensasi HRD | data mock deterministik |
| `store/AppProvider.tsx` | `useReducer`-style state + seluruh aksi & selector | **single source of truth** + aturan bisnis |
| `components/` | 22 komponen reusable (common, approval, attendance, dashboard, submissions) | konsistensi UI |
| `navigation/` | `RootNavigator` (native stack), `Tabs` (bottom tabs per role), `types.ts` | navigasi berbasis role |
| `screens/` | 29 layar dibagi `auth/ employee/ hrd/ owner/ shared/` | fitur per role |
| `utils/` | tanggal, format Rupiah, payroll, validasi | fungsi murni & teruji lewat UI |

### 1.2 Keputusan teknis

- **Tanpa Redux/Zustand.** Satu `AppContext` React menampung state + aksi, sesuai batasan PRD.
- **Tanpa Expo Router.** PRD meminta React Navigation; dipakai `@react-navigation/native-stack` +
  `bottom-tabs` agar pemetaan role → tab eksplisit dan type-safe.
- **Tanpa NativeWind.** Tailwind untuk RN (v4) belum terverifikasi stabil pada RN 0.88 / SDK 58, sehingga
  dipakai design system sendiri di `theme/` + `StyleSheet`. Hasilnya nol risiko build dan tetap konsisten
  dengan palet wajib.
- **Navigasi lintas-tab dari stack.** `useAppNavigation()` menerjemahkan `navigate('Payroll')` menjadi
  `navigate('Main', { screen: 'Payroll' })`, sehingga layar stack bisa membuka tab tanpa layar ganda.
- **Simulasi eksplisit.** GPS, selfie, lampiran, dan surat dicap "SIMULASI" di UI agar tidak menyesatkan.

### 1.3 Alur persetujuan dua tahap

```
PENDING_HRD ──(HRD setuju)──> PENDING_OWNER ──(Owner setuju)──> FULLY_APPROVED
     │                              │
     └──(HRD tolak)──> REJECTED <───┘ (Owner tolak)
```

- Hanya **HRD** yang boleh memutus tahap `PENDING_HRD`; hanya **Owner** yang boleh memutus `PENDING_OWNER`
  (dijaga di `decideSubmission`, bukan hanya disembunyikan di UI).
- Pengajuan yang ditolak HRD **tidak muncul** di inbox Owner.
- Kuota cuti tahunan dipotong **sekali**, saat status menjadi `FULLY_APPROVED`, dijaga flag
  `balanceApplied` sehingga klik ganda / re-approve tidak memotong dua kali.
- Surat pengajuan hanya bisa dipratinjau/dicetak setelah `FULLY_APPROVED`; status lain menampilkan
  tombol terkunci + alasan.

---

## 2. Fitur yang benar-benar diimplementasikan

### 2.1 Autentikasi & sesi
- Login email/username + password, validasi field, penolakan akun nonaktif, pesan error jelas.
- Tiga tombol **masuk cepat** untuk akun demo.
- Ganti akun demo tanpa kehilangan data, logout, dan **reset data demo**.
- Sesi menentukan seluruh isi navigasi (tab & stack berbeda per role).

### 2.2 Dashboard per role
- **Owner:** KPI kehadiran hari ini, antrean persetujuan tahap Owner, ringkasan payroll, aksi cepat.
- **HRD:** kehadiran hari ini, antrean tahap HRD, karyawan aktif, pintasan master data.
- **Karyawan:** status absen hari ini, sisa kuota cuti, pengajuan terakhir, aksi cepat absen/pengajuan.

### 2.3 Absensi (simulasi)
- Pilih lokasi kerja, tombol **simulasi GPS** dalam/luar radius geofence, **selfie simulasi**.
- Absen masuk & pulang, status `TEPAT WAKTU` / `TELAT` (berdasarkan jam kerja role), jarak simulasi.
- **Absen ditolak** jika posisi di luar radius (pesan jarak + radius), atau jika hari ini berstatus cuti.
- Riwayat absensi karyawan dengan filter status + ringkasan.

### 2.4 Pengajuan
- Jenis: **cuti tahunan, cuti sakit, izin, cuti tanpa upah, resign**.
- Validasi tanggal (mulai ≤ selesai, tidak di masa lalu untuk jenis tertentu), alasan wajib,
  lampiran surat dokter (simulasi) untuk sakit, validasi sisa kuota untuk cuti tahunan.
- Daftar + filter status, detail dengan timeline persetujuan, pembatalan oleh pemilik selama masih
  `PENDING_HRD`, dan info dampak ke payroll.

### 2.5 Persetujuan
- Inbox per role (HRD: tahap 1; Owner: tahap 2 saja), filter jenis, aksi setuju/tolak + catatan.
- Detail pengajuan menampilkan riwayat approval, kuota sebelum/sesudah, dan preview surat.

### 2.6 Master data (HRD) & manajemen HRD (Owner)
- **Karyawan:** list + pencarian/filter, tambah, ubah, detail, aktif/nonaktif, hapus (dengan konfirmasi).
- **Role & jam kerja:** CRUD role, jam masuk/pulang, toleransi keterlambatan, tarif denda per menit.
- **Lokasi kerja:** CRUD lokasi, koordinat, **radius geofence**, lokasi default.
- **Kuota cuti:** tabel sisa cuti semua karyawan + penyesuaian saldo (dengan alasan).
- **Owner → Manajemen HRD:** CRUD akun HRD (tambah/ubah/nonaktif/hapus) + **komponen gaji**
  (gaji pokok, tunjangan, potongan) dengan pratinjau take-home live.
- **Owner → Pengaturan perusahaan:** nama, alamat, kebijakan cuti/payroll dasar.
- Pembatasan: HRD tidak bisa mengelola akun HRD lain; Owner hanya baca untuk master karyawan/role/lokasi.

### 2.7 Payroll
- Rekap per periode (bulan), filter, total bersih, rincian per karyawan & per HRD.
- Komponen: gaji pokok, tunjangan, potongan izin, potongan cuti tanpa upah, denda keterlambatan.
- Perubahan kompensasi HRD oleh Owner langsung tercermin di payroll (diverifikasi E2E).

### 2.8 Profil & lain-lain
- Profil + edit data pribadi, riwayat absensi, ringkasan kuota, ganti akun, logout.
- Menu per role, toast global, modal konfirmasi, empty state, dan `AccessDenied` untuk rute terlarang.

---

## 3. Struktur file

```
App.tsx                        entry: provider + navigator
app.json                       konfigurasi Expo SDK 58 (splash plugin, scheme absensipro)
package.json                   dependency + script typecheck / export:web
tsconfig.json                  strict, exclude node_modules/dist/.expo
README.md                      panduan jalan + ringkasan fitur
LAPORAN.md                     laporan ini

src/
  components/
    approval/ApprovalTimeline.tsx
    attendance/AttendanceRow.tsx
    dashboard/QuickActions.tsx
    submissions/SubmissionCard.tsx
    common/  AccessDenied, AppText, Avatar, Badge, Button, Card, DateField, Feedback,
             Header, Modal, Screen, SearchField, Section, SegmentedTabs, SelectField,
             StatCard, TextField, Toast
  constants/index.ts           label, badge tone, aturan cuti/payroll, akun demo
  data/seed.ts                 seed deterministik
  navigation/
    RootNavigator.tsx          conditional Login vs stack; semua route
    Tabs.tsx                   OwnerTabs / HrdTabs / EmployeeTabs / RoleTabs
    types.ts                   RootStackParamList, TabParamList, useAppNavigation
  screens/
    auth/LoginScreen.tsx
    employee/  EmployeeDashboardScreen, AttendanceScreen, AttendanceHistoryScreen,
               SubmissionListScreen, SubmissionCreateScreen
    hrd/       HrdDashboardScreen, AttendanceMonitoringScreen, EmployeeListScreen,
               EmployeeFormScreen, EmployeeDetailScreen, RoleListScreen, RoleFormScreen,
               LocationListScreen, LocationFormScreen, LeaveAllocationScreen,
               LeaveAllocationDetailScreen
    owner/     OwnerDashboardScreen, HrdListScreen, HrdFormScreen, HrdDetailScreen,
               HrdCompensationScreen
    shared/    MenuScreen, ProfileScreen, EditProfileScreen, PayrollScreen,
               PayrollDetailScreen, ApprovalInboxScreen, SubmissionDetailScreen,
               PrintPreviewScreen, CompanySettingsScreen
  store/AppProvider.tsx        state + aksi + selector + aturan bisnis
  theme/index.ts               token desain (palet wajib)
  types/index.ts               tipe domain
  utils/  date.ts, format.ts, payroll.ts, validation.ts
```

### 3.1 Palet yang dipakai
| Token | Hex | Pemakaian |
| --- | --- | --- |
| primary | `#0F172A` | header, tombol utama, teks kuat |
| secondary | `#10B981` | sukses, status disetujui, aksen |
| warning | `#F59E0B` | menunggu persetujuan, keterlambatan |
| danger | `#EF4444` | ditolak, validasi, aksi hapus |
| background | `#F8FAFC` | latar semua layar |

---

## 4. Cara menjalankan di Windows

Prasyarat: **Node.js 20+** dan npm.

```powershell
npm.cmd install
npx.cmd expo start
```

Lalu tekan `w` (web), `a` (Android), atau `i` (iOS, hanya macOS).

Alternatif langsung:

```powershell
npx.cmd expo start --web
npx.cmd expo export --platform web --output-dir dist   # build statis
npx.cmd tsc --noEmit                                   # typecheck
npx.cmd expo-doctor                                    # diagnosa dependency
npx.cmd expo install --fix                             # perbaiki versi paket
```

> Di PowerShell yang memblokir `npm.ps1`, **wajib** memakai `npm.cmd` / `npx.cmd` seperti di atas.
> Jika menambah library dengan kode native, gunakan `npx.cmd expo install <paket>` (bukan `npm install`)
> agar versi cocok dengan SDK 58, lalu buat development build (`npx.cmd expo run:android` atau EAS Build).

---

## 5. Akun demo

| Role | Email | Password | Catatan |
| --- | --- | --- | --- |
| Owner | `owner@absensipro.id` | `owner123` | akses penuh, persetujuan final |
| Admin/HRD | `hrd@absensipro.id` | `hrd123` | Sinta Dewi, verifikasi tahap 1 |
| Karyawan | `karyawan@absensipro.id` | `karyawan123` | Andi Pratama, EMP-2023-001, Software Engineer |

Akun HRD lain di seed: Rudi Hartono, Melati Anggraini (nonaktif), plus 7 karyawan aktif — berguna untuk
menguji isolasi data dan payroll.

---

## 6. Hasil pemeriksaan yang benar-benar dijalankan

| Perintah | Hasil |
| --- | --- |
| `npx.cmd tsc --noEmit` | **Lulus, 0 error** (dijalankan ulang setelah perubahan terakhir) |
| `npx.cmd expo export --platform web --output-dir dist --clear` | **Sukses** — `Web Bundled 19585ms index.ts (2606 modules)`, bundle 3.6 MB, 11 aset, output `dist/` |
| `npx.cmd expo-doctor` | **20/20 checks passed** |
| E2E Playwright (web build statis, Chrome) | **11/11 langkah lolos** |
| E2E Playwright suite kedua | **6/6 langkah lolos** |

Catatan: pengujian dilakukan pada **target web** (Expo web/RN Web) karena lingkungan build hanya Windows
tanpa emulator. Kode memakai komponen React Native standar + React Navigation sehingga jalur native
menggunakan pohon komponen yang sama, tetapi **belum diverifikasi di perangkat/emulator fisik**.

### 6.1 Suite E2E #1 — alur utama (11 langkah)
1. Login cepat sebagai Karyawan.
2. Absen masuk (GPS + selfie simulasi).
3. Absen pulang → status & jam tercatat.
4. Ganti ke akun Admin/HRD.
5. HRD menyetujui pengajuan `sub-001` → `PENDING_OWNER`.
6. Ganti ke akun Owner.
7. Owner menyetujui final → `FULLY_APPROVED`.
8. Kuota cuti terpotong **tepat satu kali** (used 4 → 6, remaining 8 → 6).
9. Pratinjau surat terbuka setelah final (sebelumnya terkunci).
10. Owner membuka payroll; angka sesuai kompensasi.
11. Kembali ke Karyawan, logout, lalu login manual dengan kredensial.

Hasil: **0 error console / page error**.

### 6.2 Suite E2E #2 — aturan bisnis (6 langkah)
1. Karyawan membuat pengajuan cuti baru → status `PENDING_HRD`, **surat masih terkunci**.
2. Absensi **ditolak** saat simulasi GPS di luar radius geofence.
3. HRD **menolak** pengajuan cuti tanpa upah (`sub-010`).
4. Inbox Owner **tidak memuat** item yang ditolak HRD.
5. Owner mengubah kompensasi Sinta Dewi (gaji pokok 9.500.000 → 10.000.000; take-home 12.280.000).
6. Payroll menampilkan gaji HRD yang sudah diperbarui.

Hasil: **0 error console**.

---

## 7. Aturan bisnis yang diverifikasi

1. Kuota tahunan berkurang hanya setelah persetujuan final, dan hanya sekali (`balanceApplied`).
2. Penolakan HRD menghentikan alur; item tidak terlihat oleh Owner.
3. Owner tidak bisa memutus tahap HRD, dan HRD tidak bisa memutus tahap Owner (guard di store).
4. Status terminal (`FULLY_APPROVED`, `REJECTED`) tidak bisa diproses ulang.
5. Hanya Owner yang dapat membuat/mengubah akun HRD dan komponen gajinya.
6. Master karyawan/role/lokasi hanya ditulis oleh HRD; Owner baca-saja.
7. Cuti tanpa upah memotong gaji pokok harian; izin memotong komponen; keterlambatan memotong denda/menit.
8. Surat hanya dapat dicetak pada `FULLY_APPROVED`.

---

## 8. Batasan (jujur)

- **Data mock di memori** — restart aplikasi mengembalikan seed awal; tidak ada persistensi.
- **Bukan GPS asli** — koordinat dan jarak disimulasikan; tidak ada permintaan izin lokasi, tidak ada
  deteksi fake-GPS / mock location, tidak ada anti-spoofing.
- **Bukan kamera asli** — selfie hanya status simulasi; tidak ada verifikasi wajah/biometrik.
- **Bukan PDF resmi** — pratinjau surat adalah tampilan HTML/RN, tanpa QR verifikasi, tanda tangan
  digital, atau nomor surat resmi.
- **Password teks biasa** pada data demo; tidak layak produksi.
- **Satu perusahaan** pada data demo (model data sudah menyimpan `companyId` untuk multi-tenant).
- **Belum diuji di perangkat/emulator native**; verifikasi dilakukan pada build web.

---

## 9. Langkah lanjutan backend & native

1. **Backend & database** (mis. PostgreSQL + Prisma): autentikasi JWT + refresh token, RBAC per
   `companyId`, audit log approval.
2. **Penyimpanan berkas**: selfie & surat dokter di object storage dengan signed URL + retensi.
3. **Geofence server-side**: validasi koordinat di server, integrasi `expo-location` + deteksi mock
   location native, kebijakan privasi lokasi, dan fallback saat GPS lemah.
4. **Kamera**: `expo-camera` dengan watermark waktu/lokasi, kompresi, dan unggah antrean offline.
5. **Dokumen resmi**: PDF server-side, QR verifikasi, nomor surat, tanda tangan digital, arsip.
6. **Payroll produksi**: finalisasi periode, payslip terkunci, integrasi transfer bank/pajak/BPJS,
   approval berjenjang untuk payroll.
7. **Notifikasi**: push untuk antrean persetujuan, pengingat absen masuk/pulang.
8. **Kualitas**: unit test aturan bisnis (quota-once, guard role), E2E di device farm, CI lint+typecheck.
9. **Multi-tenant nyata**: isolasi query per `companyId`, seleksi perusahaan saat login, seed per tenant.
